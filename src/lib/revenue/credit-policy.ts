/**
 * R183 Batch J — Canonical Revenue OS Credit Policy
 *
 * SINGLE canonical policy constants module for all credit runtimes.
 * This file does NOT create a new engine, wallet, credits system, or
 * runtime. It codifies the permanent daily-free-credit policy that the
 * existing canonical credits ledger (`public.credit_ledger_entries`)
 * and wallet (`public.wallets` / `public.wallet_ledger_entries`) must
 * observe. Any future credits handler MUST import from here.
 *
 * ── DAILY FREE CREDIT POLICY (LOCKED — DO NOT CHANGE) ─────────────
 *   • 5 free credits per user per day
 *   • Refresh at 00:00 in the user's home timezone (fallback UTC)
 *   • Never accumulate, never carry forward, never re-issued
 *   • Purchased credits remain a SEPARATE bucket
 *   • Subscription credits remain a SEPARATE bucket
 *
 * ── DEDUCTION ORDER (LOCKED) ──────────────────────────────────────
 *      daily_free  →  subscription  →  purchased
 *   Consumers of the credits ledger MUST spend `daily_free` first,
 *   fall through to `subscription`, and finally to `purchased`.
 *
 * The policy is expressed as constants + a `resolveDeduction` helper
 * so every downstream runtime shares one identical implementation.
 */

export const DAILY_FREE_CREDITS = 5 as const;
export const CREDIT_REFRESH_HOUR_LOCAL = 0 as const;

/** Ordered buckets — must be spent in this exact order. */
export const CREDIT_DEDUCTION_ORDER = [
  "daily_free",
  "subscription",
  "purchased",
] as const;

export type CreditBucket = (typeof CREDIT_DEDUCTION_ORDER)[number];

/**
 * Split a requested spend across buckets following the locked order.
 * Returns `{ per_bucket, remaining }`. Callers write one
 * `credit_ledger_entries` row per non-zero bucket.
 */
export function resolveDeduction(
  requested: number,
  balances: Record<CreditBucket, number>,
): {
  per_bucket: Record<CreditBucket, number>;
  remaining: number;
} {
  let remaining = Math.max(0, Math.floor(requested));
  const per_bucket: Record<CreditBucket, number> = {
    daily_free: 0,
    subscription: 0,
    purchased: 0,
  };
  for (const bucket of CREDIT_DEDUCTION_ORDER) {
    if (remaining <= 0) break;
    const avail = Math.max(0, Math.floor(balances[bucket] ?? 0));
    const take = Math.min(remaining, avail);
    per_bucket[bucket] = take;
    remaining -= take;
  }
  return { per_bucket, remaining };
}

/**
 * Founder-approval thresholds for privileged revenue mutations.
 * Above the threshold the mutation blocks and requires R158 approval.
 */
export const REVENUE_APPROVAL_THRESHOLDS = {
  /** Wallet adjustments (grants, adjustments, corrections). */
  WALLET_CENTS: 10_00_00, // 10,000 cents = 100 currency units
  /** Admin credit grants (bonus/admin_grant/referral). */
  CREDIT_UNITS: 100,
  /** Payment records (out-of-band posted receipts). */
  PAYMENT_CENTS: 5_00_00_00, // 5,00,000 cents = 5 lakh currency units
} as const;
