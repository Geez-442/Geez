import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../auth.stub';

// Simple role guard middleware for Express-based Sprint 1 scaffold.
export function requireRole(requiredRoles: Role[] | Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
      const payload: any = jwt.verify(token, secret);
      req.user = { id: payload.sub, role: payload.role } as any;

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (!roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden - insufficient role' });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
