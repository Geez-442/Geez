import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tender } from './tender.entity';
import { TenderService } from './tender.service';
import { TenderController } from './tender.controller';
import { AuditLog } from '../audit/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tender, AuditLog])],
  controllers: [TenderController],
  providers: [TenderService],
  exports: [TenderService],
})
export class TenderModule {}
