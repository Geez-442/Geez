import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ZetaService } from './zeta.service';
import { Role } from '../auth.stub';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard.nest';

class AskDto {
  @IsString()
  @IsNotEmpty({ message: 'Please enter a question for ZETA' })
  @MaxLength(1000, { message: 'Question is too long — please shorten it' })
  query!: string;
}

/**
 * ZETA (Zimbabwe E-Tender Assistant) controller.
 * Authenticated answers are tailored to the caller's verified role.
 * An unauthenticated endpoint is exposed for the public transparency portal and
 * the pre-login home page, scoped to Public_Observer guidance only.
 */
@Controller('zeta')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZetaController {
  constructor(private zetaService: ZetaService) {}

  /**
   * Ask ZETA a procurement-related question.
   * The caller's verified JWT role determines the tailored answer, never a body field.
   */
  @Post('ask')
  @Roles(Role.Supplier, Role.PMU_Officer, Role.PRAZ_Regulator, Role.Public_Observer)
  async ask(@Body() body: AskDto, @Req() req: any) {
    const role = req.user.role as Role;
    return this.zetaService.ask({
      role,
      actorId: req.user.id,
      query: body.query,
    });
  }

  /**
   * Unauthenticated advisory endpoint for the public portal and pre-login pages.
   * Always answers with Public_Observer scope, so no role-restricted guidance leaks.
   */
  @Post('ask-public')
  @Public()
  async askPublic(@Body() body: AskDto) {
    return this.zetaService.ask({
      role: Role.Public_Observer,
      actorId: 'anonymous',
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

  /**
   * List ZETA interactions blocked or redacted by the prompt-injection / output
   * guard rails, for periodic review of false positives/negatives and bias.
   * Restricted to PMU and PRAZ oversight roles.
   */
  @Get('guard-flags')
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async guardFlags(@Req() req: any, @Query('limit') limit?: string) {
    return this.zetaService.listGuardFlags(req.user.role as Role, limit ? parseInt(limit, 10) : 50);
  }
}
