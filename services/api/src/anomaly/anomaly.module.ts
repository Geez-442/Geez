import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnomalyController } from './anomaly.controller';
import { AnomalyService } from './anomaly.service';
import { AnomalyFlag } from './anomaly-flag.entity';
import { AuditLog } from '../audit/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnomalyFlag, AuditLog])],
  controllers: [AnomalyController],
  providers: [AnomalyService],
  exports: [AnomalyService],
})
export class AnomalyModule {}
