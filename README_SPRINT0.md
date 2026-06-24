ZETS Sprint 0 — Detailed Developer Guide & Decisions

This file contains the Sprint 0 Decisions & Rationale requested in the blueprint. Keep this updated as decisions evolve.

Sprint 0 Decisions & Rationale

1. Monorepo (apps/, services/)
- Rationale: Single student/researcher benefit — easier local development, consistent CI, and simpler cross-module refactoring. Monorepo supports later choice of Turborepo or Nx for task orchestration.

2. Tech choices
- Next.js 15 (frontend): PWA support and SSR make it ideal for low-bandwidth contexts by enabling server-side rendering of critical pages and improved caching.
- NestJS (backend): strong TypeScript support, modularity, guards/interceptors, and a familiar structure for enterprise-style RBAC and DI.
- PostgreSQL 15: persistence with JSONB and strong transactional guarantees; useful for append-only logs and later hash-chain implementations.
- MinIO: S3-compatible storage locally for file uploads (tenders, attachments). Easier transition to cloud S3 or private S3-compatible infra.
- Redis: session/caching and lightweight message passing for notifications and rate-limiting.

3. Security and compliance by design
- AES-256 chosen for bid vault encryption (implementation in Sprint 3). 
- Append-only audit chains (hash chain) and mandatory COI declarations recorded as structured events in DB.
- ZETA is explicitly advisory-only — design includes logging and human escalation paths.

4. Local infra layout
- docker-compose for local development with named volumes for Postgres and MinIO data persistence.
- Adminer for quick DB inspection; do not use Adminer in production.

5. CI and code quality
- GitHub Actions skeleton added in Sprint 0. Later sprints will add ESLint, Prettier, and Jest steps.

6. Minimal dev seed data
- Sprint 1 will include a seed script to create a few users (one per role) and sample tenders to speed front-end development.

Guiding principles
- Prioritise security, auditability, and accessibility for Zimbabwe-specific constraints.
- Keep ZETA advisory-only and auditable.
- Make small, well-tested changes per sprint.

