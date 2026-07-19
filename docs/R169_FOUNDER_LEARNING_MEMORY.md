# R169 — Founder Learning Memory™

**Type:** Pure governance + learning layer. No new runtime, no Memory V2, no Learning V2, no duplicate memory.

## Mandate

HAPPY AI continuously learns Founder-approved decisions and preferences to improve planning. Learning **never** bypasses Founder Approval. It never overwrites Founder decisions, architecture locks, security or revenue policies. Every new learning routes through R158 Approval Gateway. Compile-time lock: `canAutoLearn: false`.

## Canonical Owners Reused

Brain (R114), Memory (R115), Conversation (R116), Workspace (R117), Search (R118), Knowledge (R119), Creator (R120), Revenue (R126), Business OS (R128), Founder Dashboard (R145), Audit (R130), Analytics (R104), Happy ID (R153), RBAC (R156), Approval Gateway (R158), Intent Engine (R159), Guardian AI (R160), Software Architect (R161), Code Review (R162), QA (R163), Impact Analyzer (R164), Preview Studio (R165), Rollback (R166), Documentation Engine (R167), Optimization Advisor (R168).

## Learning Domains (20)

Founder preferences, architecture/security decisions, business rules, revenue policies, brand guidelines, coding style, documentation style, UI/UX/theme/color/typography preferences, testing/deployment standards, approval patterns, rollback/optimization preferences, communication style, company SOPs.

## Memory Classes (7)

Permanent, long-term, project, workspace, company, brand, temporary.

## Sources

- **Learning sources (7):** founder approvals/conversations/decisions/registry, architecture lock, approved documentation/workflows.
- **Never learn (4):** temporary experiments, rejected ideas, failed proposals, blocked implementations.

## Quality Dimensions (6)

Confidence, recency, approval status, source, owner, validity → aggregated to overall score.

## Automatic Checks (6)

`duplicate_memory`, `conflicting_policies`, `expired_decisions`, `invalid_references`, `missing_approval`, `architecture_conflicts`.

## Protected Domains

`architecture_decisions`, `security_decisions`, `revenue_policies` — overwrites require explicit Founder approval or are rejected outright.

## Decision Ladder

- `reject` — forbidden source or unapproved overwrite of a protected domain.
- `hold` — any automatic check triggered or overall quality < 70.
- `learn` — clean, high-quality, approved.

## Founder Controls (9) & Output Reports (7)

Controls: review, approve, reject, pin, archive, expire, restore, compare, search.
Reports: learning/knowledge/policy/preference summary, memory health, confidence score, conflict report.

## Pipeline (11 stages)

intake → classifySource → gateForbiddenSources → classifyMemory → scoreQuality → detectConflicts → detectDuplicates → protectLocks → suggest → audit → handoff (R158).

## Compile-Time Locks

- `canAutoLearn: false`
- `handoffTarget: "R158_ApprovalGateway"`
- `reuseOnly: true`
- `newRuntime: false`

## Architecture / Security / Performance Impact

None. Additive constants + pure functions. No new tables, routes, or runtime. Backward compatible.

## Tests

`tests/unit/happy-r169.test.ts` — 11 tests covering taxonomy, forbidden sources, quality scoring, conflict detection, protected-domain overwrite guard, decision ladder, and compile-time locks.
