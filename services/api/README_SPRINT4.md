# ZETS Sprint 4 — ZETA AI Advisory Service

## Overview

Sprint 4 implements ZETA (Zimbabwe E-Tender Assistant), an embedded advisory-only AI assistant for the ZETS API. The sprint focuses on safe, auditable, role-differentiated guidance without exposing any sealed-bid content.

## What was delivered

- `services/api/src/ai/`
  - `zeta.entity.ts` — `ZetaInteraction` table for audit trail of every AI interaction.
  - `knowledge-base.ts` — static, grounded knowledge entries for supplier, PMU, PRAZ, and public observer roles.
  - `zeta.service.ts` — deterministic mock adapter with stopword-aware keyword matching; logs all answers to the audit trail via hash-chain events.
  - `zeta.controller.ts` — `POST /zeta/ask` and `GET /zeta/audit-summary` endpoints.
  - `ai.module.ts` — NestJS module registration.
  - `zeta.service.spec.ts` — unit tests covering role matching, insufficient data handling, and access control.

## Design decisions

- **Advisory-only**: ZETA never decrypts or accesses bid amounts, documents, or evaluation scores. It only reads public tender metadata and audit-log summaries.
- **Grounded responses**: Answers come from a curated knowledge base with explicit source citations. If no relevant match exists, ZETA returns `INSUFFICIENT DATA — ESCALATE TO HUMAN`.
- **Auditability**: Every query/response pair is persisted and logged through the append-only audit chain.
- **Role differentiation**: The same question can yield different guidance depending on whether the caller is a Supplier, PMU Officer, PRAZ Regulator, or Public Observer.
- **Mock-first LLM adapter**: No external LLM API keys are required for local development or CI. A LangChain/open-LLM adapter can be dropped into `ZetaService` later without changing the controller contract.

## API examples

Ask a question as a logged-in user:

```bash
curl -X POST http://localhost:3001/api/zeta/ask \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query":"How do I register as a supplier?"}'
```

Get an audit-log metadata summary (PMU/PRAZ only):

```bash
curl "http://localhost:3001/api/zeta/audit-summary?limit=100" \
  -H "Authorization: Bearer <PMU_OR_PRAZ_TOKEN>"
```

## Testing

Unit tests run with:

```bash
cd services/api
npm test
```

These tests are isolated from the database and external APIs.

## Next steps

- Sprint 5 will add anomaly detection over audit-log metadata, partially consumed by ZETA for oversight summaries.
- Future hardening: swap the static knowledge base for a vector-backed retrieval layer (e.g., PRAZ bidding documents).

## Update: LangChain pipeline, public endpoint, and guard rails

Since this document was first written, ZETA has been extended:

- `zeta.langchain.ts` wires a domain-specific PRAZ prompt template to either `ChatOpenAI` (when `OPENAI_API_KEY` is set) or a deterministic `FakeLLM` fallback, so the system works identically in research/CI without external API keys.
- `POST /zeta/ask-public` exposes unauthenticated, `Public_Observer`-scoped guidance for the public transparency portal and pre-login pages.
- `prompt-guard.ts` adds defence-in-depth **input** and **output** guard rails that run independently of the LLM prompt: they refuse instruction-override/jailbreak/prompt-extraction attempts and corruption-facilitation requests before the model is invoked, and scan the composed answer for leaked secrets or apparent policy bypass afterwards. Flagged interactions are persisted and auditable via `GET /zeta/guard-flags` (PMU/PRAZ only) — see `docs/FINAL_HARDENING.md` §11 for the full design rationale and threat model.
