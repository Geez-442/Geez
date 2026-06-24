# ZETS + ZETA Master Blueprint
**Project Title**: Design and Implementation of a Secure Zimbabwe Electronic Tender Issuing System (ZETS) with Embedded AI Assistant (ZETA) for Enhanced Transparency, Compliance, and Anti-Corruption in Public Procurement

**Student**: Gerald Gwashavanhu (r226871T)  
**Programme**: BSc Honours Computer Systems Engineering  
**Research Area**: Software Engineering and Development  

## Core Proposal Excerpts (Use Verbatim Where Needed)
"This research proposes the design and implementation of the Zimbabwe Electronic Tender Issuing System (ZETS) and its embedded AI assistant ZETA (Zimbabwe E-Tender Assistant) — a research-grade prototype that explores what a more complete, accessible, and corruption-resistant e-procurement platform looks like within Zimbabwe's legal and institutional context."

"To design, implement, and critically evaluate ZETS — a secure, PRAZ-compliant electronic tender issuing system, together with ZETA, an embedded intelligent AI assistant, in order to enhance procurement transparency, reduce structural opportunities for corruption, and improve accessibility for SMEs and underserved participants in Zimbabwe's public procurement ecosystem."

## Zimbabwe-Specific Tailoring & Relevance
- **Context**: Aligns with PRAZ eGP system (launched Oct 2023, phases include e-registration, e-bidding, evaluation, contract management). Addresses gaps in offline access, SME inclusion (low digital literacy, rural connectivity), full-lifecycle auditability, and intelligent oversight across 700+ entities.
- **Pain Points Addressed** (from X sentiment & literature): Tenderpreneurism, bribes, exclusion of genuine SMEs/Zimbabwean businesses, opaque awards, collusive bidding. ZETS counters with PWA/offline, simple ZETA guidance, public dashboards, anomaly flags.
- **Supervisor Alignment**: AI (ZETA) is central with detailed prompts/data; SMART objectives; security/CS depth (crypto, RBAC, LangChain); compliance matrix; synthetic data plan; human touch via iterative testing.

## System Prompt for Agent (Paste Verbatim)
```
You are ZETS-Builder, an expert engineering agent. Your goal: design, implement, test, and document a secure, PRAZ-compliant electronic tender issuing system (ZETS) and embedded advisory AI (ZETA). Work iteratively in two-week sprints. Always produce: (a) design artefacts (ERD, API spec, threat model, data flows), (b) complete runnable code scaffolding with explanations, (c) test plan (unit + integration), (d) Docker deployment recipe, (e) evaluation report snippet. 

Constrain ZETA to advisory mode only; never generate/reveal sealed bid contents. Log all decisions. Produce a short supervisor summary at each sprint end. Follow Zimbabwe procurement law (PPDPA Act [Chapter 22:23], PRAZ Manual, Constitution §315, eGP modules). 

Guardrails: Strict role separation (Supplier, PMU Officer, PRAZ Regulator, Public Observer); cryptographic bid vault (AES-256 + time-lock); append-only audit chain; offline PWA support; explainability for LLM/ML components. Cite sources for policy/legal claims. Use Next.js 15 (App Router, PWA), NestJS + TypeScript, PostgreSQL + Drizzle, MinIO, Redis, Africa's Talking SMS, LangChain + Claude (or fallback).
```

## Role-Specific Prompts (Feed to Agent as Needed)
- **Architect**: "Produce high-level architecture diagram (Mermaid), component list, data flows, and minimal tech stack justification tailored to low-bandwidth Zimbabwe (Next.js SSR, PWA, etc.)."
- **Security Engineer**: "Produce STRIDE threat model, OWASP Top 10 test cases for bid vault/auth, encryption key lifecycle, and audit log implementation."
- **Data/AI Engineer**: "Specify datasets (synthetic + public), feature engineering for anomaly detection (e.g., bid patterns, collusion indicators), training pipeline, and synthetic data generation script. Reference OECD.AI/Ivalua practices."
- **Frontend Engineer**: "Produce PWA offline flow (service workers for bid prep), accessibility checklist (WCAG for low-literacy), mobile-first UI with Tailwind/shadcn."
- **ZETA Specialist**: "Refine LangChain orchestration with retrieval (PRAZ rules), tool calling for flagging, and grounded responses."

## ZETA System Prompt (Core - Embed in Code)
```
You are ZETA, an advisory assistant for ZETS (Zimbabwe E-Tender Assistant). Provide role-differentiated guidance: explain PRAZ rules/eGP processes, flag SPOC escalation conditions, surface bidding pattern anomaly alerts (without accessing sealed bids). 

When uncertain: "INSUFFICIENT DATA — ESCALATE TO HUMAN". Log all advice with citations to legal sources (PPDPA, PRAZ Manual). Maintain explainability and human-in-the-loop. Never make binding decisions.
```

## Sprint-by-Sprint Prompt Sequence (Iterative - Feed One at a Time)
Use the general System Prompt + role prompts per sprint. At sprint end: "Produce deliverables, list open risks, next sprint plan, and supervisor summary."

1. **Sprint 0: Setup** — "Create monorepo (Turborepo), Git setup, Docker Compose (Postgres/MinIO/Redis), CI basics (GitHub Actions), and detailed README with sprint cadence + Zimbabwe context."
2. **Sprint 1: Auth & Roles** — "Implement RBAC (4 roles), PRAZ vendor verification stub, JWT + refresh, unit tests."
3. **Sprint 2: Tender Publication** — "API + UI for tender CRUD (≥5 types), publication workflow, acceptance tests."
4. **Sprint 3: Bid Vault** — "Encrypted vault (AES-256), time-lock sealing, COI declarations, append-only hash chain audit log."
5. **Sprint 4: ZETA Basic** — "LangChain skeleton, system prompt integration, Q&A validation, sandboxed calls (advisory only)."
6. **Sprint 5: Anomaly Detection** — "Bidding pattern detector (rules + simple ML/LLM), synthetic dataset, evaluation metrics (e.g., Isolation Forest style patterns for collusion/red flags)."
7. **Sprint 6: Offline & Dashboard** — "PWA offline bid editor, public transparency dashboard (live notices, awards, spend analytics with Chart.js, APP comparisons)."
8. **Sprint 7+: Final** — "OWASP pentest, usability study (10+ participants, think-aloud), full compliance mapping vs. PPDPA/eGP, dissertation sections, polish."

## Data, Training, Ethics & Synthetic Strategy
- **Sources**: PRAZ Manual, Standard Bidding Documents, eGP public info, simulated logs. Generate synthetic tenders/bids (JSON/CSV) with realistic Zimbabwe elements (categories, procuring entities, patterns for anomalies like unusual win rates, rapid bid clustering).
- **Anomaly Features**: Bid amount deviations, supplier collusion signals, timing anomalies, COI flags.
- **Ethics**: Advisory-only; audit every ZETA interaction; human oversight; no real personal data. Follow OECD.AI guidelines for high-stakes governance.

## Deliverables (Per Sprint)
- Design artefacts (diagrams, specs)
- Code + tests
- Deployment scripts
- Evaluation report snippet
- Supervisor summary (ties to objectives, risks, AI centrality)

## Risks & Mitigations (Register)
- Connectivity: PWA + throttled testing.
- AI Hallucinations: Grounded retrieval + "escalate" rule.
- Scope Creep: Prioritize vault + ZETA.
- Compliance: Maintain mapping table.

## Evaluation Plan
- Functional vs. SMART objectives.
- Security: OWASP ZAP.
- Usability: Think-aloud sessions.
- AI: Accuracy of guidance/anomalies on synthetic data.
- Compliance: Matrix against PPDPA/eGP modules.

## Work Plan & References
[Insert your original table; update dates iteratively.]  
References: Your proposal list + PRAZ eGP docs, OECD.AI, relevant papers on procurement ML.

**Next Action for Gerald**: Confirm and I'll generate the exact Sprint 0 agent prompt + full repo scaffold code/README. We iterate from there—test each sprint thoroughly before moving on.
