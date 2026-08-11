import { AuditLog } from '../audit/audit.entity';

/**
 * Generate synthetic audit events for anomaly-detection testing.
 * Does not require a real database; returns plain objects that can be persisted
 * by a caller if needed.
 */
export interface SyntheticAuditOptions {
  tenderCount?: number;
  supplierCount?: number;
  bidsPerTender?: number;
  includeAnomalies?: boolean;
  baseTime?: Date;
}

function uuid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function offsetMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

function offsetSeconds(base: Date, seconds: number) {
  return new Date(base.getTime() + seconds * 1000);
}

export function generateSyntheticAuditEvents(opts: SyntheticAuditOptions = {}): Partial<AuditLog>[] {
  const {
    tenderCount = 3,
    supplierCount = 5,
    bidsPerTender = 4,
    includeAnomalies = true,
    // Fixed business-hours baseline keeps deterministic unit tests independent of wall-clock time.
    baseTime = new Date('2025-01-01T08:00:00.000Z'),
  } = opts;

  const events: Partial<AuditLog>[] = [];
  const suppliers = Array.from({ length: supplierCount }, (_, i) => `supplier-${i + 1}`);
  const pmuId = 'pmu-officer-1';
  const prazId = 'praz-regulator-1';

  let minute = 0;

  for (let t = 0; t < tenderCount; t++) {
    const tenderId = uuid('tender');
    const tenderPayload = { title: `Synthetic Tender ${t + 1}`, budget: 1_000_000 * (t + 1), status: 'Published' };

    // Create tender
    events.push({
      actorId: pmuId,
      actorRole: 'PMU_Officer',
      actionType: 'CREATE_TENDER',
      targetType: 'Tender',
      targetId: tenderId,
      payload: tenderPayload,
      timestamp: offsetMinutes(baseTime, minute++),
    });

    events.push({
      actorId: pmuId,
      actorRole: 'PMU_Officer',
      actionType: 'PUBLISH_TENDER',
      targetType: 'Tender',
      targetId: tenderId,
      payload: { status: 'Published' },
      timestamp: offsetMinutes(baseTime, minute++),
    });

    // Bids from suppliers
    const tenderSuppliers = suppliers.slice(0, bidsPerTender);
    const bidIds: string[] = [];

    for (const supplierId of tenderSuppliers) {
      const bidId = uuid('bid');
      bidIds.push(bidId);

      // Normal create -> seal flow
      const createdAt = offsetMinutes(baseTime, minute++);
      events.push({
        actorId: supplierId,
        actorRole: 'Supplier',
        actionType: 'CREATE_BID',
        targetType: 'Bid',
        targetId: bidId,
        payload: { tenderId, status: 'Draft' },
        timestamp: createdAt,
      });

      // Normal sealing: 2 minutes later (> 60s rapid-sealing threshold).
      // Anomalous rapid sealing: first supplier on first tender sealed 30s after creation.
      const rapidSeal = includeAnomalies && supplierId === suppliers[0] && t === 0;
      const sealedAt = rapidSeal
        ? offsetSeconds(createdAt, 30)
        : offsetMinutes(baseTime, minute + 2);
      events.push({
        actorId: supplierId,
        actorRole: 'Supplier',
        actionType: 'SEAL_BID',
        targetType: 'Bid',
        targetId: bidId,
        payload: { tenderId, status: 'Sealed' },
        timestamp: sealedAt,
      });

      // Abnormal: repeated bid creation from one supplier on last tender
      if (includeAnomalies && t === tenderCount - 1 && supplierId === suppliers[1]) {
        for (let r = 0; r < 6; r++) {
          const repeatedBidId = uuid('bid');
          events.push({
            actorId: supplierId,
            actorRole: 'Supplier',
            actionType: 'CREATE_BID',
            targetType: 'Bid',
            targetId: repeatedBidId,
            payload: { tenderId, status: 'Draft' },
            timestamp: offsetMinutes(baseTime, minute + 5 + r),
          });
        }
      }

      minute += 5;
    }

    // Evaluation and award after deadline
    const awardedBidId = bidIds[0];
    events.push({
      actorId: pmuId,
      actorRole: 'PMU_Officer',
      actionType: 'REVIEW_TENDER',
      targetType: 'Tender',
      targetId: tenderId,
      payload: { sealedBidCount: bidIds.length },
      timestamp: offsetMinutes(baseTime, minute++),
    });

    events.push({
      actorId: pmuId,
      actorRole: 'PMU_Officer',
      actionType: 'AWARD_TENDER',
      targetType: 'Tender',
      targetId: tenderId,
      payload: { awardedBidId, awardDecisionNote: 'Lowest compliant bid selected (synthetic).' },
      timestamp: offsetMinutes(baseTime, minute++),
    });

    // One tender only has one sealed bid (single-bidder award anomaly)
    if (includeAnomalies && t === 1) {
      // Remove all but first supplier's bids from the synthetic event stream so the
      // single-bidder detector sees only one SEAL_BID for this tender.
      const removable = events.filter(
        (e) => e.targetType === 'Bid' && e.payload?.tenderId === tenderId && e.actorId !== suppliers[0],
      );
      for (const r of removable) {
        const idx = events.indexOf(r);
        if (idx !== -1) events.splice(idx, 1);
      }
    }

    // Off-hours PMU access anomaly
    if (includeAnomalies && t === 0) {
      const offHours = new Date(baseTime.getTime());
      offHours.setUTCHours(3, 0, 0, 0);
      events.push({
        actorId: pmuId,
        actorRole: 'PMU_Officer',
        actionType: 'VIEW_BID',
        targetType: 'Bid',
        targetId: bidIds[0],
        payload: { status: 'Sealed' },
        timestamp: offHours,
      });
    }
  }

  return events.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
}
