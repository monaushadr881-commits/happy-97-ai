/**
 * R156 — Founder Identity Fortress™ (governance + risk policy, pure)
 *
 * Highest-security governance layer for the Platform Founder account.
 * ZERO new runtime, ZERO new auth stack, ZERO new tables. Every capability
 * reuses existing canonical owners:
 *
 *   - Happy ID          → `src/lib/happy-id.functions.ts` (+ `src/lib/happy-id/*`)
 *   - RBAC              → `public.user_roles` + `public.is_platform_founder`
 *   - Risk Engine       → `src/lib/happy-id/risk.ts` (`computeRiskScore`)
 *   - Device Registry   → `public.auth_devices`
 *   - Session Registry  → `public.auth_sessions_meta`
 *   - Recovery Codes    → `public.auth_recovery_codes`
 *   - Login History     → `public.auth_login_history`
 *   - Security Alerts   → `public.auth_security_alerts`
 *   - Audit             → `public.audit_logs` + `public.write_audit(...)`
 *   - Founder Unlimited → `src/lib/founder/unlimited-policy.ts` (R153)
 *
 * This file is pure — no I/O. It resolves *policy* decisions (step-up MFA,
 * lockdown, recovery eligibility, score) that Happy ID server functions and
 * the Founder Dashboard consume.
 *
 * LOCKS
 *   - The Founder role CANNOT be assigned, edited, transferred, or removed
 *     from any UI. Only a Founder-verified recovery flow (Happy ID) may
 *     update Founder identity contacts.
 *   - Non-Founder callers can NEVER escalate to Founder via this module.
 */

// ─── Types ──────────────────────────────────────────────────────────────

/** Contact channels the Founder may register via Happy ID secure storage. */
export const FOUNDER_CONTACT_CHANNELS = [
  "email_primary",
  "email_secondary",
  "phone_primary",
  "phone_secondary",
] as const;
export type FounderContactChannel = (typeof FOUNDER_CONTACT_CHANNELS)[number];

/** Recovery mechanisms available to the Founder. */
export const FOUNDER_RECOVERY_METHODS = [
  "email_primary",
  "email_secondary",
  "phone_primary",
  "phone_secondary",
  "recovery_codes",
  "trusted_device",
] as const;
export type FounderRecoveryMethod = (typeof FOUNDER_RECOVERY_METHODS)[number];

/** MFA factors the fortress supports (all via Happy ID owners). */
export const FOUNDER_MFA_FACTORS = [
  "email_otp",
  "sms_otp",
  "authenticator_app",
  "passkey_webauthn",
] as const;
export type FounderMfaFactor = (typeof FOUNDER_MFA_FACTORS)[number];

/** Actions the Founder may take on a trusted device. */
export const FOUNDER_DEVICE_ACTIONS = [
  "view",
  "rename",
  "remove",
  "force_logout",
  "approve",
  "block",
] as const;
export type FounderDeviceAction = (typeof FOUNDER_DEVICE_ACTIONS)[number];

/** Risk signals the fortress escalates on. */
export const FOUNDER_RISK_SIGNALS = [
  "unknown_device",
  "unknown_browser",
  "unknown_ip",
  "unknown_country",
  "impossible_travel",
  "brute_force",
  "session_hijacking",
  "token_replay",
] as const;
export type FounderRiskSignal = (typeof FOUNDER_RISK_SIGNALS)[number];

/** Login pipeline stages the Founder passes through, in order. */
export const FOUNDER_LOGIN_PIPELINE = [
  "password",
  "email_otp",
  "sms_otp",
  "risk_engine",
  "trusted_device_check",
  "session_issued",
] as const;

/** Fields the Founder Dashboard Security Center surfaces. */
export const FOUNDER_SECURITY_CENTER_FIELDS = [
  "security_score",
  "recovery_status",
  "otp_status",
  "passkey_status",
  "trusted_devices",
  "active_sessions",
  "failed_login_attempts",
  "security_timeline",
  "recovery_codes",
] as const;

/** Immutable audit fields for every Founder action. */
export const FOUNDER_AUDIT_FIELDS = [
  "timestamp",
  "actor_id",
  "ip",
  "device_id",
  "browser",
  "location",
  "action",
] as const;

// ─── Caller shape ───────────────────────────────────────────────────────

export interface FounderCaller {
  /** True iff `public.is_platform_founder(auth.uid())` returned true. */
  isFounder: boolean;
  /** Optional non-founder role, for the lock-guard. */
  role?: string | null;
}

/** Non-Founder roles that MUST NEVER receive Founder privileges. */
export const NON_FOUNDER_ROLES = [
  "company_admin",
  "workspace_admin",
  "enterprise_admin",
  "customer",
  "developer",
  "employee",
  "partner",
] as const;

// ─── Immutable role lock ────────────────────────────────────────────────

/**
 * Founder role edits are refused from UI paths. Only a Happy ID
 * secure-recovery flow may mutate Founder identity contacts.
 * Returns `false` (denied) for ANY UI-originated mutation, whether or not
 * the caller currently holds the Founder role.
 */
export function canMutateFounderRoleFromUi(
  _caller: FounderCaller,
  _target: "assign" | "edit" | "delete" | "transfer",
): boolean {
  return false;
}

/**
 * True iff the caller is the verified Platform Founder AND is not tagged
 * with any restricted non-founder role (defense-in-depth against session
 * hydration bugs).
 */
export function isVerifiedFounder(caller: FounderCaller): boolean {
  if (!caller.isFounder) return false;
  if (caller.role && (NON_FOUNDER_ROLES as readonly string[]).includes(caller.role)) return false;
  return true;
}

// ─── Login-pipeline decisions ───────────────────────────────────────────

export interface LoginSignals {
  passwordOk: boolean;
  emailOtpOk: boolean;
  smsOtpOk: boolean;
  deviceTrusted: boolean;
  riskScore: number; // 0–100, from computeRiskScore
}

/** The next login step the Founder must complete. */
export type LoginNextStep =
  | "password"
  | "email_otp"
  | "sms_otp"
  | "risk_review"
  | "trusted_device_check"
  | "authorized";

export function nextLoginStep(s: LoginSignals): LoginNextStep {
  if (!s.passwordOk) return "password";
  if (!s.emailOtpOk) return "email_otp";
  if (!s.smsOtpOk) return "sms_otp";
  if (s.riskScore >= 60) return "risk_review";
  if (!s.deviceTrusted) return "trusted_device_check";
  return "authorized";
}

// ─── Risk → action policy (extends R114.3 risk engine) ──────────────────

export type RiskAction =
  | "allow"
  | "force_otp"
  | "founder_approval"
  | "terminate_sessions"
  | "lockdown";

export function riskAction(riskScore: number): RiskAction {
  if (riskScore >= 90) return "lockdown";
  if (riskScore >= 75) return "terminate_sessions";
  if (riskScore >= 60) return "founder_approval";
  if (riskScore >= 35) return "force_otp";
  return "allow";
}

// ─── Recovery policy ────────────────────────────────────────────────────

export interface RecoveryState {
  emailPrimaryVerified: boolean;
  emailSecondaryVerified: boolean;
  phonePrimaryVerified: boolean;
  phoneSecondaryVerified: boolean;
  recoveryCodesRemaining: number; // out of 10
  trustedDevicesCount: number;
}

/** True iff the Founder has at least two independent recovery channels. */
export function hasSufficientRecovery(r: RecoveryState): boolean {
  const channels =
    Number(r.emailPrimaryVerified) +
    Number(r.emailSecondaryVerified) +
    Number(r.phonePrimaryVerified) +
    Number(r.phoneSecondaryVerified) +
    (r.recoveryCodesRemaining > 0 ? 1 : 0) +
    (r.trustedDevicesCount > 0 ? 1 : 0);
  return channels >= 2;
}

export function eligibleRecoveryMethods(r: RecoveryState): FounderRecoveryMethod[] {
  const out: FounderRecoveryMethod[] = [];
  if (r.emailPrimaryVerified) out.push("email_primary");
  if (r.emailSecondaryVerified) out.push("email_secondary");
  if (r.phonePrimaryVerified) out.push("phone_primary");
  if (r.phoneSecondaryVerified) out.push("phone_secondary");
  if (r.recoveryCodesRemaining > 0) out.push("recovery_codes");
  if (r.trustedDevicesCount > 0) out.push("trusted_device");
  return out;
}

// ─── Security score (0–100) ─────────────────────────────────────────────

export interface SecurityPosture {
  recovery: RecoveryState;
  mfa: {
    emailOtp: boolean;
    smsOtp: boolean;
    authenticator: boolean;
    passkey: boolean;
  };
  activeSessions: number;
  failedLoginsLast24h: number;
  passwordAgeDays: number;
}

export function securityScore(p: SecurityPosture): { score: number; level: "critical" | "low" | "medium" | "high" | "excellent"; reasons: string[] } {
  let s = 0;
  const reasons: string[] = [];

  // Recovery (30)
  const rc =
    Number(p.recovery.emailPrimaryVerified) +
    Number(p.recovery.emailSecondaryVerified) +
    Number(p.recovery.phonePrimaryVerified) +
    Number(p.recovery.phoneSecondaryVerified);
  s += Math.min(20, rc * 5);
  if (p.recovery.recoveryCodesRemaining > 0) s += 5;
  if (p.recovery.trustedDevicesCount > 0) s += 5;
  if (rc < 2) reasons.push("weak_recovery");

  // MFA (40)
  if (p.mfa.emailOtp) s += 8;
  if (p.mfa.smsOtp) s += 8;
  if (p.mfa.authenticator) s += 12;
  if (p.mfa.passkey) s += 12;
  if (!p.mfa.authenticator && !p.mfa.passkey) reasons.push("no_strong_mfa");

  // Session hygiene (20)
  if (p.activeSessions <= 5) s += 10;
  else reasons.push("too_many_sessions");
  if (p.failedLoginsLast24h < 5) s += 10;
  else reasons.push("failed_logins_high");

  // Password hygiene (10)
  if (p.passwordAgeDays < 180) s += 10;
  else reasons.push("password_stale");

  s = Math.min(100, s);
  const level =
    s >= 90 ? "excellent" :
    s >= 75 ? "high" :
    s >= 55 ? "medium" :
    s >= 30 ? "low" : "critical";
  return { score: s, level, reasons };
}

// ─── Audit envelope ─────────────────────────────────────────────────────

export interface FounderActionAudit {
  timestamp: string; // ISO
  actorId: string;
  ip: string | null;
  deviceId: string | null;
  browser: string | null;
  location: string | null;
  action: string;
}

export function buildFounderAudit(
  actorId: string,
  action: string,
  ctx: Partial<Omit<FounderActionAudit, "timestamp" | "actorId" | "action">> = {},
): FounderActionAudit {
  return {
    timestamp: new Date().toISOString(),
    actorId,
    ip: ctx.ip ?? null,
    deviceId: ctx.deviceId ?? null,
    browser: ctx.browser ?? null,
    location: ctx.location ?? null,
    action,
  };
}

// ─── Snapshot ───────────────────────────────────────────────────────────

export function fortressSnapshot(caller: FounderCaller) {
  return {
    founder: isVerifiedFounder(caller),
    canMutateRoleFromUi: false,
    contactChannels: FOUNDER_CONTACT_CHANNELS,
    mfaFactors: FOUNDER_MFA_FACTORS,
    recoveryMethods: FOUNDER_RECOVERY_METHODS,
    deviceActions: FOUNDER_DEVICE_ACTIONS,
    riskSignals: FOUNDER_RISK_SIGNALS,
    loginPipeline: FOUNDER_LOGIN_PIPELINE,
    securityCenter: FOUNDER_SECURITY_CENTER_FIELDS,
    auditFields: FOUNDER_AUDIT_FIELDS,
  };
}
