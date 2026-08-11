import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tender, TenderStatus } from '../tender/tender.entity';
import { AnomalyFlag } from '../anomaly/anomaly-flag.entity';

export interface PublicTenderView {
  id: string;
  title: string;
  description: string | null;
  tenderType: string;
  procuringEntity: string;
  deadline: Date | null;
  currency: string;
  budget: number | null;
  status: string;
}

export interface PublicAwardView {
  id: string;
  title: string;
  tenderType: string;
  procuringEntity: string;
  awardedAt: Date | null;
  awardDecisionNote: string | null;
  currency: string;
  budget: number | null;
}

export interface PublicStats {
  tenders: {
    published: number;
    awarded: number;
  };
  anomalies: {
    totalFlags: number;
    unreviewed: number;
    bySeverity: Record<string, number>;
  };
}

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Tender) private tenderRepo: Repository<Tender>,
    @InjectRepository(AnomalyFlag) private flagRepo: Repository<AnomalyFlag>,
  ) {}

  async publishedTenders(): Promise<PublicTenderView[]> {
    return this.tenderRepo.find({
      where: { status: TenderStatus.Published },
      order: { deadline: 'ASC' },
      select: [
        'id',
        'title',
        'description',
        'tenderType',
        'procuringEntity',
        'deadline',
        'currency',
        'budget',
        'status',
      ],
    });
  }

  async awardedTenders(): Promise<PublicAwardView[]> {
    return this.tenderRepo.find({
      where: { status: TenderStatus.Awarded },
      order: { awardedAt: 'DESC' },
      select: [
        'id',
        'title',
        'tenderType',
        'procuringEntity',
        'awardedAt',
        'awardDecisionNote',
        'currency',
        'budget',
      ],
    });
  }

  async stats(): Promise<PublicStats> {
    const [published, awarded] = await Promise.all([
      this.tenderRepo.count({ where: { status: TenderStatus.Published } }),
      this.tenderRepo.count({ where: { status: TenderStatus.Awarded } }),
    ]);

    const [totalFlags, unreviewed] = await Promise.all([
      this.flagRepo.count(),
      this.flagRepo.count({ where: { reviewed: false } }),
    ]);

    const severityRows = await this.flagRepo
      .createQueryBuilder('flag')
      .select('flag.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('flag.severity')
      .getRawMany();

    const bySeverity: Record<string, number> = {};
    for (const row of severityRows) {
      bySeverity[row.severity] = Number(row.count);
    }

    return {
      tenders: { published, awarded },
      anomalies: { totalFlags, unreviewed, bySeverity },
    };
  }
}
