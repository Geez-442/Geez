// Auth stub for Sprint 0 - replace with NestJS module in Sprint 1
export enum Role {
  Supplier = 'supplier',
  PMU = 'pmu',
  PRAZ = 'praz',
  Observer = 'observer',
}

export interface User {
  id: string;
  email: string;
  role: Role;
}

// Simple JWT payload interface placeholder
export interface JwtPayload {
  sub: string;
  role: Role;
}
