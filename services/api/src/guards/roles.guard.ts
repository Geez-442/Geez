// Legacy Express-based role guard retained for reference. Replaced by NestJS RolesGuard in Sprint 2.
export const requireRole = () => { return (_req:any,_res:any,_next:any) => { return _next(); }; };
