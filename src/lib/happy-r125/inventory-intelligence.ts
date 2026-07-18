/**
 * R125 — HAPPY Inventory & Warehouse Intelligence™ (pure extension layer)
 *
 * FOUNDER LOCK (R91 / R111):
 *   - No Inventory V2. No Warehouse V2. No duplicate runtime, tables, or APIs.
 *   - Canonical owners (extended, never replaced):
 *       ERP Inventory RPCs   → `src/lib/erp/engine.ts` + `src/lib/erp/erp.functions.ts`
 *       Warehouse runtime    → `src/lib/warehouse-v10.functions.ts`
 *       Manufacturing        → `src/lib/manufacturing-v10.functions.ts`
 *       Business inventory   → `src/lib/business-v1.functions.ts`
 *       ERP Intelligence     → `src/lib/happy-r123/erp-intelligence.ts` (reused)
 *       Brain / Memory / Workspace / Search / Files / Digital Human — see R115–R120.
 *
 * Pure helpers only — no I/O, no state. All persistence flows through the
 * canonical RPC surface above.
 */

// ============================================================================
// Phase 2 — INVENTORY_ARCHITECTURE_V2 (types)
// ============================================================================

export type MovementKind =
  | "receipt" | "issue" | "transfer" | "adjustment"
  | "return" | "reservation" | "release" | "cycle_count";

export type LocationKind = "warehouse" | "zone" | "aisle" | "rack" | "shelf" | "bin";

export type TrackingMode = "none" | "batch" | "serial" | "lot";

export type AbcClass = "A" | "B" | "C";

export type MovementVelocity = "fast" | "medium" | "slow" | "dead";

export type WarehouseMode =
  | "receiving" | "putaway" | "picking" | "packing"
  | "dispatch" | "cross_dock" | "returns" | "cycle_count";

export type InventoryRole =
  | "viewer" | "clerk" | "picker" | "receiver"
  | "warehouse_manager" | "inventory_manager" | "admin";

export type InventoryCap =
  | "view" | "adjust" | "transfer" | "receive" | "issue"
  | "reserve" | "cycle_count" | "write_off" | "reopen";

export interface StockLine {
  item_id: string;
  warehouse_id?: string;
  bin_id?: string;
  on_hand: number;
  reserved?: number;
  incoming?: number;
  reorder_level?: number;
  safety_stock?: number;
  avg_daily_usage?: number;
  lead_time_days?: number;
  unit_cost_cents?: number;
  tracking?: TrackingMode;
  expires_at?: string;
  batch_id?: string;
  serial_no?: string;
  last_move_at?: string;
}

export interface Location {
  id: string;
  kind: LocationKind;
  parent_id?: string;
  code?: string;
  zone?: string;
}

export interface PickTask {
  item_id: string;
  qty: number;
  zone?: string;
  bin?: string;
  batch_id?: string;
  serial_no?: string;
}

// ============================================================================
// Phase 3 — Inventory Intelligence
// ============================================================================

export function availableQty(s: StockLine): number {
  return Math.max(0, (s.on_hand ?? 0) - (s.reserved ?? 0));
}

export function projectedOnHand(s: StockLine): number {
  return (s.on_hand ?? 0) - (s.reserved ?? 0) + (s.incoming ?? 0);
}

/** Safety stock = z * σ * sqrt(L). We accept caller-provided sigma; default z=1.65 (95%). */
export function safetyStock(sigmaDaily: number, leadTimeDays: number, z = 1.65): number {
  if (sigmaDaily <= 0 || leadTimeDays <= 0) return 0;
  return Math.ceil(z * sigmaDaily * Math.sqrt(leadTimeDays));
}

export function reorderPoint(s: StockLine, sigmaDaily = 0, z = 1.65): number {
  const lt = s.lead_time_days ?? 0;
  const avg = s.avg_daily_usage ?? 0;
  return Math.ceil(avg * lt + safetyStock(sigmaDaily, lt, z));
}

/** Economic Order Quantity (architecture-ready). D=annual demand, S=order cost, H=holding cost/unit/yr. */
export function eoq(annualDemand: number, orderCostCents: number, holdingCostCentsPerUnit: number): number {
  if (annualDemand <= 0 || orderCostCents <= 0 || holdingCostCentsPerUnit <= 0) return 0;
  return Math.ceil(Math.sqrt((2 * annualDemand * orderCostCents) / holdingCostCentsPerUnit));
}

export function needsReorder(s: StockLine, sigmaDaily = 0): boolean {
  return projectedOnHand(s) <= reorderPoint(s, sigmaDaily);
}

/** ABC classification by annual value contribution (Pareto: 80/15/5). */
export function abcClassify(items: Array<{ item_id: string; annual_value_cents: number }>): Record<string, AbcClass> {
  const sorted = [...items].sort((a, b) => b.annual_value_cents - a.annual_value_cents);
  const total = sorted.reduce((s, i) => s + Math.max(0, i.annual_value_cents), 0) || 1;
  const out: Record<string, AbcClass> = {};
  let cum = 0;
  for (const it of sorted) {
    cum += Math.max(0, it.annual_value_cents);
    const pct = cum / total;
    out[it.item_id] = pct <= 0.8 ? "A" : pct <= 0.95 ? "B" : "C";
  }
  return out;
}

/** Velocity classification: turnover ratio thresholds. Turnover = COGS / avgInventory. */
export function velocity(turnover: number, daysSinceLastMove = 0): MovementVelocity {
  if (daysSinceLastMove > 180) return "dead";
  if (turnover >= 6) return "fast";
  if (turnover >= 2) return "medium";
  return "slow";
}

export function deadStock(lines: StockLine[], asOf = new Date()): StockLine[] {
  return lines.filter((l) => {
    if ((l.on_hand ?? 0) <= 0) return false;
    if (!l.last_move_at) return true;
    const days = (asOf.getTime() - new Date(l.last_move_at).getTime()) / 86400000;
    return days > 180;
  });
}

// ============================================================================
// Phase 4 — Warehouse Intelligence
// ============================================================================

/** Nearest-neighbor style ordering by zone→aisle→bin. */
export function optimizePickPath(tasks: PickTask[]): PickTask[] {
  return [...tasks].sort((a, b) =>
    (a.zone ?? "").localeCompare(b.zone ?? "") ||
    (a.bin ?? "").localeCompare(b.bin ?? "")
  );
}

export function packingPlan(tasks: PickTask[], maxWeightPerBox = 20, avgWeight = 1): Array<{ box: number; tasks: PickTask[] }> {
  const boxes: Array<{ box: number; tasks: PickTask[]; weight: number }> = [];
  for (const t of tasks) {
    const w = (t.qty ?? 0) * avgWeight;
    let box = boxes.find((b) => b.weight + w <= maxWeightPerBox);
    if (!box) { box = { box: boxes.length + 1, tasks: [], weight: 0 }; boxes.push(box); }
    box.tasks.push(t); box.weight += w;
  }
  return boxes.map(({ box, tasks }) => ({ box, tasks }));
}

/** Cross-dock candidate: inbound qty matches an outbound need within window. */
export function crossDockCandidate(
  inbound: { item_id: string; qty: number; eta_hours: number },
  outbound: { item_id: string; qty: number; ship_within_hours: number },
): boolean {
  return inbound.item_id === outbound.item_id
    && inbound.qty >= outbound.qty
    && inbound.eta_hours <= outbound.ship_within_hours;
}

export function suggestPutawayBin(
  item: { item_id: string; velocity?: MovementVelocity },
  bins: Array<{ id: string; zone?: string; free_capacity: number }>,
): string | null {
  const preferred = item.velocity === "fast" ? "A" : item.velocity === "medium" ? "B" : "C";
  const candidates = bins.filter((b) => b.free_capacity > 0);
  const inZone = candidates.filter((b) => (b.zone ?? "").toUpperCase() === preferred);
  const pool = inZone.length ? inZone : candidates;
  return pool.sort((a, b) => b.free_capacity - a.free_capacity)[0]?.id ?? null;
}

// ============================================================================
// Phase 5 — Tracking (batch / serial / lot / expiry)
// ============================================================================

export function expiryBucket(s: StockLine, asOf = new Date()): "expired" | "critical" | "warning" | "ok" | "none" {
  if (!s.expires_at) return "none";
  const days = (new Date(s.expires_at).getTime() - asOf.getTime()) / 86400000;
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "ok";
}

/** FEFO pick order: earliest expiry first, then oldest last move. */
export function fefoOrder(lines: StockLine[]): StockLine[] {
  return [...lines].sort((a, b) => {
    const ae = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
    const be = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
    if (ae !== be) return ae - be;
    const am = a.last_move_at ? new Date(a.last_move_at).getTime() : 0;
    const bm = b.last_move_at ? new Date(b.last_move_at).getTime() : 0;
    return am - bm;
  });
}

/** Traceability chain: given a lot/batch id, resolve upstream (source) and downstream (consumers). */
export function traceabilityChain(
  moves: Array<{ id: string; batch_id?: string; kind: MovementKind; ref_id?: string; parent_batch?: string }>,
  batchId: string,
): { upstream: string[]; downstream: string[] } {
  const upstream: string[] = [];
  const downstream: string[] = [];
  for (const m of moves) {
    if (m.batch_id === batchId && m.parent_batch) upstream.push(m.parent_batch);
    if (m.parent_batch === batchId && m.batch_id) downstream.push(m.batch_id);
  }
  return { upstream: [...new Set(upstream)], downstream: [...new Set(downstream)] };
}

// ============================================================================
// Phase 6 — AI Inventory Intelligence
// ============================================================================

/** Simple moving average forecast — reused pattern from R123. */
export function forecastDemand(history: number[], window = 7, horizon = 7): number[] {
  if (!history.length) return Array(horizon).fill(0);
  const w = Math.min(window, history.length);
  const base = history.slice(-w).reduce((a, b) => a + b, 0) / w;
  return Array(horizon).fill(Math.max(0, base));
}

export type ReorderSuggestion = {
  item_id: string;
  action: "hold" | "reorder" | "urgent_reorder" | "write_off";
  suggested_qty: number;
  reason: string;
};

export function suggestReorder(s: StockLine, sigmaDaily = 0): ReorderSuggestion {
  const avail = availableQty(s);
  const rop = reorderPoint(s, sigmaDaily);
  const bucket = expiryBucket(s);
  if (bucket === "expired") return { item_id: s.item_id, action: "write_off", suggested_qty: s.on_hand ?? 0, reason: "expired_stock" };
  if (avail <= 0) return { item_id: s.item_id, action: "urgent_reorder", suggested_qty: Math.max(1, rop), reason: "stockout" };
  if (projectedOnHand(s) <= rop) {
    const target = rop + (s.safety_stock ?? 0);
    return { item_id: s.item_id, action: "reorder", suggested_qty: Math.max(1, target - projectedOnHand(s)), reason: "below_rop" };
  }
  return { item_id: s.item_id, action: "hold", suggested_qty: 0, reason: "sufficient" };
}

export function expiryAlerts(lines: StockLine[]): Array<{ item_id: string; bucket: ReturnType<typeof expiryBucket>; on_hand: number }> {
  return lines
    .map((l) => ({ item_id: l.item_id, bucket: expiryBucket(l), on_hand: l.on_hand ?? 0 }))
    .filter((r) => r.bucket === "expired" || r.bucket === "critical" || r.bucket === "warning");
}

/** Warehouse optimization score (0-100): fill rate, pick efficiency, accuracy. */
export function warehouseScore(p: { fillRatePct?: number; pickAccuracyPct?: number; onTimeDispatchPct?: number; inventoryAccuracyPct?: number }): number {
  const w = [p.fillRatePct ?? 0.9, p.pickAccuracyPct ?? 0.95, p.onTimeDispatchPct ?? 0.9, p.inventoryAccuracyPct ?? 0.95];
  return Math.round((w.reduce((a, b) => a + b, 0) / w.length) * 100);
}

// ============================================================================
// Phase 7 — Brain integration
// ============================================================================

export type InventoryDomain =
  | "stock" | "warehouse" | "picking" | "receiving"
  | "expiry" | "traceability" | "reorder" | "transfer" | "cycle_count";

export function resolveForBrain(prompt: string): { wantsInventory: boolean; domain?: InventoryDomain } {
  const p = prompt.toLowerCase();
  const map: Array<[RegExp, InventoryDomain]> = [
    [/\b(pick|picking|pick\s*list)\b/, "picking"],
    [/\b(receive|receiving|grn|inbound)\b/, "receiving"],
    [/\b(expiry|expire|fefo|shelf\s*life)\b/, "expiry"],
    [/\b(trace|traceab|lot\s*trace|batch\s*trace)\b/, "traceability"],
    [/\b(reorder|replenish|rop|safety\s*stock|eoq)\b/, "reorder"],
    [/\b(transfer|move\s*stock|inter[- ]?warehouse)\b/, "transfer"],
    [/\b(cycle\s*count|stock\s*count|physical\s*count)\b/, "cycle_count"],
    [/\b(warehouse|bin|zone|shelf|aisle|rack)\b/, "warehouse"],
    [/\b(stock|inventory|on[- ]?hand|available)\b/, "stock"],
  ];
  for (const [re, domain] of map) if (re.test(p)) return { wantsInventory: true, domain };
  return { wantsInventory: false };
}

// ============================================================================
// Phase 8 — Digital Human modes
// ============================================================================

export function pickDhInventoryMode(input: {
  domain?: InventoryDomain;
  isManager?: boolean;
  hasSlides?: boolean;
}): "warehouse" | "inventory" | "factory" | "manager" | "presentation" {
  if (input.hasSlides) return "presentation";
  if (input.isManager) return "manager";
  if (input.domain === "warehouse" || input.domain === "picking" || input.domain === "receiving") return "warehouse";
  if (input.domain === "traceability") return "factory";
  return "inventory";
}

// ============================================================================
// Phase 9 — Analytics
// ============================================================================

export function inventoryTurns(cogsCents: number, avgInventoryCents: number): number {
  if (avgInventoryCents <= 0) return 0;
  return +(cogsCents / avgInventoryCents).toFixed(2);
}

export function stockHealth(lines: StockLine[]): { total: number; stockout: number; low: number; healthy: number; expired: number } {
  let stockout = 0, low = 0, healthy = 0, expired = 0;
  for (const l of lines) {
    if (expiryBucket(l) === "expired") { expired++; continue; }
    const avail = availableQty(l);
    if (avail <= 0) stockout++;
    else if (avail <= (l.reorder_level ?? 0)) low++;
    else healthy++;
  }
  return { total: lines.length, stockout, low, healthy, expired };
}

export function inventoryAccuracy(counted: number, recorded: number): number {
  if (recorded <= 0) return counted === 0 ? 1 : 0;
  return +(1 - Math.abs(counted - recorded) / recorded).toFixed(4);
}

export function inventorySnapshot(input: {
  stock: StockLine[];
  cogsCents?: number;
  avgInventoryCents?: number;
  warehouseKpis?: Parameters<typeof warehouseScore>[0];
}): {
  health: ReturnType<typeof stockHealth>;
  reorder_count: number;
  expiring_soon: number;
  turnover: number;
  warehouse_score: number;
  dead_stock: number;
} {
  const health = stockHealth(input.stock);
  const reorder_count = input.stock.filter((s) => needsReorder(s)).length;
  const expiring_soon = expiryAlerts(input.stock).length;
  return {
    health,
    reorder_count,
    expiring_soon,
    turnover: inventoryTurns(input.cogsCents ?? 0, input.avgInventoryCents ?? 0),
    warehouse_score: warehouseScore(input.warehouseKpis ?? {}),
    dead_stock: deadStock(input.stock).length,
  };
}

// ============================================================================
// Permissions — role × capability matrix
// ============================================================================

const MATRIX: Record<InventoryRole, InventoryCap[]> = {
  viewer:            ["view"],
  clerk:             ["view", "adjust", "cycle_count"],
  picker:            ["view", "issue", "reserve"],
  receiver:          ["view", "receive", "adjust"],
  warehouse_manager: ["view", "adjust", "transfer", "receive", "issue", "reserve", "cycle_count"],
  inventory_manager: ["view", "adjust", "transfer", "receive", "issue", "reserve", "cycle_count", "write_off"],
  admin:             ["view", "adjust", "transfer", "receive", "issue", "reserve", "cycle_count", "write_off", "reopen"],
};

export function inventoryCan(role: InventoryRole, cap: InventoryCap): boolean {
  return MATRIX[role]?.includes(cap) ?? false;
}
