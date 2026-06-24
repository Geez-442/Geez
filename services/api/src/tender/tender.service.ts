import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tender, TenderStatus } from './tender.entity';
import { AuditLog } from '../audit/audit.entity';

@Injectable()
export class TenderService {
  constructor(
    @InjectRepository(Tender) private tenderRepo: Repository<Tender>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async create(data: Partial<Tender>, actorId: string, actorRole: string) {
    const t = this.tenderRepo.create(data as Tender);
    const saved = await this.tenderRepo.save(t);
    await this.auditRepo.save({ actorId, actorRole, actionType: 'CREATE_TENDER', targetType: 'Tender', targetId: saved.id, payload: data });
    return saved;
  }

  async findAll(filters?: any) {
    const qb = this.tenderRepo.createQueryBuilder('t');
    if (filters?.status) qb.andWhere('t.status = :status', { status: filters.status });
    if (filters?.tenderType) qb.andWhere('t.tenderType = :type', { type: filters.tenderType });
    if (filters?.before) qb.andWhere('t.deadline <= :before', { before: filters.before });
    return qb.getMany();
  }

  async findOne(id: string) {
    return this.tenderRepo.findOne({ where: { id } });
  }

  async publish(id: string, actorId: string, actorRole: string) {
    const tender = await this.findOne(id);
    if (!tender) throw new Error('Tender not found');
    if (tender.status !== TenderStatus.Draft) throw new Error('Only Draft tenders can be published');
    tender.status = TenderStatus.Published;
    tender.publishedBy = actorId;
    const saved = await this.tenderRepo.save(tender);
    await this.auditRepo.save({ actorId, actorRole, actionType: 'PUBLISH_TENDER', targetType: 'Tender', targetId: saved.id, payload: { status: saved.status } });
    return saved;
  }
}
