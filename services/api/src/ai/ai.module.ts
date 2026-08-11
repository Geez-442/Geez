import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZetaController } from './zeta.controller';
import { ZetaService } from './zeta.service';
import { ZetaInteraction } from './zeta.entity';
import { AuditLog } from '../audit/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ZetaInteraction, AuditLog])],
  controllers: [ZetaController],
  providers: [ZetaService],
  exports: [ZetaService],
})
export class AiModule {}
