import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Tender } from '../tender/tender.entity';
import { AnomalyFlag } from '../anomaly/anomaly-flag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tender, AnomalyFlag])],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
