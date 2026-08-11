import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { Tender } from '../tender/tender.entity';
import { Bid } from '../bid/bid.entity';
import { AuditLog } from '../audit/audit.entity';
import { BidModule } from '../bid/bid.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tender, Bid, AuditLog]), BidModule],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
