import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bid } from './bid.entity';
import { BidService } from './bid.service';
import { BidController } from './bid.controller';
import { Tender } from '../tender/tender.entity';
import { AuditLog } from '../audit/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Tender, AuditLog])],
  controllers: [BidController],
  providers: [BidService],
  exports: [BidService],
})
export class BidModule {}
