import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AnomalyService } from './anomaly.service';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../auth.stub';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard.nest';

/**
 * Anomaly detection controller.
 * All endpoints restricted to PRAZ regulators and PMU oversight officers.
 */
@Controller('anomaly')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnomalyController {
  constructor(private anomalyService: AnomalyService) {}

  /**
   * Trigger an anomaly scan over the last N hours.
   * Query: ?hours=24&persist=true
   */
  @Post('scan')
  @Roles(Role.PRAZ_Regulator, Role.PMU_Officer)
  async scan(
    @Req() req: any,
    @Query('hours') hours?: string,
    @Query('persist') persist?: string,
  ) {
    const windowHours = hours ? parseInt(hours, 10) : 24;
    const shouldPersist = persist === undefined ? true : persist !== 'false';
    return this.anomalyService.scan(req.user.id, req.user.role, windowHours, shouldPersist);
  }

  /**
   * List persisted anomaly flags.
   * Query: ?limit=50&reviewed=false
   */
  @Get('flags')
  @Roles(Role.PRAZ_Regulator, Role.PMU_Officer)
  async listFlags(
    @Query('limit') limit?: string,
    @Query('reviewed') reviewed?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedReviewed = reviewed === undefined ? undefined : reviewed === 'true';
    return this.anomalyService.listFlags(parsedLimit, parsedReviewed);
  }

  /**
   * Mark an anomaly flag as reviewed.
   */
  @Post('flags/:id/review')
  @Roles(Role.PRAZ_Regulator, Role.PMU_Officer)
  async review(@Param('id') id: string, @Req() req: any) {
    return this.anomalyService.markReviewed(id, req.user.id, req.user.role);
  }
}
