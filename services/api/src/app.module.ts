import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { TenderModule } from './tender/tender.module';
import { BidModule } from './bid/bid.module';
import { AuditModule } from './audit/audit.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { AiModule } from './ai/ai.module';
import { AnomalyModule } from './anomaly/anomaly.module';
import { User } from './entities/user.entity';
import { Tender } from './tender/tender.entity';
import { Bid } from './bid/bid.entity';
import { AuditLog } from './audit/audit.entity';
import { ZetaInteraction } from './ai/zeta.entity';
import { AnomalyFlag } from './anomaly/anomaly-flag.entity';
import { ThrottleGuard } from './guards/throttle.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://zets:zets_dev_password@localhost:5432/zets_dev',
      entities: [User, Tender, Bid, AuditLog, ZetaInteraction, AnomalyFlag],
      synchronize: true,
    }),
    AuthModule,
    TenderModule,
    BidModule,
    AuditModule,
    EvaluationModule,
    AiModule,
    AnomalyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
  ],
})
export class AppModule {}
