# ZETS Dissertation Outline

**Title**: Design and Implementation of a Secure Zimbabwe Electronic Tender Issuing System with an Embedded AI Assistant

**Student**: Gerald Gwashavanhu (r226871T)  
**Programme**: BSc Honours Computer Systems Engineering

## Abstract

A concise summary (~300 words) covering: the problem of tenderpreneurism, opacity, and low SME participation in Zimbabwean public procurement; the ZETS+ZETA research-grade prototype; key technical contributions (role-aware RBAC, AES-256 sealed-bid vault, hash-chain audit, anomaly detection, PWA/offline access, public dashboard); and an evaluation of strengths, limitations, and future work.

## Chapter 1: Introduction

1.1 Background to public procurement in Zimbabwe  
1.2 Problem statement: corruption risks, digital exclusion, information asymmetry  
1.3 Research aim and objectives  
1.4 Scope and delimitations  
1.5 Dissertation structure

## Chapter 2: Literature Review

2.1 Public procurement regulation in Zimbabwe (PPDPA Act, PRAZ mandate)  
2.2 E-procurement systems and e-Government Procurement (eGP)  
2.3 Sealed-bid integrity, cryptographic time-locking, and audit trails  
2.4 AI in procurement oversight: opportunities and risks  
2.5 Low-bandwidth / offline-first interfaces for developing contexts  
2.6 Gaps addressed by ZETS

## Chapter 3: Requirements and System Design

3.1 Stakeholder analysis (PRAZ, PMU officers, suppliers, public observers)  
3.2 Functional requirements mapped to sprints  
3.3 Non-functional requirements: security, performance, accessibility, auditability  
3.4 STRIDE threat model summary  
3.5 Architecture diagram and data-flow description  
3.6 Technology stack justification

## Chapter 4: Implementation

4.1 Sprint 0 – Scaffold and CI  
4.2 Sprint 1 – Authentication and RBAC  
4.3 Sprint 2 – Tender publication workflow  
4.4 Sprint 3 – Secure bid vault (encryption, time-lock, COI, hash chain)  
4.5 Sprint 4 – ZETA AI advisory service  
4.6 Sprint 5 – Anomaly detection for procurement oversight  
4.7 Sprint 6 – Offline PWA and public transparency dashboard  
4.8 Sprint 7+ – Final hardening and compliance mapping

## Chapter 5: Security and Compliance Analysis

5.1 OWASP Top 10 / API Security mapping  
5.2 Cryptographic analysis of the bid vault  
5.3 Audit-trail integrity analysis  
5.4 ZETA safety constraints and advisory-only design  
5.5 PRAZ/PPDPA compliance matrix  
5.6 Known limitations and residual risks

## Chapter 6: Testing and Evaluation

6.1 Unit test strategy and coverage  
6.2 E2E / integration test scenarios  
6.3 Performance and accessibility evaluation  
6.4 Security review checklist  
6.5 Comparison with existing systems

## Chapter 7: Conclusion and Future Work

7.1 Summary of contributions  
7.2 Reflection on research objectives  
7.3 Recommendations for production deployment  
7.4 Future research directions

## References

- PPDPA Act [Chapter 22:23]
- PRAZ e-Government Procurement Strategy and Manual
- OECD Public Procurement Reviews
- OWASP API Security Top 10 2023
- NIST guidance on cryptographic key management and audit logs
- Relevant AI governance guidelines (OECD.AI, EU AI Act)

## Appendices

A. API endpoint reference  
B. Database ERD  
C. Sprint READMEs  
D. Test logs and screenshots  
E. User-interface wireframes
