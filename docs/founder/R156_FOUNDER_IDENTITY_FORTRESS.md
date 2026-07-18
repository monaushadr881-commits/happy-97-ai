# R156 — Founder Identity Fortress™

**Status:** Shipped (governance + pure risk-policy layer; zero new runtime).
**Locks:** R91 · R104 · R106 · R111 · R130 · R151 · R152 · R153.

## Objective
Highest-security governance layer for the Platform Founder account. Nobody
except the Founder may ever obtain Founder privileges. The Founder can always
recover their account safely.

## Canonical Owners (reused, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Happy ID surface     | `src/lib/happy-id.functions.ts` (+ `src/lib/happy-id/*`) |
| Risk Engine          | `src/lib/happy-id/risk.ts` (`computeRiskScore`) |
| Device Registry      | `public.auth_devices` |
| Session Registry     | `public.auth_sessions_meta` |
| Recovery Codes       | `public.auth_recovery_codes` |
| Login History        | `public.auth_login_history` (immutable trigger) |
| Security Alerts      | `public.auth_security_alerts` |
| Session Policies     | `public.auth_session_policies` |
| RBAC                 | `public.user_roles` + `public.is_platform_founder` (SECURITY DEFINER) |
| Audit                | `public.audit_logs` + `public.write_audit(...)` (immutable) |
| Founder Unlimited    | `src/lib/founder/unlimited-policy.ts` (R153) |
| Founder Dashboard    | `src/routes/_authenticated/founder.*` |

R156 adds one file — `src/lib/founder/identity-fortress.ts` — plus tests and
this doc. No new tables, no new APIs, no new routes, no new auth runtime.

## Files Changed

- `src/lib/founder/identity-fortress.ts` (new — pure governance helper)
- `tests/unit/happy-r156.test.ts` (new — 9 tests)
- `docs/founder/R156_FOUNDER_IDENTITY_FORTRESS.md` (this file)
- `docs/founder/FOUNDER_DECISIONS.md` — FD-156 appended
- `docs/founder/FOUNDER_REGISTRY.md` — FM523 appended
- `docs/MASTER_ARCHITECTURE_LOCK.md` — R156 addendum

## Security Policies Added

- **Immutable role lock.** `canMutateFounderRoleFromUi()` returns `false` for
  every UI-originated `assign | edit | delete | transfer` — Founder role is
  updatable only through Happy ID's Founder-verified recovery flow.
- **Verified founder gate.** `isVerifiedFounder()` requires the canonical
  `is_platform_founder` flag AND absence of any restricted role
  (`company_admin`, `workspace_admin`, `enterprise_admin`, `customer`,
  `developer`, `employee`, `partner`).
- **Login pipeline.** `nextLoginStep()` enforces
  `password → email_otp → sms_otp → risk_review → trusted_device_check →
  session_issued`.
- **Risk → action.** `riskAction()` maps the R114.3 risk score to
  `allow (<35) → force_otp (35) → founder_approval (60) →
  terminate_sessions (75) → lockdown (90)`.
- **Recovery sufficiency.** `hasSufficientRecovery()` requires ≥2 independent
  channels across primary/secondary email, primary/secondary phone, recovery
  codes (10), and trusted devices.
- **Security score.** `securityScore()` returns a 0–100 posture score with
  weighted contribution from recovery, MFA (email OTP, SMS OTP, authenticator,
  passkey), session hygiene, and password age.
- **Immutable audit envelope.** `buildFounderAudit()` stamps timestamp, actor,
  IP, device, browser, location, action — one entry per Founder action,
  written through `write_audit(...)` into the append-only `audit_logs` table.

## Security Center fields (surfaced by Founder Dashboard)

`security_score`, `recovery_status`, `otp_status`, `passkey_status`,
`trusted_devices`, `active_sessions`, `failed_login_attempts`,
`security_timeline`, `recovery_codes`.

## Architecture Impact

Zero new runtime. Zero new tables. Zero new auth stack. Every capability
consumes an existing canonical owner. Fully R91/R111 compliant.

## Revenue Impact

None. Founder Unlimited (R153) remains the sole revenue policy.

## Database / API Impact

None. Founder identity contacts continue to live in `profiles` and
`auth.users`; devices/sessions/codes/history/alerts continue to live in their
canonical tables. No schema changes.

## Backward Compatibility

100%. Every helper is additive and pure. Existing Happy ID server functions
consume these decisions without behavioural change.

## Tests

`tests/unit/happy-r156.test.ts` — 9 tests covering constants, role lock,
verified-founder gate, login pipeline, risk→action mapping, recovery
sufficiency, eligible-methods enumeration, security score levels, audit
envelope shape, and dashboard snapshot.

## Evidence

- File: `src/lib/founder/identity-fortress.ts`
- Tests: `tests/unit/happy-r156.test.ts` (9/9 green)
- Full suite: 725/725 green after R156.
- Uses only reused canonical owners — no new files under `src/routes/api/`,
  no new `supabase/migrations/*`, no duplicate Happy ID module.

## Known External Dependencies (unchanged)

- Passkeys / WebAuthn browser prompts — architecture-ready via Happy ID;
  end-user prompt is a browser-level activation.
- SMS OTP provider (Twilio/etc.) — remains EXTERNAL per R91 lock.
- Authenticator App (TOTP) — supported through Happy ID's existing flow.
