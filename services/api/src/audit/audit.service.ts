import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>) {}

  async listLogs(limit = 20, targetType?: string, targetId?: string) {
    const qb = this.auditRepo
      .createQueryBuilder('audit')
      .orderBy('audit.timestamp', 'DESC')
      .take(Math.min(limit, 100));

    if (targetType) qb.andWhere('audit.targetType = :targetType', { targetType });
    if (targetId) qb.andWhere('audit.targetId = :targetId', { targetId });

    const entries = await qb.getMany();

    // Strip any accidental sensitive fields from payloads for list views
    const sanitized = entries.map((e) => ({
      id: e.id,
      actorId: e.actorId,
      actorRole: e.actorRole,
      actionType: e.actionType,
      targetType: e.targetType,
      targetId: e.targetId,
      timestamp: e.timestamp,
      hash: e.hash,
      payload: this.sanitizePayload(e.payload),
    }));

    return { entries: sanitized, count: sanitized.length };
  }

  private sanitizePayload(payload: any) {
    if (!payload || typeof payload !== 'object') return payload;
    const clone = { ...payload };
    delete clone.amount;
    delete clone.encryptedAmount;
    delete clone.decryptedAmount;
    return clone;
  }
}
