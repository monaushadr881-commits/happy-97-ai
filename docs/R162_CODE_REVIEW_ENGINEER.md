# R162 — AI Code Review Engineer™

**Status:** Governance + review layer. Pure additive. Zero new runtime.

## Mandate
HAPPY reviews every proposed implementation before deployment. Not a
lint tool — an AI Engineering Reviewer that composes existing canonical
owners and produces a Review Report handed off to **R158 Approval
Gateway**. The Reviewer NEVER implements and NEVER auto-approves.

## Canonical Owners Reused (no duplication)
Intent Engine (R159) · Software Architect (R161) · Guardian AI (R160) ·
Approval Gateway (R158) · Identity Fortress (R156/R157) · Unlimited
Policy (R153) · Brain (R115B) · Memory (R116) · Conversation ·
Workspace · Search (R138) · Creator · Revenue · Business OS · Founder
Dashboard · Audit · Happy ID · RBAC.

## Follows
R91 · R104 · R111 · R115B · R116 · R118 · R119 · R120 · R126 · R128 ·
R130 · R145 · R153 · R156 · R157 · R158 · R159 · R160 · R161.

## Pipeline (10 stages)
intake → staticScan → areaReview → score → detect → recommend →
summarise → audit → present → **handoff → R158**.

## Coverage
- **Review Areas (15):** architecture, security, performance,
  scalability, maintainability, readability, accessibility, reliability,
  businessLogic, errorHandling, apiDesign, databaseDesign,
  folderStructure, documentation, testing.
- **Automatic Checks (11):** duplicate runtime/api/table, dead code,
  unused imports, circular deps, large files/components, security /
  performance / architecture violations.
- **Security (10)** · **Performance (8)** · **Database (6)** ·
  **API (7)** · **UI (6)** — see `code-review-engineer.ts` constants.
- **Scores (8):** architecture, security, performance, maintainability,
  accessibility, businessLogic, documentation, overall.

## Blockers → R158
critical_security_issue · architecture_break · duplicate_runtime ·
duplicate_api · duplicate_database · missing_documentation ·
missing_tests. Any → `approvalRecommendation: "block"`.

## Compile-time Locks
`canAutoExecute: false`, `handoffTarget: "R158_ApprovalGateway"`,
`reuseOnly: true`, `newRuntime: false`.

## Architecture Impact
None. Zero new tables. Zero new routes. Zero new runtime. Additive
governance module only.

## Files
- `src/lib/founder/code-review-engineer.ts`
- `tests/unit/happy-r162.test.ts`
- `docs/R162_CODE_REVIEW_ENGINEER.md`
