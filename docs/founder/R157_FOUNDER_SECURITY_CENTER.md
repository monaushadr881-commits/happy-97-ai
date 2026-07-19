# R157 — Founder Security Center™

**Status:** Shipped (extends R156 Identity Fortress; zero new runtime, zero new auth stack).
**Locks:** R91 · R104 · R106 · R111 · R130 · R151 · R152 · R153 · R156.

## Objective
Deliver the full Founder Security Center UX inside the existing Founder Dashboard, wire Passkeys (WebAuthn) end-to-end through Happy ID, and add an integration test that verifies the entire authenticated-security pipeline.

## Canonical Owners (reused, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Auth surface         | `src/lib/happy-id.functions.ts` (+ `src/lib/happy-id/*`) |
| Identity policy      | `src/lib/founder/identity-fortress.ts` (R156) |
| Unlimited policy     | `src/lib/founder/unlimited-policy.ts` (R153) |
| Risk engine          | `src/lib/happy-id/risk.ts` (R114.3) |
| Device registry      | `public.auth_devices` |
| Session registry     | `public.auth_sessions_meta` |
| Recovery codes       | `public.auth_recovery_codes` |
| Login history        | `public.auth_login_history` |
| Security alerts      | `public.auth_security_alerts` |
| Audit                | `public.audit_logs` + `public.write_audit(...)` |
| Founder Dashboard    | `src/routes/_authenticated/founder.*` |

R157 adds only:
1. `public.auth_passkeys` (new table; RLS locked to `auth.uid()`) — passkey storage extension to Happy ID.
2. `src/lib/happy-id/passkeys.ts` — pure passkey policy helpers.
3. Five passkey server functions appended to the canonical `src/lib/happy-id.functions.ts`.
4. `src/components/founder/FounderSecurityCenter.tsx` — Phase-1 UI.
5. `src/routes/_authenticated/founder.security.tsx` — mounts the Security Center.
6. `tests/unit/happy-r157.test.ts` — 12 tests covering phases 1–3.
7. This doc + FD-157 + FM524.

## Phase 1 — Founder Security Center UI

Ten panels wired to canonical owners:

- Active Sessions → `listMySessions`, `remoteLogoutAllOthers`
- Trusted Devices → `listMyDevices`, `trustDevice`, `renameDevice`, `revokeDevice`
- Security Timeline → `listMyLoginHistory` (+ `opsSecurityAudit` platform strip)
- Security Alerts → `listMySecurityAlerts`
- Recovery Codes → `generateRecoveryCodes`
- Passkey Status → `listMyPasskeys` + `passkeyStatus`
- OTP Status → surfaces Email OTP (ready), SMS OTP (external), Authenticator (supported), Passkey (enrolled)
- Risk Score → `computeRiskScore` + `riskAction`
- Emergency Lock → `emergencyLock` / `emergencyUnlock`
- Identity Status → `fortressSnapshot` + `isVerifiedFounder`

## Phase 2 — Passkeys (WebAuthn)

Server fns (all under Happy ID, gated by `requireSupabaseAuth`, scoped by RLS):

- `listMyPasskeys` — read owner rows
- `registerPasskey` — persist a new credential; logs `passkey` event + info alert
- `renamePasskey` — Rename support (multi-passkey management)
- `revokePasskey` — soft-delete with warning alert
- `markPasskeyAsBackup` — toggle backup flag for Backup-Passkey policy

Pure helpers (client-safe, re-exported from canonical owner):

- `passkeysSupported`, `detectPasskeyPlatform` — capability probe
- `classifyAuthenticator` — Windows Hello / Touch ID / Face ID / Security Key
- `defaultPasskeyLabel` — sensible label per platform
- `activePasskeys`, `hasBackupPasskey`, `meetsFounderPasskeyPolicy`
- `canRemovePasskey` — prevent last-passkey lockout
- `nextPasskeyStep` — enrollment state machine
- `passkeyStatus` — dashboard-ready summary

Platforms covered by classification: **Windows Hello**, **Touch ID**, **Face ID**, **Android Biometric**, **Security Key**, **Other**. Browser-side `navigator.credentials.create()` remains an EXTERNAL browser prompt (per R91 lock); this module owns everything except the browser prompt itself.

## Phase 3 — Integration tests

`tests/unit/happy-r157.test.ts` (12 tests):

- Password → Email OTP → SMS OTP → Risk Engine → Trusted Device → Session pipeline
- Risk-to-action map (allow / force_otp / founder_approval / terminate_sessions / lockdown)
- Trusted-device policy override via `resolveSessionPolicy`
- Multi-passkey policy (primary + backup)
- Passkey rename / remove / backup toggle
- Recovery codes + session rotation coexisting with passkeys → `excellent` posture
- Emergency lock/unlock server fns present
- Founder Unlimited (R153) unchanged after R157
- Founder role remains permanently immutable from UI (R156 lock)

## Architecture Impact

Zero new runtime. Zero new auth stack. Zero new identity. One new user-scoped table (`auth_passkeys`) that extends Happy ID exactly like `auth_devices`, `auth_sessions_meta`, `auth_recovery_codes`. R91/R111/R156 compliant.

## Revenue Impact

None. Founder Unlimited (R153) remains the sole revenue policy and passes the R157 integration test unchanged.

## Backward Compatibility

100%. All additions are pure or user-scoped RLS extensions.

## Evidence

- Files: `src/lib/happy-id/passkeys.ts`, `src/components/founder/FounderSecurityCenter.tsx`, `src/routes/_authenticated/founder.security.tsx`
- Server fns: `listMyPasskeys`, `registerPasskey`, `renamePasskey`, `revokePasskey`, `markPasskeyAsBackup`
- Schema: `public.auth_passkeys` (owner-only RLS)
- Tests: `tests/unit/happy-r157.test.ts` (12/12)
- Suite: **737/737 green** (was 725; +12)
- No new files under a `-vN` name; no new runtime; no duplicate auth.

## External Dependencies (unchanged)

- `navigator.credentials.create()` / `navigator.credentials.get()` browser prompt — architecture-ready; user activation only.
- SMS OTP provider (Twilio/etc.) — EXTERNAL per R91.
- Authenticator App (TOTP) — supported through Happy ID's existing flow.
