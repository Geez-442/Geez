/**
 * Auth stub for Sprint 0
 * - Defines canonical role names used across the system
 * - Provides minimal interfaces and a JWT middleware placeholder
 * NOTE: This is a scaffold only. Replace with a proper NestJS Auth module in Sprint 1.
 */

export enum Role {
  Supplier = 'Supplier',
  PMU_Officer = 'PMU_Officer',
  PRAZ_Regulator = 'PRAZ_Regulator',
  Public_Observer = 'Public_Observer',
}

export interface User {
  id: string; // UUID
  email: string;
  role: Role;
  displayName?: string;
}

// JWT payload shape used in the system (placeholder)
export interface JwtPayload {
  sub: string; // user id
  role: Role;
  iat?: number;
  exp?: number;
}

// Minimal JWT middleware placeholder (non-functional, illustrative only)
export function jwtMiddlewarePlaceholder(req: any, res: any, next: any) {
  // In Sprint 1 this will be replaced by a NestJS Guard / Passport strategy.
  // For now, we show how JWT validation and role extraction should behave.
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    res.statusCode = 401;
    return res.end('Unauthorized - missing Authorization header');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.statusCode = 401;
    return res.end('Unauthorized - malformed token');
  }

  // NOTE: Do NOT perform real verification here in Sprint 0 scaffold.
  // Use a proper JWT library (jsonwebtoken) and secret from env in Sprint 1.
  // Example (Sprint 1): const payload = jwt.verify(token, process.env.JWT_SECRET);

  // Attach a fake user for local dev convenience (REMOVE in production):
  req.user = { id: 'dev-user-1', email: 'dev@example.com', role: Role.Supplier } as User;
  next();
}
