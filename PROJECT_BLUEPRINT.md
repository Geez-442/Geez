# ZETS + ZETA Master Blueprint

**Project Title**: Design and Implementation of a Secure Zimbabwe Electronic Tender Issuing System (ZETS) with Embedded AI Assistant (ZETA)

**Student**: Gerald Gwashavanhu (r226871T)
**Programme**: BSc Honours Computer Systems Engineering
**Research Area**: Software Engineering and Development

---

## Overview
This document is the authoritative Sprint 0 blueprint and prompt package for ZETS (Zimbabwe Electronic Tender Issuing System) and ZETA (Zimbabwe E-Tender Assistant). It contains: core proposal excerpts, Zimbabwe-specific tailoring, system and role prompts for the AI agent, a sprint sequence, ethical and data guidance, and sprint deliverables. Use this file as the single source of truth for development, research writeups, and supervisor summaries.

---

## Core Proposal Excerpts (Verbatim)
"This research proposes the design and implementation of the Zimbabwe Electronic Tender Issuing System (ZETS) and its embedded AI assistant ZETA (Zimbabwe E-Tender Assistant) — a research-grade prototype that explores what a more complete, accessible, and corruption-resistant e-procurement platform looks like within Zimbabwe's legal and institutional context."

"To design, implement, and critically evaluate ZETS — a secure, PRAZ-compliant electronic tender issuing system, together with ZETA, an embedded intelligent AI assistant, in order to enhance procurement transparency, reduce structural opportunities for corruption, and improve accessibility for SMEs and underserved participants in Zimbabwe's public procurement ecosystem."

---

## Zimbabwe-Specific Tailoring & Relevance
- Aligns with PRAZ eGP objectives (e-registration, e-bidding, evaluation, contract management), addressing gaps in offline access, SME inclusion, auditability, and intelligent oversight across 700+ public entities.
- Addresses real-world pain points: tenderpreneurism, favoritism, low SME participation (especially rural), opaque awards, and collusive bidding.
- Prioritises accessibility (PWA + SMS), strong cryptographic audit trails, explainable AI guidance, and time-locked bid sealing to preserve sealed-bid confidentiality.

---

## System Prompt (ZETS-Builder)

```
You are ZETS-Builder, an expert engineering agent assigned to develop a research-grade prototype (ZETS) and its advisory AI (ZETA). Work iteratively in two-week sprints. Produce: design artefacts (ERD, API spec, threat model), runnable scaffold code, test plan (unit + integration), Docker recipes, and evaluation notes.

Constrain ZETA to advisory-only: never access or reveal sealed bid contents. Log all advice and decisions. Follow Zimbabwe procurement law (PPDPA Act [Chapter 22:23], PRAZ Manual, Constitution §315) where referenced. Prioritise security, explainability, and SME accessibility.
```

---

## ZETA Core Prompt (Advisory Assistant)

```
You are ZETA, the Zimbabwe E-Tender Assistant. Provide role-differentiated, grounded guidance: supplier help (forms, eligibility), PMU assistance (checklists, thresholds), PRAZ analytics (anomaly summaries). Always cite legal/regulatory sources where applicable. When data is insufficient, respond: "INSUFFICIENT DATA — ESCALATE TO HUMAN". Never make binding procurement decisions.
```

---

## Role-Specific Prompts (Examples)
- Architect: "Produce a high-level architecture (Mermaid), component list, data flows, and a short justification for each choice tailored to low-bandwidth Zimbabwe contexts."
- Security Engineer: "Produce STRIDE analysis, OWASP Top 10 tests, encryption key lifecycle, and audit log design for append-only hash chains."
- Data/AI Engineer: "Specify synthetic dataset schema, anomaly features, training/evaluation approach, and a small synthetic data generator."
- Frontend Engineer: "Design a PWA offline flow, low-bandwidth UI patterns, and an accessibility checklist for low-literacy users."

---

## Sprint-by-Sprint Plan (High-Level)
1. Sprint 0 — Setup: Monorepo scaffold, Docker Compose (Postgres/MinIO/Redis/Adminer), CI skeleton, README with sprint cadence and decisions. (This file is Sprint 0 deliverable.)
2. Sprint 1 — Auth & Roles: Implement RBAC (Supplier, PMU_Officer, PRAZ_Regulator, Public_Observer), JWT stub, unit tests.
3. Sprint 2 — Tender Publication: Tender CRUD, publication workflow, acceptance tests.
4. Sprint 3 — Bid Vault: AES-256 encryption, time-lock sealing, COI declarations, append-only hash chain audit log.
5. Sprint 4 — ZETA Basic: LangChain skeleton, system prompt integration, sandboxed advisory calls.
6. Sprint 5 — Anomaly Detection: Rule-based + ML detector on synthetic data, evaluation metrics.
7. Sprint 6 — Offline & Dashboard: PWA offline editor, public transparency dashboard.
8. Sprint 7+ — Finalise: OWASP pentest, usability studies, compliance matrix, dissertation write-up.

---

## Data, Ethics & Synthetic Strategy
- Use public PRAZ materials, standard bidding documents, and synthetic data for training/evaluation. Do not use real personal or sensitive procurement data in development.
- Synthetic dataset should include realistic Zimbabwe features (procuring entities, local currency, SME profiles, collusion patterns).
- Ethics: ZETA remains advisory; every AI suggestion must be logged and auditable. Human-in-the-loop required for high-stakes decisions.

---

## Deliverables per Sprint
- Design artefacts (diagrams/specs)
- Code + tests
- Deployment scripts
- Evaluation notes and supervisor summary

---

## References
- PRAZ eGP documentation, PPDPA Act Chapter 22:23, OECD.AI guidelines, relevant procurement ML literature.

---

## Notes
This file should be kept up-to-date. Sprint 0 tasks in this repository implement the minimal scaffold required to begin Sprint 1. For any deviation, record the decision in the Sprint 0 Decisions & Rationale section in README.md.
