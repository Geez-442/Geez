import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ZetaService } from './zeta.service';
import { Role } from '../auth.stub';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard.nest';

class AskDto {
  role!: Role;
  query!: string;
}

/**
 * ZETA (Zimbabwe E-Tender Assistant) controller.
 * All endpoints are authenticated; advisory answers are logged.
 */
@Controller('zeta')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZetaController {
  constructor(private zetaService: ZetaService) {}

  /**
   * Ask ZETA a procurement-related question.
   * Body: { role: Role, query: string }
   * The role in the body determines the tailored answer; auth still required.
   */
  @Post('ask')
  @Roles(Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator, Role.Public_Observer)
  async ask(@Body() body: AskDto, @Req() req: any) {
    // Prefer authenticated user details over body role to prevent spoofing
    const role = req.user.role as Role;
    return this.zetaService.ask({
      role,
      actorId: req.user.id,
      query: body.query,
    });
  }

  /**
   * Get a high-level audit-log summary (no sealed-bid content).
   * Restricted to PMU and PRAZ oversight roles.
   */
  @Get('audit-summary')
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async auditSummary(@Req() req: any, @Query('limit') limit?: string) {
    return this.zetaService.auditSummary(
      req.user.id,
      req.user.role as Role,
      limit ? parseInt(limit, 10) : 100,
    );
  }
}
