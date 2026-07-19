# R160 — HAPPY Guardian AI™

**Status:** IMPLEMENTED (repo-side) · **Owner:** `src/lib/founder/guardian-ai.ts` · **Tests:** `tests/unit/happy-r160.test.ts`

## Follows
R91, R104, R106, R111, R114, R128, R130, R145, R153, R156, R157, R158, R159.

## Mandate
Platform Security Intelligence & Anti-Abuse System. **Pure governance layer** — NO new runtime, NO Security V2, NO Guardian V2, NO Risk V2, NO Auth V2, NO new tables, NO duplicate detection engine.

## Canonical Owners Reused
| Concern | Owner |
|---|---|
| Risk scoring | `src/lib/happy-id/risk.ts` (`computeRiskScore`) |
| Founder identity + lockdown | `src/lib/founder/identity-fortress.ts` (R156) |
| Security UI (sessions/devices/timeline/alerts/passkeys) | `src/components/founder/FounderSecurityCenter.tsx` (R157) |
| Approval-required responses | `src/lib/founder/approval-gateway.ts` (R158) |
| Intent → plan for remediation | `src/lib/founder/intent-engine.ts` (R159) |
| Founder unlimited | `src/lib/founder/unlimited-policy.ts` (R153) |
| Audit trail | `public.audit_logs` + `public.write_audit(...)` |
| Sessions + devices | `public.auth_sessions_meta`, `public.auth_devices` |
| Login history + alerts | `public.auth_login_history`, `public.auth_security_alerts` |
| RBAC | `public.user_roles`, `public.is_platform_founder` |

## Threat Catalogue (18)
credit_abuse · subscription_abuse · extension_abuse · modified_apk · session_sharing · token_replay · prompt_injection · ai_jailbreak · api_abuse · automation_abuse · bot_network · credential_stuffing · mass_account_creation · fake_referral · privilege_escalation · malicious_integration · scraping · reverse_engineering.

## Pipeline (8 stages)
capture → detect → score → classify → respond → alert → audit → learn.
Each stage delegates to the canonical owner above; Guardian AI resolves policy only.

## Severity Ladder
`score ≥ 90` critical · `≥ 70` high · `≥ 40` medium · else low.

## Response Ladder
warn → challenge → require_otp → require_founder_approval → freeze_session → freeze_user → freeze_workspace → freeze_company → investigation_mode. `privilege_escalation` and `modified_apk` bypass to `freeze_user` / `require_founder_approval`.

## Founder Alerts
Fired only on **high** and **critical** via dashboard, push, email, whatsapp channels (when configured through the existing Communication Hub).

## Safe Mode
Automatic recommendation when `criticalLastHour ≥ 10` or `highLastHour ≥ 50`. No data loss — surfaces through Founder Dashboard action.

## AI Security Officer
Pure `summarizeEvents(brief, events)` projection produces morning/evening/weekly/monthly briefs (top threats, severity roll-up, safe-mode recommendation). Consumed by existing dashboards.

## Architecture Impact
None. No new routes, no new tables, no new runtimes. Guardian is a policy resolver imported by existing Happy ID server fns and Security Center panels.

## Performance Impact
Negligible — synchronous helpers, no I/O.

## Tests
`tests/unit/happy-r160.test.ts` — 8 tests covering constants, severity mapping, response ladder, alert gating, safe-mode threshold, event classification, investigation snapshot, officer summary.

## Backward Compatibility
100%. Additive module only.
