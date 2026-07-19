/**
 * HAPPY X — R24 Warehouse Management System runtime.
 * Every stock mutation flows through `movements.record()` which writes an
 * immutable ledger row and updates the aggregate `inventory_items` snapshot.
 * Reuses RLS + audit; never edits stock outside the ledger.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertUuid } from "@/lib/security/pgrest-sanitize";

type SB = SupabaseClient<any, "public", any>;
type Num = number;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function writeAudit(sb: SB, a: {
  category: string; action: string; entity_type?: string; entity_id?: string;
  company_id?: string; before?: unknown; after?: unknown; severity?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await sb.rpc("write_audit", {
      _category: a.category, _action: a.action,
      _entity_type: a.entity_type ?? null, _entity_id: a.entity_id ?? null,
      _company_id: a.company_id ?? null, _before: a.before ?? null,
      _after: a.after ?? null, _severity: (a.severity as any) ?? "info",
      _metadata: (a.metadata ?? {}) as any,
    });
  } catch { /* best-effort */ }
}

async function nextNumber(sb: SB, table: string, companyId: string, prefix: string) {
  const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
  const seq = ((count ?? 0) + 1).toString().padStart(5, "0");
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

// =====================================================================
// Zones + Bins
// =====================================================================
export const zones = {
  list: async (sb: SB, warehouseId: string) =>
    unwrap(await sb.from("warehouse_zones").select("*").eq("warehouse_id", warehouseId).order("sort_order")),
  create: async (sb: SB, d: { company_id: string; warehouse_id: string; code: string; name: string; zone_type?: string; aisle?: string; sort_order?: number }) =>
    unwrap(await sb.from("warehouse_zones").insert({ ...d, zone_type: (d.zone_type as any) ?? "storage" }).select("*").single()),
  update: async (sb: SB, id: string, patch: Record<string, unknown>) =>
    unwrap(await sb.from("warehouse_zones").update(patch).eq("id", id).select("*").single()),
  remove: async (sb: SB, id: string) => { unwrap(await sb.from("warehouse_zones").delete().eq("id", id)); return { ok: true }; },
};

export const bins = {
  list: async (sb: SB, warehouseId: string, zoneId?: string) => {
    let q = sb.from("warehouse_bins").select("*, zone:warehouse_zones(id,code,name,zone_type)").eq("warehouse_id", warehouseId).order("code");
    if (zoneId) q = q.eq("zone_id", zoneId);
    return unwrap(await q);
  },
  create: async (sb: SB, d: { company_id: string; warehouse_id: string; zone_id?: string; code: string; rack?: string; shelf?: string; position?: string; capacity?: number }) =>
    unwrap(await sb.from("warehouse_bins").insert(d).select("*").single()),
  update: async (sb: SB, id: string, patch: Record<string, unknown>) =>
    unwrap(await sb.from("warehouse_bins").update(patch).eq("id", id).select("*").single()),
  remove: async (sb: SB, id: string) => { unwrap(await sb.from("warehouse_bins").delete().eq("id", id)); return { ok: true }; },
};

// =====================================================================
// Lots (batch tracking)
// =====================================================================
export const lots = {
  list: async (sb: SB, companyId: string, opts: { product_id?: string; warehouse_id?: string; status?: string; near_expiry_days?: number; limit?: number } = {}) => {
    let q = sb.from("inventory_lots").select("*, product:products(id,name,sku), warehouse:warehouses(id,name,code)")
      .eq("company_id", companyId).order("expiry_date", { ascending: true, nullsFirst: false }).limit(opts.limit ?? 200);
    if (opts.product_id)   q = q.eq("product_id", opts.product_id);
    if (opts.warehouse_id) q = q.eq("warehouse_id", opts.warehouse_id);
    if (opts.status)       q = q.eq("status", opts.status as any);
    if (opts.near_expiry_days != null) {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + opts.near_expiry_days);
      q = q.lte("expiry_date", cutoff.toISOString().slice(0, 10));
    }
    return unwrap(await q);
  },
  create: async (sb: SB, d: { company_id: string; product_id: string; warehouse_id: string; bin_id?: string; batch_no?: string; lot_no?: string; supplier_id?: string; mfg_date?: string; expiry_date?: string; quantity?: number; unit_cost?: number }) =>
    unwrap(await sb.from("inventory_lots").insert({ ...d, quantity: d.quantity ?? 0 }).select("*").single()),
  setStatus: async (sb: SB, id: string, status: string) =>
    unwrap(await sb.from("inventory_lots").update({ status }).eq("id", id).select("*").single()),
};

// =====================================================================
// Movements — the immutable ledger + aggregate update
// =====================================================================
type MovementInput = {
  company_id: string;
  txn_type: "receive"|"issue"|"transfer_out"|"transfer_in"|"adjustment"|"damage"|"expiry"|"return"|"reserve"|"release"|"count_adjust"|"production_in"|"production_out";
  product_id: string;
  warehouse_id: string;
  bin_id?: string;
  lot_id?: string;
  qty_delta: Num;                 // signed
  unit_cost?: Num;
  ref_type?: string; ref_id?: string; ref_number?: string;
  notes?: string;
  actor_id?: string;
  metadata?: Record<string, unknown>;
  skip_aggregate?: boolean;       // reserve/release don't move on-hand
};

async function upsertAggregate(sb: SB, companyId: string, productId: string, warehouseId: string, qtyDelta: Num) {
  const existing = unwrap(await sb.from("inventory_items").select("id,quantity")
    .eq("product_id", productId).eq("warehouse_id", warehouseId).maybeSingle()) as any;
  if (existing) {
    const next = Number(existing.quantity ?? 0) + qtyDelta;
    if (next < 0) throw new Error("Insufficient stock");
    unwrap(await sb.from("inventory_items").update({ quantity: next }).eq("id", existing.id).select("id").single());
    return next;
  }
  if (qtyDelta < 0) throw new Error("Insufficient stock");
  unwrap(await sb.from("inventory_items").insert({
    company_id: companyId, product_id: productId, warehouse_id: warehouseId, quantity: qtyDelta,
  }).select("id").single());
  return qtyDelta;
}

async function updateReservedAggregate(sb: SB, productId: string, warehouseId: string, delta: Num) {
  const row = unwrap(await sb.from("inventory_items").select("id,reserved")
    .eq("product_id", productId).eq("warehouse_id", warehouseId).maybeSingle()) as any;
  if (!row) return;
  const next = Math.max(0, Number(row.reserved ?? 0) + delta);
  unwrap(await sb.from("inventory_items").update({ reserved: next }).eq("id", row.id).select("id").single());
}

export const movements = {
  list: async (sb: SB, companyId: string, opts: { product_id?: string; warehouse_id?: string; txn_type?: string; limit?: number } = {}) => {
    let q = sb.from("inventory_transactions").select("*, product:products(id,name,sku), warehouse:warehouses(id,name,code)")
      .eq("company_id", companyId).order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.product_id)   q = q.eq("product_id", opts.product_id);
    if (opts.warehouse_id) q = q.eq("warehouse_id", opts.warehouse_id);
    if (opts.txn_type)     q = q.eq("txn_type", opts.txn_type as any);
    return unwrap(await q);
  },
  record: async (sb: SB, actorId: string, m: MovementInput) => {
    if (!Number.isFinite(m.qty_delta) || m.qty_delta === 0) throw new Error("qty_delta must be non-zero");
    let balance: Num | null = null;
    if (!m.skip_aggregate) balance = await upsertAggregate(sb, m.company_id, m.product_id, m.warehouse_id, m.qty_delta);
    if (m.lot_id && !m.skip_aggregate) {
      const lot = unwrap(await sb.from("inventory_lots").select("id,quantity").eq("id", m.lot_id).maybeSingle()) as any;
      if (lot) {
        const nextLot = Number(lot.quantity ?? 0) + m.qty_delta;
        if (nextLot < 0) throw new Error("Insufficient lot stock");
        unwrap(await sb.from("inventory_lots").update({ quantity: nextLot }).eq("id", m.lot_id).select("id").single());
      }
    }
    const txn = unwrap(await sb.from("inventory_transactions").insert({
      company_id: m.company_id, txn_type: m.txn_type,
      product_id: m.product_id, warehouse_id: m.warehouse_id,
      bin_id: m.bin_id ?? null, lot_id: m.lot_id ?? null,
      qty_delta: m.qty_delta, balance_after: balance,
      unit_cost: m.unit_cost ?? null,
      ref_type: m.ref_type ?? null, ref_id: m.ref_id ?? null, ref_number: m.ref_number ?? null,
      actor_id: actorId, notes: m.notes ?? null,
      metadata: m.metadata ?? {},
    }).select("*").single()) as any;
    await writeAudit(sb, {
      category: "inventory", action: `stock.${m.txn_type}`,
      entity_type: "inventory_transaction", entity_id: txn.id,
      company_id: m.company_id, metadata: { qty_delta: m.qty_delta, product_id: m.product_id, warehouse_id: m.warehouse_id, ref_type: m.ref_type, ref_id: m.ref_id },
    });
    return txn;
  },
};

// =====================================================================
// Receiving
// =====================================================================
export const receiving = {
  /** Post a goods receipt to stock: creates lots (if batch data given) and ledger entries. */
  postReceipt: async (sb: SB, actorId: string, d: {
    company_id: string; warehouse_id: string; ref_type?: string; ref_id?: string; ref_number?: string;
    lines: Array<{ product_id: string; quantity: number; bin_id?: string; unit_cost?: number;
                   batch_no?: string; lot_no?: string; mfg_date?: string; expiry_date?: string; supplier_id?: string }>;
  }) => {
    const out: any[] = [];
    for (const l of d.lines) {
      if (l.quantity <= 0) continue;
      let lotId: string | undefined;
      if (l.batch_no || l.lot_no || l.expiry_date) {
        const lot = await lots.create(sb, {
          company_id: d.company_id, product_id: l.product_id, warehouse_id: d.warehouse_id,
          bin_id: l.bin_id, batch_no: l.batch_no, lot_no: l.lot_no,
          supplier_id: l.supplier_id, mfg_date: l.mfg_date, expiry_date: l.expiry_date,
          quantity: 0, unit_cost: l.unit_cost,
        }) as any;
        lotId = lot.id;
      }
      const txn = await movements.record(sb, actorId, {
        company_id: d.company_id, txn_type: "receive",
        product_id: l.product_id, warehouse_id: d.warehouse_id,
        bin_id: l.bin_id, lot_id: lotId,
        qty_delta: l.quantity, unit_cost: l.unit_cost,
        ref_type: d.ref_type ?? "goods_receipt", ref_id: d.ref_id, ref_number: d.ref_number,
      });
      out.push(txn);
    }
    return out;
  },
};

// =====================================================================
// Dispatch
// =====================================================================
export const dispatch = {
  post: async (sb: SB, actorId: string, d: {
    company_id: string; warehouse_id: string; ref_type: string; ref_id?: string; ref_number?: string;
    lines: Array<{ product_id: string; quantity: number; bin_id?: string; lot_id?: string; kind?: "sales"|"transfer"|"production"|"return" }>;
  }) => {
    const out: any[] = [];
    for (const l of d.lines) {
      if (l.quantity <= 0) continue;
      const txnType = l.kind === "return" ? "return" : (l.kind === "production" ? "production_out" : (l.kind === "transfer" ? "transfer_out" : "issue"));
      const txn = await movements.record(sb, actorId, {
        company_id: d.company_id, txn_type: txnType as any,
        product_id: l.product_id, warehouse_id: d.warehouse_id, bin_id: l.bin_id, lot_id: l.lot_id,
        qty_delta: -Math.abs(l.quantity),
        ref_type: d.ref_type, ref_id: d.ref_id, ref_number: d.ref_number,
      });
      out.push(txn);
    }
    return out;
  },
};

// =====================================================================
// Transfers
// =====================================================================
export const transfers = {
  list: async (sb: SB, companyId: string, opts: { status?: string; warehouse_id?: string; limit?: number } = {}) => {
    let q = sb.from("stock_transfers").select("*, from_wh:warehouses!stock_transfers_from_warehouse_id_fkey(id,name,code), to_wh:warehouses!stock_transfers_to_warehouse_id_fkey(id,name,code)")
      .eq("company_id", companyId).order("created_at", { ascending: false }).limit(opts.limit ?? 50);
    if (opts.status) q = q.eq("status", opts.status as any);
    if (opts.warehouse_id) { const wid = assertUuid(opts.warehouse_id, "warehouse_id"); q = q.or(`from_warehouse_id.eq.${wid},to_warehouse_id.eq.${wid}`); }
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const t = unwrap(await sb.from("stock_transfers").select("*").eq("id", id).maybeSingle());
    const items = unwrap(await sb.from("stock_transfer_items").select("*, product:products(id,name,sku)").eq("transfer_id", id));
    return { ...(t as any), items };
  },
  create: async (sb: SB, actorId: string, d: {
    company_id: string; from_warehouse_id: string; to_warehouse_id: string; notes?: string;
    lines: Array<{ product_id: string; quantity: number; lot_id?: string; from_bin_id?: string; to_bin_id?: string }>;
  }) => {
    if (d.from_warehouse_id === d.to_warehouse_id) throw new Error("Source and destination warehouses must differ");
    const number = await nextNumber(sb, "stock_transfers", d.company_id, "TR");
    const t = unwrap(await sb.from("stock_transfers").insert({
      company_id: d.company_id, number,
      from_warehouse_id: d.from_warehouse_id, to_warehouse_id: d.to_warehouse_id,
      status: "draft", notes: d.notes ?? null, created_by: actorId,
    }).select("*").single()) as any;
    for (const l of d.lines) {
      unwrap(await sb.from("stock_transfer_items").insert({
        transfer_id: t.id, product_id: l.product_id, lot_id: l.lot_id ?? null,
        from_bin_id: l.from_bin_id ?? null, to_bin_id: l.to_bin_id ?? null,
        quantity: l.quantity,
      }).select("id").single());
    }
    await writeAudit(sb, { category: "inventory", action: "transfer.created", entity_type: "stock_transfer", entity_id: t.id, company_id: d.company_id, metadata: { number } });
    return t;
  },
  ship: async (sb: SB, actorId: string, id: string) => {
    const t = unwrap(await sb.from("stock_transfers").select("*").eq("id", id).single()) as any;
    if (t.status !== "draft") throw new Error(`Cannot ship transfer in status ${t.status}`);
    const items = unwrap(await sb.from("stock_transfer_items").select("*").eq("transfer_id", id)) as any[];
    for (const it of items) {
      await movements.record(sb, actorId, {
        company_id: t.company_id, txn_type: "transfer_out",
        product_id: it.product_id, warehouse_id: t.from_warehouse_id,
        bin_id: it.from_bin_id ?? undefined, lot_id: it.lot_id ?? undefined,
        qty_delta: -Math.abs(Number(it.quantity)),
        ref_type: "stock_transfer", ref_id: t.id, ref_number: t.number,
      });
    }
    const updated = unwrap(await sb.from("stock_transfers").update({ status: "in_transit", shipped_at: new Date().toISOString(), shipped_by: actorId }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "inventory", action: "transfer.shipped", entity_type: "stock_transfer", entity_id: id, company_id: t.company_id });
    return updated;
  },
  receive: async (sb: SB, actorId: string, id: string) => {
    const t = unwrap(await sb.from("stock_transfers").select("*").eq("id", id).single()) as any;
    if (t.status !== "in_transit") throw new Error(`Cannot receive transfer in status ${t.status}`);
    const items = unwrap(await sb.from("stock_transfer_items").select("*").eq("transfer_id", id)) as any[];
    for (const it of items) {
      await movements.record(sb, actorId, {
        company_id: t.company_id, txn_type: "transfer_in",
        product_id: it.product_id, warehouse_id: t.to_warehouse_id,
        bin_id: it.to_bin_id ?? undefined, lot_id: it.lot_id ?? undefined,
        qty_delta: Math.abs(Number(it.quantity)),
        ref_type: "stock_transfer", ref_id: t.id, ref_number: t.number,
      });
      unwrap(await sb.from("stock_transfer_items").update({ quantity_received: it.quantity }).eq("id", it.id).select("id").single());
    }
    const updated = unwrap(await sb.from("stock_transfers").update({ status: "received", received_at: new Date().toISOString(), received_by: actorId }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "inventory", action: "transfer.received", entity_type: "stock_transfer", entity_id: id, company_id: t.company_id });
    return updated;
  },
  cancel: async (sb: SB, actorId: string, id: string) => {
    const t = unwrap(await sb.from("stock_transfers").select("*").eq("id", id).single()) as any;
    if (t.status === "received") throw new Error("Received transfers cannot be cancelled");
    const updated = unwrap(await sb.from("stock_transfers").update({ status: "cancelled" }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "inventory", action: "transfer.cancelled", entity_type: "stock_transfer", entity_id: id, company_id: t.company_id, metadata: { by: actorId } });
    return updated;
  },
};

// =====================================================================
// Reservations
// =====================================================================
export const reservations = {
  list: async (sb: SB, companyId: string, opts: { status?: string; product_id?: string; warehouse_id?: string; ref_type?: string; ref_id?: string; limit?: number } = {}) => {
    let q = sb.from("stock_reservations").select("*, product:products(id,name,sku), warehouse:warehouses(id,name,code)")
      .eq("company_id", companyId).order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.status)       q = q.eq("status", opts.status as any);
    if (opts.product_id)   q = q.eq("product_id", opts.product_id);
    if (opts.warehouse_id) q = q.eq("warehouse_id", opts.warehouse_id);
    if (opts.ref_type)     q = q.eq("ref_type", opts.ref_type);
    if (opts.ref_id)       q = q.eq("ref_id", opts.ref_id);
    return unwrap(await q);
  },
  create: async (sb: SB, actorId: string, d: {
    company_id: string; product_id: string; warehouse_id: string; quantity: number;
    ref_type: string; ref_id?: string; lot_id?: string; expires_at?: string;
  }) => {
    // check availability
    const inv = unwrap(await sb.from("inventory_items").select("quantity,reserved")
      .eq("product_id", d.product_id).eq("warehouse_id", d.warehouse_id).maybeSingle()) as any;
    const onHand = Number(inv?.quantity ?? 0);
    const reserved = Number(inv?.reserved ?? 0);
    const available = onHand - reserved;
    if (d.quantity > available) throw new Error(`Only ${available} available to reserve`);
    const row = unwrap(await sb.from("stock_reservations").insert({
      company_id: d.company_id, product_id: d.product_id, warehouse_id: d.warehouse_id,
      quantity: d.quantity, ref_type: d.ref_type, ref_id: d.ref_id ?? null,
      lot_id: d.lot_id ?? null, expires_at: d.expires_at ?? null,
      status: "active", actor_id: actorId,
    }).select("*").single()) as any;
    await updateReservedAggregate(sb, d.product_id, d.warehouse_id, d.quantity);
    await movements.record(sb, actorId, {
      company_id: d.company_id, txn_type: "reserve", product_id: d.product_id, warehouse_id: d.warehouse_id,
      lot_id: d.lot_id, qty_delta: d.quantity, ref_type: d.ref_type, ref_id: d.ref_id, skip_aggregate: true,
    });
    return row;
  },
  release: async (sb: SB, actorId: string, id: string) => {
    const r = unwrap(await sb.from("stock_reservations").select("*").eq("id", id).single()) as any;
    if (r.status !== "active") throw new Error(`Cannot release reservation in status ${r.status}`);
    const updated = unwrap(await sb.from("stock_reservations").update({ status: "released", released_at: new Date().toISOString() }).eq("id", id).select("*").single()) as any;
    await updateReservedAggregate(sb, r.product_id, r.warehouse_id, -Number(r.quantity));
    await movements.record(sb, actorId, {
      company_id: r.company_id, txn_type: "release", product_id: r.product_id, warehouse_id: r.warehouse_id,
      lot_id: r.lot_id ?? undefined, qty_delta: -Number(r.quantity), ref_type: r.ref_type, ref_id: r.ref_id ?? undefined, skip_aggregate: true,
    });
    return updated;
  },
  fulfill: async (sb: SB, actorId: string, id: string) => {
    const r = unwrap(await sb.from("stock_reservations").select("*").eq("id", id).single()) as any;
    if (r.status !== "active") throw new Error(`Cannot fulfill reservation in status ${r.status}`);
    // consume stock
    await movements.record(sb, actorId, {
      company_id: r.company_id, txn_type: "issue", product_id: r.product_id, warehouse_id: r.warehouse_id,
      lot_id: r.lot_id ?? undefined, qty_delta: -Number(r.quantity),
      ref_type: r.ref_type, ref_id: r.ref_id ?? undefined,
    });
    await updateReservedAggregate(sb, r.product_id, r.warehouse_id, -Number(r.quantity));
    const updated = unwrap(await sb.from("stock_reservations").update({ status: "fulfilled", released_at: new Date().toISOString() }).eq("id", id).select("*").single()) as any;
    return updated;
  },
};

// =====================================================================
// Cycle counts
// =====================================================================
export const counts = {
  list: async (sb: SB, companyId: string, opts: { warehouse_id?: string; status?: string; limit?: number } = {}) => {
    let q = sb.from("cycle_counts").select("*, warehouse:warehouses(id,name,code)")
      .eq("company_id", companyId).order("scheduled_at", { ascending: false }).limit(opts.limit ?? 50);
    if (opts.warehouse_id) q = q.eq("warehouse_id", opts.warehouse_id);
    if (opts.status)       q = q.eq("status", opts.status as any);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const c = unwrap(await sb.from("cycle_counts").select("*").eq("id", id).single());
    const items = unwrap(await sb.from("cycle_count_items").select("*, product:products(id,name,sku)").eq("count_id", id));
    return { ...(c as any), items };
  },
  schedule: async (sb: SB, actorId: string, d: { company_id: string; warehouse_id: string; scheduled_at?: string; is_blind?: boolean; scope?: Record<string, unknown> }) => {
    const number = await nextNumber(sb, "cycle_counts", d.company_id, "CC");
    const c = unwrap(await sb.from("cycle_counts").insert({
      company_id: d.company_id, warehouse_id: d.warehouse_id, number,
      scheduled_at: d.scheduled_at ?? new Date().toISOString(),
      is_blind: !!d.is_blind, scope: d.scope ?? {}, status: "scheduled",
      created_by: actorId,
    }).select("*").single()) as any;
    // pre-populate with current stock snapshot
    const inv = unwrap(await sb.from("inventory_items").select("product_id,quantity")
      .eq("warehouse_id", d.warehouse_id).eq("company_id", d.company_id)) as any[];
    for (const row of inv) {
      unwrap(await sb.from("cycle_count_items").insert({
        count_id: c.id, product_id: row.product_id, expected_qty: row.quantity,
      }).select("id").single());
    }
    return c;
  },
  start: async (sb: SB, id: string) =>
    unwrap(await sb.from("cycle_counts").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", id).select("*").single()),
  recordCount: async (sb: SB, itemId: string, countedQty: number, reason?: string) =>
    unwrap(await sb.from("cycle_count_items").update({ counted_qty: countedQty, reason: reason ?? null }).eq("id", itemId).select("*").single()),
  complete: async (sb: SB, actorId: string, id: string) => {
    const c = unwrap(await sb.from("cycle_counts").update({ status: "completed", completed_at: new Date().toISOString(), counted_by: actorId }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "inventory", action: "cycle_count.completed", entity_type: "cycle_count", entity_id: id, company_id: c.company_id });
    return c;
  },
  approve: async (sb: SB, actorId: string, id: string) => {
    const c = unwrap(await sb.from("cycle_counts").select("*").eq("id", id).single()) as any;
    if (c.status !== "completed") throw new Error("Only completed counts can be approved");
    const items = unwrap(await sb.from("cycle_count_items").select("*").eq("count_id", id)) as any[];
    for (const it of items) {
      const variance = Number(it.variance ?? 0);
      if (variance === 0 || it.counted_qty == null) continue;
      await movements.record(sb, actorId, {
        company_id: c.company_id, txn_type: "count_adjust",
        product_id: it.product_id, warehouse_id: c.warehouse_id,
        bin_id: it.bin_id ?? undefined, lot_id: it.lot_id ?? undefined,
        qty_delta: variance,
        ref_type: "cycle_count", ref_id: c.id, ref_number: c.number,
        notes: it.reason ?? "cycle count adjustment",
      });
    }
    const updated = unwrap(await sb.from("cycle_counts").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: actorId }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "inventory", action: "cycle_count.approved", entity_type: "cycle_count", entity_id: id, company_id: c.company_id });
    return updated;
  },
};

// =====================================================================
// Thresholds
// =====================================================================
export const thresholds = {
  list: async (sb: SB, companyId: string, opts: { product_id?: string; warehouse_id?: string } = {}) => {
    let q = sb.from("inventory_thresholds").select("*, product:products(id,name,sku), warehouse:warehouses(id,name,code)").eq("company_id", companyId);
    if (opts.product_id)   q = q.eq("product_id", opts.product_id);
    if (opts.warehouse_id) q = q.eq("warehouse_id", opts.warehouse_id);
    return unwrap(await q);
  },
  upsert: async (sb: SB, d: { company_id: string; product_id: string; warehouse_id?: string; min_stock?: number; max_stock?: number; reorder_level?: number; safety_stock?: number; expiry_alert_days?: number; valuation?: string }) =>
    unwrap(await sb.from("inventory_thresholds").upsert(d as any, { onConflict: "company_id,product_id,warehouse_id" }).select("*").single()),
};

// =====================================================================
// Analytics + Dashboard
// =====================================================================
export const analytics = {
  overview: async (sb: SB, companyId: string) => {
    const whs = unwrap(await sb.from("warehouses").select("id,name").eq("company_id", companyId));
    const invRows = unwrap(await sb.from("inventory_items").select("quantity,reserved,warehouse_id,product_id").eq("company_id", companyId)) as any[];
    const totalOnHand = invRows.reduce((a, r) => a + Number(r.quantity ?? 0), 0);
    const totalReserved = invRows.reduce((a, r) => a + Number(r.reserved ?? 0), 0);
    const positions = invRows.length;

    // Near expiry / expired
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const nearExpiry = unwrap(await sb.from("inventory_lots").select("id,expiry_date,quantity,product_id,warehouse_id", { count: "exact" })
      .eq("company_id", companyId).lte("expiry_date", cutoffStr).gte("expiry_date", today).gt("quantity", 0)) as any[];
    const expired = unwrap(await sb.from("inventory_lots").select("id,expiry_date,quantity", { count: "exact" })
      .eq("company_id", companyId).lt("expiry_date", today).gt("quantity", 0)) as any[];

    // Recent activity counts
    const [{ count: pendingReceipts }, { count: openTransfers }, { count: activeReservations }, { count: pendingCounts }] = await Promise.all([
      sb.from("goods_receipts").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "received"),
      sb.from("stock_transfers").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["draft", "in_transit"]),
      sb.from("stock_reservations").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
      sb.from("cycle_counts").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["scheduled", "in_progress"]),
    ]);

    // Low stock (join with thresholds)
    const thr = unwrap(await sb.from("inventory_thresholds").select("product_id,warehouse_id,reorder_level,min_stock").eq("company_id", companyId)) as any[];
    const invByKey = new Map<string, number>();
    for (const r of invRows) invByKey.set(`${r.product_id}:${r.warehouse_id}`, Number(r.quantity ?? 0));
    const lowStock = thr.filter((t) => {
      const q = invByKey.get(`${t.product_id}:${t.warehouse_id}`) ?? 0;
      return q <= Number(t.reorder_level ?? 0) || q <= Number(t.min_stock ?? 0);
    });

    return {
      warehouses: whs.length,
      positions,
      total_on_hand: totalOnHand,
      total_reserved: totalReserved,
      total_available: totalOnHand - totalReserved,
      near_expiry_lots: nearExpiry.length,
      expired_lots: expired.length,
      pending_receipts: pendingReceipts ?? 0,
      open_transfers: openTransfers ?? 0,
      active_reservations: activeReservations ?? 0,
      pending_cycle_counts: pendingCounts ?? 0,
      low_stock_positions: lowStock.length,
    };
  },
  movementVelocity: async (sb: SB, companyId: string, days = 30) => {
    const since = new Date(); since.setDate(since.getDate() - days);
    const rows = unwrap(await sb.from("inventory_transactions").select("product_id,txn_type,qty_delta,created_at")
      .eq("company_id", companyId).gte("created_at", since.toISOString())) as any[];
    const perProduct = new Map<string, { in: number; out: number; count: number }>();
    for (const r of rows) {
      const key = r.product_id;
      const cur = perProduct.get(key) ?? { in: 0, out: 0, count: 0 };
      const q = Number(r.qty_delta ?? 0);
      if (q > 0) cur.in += q; else cur.out += -q;
      cur.count += 1;
      perProduct.set(key, cur);
    }
    const arr = [...perProduct.entries()].map(([product_id, v]) => ({ product_id, ...v, net: v.in - v.out }));
    arr.sort((a, b) => b.out - a.out);
    return { since: since.toISOString(), fast_moving: arr.slice(0, 20), slow_moving: [...arr].sort((a, b) => a.out - b.out).slice(0, 20) };
  },
};
