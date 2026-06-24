import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../auth.stub';
import { JwtPayload } from '../auth.stub';
import * as jwt from 'jsonwebtoken';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Missing auth header');

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Malformed auth header');

    try {
      const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
      const payload = jwt.verify(token, secret) as JwtPayload;
      request.user = { id: payload.sub, role: payload.role };

      const hasRole = requiredRoles.includes(payload.role);
      if (!hasRole) throw new ForbiddenException('Insufficient role');

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
