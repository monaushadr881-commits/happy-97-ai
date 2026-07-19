import { describe, it, expect } from "vitest";
import {
  PREVIEW_SURFACES, PREVIEW_DEVICES, PREVIEW_DISPLAY_MODES,
  SIMULATION_FLOWS, CHANGE_PREVIEW_KINDS, IMPACT_OVERLAY_LAYERS,
  PREVIEW_AI_REVIEW_CHECKS, FOUNDER_PREVIEW_CONTROLS,
  PREVIEW_QUALITY_GATES, PREVIEW_PIPELINE,
  PREVIEW_CANONICAL_OWNERS_REUSED,
  detectPreviewGates, buildPreviewPackage, type PreviewInput,
} from "@/lib/founder/preview-studio";
import {
  DAILY_FREE_CREDITS_DEFAULT, CREDIT_ABUSE_SIGNALS, CREDIT_FOUNDER_CONTROLS,
  DEFAULT_POLICY, effectiveDailyAllotment, computeDailyFreeAfterReset,
  deductCredits, assertServerAuthoritative, type CreditBalance,
} from "@/lib/founder/daily-credits-policy";

const cleanInput: PreviewInput = {
  surface: "founder_dashboard",
  devices: ["desktop", "iphone"],
  displayModes: ["light", "dark"],
  flows: ["navigation", "checkout"],
  reviewApproval: "approve",
  qaDecision: "READY",
  impactRecommendation: "proceed",
  duplicatesDetected: [],
  architectureBreak: false,
  securityFailure: false,
};

const presentation = {
  whatChanged: ["dashboard layout"], why: "founder request",
  benefits: ["clearer KPIs"], risks: [],
  performanceImpact: "neutral", businessImpact: "positive",
  securityImpact: "none", rollback: "one-click git revert",
};

describe("R165 AI Preview Studio", () => {
  it("exposes complete preview taxonomy", () => {
    expect(PREVIEW_SURFACES).toHaveLength(15);
    expect(PREVIEW_DEVICES).toHaveLength(8);
    expect(PREVIEW_DISPLAY_MODES).toHaveLength(5);
    expect(SIMULATION_FLOWS).toHaveLength(11);
    expect(CHANGE_PREVIEW_KINDS).toHaveLength(6);
    expect(IMPACT_OVERLAY_LAYERS).toHaveLength(10);
    expect(PREVIEW_AI_REVIEW_CHECKS).toHaveLength(8);
    expect(FOUNDER_PREVIEW_CONTROLS).toHaveLength(8);
    expect(PREVIEW_QUALITY_GATES).toHaveLength(7);
    expect(PREVIEW_PIPELINE).toHaveLength(10);
  });

  it("reuses only canonical owners", () => {
    expect(PREVIEW_CANONICAL_OWNERS_REUSED).toContain("ImpactAnalyzer");
    expect(PREVIEW_CANONICAL_OWNERS_REUSED).toContain("QaTestingEngineer");
    expect(PREVIEW_CANONICAL_OWNERS_REUSED).toContain("ApprovalGateway");
  });

  it("detects all preview gate categories", () => {
    const gates = detectPreviewGates({
      ...cleanInput,
      duplicatesDetected: ["duplicate_runtime", "duplicate_api", "duplicate_table"],
      architectureBreak: true, securityFailure: true,
      qaDecision: "NOT_READY", reviewApproval: "block",
    });
    expect(gates).toEqual(expect.arrayContaining([
      "duplicate_runtime", "duplicate_api", "duplicate_database",
      "architecture_break", "security_failure",
      "critical_qa_failure", "critical_review_failure",
    ]));
  });

  it("builds a clean preview package that never touches production", () => {
    const p = buildPreviewPackage(cleanInput, presentation);
    expect(p.canAutoDeploy).toBe(false);
    expect(p.sandboxed).toBe(true);
    expect(p.touchesProduction).toBe(false);
    expect(p.handoffTarget).toBe("R158_ApprovalGateway");
    expect(p.gatesTriggered).toEqual([]);
  });

  it("locks compile-time invariants: reuseOnly + no new runtime", () => {
    const p = buildPreviewPackage(cleanInput, presentation);
    expect(p.version).toBe("R165");
    expect(p.reuseOnly).toBe(true);
    expect(p.newRuntime).toBe(false);
  });
});

describe("Founder Revenue Rule — Daily Free Credits (R165 addendum)", () => {
  it("default is 5 daily free credits and refresh does NOT carry forward", () => {
    expect(DAILY_FREE_CREDITS_DEFAULT).toBe(5);
    // Day 1: used 2, remaining 3 → Day 2 = 5 (NOT 8)
    expect(computeDailyFreeAfterReset(DEFAULT_POLICY)).toBe(5);
  });

  it("campaign override and country rules take precedence", () => {
    expect(effectiveDailyAllotment({ ...DEFAULT_POLICY, campaignOverride: 10 })).toBe(10);
    expect(effectiveDailyAllotment(
      { ...DEFAULT_POLICY, countryOverrides: { IN: 7 } }, "IN",
    )).toBe(7);
  });

  it("exposes anti-abuse signals and founder controls", () => {
    expect(CREDIT_ABUSE_SIGNALS).toEqual(expect.arrayContaining([
      "multiple_accounts", "device_farming", "emulator_farming",
      "vpn_farming", "scripted_refresh", "referral_abuse", "credit_farming",
    ]));
    expect(CREDIT_FOUNDER_CONTROLS).toEqual(expect.arrayContaining([
      "daily_free_credits", "reset_time", "rolling_24_hours",
      "campaign_override", "country_rules",
      "premium_rules", "enterprise_rules",
    ]));
  });

  it("deducts daily free first, then subscription, then purchased", () => {
    const balance: CreditBalance = {
      authoritative: "server",
      dailyFreeRemaining: 5,
      subscriptionRemaining: 20,
      purchasedRemaining: 100,
    };
    const r = deductCredits(balance, 7);
    expect(r.deducted).toBe(7);
    expect(r.balance.dailyFreeRemaining).toBe(0);
    expect(r.balance.subscriptionRemaining).toBe(18);
    expect(r.balance.purchasedRemaining).toBe(100);
    expect(r.insufficient).toBe(false);
  });

  it("purchased credits remain intact when daily resets", () => {
    // Simulating reset: only daily_free is replaced; purchased untouched.
    const before: CreditBalance = {
      authoritative: "server",
      dailyFreeRemaining: 3, subscriptionRemaining: 12, purchasedRemaining: 50,
    };
    const dailyAfter = computeDailyFreeAfterReset(DEFAULT_POLICY);
    const after: CreditBalance = { ...before, dailyFreeRemaining: dailyAfter };
    expect(after.dailyFreeRemaining).toBe(5);
    expect(after.purchasedRemaining).toBe(50);
    expect(after.subscriptionRemaining).toBe(12);
  });

  it("rejects any client-computed balance (server-authoritative only)", () => {
    expect(() => assertServerAuthoritative({ dailyFreeRemaining: 999 })).toThrow();
    expect(() => assertServerAuthoritative({
      authoritative: "server", dailyFreeRemaining: 5,
      subscriptionRemaining: 0, purchasedRemaining: 0,
    })).not.toThrow();
  });
});
