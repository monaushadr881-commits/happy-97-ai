import { describe, it, expect } from "vitest";
import {
  toMinor, toMajor,
  creditBalance, expiringSoon, computeExpiry,
  validateCoupon, applyCoupon,
  computeTax, buildInvoice, creditNote,
  planUpgradePath, prorate, nextRenewal,
  walletBalance,
  meterUsage,
  mrr, arr, churnRate, retentionRate, ltv, forecastRevenue, upgradeSuggestion,
  eligibleForRefund,
  classifyRevenueIntent, resolveForBrain, pickDhRevenueMode,
  revenueCan, revenueSnapshot,
} from "@/lib/happy-r128/revenue-intelligence";

describe("R128 Revenue OS Intelligence", () => {
  it("money math handles zero-decimal + normal currencies", () => {
    expect(toMinor(9.99, "USD")).toBe(999);
    expect(toMinor(1000, "JPY")).toBe(1000);
    expect(toMajor(999, "USD")).toBe(9.99);
  });

  it("credit ledger + expiry policy", () => {
    const now = Date.now();
    const entries = [
      { id: "1", kind: "purchase" as const, txn: "credit" as const, amount: 100, created_at: new Date(now).toISOString() },
      { id: "2", kind: "bonus"    as const, txn: "credit" as const, amount: 20,  created_at: new Date(now).toISOString(),
        expires_at: new Date(now + 3 * 86400_000).toISOString() },
      { id: "3", kind: "purchase" as const, txn: "debit"  as const, amount: 30,  created_at: new Date(now).toISOString() },
      { id: "4", kind: "purchase" as const, txn: "hold"   as const, amount: 5,   created_at: new Date(now).toISOString() },
    ];
    expect(creditBalance(entries)).toBe(85);
    expect(expiringSoon(entries, 14, now).length).toBe(1);
    expect(computeExpiry("purchase")).toBeUndefined();
    expect(computeExpiry("bonus")).toMatch(/T/);
  });

  it("coupon validation and application", () => {
    const c = { code: "SAVE20", kind: "percent" as const, value: 20 };
    expect(applyCoupon(c, { amount_minor: 1000, currency: "USD" })).toEqual({
      discount_minor: 200, total_minor: 800, credit_bonus: 0,
    });
    const expired = { code: "OLD", kind: "amount" as const, value: 500, expires_at: new Date(Date.now() - 1000).toISOString() };
    expect(validateCoupon(expired, { amount_minor: 1000, currency: "USD" }).ok).toBe(false);
    const bonus = { code: "GIFT", kind: "credits" as const, value: 50 };
    expect(applyCoupon(bonus, { amount_minor: 1000, currency: "USD" }).credit_bonus).toBe(50);
  });

  it("tax engine handles GST (intra vs inter state) and EU reverse charge", () => {
    const intra = computeTax(10000, { seller_country: "IN", buyer_country: "IN", buyer_state: "MH",
      // seller_state matches → CGST+SGST
      ...({ seller_state: "MH" } as never) });
    expect(intra.lines.map((l) => l.name).sort()).toEqual(["CGST", "SGST"]);
    expect(intra.total_tax_minor).toBe(1800);
    const inter = computeTax(10000, { seller_country: "IN", buyer_country: "IN", buyer_state: "KA" });
    expect(inter.lines[0].name).toBe("IGST");
    const rc = computeTax(10000, { seller_country: "DE", buyer_country: "FR", buyer_is_business: true });
    expect(rc.reverse_charge).toBe(true);
    expect(rc.total_tax_minor).toBe(0);
    const b2c = computeTax(10000, { seller_country: "DE", buyer_country: "FR" });
    expect(b2c.total_tax_minor).toBe(2000);
  });

  it("invoice builder + credit note", () => {
    const inv = buildInvoice({
      currency: "USD",
      lines: [{ description: "Pro", quantity: 1, unit_price_minor: 2900 }],
      coupon: { code: "TENOFF", kind: "amount", value: 200 },
    });
    expect(inv.subtotal_minor).toBe(2900);
    expect(inv.discount_minor).toBe(200);
    expect(inv.total_minor).toBe(2700);
    const cn = creditNote(inv, 1000);
    expect(cn.total_minor).toBe(-1000);
  });

  it("plan upgrade path + prorate + renewal", () => {
    expect(planUpgradePath("starter", "pro")).toBe("upgrade");
    expect(planUpgradePath("pro", "starter")).toBe("downgrade");
    const start = Date.UTC(2026, 0, 1), end = Date.UTC(2026, 1, 1), now = Date.UTC(2026, 0, 16);
    const p = prorate(
      { tier: "starter", price_minor: 1000, currency: "USD", interval: "monthly" },
      { tier: "pro",     price_minor: 3000, currency: "USD", interval: "monthly" },
      start, end, now,
    );
    expect(p.charge_minor).toBeGreaterThan(0);
    expect(p.credit_minor).toBeGreaterThan(0);
    expect(nextRenewal("monthly", new Date("2026-01-15T00:00:00Z")).getUTCMonth()).toBe(1);
  });

  it("wallet balance ignores foreign currency", () => {
    const now = new Date().toISOString();
    expect(walletBalance([
      { id: "a", kind: "purchase", amount_minor: 5000, currency: "USD", created_at: now },
      { id: "b", kind: "debit",    amount_minor: 1500, currency: "USD", created_at: now },
      { id: "c", kind: "purchase", amount_minor: 9999, currency: "EUR", created_at: now },
    ], "USD")).toBe(3500);
  });

  it("usage metering aggregates by kind", () => {
    const now = Date.now();
    const rows = meterUsage([
      { kind: "ai", quantity: 10, at_ms: now },
      { kind: "ai", quantity: 5,  at_ms: now, unit_cost_minor: 3 },
      { kind: "storage", quantity: 100, at_ms: now },
    ]);
    const ai = rows.find((r) => r.kind === "ai")!;
    expect(ai.quantity).toBe(15);
    expect(ai.cost_minor).toBe(10 * 2 + 5 * 3);
  });

  it("MRR / ARR / churn / retention / LTV / forecast / upgrade suggestion", () => {
    const now = Date.now();
    const subs = [
      { plan: "pro" as const, mrr_minor: 2900, started_at_ms: now - 90 * 86400_000 },
      { plan: "pro" as const, mrr_minor: 2900, started_at_ms: now - 90 * 86400_000, canceled_at_ms: now - 5 * 86400_000 },
      { plan: "starter" as const, mrr_minor: 900, started_at_ms: now - 60 * 86400_000 },
    ];
    expect(mrr(subs, now)).toBe(3800);
    expect(arr(subs, now)).toBe(3800 * 12);
    const ch = churnRate(subs, 30 * 86400_000, now);
    expect(ch).toBeGreaterThan(0);
    expect(retentionRate(subs, 30 * 86400_000, now)).toBeCloseTo(1 - ch);
    expect(ltv(2000, 0.05)).toBe(40000);
    const f = forecastRevenue(1000, 0.1, 3);
    expect(f.length).toBe(3);
    expect(f[2]).toBeGreaterThan(f[0]);
    expect(upgradeSuggestion("starter", 5000, 900)).toBe("pro");
    expect(upgradeSuggestion("free", 10, 0)).toBe("starter");
  });

  it("refund policy window", () => {
    const now = Date.now();
    expect(eligibleForRefund({ amount_paid_minor: 1000, paid_at_ms: now, nowMs: now }).ok).toBe(true);
    expect(eligibleForRefund({ amount_paid_minor: 1000, paid_at_ms: now - 60 * 86400_000, nowMs: now }).ok).toBe(false);
    expect(eligibleForRefund({ amount_paid_minor: 1000, already_refunded_minor: 1000, paid_at_ms: now, nowMs: now }).ok).toBe(false);
  });

  it("brain intent + DH mode + permissions + snapshot", () => {
    expect(classifyRevenueIntent("cancel my subscription")).toBe("subscription");
    expect(classifyRevenueIntent("show me MRR")).toBe("analytics");
    expect(resolveForBrain("apply a promo code")?.intent).toBe("coupon");
    expect(pickDhRevenueMode("analytics")).toBe("founder");
    expect(pickDhRevenueMode("subscription")).toBe("subscription");
    expect(revenueCan("viewer", "refund")).toBe(false);
    expect(revenueCan("billing_ops", "refund")).toBe(true);
    expect(revenueCan("founder", "impersonate")).toBe(true);
    const snap = revenueSnapshot({
      currency: "USD",
      subs: [{ plan: "pro", mrr_minor: 2900, started_at_ms: Date.now() - 60 * 86400_000 }],
      credits: [{ id: "1", kind: "purchase", txn: "credit", amount: 100, created_at: new Date().toISOString() }],
    });
    expect(snap.mrr_minor).toBe(2900);
    expect(snap.credit_balance).toBe(100);
  });
});
