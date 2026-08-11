import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../auth.stub';
import { RolesGuard } from '../guards/roles.guard.nest';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AwardTenderDto } from '../dto/award-tender.dto';

@Controller('evaluation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationController {
  constructor(private evaluationService: EvaluationService) {}

  @Get('bids/:id/review')
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async reviewBid(@Param('id') id: string, @Req() req: any) {
    return this.evaluationService.reviewBid(id, req.user.id, req.user.role);
  }

  @Get('tenders/:id/review')
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async reviewTender(@Param('id') id: string, @Req() req: any) {
    return this.evaluationService.reviewTender(id, req.user.id, req.user.role);
  }

  @Post('tenders/:id/award')
  @Roles(Role.PMU_Officer)
  async award(
    @Param('id') id: string,
    @Body() body: AwardTenderDto,
    @Req() req: any,
  ) {
    return this.evaluationService.awardTender(
      id,
      req.user.id,
      req.user.role,
      body.awardedBidId,
      body.awardDecisionNote,
    );
  }

  @Post('tenders/:id/announce-award')
  @Roles(Role.PMU_Officer)
  async announce(@Param('id') id: string, @Req() req: any) {
    return this.evaluationService.announceAward(id, req.user.id, req.user.role);
  }
}
