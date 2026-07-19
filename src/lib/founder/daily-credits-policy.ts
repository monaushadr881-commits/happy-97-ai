/**
 * R165 addendum — Founder Revenue Rule: Daily Free Credits
 *
 * Pure server-authoritative policy resolver. NO new runtime, NO new
 * credit ledger. Composes existing canonical owners only:
 *
 *   - Revenue OS          (canonical credit ledger)
 *   - Guardian AI         → src/lib/founder/guardian-ai.ts (R160)
 *   - Approval Gateway    → src/lib/founder/approval-gateway.ts (R158)
 *   - Founder Dashboard, Audit, RBAC, Happy ID, Analytics
 *
 * Rule:
 *   Daily Free Credits default = 5.
 *   Refresh daily. NEVER accumulate, carry forward, store, or stack.
 *   Purchased credits are separate and remain intact.
 *   Server is authoritative — the client NEVER decides balance.
 */

export const DAILY_FREE_CREDITS_DEFAULT = 5 as const;

export const CREDIT_KINDS = ["daily_free", "purchased", "subscription"] as const;
export type CreditKind = (typeof CREDIT_KINDS)[number];

// ─── Anti-abuse signals (Guardian AI reuse) ──────────────────────────────
export const CREDIT_ABUSE_SIGNALS = [
  "multiple_accounts", "device_farming", "emulator_farming",
  "vpn_farming", "scripted_refresh", "referral_abuse", "credit_farming",
] as const;
export type CreditAbuseSignal = (typeof CREDIT_ABUSE_SIGNALS)[number];

// ─── Founder-configurable controls ───────────────────────────────────────
export const CREDIT_FOUNDER_CONTROLS = [
  "daily_free_credits", "reset_time", "rolling_24_hours",
  "campaign_override", "country_rules", "premium_rules", "enterprise_rules",
] as const;
export type CreditFounderControl = (typeof CREDIT_FOUNDER_CONTROLS)[number];

// ─── Reset strategies ────────────────────────────────────────────────────
export type ResetStrategy = "fixed_time_utc" | "rolling_24h";

export type DailyCreditPolicy = {
  dailyFreeCredits: number;
  resetStrategy: ResetStrategy;
  resetHourUtc: number; // 0-23, used when strategy = fixed_time_utc
  campaignOverride?: number;
  countryOverrides?: Record<string, number>;
};

export const DEFAULT_POLICY: DailyCreditPolicy = {
  dailyFreeCredits: DAILY_FREE_CREDITS_DEFAULT,
  resetStrategy: "fixed_time_utc",
  resetHourUtc: 0,
};

// ─── Balance snapshot (server-authoritative — client MUST NOT compute) ──
export type CreditBalance = {
  readonly authoritative: "server";
  dailyFreeRemaining: number;
  purchasedRemaining: number;
  subscriptionRemaining: number;
};

// ─── Effective daily allotment for a user ────────────────────────────────
export function effectiveDailyAllotment(
  policy: DailyCreditPolicy,
  country?: string,
): number {
  if (typeof policy.campaignOverride === "number") return Math.max(0, policy.campaignOverride);
  if (country && policy.countryOverrides?.[country] != null) {
    return Math.max(0, policy.countryOverrides[country]);
  }
  return Math.max(0, policy.dailyFreeCredits);
}

// ─── Reset semantics — daily free credits DO NOT carry forward ──────────
export function computeDailyFreeAfterReset(
  policy: DailyCreditPolicy,
  country?: string,
): number {
  // NEVER add previous-day remaining. Reset replaces the value.
  return effectiveDailyAllotment(policy, country);
}

// ─── Deduction (daily free first, then subscription, then purchased) ────
export function deductCredits(
  balance: CreditBalance,
  amount: number,
): { balance: CreditBalance; deducted: number; insufficient: boolean } {
  if (amount <= 0) return { balance, deducted: 0, insufficient: false };
  let remaining = amount;
  const next: CreditBalance = { ...balance };

  const takeFrom = (key: "dailyFreeRemaining" | "subscriptionRemaining" | "purchasedRemaining") => {
    const take = Math.min(next[key], remaining);
    next[key] -= take;
    remaining -= take;
  };
  takeFrom("dailyFreeRemaining");
  takeFrom("subscriptionRemaining");
  takeFrom("purchasedRemaining");

  return { balance: next, deducted: amount - remaining, insufficient: remaining > 0 };
}

// ─── Server-authoritative guard (any client-computed balance is rejected)
export function assertServerAuthoritative(b: unknown): asserts b is CreditBalance {
  if (
    typeof b !== "object" || b === null ||
    (b as { authoritative?: string }).authoritative !== "server"
  ) {
    throw new Error("Credit balance must be server-authoritative");
  }
}
