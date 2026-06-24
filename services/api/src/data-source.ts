import 'reflect-metadata';
import { DataSource } from 'typeorm';

// DataSource configuration for TypeORM. Uses DATABASE_URL if present.
// This file intentionally keeps configuration simple for Sprint 1.

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://zets:zets_dev_password@localhost:5432/zets_dev';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  synchronize: true, // For development only. Use migrations in production.
  logging: false,
  entities: [__dirname + '/entities/*.{ts,js}'],
});

// Export a helper to initialize the connection
export async function initializeDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
