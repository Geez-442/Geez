import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TenderModule } from './tender/tender.module';
import { User } from './entities/user.entity';
import { Tender } from './tender/tender.entity';
import { AuditLog } from './audit/audit.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://zets:zets_dev_password@localhost:5432/zets_dev',
      entities: [User, Tender, AuditLog],
      synchronize: true, // DEV only — use migrations in production
    }),
    AuthModule,
    TenderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
