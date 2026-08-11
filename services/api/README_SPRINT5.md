# ZETS Sprint 5 — Anomaly Detection for Procurement Oversight

## Overview

Sprint 5 adds a rule-based anomaly-detection service that scans audit logs (metadata only — never sealed-bid contents) and flags potential collusion, abuse, or favouritism for PRAZ and PMU review.

## What was delivered

- `services/api/src/anomaly/`
  - `anomaly-flag.entity.ts` — persisted anomaly findings with severity and review status.
  - `anomaly.service.ts` — rule-based scanner with four detection rules:
    - **Repeated bid creations** — a supplier creating many bids on the same tender.
    - **Off-hours official access** — PMU/PRAZ actions outside normal business hours.
    - **Single-bidder awards** — tenders awarded with only one sealed bid.
    - **Rapid bid sealing** — a bid sealed within seconds of creation (possible pre-arrangement).
  - `anomaly.controller.ts` — `POST /anomaly/scan`, `GET /anomaly/flags`, and `POST /anomaly/flags/:id/review` (PMU/PRAZ only).
  - `anomaly.module.ts` — NestJS module registration.
  - `synthetic-audit-generator.ts` — deterministic test-data generator that produces both anomalous and clean event streams.
  - `anomaly.service.spec.ts` — unit tests validating each rule and clean-data behaviour.

## Design decisions

- **Metadata-only**: The scanner never reads encrypted bid amounts, documents, or evaluation scores. It uses `actionType`, `actorId`, `actorRole`, `targetId`, and timestamps from the audit log.
- **Advisory flags**: All findings are persisted as `AnomalyFlag` records with a `reviewed` boolean. They do not automatically block awards or bids.
- **Synthetic evaluation data**: A deterministic generator supports repeatable unit tests without a real database.
- **Auditability**: Every scan run and flag review is appended to the audit log.

## API examples

Run an anomaly scan over the last 24 hours:

```bash
curl -X POST "http://localhost:3001/api/anomaly/scan?hours=24" \
  -H "Authorization: Bearer <PMU_OR_PRAZ_TOKEN>"
```

List unreviewed flags:

```bash
curl "http://localhost:3001/api/anomaly/flags?reviewed=false&limit=50" \
  -H "Authorization: Bearer <PMU_OR_PRAZ_TOKEN>"
```

Mark a flag as reviewed:

```bash
curl -X POST "http://localhost:3001/api/anomaly/flags/<FLAG_ID>/review" \
  -H "Authorization: Bearer <PMU_OR_PRAZ_TOKEN>"
```

## Testing

Unit tests run with:

```bash
cd services/api
npm test
```

Tests verify that:
- each rule fires when expected,
- clean event streams produce zero flags,
- flag review is auditable.

## Future hardening

- Add statistical/ML baselines (e.g., Benford's law on bid amounts after deadline) once enough historical metadata is available.
- Integrate an external immutable log store (write-once media or blockchain) to complement the application-layer hash chain.
- Add rate-limiting and CAPTCHA rules identified in the STRIDE DoS mitigation plan.
