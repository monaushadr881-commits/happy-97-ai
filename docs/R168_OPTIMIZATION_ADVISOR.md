# R168 — AI Optimization Advisor™

**Type:** Pure governance + optimization layer. No new runtime, no V2 engines, no duplicate optimizer.

## Mandate

HAPPY AI continuously analyzes the platform and recommends improvements. It **never** optimizes production automatically. Every recommendation routes through R158 Approval Gateway. Compile-time lock: `canAutoOptimize: false`.

## Canonical Owners Reused

Brain (R114), Memory (R115), Conversation (R116), Workspace (R117), Search (R118), Knowledge (R119), Creator (R120), Revenue (R126), Business OS (R128), Founder Dashboard (R145), Audit (R130), Analytics (R104), Happy ID (R153), RBAC (R156), Approval Gateway (R158), Intent Engine (R159), Guardian AI (R160), Software Architect (R161), Code Review (R162), QA (R163), Impact Analyzer (R164), Preview Studio (R165), Rollback (R166), Documentation Engine (R167).

## Optimization Areas (18)

Performance, Security, Architecture, Database, API, Frontend, Backend, Business Logic, Revenue, AI Usage, Storage, Search, Files, Creative Assets, Deployment, SEO, Accessibility, User Experience.

## Analysis Surfaces

- **Automatic checks (16):** unused/dead code, large components/bundles, duplicate logic/assets, slow queries/APIs/search, high AI cost, high storage usage, large uploads, unused media/routes/tables/indexes.
- **Performance metrics (11):** bundle size, LCP, INP, TTI, CLS, memory, CPU, search, DB/API/AI latency.
- **Database (7):** indexes, queries, relations, constraints, unused tables/indexes, migration complexity.
- **API (7):** response time, payload size, caching, validation, pagination, compression, rate limits.
- **AI (7):** token usage, prompt length, context size, memory usage, model selection, inference cost, reasoning time.
- **Business (8):** revenue, credits, subscriptions, conversion, retention, growth, founder cost, infrastructure cost.

## Recommendation Kinds (10)

Performance, Security, Architecture, Database, API, UI, UX, SEO, Business, Cost Savings.

## Quality Scores (8 dimensions)

Performance, Security, Architecture, Database, API, Business, AI Efficiency, Overall. Deductions per finding severity: low −1, medium −3, high −7, critical −15. Overall = mean of dimension scores.

## Founder Report (7 fields)

Current health, problems, recommendations, estimated savings, estimated performance gain, estimated cost reduction, priority.

## Pipeline (12 stages)

intake → analyseAutomatic → analysePerformance → analyseDatabase → analyseApi → analyseAi → analyseBusiness → recommend → score → founderReport → audit → handoff (R158).

## Compile-Time Locks

- `canAutoOptimize: false`
- `handoffTarget: "R158_ApprovalGateway"`
- `reuseOnly: true`
- `newRuntime: false`

## Architecture / Security / Performance Impact

None. Additive constants and pure functions. No new tables, routes, or runtime. Backward compatible.

## Tests

`tests/unit/happy-r168.test.ts` — 8 tests covering taxonomy, canonical-owner references, severity/priority aggregation, score deductions, report totals, and compile-time locks.
