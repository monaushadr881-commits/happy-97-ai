# R64 — Release Engineering & Distribution Platform

## Scope
Expansion-only pass on HAPPY Enterprise. R61 (`deploy_*`), R62 (payments),
R63 (`release_*`) tables and code are unchanged. R64 adds:

- 8 new tables (artifacts registry, build pipeline, rollouts, store metrics, automation checks, daily rollups).
- 9 admin-gated server-function files under `src/lib/release-r64/`.
- 11 route pages under `/releases/*` (protected by `_authenticated` layout).
- 3 cron endpoints under `/api/public/cron/release-*`.

## Runtime (`src/lib/release-r64/`)
| Module | Purpose |
| --- | --- |
| `contracts.ts` | Shared types (ArtifactKind, PipelineStatus, RolloutState, StoreCode). |
| `artifact-registry.ts` | SHA256 + metadata validators. |
| `pipeline.ts` | Build status state machine + `toolchainAvailability()`. |
| `rollout.ts` | Rollout state machine (`planned → active → completed | rolled_back | cancelled`). |
| `store-monitors.ts` | Per-store readiness/blocked reports (never fabricates credentials). |
| `automation.ts` | 12 pre-flight checks + readiness score, notes/changelog generators. |
| `gate.ts` | `assertOpsAdminR64()` + best-effort `writeAudit()`. |

## Server functions
All use `requireSupabaseAuth` + `has_role(admin)` and pass `context.supabase` as
`sb: any` to keep tsgo fast (no inline `.select("...")` string parsing against
the typed client).

- `release-dashboard-r64.functions.ts` — one-shot aggregated dashboard payload.
- `release-artifacts-r64.functions.ts` — list, register (metadata only).
  `uploadArtifactBinary` returns `{ status: "blocked" }` until a storage bucket
  is provisioned.
- `build-pipeline-r64.functions.ts` — list, queue, transition (guarded by state
  machine), event stream. Records `blocked` with the exact missing toolchain.
- `signing-r64.functions.ts` — profile registry + env-var presence check. No
  key material is ever read.
- `publish-r64.functions.ts` — store submission validation + status matrix.
  Every non-web store returns `blocked` with required secrets/accounts.
- `rollout-r64.functions.ts` — create, advance step (1/5/10/20/50/100), transition
  (pause/resume/cancel/rollback), event history.
- `release-validation-r64.functions.ts` — full automation run, persisted checks,
  release notes / changelog generation, rollback recommendation.
- `release-history-r64.functions.ts` — list + detail + version compare.
- `release-analytics-r64.functions.ts` — pipeline + release analytics + daily
  rollup consumer.

## Routes
`/releases` (layout) → `/releases/dashboard`, `/artifacts`, `/builds`, `/signing`,
`/publish`, `/rollout`, `/history`, `/logs`, `/analytics`, `/settings`.

Shared shell in `-shell.tsx` renders the tabbed navigation over
`PageHeader` + `Container` primitives.

## Cron
Schedule via `pg_cron` + `pg_net`, calling the endpoints below with the anon
`apikey` header:

```
select cron.schedule('r64-metrics-rollup', '0 * * * *', $$
  select net.http_post(
    url:='https://project--e4b8032f-84f6-4023-8e51-40257f864590.lovable.app/api/public/cron/release-metrics-rollup',
    headers:='{"Content-Type":"application/json","apikey":"<SUPABASE_PUBLISHABLE_KEY>"}'::jsonb,
    body:='{}'::jsonb);
$$);
select cron.schedule('r64-pipeline-tick', '*/5 * * * *', $$
  select net.http_post(
    url:='https://project--e4b8032f-84f6-4023-8e51-40257f864590.lovable.app/api/public/cron/release-pipeline-tick',
    headers:='{"Content-Type":"application/json","apikey":"<SUPABASE_PUBLISHABLE_KEY>"}'::jsonb,
    body:='{}'::jsonb);
$$);
select cron.schedule('r64-store-status', '*/30 * * * *', $$
  select net.http_post(
    url:='https://project--e4b8032f-84f6-4023-8e51-40257f864590.lovable.app/api/public/cron/release-store-status',
    headers:='{"Content-Type":"application/json","apikey":"<SUPABASE_PUBLISHABLE_KEY>"}'::jsonb,
    body:='{}'::jsonb);
$$);
```

If `pg_cron`/`pg_net` are unavailable in the environment, the routes still work
under manual invocation; schedule from any external cron.

## Security
- Every table is `is_ops_admin`-gated for RLS; ledger-style tables have
  immutability triggers.
- Cron routes verify the `apikey` header equals `SUPABASE_PUBLISHABLE_KEY`.
- Signing profiles store only metadata (label, fingerprint, expiry). No key
  bytes touch the runtime.
- Store submissions require external credentials; the API never fabricates a
  successful publish.

## Known external dependencies (BLOCKED without them)
| Capability | Blocked reason |
| --- | --- |
| Native builds (APK/AAB/IPA/MSIX/DMG/PKG/AppImage/Snap/Flatpak) | No toolchain in Cloudflare Worker runtime. |
| Google Play publish | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `ANDROID_KEYSTORE_ALIAS`. |
| Apple App Store publish | Apple Developer + App Store Connect API key + macOS/Xcode. |
| Microsoft Store publish | Partner Center creds + MSIX signing cert. |
| Amazon Appstore publish | Amazon Developer credentials. |
| Samsung Galaxy publish | Samsung Seller Portal token. |
| Huawei AppGallery publish | Huawei Developer credentials. |
| Store metric ingest (downloads/installs/crash/ANR/revenue) | Same store API credentials as above. |
| Artifact binary upload | No `release-artifacts` storage bucket provisioned. |

## Performance
- No new realtime channels; dashboards poll every 15–60 s.
- Server functions cast `context.supabase` to `any` to avoid quadratic
  type-inference blow-up that killed R63's typecheck.
- Analytics aggregate in-memory over ≤5 000 rows/window.
