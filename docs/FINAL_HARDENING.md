# ZETS Final Hardening Notes

This document summarises the security controls added in the final hardening pass and the production roadmap.

## Security controls implemented

1. **Helmet security headers** (`services/api/src/main.ts`)
   - Adds `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`, etc.
   - Mitigates OWASP risks A05 (security misconfiguration) and A03 (injection / XSS).

2. **Strict global validation** (`services/api/src/main.ts`, `services/api/src/dto/*.ts`)
   - `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted`.
   - Typed DTOs for auth, tender, bid, and award payloads using `class-validator`.
   - Prevents mass-assignment and malformed input reaching the service layer.

3. **CORS lockdown**
   - `CORS_ORIGIN` env variable restricts cross-origin requests to known web origins.

4. **Rate limiting**
   - `ThrottleGuard` is applied globally via `APP_GUARD`.
   - 120 requests per minute per IP (configurable via `RATE_LIMIT_MAX`).

5. **Authentication & session hygiene**
   - Passwords hashed with bcrypt (10 rounds).
   - JWTs signed with `JWT_SECRET`, 2-hour expiry.
   - Roles enforced by guards on every protected route.

6. **Sealed-bid cryptography**
   - AES-256-CBC + PBKDF2-SHA256 (100k iterations) for amount/document metadata.
   - Time-lock enforced in service layer; no premature decryption for PMU/PRAZ.

7. **Auditability**
   - Every state-changing action appended to `AuditLog` with a SHA-256 hash chain.
   - Anomaly scans and flag reviews are themselves audited.

8. **AI safety**
   - ZETA is advisory-only; it never decrypts bids or changes tender state.
   - All answers are sourced from a curated knowledge base with explicit citations.

9. **LangChain-based ZETA pipeline** (`services/api/src/ai/zeta.langchain.ts`)
   - Domain-specific PRAZ prompt template that instructs the model to use only verified context and to escalate when insufficient.
   - Deterministic `FakeLLM` stand-in for offline/research use; can be swapped for `ChatOpenAI` or a local Ollama model in production.

10. **Mandatory PRAZ vendor / entity verification** (`services/api/src/auth/auth.service.nest.ts`)
    - All Supplier, PMU Officer, and PRAZ Regulator registrations must provide a `prazVendorNumber` that passes structural validation.
    - Public Observer accounts are exempt.

11. **ZETA prompt-injection and output-leak guard rails** (`services/api/src/ai/prompt-guard.ts`)
    - Defence-in-depth outside the LLM prompt itself: plain-TypeScript pattern checks that cannot be argued with by the model.
    - **Input guard**: refuses instruction-override, role-override/jailbreak, prompt-extraction, and fake context/system-block injection attempts, and corruption-facilitation requests (threshold bypass, bid-rigging, favouritism, sealed-bid disclosure, secret extraction) — refused *before* the LLM is ever invoked.
    - **Output guard**: scans the composed answer (LLM or deterministic fallback) for leaked secrets/config or apparent compliance with a request the system prompt should have refused; unsafe answers are replaced with the safe deterministic template instead of being returned.
    - Every blocked or redacted interaction is persisted (`ZetaInteraction.blocked` / `guardFlags`) and appended to the hash-chain audit log (`ZETA_GUARD_BLOCKED_INPUT` / `ZETA_GUARD_REDACTED_OUTPUT`), and exposed to PRAZ/PMU via `GET /zeta/guard-flags` as a lightweight, auditable bias-review log.
    - Unit-tested independently of the LLM adapter (`prompt-guard.spec.ts`) and via `ZetaService` integration tests.

12. **Role-differentiated web portals**
    - `/supplier` — browse tenders, create draft bids, seal bids, ZETA supplier guidance.
    - `/pmu` — create/publish tenders, review and award tenders, anomaly flags, audit events, ZETA PMU guidance.
    - `/praz` — full audit trail, anomaly scan/flag review, transparency stats, ZETA regulator guidance.
    - `/public` — unauthenticated transparency dashboard.
    - `/offline/bid-draft` — localStorage-backed offline bid drafting with sync.

## Production roadmap

| Priority | Task | Rationale |
|---|---|---|
| High | Replace env-based encryption key with KMS/Vault + per-bid key derivation | Remove single shared secret risk |
| High | Append-only / WORM audit log replica or blockchain anchoring | True immutability |
| High | Redis-backed rate limiting | Multi-instance consistency |
| Medium | Database triggers for deadline enforcement | Defence in depth |
| Medium | NTP monitoring and server-clock tamper alerts | Time-lock reliability |
| Medium | Input sanitisation / DOMPurify on web frontend | XSS defence in depth |
| Low | SMS gateway integration (Africa’s Talking) | Rural accessibility |
| Low | Usability testing with Zimbabwean SMEs and PRAZ stakeholders | Validate accessibility claims |

## Dependency audit remediation

- `services/api` upgraded to NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/testing`) and `@langchain/core@^1.2.3`.
- `apps/web` added direct `postcss@^8.5.23` and `sharp@^0.35.0` dev dependencies plus `overrides` under `next` to force patched transitive packages.
- `npm audit` now reports **0 vulnerabilities** in both workspaces.

## Verification commands

```bash
cd services/api
npm audit
npm run build
npm test

cd ../web
npm audit
npm run build
```
