import { describe, it, expect } from "vitest";
import {
  isFounder,
  isRestrictedRole,
  creditsCharged,
  walletDeduction,
  subscriptionRequired,
  quotaCheck,
  effectiveLimit,
  assertFounderPrivilege,
  policySnapshot,
  UNLIMITED_CAPABILITIES,
  NON_FOUNDER_ROLES,
} from "@/lib/founder/unlimited-policy";

const F = { isFounder: true };
const U = { isFounder: false };

describe("R153 — Founder Unlimited Policy", () => {
  it("identifies founder callers", () => {
    expect(isFounder(F)).toBe(true);
    expect(isFounder(U)).toBe(false);
    expect(isFounder(null)).toBe(false);
  });

  it("charges founder 0 credits, others as requested", () => {
    expect(creditsCharged(F, 500)).toBe(0);
    expect(creditsCharged(U, 500)).toBe(500);
    expect(creditsCharged(F, -1)).toBe(0);
  });

  it("skips wallet deduction for founder", () => {
    expect(walletDeduction(F, 9999)).toBe(0);
    expect(walletDeduction(U, 9999)).toBe(9999);
  });

  it("waives subscription requirement for founder only", () => {
    expect(subscriptionRequired(F, true)).toBe(false);
    expect(subscriptionRequired(U, true)).toBe(true);
    expect(subscriptionRequired(U, false)).toBe(false);
  });

  it("gives founder infinite quota", () => {
    const f = quotaCheck(F, 1_000_000, 10);
    expect(f).toEqual({ allowed: true, remaining: Number.POSITIVE_INFINITY, unlimited: true });
    const u = quotaCheck(U, 8, 10);
    expect(u.allowed).toBe(true);
    expect(u.remaining).toBe(2);
    expect(u.unlimited).toBe(false);
    expect(quotaCheck(U, 10, 10).allowed).toBe(false);
  });

  it("returns Infinity as effective limit for founder", () => {
    expect(effectiveLimit(F, 100)).toBe(Number.POSITIVE_INFINITY);
    expect(effectiveLimit(U, 100)).toBe(100);
  });

  it("denies restricted roles even if flagged as founder", () => {
    expect(assertFounderPrivilege({ isFounder: true, role: null })).toBe(true);
    for (const r of NON_FOUNDER_ROLES) {
      expect(assertFounderPrivilege({ isFounder: true, role: r })).toBe(false);
      expect(isRestrictedRole(r)).toBe(true);
    }
    expect(assertFounderPrivilege({ isFounder: false, role: null })).toBe(false);
  });

  it("covers all 21 capability dimensions", () => {
    expect(UNLIMITED_CAPABILITIES.length).toBeGreaterThanOrEqual(21);
    for (const cap of [
      "credits", "subscription", "wallet", "ai", "builder", "apps", "websites",
      "companies", "workspaces", "storage", "api", "automation", "brain",
      "memory", "search", "digital_human", "conversation", "founder_dashboard",
      "creator_studio", "business_os", "enterprise",
    ] as const) {
      expect(UNLIMITED_CAPABILITIES).toContain(cap);
    }
  });

  it("snapshot reflects founder state", () => {
    const s = policySnapshot(F);
    expect(s.founder).toBe(true);
    expect(s.creditsCharged).toBe(0);
    expect(s.walletDeduction).toBe(0);
    expect(s.subscriptionRequired).toBe(false);
    expect(s.quota).toBe("unlimited");
    const s2 = policySnapshot(U);
    expect(s2.founder).toBe(false);
    expect(s2.creditsCharged).toBe("as-billed");
    expect(s2.subscriptionRequired).toBe(true);
  });
});
