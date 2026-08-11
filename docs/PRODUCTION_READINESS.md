# ZETS Production Readiness Guide

This document covers running ZETS in a containerised production environment, activating the real ZETA LLM backend, and running end-to-end tests.

## 1. Containerisation

Multi-stage Dockerfiles are provided for both services:

- `services/api/Dockerfile` — builds the NestJS API and runs it in a small `node:20-alpine` production image.
- `apps/web/Dockerfile` — builds the Next.js app and runs it in a small `node:20-alpine` production image.

### Local Docker Compose stack

```bash
# Copy the example environment file and set real secrets
cp .env.example .env
# Edit .env and set JWT_SECRET, ENCRYPTION_KEY, and optionally OPENAI_API_KEY

# Build and run the full stack (Postgres, Redis, MinIO, API, web)
docker compose up --build -d

# View API logs
docker compose logs -f api

# View web logs
docker compose logs -f web
```

The web app is available at `http://localhost:3000` and proxies `/api/*` to the API container on the internal Docker network.

## 2. Activating ZETA with a real LLM

By default ZETA uses a deterministic `FakeLLM` fallback so the system works without external API keys. To enable a real model:

1. Obtain an OpenAI API key.
2. Add it to `.env`:
   ```env
   OPENAI_API_KEY=sk-...
   ```
3. Restart the API container:
   ```bash
   docker compose up -d --build api
   ```

ZETA will then call `gpt-4o-mini` through the LangChain `ChatOpenAI` adapter, still constrained by the same PRAZ knowledge base and safety prompt.

To switch to a different provider (Claude, Gemini, Ollama, etc.), add the relevant `@langchain/*` package and update `services/api/src/ai/zeta.langchain.ts`.

## 3. End-to-End Tests with Playwright

Playwright is configured in `apps/web`.

### Install browsers (one-time)

```bash
cd apps/web
npx playwright install chromium
```

### Run the stack under test

```bash
# From the repository root
docker compose up --build -d
```

### Run the tests

```bash
cd apps/web
npx playwright test
```

The critical-path test (`e2e/offline-bid.spec.js`) covers:
1. Seeding a Supplier and a published tender via the API.
2. Logging the supplier into the web portal.
3. Navigating to the offline bid-draft page.
4. Simulating a network outage with Playwright.
5. Saving a bid draft locally.
6. Restoring connectivity.
7. Syncing the draft to the API.
8. Verifying the bid appears in the supplier portal.

### CI configuration notes

- Use `PLAYWRIGHT_BASE_URL` to point tests at a deployed environment if not running locally.
- Use `API_BASE_URL` to tell the test utilities where the API is listening.
- Run Playwright with `npx playwright test --reporter=list` in CI for concise output.
