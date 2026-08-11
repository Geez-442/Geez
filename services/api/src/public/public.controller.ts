import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { PublicService } from './public.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard.nest';

/**
 * Public transparency endpoints.
 *
 * These routes are intentionally unauthenticated so that citizens,
 * journalists, and suppliers without accounts can observe procurement
 * opportunities and oversight outcomes. No sealed-bid contents or
 * supplier-identifying details are exposed.
 */
@Controller('public')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Get('tenders')
  @Public()
  publishedTenders() {
    return this.publicService.publishedTenders();
  }

  @Get('awards')
  @Public()
  awardedTenders() {
    return this.publicService.awardedTenders();
  }

  @Get('stats')
  @Public()
  stats() {
    return this.publicService.stats();
  }
}
