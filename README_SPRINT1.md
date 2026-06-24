ZETS Sprint 1 — Auth & RBAC

This document records Sprint 1 decisions, how to run auth endpoints, and test guidance.

Endpoints (Sprint 1 scaffold)
- POST /auth/register { email, password, role, displayName?, prazVendorNumber? }
  - Registers a user. PRAZ_Regulator role requires prazVendorNumber in prototype.
- POST /auth/login { email, password }
  - Returns { token, user } on success.

How to run locally
1. Ensure Docker infra is running: docker compose up -d
2. Install dependencies for api: cd services/api && npm install
3. Start the API (development): npm run dev
4. Optionally seed DB: node -r ts-node/register services/api/scripts/seed.ts

Security notes
- JWT secret comes from .env (JWT_SECRET). For development a default is used. Never commit real secrets.
- Passwords are hashed with bcryptjs. Replace with stronger policies in production.

Testing
- Sprint 1 includes a placeholder test script. Add Jest tests in services/api/__tests__ in Sprint 2.

Supervisor summary
- Sprint 1 provides a minimal but functional auth scaffold to support role-based testing across front-end and AI integration. It uses TypeORM with PostgreSQL and includes a seed script to create sample users for each role.

Next steps
- Replace Express-based scaffold with proper NestJS modules and guards in Sprint 2.
- Add ESLint/Jest configs and CI updates to run tests.
