# HAPPY X Enterprise Engineering Handbook — v1.0

**Status:** FROZEN · **Release:** HAPPY X Enterprise v1.0 · **Mode:** Maintenance
**Owner:** Founder Office · **Effective:** 2026-07-14

This handbook is the official engineering reference for HAPPY X. It supersedes
per-phase design notes for day-to-day work; the phase documents
(`docs/architecture/phase-2` … `phase-15`) remain the historical record.

---

## 1. Executive Summary

HAPPY X is an AI-native Enterprise Operating System composed of 14 integrated
domain modules on a single kernel, service layer, database, and AI Gateway.
HAPPY is the single Digital Human identity across every surface; all AI
capabilities are HAPPY's capabilities. v1.0 is enterprise-grade, secure,
observable, and production-ready.

### Platform inventory (frozen)
1. HAPPY Kernel
2. Enterprise Foundation
3. Executive Design System
4. Enterprise Database
5. Enterprise Service Layer
6. AI Gateway
7. Platform Operations
8. Founder Command Center
9. Enterprise Control Center
10. Business Operating System
11. Education Operating System
12. HAPPY Digital Human
13. Creator Operating System
14. Community & Commerce Operating System (CMOS)
15. Knowledge Operating System (WKOS)
16. Hyperlocal Intelligence Operating System (HIOS)
17. Production Operations

---

## 2. Architecture

**Layering (strict, top-down only):**

```
UI (routes + components)
   ↓ useServerFn / loaders
Server Functions  (src/lib/*.functions.ts, src/enterprise/*.functions.ts)
   ↓ ServiceContext
Service Layer     (src/services/**, src/ops/**)
   ↓ Supabase client (RLS)
Database          (public.* with RLS + explicit GRANTs)
```

**Invariants**
- UI never talks to the DB directly.
- Services never read `process.env` at module scope of client-reachable files.
- `service_role` is used only inside handlers, via `await import(".../client.server")`.
- One service per domain; one AI Gateway; one Digital Human (HAPPY).
- Multi-tenancy via `company_id` / `workspace_id`; enforced in RLS, not UI.

---

## 3. Coding Standards

- **TypeScript strict** everywhere; no `any` without a comment justifying it.
- Files are single-responsibility; components < 250 lines; services grouped by domain.
- Imports use `@/` alias; never relative paths that cross module boundaries.
- No `console.log` in shipped code — use `slog` from `services/core/logger`.
- Naming: `kebab-case` files, `PascalCase` components, `camelCase` functions,
  `SCREAMING_SNAKE_CASE` env vars.
- All public functions and services carry JSDoc explaining purpose + invariants.

---

## 4. Database Standards

- Every `CREATE TABLE public.*` migration includes, in order: CREATE → GRANT → ENABLE RLS → POLICY.
- Grants scoped to policy audience; `service_role` always granted for tables touched by admin code.
- Sensitive predicates go through SECURITY DEFINER functions (`has_role`, `is_platform_founder`, `is_company_admin`, `user_has_permission`) — never inline recursive queries.
- Timestamps: `created_at`, `updated_at` with `touch_updated_at` trigger.
- Time-dependent rules use triggers, not CHECK constraints.
- No `ALTER DATABASE postgres …`. No changes to `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.

---

## 5. API Standards

- **Internal:** `createServerFn` under `src/lib/*.functions.ts` — Zod-validated `inputValidator`, `requireSupabaseAuth` for user context, `service_role` only for verified admin ops.
- **Public:** file routes under `src/routes/api/public/v1/*` — versioned, signature-verified, non-sensitive output.
- No breaking changes without a new version prefix (`/api/public/v2/…`).
- Errors return `AppError` codes (`AUTH.FORBIDDEN`, `VALIDATION.FAILED`, `INFRA.DB_ERROR`, …) — never raw provider text.

---

## 6. Security Standards

- Auth gate on every `_authenticated/*` route (integration-managed).
- RLS on every user-data table; policies scoped to `auth.uid()` or tenant id.
- Zod validation at every service boundary.
- Rate limiting via `rateLimit()` middleware on abuse-prone endpoints.
- Secrets: `LOVABLE_API_KEY`, `SUPABASE_*` — rotated via managed tools; never hardcoded, never logged, never sent to the client.
- OWASP Top 10 coverage matrix maintained in `phase-15-production-hardening.md §2.6`.
- Webhook handlers verify HMAC signatures with `timingSafeEqual` before any write.

---

## 7. AI Standards

- Single gateway (`LOVABLE_API_KEY`), single identity (HAPPY).
- Default model: `google/gemini-2.5-flash`; escalate to `pro` only for reasoning-heavy paths.
- System prompts live in the service layer, never in UI code.
- Governance rules enforced in prompts and post-processing:
  - **Knowledge OS:** cite sources; present multiple viewpoints; separate fact / opinion / interpretation.
  - **Hyperlocal:** no endorsements; recommendations must be transparent.
  - **Creator OS:** consent required for voice/likeness generation; workspace owns outputs.
  - **Digital Human:** HAPPY is the only identity; modes are capabilities.
- Every AI call logs cost + latency into `ai_sessions` for `ops.ai.usage`.

---

## 8. UI Standards

- Executive Design System tokens (`src/design-system/tokens.ts`) — no hardcoded colors, fonts, or shadows.
- shadcn/Radix primitives for interactive components.
- Every route with a loader defines `errorComponent` + `notFoundComponent`.
- Every route has a unique `head()` with `title`, `description`, OG + Twitter tags.
- Accessibility: semantic HTML, `aria-label` on icon-only controls, keyboard reachable, `h-dvh` (not `h-screen`).

---

## 9. Testing Standards

- **Unit** — `services/core` and pure helpers at 80%+.
- **Integration** — contract tests for every server fn (auth, tenancy, validation, error path).
- **E2E (Playwright)** — smoke suite covering auth, business, education, marketplace, hyperlocal, DH.
- **Permission matrix** — Founder / Company Admin / Member / Anon across every module.
- **Cross-tenant isolation** — asserted against every `company_id`/`workspace_id` scoped table.
- **AI safety** — prompt-injection, exfiltration, off-persona checks.

---

## 10. Deployment Standards

- Channels: `development` → `testing` → `staging` → `production`.
- Strategies: `rolling` (default), `blue_green`, `canary`, `hotfix`.
- Every release recorded via `ops.deployment.start()` / `.finish()`.
- Rollback = re-deploy previous tag + `finish({ status: "rolled_back" })`.
- Frontend requires "Update" in publish dialog; backend deploys automatically.

---

## 11. Operations Standards

- Structured JSON logs with trace + correlation IDs.
- Health endpoints: `/api/public/v1/health`, `/api/public/v1/status`.
- Alerts: `ops.alerting` rules with severity + channels; trip creates an incident.
- Incidents: `ops.incident` service + `incidents` / `incident_events` tables.
- Audit: `write_audit()` for privileged mutations; `audit_logs` append-only.
- Founder surfaces: `founder.ops`, `founder.system`, `founder.security`, `founder.analytics`.

---

## 12. Documentation Standards

- Every phase has an architecture doc under `docs/architecture/`.
- Every service exports typed inputs/outputs — types are the API contract.
- User-facing docs: Admin Handbook, Founder Handbook, Deployment Guide, DR Guide (this repo).
- Public API reference: `/api/public/v1/status` returns the machine-readable inventory.

---

## 13. Release Standards

Pipeline (mandatory for every release):

```
Development → Automated Tests → Security Audit → Performance Audit
→ Accessibility Audit → Documentation Review → Founder Approval → Production
```

No step may be skipped. Founder Approval is recorded in `deployments.notes`.

---

## 14. Versioning Policy

**HAPPY X Enterprise v1.0 — FROZEN.**

Semantic versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR (v2.0, v3.0)** — architecture changes, breaking API changes.
- **MINOR (v1.1, v1.2)** — additive features, no breaking changes.
- **PATCH (v1.0.1, v1.0.2)** — bug fixes, security patches, docs.

Deprecation window for any public API: **≥ 2 minor versions** before removal.

---

## 15. Engineering Constitution

1. HAPPY is the only Digital Human.
2. One kernel, one design system, one service layer, one AI Gateway.
3. UI never touches the database.
4. Every table has RLS; every policy is testable.
5. Every server function validates its input.
6. Every AI call goes through the gateway; every prompt lives in a service.
7. Every tenant is isolated by default.
8. Every user owns their content, projects, catalog, and location data.
9. Every knowledge answer preserves attribution and viewpoint plurality.
10. Every release passes the full pipeline; no exceptions, no hotfix bypass without Founder approval.
11. Reuse before rebuild. Extend before duplicate.
12. Freeze rules apply to every contributor, human or AI.

---

## 16. Future Roadmap (v2.0 candidates — not committed)

- Native mobile shell (Capacitor) reusing server fns.
- On-device HAPPY (WebGPU) for low-latency avatar.
- Federated Knowledge OS with multi-tenant scholarly review.
- Marketplace payouts + regional tax automation.
- Enterprise SSO expansion (Okta, Azure AD).
- PostGIS-backed Hyperlocal spatial index.
- Realtime channels for Community feed + Messaging.
- Partitioning for `audit_logs` and `metrics_events`.

---

## 17. Risk Register

| ID  | Risk                                            | Likelihood | Impact | Mitigation                                             |
| --- | ----------------------------------------------- | ---------- | ------ | ------------------------------------------------------ |
| R1  | AI provider outage                              | Med        | High   | Gateway abstraction; degrade to cached responses       |
| R2  | Runaway AI cost                                 | Med        | Med    | `ops.ai.usage` dashboards + per-tenant limits          |
| R3  | RLS regression on new table                     | Low        | High   | Migration checklist + `supabase--linter` in CI         |
| R4  | Secret leak via logs                            | Low        | High   | `slog` redaction + code review rule                    |
| R5  | Cross-tenant data bleed                         | Low        | Crit   | Permission matrix + isolation tests                    |
| R6  | Hyperlocal precise-location misuse              | Low        | High   | Server-side opt-in enforcement                         |
| R7  | Marketplace fraud/chargebacks                   | Med        | Med    | Audit log + provider-side dispute flow                 |
| R8  | Knowledge misattribution                        | Med        | Med    | Attribution + viewpoint rules in prompts + moderation  |
| R9  | Dependency vulnerability                        | Med        | Med    | `code--dependency_scan` monthly + patch cadence        |
| R10 | Founder-only bottleneck on approvals            | High       | Low    | Delegated ops roles via `user_has_permission`          |

---

## 18. Maintenance Guide

- **Weekly:** dependency scan, slow-query review, incident postmortems.
- **Monthly:** access review (`role_assignments`), secret rotation drill,
  backup restore test.
- **Quarterly:** full permission matrix test, DR game day, docs audit.
- **On demand:** security scan before any publish (`security--get_scan_results`).

---

## 19. Contributor Guide

1. Read this handbook + the relevant phase doc.
2. Reuse an existing service before writing a new one.
3. Write the migration first if a schema change is needed; include GRANTs + RLS + trigger in the same file.
4. Add the server fn under `src/lib/<domain>-v1.functions.ts`; validate with Zod; use `requireSupabaseAuth`.
5. Wire the UI via `useServerFn` or route loaders; never call Supabase from a component.
6. Add tests: unit for logic, integration for the fn contract, permission-matrix entry.
7. Update the phase doc and, if the contract changes, this handbook.
8. Submit for the full release pipeline.

---

## 20. Enterprise Checklist

- [ ] Feature scoped to a single domain + service
- [ ] Reuses existing components, prompts, permissions
- [ ] Multi-tenant safe (RLS asserted)
- [ ] Zod validation at boundary
- [ ] Structured logs + audit entries
- [ ] Rate limited where applicable
- [ ] Docs updated (phase + handbook if contract changed)

## 21. Production Checklist

- [ ] Typecheck + build clean
- [ ] Migrations reviewed + applied to staging
- [ ] Security scan passed (no unresolved critical)
- [ ] Perf audit: LCP, bundle size, DB query plan
- [ ] Accessibility audit passed
- [ ] Rollback plan documented
- [ ] Founder approval recorded

## 22. Disaster Recovery Checklist

- [ ] Latest backup verified (Supabase managed)
- [ ] Restore drill within last 90 days
- [ ] Incident runbook current (`ops.incident`)
- [ ] Alerting channels verified live
- [ ] Secret rotation runbook accessible offline
- [ ] Communication template for status page ready

## 23. Go-Live Checklist

- [ ] All 14 modules smoke-passed in staging
- [ ] Legal: Terms, Privacy, Cookie surfaces published
- [ ] Consent + data-export/deletion flows working
- [ ] Regional config (`countries`, `currencies`, `languages`) seeded
- [ ] Public status page + support channel live
- [ ] Canary → 25% → 100% rollout plan approved by Founder

---

## 24. Freeze Declaration

HAPPY X Enterprise **v1.0** is officially frozen as of **2026-07-14**.

No architecture changes, database changes, API breaking changes, or duplicate
services/prompts/permissions/components may be introduced without explicit
Founder approval and a new version bump.

The project now enters **maintenance mode**. Await Founder approval before
beginning HAPPY X v2.0.

— Founder Office
