import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../auth.stub';
import { RolesGuard } from '../guards/roles.guard.nest';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async logs(
    @Query('limit') limit?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.auditService.listLogs(limit ? parseInt(limit, 10) : 20, targetType, targetId);
  }
}
