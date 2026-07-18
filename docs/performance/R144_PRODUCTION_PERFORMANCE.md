# R144 · Production Performance & Optimization™

**Status:** Gap-closure phase. No new runtime, no V2 cache, no V2 optimizer.
Extends canonical owners: TanStack Router code-splitter, TanStack Query cache,
`src/lib/happy-runtime/*`, `src/lib/brain/engine.ts`, `src/lib/memory/*`,
`src/lib/happy-r120/search-intelligence.ts`.

## Canonical Owner
`src/lib/happy-r144/performance.ts` — pure decision helpers only. It never
allocates its own cache or scheduler; it advises the existing ones.

## Budgets (`PERF_BUDGETS`)
| Metric | Budget |
|---|---|
| Initial Load (TTI) | 2.5 s |
| LCP | 2.5 s |
| Interaction (INP) | 100 ms |
| Route chunk (gzip) | 180 KB |
| Initial JS (gzip) | 220 KB |
| Critical CSS (gzip) | 60 KB |
| Hero image | 250 KB |
| Steady heap | 150 MB |
| Long task | 50 ms |
| DB query p95 | 120 ms |
| Brain stage | 350 ms |
| Hybrid search p95 | 400 ms |

Verdicts: **pass** ≤ budget · **warn** ≤ 1.25× · **fail** > 1.25×.
`perfScore` weights: pass 1.0, warn 0.7, fail 0.

## Optimization Surfaces
- **App startup / route loading** → `planRouteLoading` (eager shell,
  preload post-login hot paths, lazy default, on-idle for heavy screens).
  Extends TanStack Router's built-in splitter; no shadow router.
- **Code splitting / tree shaking** → advisory verdicts feed the existing
  Vite plugin config; we do not fork the bundler.
- **Image / asset optimization** → `planImage` selects AVIF/WebP, srcset,
  quality, and `fetchpriority=high` for the LCP image only.
- **Query / cache TTL** → `cachePolicy(DataClass)` returns
  staleTime/gcTime/refetch policy for the SINGLE TanStack Query client.
  No second cache is introduced.
- **Brain / Memory / Search pipelines** → `pipelineHotspots` +
  `pipelineTotal` surface the slowest stages so we tune canonical engines
  in place.
- **Duplication guard** → `scanForDuplicateRuntimes` flags any `-v2`
  sibling and enforces the R111 architecture lock.

## Snapshot
`buildPerfSnapshot({ samples, stages, scanPaths })` returns the shape
consumed by the Founder Performance view — score, per-metric verdicts,
top pipeline hotspots, duplication report, timestamp.

## Verification
- Build ✅ · Typecheck ✅ · Tests ✅ (677 + 8 new = 685 green)
- Backward compatible — no existing module import surface changed.

## Remaining Performance Gaps (external)
- Real-user CWV telemetry ingestion requires an external RUM provider
  (Sentry / PostHog wired in R142 but not yet configured with keys).
- CDN image transformation requires the customer's CDN credentials.
- Native cold-start metrics require the mobile / desktop shells shipped
  by the external adapter families.
