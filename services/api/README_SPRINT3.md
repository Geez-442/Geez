# Sprint 3: Secure Bid Vault — README

## Overview

Sprint 3 implements the **cryptographic heart** of ZETS: a secure bid management system that prevents unsealed bid access, enforces Conflict-of-Interest (COI) declarations, and maintains an immutable audit trail via hash-chain verification.

This sprint directly addresses anti-corruption requirements from PRAZ regulations and PPDPA compliance:
- **Sealed-bid integrity**: Bids remain encrypted until tenure deadline expires
- **Audit accountability**: Every action logged and cryptographically chained
- **COI transparency**: Mandatory declarations immutable after sealing
- **Role-based access**: Strict separation (Supplier creates/seals; PMU/PRAZ view after deadline; Observer denied)

---

## Security Architecture

### 1. AES-256-CBC Encryption (Sensitive Fields)

**Why AES-256-CBC?**
- Industry standard, widely vetted, hardware-accelerated on modern CPUs
- 256-bit key provides 128-bit security margin beyond current threat models
- CBC mode is deterministic (given IV + plaintext → same ciphertext), allowing verification; GCM adds authentication but complexity for prototype

**Implementation:**
- Algorithm: AES-256-CBC (128-bit IV, 256-bit key)
- Key derivation: PBKDF2 (100k iterations) from `ENCRYPTION_KEY` env variable + hardcoded salt
- Plaintext: Bid amount (as string) and document metadata
- Storage: `"iv:ciphertext"` (both base64-encoded), stored as single text field in DB
- Decryption: Restricted to authorized actors (PMU/PRAZ after deadline; Supplier always)

**Threat Model:**
- **Attacker goal**: Extract bid amounts before deadline
- **Mitigation**:
  - Encryption at rest prevents DB-level breaches
  - Time-lock at application layer prevents premature decryption
  - Audit logging detects unauthorized decryption attempts
- **Caveat**: Prototype uses single shared `ENCRYPTION_KEY` from env. Production must use:
  - AWS KMS, HashiCorp Vault, or similar key management service
  - Per-bid or per-tenant key derivation
  - Key rotation strategy (e.g., annual re-encryption cycle)

### 2. PBKDF2 Key Derivation

**Why PBKDF2?**
- Resistant to GPU/ASIC brute-force attacks (100k iterations = ~100ms per guess)
- Standards-compliant (RFC 2898)
- Alternative considered: bcrypt/scrypt (slower but newer; defer to Sprint 4 hardening)

**Parameters:**
- Algorithm: PBKDF2-SHA256
- Iterations: 100,000 (tuned for ~100ms on modern hardware)
- Salt: Hardcoded `"zets-bidvault-salt-v1"` (MUST be randomized per environment in production)
- Output: 32-byte key for AES-256

### 3. Time-Lock Sealing

**Mechanism:**
- Supplier creates draft bid (unencrypted in-transit, encrypted at-rest)
- Supplier seals bid: triggers encryption finalization + COI requirement + timestamp
- Service layer enforces: **Cannot seal bid after tender deadline**
- Service layer enforces: **Cannot open (decrypt) sealed bid before tender deadline** (for PMU/PRAZ)

**Execution:**
```typescript
// In BidService.sealBid():
if (tender?.deadline && new Date() > tender.deadline) {
  throw new BadRequestException('Cannot seal bid after tender deadline');
}

// In BidService.getBidForViewing():
const isAfterDeadline = tender?.deadline && new Date() > tender.deadline;
if (userRole !== Role.Supplier && !isAfterDeadline) {
  throw new ForbiddenException('Can only view sealed bids after tender deadline');
}
```

**Trade-off:** Application-layer enforcement (vs. database triggers) is simpler and cross-database-compatible. Database triggers added in hardening phase.

### 4. Append-Only Hash Chain

**Purpose:**
- Detect tampering or audit log deletion
- Provide forensic evidence of action sequence
- (Not full immutability — true immutability requires blockchain or external write-once storage; deferred to Sprint 5)

**Implementation:**
```typescript
// For each audit action:
const previousHash = (last audit for this target).hash;
const eventPayload = `BID_SEAL:${bidId}:${supplierId}:${JSON.stringify(coiDeclaration)}`;
const newHash = SHA256(previousHash + ':' + eventPayload);
await auditRepo.save({ ..., hash: newHash });
```

**Verification:**
```typescript
function verifyChain(events: Array<{ payload; hash }>): boolean {
  let previousHash = '';
  for (const event of events) {
    const expectedHash = SHA256(previousHash + ':' + event.payload);
    if (expectedHash !== event.hash) return false;
    previousHash = event.hash;
  }
  return true;
}
```

**Threat Model:**
- **Attacker goal**: Delete audit entries to hide bid tampering
- **Mitigation**: Hash chain breaks if any entry deleted or modified
- **Caveat**: Attacker with write access to audit table can forge entire chain. Mitigation: Read-only audit log replica (Sprint 5), immutable log storage.

### 5. Conflict-of-Interest (COI) Declarations

**Mandatory Before Sealing:**
```typescript
// Supplier must provide:
{
  company: "ABC Tech Solutions",
  conflicts: "None known",
  affiliations: ["Chamber of Commerce"],
  disclosedInterests: ["Director of competing firm (retired 2022)"]
}
```

**Immutability:**
- Once bid sealed, COI cannot be modified
- Every change attempt logged to audit trail
- ZETA reviews COI for anomalies (e.g., suppliers affiliated with PMU officials)

**Enforcement:**
```typescript
if (!coiDeclaration || typeof coiDeclaration !== 'object') {
  throw new BadRequestException('Valid COI declaration required');
}
```

---

## STRIDE Threat Model

### Spoofing
- **Threat**: Attacker impersonates supplier/PMU
- **Mitigation**: JWT authentication + RolesGuard on all routes

### Tampering
- **Threat**: Attacker modifies bid amount or audit log
- **Mitigation**: AES-256 encryption at-rest; append-only hash chain; audit logging on every access

### Repudiation
- **Threat**: Supplier denies creating/sealing bid
- **Mitigation**: Immutable audit trail with timestamps, actor ID, role, action type

### Information Disclosure
- **Threat**: Bid amounts leaked before deadline
- **Mitigation**: Encryption + time-lock + access control + audit logging of decryption attempts

### Denial of Service
- **Threat**: Attacker floods bid creation or prevents legitimate sealing
- **Mitigation**: (Deferred to Sprint 5: Rate limiting, CAPTCHA, request signing)

### Elevation of Privilege
- **Threat**: Supplier views/modifies other bids; Observer accesses sealed bids
- **Mitigation**: Role-based guards enforce strict separation; service layer validates ownership

---

## ZETA Integration (Advisory-Only Constraint)

**ZETA CANNOT:**
- Decrypt or view sealed bid amounts (before or after deadline)
- Access raw bid documents
- Make decisions that affect bid status or visibility

**ZETA CAN:**
- Analyze audit logs (action types, timestamps, actor roles, patterns)
- Flag anomalies: e.g., supplier creating bids for same tender > 10 times (system abuse), PMU accessing logs outside business hours (compliance concern)
- Generate guidance on COI disclosure requirements (advisory only)

**Implementation:**
```typescript
// In BidService.decryptAmount():
// This method exists for PMU/PRAZ post-deadline, NOT for ZETA
// BidService.exports never include decryption in ZETA-accessible methods

// ZETA queries AuditLog only:
const auditActions = await auditRepo.find({
  where: { targetType: 'Bid', actionType: 'SEAL_BID' },
  select: ['actionType', 'timestamp', 'actorRole', 'targetId'], // No payload
});
```

---

## API Examples

### 1. Create Draft Bid (Supplier)

```bash
curl -X POST http://localhost:3000/api/bids \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenderId": "tender-uuid-123",
    "amount": 95000
  }'
```

**Response:**
```json
{
  "id": "bid-uuid-456",
  "tenderId": "tender-uuid-123",
  "supplierId": "supplier-uuid",
  "encryptedAmount": "iv:ciphertext",
  "status": "Draft",
  "createdAt": "2025-01-15T10:00:00Z",
  "sealedAt": null,
  "coiDeclaration": null
}
```

### 2. Seal Bid with COI (Supplier)

```bash
curl -X POST http://localhost:3000/api/bids/bid-uuid-456/seal \
  -H "Authorization: Bearer $SUPPLIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coiDeclaration": {
      "company": "ABC Tech Solutions",
      "conflicts": "None known",
      "affiliations": ["Local Chamber of Commerce"],
      "disclosedInterests": []
    }
  }'
```

**Response:**
```json
{
  "id": "bid-uuid-456",
  "status": "Sealed",
  "sealedAt": "2025-01-15T10:05:00Z",
  "coiDeclaration": { ... },
  "encryptedAmount": "iv:ciphertext"
}
```

### 3. View Own Bids (Supplier)

```bash
curl -X GET http://localhost:3000/api/bids/my-bids \
  -H "Authorization: Bearer $SUPPLIER_TOKEN"
```

### 4. View Sealed Bid After Deadline (PMU Officer)

```bash
# Only works if tender deadline has passed
curl -X GET http://localhost:3000/api/bids/bid-uuid-456 \
  -H "Authorization: Bearer $PMU_TOKEN"
```

**Response (with decrypted amount visible internally, encrypted in transit):**
```json
{
  "id": "bid-uuid-456",
  "status": "Sealed",
  "sealedAt": "2025-01-15T10:05:00Z",
  "coiDeclaration": { ... },
  "encryptedAmount": "iv:ciphertext" // Still encrypted for audit purposes
}
```

---

## Postman Collection

**Import this into Postman:**

```json
{
  "info": { "name": "ZETS Bid Vault (Sprint 3)", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "item": [
    {
      "name": "Supplier - Create Draft Bid",
      "request": {
        "method": "POST",
        "url": { "raw": "{{base_url}}/api/bids", "host": ["localhost:3000"] },
        "header": [
          { "key": "Authorization", "value": "Bearer {{supplier_token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": { "mode": "raw", "raw": "{\"tenderId\": \"{{tender_id}}\", \"amount\": 95000}" }
      }
    },
    {
      "name": "Supplier - Seal Bid",
      "request": {
        "method": "POST",
        "url": { "raw": "{{base_url}}/api/bids/{{bid_id}}/seal", "host": ["localhost:3000"] },
        "header": [
          { "key": "Authorization", "value": "Bearer {{supplier_token}}" }
        ],
        "body": { "mode": "raw", "raw": "{\"coiDeclaration\": {\"company\": \"ABC Ltd\", \"conflicts\": \"None\"}}" }
      }
    },
    {
      "name": "PMU - View Sealed Bid (After Deadline)",
      "request": {
        "method": "GET",
        "url": { "raw": "{{base_url}}/api/bids/{{bid_id}}", "host": ["localhost:3000"] },
        "header": [
          { "key": "Authorization", "value": "Bearer {{pmu_token}}" }
        ]
      }
    }
  ]
}
```

---

## Key Decisions & Trade-offs

### Decision 1: AES-256-CBC vs. AES-256-GCM
- **Chosen**: CBC (simpler, deterministic, well-understood)
- **Tradeoff**: GCM adds authentication tag (detects tampering) but requires careful IV handling
- **Rationale**: Prototype prioritizes simplicity; audit logs provide tampering detection
- **Future**: Migrate to GCM for authenticated encryption (Sprint 5)

### Decision 2: Server-Side vs. Client-Side Encryption
- **Chosen**: Server-side
- **Rationale**:
  - Simpler key management (centralized)
  - Consistent encryption across all clients (mobile, web, SMS)
  - ZETA doesn't need plaintext (audits on ciphertext)
- **Caveat**: Network layer must use TLS (ensures transport security)

### Decision 3: Time-Lock at Application vs. Database Layer
- **Chosen**: Application layer (service method)
- **Rationale**:
  - Cross-database compatible (portability for PRAZ integration)
  - Easy to test and reason about
  - Works with TypeORM/Sequelize/any ORM
- **Future**: Add database-level triggers for hardened security posture (Sprint 5)

### Decision 4: Immutability Strategy
- **Chosen**: Cryptographic hash chain (not full immutability)
- **Rationale**:
  - Simpler to implement (no external dependencies)
  - Sufficient for prototype-level audit trails
  - Enables forensic tamper detection
- **Caveat**: Attacker with write access to audit table can forge chain
- **Future**: Implement external immutable log (blockchain-inspired or AWS Audit Manager) for production (Sprint 5)

---

## Testing

### Unit Tests (bid.service.spec.ts)

```bash
npm run test -- bid.service.spec.ts
```

Covers:
- Encryption/decryption round-trip
- Hash chain computation and tampering detection
- Time-lock logic (seal after deadline fails)
- COI validation (required before seal)
- Role-based access control (supplier vs. PMU vs. observer)

### e2e Tests (bid.controller.e2e.spec.ts)

```bash
npm run test:e2e -- bid.controller.e2e.spec.ts
```

Covers:
- Create draft bid (success, missing fields fail, wrong role fails)
- Seal bid with COI (success, missing COI fails, after deadline fails)
- View own bids (supplier only)
- Cross-supplier isolation (supplier cannot view/seal other bids)
- PMU time-lock enforcement (cannot view before deadline)

**Setup:**
- Requires test Postgres instance (set `DB_NAME=zets_test`)
- Seed script creates sample users + tenders
- Each test creates isolated data

---

## Deployment & Configuration

### Environment Variables

Add to `.env`:
```bash
# Encryption
ENCRYPTION_KEY=your-256-bit-key-hex-or-base64-here

# JWT
JWT_SECRET=your-jwt-signing-secret

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/zets_dev
```

### Key Rotation Strategy (Future)

1. Generate new key
2. Decrypt all active bids with old key
3. Re-encrypt with new key (with new IV)
4. Update `ENCRYPTION_KEY` env
5. Retire old key

---

## Supervisor Alignment

### How This Sprint Advances Anti-Corruption Goals

1. **Sealed-Bid Integrity**: Bids remain confidential until deadline, preventing insider knowledge of competitors' amounts
2. **Audit Accountability**: Every action (create, seal, view attempt) logged with hash chain; facilitates PRAZ oversight
3. **COI Transparency**: Mandatory declarations force suppliers to disclose potential conflicts; ZETA flags high-risk patterns
4. **Role Separation**: Strict RBAC prevents PMU premature bid access; Public_Observer sees only anonymized summaries

### ZETA Readiness

Sprint 3 creates the foundation for ZETA anomaly detection:
- **Pattern detection** on audit logs (e.g., supplier behavior, timing anomalies)
- **Compliance flagging** (e.g., PMU access outside business hours → investigation trigger)
- **COI analysis** (e.g., supplier X affiliated with PMU officer Y → conflict flag)
- **No sealed-bid access**: ZETA never sees amounts, preserving bid confidentiality

### Compliance Mapping

| PPDPA/PRAZ Requirement | Mechanism | Sprint 3 Implementation |
|---|---|---|
| Sealed-bid confidentiality (§4.2) | Encryption + time-lock | AES-256 + deadline check |
| Audit trail (§5.1) | Append-only logs | Hash-chain on AuditLog |
| COI declarations (§6.3) | Mandatory + immutable | Enforced before seal |
| RBAC (§7) | Role-based access | Guards + service layer checks |

---

## Known Limitations & Future Work

1. **Key Management**: Prototype uses shared env key. Production needs KMS integration.
2. **True Immutability**: Audit logs still writable by admin. Sprint 5: External immutable log.
3. **Time Synchronization**: Assumes server clock accurate. Add NTP validation in hardening phase.
4. **Performance**: 100k PBKDF2 iterations costs ~100ms per encryption/decryption. Profile and optimize.
5. **Scalability**: Per-bid hash chain verification is O(n); optimize with Merkle trees (Sprint 5).

---

## Running Sprint 3

### Build

```bash
cd services/api
npm run build
```

### Seed Database

```bash
node dist/scripts/seed.js
```

Sample output:
```
Created user supplier@example.com with password: Password123!
Created user pmu_officer@example.com with password: Password123!
Created tender: Supply of office chairs
Created draft bid for tender: Supply of office chairs
Created sealed bid for past-deadline tender
```

### Run Tests

```bash
npm run test -- bid.service.spec.ts
npm run test:e2e -- bid.controller.e2e.spec.ts
```

### Local Development

```bash
docker compose restart
npm run dev  # Watch mode with ts-node-dev
```

### Manual Testing

Use curl/Postman examples above to verify:
1. Supplier creates draft bid
2. Supplier seals bid with COI
3. Supplier views own bid
4. PMU denied access to bid before deadline
5. PMU can view bid after deadline (time-lock confirmed)

---

## Git Commit Message

```
chore(sprint-3): implement secure bid vault with AES-256, time-lock, COI, and hash chain

- Add Bid entity with encryption support (encryptedAmount, encryptedDocuments)
- Implement AES-256-CBC encryption utility with PBKDF2 key derivation
- Create BidService with time-lock sealing (deadline check)
- Enforce mandatory COI declarations before bid sealing
- Implement append-only hash-chain verification on audit logs
- Add BidController with role-based access (Supplier, PMU_Officer, PRAZ_Regulator, Public_Observer)
- Create MinIO integration stub for document management
- Update seed script to generate sample bids (draft + sealed)
- Add comprehensive unit tests (encryption, hash chain, RBAC, COI)
- Add e2e tests (create, seal, access control, time-lock)
- Add README_SPRINT3.md with security rationale, STRIDE threat model, API examples
- Comply with PRAZ/PPDPA anti-corruption and audit requirements
- Maintain advisory-only ZETA constraint (no sealed bid access)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

---

## Next Steps: Sprint 4 (ZETA AI Integration)

Sprint 4 will focus on:
1. **ZETA Anomaly Detection**: Pattern analysis on audit logs for fraud indicators
2. **AI Guidance**: Non-invasive prompts to suppliers on bid requirements, COI, low-connectivity support
3. **Transparency Dashboard**: Anonymized bid summaries, compliance metrics for public oversight
4. **SMS Notifications**: Africa's Talking integration for rural suppliers (low-bandwidth fallback)

---

*End of README_SPRINT3.md*
