import { Controller, Post, Get, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { BidService } from './bid.service';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../auth.stub';
import { RolesGuard } from '../guards/roles.guard.nest';

/**
 * BidController exposes secure bid management endpoints.
 * All routes enforce role-based access and time-lock logic.
 */
@Controller('bids')
@UseGuards(RolesGuard)
export class BidController {
  constructor(private bidService: BidService) {}

  /**
   * Create a draft bid (Supplier only).
   * Body: { tenderId, amount, coiData? }
   */
  @Post()
  @Roles(Role.Supplier)
  async create(@Body() body: any, @Req() req: any) {
    const { tenderId, amount, coiData } = body;
    if (!tenderId || amount === undefined) {
      throw new ForbiddenException('tenderId and amount required');
    }
    return this.bidService.createDraft(tenderId, req.user.id, amount, coiData);
  }

  /**
   * Seal a bid (Supplier only).
   * Body: { coiDeclaration: { name, company, disclosures, ... } }
   */
  @Post(':id/seal')
  @Roles(Role.Supplier)
  async sealBid(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!body.coiDeclaration) {
      throw new ForbiddenException('coiDeclaration required to seal bid');
    }
    return this.bidService.sealBid(id, req.user.id, body.coiDeclaration);
  }

  /**
   * Get all own bids (Supplier only).
   */
  @Get('my-bids')
  @Roles(Role.Supplier)
  async getOwnBids(@Req() req: any) {
    return this.bidService.getOwnBids(req.user.id);
  }

  /**
   * Get a specific bid (with authorization checks).
   * Supplier sees own bid, PMU/PRAZ see sealed bids after deadline, Public_Observer denied.
   */
  @Get(':id')
  async getBid(@Param('id') id: string, @Req() req: any) {
    return this.bidService.getBidForViewing(id, req.user.id, req.user.role);
  }
}
