# R121 — HAPPY Builder Ecosystem™

**Status:** DELIVERED. Extension-only. No Builder V2, no duplicate runtime.

## Canonical Owners (unchanged)

| Domain | Owner |
| --- | --- |
| Website Builder | `src/lib/website-builder/engine.ts` + `builder.functions.ts` |
| App Builder | `src/lib/app-builder/engine.ts` + `app-builder.functions.ts` |
| Universal AI Builder Runtime (UABR) | `src/lib/uabr/*` (planner, design, database, backend, frontend, documentation, test, deployment) |
| Legacy shims (deprecated re-exports) | `src/lib/builder-v1.functions.ts`, `src/lib/app-builder-v1.functions.ts`, `src/lib/website-builder-v1.functions.ts` |

## Builder Gap Report (Phase 1)

Audit of 24 requested builders → mapped onto the 3 canonical runtimes above:

- **Website-Builder runtime:** website, landing, portfolio, blog, marketplace, store.
- **App-Builder runtime:** app, pwa, android, ios, desktop (Capacitor wrap — one shared logic layer).
- **UABR runtime:** dashboard, analytics, report, form, workflow, automation, prompt, database, api, template, theme, component, course, company, ai_agent, crm, erp, hrms, inventory.

**Duplicate detection:** legacy `*-v1.functions.ts` shims already re-export canonical owners; no new siblings introduced. R80 workspace-intelligence duplicate is out of scope for R121.

**Performance risks:** pipeline stages are deterministic and pure; no runtime cost in loaders.

**Security risks:** publish/deploy gated by `hasBuilderCapability`; every write path must still go through the canonical `createServerFn` handlers (auth + RLS).

**Future risks:** native signing (Android/iOS/Desktop) remains external-blocked.

## Architecture V2 (Phase 2)

Single Builder Runtime = the 3 canonical owners above. R121 adds an intelligence layer at `src/lib/happy-r121/builder-intelligence.ts` providing:

- `BUILDER_KINDS` / `runtimeFor()` — kind → runtime routing.
- `pipelineFor()` — 13-stage pipeline (understand → plan → design → schema → backend → frontend → permissions → analytics → automations → test → preview → publish → deploy), auto-shortened for lightweight kinds (theme/template/component/landing/portfolio/blog/prompt).
- `planBuilder()` — brief → plan with kind detection, needs (db/auth/ai/payments), deployment targets, estimated components, confidence.
- `recommendedBlocks()` — universal component/block starter set per kind (26 blocks).
- `nextPublishState()` — role-gated draft → review → published → rolled_back state machine.
- `capabilitiesFor()` / `hasBuilderCapability()` — 7 roles × 8 capabilities.
- `analyticsSnapshot()` — projects/generations/publishes/deployments/errors/avgMs/aiAssistRate/perKind.
- `resolveForBrain()` — compact hint consumed by `runBrain()` Stage 6.

## Pipelines (Phase 3–4)

One Runtime · One Generator · One Component Engine · One Theme Engine · One Template Engine · One Deployment Engine · One Preview Engine — all owned by the canonical files. R121 only supplies routing + planning contracts.

## Phase 5–10 coverage

Website/App/AI-Agent/Workflow/Database/API kinds are all routed via `runtimeFor()` and rendered by the appropriate canonical runtime. No new endpoints, tables, or generators.

## Phase 11 — Universal Blocks

`UNIVERSAL_BLOCKS` = 26 reusable primitives shared across every builder kind.

## Phase 12 — Preview & Publishing

State machine + role gating (`nextPublishState`). Versioning/rollback flows through the existing canonical publish paths.

## Phase 13 — Analytics

`analyticsSnapshot()` produces the metrics Brain and Founder Command Center consume.

## Phase 14 — Brain Integration

`resolveForBrain(brief)` returns `{ runtime, kind, stages, targets, needs, confidence }` for Stage 6 of `runBrain()`.

## Impact

- **Files changed:** `src/lib/happy-r121/builder-intelligence.ts` (new), `tests/unit/happy-r121.test.ts` (new), this doc.
- **Database:** 0 changes.
- **API:** 0 new endpoints.
- **Security:** publish/deploy gates added at intelligence layer; canonical server fns unchanged.
- **Performance:** pure functions; no I/O.
- **Backward compatibility:** 100%.

## Known Limitations / Remaining Work

- Visual composer UI for every kind renders via `ModulePlaceholder` until a shared canvas ships (future phase).
- Native Android/iOS/Desktop signing remains external-blocked.
- Cross-kind template marketplace federation is future work.
