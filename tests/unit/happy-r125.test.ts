import { describe, it, expect } from "vitest";
import {
  availableQty, projectedOnHand, safetyStock, reorderPoint, eoq, needsReorder,
  abcClassify, velocity, deadStock,
  optimizePickPath, packingPlan, crossDockCandidate, suggestPutawayBin,
  expiryBucket, fefoOrder, traceabilityChain,
  forecastDemand, suggestReorder, expiryAlerts, warehouseScore,
  resolveForBrain, pickDhInventoryMode,
  inventoryTurns, stockHealth, inventoryAccuracy, inventorySnapshot,
  inventoryCan,
} from "@/lib/happy-r125/inventory-intelligence";

describe("R125 Inventory & Warehouse Intelligence", () => {
  it("computes availability, projected on-hand, and reorder", () => {
    const s = { item_id: "x", on_hand: 10, reserved: 3, incoming: 2, avg_daily_usage: 2, lead_time_days: 3, reorder_level: 5 };
    expect(availableQty(s)).toBe(7);
    expect(projectedOnHand(s)).toBe(9);
    expect(reorderPoint(s)).toBeGreaterThanOrEqual(6);
    expect(safetyStock(2, 4)).toBeGreaterThan(0);
    expect(needsReorder({ ...s, on_hand: 5, reserved: 4, incoming: 0 })).toBe(true);
  });

  it("computes EOQ", () => {
    expect(eoq(0, 1, 1)).toBe(0);
    expect(eoq(1000, 5000, 200)).toBeGreaterThan(0);
  });

  it("classifies ABC by value", () => {
    const r = abcClassify([
      { item_id: "a", annual_value_cents: 8000 },
      { item_id: "b", annual_value_cents: 1500 },
      { item_id: "c", annual_value_cents: 500 },
    ]);
    expect(r.a).toBe("A"); expect(r.b).toBe("B"); expect(r.c).toBe("C");
  });

  it("classifies velocity and dead stock", () => {
    expect(velocity(8)).toBe("fast");
    expect(velocity(3)).toBe("medium");
    expect(velocity(1)).toBe("slow");
    expect(velocity(1, 400)).toBe("dead");
    const old = new Date(Date.now() - 200 * 86400000).toISOString();
    expect(deadStock([{ item_id: "x", on_hand: 5, last_move_at: old }]).length).toBe(1);
  });

  it("optimizes pick path and packs boxes", () => {
    const path = optimizePickPath([
      { item_id: "a", qty: 1, zone: "B", bin: "2" },
      { item_id: "b", qty: 1, zone: "A", bin: "3" },
      { item_id: "c", qty: 1, zone: "A", bin: "1" },
    ]);
    expect(path.map((p) => p.item_id)).toEqual(["c", "b", "a"]);
    const boxes = packingPlan([{ item_id: "x", qty: 15 }, { item_id: "y", qty: 10 }], 20, 1);
    expect(boxes.length).toBe(2);
  });

  it("detects cross-dock candidates and picks putaway bins", () => {
    expect(crossDockCandidate({ item_id: "x", qty: 10, eta_hours: 4 }, { item_id: "x", qty: 5, ship_within_hours: 8 })).toBe(true);
    expect(crossDockCandidate({ item_id: "x", qty: 3, eta_hours: 4 }, { item_id: "x", qty: 5, ship_within_hours: 8 })).toBe(false);
    const bin = suggestPutawayBin({ item_id: "i", velocity: "fast" }, [
      { id: "b1", zone: "C", free_capacity: 10 },
      { id: "b2", zone: "A", free_capacity: 5 },
    ]);
    expect(bin).toBe("b2");
  });

  it("buckets expiry and orders FEFO", () => {
    expect(expiryBucket({ item_id: "x", on_hand: 1, expires_at: new Date(Date.now() - 86400000).toISOString() })).toBe("expired");
    expect(expiryBucket({ item_id: "x", on_hand: 1 })).toBe("none");
    const soon = new Date(Date.now() + 3 * 86400000).toISOString();
    const later = new Date(Date.now() + 60 * 86400000).toISOString();
    const ord = fefoOrder([
      { item_id: "b", on_hand: 1, expires_at: later },
      { item_id: "a", on_hand: 1, expires_at: soon },
    ]);
    expect(ord[0].item_id).toBe("a");
  });

  it("traces batch upstream/downstream", () => {
    const t = traceabilityChain([
      { id: "1", batch_id: "B1", parent_batch: "R1", kind: "receipt" },
      { id: "2", batch_id: "F1", parent_batch: "B1", kind: "issue" },
    ], "B1");
    expect(t.upstream).toEqual(["R1"]);
    expect(t.downstream).toEqual(["F1"]);
  });

  it("forecasts demand, suggests reorder, and warns on expiry", () => {
    expect(forecastDemand([5, 5, 5, 5], 4, 3)).toEqual([5, 5, 5]);
    const s = suggestReorder({ item_id: "x", on_hand: 0, reorder_level: 5, avg_daily_usage: 2, lead_time_days: 3 });
    expect(s.action).toBe("urgent_reorder");
    const w = suggestReorder({ item_id: "x", on_hand: 10, expires_at: new Date(Date.now() - 86400000).toISOString() });
    expect(w.action).toBe("write_off");
    expect(expiryAlerts([{ item_id: "x", on_hand: 1, expires_at: new Date(Date.now() + 3 * 86400000).toISOString() }]).length).toBe(1);
    expect(warehouseScore({ fillRatePct: 1, pickAccuracyPct: 1, onTimeDispatchPct: 1, inventoryAccuracyPct: 1 })).toBe(100);
  });

  it("routes Brain to inventory domain", () => {
    expect(resolveForBrain("what is my next meeting").wantsInventory).toBe(false);
    expect(resolveForBrain("build a picking list").domain).toBe("picking");
    expect(resolveForBrain("check expiry alerts").domain).toBe("expiry");
    expect(resolveForBrain("suggest reorder qty").domain).toBe("reorder");
    expect(resolveForBrain("do a cycle count").domain).toBe("cycle_count");
    expect(resolveForBrain("trace this batch").domain).toBe("traceability");
  });

  it("picks DH mode", () => {
    expect(pickDhInventoryMode({ hasSlides: true })).toBe("presentation");
    expect(pickDhInventoryMode({ isManager: true })).toBe("manager");
    expect(pickDhInventoryMode({ domain: "picking" })).toBe("warehouse");
    expect(pickDhInventoryMode({ domain: "traceability" })).toBe("factory");
    expect(pickDhInventoryMode({ domain: "stock" })).toBe("inventory");
  });

  it("computes analytics", () => {
    expect(inventoryTurns(100000, 20000)).toBe(5);
    const h = stockHealth([
      { item_id: "a", on_hand: 0 },
      { item_id: "b", on_hand: 10, reorder_level: 5 },
      { item_id: "c", on_hand: 2, reorder_level: 5 },
      { item_id: "d", on_hand: 5, expires_at: new Date(Date.now() - 86400000).toISOString() },
    ]);
    expect(h.stockout).toBe(1);
    expect(h.healthy).toBe(1);
    expect(h.low).toBe(1);
    expect(h.expired).toBe(1);
    expect(inventoryAccuracy(95, 100)).toBeCloseTo(0.95, 2);
    const snap = inventorySnapshot({ stock: [{ item_id: "x", on_hand: 0, reorder_level: 5, avg_daily_usage: 1, lead_time_days: 2 }], cogsCents: 10000, avgInventoryCents: 2000 });
    expect(snap.reorder_count).toBe(1);
    expect(snap.turnover).toBe(5);
  });

  it("enforces role × capability matrix", () => {
    expect(inventoryCan("viewer", "view")).toBe(true);
    expect(inventoryCan("viewer", "adjust")).toBe(false);
    expect(inventoryCan("picker", "issue")).toBe(true);
    expect(inventoryCan("receiver", "receive")).toBe(true);
    expect(inventoryCan("warehouse_manager", "transfer")).toBe(true);
    expect(inventoryCan("inventory_manager", "write_off")).toBe(true);
    expect(inventoryCan("admin", "reopen")).toBe(true);
    expect(inventoryCan("clerk", "write_off")).toBe(false);
  });
});
