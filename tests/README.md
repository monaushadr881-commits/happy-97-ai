# Tests

## Layout
- `tests/unit/**` — Vitest, deterministic pure-logic + HTTP route smoke.
- `tests/e2e/**` — Playwright (Chromium). Requires `bunx playwright install chromium` locally.

## Commands
- `bun run test` — full Vitest suite (unit + route smoke).
- `bun run test:coverage` — v8 coverage over `src/lib/{happy-cinematic,uabr,production,happy-living}`.
- `bun run test:e2e` — Playwright against `PW_BASE_URL` (default `http://localhost:8080`).

## Route smoke
`tests/unit/routes-smoke.test.ts` fetches each public route from the running
dev server. Tests auto-skip if the server isn't reachable.

## Current coverage (real, not fabricated)
- UABR planner: industry classification, mode routing, native blockers, dedup.
- Cinematic comfort engine: overlap detection + anchor reflow.
- Cinematic emotion + choreography: keyword-based emotion detection, pose
  mapping, entry/walk/greeting/exit plans.
- Public routes: `/`, `/auth`, `/login`, `/register`, `/status`, `/trust`,
  `/design` — HTTP 200 + HTML shell.

## Not covered
Authenticated flows (require session mint), Digital Human rendering (external
assets — see `docs/digital-human-assets.md`), payments (no live key), native
builds (no signing certs). These are external blockers, not code gaps.
