import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Simple in-memory rate limiter for demo hardening (OWASP A04 / DoS mitigation).
 * Limits each IP to MAX requests per WINDOW_MS.
 */
const WINDOW_MS = 60_000;
const MAX = Number(process.env.RATE_LIMIT_MAX || 120);
const hits = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class ThrottleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'local';
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    entry.count += 1;
    if (entry.count > MAX) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
