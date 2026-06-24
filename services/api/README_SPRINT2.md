ZETS Sprint 2 — Tender Publication Workflow

Overview
This sprint migrates the API scaffold to a minimal NestJS application (Phase A) and implements the Tender module (Phase B). The goal is to provide role-protected tender CRUD and a publication workflow compatible with PRAZ-like rules.

How to run
1. Ensure infra is running: docker compose up -d
2. Install dependencies: cd services/api && npm install
3. Start dev server: npm run dev (uses ts-node-dev)
4. Build: npm run build
5. Seed DB: node -r ts-node/register services/api/scripts/seed.ts

Key design choices (Zimbabwe context)
- NestJS bootstrap: global ValidationPipe ensures input validation; lightweight JSON responses help low-bandwidth clients.
- Role separation: PMU_Officer and PRAZ_Regulator have publish privileges; Suppliers can view published tenders; Public_Observer can view public info—this enforces separation of duties.
- AuditLog entity: append-only records provide an auditable trail for each tender action—useful evidence for anti-corruption analysis.
- Synchronize: true is used only for development. For production, use TypeORM migrations.

API examples (curl)
- Register a PMU officer (replace values):
  curl -X POST http://localhost:3001/api/auth/register -H 'Content-Type: application/json' -d '{"email":"pmu@example.com","password":"Password123!","role":"PMU_Officer"}'

- Login:
  curl -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"email":"pmu@example.com","password":"Password123!"}'

- Create tender (PMU):
  curl -X POST http://localhost:3001/api/tenders -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' -d '{"title":"Supply of office chairs","tenderType":"Goods","procuringEntity":"Local Council","budget":50000}'

- Publish tender (PMU):
  curl -X POST http://localhost:3001/api/tenders/<id>/publish -H "Authorization: Bearer <TOKEN>"

Supervisor notes
- This sprint sets the groundwork for Sprint 3 (Bid Vault) by ensuring role separation, audit trails, and API hooks where encrypted storage will be incorporated.
- ZETA integration: With structured tenders and audit logs, ZETA can later consume anonymized event streams (not sealed bids) for advisory and anomaly detection.
