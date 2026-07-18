/**
 * R123 — HAPPY ERP Intelligence™ (pure extension layer)
 *
 * FOUNDER LOCK (R91 / R111):
 *   - No ERP V2. No duplicate inventory / procurement / finance runtime.
 *   - Canonical ERP owner: `src/lib/erp/engine.ts` + `src/lib/erp/erp.functions.ts`
 *     (plus `src/lib/erp/core.ts` for org/branch/dept).
 *   - Related canonical owners we integrate with (never duplicate):
 *       Manufacturing  → `src/lib/manufacturing-v10.functions.ts`
 *       Warehouse      → `src/lib/warehouse-v10.functions.ts`
 *       Finance        → `src/lib/finance/*` and `src/lib/finance-v7.functions.ts`
 *       Payments       → `src/lib/payments/*`
 *       CRM            → `src/lib/crm/*` (+ R122)
 *       Company/Org    → `src/services/domain/company.service.ts`
 *       Workspace      → `src/services/domain/workspace.service.ts` (+ R118)
 *       Brain          → `src/lib/brain/engine.ts` (R115.b/.c)
 *       Memory         → `src/lib/memory/engine.ts` (R116)
 *       Search         → `src/services/domain/search.service.ts` (+ R120)
 *       Files          → `src/lib/happy-r112/files-upload.ts` (+ R119)
 *       Digital Human  → `src/components/happy-desk/HappyDesk.tsx` (+ R117)
 *
 * Pure helpers only — no I/O, no state. All CRUD flows through the canonical
 * ERP RPC surface (`erp.functions.ts`) and its sibling domain modules.
 */

// ============================================================================
// Phase 2 — ERP_ARCHITECTURE_V2 (types)
// ============================================================================

/** Organizational unit hierarchy. */
export type OrgUnitKind =
  | "company" | "branch" | "department" | "factory"
  | "warehouse" | "store" | "office" | "cost_center" | "business_unit";

/** Procurement lifecycle. */
export type ProcurementStage =
  | "request" | "rfq" | "comparison" | "po_issued"
  | "goods_receipt" | "invoice_matched" | "closed" | "cancelled";

/** Production lifecycle. */
export type ProductionStage =
  | "planned" | "released" | "in_progress" | "qc" | "completed" | "cancelled";

/** Inventory movement kinds. */
export type StockMoveKind =
  | "receipt" | "issue" | "transfer" | "adjustment" | "return" | "reservation" | "release";

/** Warehouse operation. */
export type WarehouseOp =
  | "inbound" | "outbound" | "picking" | "packing" | "dispatch" | "returns";

/** Finance document kinds bridging ERP → GL. */
export type FinanceDocKind =
  | "purchase_invoice" | "sales_invoice" | "expense" | "payment"
  | "asset_acquisition" | "asset_depreciation" | "tax_adjustment";

export type ErpRole =
  | "owner" | "admin" | "finance" | "procurement"
  | "production" | "warehouse" | "quality" | "viewer";

export type ErpCap =
  | "view" | "create" | "edit" | "delete" | "approve"
  | "receive" | "issue" | "transfer" | "adjust"
  | "post" | "reverse" | "close" | "reopen";

// ============================================================================
// Phase 3 — Organization Management
// ============================================================================

export interface OrgUnit {
  id: string;
  kind: OrgUnitKind;
  parent_id?: string | null;
  company_id: string;
  name: string;
}

/** Resolve ancestor chain for cost-center rollups / consolidated reports. */
export function ancestorsOf(units: OrgUnit[], id: string): OrgUnit[] {
  const byId = new Map(units.map((u) => [u.id, u]));
  const chain: OrgUnit[] = [];
  let cur = byId.get(id);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.push(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return chain;
}

// ============================================================================
// Phase 4 — Procurement
// ============================================================================

export interface RfqQuote {
  supplier_id: string;
  unit_price_cents: number;
  lead_time_days: number;
  rating?: number;        // 0..5
  moq?: number;
}

/** Weighted supplier comparison — lower score = better. Pure. */
export function compareSuppliers(quotes: RfqQuote[], w = { price: 0.6, lead: 0.25, rating: 0.15 }) {
  if (!quotes.length) return [];
  const maxPrice = Math.max(...quotes.map((q) => q.unit_price_cents)) || 1;
  const maxLead  = Math.max(...quotes.map((q) => q.lead_time_days)) || 1;
  return quotes
    .map((q) => {
      const priceN = q.unit_price_cents / maxPrice;
      const leadN  = q.lead_time_days / maxLead;
      const ratingN = 1 - Math.min(5, q.rating ?? 3) / 5;
      const score = w.price * priceN + w.lead * leadN + w.rating * ratingN;
      return { ...q, score };
    })
    .sort((a, b) => a.score - b.score);
}

/** 3-way match: PO ↔ Goods Receipt ↔ Vendor Invoice. */
export function threeWayMatch(
  po: { qty: number; unit_price_cents: number },
  gr: { qty_received: number },
  inv: { qty_billed: number; unit_price_cents: number },
  tolerance = 0.02,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (gr.qty_received > po.qty * (1 + tolerance)) reasons.push("over_receipt");
  if (inv.qty_billed > gr.qty_received * (1 + tolerance)) reasons.push("over_billed");
  const priceDelta = Math.abs(inv.unit_price_cents - po.unit_price_cents) / (po.unit_price_cents || 1);
  if (priceDelta > tolerance) reasons.push("price_mismatch");
  return { ok: reasons.length === 0, reasons };
}

// ============================================================================
// Phase 5 — Manufacturing
// ============================================================================

export interface BomLine { component_id: string; qty_per_unit: number; scrap_pct?: number }

/** Explode BOM for a production quantity, accounting for scrap. */
export function explodeBom(bom: BomLine[], produceQty: number): { component_id: string; required: number }[] {
  return bom.map((l) => ({
    component_id: l.component_id,
    required: produceQty * l.qty_per_unit * (1 + (l.scrap_pct ?? 0)),
  }));
}

/** Machine allocation: pick least-loaded machine with matching capability. */
export interface MachineSlot { id: string; capability: string; load_pct: number; available: boolean }
export function pickMachine(slots: MachineSlot[], capability: string): MachineSlot | null {
  const eligible = slots.filter((m) => m.available && m.capability === capability);
  if (!eligible.length) return null;
  return eligible.sort((a, b) => a.load_pct - b.load_pct)[0];
}

/** OEE = availability × performance × quality. */
export function oee(avail: number, perf: number, quality: number): number {
  return Math.max(0, Math.min(1, avail * perf * quality));
}

// ============================================================================
// Phase 6 — Inventory
// ============================================================================

export interface StockLine {
  item_id: string;
  on_hand: number;
  reserved?: number;
  reorder_level?: number;
  min_stock?: number;
  lead_time_days?: number;
  avg_daily_usage?: number;
  expires_at?: string | null;
}

export function availableQty(l: StockLine): number {
  return Math.max(0, (l.on_hand ?? 0) - (l.reserved ?? 0));
}

export function needsReorder(l: StockLine): boolean {
  const level = l.reorder_level ?? l.min_stock ?? 0;
  return availableQty(l) <= level;
}

/** Reorder qty using safety stock + lead-time demand (basic ROP). */
export function reorderQty(l: StockLine, safetyDays = 3): number {
  const usage = l.avg_daily_usage ?? 0;
  const lead = l.lead_time_days ?? 7;
  const target = usage * (lead + safetyDays);
  const gap = target - availableQty(l);
  return Math.max(0, Math.ceil(gap));
}

/** Expiry buckets for FEFO picking / disposal planning. */
export function expiryBucket(l: StockLine, now = Date.now()): "expired" | "soon" | "watch" | "ok" | "none" {
  if (!l.expires_at) return "none";
  const t = new Date(l.expires_at).getTime();
  if (isNaN(t)) return "none";
  const days = Math.floor((t - now) / 86400000);
  if (days < 0) return "expired";
  if (days <= 7) return "soon";
  if (days <= 30) return "watch";
  return "ok";
}

// ============================================================================
// Phase 7 — Warehouse
// ============================================================================

export interface PickTask { item_id: string; qty: number; bin?: string; zone?: string }

/** Group pick list by zone → bin for a single walk path. */
export function optimizePickList(tasks: PickTask[]): PickTask[] {
  return [...tasks].sort((a, b) => {
    const z = (a.zone ?? "").localeCompare(b.zone ?? "");
    if (z !== 0) return z;
    return (a.bin ?? "").localeCompare(b.bin ?? "");
  });
}

// ============================================================================
// Phase 8 — Finance integration (bridge only — GL owner is Finance runtime)
// ============================================================================

export interface JournalLine { account: string; debit_cents?: number; credit_cents?: number }

/** Build balanced journal-line pairs from an ERP event. Pure. */
export function buildJournal(kind: FinanceDocKind, amount_cents: number, tax_cents = 0): JournalLine[] {
  const net = amount_cents - tax_cents;
  switch (kind) {
    case "purchase_invoice":
      return [
        { account: "inventory_or_expense", debit_cents: net },
        { account: "tax_input", debit_cents: tax_cents },
        { account: "accounts_payable", credit_cents: amount_cents },
      ];
    case "sales_invoice":
      return [
        { account: "accounts_receivable", debit_cents: amount_cents },
        { account: "revenue", credit_cents: net },
        { account: "tax_output", credit_cents: tax_cents },
      ];
    case "payment":
      return [
        { account: "accounts_payable", debit_cents: amount_cents },
        { account: "cash_bank", credit_cents: amount_cents },
      ];
    case "expense":
      return [
        { account: "expense", debit_cents: net },
        { account: "tax_input", debit_cents: tax_cents },
        { account: "cash_bank", credit_cents: amount_cents },
      ];
    case "asset_acquisition":
      return [
        { account: "fixed_asset", debit_cents: net },
        { account: "tax_input", debit_cents: tax_cents },
        { account: "accounts_payable", credit_cents: amount_cents },
      ];
    case "asset_depreciation":
      return [
        { account: "depreciation_expense", debit_cents: amount_cents },
        { account: "accumulated_depreciation", credit_cents: amount_cents },
      ];
    case "tax_adjustment":
      return [
        { account: "tax_adjustment", debit_cents: amount_cents },
        { account: "tax_liability", credit_cents: amount_cents },
      ];
  }
}

export function isJournalBalanced(lines: JournalLine[]): boolean {
  const d = lines.reduce((a, l) => a + (l.debit_cents ?? 0), 0);
  const c = lines.reduce((a, l) => a + (l.credit_cents ?? 0), 0);
  return d === c;
}

/** Multi-currency conversion (spot rate). Rates map "USD->INR" style keys. */
export function convertCurrency(amount_cents: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount_cents;
  const rate = rates[`${from}->${to}`];
  if (!rate) throw new Error(`missing_rate:${from}->${to}`);
  return Math.round(amount_cents * rate);
}

// ============================================================================
// Phase 9 — Supply Chain Intelligence
// ============================================================================

/** Simple moving-average demand forecast. */
export function forecastDemand(history: number[], windowSize = 7, horizon = 7): number[] {
  if (!history.length) return Array(horizon).fill(0);
  const w = Math.min(windowSize, history.length);
  const avg = history.slice(-w).reduce((a, b) => a + b, 0) / w;
  return Array(horizon).fill(Math.round(avg));
}

export interface SupplierSignals {
  on_time_pct?: number;      // 0..1
  quality_pct?: number;      // 0..1
  price_variance_pct?: number; // 0..1 lower better
  lead_time_days?: number;
  disputes?: number;
}
/** Supplier risk 0..1 (higher = riskier). */
export function supplierRisk(s: SupplierSignals): number {
  let r = 0;
  r += (1 - (s.on_time_pct ?? 0.9)) * 0.35;
  r += (1 - (s.quality_pct ?? 0.95)) * 0.3;
  r += Math.min(0.2, (s.price_variance_pct ?? 0) * 0.5);
  r += Math.min(0.1, ((s.lead_time_days ?? 7) / 60));
  r += Math.min(0.1, (s.disputes ?? 0) * 0.05);
  return Math.max(0, Math.min(1, r));
}

export type ProcurementSuggestion = "reorder" | "diversify_supplier" | "expedite" | "hold" | "consolidate";
export function suggestProcurement(l: StockLine, risk = 0): ProcurementSuggestion {
  if (needsReorder(l) && risk > 0.6) return "diversify_supplier";
  if (needsReorder(l)) return "reorder";
  const daysCover = (l.avg_daily_usage ?? 0) > 0 ? availableQty(l) / (l.avg_daily_usage ?? 1) : Infinity;
  if (daysCover < (l.lead_time_days ?? 7)) return "expedite";
  if (daysCover > 90) return "hold";
  return "consolidate";
}

// ============================================================================
// Phase 10 — ERP AI Intelligence (composite health snapshot)
// ============================================================================

export interface BusinessHealthInput {
  onTimeProductionPct?: number;    // 0..1
  inventoryTurnover?: number;      // per year
  workingCapitalRatio?: number;    // current / current
  supplierRisk?: number;           // 0..1
  qualityPct?: number;             // 0..1
  machineUtilization?: number;     // 0..1
}

export function businessHealth(i: BusinessHealthInput): { score: number; grade: "A"|"B"|"C"|"D"|"F"; risks: string[] } {
  const risks: string[] = [];
  let s = 0;
  s += (i.onTimeProductionPct ?? 0.85) * 20;
  s += Math.min(20, (i.inventoryTurnover ?? 6) * 2);
  s += Math.min(20, (i.workingCapitalRatio ?? 1.5) * 8);
  s += (1 - (i.supplierRisk ?? 0.3)) * 15;
  s += (i.qualityPct ?? 0.97) * 15;
  s += (i.machineUtilization ?? 0.7) * 10;
  if ((i.supplierRisk ?? 0) > 0.6) risks.push("supplier_risk");
  if ((i.qualityPct ?? 1) < 0.9) risks.push("quality_slip");
  if ((i.workingCapitalRatio ?? 1.5) < 1) risks.push("liquidity");
  if ((i.machineUtilization ?? 0) < 0.5) risks.push("underutilization");
  const score = Math.round(Math.max(0, Math.min(100, s)));
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade, risks };
}

// ============================================================================
// Phase 11 — Brain integration (Stage 6 ERP retrieval hint)
// ============================================================================

export interface BrainErpHint {
  wantsErp: boolean;
  domain?: "procurement" | "manufacturing" | "inventory" | "warehouse" | "finance" | "quality" | "assets";
  reason: string;
}

export function resolveForBrain(prompt: string): BrainErpHint {
  const p = prompt.toLowerCase();
  const wantsErp = /(erp|inventor|warehouse|stock|purchase|procur|supplier|vendor|po|grn|bom|production|manufact|machine|batch|quality|qc|invoice|payment|ledger|gst|tax|asset|depreciation|reorder|shipment)/.test(p);
  if (!wantsErp) return { wantsErp: false, reason: "no erp keywords" };
  let domain: BrainErpHint["domain"];
  if (/(purchase|procur|supplier|vendor|po|grn|rfq)/.test(p)) domain = "procurement";
  else if (/(bom|production|manufact|machine|batch|work order)/.test(p)) domain = "manufacturing";
  else if (/(inventor|stock|reorder|expiry|serial)/.test(p)) domain = "inventory";
  else if (/(warehouse|pick|pack|dispatch|bin|zone)/.test(p)) domain = "warehouse";
  else if (/(invoice|payment|ledger|gst|tax|cash|receivable|payable)/.test(p)) domain = "finance";
  else if (/(quality|qc|defect|inspection)/.test(p)) domain = "quality";
  else if (/(asset|depreciation|maintenance)/.test(p)) domain = "assets";
  return { wantsErp: true, domain, reason: `erp:${domain ?? "general"}` };
}

// ============================================================================
// Phase 12 — Digital Human mode selection for ERP contexts
// ============================================================================

export type DhErpMode =
  | "factory" | "warehouse" | "production" | "finance" | "presentation" | "management";

export function pickDhErpMode(ctx: {
  route?: string; domain?: BrainErpHint["domain"]; hasSlides?: boolean; isExec?: boolean;
}): DhErpMode {
  if (ctx.hasSlides) return "presentation";
  if (ctx.isExec) return "management";
  switch (ctx.domain) {
    case "manufacturing": return "production";
    case "warehouse": return "warehouse";
    case "finance": return "finance";
    case "procurement": return "management";
    default: return ctx.route && /factor/.test(ctx.route) ? "factory" : "management";
  }
}

// ============================================================================
// Permissions (extends R118 workspace roles)
// ============================================================================

const CAP_MATRIX: Record<ErpRole, ErpCap[]> = {
  owner:       ["view","create","edit","delete","approve","receive","issue","transfer","adjust","post","reverse","close","reopen"],
  admin:       ["view","create","edit","delete","approve","receive","issue","transfer","adjust","post","reverse","close","reopen"],
  finance:     ["view","create","edit","approve","post","reverse","close"],
  procurement: ["view","create","edit","approve","receive"],
  production:  ["view","create","edit","issue","transfer"],
  warehouse:   ["view","receive","issue","transfer","adjust"],
  quality:     ["view","edit","approve"],
  viewer:      ["view"],
};

export function erpCan(role: ErpRole, cap: ErpCap): boolean {
  return CAP_MATRIX[role]?.includes(cap) ?? false;
}

// ============================================================================
// Phase 13 — Analytics snapshot (Brain Stage 10)
// ============================================================================

export function erpAnalyticsSnapshot(input: {
  stock: StockLine[];
  demandHistory?: number[];
  supplier?: SupplierSignals;
  health?: BusinessHealthInput;
}) {
  const reorderItems = input.stock.filter(needsReorder);
  const expired = input.stock.filter((l) => expiryBucket(l) === "expired");
  const forecast = forecastDemand(input.demandHistory ?? [], 7, 7);
  const supplier_risk = input.supplier ? supplierRisk(input.supplier) : null;
  const health = input.health ? businessHealth(input.health) : null;
  return {
    reorder_count: reorderItems.length,
    expired_count: expired.length,
    forecast_next_7: forecast,
    supplier_risk,
    health,
    at: new Date().toISOString(),
  };
}
