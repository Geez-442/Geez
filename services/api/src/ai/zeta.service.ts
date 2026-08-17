import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZetaInteraction } from './zeta.entity';
import { ZETA_KNOWLEDGE_BASE } from './knowledge-base';
import { Role } from '../auth.stub';
import { AuditLog } from '../audit/audit.entity';
import { computeChainHash } from '../crypto/hash-chain';
import { composeAnswerWithLangChain } from './zeta.langchain';
import { guardInput, guardOutput, getRefusalMessage } from './prompt-guard';

export interface ZetaQuery {
  role: Role;
  actorId: string;
  query: string;
}

export interface ZetaResponse {
  role: Role;
  query: string;
  answer: string;
  sources: string[];
  matchedEntryIds: string[];
  insufficientData: boolean;
  advisory: true;
  blocked?: boolean;
  guardFlags?: string[];
}

/**
 * ZETA (Zimbabwe E-Tender Assistant) service.
 *
 * Design constraints (Sprint 4):
 * - Advisory-only: never accesses sealed bid amounts, documents, or evaluation scores.
 * - Grounded: replies are based on the static knowledge base + audit-log metadata only.
 * - Auditable: every interaction is persisted and chained into the audit log.
 * - Safe default: when no relevant match exists, respond INSUFFICIENT_DATA — ESCALATE TO HUMAN.
 */
@Injectable()
export class ZetaService {
  constructor(
    @InjectRepository(ZetaInteraction) private interactionRepo: Repository<ZetaInteraction>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  private async appendAudit(actorId: string, actorRole: string, actionType: string, targetId: string, payload: any) {
    const previous = await this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.targetType = :type AND audit.targetId = :id', { type: 'ZetaInteraction', id: targetId })
      .orderBy('audit.timestamp', 'DESC')
      .limit(1)
      .getOne();
    const hash = computeChainHash(previous?.hash || '', `${actionType}:${targetId}:${actorId}:${JSON.stringify(payload)}`);
    await this.auditRepo.save({
      actorId,
      actorRole,
      actionType,
      targetType: 'ZetaInteraction',
      targetId,
      payload,
      hash,
    });
  }

  private STOPWORDS = new Set([
    'the', 'is', 'what', 'today', 'how', 'do', 'does', 'i', 'you', 'me', 'a', 'an', 'for', 'on', 'in', 'of', 'and', 'or', 'to', 'from', 'with', 'by', 'about', 'like', 'this', 'that', 'it', 'if', 'can', 'tell', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'will', 'shall', 'should', 'would', 'could', 'may', 'might', 'must', 'need', 'want', 'who', 'when', 'where', 'why', 'which',
  ]);

  /**
   * Domain words that appear in nearly every knowledge entry. Matching on these
   * alone is not evidence of relevance, so they score nothing on their own.
   */
  private LOW_SIGNAL_WORDS = new Set([
    'procurement', 'tender', 'tenders', 'bid', 'bids', 'praz', 'zets', 'zeta', 'system',
    'portal', 'public', 'supplier', 'suppliers', 'process', 'information', 'act',
  ]);

  /** Only the most relevant entries are used, to keep answers focused. */
  private MAX_MATCHES = 3;

  /** Escape a string for safe use inside a RegExp. */
  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Test whether the query contains a keyword, respecting word boundaries.
   * Without this, the single-word keyword "form" would match inside
   * "information", producing confidently irrelevant answers.
   */
  private queryContainsKeyword(lowerQuery: string, keyword: string): boolean {
    const pattern = new RegExp(`(^|\\W)${this.escapeRegex(keyword)}(\\W|$)`, 'i');
    return pattern.test(lowerQuery);
  }

  /**
   * Score knowledge entries against the query and return the most relevant ones
   * the caller's role is permitted to see.
   *
   * Weighting, highest first:
   *  - a full keyword phrase appearing in the query (strongest intent signal)
   *  - a distinctive query word appearing in the entry's keyword list
   *  - a distinctive query word appearing in the entry title
   *  - a distinctive query word appearing in the entry body (weakest)
   *
   * Ubiquitous domain words are ignored so that, for example, asking about
   * "procurement thresholds" does not match every entry containing the word
   * "procurement". Entries scoring below a floor are dropped entirely, which is
   * what lets the INSUFFICIENT_DATA escalation path stay meaningful.
   */
  private findMatches(role: Role, query: string): typeof ZETA_KNOWLEDGE_BASE {
    const lowerQuery = query.toLowerCase();
    const userWords = lowerQuery
      .split(/\W+/)
      .filter((w) => w.length > 2 && !this.STOPWORDS.has(w));

    // Distinctive words carry the relevance signal; low-signal words are kept
    // only as a weak tie-breaker.
    const strongWords = userWords.filter((w) => !this.LOW_SIGNAL_WORDS.has(w));

    const scored = ZETA_KNOWLEDGE_BASE.filter((entry) => entry.roles.includes(role)).map((entry) => {
      const title = entry.title.toLowerCase();
      const content = entry.content.toLowerCase();
      const keywords = entry.keywords.map((k) => k.toLowerCase());
      let score = 0;

      // Strongest: the user's text contains one of the entry's keyword phrases.
      for (const keyword of keywords) {
        if (this.queryContainsKeyword(lowerQuery, keyword)) {
          // Multi-word phrases are a much stronger signal than single words.
          score += keyword.includes(' ') ? 12 : 6;
        }
      }

      for (const word of strongWords) {
        // Keyword lists may hold phrases, so a partial hit there is meaningful
        // ("publish" legitimately matching the keyword "publish tender").
        if (keywords.some((k) => k.includes(word))) score += 4;
        // Prose is matched on whole words only, to avoid spurious hits.
        if (this.queryContainsKeyword(title, word)) score += 3;
        if (this.queryContainsKeyword(content, word)) score += 1;
      }

      return { entry, score };
    });

    // Require a real signal, not an incidental single body-text hit.
    const relevant = scored.filter((s) => s.score >= 3).sort((a, b) => b.score - a.score);

    return relevant.slice(0, this.MAX_MATCHES).map((s) => s.entry);
  }

  /**
   * Return a deterministic, grounded advisory response for a given role and query.
   */
  async ask({ role, actorId, query }: ZetaQuery): Promise<ZetaResponse> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }
    if (!Object.values(Role).includes(role)) {
      throw new ForbiddenException('Invalid role');
    }

    // Input guard: refuse prompt-injection / corruption-facilitation attempts
    // before the query ever reaches the knowledge-base matcher or the LLM.
    const inputCheck = guardInput(query);
    if (!inputCheck.safe) {
      const refusal = getRefusalMessage();

      const blockedInteraction = await this.interactionRepo.save({
        actorId,
        actorRole: role,
        query,
        response: refusal,
        sources: [],
        matchedEntryIds: [],
        insufficientData: false,
        blocked: true,
        guardFlags: inputCheck.reasons,
        metadata: { guardStage: 'input' },
      });

      await this.appendAudit(actorId, role, 'ZETA_GUARD_BLOCKED_INPUT', blockedInteraction.id, {
        reasons: inputCheck.reasons,
      });

      return {
        role,
        query,
        answer: refusal,
        sources: [],
        matchedEntryIds: [],
        insufficientData: false,
        advisory: true,
        blocked: true,
        guardFlags: inputCheck.reasons,
      };
    }

    const matches = this.findMatches(role, query);
    const insufficientData = matches.length === 0;

    let fallbackAnswer: string;
    let sources: string[] = [];
    let matchedEntryIds: string[] = matches.map((m) => m.id);

    if (insufficientData) {
      fallbackAnswer = 'INSUFFICIENT DATA — ESCALATE TO HUMAN. ZETA could not find a relevant, role-appropriate guidance entry for your query. Please contact the procurement helpdesk or your PMU officer.';
    } else {
      // Compose a concise answer from matched entries, deduplicating sources.
      const paragraphs = matches.map((m) => `${m.title}\n${m.content}`);
      sources = Array.from(new Set(matches.flatMap((m) => m.sources)));
      fallbackAnswer = `${paragraphs.join('\n\n')}\n\nDISCLAIMER: This guidance is advisory only and does not replace the PPDPA Act, PRAZ regulations, or professional legal advice.`;
    }

    // Route the grounded answer through the LangChain prompt/template pipeline.
    let answer = await composeAnswerWithLangChain(role, query, matches, fallbackAnswer);

    // Output guard: scan whatever the model produced for signs a guard rail was
    // bypassed (leaked secrets/config, or apparent compliance with a request the
    // system prompt should have refused). If flagged, fall back to the safe,
    // deterministic template rather than returning the model's text.
    const outputCheck = guardOutput(answer);
    const guardFlags = outputCheck.safe ? undefined : outputCheck.reasons;
    if (!outputCheck.safe) {
      answer = fallbackAnswer;
    }

    const interaction = await this.interactionRepo.save({
      actorId,
      actorRole: role,
      query,
      response: answer,
      sources,
      matchedEntryIds,
      insufficientData,
      blocked: false,
      guardFlags: guardFlags || null,
      metadata: { matchedCount: matches.length },
    });

    await this.appendAudit(actorId, role, outputCheck.safe ? 'ZETA_ADVICE' : 'ZETA_GUARD_REDACTED_OUTPUT', interaction.id, {
      insufficientData,
      matchedEntryIds,
      queryLength: query.length,
      guardFlags,
    });

    return {
      role,
      query,
      answer,
      sources,
      matchedEntryIds,
      insufficientData,
      advisory: true,
      ...(guardFlags ? { guardFlags } : {}),
    };
  }

  /**
   * Summarise audit-log metadata for PRAZ oversight. Does NOT access encrypted bid contents.
   */
  async auditSummary(actorId: string, actorRole: Role, limit = 100): Promise<any> {
    if (actorRole !== Role.PRAZ_Regulator && actorRole !== Role.PMU_Officer) {
      throw new ForbiddenException('Only PRAZ/PMU can request audit summaries');
    }

    const entries = await this.auditRepo.find({
      order: { timestamp: 'DESC' },
      take: Math.min(limit, 500),
    });

    const summary = {
      totalEvents: entries.length,
      actionCounts: {} as Record<string, number>,
      roleCounts: {} as Record<string, number>,
      latestEventAt: entries.length > 0 ? entries[0].timestamp : null,
    };

    for (const e of entries) {
      summary.actionCounts[e.actionType] = (summary.actionCounts[e.actionType] || 0) + 1;
      summary.roleCounts[e.actorRole] = (summary.roleCounts[e.actorRole] || 0) + 1;
    }

    await this.appendAudit(actorId, actorRole, 'ZETA_AUDIT_SUMMARY', `summary-${Date.now()}`, {
      totalEvents: summary.totalEvents,
    });

    return {
      advisory: true,
      summary,
    };
  }

  /**
   * List ZETA interactions that were blocked or redacted by the guard rails.
   * Intended for periodic PRAZ/researcher review of false positives/negatives
   * and for spotting systematic patterns (a lightweight bias-audit log).
   * Never includes interactions that passed both guards cleanly.
   */
  async listGuardFlags(actorRole: Role, limit = 50) {
    if (actorRole !== Role.PRAZ_Regulator && actorRole !== Role.PMU_Officer) {
      throw new ForbiddenException('Only PRAZ/PMU can review ZETA guard flags');
    }

    const flagged = await this.interactionRepo
      .createQueryBuilder('interaction')
      .where('interaction.blocked = true OR interaction.guardFlags IS NOT NULL')
      .orderBy('interaction.createdAt', 'DESC')
      .take(Math.min(limit, 200))
      .getMany();

    return {
      advisory: true,
      count: flagged.length,
      flags: flagged.map((f) => ({
        id: f.id,
        actorRole: f.actorRole,
        query: f.query,
        blocked: f.blocked,
        guardFlags: f.guardFlags,
        createdAt: f.createdAt,
      })),
    };
  }
}
