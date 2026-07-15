# HAPPY — Master Project Index

**Owner:** H.P PRIVATE LIMITED
**Product family:** HAPPY (AI • Brain • OS • Digital Human • Enterprise Platform)
**Runtime:** TanStack Start v1 + React 19 + Vite 7 + Tailwind v4, deployed on Cloudflare Workers
**Backend:** Lovable Cloud (Supabase — Postgres + Auth + Storage + Realtime)
**Last consolidated:** R6 pass (2026-07-15)

This index is the single entry point into every consolidated knowledge file. All other master docs live beside this one under `docs/`.

## Master documents

| Doc | Purpose |
|---|---|
| [MASTER_PROJECT_INDEX.md](./MASTER_PROJECT_INDEX.md) | This file — orientation + doc map |
| [MASTER_MODULES.md](./MASTER_MODULES.md) | Every product / module / surface, grouped |
| [MASTER_STATUS.md](./MASTER_STATUS.md) | Honest WORKING / PARTIAL / STUB / MISSING matrix (mirrors `STATUS.md`) |
| [MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md) | Runtime, routing, services, RPC, security layers |
| [MASTER_DATABASE.md](./MASTER_DATABASE.md) | Every Supabase table + views + migrations |
| [MASTER_APIS.md](./MASTER_APIS.md) | Every server function group + public HTTP routes |
| [MASTER_FEATURES.md](./MASTER_FEATURES.md) | Feature inventory per product surface |
| [MASTER_ROADMAP.md](./MASTER_ROADMAP.md) | Roadmap v2 → v17 map, phases 2 → 15 |
| [MASTER_AUDITS.md](./MASTER_AUDITS.md) | R1 → R6 implementation audit trail |
| [MASTER_IMPLEMENTATION_STATUS.md](./MASTER_IMPLEMENTATION_STATUS.md) | Per-module implementation state |
| [MASTER_FUTURE_PLAN.md](./MASTER_FUTURE_PLAN.md) | Post-R6 execution plan and blockers |

## Source-of-truth pointers

- **Runtime status (canonical):** `docs/STATUS.md`
- **Architecture cards (intent, not shipped):** `docs/architecture/*.md` (56 files)
- **Release notes:** `docs/release/HAPPY-INFINITY-v1.md`
- **Engineering handbook:** `docs/HAPPY-X-Enterprise-Engineering-Handbook-v1.0.md`
- **Design system:** `docs/design-system/README.md`
- **Digital Human asset spec:** `docs/digital-human-assets.md`
- **Financial foundation spec:** `docs/architecture/financial-foundation.md`
- **Notification platform spec:** `docs/architecture/notification-platform-v1.md`
- **Plan file:** `.lovable/plan.md`

## Repo shape (2026-07-15)

- `src/routes/` — 391 authenticated routes + 10 public + 4 `/api/*` route files
- `src/lib/*.functions.ts` — 233 server function modules (`createServerFn`)
- `src/lib/happy-tools.server.ts` — HAPPY tool-calling registry
- `src/services/domain/*.service.ts` — 20 domain services
- `src/services/core/`, `src/services/middleware.ts` — service infra
- `src/components/{business,cmos,creator,digital-human,education,enterprise,founder,happyx,hyperlocal,knowledge,ui}` — feature surfaces
- `supabase/migrations/*.sql` — 15 migrations (~115 tables, RLS-locked)
- `src/routes/api/dh.tts.ts` — Digital Human TTS pipeline
- `src/routes/api/{robots.txt,sitemap.xml}.ts` — SEO endpoints
- `src/routes/api/public/v1/*` — Public HTTP APIs (webhook-safe prefix)

## Certification rule (unchanged)

Only these are certified WORKING end-to-end after R6:
- Founder Command Center (`/founder`)
- Notification Center (`/notifications`)
- HAPPY ↔ Platform tool-calling
- Revenue Cloud (`/billing` invoices + payments + MRR/ARR)
- Financial Foundation (plans, subscriptions, wallet, credits — ledger-backed, immutable)

Everything else is honestly labeled PARTIAL, STUB, or MISSING. See `MASTER_STATUS.md`.
