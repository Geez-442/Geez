import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, JwtPayload } from '../auth.stub';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    // Attach user from JWT when present (even if roles not required)
    if (!request.user) {
      const authHeader = request.headers['authorization'];
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          try {
            const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
            const payload = jwt.verify(token, secret) as JwtPayload;
            request.user = { id: payload.sub, role: payload.role };
          } catch {
            if (requiredRoles?.length) throw new UnauthorizedException('Invalid token');
          }
        }
      }
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!request.user) throw new UnauthorizedException('Missing auth header');

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
