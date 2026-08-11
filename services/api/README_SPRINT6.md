# ZETS Sprint 6 — Offline PWA + Public Transparency Dashboard

## Overview

Sprint 6 makes ZETS usable in low-connectivity environments and opens a public, read-only transparency dashboard. This directly addresses the Zimbabwe context: many SMEs and rural suppliers have intermittent data, and citizens/journalists need accessible oversight without requiring an account.

## What was delivered

### Backend (`services/api`)

- `src/public/`
  - `public.module.ts` — NestJS module wiring.
  - `public.service.ts` — read-only aggregator for published tenders, awarded tenders, and anonymised anomaly flag statistics.
  - `public.controller.ts` — unauthenticated endpoints:
    - `GET /api/public/tenders`
    - `GET /api/public/awards`
    - `GET /api/public/stats`
  - Endpoints are decorated with `@Public()` so the existing `JwtAuthGuard` / `RolesGuard` allow anonymous access.
  - No sealed-bid contents, supplier identities, or raw audit payloads are exposed.

### Frontend (`apps/web`)

- `app/public/page.js` — public transparency dashboard:
  - Lists open tenders with title, procuring entity, type, deadline, and budget.
  - Lists award notices with award date and decision note.
  - Shows aggregate oversight metrics: open tenders, awarded tenders, total anomaly flags, and pending review count.
  - Works offline via the service worker; cached shell renders even when the API is unreachable.

- `app/offline/bid-draft/page.js` — offline bid draft editor:
  - Supplier can compose drafts without a connection.
  - Drafts (tender ID, amount, COI data) are stored in `localStorage`.
  - Sync button pushes saved drafts to `POST /api/bids` using the stored JWT once the user is online.
  - Shows real-time online/offline status and preserves drafts that fail to sync.

- PWA shell:
  - `public/manifest.json` — installable app metadata.
  - `public/sw.js` — service worker that caches the shell, offline fallback, and API offline responses.
  - `app/components/ServiceWorkerRegister.js` — registers the worker on the client.
  - `public/offline.html` — fallback page shown when navigating offline.
  - `app/layout.js` updated to link the manifest and set theme colour.

- Navigation:
  - Home page now links to both `/public` and `/offline/bid-draft`.

## Security & privacy notes

- The public API only returns tender metadata and **aggregated** anomaly counts.
- Bid amounts, sealed contents, supplier identities, and audit log details remain protected.
- Offline drafts are stored client-side; they are only submitted after the user signs in and chooses to sync.

## API examples

Open tenders:

```bash
curl "http://localhost:3001/api/public/tenders"
```

Award notices:

```bash
curl "http://localhost:3001/api/public/awards"
```

Transparency stats:

```bash
curl "http://localhost:3001/api/public/stats"
```

## Running

```bash
cd services/api
npm run build
# start API
npm run start

cd ../web
npm run build
npm run start
```

## Verification

- API build: `npm run build` in `services/api`
- API tests: `npm test` in `services/api`
- Web build: `npm run build` in `apps/web`

## Next steps (Sprint 7+)

- Final hardening: OWASP-style dependency checks, input sanitisation review, rate-limiting across public routes.
- Compliance matrix and dissertation write-up.
- Optional: push notifications for new tenders / award announcements, SMS fallback integration.
