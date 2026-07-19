# R158 — Founder Approval Gateway™

**Status:** Shipped (pure governance layer; zero new runtime).
**Locks:** R91 · R104 · R111 · R130 · R145 · R151 · R153 · R154 · R156 · R157.

## Objective
HAPPY must NEVER execute a significant change without understanding it,
explaining it, previewing it, and obtaining Founder approval. No auto
production changes, ever.

## Canonical Owners (reused, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Intent / Brain       | `src/lib/brain/engine.ts` (R115B) |
| Memory               | `src/lib/memory/intelligence.ts` (R116) |
| Workspace / Impact   | `src/workspace/*` (R118) |
| File / Diff Engine   | `src/lib/happy-r137/*` (R119/R137) |
| Search / Duplicate   | `src/lib/happy-r138/*` (R120/R138) |
| Creator Preview      | `src/routes/_authenticated/studio.*` (R126/R141) |
| Revenue OS           | `src/lib/happy-r128/*` (R128) |
| Founder Dashboard    | `src/routes/_authenticated/founder.*` (R130/R139) |
| Security Center      | `src/components/founder/FounderSecurityCenter.tsx` (R157) |
| Identity Fortress    | `src/lib/founder/identity-fortress.ts` (R156) |
| Unlimited Policy     | `src/lib/founder/unlimited-policy.ts` (R153) |
| RBAC / Founder       | `public.user_roles` + `public.is_platform_founder` |
| Audit (immutable)    | `public.audit_logs` + `public.write_audit(...)` |
| Approvals            | `public.approvals` |

R158 adds ONE file — `src/lib/founder/approval-gateway.ts` — plus tests and
this doc. Zero new tables, APIs, routes, dashboards, or runtimes.

## Files Changed
- `src/lib/founder/approval-gateway.ts` (new — pure governance helper)
- `tests/unit/happy-r158.test.ts` (new — 11 tests)
- `docs/founder/R158_FOUNDER_APPROVAL_GATEWAY.md` (this file)
- `docs/founder/FOUNDER_DECISIONS.md` — FD-158 appended
- `docs/founder/FOUNDER_REGISTRY.md` — FM525 appended

## Governance Surface

- **17-stage pipeline** `request → intent → requirements → architecture →
  duplicate_detection → security_review → performance_review →
  impact_analysis → solution_planning → preview → explanation → questions →
  approval → implementation → testing → documentation → deployment →
  monitoring`.
- **Explain Before Execute™** — 12 mandatory fields (what/why/benefits/
  risks/perf/security/files/routes/apis/db/rollback/estimated_minutes).
- **Preview matrix** — 5 surfaces × 2 themes = 10 previews.
- **4 tiers** `minor · standard · high_risk · critical`.
- **Critical actions** always require Password + OTP + Founder approval +
  audit + preview + rollback.
- **`canAutoExecute()` is a compile-time `false`** — enforced type.
- **8 Founder commands** `approve · reject · modify · ask_ai · compare ·
  preview_again · schedule · cancel`.
- **Rollback envelope** requires `backup_id · rollback_plan · version ·
  audit_id`.

## Architecture Impact
None. Every capability consumes an existing canonical owner. Fully R91 /
R111 compliant.

## Revenue Impact
None. R153 Unlimited unchanged.

## Database / API Impact
None. Uses existing `public.approvals` + `public.audit_logs`.

## Backward Compatibility
100%. Every helper is additive and pure.

## Tests
`tests/unit/happy-r158.test.ts` — 11 tests covering constants, tier
classification, requirements matrix, pipeline order, auto-execute lock,
explanation completeness, preview matrix, command validation, rollback
envelope, and Founder Dashboard snapshot.
