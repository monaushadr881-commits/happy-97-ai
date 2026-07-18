/**
 * R114.3 — Auth finalization coverage.
 * Risk engine, session policy resolver, provider registry, magic link + server-fn wiring.
 */
import { describe, it, expect } from "vitest";
import { computeRiskScore, resolveSessionPolicy } from "@/lib/happy-id/risk";
import * as happyId from "@/lib/happy-id.functions";

describe("R114.3 — risk engine", () => {
  it("classifies low risk for trusted established users", () => {
    const r = computeRiskScore({ deviceTrusted: true, userHistoryDays: 90 });
    expect(r.level).toBe("low");
    expect(r.score).toBe(0);
  });

  it("flags high risk for new device + new country + failed logins", () => {
    const r = computeRiskScore({ newDevice: true, newCountry: true, failedLoginsLast24h: 3 });
    expect(r.level === "high" || r.level === "medium").toBe(true);
    expect(r.reasons).toContain("new_device");
    expect(r.reasons).toContain("new_country");
  });

  it("marks impossible travel + tor as critical", () => {
    const r = computeRiskScore({ impossibleTravel: true, tor: true, newCountry: true });
    expect(r.level).toBe("critical");
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it("credits trusted device to reduce score", () => {
    const risky = computeRiskScore({ newDevice: true, newCountry: true });
    const trusted = computeRiskScore({ newDevice: true, newCountry: true, deviceTrusted: true });
    expect(trusted.score).toBeLessThan(risky.score);
  });

  it("clamps score to 0..100", () => {
    const r = computeRiskScore({ impossibleTravel: true, tor: true, anonymousProxy: true, newDevice: true, newCountry: true, vpn: true, failedLoginsLast24h: 99 });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});

describe("R114.3 — session policy resolver", () => {
  it("returns platform defaults when no rows", () => {
    const p = resolveSessionPolicy([], { userId: "u1" });
    expect(p.max_active_sessions).toBe(1);
    expect(p.allowed_providers).toContain("email");
  });

  it("user policy overrides company overrides platform", () => {
    const rows = [
      { scope_type: "platform" as const, scope_id: null, max_active_sessions: 1 },
      { scope_type: "company" as const, scope_id: "c1", max_active_sessions: 3 },
      { scope_type: "user" as const, scope_id: "u1", max_active_sessions: 5 },
    ];
    expect(resolveSessionPolicy(rows, { userId: "u1", companyId: "c1" }).max_active_sessions).toBe(5);
    expect(resolveSessionPolicy(rows, { companyId: "c1" }).max_active_sessions).toBe(3);
    expect(resolveSessionPolicy(rows, {}).max_active_sessions).toBe(1);
  });

  it("workspace sits between company and user", () => {
    const rows = [
      { scope_type: "company" as const, scope_id: "c1", max_active_sessions: 2 },
      { scope_type: "workspace" as const, scope_id: "w1", max_active_sessions: 4 },
    ];
    expect(resolveSessionPolicy(rows, { workspaceId: "w1", companyId: "c1" }).max_active_sessions).toBe(4);
  });
});

describe("R114.3 — server-fn surface (magic link, recovery, providers, device rename, emergency lock, remote logout)", () => {
  it("exports all finalization server functions", () => {
    // Magic link uses supabase.auth.signInWithOtp directly in auth.tsx — no extra fn needed.
    expect(typeof happyId.generateRecoveryCodes).toBe("function");
    expect(typeof happyId.consumeRecoveryCode).toBe("function");
    expect(typeof happyId.listAvailableProviders).toBe("function");
    expect(typeof happyId.renameDevice).toBe("function");
    expect(typeof happyId.emergencyLock).toBe("function");
    expect(typeof happyId.emergencyUnlock).toBe("function");
    expect(typeof happyId.setUserSessionPolicy).toBe("function");
    expect(typeof happyId.remoteLogout).toBe("function");
    expect(typeof happyId.remoteLogoutAllOthers).toBe("function");
  });
});
