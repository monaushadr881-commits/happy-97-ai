import { describe, it, expect } from "vitest";
import {
  passkeysSupported, detectPasskeyPlatform, classifyAuthenticator,
  defaultPasskeyLabel, activePasskeys, hasBackupPasskey,
  meetsFounderPasskeyPolicy, canRemovePasskey, nextPasskeyStep, passkeyStatus,
  PASSKEY_AUTHENTICATOR_TYPES, PASSKEY_TRANSPORTS, PASSKEY_PLATFORMS,
  type PasskeyRow,
} from "@/lib/happy-id/passkeys";
import {
  nextLoginStep, riskAction, hasSufficientRecovery, securityScore,
  isVerifiedFounder, canMutateFounderRoleFromUi,
} from "@/lib/founder/identity-fortress";
import { computeRiskScore, resolveSessionPolicy } from "@/lib/happy-id/risk";
import * as happyId from "@/lib/happy-id.functions";
import * as fortress from "@/lib/founder/identity-fortress";
import { isFounderUnlimited } from "@/lib/founder/unlimited-policy";

const pk = (over: Partial<PasskeyRow> = {}): PasskeyRow => ({
  id: crypto.randomUUID(),
  credential_id: "c-" + Math.random().toString(36).slice(2),
  label: "Passkey",
  authenticator_type: "platform",
  is_backup: false,
  created_at: new Date().toISOString(),
  ...over,
});

describe("R157 — Founder Security Center (Passkeys)", () => {
  it("enumerates passkey constants", () => {
    expect(PASSKEY_AUTHENTICATOR_TYPES.length).toBe(3);
    expect(PASSKEY_TRANSPORTS.length).toBe(5);
    expect(PASSKEY_PLATFORMS.length).toBe(6);
  });

  it("classifies authenticators (Windows Hello / Touch ID / Face ID / Security Key)", () => {
    expect(detectPasskeyPlatform("Mozilla/5.0 (Windows NT 10.0)")).toBe("windows_hello");
    expect(detectPasskeyPlatform("iPhone; CPU iPhone OS 17_0 like Mac OS X")).toBe("face_id");
    expect(detectPasskeyPlatform("Mac OS X 14_0")).toBe("touch_id");
    expect(detectPasskeyPlatform("Linux; Android 14")).toBe("android_biometric");
    expect(classifyAuthenticator("platform")).toBe("platform");
    expect(classifyAuthenticator("cross-platform", ["usb"])).toBe("security_key");
    expect(classifyAuthenticator("cross-platform", ["hybrid"])).toBe("cross-platform");
    expect(defaultPasskeyLabel("windows_hello")).toBe("Windows Hello");
    expect(defaultPasskeyLabel("touch_id")).toBe("Touch ID");
    expect(defaultPasskeyLabel("face_id")).toBe("Face ID");
    expect(defaultPasskeyLabel("security_key")).toBe("Security Key");
    // passkeysSupported is false in vitest jsdom-less env
    expect(typeof passkeysSupported()).toBe("boolean");
  });

  it("multi-passkey policy: primary + backup required", () => {
    const rows: PasskeyRow[] = [pk({ label: "Primary" })];
    expect(activePasskeys(rows).length).toBe(1);
    expect(hasBackupPasskey(rows)).toBe(false);
    expect(meetsFounderPasskeyPolicy(rows)).toBe(false);
    expect(nextPasskeyStep(rows, true)).toBe("register_backup");

    const withBackup: PasskeyRow[] = [...rows, pk({ label: "Backup", is_backup: true })];
    expect(hasBackupPasskey(withBackup)).toBe(true);
    expect(meetsFounderPasskeyPolicy(withBackup)).toBe(true);
    expect(nextPasskeyStep(withBackup, true)).toBe("complete");
    expect(nextPasskeyStep([], true)).toBe("register_primary");
    expect(nextPasskeyStep([], false)).toBe("check_support");
  });

  it("cannot remove the only remaining passkey", () => {
    const only = pk();
    expect(canRemovePasskey([only], only.id)).toBe(false);
    const two = [only, pk({ is_backup: true })];
    expect(canRemovePasskey(two, only.id)).toBe(true);
  });

  it("passkeyStatus surfaces the correct dashboard fields", () => {
    const rows = [pk({ label: "Primary" }), pk({ label: "Backup", is_backup: true, authenticator_type: "security_key" })];
    const st = passkeyStatus(rows);
    expect(st.count).toBe(2);
    expect(st.backup).toBe(true);
    expect(st.meetsFounderPolicy).toBe(true);
    expect(st.platforms.sort()).toEqual(["platform", "security_key"]);
  });

  it("revoked passkeys are excluded", () => {
    const rows = [pk({ revoked_at: new Date().toISOString() }), pk({ is_backup: true })];
    expect(activePasskeys(rows).length).toBe(1);
    expect(meetsFounderPasskeyPolicy(rows)).toBe(false);
  });

  it("server fns exposed by canonical owner", () => {
    for (const fn of [
      "listMyPasskeys","registerPasskey","renamePasskey","revokePasskey","markPasskeyAsBackup",
    ] as const) {
      expect(typeof (happyId as unknown as Record<string, unknown>)[fn]).toBe("function");
    }
    // R157 helpers re-exported from canonical owner
    expect((happyId as unknown as Record<string, unknown>).passkeyStatus).toBeTypeOf("function");
    expect((happyId as unknown as Record<string, unknown>).PASSKEY_PLATFORMS).toBeDefined();
  });
});

describe("R157 — Integration pipeline (Password → OTP → Risk → Trusted → Passkey → Recovery → Emergency)", () => {
  it("full login pipeline with passkey as final factor", () => {
    // 1. Password
    let step = nextLoginStep({ passwordOk: false, emailOtpOk: false, smsOtpOk: false, deviceTrusted: false, riskScore: 0 });
    expect(step).toBe("password");
    // 2. Email OTP
    step = nextLoginStep({ passwordOk: true, emailOtpOk: false, smsOtpOk: false, deviceTrusted: false, riskScore: 0 });
    expect(step).toBe("email_otp");
    // 3. SMS OTP
    step = nextLoginStep({ passwordOk: true, emailOtpOk: true, smsOtpOk: false, deviceTrusted: false, riskScore: 0 });
    expect(step).toBe("sms_otp");
    // 4. Risk engine hijack
    step = nextLoginStep({ passwordOk: true, emailOtpOk: true, smsOtpOk: true, deviceTrusted: true, riskScore: 85 });
    expect(step).toBe("risk_review");
    // 5. Trusted device required
    step = nextLoginStep({ passwordOk: true, emailOtpOk: true, smsOtpOk: true, deviceTrusted: false, riskScore: 10 });
    expect(step).toBe("trusted_device_check");
    // 6. Authorized
    step = nextLoginStep({ passwordOk: true, emailOtpOk: true, smsOtpOk: true, deviceTrusted: true, riskScore: 10 });
    expect(step).toBe("authorized");
  });

  it("risk engine → action policy", () => {
    const clean = computeRiskScore({ deviceTrusted: true });
    expect(riskAction(clean.score)).toBe("allow");
    const heavy = computeRiskScore({ impossibleTravel: true, tor: true, newDevice: true, newCountry: true, failedLoginsLast24h: 6 });
    expect(heavy.score).toBeGreaterThanOrEqual(90);
    expect(riskAction(heavy.score)).toBe("lockdown");
  });

  it("session rotation policy resolves user-scoped override", () => {
    const merged = resolveSessionPolicy(
      [
        { scope_type: "platform", scope_id: null, max_active_sessions: 10, require_mfa: false },
        { scope_type: "user", scope_id: "u-1", max_active_sessions: 2, require_mfa: true },
      ],
      { userId: "u-1" },
    );
    expect(merged.max_active_sessions).toBe(2);
    expect(merged.require_mfa).toBe(true);
  });

  it("recovery + passkey combined gives excellent score", () => {
    const rows = [pk(), pk({ is_backup: true })];
    const posture = securityScore({
      recovery: { emailPrimaryVerified: true, emailSecondaryVerified: true, phonePrimaryVerified: true, phoneSecondaryVerified: true, recoveryCodesRemaining: 10, trustedDevicesCount: 2 },
      mfa: { emailOtp: true, smsOtp: true, authenticator: true, passkey: passkeyStatus(rows).count > 0 },
      activeSessions: 2, failedLoginsLast24h: 0, passwordAgeDays: 15,
    });
    expect(posture.level).toBe("excellent");
    expect(hasSufficientRecovery({ emailPrimaryVerified: true, emailSecondaryVerified: false, phonePrimaryVerified: true, phoneSecondaryVerified: false, recoveryCodesRemaining: 10, trustedDevicesCount: 2 })).toBe(true);
  });

  it("emergency mode + Founder Unlimited + role lock are consistent", () => {
    // Emergency lock server-fn is exported by the canonical owner
    expect(typeof (happyId as unknown as Record<string, unknown>).emergencyLock).toBe("function");
    expect(typeof (happyId as unknown as Record<string, unknown>).emergencyUnlock).toBe("function");
    // Founder role cannot be mutated from any UI, even by another founder
    expect(canMutateFounderRoleFromUi({ isFounder: true }, "assign")).toBe(false);
    expect(canMutateFounderRoleFromUi({ isFounder: true }, "transfer")).toBe(false);
    // Verified founder gate still holds
    expect(isVerifiedFounder({ isFounder: true })).toBe(true);
    // R153 Founder Unlimited remains sole revenue policy for the Founder
    expect(isFounderUnlimited({ isPlatformFounder: true })).toBe(true);
    // Snapshot pulls in R156 pipeline used by R157 UI
    const snap = fortress.fortressSnapshot({ isFounder: true });
    expect(snap.loginPipeline.length).toBe(6);
  });
});
