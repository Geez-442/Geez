# ZETS Compliance Matrix

This matrix maps Zimbabwe procurement and data-protection obligations to concrete ZETS/ZETA implementation artefacts. It is intended for final-year dissertation evidence and for PRAZ-alignment discussions.

| Requirement / Control | Legal / Policy Source | Implementation | Evidence |
|---|---|---|---|
| **1. Role-based access control** | PPDPA §7, PRAZ eGP user-management guidelines | `Role` enum; `RolesGuard` + `JwtAuthGuard`; `@Roles()` decorator; all controllers enforce role checks. | `services/api/src/auth.stub.ts`, `services/api/src/guards/roles.guard.nest.ts`, `services/api/src/guards/jwt-auth.guard.ts` |
| **2. Supplier registration & authentication** | PPDPA §7, PRAZ vendor registry | `AuthServiceNest` bcrypt password hashing; JWT access tokens with 2-hour expiry; optional `prazVendorNumber` field. | `services/api/src/auth/auth.service.nest.ts`, `services/api/src/auth/auth.controller.nest.ts` |
| **3. Tender publication workflow** | PPDPA §4 (public notice), PRAZ e-tendering procedure | `TenderController`: create → publish; `TenderStatus` lifecycle; published tenders exposed via public API. | `services/api/src/tender/tender.controller.ts`, `services/api/src/tender/tender.service.ts`, `services/api/src/public/public.controller.ts` |
| **4. Sealed-bid confidentiality** | PPDPA §4.2, OECD procurement integrity guidelines | AES-256-CBC encryption of amount and documents; PBKDF2 key derivation; time-lock prevents decryption before deadline. | `services/api/src/bid/bid.service.ts`, `services/api/src/crypto/encryption.ts` |
| **5. Time-lock / premature access prevention** | PPDPA §4.2 | `BidService.getBidForViewing` checks deadline; `sealBid` rejects post-deadline seals. | `services/api/src/bid/bid.service.ts` |
| **6. Conflict-of-Interest (COI) declarations** | PPDPA §6.3, PRAZ standard bidding documents | COI object mandatory before sealing; immutable after seal; audit-logged. | `services/api/src/bid/bid.service.ts` (sealBid) |
| **7. Append-only audit trail** | PPDPA §5.1, anti-corruption best practice | `AuditLog` entity; SHA-256 hash chain per target; every create/seal/view/award/scan logged. | `services/api/src/audit/audit.entity.ts`, `services/api/src/bid/bid.service.ts`, `services/api/src/crypto/hash-chain.ts` |
| **8. AI advisory-only, no binding decisions** | OECD.AI principle of human oversight | ZETA knowledge base + mock adapter returns citations and escalation message; no bid decryption; interactions audited. | `services/api/src/ai/zeta.service.ts`, `services/api/src/ai/knowledge-base.ts`, `services/api/src/ai/zeta.entity.ts` |
| **9. Anomaly / collusion detection** | PRAZ oversight mandate, anti-corruption analytics | Rule-based scanner on audit metadata: repeated bid creations, off-hours access, single-bidder awards, rapid sealing; advisory flags. | `services/api/src/anomaly/anomaly.service.ts`, `services/api/src/anomaly/anomaly.controller.ts` |
| **10. Public transparency** | Constitution §315 (transparency), PPDPA public notice | Public dashboard + `/api/public/tenders`, `/api/public/awards`, `/api/public/stats`; no sealed data leaked. | `apps/web/app/public/page.js`, `services/api/src/public/*.ts` |
| **11. Low-connectivity / SME accessibility** | PRAZ eGP SME inclusion objectives | PWA manifest + service worker; offline bid-draft editor with localStorage sync. | `apps/web/public/sw.js`, `apps/web/app/offline/bid-draft/page.js` |
| **12. Input validation & secure defaults** | OWASP API Security Top 10 | Global `ValidationPipe` with `whitelist`, `transform`, `forbidNonWhitelisted`; DTOs with `class-validator`; Helmet security headers; CORS restricted to `CORS_ORIGIN`. | `services/api/src/main.ts`, `services/api/src/dto/*.ts` |
| **13. Rate limiting / DoS mitigation** | OWASP A04/A07 | `ThrottleGuard` applied globally (120 req/min per IP); public endpoints still covered. | `services/api/src/guards/throttle.guard.ts`, `services/api/src/app.module.ts` |
| **14. Data minimisation** | PPDPA data-protection principles | Public API returns only metadata/aggregates; ZETA only reads audit metadata; anomaly scanner never touches sealed-bid contents. | `services/api/src/public/public.service.ts`, `services/api/src/anomaly/anomaly.service.ts` |

## Known prototype limitations

- **Encryption key management**: single `ENCRYPTION_KEY` env variable; production should use AWS KMS / HashiCorp Vault with per-bid key derivation and rotation.
- **Audit immutability**: hash chain detects tampering but an attacker with DB write access can rewrite the whole chain; production needs append-only / WORM storage or blockchain anchoring.
- **Time synchronisation**: relies on server clock; add NTP validation and deadline enforcement at database trigger level.
- **Rate limiting**: in-memory only; multi-instance deployments require Redis-backed throttling.
- **LLM sandboxing**: ZETA currently uses deterministic keyword matching; future work is a sandboxed LLM adapter with prompt-injection guards.
