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
   * Find knowledge entries matching the user's role and query keywords.
   */
  private findMatches(role: Role, query: string): typeof ZETA_KNOWLEDGE_BASE {
    const lowerQuery = query.toLowerCase();
    const userWords = lowerQuery
      .split(/\W+/)
      .filter((w) => w.length > 2 && !this.STOPWORDS.has(w));

    return ZETA_KNOWLEDGE_BASE.filter((entry) => {
      if (!entry.roles.includes(role)) return false;
      const haystack = `${entry.title.toLowerCase()} ${entry.content.toLowerCase()}`;
      const keywordHaystack = entry.keywords.join(' ').toLowerCase();

      // Direct keyword match carries highest weight
      const keywordMatch = entry.keywords.some((k) => lowerQuery.includes(k.toLowerCase()));
      if (keywordMatch) return true;

      // Content match only on non-stopword tokens
      return userWords.length > 0 && userWords.some((word) => haystack.includes(word) || keywordHaystack.includes(word));
    });
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
