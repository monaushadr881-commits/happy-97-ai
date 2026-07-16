# R67 — HAPPY Universal AI Builder Runtime (UABR) v1.0

Non-destructive expansion. Freezes existing architecture, database, RBAC,
security, auth, credits, wallet, pricing, notifications, digital human,
release runtime, and cloud runtime. Adds a deterministic AI Software Factory
that turns natural-language briefs into complete, approvable project plans.

## Runtime

Deterministic in-process planner (`src/lib/uabr/planner.ts`) — no external AI
call required. Every planning surface is a `createServerFn` behind
`requireSupabaseAuth` and `assertUabrAccess` (signed-in). Approval + execution
delegate to the existing FAIOS command pipeline; UABR itself never writes to
the database (no schema changes).

## Planning engine

`planFromPrompt(prompt, opts)`:
- Keyword-matches industry (35+ verticals) and output modes (web/pwa/android/ios/desktop/backend/frontend/complete/enterprise).
- Produces `UabrProjectPlan`: modules, features, roles, permissions, pages, DB tables, API endpoints, security, a11y, SEO, performance, complexity, timeline, credits, and step list.
- Marks native-build + store-publishing steps `blocked` with exact `toolchain`, `secrets`, `accounts`, `certificates` — never fakes.

## Generation pipeline (all deterministic planners)

| Engine | Server function | Output |
|--|--|--|
| Project | `generateProjectPlan` | `UabrProjectPlan` |
| Design | `generateDesignKit` | palette, typography, wireframes |
| Database | `generateDatabasePlan` | tables, RLS, indexes, buckets |
| Backend | `generateBackendPlan` | endpoints, realtime, jobs, webhooks, rate limits |
| Frontend | `generateFrontendPlan` | layouts, pages, components, hooks, forms, charts |
| Docs | `generateDocsPlan` | README + architecture + API + guides |
| Tests | `generateTestPlan` | unit/integration/e2e/perf/a11y/security |
| Deployment | `generateDeploymentPlan` | targets + blocked reasons + rollback |

## Routes

Placed under `/uabr/*` (subfolder `_authenticated/uabr/`) to avoid collision
with the existing `/builder` leaf route. Pages: `dashboard`, `planner`,
`design`, `database`, `backend`, `frontend`, `documentation`, `tests`,
`deployment`, `history`.

## Security

- Every server fn: `requireSupabaseAuth` + `assertUabrAccess`.
- No new tables, no new RLS, no service-role usage.
- Approval + execution reuses FAIOS (`assertFaiosAccess` = admin-only).
- Auto mode off by default; native-build / publishing steps always blocked
  until credentials arrive.

## Performance

- Pure in-process planners; no external I/O, no DB writes.
- React Query on every page with mutation-driven UX.
- No new bundle-level deps.

## Known external dependencies

- Android: Android SDK, JDK 17, Gradle, `ANDROID_KEYSTORE_*`, Google Play Console.
- iOS: Xcode + macOS host, CocoaPods, `APPSTORE_CONNECT_API_KEY`, Apple Developer Program.
- Desktop: electron-builder / tauri per-OS toolchains, `MSIX_SIGNING_CERT`, `APPLE_DEVELOPER_ID_CERT`.
- Deployment trigger: Lovable Publish flow (agent-owned).

## Deviation from spec

Spec listed `/builder/*` routes but `/builder` already exists as a top-level
leaf; using `/uabr/*` preserves both without conflict.
