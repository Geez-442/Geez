# ZETS AI Service (ZETA)

Purpose (Sprint 0)
- Placeholder and strategy document for ZETA: the advisory AI assistant for ZETS.
- Sprint 0 includes design notes, system prompts, and safe integration guidance. No LLM keys or production calls are made in Sprint 0.

Design & Strategy (high-level)
- Advisory-only: ZETA must never access sealed-bid content. All responses should be auditable and logged.
- LangChain (or equivalent) will be used in Sprint 4 for orchestration, with a retrieval layer that indexes PRAZ rules and synthetic examples.
- Local dev: provide a mock adapter that returns deterministic, testable responses for UI integration.

Sprint roadmap for services/ai
- Sprint 0: document prompts and create mock adapter.
- Sprint 4: implement LangChain orchestration, retrieval (vector DB), and prompt templates.
- Sprint 5: evaluation and anomaly-detection integration.

Safety
- Log all ZETA interactions.
- Require human confirmation for any suggestion that would materially affect procurement outcomes.

