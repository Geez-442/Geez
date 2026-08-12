import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthServiceNest } from './auth.service.nest';
import { Role } from '../auth.stub';
import { UserStatus } from '../entities/user.entity';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';
import { RolesGuard } from '../guards/roles.guard.nest';
import { UseGuards } from '@nestjs/common';

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  prazVendorNumber?: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthControllerNest {
  constructor(private authService: AuthServiceNest) {}

  @Post('register')
  @Public()
  async register(@Body() body: RegisterDto) {
    try {
      const { email, password, role, displayName, prazVendorNumber } = body as any;
      if (!email || !password || !role) {
        throw new HttpException('email, password and role are required', HttpStatus.BAD_REQUEST);
      }
      const user = await this.authService.register(email, password, role, displayName, prazVendorNumber);
      return {
        status: 'ok',
        user,
        message: 'Registration submitted. Your account is pending PRAZ administrator approval.',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }
      if (err.message?.toLowerCase().includes('user already exists')) {
        throw new HttpException(err.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(err.message || 'Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  @Public()
  async login(@Body() body: LoginDto) {
    const { email, password } = body as any;
    if (!email || !password) throw new HttpException('email and password required', HttpStatus.BAD_REQUEST);

    const user = await this.authService.validateUser(email, password);
    if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    // Enforce admin approval workflow
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException(
        'ACCOUNT_PENDING_APPROVAL: Your registration is awaiting PRAZ Administrator approval.',
      );
    }
    if (user.status === UserStatus.REJECTED) {
      throw new ForbiddenException('ACCOUNT_REJECTED: Your registration request was declined by PRAZ.');
    }

    const token = this.authService.generateJwt(user as any);
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
    };
  }

  /** PRAZ admin lists all pending registrations */
  @Get('pending')
  @Roles(Role.PRAZ_Regulator)
  async listPending() {
    const users = await this.authService.listPendingUsers();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      displayName: u.displayName,
      prazVendorNumber: u.prazVendorNumber,
      status: u.status,
      createdAt: u.createdAt,
    }));
  }

  /** PRAZ admin approves a user */
  @Post('approve/:userId')
  @Roles(Role.PRAZ_Regulator)
  async approveUser(@Param('userId') userId: string) {
    try {
      const result = await this.authService.approveUser(userId);
      return { status: 'ok', user: result, message: 'User approved successfully.' };
    } catch (err: any) {
      throw new HttpException(err.message || 'Approval failed', HttpStatus.BAD_REQUEST);
    }
  }

  /** PRAZ admin rejects a user */
  @Post('reject/:userId')
  @Roles(Role.PRAZ_Regulator)
  async rejectUser(@Param('userId') userId: string) {
    try {
      const result = await this.authService.rejectUser(userId);
      return { status: 'ok', user: result, message: 'User registration rejected.' };
    } catch (err: any) {
      throw new HttpException(err.message || 'Rejection failed', HttpStatus.BAD_REQUEST);
    }
  }
}
