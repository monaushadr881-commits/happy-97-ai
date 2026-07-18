import { describe, it, expect } from "vitest";
import {
  ancestorsOf, compareSuppliers, threeWayMatch, explodeBom, pickMachine, oee,
  availableQty, needsReorder, reorderQty, expiryBucket, optimizePickList,
  buildJournal, isJournalBalanced, convertCurrency,
  forecastDemand, supplierRisk, suggestProcurement,
  businessHealth, resolveForBrain, pickDhErpMode, erpCan, erpAnalyticsSnapshot,
} from "@/lib/happy-r123/erp-intelligence";

describe("R123 ERP Intelligence", () => {
  it("resolves org unit ancestors", () => {
    const units = [
      { id: "c", kind: "company" as const, company_id: "c", name: "Co" },
      { id: "b", kind: "branch" as const, parent_id: "c", company_id: "c", name: "Br" },
      { id: "d", kind: "department" as const, parent_id: "b", company_id: "c", name: "Dp" },
    ];
    expect(ancestorsOf(units, "d").map(u => u.id)).toEqual(["d","b","c"]);
  });

  it("compares suppliers weighted by price/lead/rating", () => {
    const ranked = compareSuppliers([
      { supplier_id: "A", unit_price_cents: 100, lead_time_days: 10, rating: 4 },
      { supplier_id: "B", unit_price_cents: 80,  lead_time_days: 20, rating: 3 },
    ]);
    expect(ranked[0].supplier_id).toBe("A");
  });

  it("performs 3-way match with tolerance", () => {
    const ok = threeWayMatch({ qty: 100, unit_price_cents: 500 }, { qty_received: 100 }, { qty_billed: 100, unit_price_cents: 500 });
    expect(ok.ok).toBe(true);
    const bad = threeWayMatch({ qty: 100, unit_price_cents: 500 }, { qty_received: 100 }, { qty_billed: 100, unit_price_cents: 600 });
    expect(bad.ok).toBe(false);
    expect(bad.reasons).toContain("price_mismatch");
  });

  it("explodes BOM with scrap and picks least-loaded machine", () => {
    const need = explodeBom([{ component_id: "x", qty_per_unit: 2, scrap_pct: 0.1 }], 10);
    expect(need[0].required).toBeCloseTo(22);
    const m = pickMachine([
      { id: "m1", capability: "weld", load_pct: 80, available: true },
      { id: "m2", capability: "weld", load_pct: 20, available: true },
      { id: "m3", capability: "weld", load_pct: 10, available: false },
    ], "weld");
    expect(m!.id).toBe("m2");
    expect(oee(0.9, 0.9, 0.95)).toBeCloseTo(0.9 * 0.9 * 0.95);
  });

  it("computes inventory availability, reorder need, qty, and expiry buckets", () => {
    const line = { item_id: "i", on_hand: 5, reserved: 2, reorder_level: 5, avg_daily_usage: 3, lead_time_days: 5 };
    expect(availableQty(line)).toBe(3);
    expect(needsReorder(line)).toBe(true);
    expect(reorderQty(line)).toBeGreaterThan(0);
    expect(expiryBucket({ item_id: "i", on_hand: 0, expires_at: new Date(Date.now() - 86400000).toISOString() })).toBe("expired");
    expect(expiryBucket({ item_id: "i", on_hand: 0 })).toBe("none");
  });

  it("optimizes pick list by zone then bin", () => {
    const list = optimizePickList([
      { item_id: "a", qty: 1, zone: "B", bin: "2" },
      { item_id: "b", qty: 1, zone: "A", bin: "3" },
      { item_id: "c", qty: 1, zone: "A", bin: "1" },
    ]);
    expect(list.map(l => l.item_id)).toEqual(["c","b","a"]);
  });

  it("builds balanced journal entries per finance doc kind", () => {
    for (const kind of ["purchase_invoice","sales_invoice","payment","expense","asset_acquisition","asset_depreciation","tax_adjustment"] as const) {
      const j = buildJournal(kind, 10000, kind === "asset_depreciation" || kind === "tax_adjustment" || kind === "payment" ? 0 : 1800);
      expect(isJournalBalanced(j)).toBe(true);
    }
  });

  it("converts currency using rates", () => {
    expect(convertCurrency(1000, "USD", "USD", {})).toBe(1000);
    expect(convertCurrency(1000, "USD", "INR", { "USD->INR": 83 })).toBe(83000);
    expect(() => convertCurrency(100, "USD", "EUR", {})).toThrow(/missing_rate/);
  });

  it("forecasts demand and rates supplier risk", () => {
    const f = forecastDemand([10, 12, 8, 11, 9, 10, 11], 7, 5);
    expect(f).toHaveLength(5);
    expect(f[0]).toBeGreaterThan(0);
    const r = supplierRisk({ on_time_pct: 0.5, quality_pct: 0.7, disputes: 2 });
    expect(r).toBeGreaterThan(0.3);
  });

  it("suggests procurement action", () => {
    const low = { item_id: "i", on_hand: 1, reorder_level: 5 };
    expect(suggestProcurement(low, 0.2)).toBe("reorder");
    expect(suggestProcurement(low, 0.9)).toBe("diversify_supplier");
  });

  it("scores business health with grade", () => {
    const h = businessHealth({ onTimeProductionPct: 0.95, inventoryTurnover: 10, workingCapitalRatio: 2, qualityPct: 0.98, machineUtilization: 0.85, supplierRisk: 0.1 });
    expect(h.score).toBeGreaterThanOrEqual(70);
    expect(["A","B","C","D","F"]).toContain(h.grade);
    const weak = businessHealth({ supplierRisk: 0.8, qualityPct: 0.7, workingCapitalRatio: 0.5, machineUtilization: 0.3 });
    expect(weak.risks.length).toBeGreaterThan(0);
  });

  it("routes Brain to ERP domain", () => {
    expect(resolveForBrain("what's for lunch").wantsErp).toBe(false);
    expect(resolveForBrain("show open purchase orders").domain).toBe("procurement");
    expect(resolveForBrain("inventory reorder items").domain).toBe("inventory");
    expect(resolveForBrain("post the sales invoice to GL").domain).toBe("finance");
  });

  it("picks DH ERP mode", () => {
    expect(pickDhErpMode({ hasSlides: true })).toBe("presentation");
    expect(pickDhErpMode({ isExec: true })).toBe("management");
    expect(pickDhErpMode({ domain: "manufacturing" })).toBe("production");
    expect(pickDhErpMode({ domain: "warehouse" })).toBe("warehouse");
    expect(pickDhErpMode({ domain: "finance" })).toBe("finance");
  });

  it("enforces role x capability matrix", () => {
    expect(erpCan("viewer", "view")).toBe(true);
    expect(erpCan("viewer", "post")).toBe(false);
    expect(erpCan("finance", "post")).toBe(true);
    expect(erpCan("production", "post")).toBe(false);
    expect(erpCan("admin", "reopen")).toBe(true);
  });

  it("builds analytics snapshot", () => {
    const snap = erpAnalyticsSnapshot({
      stock: [{ item_id: "x", on_hand: 1, reorder_level: 5 }],
      demandHistory: [1, 2, 3],
      supplier: { on_time_pct: 0.9, quality_pct: 0.95 },
      health: { onTimeProductionPct: 0.9 },
    });
    expect(snap.reorder_count).toBe(1);
    expect(snap.forecast_next_7).toHaveLength(7);
    expect(snap.health?.grade).toBeDefined();
  });
});
