# R64 — Release Engineering & Distribution Platform

Expansion-only pass. R61/R62/R63 stay immutable. No changes to architecture, RBAC, RLS, digital human, existing services, or existing APIs.

## Scope split (honest)

**WORKING after this pass** (real code, real data, real UI):
- Release Center dashboard + 11 routes under `/releases/*`
- Artifact metadata registry (SHA256, size, kind, checksum verify) — file storage is metadata-only; binary upload lands as PARTIAL until a storage bucket is provisioned
- Build pipeline queue with states (queued / running / succeeded / failed / cancelled), priority, retry, cancel, logs pointer, estimated completion, metrics
- Signing profile registry — metadata + env-var presence checks only, **never stores key material**
- Store-submission validation reports per platform, per release
- Rollout state machine (1/5/10/20/50/100%, pause, resume, cancel, rollback, emergency rollback)
- Release status lifecycle (draft → ready → validated → signed → queued → publishing → published / paused / cancelled / failed / rolled_back / archived)
- Release notes + changelog generation, semver auto-increment, version compare
- Automation checklist runner (pre-build, artifact, signing, store, dependency, security, license validations)
- Analytics: success rate, deploy time, failure rate, rollback rate, adoption, build duration, pipeline metrics
- Founder Release Center UI with all listed actions wired to server functions
- Cron: nightly build tick + rollout-tick under `/api/public/cron/*`

**BLOCKED (honest, with explicit missing-dependency reason)**:
- Every store submission (Google Play, App Store, Microsoft, Amazon, Samsung, Huawei) — no store API credentials configured; adapters return `{ blocked_reason, required_secrets[] }`
- Native builds (APK/AAB/IPA/MSIX/DMG/PKG/AppImage/Snap/Flatpak) — no toolchain in the Worker runtime; pipeline records `blocked` with exact missing dep (Android SDK, Xcode, signtool, notarytool, etc.)
- Real store monitoring (downloads, installs, ratings, crash, ANR, revenue) — no store API keys; tables + service exist, ingest is `blocked` until credentials
- Real crash symbols upload — metadata table only; upload path BLOCKED until storage bucket
- Certificate expiry / timestamp validation — validated from metadata only; no private-key material is ever read

**NOT CHANGED**:
- R61 `deploy_*` tables, R62 payments, R63 `release_*` tables — reused as-is
- Existing RLS, `has_role`, `is_ops_admin`, admin auth flow
- Existing routes, digital human, services

## Deliverables

### 1. Database (single migration, expansion-only)

New tables (all with immutability triggers where appropriate, RLS admin-only, GRANTs to authenticated + service_role):

- `release_artifact_registry` — kind (apk/aab/ipa/msix/dmg/pkg/appimage/snap/flatpak/docker/source/sourcemap/crash_symbol/debug_symbol), filename, sha256, size, storage_url (nullable), release_id, uploaded_by, validation_status, metadata
- `build_pipeline_runs` — release_id, platform_code, status, priority, build_kind (incremental/clean/nightly/manual/scheduled), started_at, finished_at, duration_ms, logs_url, cache_hit, blocked_reason
- `build_pipeline_events` — immutable log/event stream (append-only)
- `release_rollouts` — release_id, store, current_percent, target_percent, state (planned/active/paused/cancelled/rolled_back), country_scope jsonb, updated_by
- `release_rollout_events` — immutable transition history
- `release_store_metrics` — release_id, store, downloads, installs, updates, rating_avg, rating_count, crash_free_rate, anr_rate, retention_d1/d7/d30, revenue_cents, snapshot_at
- `release_automation_checks` — release_id, check_kind, status (pass/warn/fail/blocked), detail, checked_at
- `release_pipeline_metrics_daily` — day, avg_build_ms, success_rate, failure_rate, rollback_rate, released_count

Reuses `release_records`, `release_signing_profiles`, `release_store_submissions`, `release_rollbacks`, `release_crash_symbols`, `release_changelog_entries`, `deploy_*` from R61/R63.

### 2. Runtime (`src/lib/release-r64/`)

- `contracts.ts` — TS types for artifacts, pipeline, rollout, store metrics
- `artifact-registry.ts` — sha256 verify, kind→required-fields validation
- `pipeline.ts` — queue transitions, priority scoring, retry/cancel guards
- `rollout.ts` — percent state machine, pause/resume/cancel/rollback guards
- `automation.ts` — 20 pre-flight checks (pure functions over release metadata)
- `store-monitors.ts` — 6 store adapters returning `{ status: 'blocked', missing_secrets[] }` until real keys land
- All server-function files use `const sb: any = context.supabase;` pattern to keep typecheck fast (learned from prior tsgo timeout)

### 3. Server functions (all `requireSupabaseAuth` + admin gate)

Nine `*.functions.ts` files as specified, each holding 3–8 admin-gated endpoints (list, get, create/mutate, analytics). Total ~50 endpoints. All return `{ blocked_reason, required: [...] }` for anything that needs external creds.

### 4. Routes (`src/routes/_authenticated/releases/`)

11 routes as specified. All under `_authenticated/` so protected layout gates them. Data via `useServerFn` + `useQuery` (never in public loaders). Virtualized history table. Realtime dashboard via `queryClient.invalidateQueries()` on a 30s poller (no new realtime channels).

### 5. Cron (`/api/public/cron/`)

- `release-pipeline-tick.ts` — advances queued builds honestly (records blocked_reason when no toolchain)
- `release-rollout-tick.ts` — advances active rollouts per schedule
- `release-metrics-rollup.ts` — daily aggregate into `release_pipeline_metrics_daily`

Scheduled via SQL insert (pg_cron) with `apikey` header.

### 6. Docs

`docs/architecture/r64-release-engineering.md` — full architecture, blocked-dependency matrix, RLS notes.
Update `docs/STATUS.md`, `MASTER_IMPLEMENTATION_STATUS.md`, `MASTER_EXECUTION_REGISTER.md` with R64 rows.

### 7. Verification

- `supabase--linter` after migration
- `tsgo` typecheck (target <60s; sub-10s is aspirational for a codebase this size)
- Console clean check via preview JS
- Playwright smoke: sign in → `/releases/dashboard` → verify widgets render → click Create Release → verify blocked-store report renders honestly

## Technical notes

```text
Type-cost guard (learned from R63 timeout):
- Every new .functions.ts uses `const sb: any = context.supabase`
- No inline .select("a, b, c, ...") string literals against typed client
- .returns<T>() where a caller needs a typed row

Route structure:
src/routes/_authenticated/releases/
  index.tsx           -> /releases  (redirects to dashboard)
  dashboard.tsx
  artifacts.tsx
  builds.tsx
  signing.tsx
  publish.tsx
  rollout.tsx
  history.tsx
  logs.tsx
  analytics.tsx
  settings.tsx
```

## What I will NOT do

- Not touch `src/routes/__root.tsx`, digital human, kernel, brain, existing services
- Not modify R61/R62/R63 tables or functions
- Not fabricate store credentials, signing keys, or successful publications
- Not add per-page realtime channels (poller only)
- Not generate binaries; pipeline records honest `blocked` states
- Not create storage buckets (artifact upload stays PARTIAL until user asks)

## Order of execution

1. Migration (8 tables + triggers + RLS + GRANTs) — single call
2. Runtime + 9 server-function files — parallel writes
3. 11 route files + shared components — parallel writes
4. 3 cron routes + pg_cron SQL
5. Docs
6. Verify (linter, tsgo, console, playwright smoke)

Reply **go** to run the migration first, or tell me which phases to drop / defer.
