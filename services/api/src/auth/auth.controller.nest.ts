import { Controller, Post, Body, HttpException, HttpStatus, BadRequestException, ConflictException } from '@nestjs/common';
import { AuthServiceNest } from './auth.service.nest';
import { Role } from '../auth.stub';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

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
export class AuthControllerNest {
  constructor(private authService: AuthServiceNest) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    try {
      const { email, password, role, displayName, prazVendorNumber } = body as any;
      if (!email || !password || !role) {
        throw new HttpException('email, password and role are required', HttpStatus.BAD_REQUEST);
      }
      const user = await this.authService.register(email, password, role, displayName, prazVendorNumber);
      return { status: 'ok', user };
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
  async login(@Body() body: LoginDto) {
    const { email, password } = body as any;
    if (!email || !password) throw new HttpException('email and password required', HttpStatus.BAD_REQUEST);

    const user = await this.authService.validateUser(email, password);
    if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    const token = this.authService.generateJwt(user as any);
    return { token, user: { id: (user as any).id, email: (user as any).email, role: (user as any).role } };
  }
}
