import { describe, it, expect } from "vitest";
import {
  FOUNDER_CONTACT_CHANNELS,
  FOUNDER_MFA_FACTORS,
  FOUNDER_RECOVERY_METHODS,
  FOUNDER_DEVICE_ACTIONS,
  FOUNDER_RISK_SIGNALS,
  FOUNDER_LOGIN_PIPELINE,
  FOUNDER_SECURITY_CENTER_FIELDS,
  FOUNDER_AUDIT_FIELDS,
  NON_FOUNDER_ROLES,
  canMutateFounderRoleFromUi,
  isVerifiedFounder,
  nextLoginStep,
  riskAction,
  hasSufficientRecovery,
  eligibleRecoveryMethods,
  securityScore,
  buildFounderAudit,
  fortressSnapshot,
} from "@/lib/founder/identity-fortress";

describe("R156 — Founder Identity Fortress™", () => {
  it("enumerates governance constants", () => {
    expect(FOUNDER_CONTACT_CHANNELS.length).toBe(4);
    expect(FOUNDER_MFA_FACTORS.length).toBe(4);
    expect(FOUNDER_RECOVERY_METHODS.length).toBe(6);
    expect(FOUNDER_DEVICE_ACTIONS.length).toBe(6);
    expect(FOUNDER_RISK_SIGNALS.length).toBe(8);
    expect(FOUNDER_LOGIN_PIPELINE.length).toBe(6);
    expect(FOUNDER_SECURITY_CENTER_FIELDS.length).toBe(9);
    expect(FOUNDER_AUDIT_FIELDS.length).toBe(7);
    expect(NON_FOUNDER_ROLES.length).toBe(7);
  });

  it("locks Founder role mutation from UI regardless of caller", () => {
    for (const target of ["assign", "edit", "delete", "transfer"] as const) {
      expect(canMutateFounderRoleFromUi({ isFounder: true }, target)).toBe(false);
      expect(canMutateFounderRoleFromUi({ isFounder: false }, target)).toBe(false);
    }
  });

  it("isVerifiedFounder rejects non-founder roles even if flag set", () => {
    expect(isVerifiedFounder({ isFounder: true })).toBe(true);
    expect(isVerifiedFounder({ isFounder: false })).toBe(false);
    for (const role of NON_FOUNDER_ROLES) {
      expect(isVerifiedFounder({ isFounder: true, role })).toBe(false);
    }
  });

  it("walks login pipeline in strict order", () => {
    const base = { passwordOk: false, emailOtpOk: false, smsOtpOk: false, deviceTrusted: false, riskScore: 0 };
    expect(nextLoginStep(base)).toBe("password");
    expect(nextLoginStep({ ...base, passwordOk: true })).toBe("email_otp");
    expect(nextLoginStep({ ...base, passwordOk: true, emailOtpOk: true })).toBe("sms_otp");
    expect(nextLoginStep({ ...base, passwordOk: true, emailOtpOk: true, smsOtpOk: true, riskScore: 80 })).toBe("risk_review");
    expect(nextLoginStep({ ...base, passwordOk: true, emailOtpOk: true, smsOtpOk: true, deviceTrusted: false, riskScore: 10 })).toBe("trusted_device_check");
    expect(nextLoginStep({ ...base, passwordOk: true, emailOtpOk: true, smsOtpOk: true, deviceTrusted: true, riskScore: 10 })).toBe("authorized");
  });

  it("maps risk score to enforcement action", () => {
    expect(riskAction(10)).toBe("allow");
    expect(riskAction(40)).toBe("force_otp");
    expect(riskAction(65)).toBe("founder_approval");
    expect(riskAction(80)).toBe("terminate_sessions");
    expect(riskAction(95)).toBe("lockdown");
  });

  it("recovery: requires ≥2 independent channels", () => {
    const zero = { emailPrimaryVerified: false, emailSecondaryVerified: false, phonePrimaryVerified: false, phoneSecondaryVerified: false, recoveryCodesRemaining: 0, trustedDevicesCount: 0 };
    expect(hasSufficientRecovery(zero)).toBe(false);
    expect(hasSufficientRecovery({ ...zero, emailPrimaryVerified: true })).toBe(false);
    expect(hasSufficientRecovery({ ...zero, emailPrimaryVerified: true, phonePrimaryVerified: true })).toBe(true);
    expect(eligibleRecoveryMethods({ ...zero, emailPrimaryVerified: true, recoveryCodesRemaining: 5 })).toEqual(["email_primary", "recovery_codes"]);
  });

  it("securityScore rewards MFA + fresh recovery", () => {
    const weak = securityScore({
      recovery: { emailPrimaryVerified: false, emailSecondaryVerified: false, phonePrimaryVerified: false, phoneSecondaryVerified: false, recoveryCodesRemaining: 0, trustedDevicesCount: 0 },
      mfa: { emailOtp: false, smsOtp: false, authenticator: false, passkey: false },
      activeSessions: 20, failedLoginsLast24h: 12, passwordAgeDays: 365,
    });
    expect(weak.score).toBeLessThan(30);
    expect(weak.level).toBe("critical");

    const strong = securityScore({
      recovery: { emailPrimaryVerified: true, emailSecondaryVerified: true, phonePrimaryVerified: true, phoneSecondaryVerified: true, recoveryCodesRemaining: 8, trustedDevicesCount: 2 },
      mfa: { emailOtp: true, smsOtp: true, authenticator: true, passkey: true },
      activeSessions: 3, failedLoginsLast24h: 0, passwordAgeDays: 30,
    });
    expect(strong.score).toBeGreaterThanOrEqual(90);
    expect(strong.level).toBe("excellent");
  });

  it("buildFounderAudit stamps all mandatory fields", () => {
    const a = buildFounderAudit("u-1", "founder.rotate_recovery_codes", { ip: "1.2.3.4", deviceId: "d-1", browser: "Safari", location: "IN" });
    for (const k of FOUNDER_AUDIT_FIELDS) expect(a).toHaveProperty(k === "actor_id" ? "actorId" : k === "device_id" ? "deviceId" : k);
    expect(typeof a.timestamp).toBe("string");
  });

  it("fortressSnapshot exposes governance surface for the Founder Dashboard", () => {
    const snap = fortressSnapshot({ isFounder: true });
    expect(snap.founder).toBe(true);
    expect(snap.canMutateRoleFromUi).toBe(false);
    expect(snap.loginPipeline).toEqual(FOUNDER_LOGIN_PIPELINE);
    expect(snap.securityCenter).toEqual(FOUNDER_SECURITY_CENTER_FIELDS);
  });
});
