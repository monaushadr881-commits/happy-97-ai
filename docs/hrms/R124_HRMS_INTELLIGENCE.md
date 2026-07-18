# R124 — HAPPY HRMS Intelligence™

## Founder Lock
- **No HRMS V2.** No parallel employee, payroll, or attendance runtime.
- Everything in this release is a **pure extension layer** at
  `src/lib/happy-r124/hrms-intelligence.ts`. Zero new tables, zero new APIs.

## Canonical Owners (reused, never duplicated)
| Capability             | Canonical Owner |
|------------------------|-----------------|
| Employees / Depts / Offices | `src/lib/business-v1.functions.ts` (+ `bizListEmployees`) |
| Companies / Org hierarchy   | `src/lib/enterprise-v1.functions.ts` |
| Workspace + roles           | `src/lib/happy-r118/workspace-intelligence.ts` |
| Files (contracts, payslips) | `src/lib/happy-r119/file-intelligence.ts` |
| Search                      | `src/lib/happy-r120/search-intelligence.ts` |
| Brain routing               | `src/lib/brain/engine.ts` (Stage 6 resolver hint) |
| CRM / ERP crosslinks        | `src/lib/happy-r122`, `src/lib/happy-r123` |
| UI page                     | `src/routes/_authenticated/business.hr.tsx` |

## Gap Report (Phase 1)
- Attendance/leave/payroll had **no deterministic intelligence layer** — UI called raw list endpoints.
- No canonical lifecycle model (stage strings were free-form).
- No shared attrition / promotion / shift optimization signals.
- No Brain resolver hint → HR queries fell through to generic chat.
- No 360° review or skill-gap synthesis.
- **No duplicates detected** at the runtime layer; all gaps are additive intelligence.

## Architecture V2 (Phase 2)
- **Employee Model**: canonical lifecycle (10 stages), reporting chain, org tree.
- **Attendance Model**: punch stream → daily summary (worked/break/overtime, status).
- **Leave Model**: 8 leave types, balance evaluation, WFH auto-approve.
- **Payroll Model**: deterministic gross → taxable → tax → net; proration.
- **Performance Model**: weighted goal score, 360° aggregation, 4 bands.
- **Learning Model**: skill matrix diff + course recommender.
- **Permission Model**: 6 HR roles × 13 caps matrix (extends R118).
- **Analytics Model**: single `hrSnapshot()` composite.

## Brain / DH Integration
- `resolveForBrain(q)` → routes to `payroll | leave | attendance | performance | learning | hiring | org | employee`.
- `pickDhHrMode(ctx)` → `hr | interview | training | presentation | manager | founder`.

## Files Changed
- **NEW** `src/lib/happy-r124/hrms-intelligence.ts`
- **NEW** `tests/unit/happy-r124.test.ts`
- **NEW** `docs/hrms/R124_HRMS_INTELLIGENCE.md`

## Impact
- **DB**: none.
- **API**: none.
- **Security/Privacy**: HR permission matrix defined; payroll/PII gated to `hr`, `hr_admin`, `admin`. Extension layer never bypasses canonical RLS.
- **Performance**: pure functions, O(n) over inputs.

## Known Limitations / Remaining Work
- Biometric device ingestion (external hardware) — BLOCKED on device SDKs.
- Statutory tax engines per jurisdiction — pluggable via `tax_rate`; per-country rules pending R125+.
- Interview scheduling UI reuses meeting runtime; deep hiring pipeline UI is future work.

## Registry
- Feature: `F-R124-HRMS-INTELLIGENCE`
- Extends: `business-v1` employees, `enterprise-v1` org, `happy-r118` workspace, `happy-r120` search, `brain/engine`.
- **No duplication.**
