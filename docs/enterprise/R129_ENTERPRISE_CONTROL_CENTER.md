# R129 — HAPPY Enterprise Control Center™

Pure extension layer over the canonical Enterprise stack. **No V2 runtime, no
duplicate admin surface, no duplicate RBAC, no duplicate monitoring, no
duplicate database.**

## Canonical Owners (reused, not replaced)

| Domain | Canonical Owner |
|---|---|
| Organizations / Companies | `src/lib/organization-v15.functions.ts`, `src/lib/enterprise-v1.functions.ts` |
| Workspaces / Branches / Departments | `src/lib/workspace-v16.functions.ts`, `src/lib/founder-workspace/*` |
| Users / Auth | `src/lib/auth-v2.functions.ts`, `src/routes/_authenticated/security-sessions.tsx` |
| Roles / Permissions (RBAC) | `src/lib/roles-v2.functions.ts`, `src/lib/permissions-v2.functions.ts` |
| Audit Logs | `audit_logs` table, `src/lib/security/*` |
| Compliance | `src/lib/compliance-v5.functions.ts` |
| Monitoring | `src/lib/monitoring-v4.functions.ts` |
| Enterprise Intelligence | `src/lib/enterprise-intelligence-v2.functions.ts`, `enterprise-ai-v6` |
| Security | `src/lib/security-v2.functions.ts`, `src/lib/webhook-security.ts`, `src/lib/security/*` |
| Analytics | `src/lib/analytics-v7.functions.ts` |
| Brain | `src/lib/brain/engine.ts` |
| Digital Human | `src/components/digital-human/*`, `src/lib/happy-r117/dh-intelligence.ts` |

## Files Changed

- **Added** `src/lib/happy-r129/enterprise-intelligence.ts` — pure decision helpers.
- **Added** `tests/unit/happy-r129.test.ts` — 12 unit tests.
- **Added** `docs/enterprise/R129_ENTERPRISE_CONTROL_CENTER.md` — this doc.

## Gap Report → Fixes

| Gap | Extension shipped |
|---|---|
| No cross-owner org hierarchy validation | `ancestorsOf`, `detectCycles`, `canNest` |
| RBAC lacked baseline capability matrix vs enterprise caps | `RBAC_MATRIX`, `roleAllows`, `meetsMinRole` |
| No unified Policy Engine (deny-wins, MFA/hours/IP) | `evaluatePolicy` with condition matcher |
| Audit trail not tamper-evident | `chainAuditEvent` / `verifyAuditChain` (SHA-256 chain) + `classifyAuditSeverity` |
| Compliance had no scoring / retention math | `complianceScore`, `retentionDecision` |
| Monitoring alerts were ad hoc | `monitorAlert`, `sloAvailability` |
| Enterprise analytics missing seat/storage/AI helpers | `seatUtilization`, `storageStatus`, `aiCostForecast` |
| Security findings unordered | `prioritizeFindings` |
| Brain lacked enterprise intent routing | `resolveForBrain` (13 intents) |
| DH lacked enterprise personas | `pickDhEnterpriseMode` (6 modes) |

## Architecture

Pure functions only — no I/O, no DB writes. Canonical runtimes call these
helpers; UI reads them via the existing pages. Follows R111 Architecture Lock:
extension modules under `src/lib/happy-rNNN/` never replace canonical owners.

## Security

- Deny-wins policy evaluation; MFA/IP/time-window conditions.
- SHA-256 audit chain provides tamper detection for `audit_logs` exports.
- No secrets, no service-role usage; safe for client + server bundles.

## Performance

- All helpers O(n) or better; hierarchy check O(nodes²) bounded by depth.
- Audit chain uses WebCrypto (`crypto.subtle.digest`) available on Worker + browser.

## Tests

`tests/unit/happy-r129.test.ts` — 12 tests covering hierarchy, RBAC, policy
evaluation (including MFA/hours), audit chain tamper detection, compliance
scoring, retention, monitoring, SLO, analytics, security prioritization,
Brain intent routing, and DH mode selection.

## Evidence

- Every helper marked pure / stateless.
- No new tables, no new admin route, no parallel permission engine.
- Extends `roles-v2` + `permissions-v2` + `compliance-v5` + `monitoring-v4`
  + `enterprise-intelligence-v2` — no duplication.
