# Testing Strategy

## Layers
1. **Pure unit tests** (`bun test`) — deterministic helpers in
   `src/lib/happy-cinematic/*.ts`, `src/lib/production/*.ts`,
   `src/lib/faios/*`, `src/lib/uabr/*`.
2. **Server-function contract tests** — invoke each `*.functions.ts` via
   `stack_modern--invoke-server-function` in CI-like scripts.
3. **Route smoke tests** — Playwright loads every published route,
   asserts 200 + no console error.
4. **Interaction tests** — Playwright for critical flows: login, chat,
   builder, founder command → approve → execute.
5. **Accessibility tests** — `axe` against every top-level route.
6. **Performance budgets** — Lighthouse: LCP ≤ 2.5 s, INP ≤ 200 ms,
   CLS ≤ 0.1, TBT ≤ 200 ms.

## Regressions guarded
- Digital Human choreography states
- Comfort engine anchor selection
- Presence heartbeat cadence
- FAIOS approval gate
- UABR blocked-step enumeration
