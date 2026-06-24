import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthServiceNest } from './auth.service.nest';
import { AuthControllerNest } from './auth.controller.nest';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthControllerNest],
  providers: [AuthServiceNest],
  exports: [AuthServiceNest],
})
export class AuthModule {}
