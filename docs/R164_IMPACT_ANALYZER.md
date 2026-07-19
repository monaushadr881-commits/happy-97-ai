# R164 — AI Impact Analyzer™

**Status:** Governance + analysis layer. Pure additive. Zero new runtime.

## Mandate
Before ANY implementation, HAPPY calculates the complete impact of the
requested change. Nothing reaches implementation without an Impact
Report handed off to **R158 Approval Gateway**.

## Canonical Owners Reused (no duplication)
Intent Engine (R159) · Software Architect (R161) · Code Review Engineer
(R162) · QA & Testing Engineer (R163) · Guardian AI (R160) · Approval
Gateway (R158) · Brain · Memory · Conversation · Workspace · Search ·
Knowledge · Creator · Revenue · Business OS · Founder Dashboard ·
Audit · RBAC · Happy ID · Analytics.

## Follows
R91 · R104 · R111 · R115B · R116 · R118 · R119 · R120 · R126 · R128 ·
R130 · R145 · R153 · R156 · R157 · R158 · R159 · R160 · R161 · R162 ·
R163.

## Pipeline (10 stages)
intake → discover → graph → estimate → risk → gate → report →
founderPresentation → audit → **handoff → R158**.

## Coverage
- **Scope (16):** architecture, business, security, performance,
  revenue, database, api, ui, ux, storage, search, memory, brain,
  deployment, rollback, compatibility.
- **Change surfaces (15):** files, folders, routes, components,
  modules, services, libraries, tables, indexes, policies, storage
  buckets, workers, tests, documentation, migrations.
- **Dependency artifacts (6):** dependency graph, module/api/database
  relations, event flow, execution flow.
- **Impact dimensions:** Business (8) · Security (9) · Performance (10)
  · Database (8) · API (7) · UI (8) · Deployment (5).
- **Risk matrix (8):** technical, security, business, performance,
  migration, deployment, operational, overall (max-weighted).

## Quality Gates → block + handoff to R158
duplicate_runtime · duplicate_api · duplicate_database ·
architecture_break · missing_rollback · missing_tests ·
missing_documentation · critical_security_risk.

## Recommendation Ladder
`proceed` (risk < 40, no gates) · `proceed_with_care` (40 ≤ risk < 75)
· `block` (gates OR risk ≥ 75).

## Compile-time Locks
`canAutoImplement: false`, `handoffTarget: "R158_ApprovalGateway"`,
`reuseOnly: true`, `newRuntime: false`.

## Architecture Impact
None. Zero new tables. Zero new routes. Zero new runtime. Additive
governance module only.

## Files
- `src/lib/founder/impact-analyzer.ts`
- `tests/unit/happy-r164.test.ts`
- `docs/R164_IMPACT_ANALYZER.md`
