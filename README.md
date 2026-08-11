# Design and Implementation of a Secure Zimbabwe Electronic Tender Issuing System (ZETS)

This repository contains the research-grade prototype and supporting materials for ZETS (Zimbabwe Electronic Tender Issuing System) and ZETA (Zimbabwe E-Tender Assistant), a secure, PRAZ-aligned e-procurement system with an embedded AI advisor focused on transparency, accessibility, and anti-corruption.

Current status:
- Sprint 0 — Project scaffold, Docker Compose, CI skeleton ✅
- Sprint 1 — Auth & RBAC (register/login, JWT stub, seed script) ✅
- Sprint 2 — Tender publication workflow (NestJS tender CRUD + publish) ✅
- Sprint 3 — Secure bid vault (AES-256 encryption, time-lock sealing, COI, hash-chain audit log) ✅
- Sprint 4 — ZETA AI advisory service (advisory-only mock adapter, role-differentiated guidance, auditable interactions) ✅
- Sprint 5 — Anomaly detection (rule-based audit-log scanner, synthetic data generator, advisory flags) ✅
- Sprint 6 — Offline PWA + public dashboard ⏳
- Sprint 7+ — Final hardening, compliance matrix, dissertation write-up ⏳

See:
- `PROJECT_BLUEPRINT.md` for the original sprint plan and system prompts.
- `services/api/README_SPRINT*.md` for per-sprint developer notes and API examples.
