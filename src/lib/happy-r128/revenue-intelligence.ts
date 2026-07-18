/**
 * R128 — HAPPY Revenue OS Intelligence™ (pure extension layer)
 *
 * FOUNDER LOCK (R91 / R111):
 *   - No Revenue V2. No duplicate Credits/Subscription/Payment/Wallet runtimes.
 *   - Canonical owners (extended, never replaced):
 *       Credits Engine        → `src/lib/credits/engine.ts` + `credits.functions.ts`
 *       Subscription Engine   → `src/lib/subscriptions/lifecycle.ts` + `.functions.ts`
 *       Wallet Engine         → `src/lib/wallet/engine.ts` + `wallet.functions.ts`
 *       Payment Runtime       → `src/lib/payments/*` (adapters, business-processor, webhook-runtime)
 *       Billing surface       → `src/lib/billing-v5.functions.ts`
 *       Revenue surface       → `src/lib/revenue-v1.functions.ts`
 *       Communication         → R127 (billing/receipt notifications)
 *       Brain / Memory / Workspace / Search / Files / DH — R115–R120.
 *
 * Pure helpers only — no I/O, no DB, no PSP SDKs. Every side effect flows
 * through the canonical runtimes above.
 */

// ============================================================================
// Types
// ============================================================================

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "AED" | "SGD" | "AUD" | "CAD" | "JPY";

export type PlanTier =
  | "free" | "starter" | "pro" | "business"
  | "enterprise" | "education" | "government" | "founder" | "custom";

export type SubscriptionStatus =
  | "trialing" | "active" | "past_due" | "paused" | "canceled" | "expired";

export type PaymentProvider = "stripe" | "paddle" | "razorpay" | "cashfree" | "paypal" | "manual";

export type PaymentStatus =
  | "pending" | "authorized" | "succeeded" | "failed" | "refunded" | "chargeback" | "voided";

export type CreditKind = "purchase" | "bonus" | "referral" | "team" | "workspace" | "enterprise" | "grant";
export type CreditTxn = "debit" | "credit" | "hold" | "release" | "refund" | "expire" | "transfer";

export type UsageKind =
  | "ai" | "storage" | "builder" | "file" | "search" | "api" | "automation" | "analytics";

export type RevenueRole = "viewer" | "member" | "billing_ops" | "finance" | "admin" | "founder";
export type RevenueCap =
  | "view" | "purchase" | "refund" | "issue_credit" | "plan_change"
  | "invoice_edit" | "tax_edit" | "coupon_manage" | "analytics" | "impersonate";

export type RevenueDhMode = "billing" | "subscription" | "sales" | "founder" | "support";

// ============================================================================
// Money math (integer minor units — never floats)
// ============================================================================

const ZERO_DECIMAL = new Set<Currency>(["JPY"]);

export function minorUnits(currency: Currency): number {
  return ZERO_DECIMAL.has(currency) ? 1 : 100;
}

export function toMinor(amount: number, currency: Currency): number {
  return Math.round(amount * minorUnits(currency));
}
export function toMajor(minor: number, currency: Currency): number {
  return minor / minorUnits(currency);
}
export function addMinor(a: number, b: number): number { return a + b; }
export function subMinor(a: number, b: number): number { return a - b; }

// ============================================================================
// Credits ledger + expiry
// ============================================================================

export interface CreditEntry {
  id: string;
  kind: CreditKind;
  txn: CreditTxn;
  amount: number;              // positive integer credits
  balance_after?: number;
  expires_at?: string;         // ISO
  created_at: string;          // ISO
  memo?: string;
}

export function creditBalance(entries: CreditEntry[]): number {
  let bal = 0;
  for (const e of entries) {
    if (e.txn === "credit" || e.txn === "refund") bal += e.amount;
    else if (e.txn === "debit" || e.txn === "expire" || e.txn === "hold") bal -= e.amount;
    else if (e.txn === "release") bal += e.amount;
    // transfer neutral on this account — mirrored on the other side
  }
  return bal;
}

export function expiringSoon(
  entries: CreditEntry[], withinDays = 14, nowMs: number = Date.now(),
): CreditEntry[] {
  const horizon = nowMs + withinDays * 86400_000;
  return entries.filter((e) =>
    (e.txn === "credit" || e.txn === "refund") &&
    e.expires_at && new Date(e.expires_at).getTime() <= horizon &&
    new Date(e.expires_at).getTime() > nowMs);
}

/** Compute an expiry timestamp per credit kind (deterministic policy). */
export function computeExpiry(kind: CreditKind, issuedAt: number = Date.now()): string | undefined {
  const days: Partial<Record<CreditKind, number>> = {
    bonus: 60, referral: 90, team: 180, workspace: 365, grant: 365,
  };
  const d = days[kind];
  return d ? new Date(issuedAt + d * 86400_000).toISOString() : undefined;
}

// ============================================================================
// Coupons / promo codes
// ============================================================================

export type DiscountKind = "percent" | "amount" | "credits";

export interface Coupon {
  code: string;
  kind: DiscountKind;
  value: number;                 // percent 0-100, amount in minor units, or credit count
  currency?: Currency;
  min_amount_minor?: number;
  max_redemptions?: number;
  redeemed?: number;
  expires_at?: string;
  applies_to?: PlanTier[];       // if omitted → all
}

export interface CouponContext {
  amount_minor: number;
  currency: Currency;
  plan?: PlanTier;
  nowMs?: number;
}

export function validateCoupon(c: Coupon, ctx: CouponContext): { ok: boolean; reason?: string } {
  const now = ctx.nowMs ?? Date.now();
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { ok: false, reason: "expired" };
  if (c.max_redemptions != null && (c.redeemed ?? 0) >= c.max_redemptions) return { ok: false, reason: "exhausted" };
  if (c.min_amount_minor != null && ctx.amount_minor < c.min_amount_minor) return { ok: false, reason: "min_amount" };
  if (c.currency && c.currency !== ctx.currency) return { ok: false, reason: "currency_mismatch" };
  if (c.applies_to && ctx.plan && !c.applies_to.includes(ctx.plan)) return { ok: false, reason: "plan_ineligible" };
  return { ok: true };
}

export function applyCoupon(c: Coupon, ctx: CouponContext): {
  discount_minor: number; total_minor: number; credit_bonus: number;
} {
  const v = validateCoupon(c, ctx);
  if (!v.ok) return { discount_minor: 0, total_minor: ctx.amount_minor, credit_bonus: 0 };
  let discount = 0, bonus = 0;
  if (c.kind === "percent") discount = Math.floor((ctx.amount_minor * Math.min(100, Math.max(0, c.value))) / 100);
  else if (c.kind === "amount") discount = Math.min(ctx.amount_minor, Math.max(0, c.value));
  else if (c.kind === "credits") bonus = Math.max(0, c.value);
  return {
    discount_minor: discount,
    total_minor: Math.max(0, ctx.amount_minor - discount),
    credit_bonus: bonus,
  };
}

// ============================================================================
// Tax engine (GST/VAT-ready — arithmetic only)
// ============================================================================

export interface TaxContext {
  seller_country: string;      // ISO-3166
  buyer_country: string;
  buyer_state?: string;        // for IN GST
  buyer_is_business?: boolean; // EU reverse charge
  seller_gstin?: string;
  buyer_gstin?: string;
}

export interface TaxLine { name: string; rate: number; amount_minor: number }
export interface TaxResult { lines: TaxLine[]; total_tax_minor: number; total_with_tax_minor: number; reverse_charge: boolean }

export function computeTax(net_minor: number, ctx: TaxContext): TaxResult {
  const lines: TaxLine[] = [];
  let total = 0;
  let reverse = false;

  // India GST
  if (ctx.seller_country === "IN" && ctx.buyer_country === "IN") {
    const rate = 0.18;
    const amt = Math.round(net_minor * rate);
    if (ctx.buyer_state && ctx.buyer_state === (ctx as { seller_state?: string }).seller_state) {
      const half = Math.round(amt / 2);
      lines.push({ name: "CGST", rate: rate / 2, amount_minor: half });
      lines.push({ name: "SGST", rate: rate / 2, amount_minor: amt - half });
    } else {
      lines.push({ name: "IGST", rate, amount_minor: amt });
    }
    total = amt;
  }
  // EU VAT (B2C) — B2B reverse charge
  else if (isEU(ctx.seller_country) && isEU(ctx.buyer_country)) {
    if (ctx.buyer_is_business && ctx.buyer_country !== ctx.seller_country) {
      reverse = true;
    } else {
      const rate = VAT_RATES[ctx.buyer_country] ?? 0.2;
      const amt = Math.round(net_minor * rate);
      lines.push({ name: "VAT", rate, amount_minor: amt });
      total = amt;
    }
  }

  return { lines, total_tax_minor: total, total_with_tax_minor: net_minor + total, reverse_charge: reverse };
}

const EU = new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]);
const VAT_RATES: Record<string, number> = { DE: 0.19, FR: 0.20, IT: 0.22, ES: 0.21, NL: 0.21, IE: 0.23, SE: 0.25 };
function isEU(c: string): boolean { return EU.has(c); }

// ============================================================================
// Invoices (pure builder)
// ============================================================================

export interface InvoiceLine { description: string; quantity: number; unit_price_minor: number }
export interface Invoice {
  currency: Currency;
  lines: InvoiceLine[];
  subtotal_minor: number;
  discount_minor: number;
  tax: TaxResult;
  total_minor: number;
  issued_at: string;
}

export function buildInvoice(input: {
  currency: Currency; lines: InvoiceLine[];
  coupon?: Coupon; tax_ctx?: TaxContext; issued_at?: string;
}): Invoice {
  const subtotal = input.lines.reduce((s, l) => s + l.quantity * l.unit_price_minor, 0);
  const applied = input.coupon
    ? applyCoupon(input.coupon, { amount_minor: subtotal, currency: input.currency })
    : { discount_minor: 0, total_minor: subtotal, credit_bonus: 0 };
  const net = applied.total_minor;
  const tax = input.tax_ctx
    ? computeTax(net, input.tax_ctx)
    : { lines: [], total_tax_minor: 0, total_with_tax_minor: net, reverse_charge: false };
  return {
    currency: input.currency,
    lines: input.lines,
    subtotal_minor: subtotal,
    discount_minor: applied.discount_minor,
    tax,
    total_minor: tax.total_with_tax_minor,
    issued_at: input.issued_at ?? new Date().toISOString(),
  };
}

export function creditNote(inv: Invoice, refund_minor: number): Invoice {
  const clamped = Math.max(0, Math.min(refund_minor, inv.total_minor));
  return {
    ...inv,
    lines: [{ description: "Credit note (refund)", quantity: 1, unit_price_minor: -clamped }],
    subtotal_minor: -clamped, discount_minor: 0,
    tax: { lines: [], total_tax_minor: 0, total_with_tax_minor: -clamped, reverse_charge: false },
    total_minor: -clamped,
    issued_at: new Date().toISOString(),
  };
}

// ============================================================================
// Subscriptions
// ============================================================================

export interface Plan {
  tier: PlanTier;
  price_minor: number;
  currency: Currency;
  included_credits?: number;
  interval: "monthly" | "yearly";
}

export const PLAN_RANK: Record<PlanTier, number> = {
  free: 0, starter: 1, pro: 2, business: 3, education: 3,
  government: 3, enterprise: 4, custom: 4, founder: 99,
};

export function planUpgradePath(current: PlanTier, target: PlanTier): "upgrade" | "downgrade" | "same" {
  const a = PLAN_RANK[current], b = PLAN_RANK[target];
  if (a === b) return "same";
  return b > a ? "upgrade" : "downgrade";
}

export function prorate(
  current: Plan, next: Plan,
  periodStartMs: number, periodEndMs: number, nowMs: number = Date.now(),
): { credit_minor: number; charge_minor: number } {
  if (current.currency !== next.currency) return { credit_minor: 0, charge_minor: next.price_minor };
  const total = periodEndMs - periodStartMs;
  const remaining = Math.max(0, periodEndMs - nowMs);
  if (total <= 0) return { credit_minor: 0, charge_minor: next.price_minor };
  const credit = Math.round((remaining / total) * current.price_minor);
  const charge = Math.round((remaining / total) * next.price_minor);
  return { credit_minor: credit, charge_minor: Math.max(0, charge - credit) };
}

export function nextRenewal(cycle: "monthly" | "yearly", from: Date = new Date()): Date {
  const d = new Date(from);
  if (cycle === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d;
}

// ============================================================================
// Wallet
// ============================================================================

export interface WalletTxn {
  id: string;
  kind: "purchase" | "refund" | "bonus" | "transfer_in" | "transfer_out" | "debit" | "adjustment";
  amount_minor: number; currency: Currency; created_at: string;
}

export function walletBalance(txns: WalletTxn[], currency: Currency): number {
  let bal = 0;
  for (const t of txns) {
    if (t.currency !== currency) continue;
    const positive = t.kind === "purchase" || t.kind === "refund" || t.kind === "bonus"
      || t.kind === "transfer_in" || (t.kind === "adjustment" && t.amount_minor > 0);
    bal += positive ? Math.abs(t.amount_minor) : -Math.abs(t.amount_minor);
  }
  return bal;
}

// ============================================================================
// Usage metering
// ============================================================================

export interface UsageEvent { kind: UsageKind; quantity: number; unit_cost_minor?: number; at_ms: number }

export interface MeteredCost { kind: UsageKind; quantity: number; cost_minor: number }

const DEFAULT_UNIT: Record<UsageKind, number> = {
  ai: 2, storage: 1, builder: 5, file: 1, search: 1, api: 1, automation: 3, analytics: 1,
};

export function meterUsage(events: UsageEvent[]): MeteredCost[] {
  const agg = new Map<UsageKind, { q: number; c: number }>();
  for (const e of events) {
    const unit = e.unit_cost_minor ?? DEFAULT_UNIT[e.kind];
    const cur = agg.get(e.kind) ?? { q: 0, c: 0 };
    cur.q += e.quantity; cur.c += Math.round(e.quantity * unit);
    agg.set(e.kind, cur);
  }
  return Array.from(agg.entries()).map(([kind, v]) => ({ kind, quantity: v.q, cost_minor: v.c }));
}

// ============================================================================
// Revenue intelligence (MRR / ARR / churn / LTV / forecast)
// ============================================================================

export interface ActiveSub { plan: PlanTier; mrr_minor: number; started_at_ms: number; canceled_at_ms?: number }

export function mrr(subs: ActiveSub[], nowMs: number = Date.now()): number {
  return subs.filter((s) => !s.canceled_at_ms || s.canceled_at_ms > nowMs)
    .reduce((s, x) => s + x.mrr_minor, 0);
}
export function arr(subs: ActiveSub[], nowMs?: number): number { return mrr(subs, nowMs) * 12; }

export function churnRate(subs: ActiveSub[], windowMs: number, nowMs: number = Date.now()): number {
  const startedBefore = subs.filter((s) => s.started_at_ms <= nowMs - windowMs).length;
  if (startedBefore === 0) return 0;
  const churned = subs.filter((s) => s.canceled_at_ms && s.canceled_at_ms >= nowMs - windowMs && s.canceled_at_ms <= nowMs).length;
  return churned / startedBefore;
}

export function retentionRate(subs: ActiveSub[], windowMs: number, nowMs?: number): number {
  return 1 - churnRate(subs, windowMs, nowMs);
}

export function ltv(avgMrr_minor: number, monthlyChurn: number): number {
  if (monthlyChurn <= 0) return Number.POSITIVE_INFINITY;
  return Math.round(avgMrr_minor / monthlyChurn);
}

export function forecastRevenue(currentMrr_minor: number, monthlyGrowthRate: number, months: number): number[] {
  const out: number[] = []; let m = currentMrr_minor;
  for (let i = 0; i < months; i++) { m = Math.round(m * (1 + monthlyGrowthRate)); out.push(m); }
  return out;
}

export function upgradeSuggestion(currentPlan: PlanTier, monthlySpendOverPlan_minor: number, currentPlanPrice_minor: number): PlanTier | null {
  if (monthlySpendOverPlan_minor > currentPlanPrice_minor * 1.5) {
    const order: PlanTier[] = ["free", "starter", "pro", "business", "enterprise"];
    const i = order.indexOf(currentPlan);
    if (i >= 0 && i < order.length - 1) return order[i + 1];
  }
  return null;
}

// ============================================================================
// Refunds
// ============================================================================

export interface RefundEligibility { ok: boolean; reason?: string; max_refund_minor: number }

export function eligibleForRefund(input: {
  amount_paid_minor: number; already_refunded_minor?: number;
  paid_at_ms: number; policy_days?: number; nowMs?: number;
}): RefundEligibility {
  const paid = input.amount_paid_minor;
  const already = input.already_refunded_minor ?? 0;
  const max = Math.max(0, paid - already);
  const days = input.policy_days ?? 30;
  const now = input.nowMs ?? Date.now();
  if (now - input.paid_at_ms > days * 86400_000) return { ok: false, reason: "policy_window", max_refund_minor: 0 };
  if (max <= 0) return { ok: false, reason: "already_refunded", max_refund_minor: 0 };
  return { ok: true, max_refund_minor: max };
}

// ============================================================================
// Brain + DH integration
// ============================================================================

export type RevenueIntent =
  | "credits" | "wallet" | "subscription" | "plan" | "billing"
  | "invoice" | "refund" | "coupon" | "tax" | "usage"
  | "analytics" | "forecast" | "enterprise";

const INTENT_MAP: Array<[RevenueIntent, RegExp]> = [
  ["credits",      /\b(credit|top[- ]?up|balance)\b/i],
  ["wallet",       /\b(wallet|purse|funds)\b/i],
  ["subscription", /\b(subscription|renew|cancel|resume)\b/i],
  ["plan",         /\b(plan|tier|upgrade|downgrade)\b/i],
  ["billing",      /\b(billing|charge|receipt)\b/i],
  ["invoice",      /\b(invoice|bill)\b/i],
  ["refund",       /\b(refund|chargeback|dispute)\b/i],
  ["coupon",       /\b(coupon|promo|discount|voucher)\b/i,],
  ["tax",          /\b(tax|gst|vat|hst)\b/i],
  ["usage",        /\b(usage|metering|consumption)\b/i],
  ["forecast",     /\b(forecast|projection)\b/i],
  ["analytics",    /\b(mrr|arr|churn|retention|ltv|revenue report)\b/i],
  ["enterprise",   /\b(enterprise|license|volume|contract)\b/i],
];

export function classifyRevenueIntent(q: string): RevenueIntent | null {
  for (const [k, re] of INTENT_MAP) if (re.test(q)) return k;
  return null;
}

export function resolveForBrain(query: string): {
  intent: RevenueIntent; route: string; suggestions: string[];
} | null {
  const intent = classifyRevenueIntent(query);
  if (!intent) return null;
  const routes: Record<RevenueIntent, string> = {
    credits: "/billing/credits", wallet: "/billing/wallet",
    subscription: "/billing/subscription", plan: "/billing/plans",
    billing: "/billing", invoice: "/billing/invoices",
    refund: "/billing/invoices", coupon: "/billing/coupons",
    tax: "/billing/tax", usage: "/billing/usage",
    forecast: "/revenue/forecast", analytics: "/revenue/analytics",
    enterprise: "/billing/enterprise",
  };
  return {
    intent, route: routes[intent],
    suggestions: ["View invoices", "Update plan", "Check credit balance", "See usage"],
  };
}

export function pickDhRevenueMode(intent: RevenueIntent): RevenueDhMode {
  switch (intent) {
    case "billing": case "invoice": case "tax":               return "billing";
    case "subscription": case "plan":                          return "subscription";
    case "coupon": case "forecast": case "enterprise":         return "sales";
    case "analytics":                                          return "founder";
    case "refund": case "credits": case "wallet": case "usage":return "support";
    default:                                                   return "support";
  }
}

// ============================================================================
// Permissions (6 roles × 10 caps)
// ============================================================================

const MATRIX: Record<RevenueRole, Set<RevenueCap>> = {
  viewer:      new Set(["view"]),
  member:      new Set(["view", "purchase"]),
  billing_ops: new Set(["view", "purchase", "refund", "issue_credit", "invoice_edit", "coupon_manage"]),
  finance:     new Set(["view", "purchase", "refund", "issue_credit", "invoice_edit", "tax_edit", "coupon_manage", "analytics"]),
  admin:       new Set(["view", "purchase", "refund", "issue_credit", "plan_change", "invoice_edit", "tax_edit", "coupon_manage", "analytics"]),
  founder:     new Set(["view", "purchase", "refund", "issue_credit", "plan_change", "invoice_edit", "tax_edit", "coupon_manage", "analytics", "impersonate"]),
};

export function revenueCan(role: RevenueRole, cap: RevenueCap): boolean {
  return MATRIX[role]?.has(cap) ?? false;
}

// ============================================================================
// Snapshot
// ============================================================================

export interface RevenueSnapshot {
  currency: Currency;
  mrr_minor: number; arr_minor: number;
  active_subs: number; canceled_subs: number;
  churn_30d: number; retention_30d: number;
  ltv_minor: number;
  credit_balance: number;
}

export function revenueSnapshot(input: {
  currency: Currency; subs: ActiveSub[]; credits: CreditEntry[];
  nowMs?: number;
}): RevenueSnapshot {
  const now = input.nowMs ?? Date.now();
  const active = input.subs.filter((s) => !s.canceled_at_ms || s.canceled_at_ms > now);
  const canceled = input.subs.filter((s) => s.canceled_at_ms && s.canceled_at_ms <= now);
  const monthMs = 30 * 86400_000;
  const churn = churnRate(input.subs, monthMs, now);
  const avg = active.length ? Math.round(mrr(active, now) / active.length) : 0;
  return {
    currency: input.currency,
    mrr_minor: mrr(active, now),
    arr_minor: arr(active, now),
    active_subs: active.length,
    canceled_subs: canceled.length,
    churn_30d: churn,
    retention_30d: 1 - churn,
    ltv_minor: ltv(avg, Math.max(churn, 0.0001)),
    credit_balance: creditBalance(input.credits),
  };
}
