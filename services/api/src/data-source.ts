import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Tender } from './tender/tender.entity';
import { Bid } from './bid/bid.entity';
import { AuditLog } from './audit/audit.entity';
import { ZetaInteraction } from './ai/zeta.entity';
import { AnomalyFlag } from './anomaly/anomaly-flag.entity';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://zets:zets_dev_password@localhost:5432/zets_dev';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [User, Tender, Bid, AuditLog, ZetaInteraction, AnomalyFlag],
});

export async function initializeDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
