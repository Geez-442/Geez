import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AuditLog } from '../audit/audit.entity';
import { AnomalyFlag, AnomalySeverity } from './anomaly-flag.entity';

export interface AnomalyRuleResult {
  type: string;
  description: string;
  severity: AnomalySeverity;
  targetType: string | null;
  targetId: string | null;
  actorId: string | null;
  evidence: any;
}

/**
 * Rule-based anomaly detection for procurement oversight.
 *
 * The service reads AuditLog metadata (not sealed-bid contents) and flags patterns
 * that may indicate collusion, favouritism, or abuse. All flags are advisory and
 * require human investigation.
 */
@Injectable()
export class AnomalyService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(AnomalyFlag) private flagRepo: Repository<AnomalyFlag>,
  ) {}

  /**
   * Scan audit events within a given window and return flagged anomalies.
   * Optionally persists flags with a scanRunId.
   */
  async scan(
    actorId: string,
    actorRole: string,
    windowHours = 24,
    persist = true,
  ): Promise<{ scanRunId: string; flags: AnomalyFlag[] }> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const events = await this.auditRepo.find({
      where: { timestamp: MoreThan(since) },
      order: { timestamp: 'ASC' },
    });

    const scanRunId = `scan-${Date.now()}`;
    const results: AnomalyRuleResult[] = [];

    results.push(...this.detectRepeatedBidCreations(events));
    results.push(...this.detectOffHoursOfficialAccess(events));
    results.push(...this.detectSingleBidderAwards(events));
    results.push(...this.detectRapidBidSealing(events));

    let flags: AnomalyFlag[] = [];

    if (persist) {
      const entities = results.map((r) =>
        this.flagRepo.create({
          ...r,
          scanRunId,
        }),
      );
      flags = await this.flagRepo.save(entities);
    } else {
      flags = results.map((r) =>
        this.flagRepo.create({
          ...r,
          scanRunId,
        }),
      );
    }

    // Audit the scan itself
    await this.auditRepo.save({
      actorId,
      actorRole,
      actionType: 'ANOMALY_SCAN',
      targetType: 'AnomalyFlag',
      targetId: scanRunId,
      payload: { windowHours, flagCount: flags.length },
    });

    return { scanRunId, flags };
  }

  /**
   * Flag a supplier creating many bids on the same tender in a short window —
   * possible abuse or test manipulation.
   */
  private detectRepeatedBidCreations(events: AuditLog[]): AnomalyRuleResult[] {
    const counts: Record<string, { tenderId: string; actorId: string; timestamps: Date[] }> = {};
    for (const e of events) {
      if (e.actionType !== 'CREATE_BID' || !e.payload?.tenderId) continue;
      const key = `${e.actorId}:${e.payload.tenderId}`;
      if (!counts[key]) counts[key] = { tenderId: e.payload.tenderId, actorId: e.actorId, timestamps: [] };
      counts[key].timestamps.push(e.timestamp);
    }

    const flags: AnomalyRuleResult[] = [];
    for (const [key, data] of Object.entries(counts)) {
      if (data.timestamps.length >= 5) {
        flags.push({
          type: 'REPEATED_BID_CREATIONS',
          description: `Supplier ${data.actorId} created ${data.timestamps.length} bids on tender ${data.tenderId} within the scan window.`,
          severity: AnomalySeverity.Medium,
          targetType: 'Bid',
          targetId: data.tenderId,
          actorId: data.actorId,
          evidence: { bidCount: data.timestamps.length, timestamps: data.timestamps },
        });
      }
    }
    return flags;
  }

  /**
   * Flag PMU/PRAZ access outside normal Zimbabwe business hours (08:00–17:00).
   */
  private detectOffHoursOfficialAccess(events: AuditLog[]): AnomalyRuleResult[] {
    const flagged: AnomalyRuleResult[] = [];
    const seen = new Set<string>();

    for (const e of events) {
      if (e.actorRole !== 'PMU_Officer' && e.actorRole !== 'PRAZ_Regulator') continue;
      const hour = e.timestamp.getUTCHours(); // Audit timestamps stored as UTC
      // 08:00–17:00 Zimbabwe local is roughly 06:00–15:00 UTC (varies by DST)
      const isBusinessHours = hour >= 6 && hour <= 15;
      if (isBusinessHours) continue;

      const key = `${e.actorId}:${hour}`;
      if (seen.has(key)) continue;
      seen.add(key);

      flagged.push({
        type: 'OFF_HOURS_OFFICIAL_ACCESS',
        description: `Official ${e.actorRole} ${e.actorId} accessed system at ${e.timestamp.toISOString()} outside regular business hours.`,
        severity: AnomalySeverity.Low,
        targetType: e.targetType,
        targetId: e.targetId,
        actorId: e.actorId,
        evidence: { actionType: e.actionType, timestamp: e.timestamp },
      });
    }

    return flagged;
  }

  /**
   * Flag tenders that are awarded when only one sealed bid was submitted —
   * a potential indicator of restricted competition/favouritism.
   */
  private detectSingleBidderAwards(events: AuditLog[]): AnomalyRuleResult[] {
    const tenderSealedBids: Record<string, Set<string>> = {};
    const awardEvents: AuditLog[] = [];

    for (const e of events) {
      if (e.actionType === 'SEAL_BID' && e.payload?.tenderId) {
        const tenderId = e.payload.tenderId as string;
        if (!tenderSealedBids[tenderId]) tenderSealedBids[tenderId] = new Set();
        tenderSealedBids[tenderId].add(e.actorId);
      }
      if (e.actionType === 'AWARD_TENDER') {
        awardEvents.push(e);
      }
    }

    const flagged: AnomalyRuleResult[] = [];
    for (const award of awardEvents) {
      const tenderId = award.targetId;
      const supplierIds = tenderId ? tenderSealedBids[tenderId] || new Set() : new Set();
      if (supplierIds.size === 1) {
        const [supplierId] = Array.from(supplierIds);
        flagged.push({
          type: 'SINGLE_BIDDER_AWARD',
          description: `Tender ${tenderId} was awarded with only one sealed bid (supplier ${supplierId}).`,
          severity: AnomalySeverity.High,
          targetType: 'Tender',
          targetId: tenderId,
          actorId: award.actorId,
          evidence: { awardedBidId: award.payload?.awardedBidId, supplierId, sealedBidCount: 1 },
        });
      }
    }

    return flagged;
  }

  /**
   * Flag bids that are sealed within seconds of creation — possible pre-arrangement.
   */
  private detectRapidBidSealing(events: AuditLog[]): AnomalyRuleResult[] {
    const createTimes: Record<string, Date> = {};
    const flagged: AnomalyRuleResult[] = [];

    for (const e of events) {
      if (e.actionType === 'CREATE_BID' && e.targetId) {
        createTimes[e.targetId] = e.timestamp;
      }
      if (e.actionType === 'SEAL_BID' && e.targetId && createTimes[e.targetId]) {
        const deltaMs = e.timestamp.getTime() - createTimes[e.targetId].getTime();
        if (deltaMs < 60_000) {
          flagged.push({
            type: 'RAPID_BID_SEALING',
            description: `Bid ${e.targetId} was sealed within ${Math.round(deltaMs / 1000)}s of creation.`,
            severity: AnomalySeverity.Medium,
            targetType: 'Bid',
            targetId: e.targetId,
            actorId: e.actorId,
            evidence: { createdAt: createTimes[e.targetId], sealedAt: e.timestamp, deltaMs },
          });
        }
      }
    }

    return flagged;
  }

  /**
   * List persisted anomaly flags, newest first.
   */
  async listFlags(limit = 50, reviewed?: boolean) {
    const qb = this.flagRepo.createQueryBuilder('flag').orderBy('flag.createdAt', 'DESC').take(Math.min(limit, 500));
    if (reviewed !== undefined) qb.andWhere('flag.reviewed = :reviewed', { reviewed });
    return qb.getMany();
  }

  async markReviewed(flagId: string, reviewerId: string, reviewerRole: string) {
    const flag = await this.flagRepo.findOne({ where: { id: flagId } });
    if (!flag) throw new Error('Flag not found');
    flag.reviewed = true;
    const saved = await this.flagRepo.save(flag);

    await this.auditRepo.save({
      actorId: reviewerId,
      actorRole: reviewerRole,
      actionType: 'REVIEW_ANOMALY_FLAG',
      targetType: 'AnomalyFlag',
      targetId: flagId,
      payload: { type: flag.type, severity: flag.severity },
    });

    return saved;
  }
}
