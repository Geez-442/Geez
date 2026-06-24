import { Controller, Post, Body, Get, Query, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TenderService } from './tender.service';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../auth.stub';
import { RolesGuard } from '../guards/roles.guard.nest';

@Controller('tenders')
@UseGuards(RolesGuard)
export class TenderController {
  constructor(private tenderService: TenderService) {}

  @Post()
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async create(@Body() body: any, @Req() req: any) {
    // Lightweight validation: title and tenderType required
    if (!body.title || !body.tenderType) throw new ForbiddenException('title and tenderType required');
    return this.tenderService.create(body, req.user.id, req.user.role);
  }

  @Get()
  async list(@Query() query: any) {
    return this.tenderService.findAll(query);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.tenderService.findOne(id);
  }

  @Post(':id/publish')
  @Roles(Role.PMU_Officer, Role.PRAZ_Regulator)
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.tenderService.publish(id, req.user.id, req.user.role);
  }
}
