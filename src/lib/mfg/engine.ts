/**
 * HAPPY X — R23 Manufacturing Runtime engine.
 * Real BOM / production / batch / quality / machine / maintenance logic.
 * Reuses `write_audit`, products, warehouses, and RBAC helpers.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type SB = SupabaseClient<any, "public", any>;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function writeAudit(sb: SB, args: {
  category: string; action: string; entity_type?: string; entity_id?: string;
  company_id?: string; before?: unknown; after?: unknown; severity?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await sb.rpc("write_audit", {
      _category: args.category, _action: args.action,
      _entity_type: args.entity_type ?? null, _entity_id: args.entity_id ?? null,
      _company_id: args.company_id ?? null, _before: args.before ?? null,
      _after: args.after ?? null, _severity: (args.severity as any) ?? "info",
      _metadata: (args.metadata ?? {}) as any,
    });
  } catch { /* audit best-effort */ }
}

async function nextNumber(sb: SB, table: string, companyId: string, prefix: string) {
  const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
  const seq = ((count ?? 0) + 1).toString().padStart(5, "0");
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

// ---------- Product kinds ----------
export const productKinds = {
  list: async (sb: SB, companyId: string, kind?: string) => {
    let q = sb.from("mfg_product_kinds").select("*, product:products(id,name,sku,status)").eq("company_id", companyId);
    if (kind) q = q.eq("kind", kind);
    return unwrap(await q);
  },
  set: async (sb: SB, data: { company_id: string; product_id: string; kind: "finished"|"raw"|"semi"|"packaging"; uom?: string; shelf_life_days?: number }) =>
    unwrap(await sb.from("mfg_product_kinds").upsert({
      company_id: data.company_id, product_id: data.product_id, kind: data.kind,
      uom: data.uom ?? "unit", shelf_life_days: data.shelf_life_days ?? null,
    }).select("*").single()),
};

// ---------- BOM ----------
export const bom = {
  list: async (sb: SB, companyId: string, opts: { product_id?: string; status?: string } = {}) => {
    let q = sb.from("bill_of_materials").select("*, product:products(id,name,sku)").eq("company_id", companyId).order("updated_at", { ascending: false });
    if (opts.product_id) q = q.eq("product_id", opts.product_id);
    if (opts.status) q = q.eq("status", opts.status);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const b = unwrap(await sb.from("bill_of_materials").select("*, product:products(id,name,sku)").eq("id", id).maybeSingle());
    const items = unwrap(await sb.from("bom_items").select("*, component:products(id,name,sku)").eq("bom_id", id));
    return { ...(b as any), items };
  },
  create: async (sb: SB, userId: string, data: {
    company_id: string; product_id: string; name: string; yield_quantity?: number; uom?: string; notes?: string;
    items: Array<{ component_product_id: string; quantity: number; uom?: string; scrap_pct?: number; notes?: string }>;
  }) => {
    // next version for this product
    const { data: latest } = await sb.from("bill_of_materials").select("version").eq("product_id", data.product_id).order("version", { ascending: false }).limit(1).maybeSingle();
    const version = ((latest as any)?.version ?? 0) + 1;
    const row = unwrap(await sb.from("bill_of_materials").insert({
      company_id: data.company_id, product_id: data.product_id, name: data.name, version,
      yield_quantity: data.yield_quantity ?? 1, uom: data.uom ?? "unit", notes: data.notes ?? null,
      created_by: userId, status: "draft",
    }).select("*").single());
    if (data.items.length) {
      await sb.from("bom_items").insert(data.items.map(i => ({
        bom_id: (row as any).id, component_product_id: i.component_product_id,
        quantity: i.quantity, uom: i.uom ?? "unit", scrap_pct: i.scrap_pct ?? 0, notes: i.notes ?? null,
      })));
    }
    await writeAudit(sb, { category: "mfg.bom", action: "created", entity_type: "bom", entity_id: (row as any).id, company_id: data.company_id, after: row });
    return row;
  },
  requestApproval: async (sb: SB, id: string) =>
    unwrap(await sb.from("bill_of_materials").update({ status: "pending_approval" }).eq("id", id).select("*").single()),
  approve: async (sb: SB, userId: string, id: string) => {
    const row = unwrap(await sb.from("bill_of_materials").update({
      status: "approved", approved_by: userId, approved_at: new Date().toISOString(),
    }).eq("id", id).select("*").single());
    await writeAudit(sb, { category: "mfg.bom", action: "approved", entity_type: "bom", entity_id: id, company_id: (row as any).company_id });
    return row;
  },
  archive: async (sb: SB, id: string) =>
    unwrap(await sb.from("bill_of_materials").update({ status: "archived" }).eq("id", id).select("*").single()),
  remove: async (sb: SB, id: string) => {
    unwrap(await sb.from("bill_of_materials").delete().eq("id", id).select("id"));
    return { ok: true };
  },
};

// ---------- Machines ----------
export const machines = {
  list: async (sb: SB, companyId: string) =>
    unwrap(await sb.from("machines").select("*").eq("company_id", companyId).order("name")),
  create: async (sb: SB, data: { company_id: string; code: string; name: string; kind?: string; warehouse_id?: string; capacity_per_hour?: number }) =>
    unwrap(await sb.from("machines").insert({ ...data, kind: data.kind ?? "general" }).select("*").single()),
  setStatus: async (sb: SB, id: string, status: "idle"|"running"|"maintenance"|"offline"|"decommissioned") =>
    unwrap(await sb.from("machines").update({ status }).eq("id", id).select("*").single()),
  update: async (sb: SB, id: string, patch: Record<string, unknown>) =>
    unwrap(await sb.from("machines").update(patch).eq("id", id).select("*").single()),
  remove: async (sb: SB, id: string) => {
    unwrap(await sb.from("machines").delete().eq("id", id).select("id"));
    return { ok: true };
  },
  utilization: async (sb: SB, machineId: string, days = 30) => {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const runs = unwrap(await sb.from("production_orders").select("started_at, completed_at").eq("machine_id", machineId).gte("started_at", since).not("started_at", "is", null));
    const downs = unwrap(await sb.from("machine_downtime").select("started_at, ended_at").eq("machine_id", machineId).gte("started_at", since));
    const runMs = (runs as any[]).reduce((s, r) => s + (r.completed_at ? new Date(r.completed_at).getTime() - new Date(r.started_at).getTime() : 0), 0);
    const downMs = (downs as any[]).reduce((s, r) => s + ((r.ended_at ?? new Date().toISOString()) ? new Date(r.ended_at ?? Date.now()).getTime() - new Date(r.started_at).getTime() : 0), 0);
    const windowMs = days * 864e5;
    return {
      window_days: days,
      run_hours: runMs / 3.6e6,
      downtime_hours: downMs / 3.6e6,
      utilization_pct: windowMs ? (runMs / windowMs) * 100 : 0,
    };
  },
};

// ---------- Downtime ----------
export const downtime = {
  list: async (sb: SB, companyId: string, machineId?: string) => {
    let q = sb.from("machine_downtime").select("*").eq("company_id", companyId).order("started_at", { ascending: false }).limit(100);
    if (machineId) q = q.eq("machine_id", machineId);
    return unwrap(await q);
  },
  start: async (sb: SB, userId: string, data: { company_id: string; machine_id: string; reason?: string; notes?: string }) => {
    const row = unwrap(await sb.from("machine_downtime").insert({
      company_id: data.company_id, machine_id: data.machine_id,
      reason: data.reason ?? "unspecified", notes: data.notes ?? null, created_by: userId,
    }).select("*").single());
    await sb.from("machines").update({ status: "offline" }).eq("id", data.machine_id);
    return row;
  },
  end: async (sb: SB, id: string) => {
    const row = unwrap(await sb.from("machine_downtime").update({ ended_at: new Date().toISOString() }).eq("id", id).select("*").single());
    await sb.from("machines").update({ status: "idle" }).eq("id", (row as any).machine_id);
    return row;
  },
};

// ---------- Maintenance ----------
export const maintenance = {
  list: async (sb: SB, companyId: string, opts: { machine_id?: string; status?: string } = {}) => {
    let q = sb.from("maintenance_orders").select("*").eq("company_id", companyId).order("scheduled_for", { ascending: true }).limit(200);
    if (opts.machine_id) q = q.eq("machine_id", opts.machine_id);
    if (opts.status) q = q.eq("status", opts.status);
    return unwrap(await q);
  },
  schedule: async (sb: SB, data: { company_id: string; machine_id: string; kind?: "preventive"|"corrective"|"inspection"; scheduled_for?: string; notes?: string }) =>
    unwrap(await sb.from("maintenance_orders").insert({
      company_id: data.company_id, machine_id: data.machine_id, kind: data.kind ?? "preventive",
      scheduled_for: data.scheduled_for ?? null, notes: data.notes ?? null,
    }).select("*").single()),
  start: async (sb: SB, id: string) => {
    const row = unwrap(await sb.from("maintenance_orders").update({ status: "in_progress" }).eq("id", id).select("*").single());
    await sb.from("machines").update({ status: "maintenance" }).eq("id", (row as any).machine_id);
    return row;
  },
  complete: async (sb: SB, userId: string, id: string, notes?: string) => {
    const patch: Record<string, unknown> = { status: "completed", performed_by: userId, performed_at: new Date().toISOString() };
    if (notes) patch.notes = notes;
    const row = unwrap(await sb.from("maintenance_orders").update(patch).eq("id", id).select("*").single());
    await sb.from("machines").update({ status: "idle" }).eq("id", (row as any).machine_id);
    return row;
  },
  cancel: async (sb: SB, id: string) =>
    unwrap(await sb.from("maintenance_orders").update({ status: "cancelled" }).eq("id", id).select("*").single()),
};

// ---------- Production Orders ----------
export const production = {
  list: async (sb: SB, companyId: string, opts: { status?: string; q?: string; limit?: number } = {}) => {
    let q = sb.from("production_orders").select("*, product:products(id,name,sku), machine:machines(id,name)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.q) q = q.ilike("number", `%${opts.q}%`);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const po = unwrap(await sb.from("production_orders").select("*, product:products(id,name,sku), machine:machines(id,name)").eq("id", id).maybeSingle());
    const batches = unwrap(await sb.from("production_batches").select("*").eq("production_order_id", id).order("manufactured_at", { ascending: false }));
    return { ...(po as any), batches };
  },
  create: async (sb: SB, userId: string, data: {
    company_id: string; product_id: string; bom_id?: string; machine_id?: string; warehouse_id?: string;
    operator_id?: string; planned_quantity: number; scheduled_start?: string; scheduled_end?: string; notes?: string;
  }) => {
    const number = await nextNumber(sb, "production_orders", data.company_id, "MO");
    const row = unwrap(await sb.from("production_orders").insert({
      ...data, number, created_by: userId, status: "scheduled",
    }).select("*").single());
    await writeAudit(sb, { category: "mfg.production", action: "scheduled", entity_type: "production_order", entity_id: (row as any).id, company_id: data.company_id, after: row });
    return row;
  },
  start: async (sb: SB, userId: string, id: string) => {
    const row = unwrap(await sb.from("production_orders").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", id).select("*").single());
    if ((row as any).machine_id) {
      await sb.from("machines").update({ status: "running" }).eq("id", (row as any).machine_id);
    }
    await writeAudit(sb, { category: "mfg.production", action: "started", entity_type: "production_order", entity_id: id, company_id: (row as any).company_id, metadata: { actor: userId } });
    return row;
  },
  complete: async (sb: SB, userId: string, id: string, produced_quantity: number) => {
    const row = unwrap(await sb.from("production_orders").update({
      status: "completed", completed_at: new Date().toISOString(), produced_quantity,
    }).eq("id", id).select("*").single());
    if ((row as any).machine_id) {
      await sb.from("machines").update({ status: "idle" }).eq("id", (row as any).machine_id);
    }
    await writeAudit(sb, { category: "mfg.production", action: "completed", entity_type: "production_order", entity_id: id, company_id: (row as any).company_id, metadata: { actor: userId, produced_quantity } });
    return row;
  },
  cancel: async (sb: SB, userId: string, id: string, reason?: string) => {
    const row = unwrap(await sb.from("production_orders").update({ status: "cancelled" }).eq("id", id).select("*").single());
    if ((row as any).machine_id) {
      await sb.from("machines").update({ status: "idle" }).eq("id", (row as any).machine_id);
    }
    await writeAudit(sb, { category: "mfg.production", action: "cancelled", entity_type: "production_order", entity_id: id, company_id: (row as any).company_id, metadata: { actor: userId, reason }, severity: "warning" });
    return row;
  },
};

// ---------- Batches ----------
export const batches = {
  list: async (sb: SB, companyId: string, opts: { product_id?: string; quality_status?: string; limit?: number } = {}) => {
    let q = sb.from("production_batches").select("*, product:products(id,name,sku)").eq("company_id", companyId).order("manufactured_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.product_id) q = q.eq("product_id", opts.product_id);
    if (opts.quality_status) q = q.eq("quality_status", opts.quality_status);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) =>
    unwrap(await sb.from("production_batches").select("*, product:products(id,name,sku), production_order:production_orders(id,number)").eq("id", id).maybeSingle()),
  create: async (sb: SB, userId: string, data: {
    company_id: string; product_id: string; production_order_id?: string; quantity: number;
    batch_number?: string; manufactured_at?: string; expires_at?: string; traceability?: Record<string, unknown>; notes?: string;
  }) => {
    const number = data.batch_number ?? await nextNumber(sb, "production_batches", data.company_id, "B");
    const row = unwrap(await sb.from("production_batches").insert({
      company_id: data.company_id, product_id: data.product_id, production_order_id: data.production_order_id ?? null,
      batch_number: number, quantity: data.quantity,
      manufactured_at: data.manufactured_at ?? new Date().toISOString(),
      expires_at: data.expires_at ?? null,
      traceability: (data.traceability ?? {}) as any, notes: data.notes ?? null,
    }).select("*").single());
    await writeAudit(sb, { category: "mfg.batch", action: "created", entity_type: "batch", entity_id: (row as any).id, company_id: data.company_id, metadata: { actor: userId, batch_number: number } });
    return row;
  },
  setQuality: async (sb: SB, id: string, status: "pending"|"pass"|"fail"|"rework"|"quarantined") =>
    unwrap(await sb.from("production_batches").update({ quality_status: status }).eq("id", id).select("*").single()),
  remove: async (sb: SB, id: string) => {
    unwrap(await sb.from("production_batches").delete().eq("id", id).select("id"));
    return { ok: true };
  },
};

// ---------- Quality ----------
export const quality = {
  list: async (sb: SB, companyId: string, opts: { batch_id?: string; result?: string; limit?: number } = {}) => {
    let q = sb.from("quality_inspections").select("*").eq("company_id", companyId).order("inspected_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.batch_id) q = q.eq("batch_id", opts.batch_id);
    if (opts.result) q = q.eq("result", opts.result);
    return unwrap(await q);
  },
  inspect: async (sb: SB, userId: string, data: {
    company_id: string; batch_id?: string; production_order_id?: string;
    result: "pass"|"fail"|"rework"; criteria?: Record<string, unknown>; notes?: string;
  }) => {
    const row = unwrap(await sb.from("quality_inspections").insert({
      company_id: data.company_id, batch_id: data.batch_id ?? null,
      production_order_id: data.production_order_id ?? null,
      inspector_id: userId, result: data.result,
      criteria: (data.criteria ?? {}) as any, notes: data.notes ?? null,
    }).select("*").single());
    if (data.batch_id) {
      const mapped = data.result === "pass" ? "pass" : data.result === "fail" ? "fail" : "rework";
      await sb.from("production_batches").update({ quality_status: mapped }).eq("id", data.batch_id);
    }
    await writeAudit(sb, { category: "mfg.quality", action: `inspected.${data.result}`, entity_type: "quality_inspection", entity_id: (row as any).id, company_id: data.company_id, severity: data.result === "fail" ? "warning" : "info" });
    return row;
  },
  passRate: async (sb: SB, companyId: string, days = 30) => {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const rows = unwrap(await sb.from("quality_inspections").select("result").eq("company_id", companyId).gte("inspected_at", since));
    const arr = rows as Array<{ result: string }>;
    const total = arr.length;
    const pass = arr.filter(r => r.result === "pass").length;
    return { total, pass, fail: arr.filter(r => r.result === "fail").length, rework: arr.filter(r => r.result === "rework").length, pass_rate: total ? (pass / total) * 100 : 0 };
  },
};

// ---------- Dashboard ----------
export const mfgDashboard = {
  company: async (sb: SB, companyId: string) => {
    const [active, batchesActive, downMachines, dueMaintenance, qr] = await Promise.all([
      sb.from("production_orders").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "in_progress"),
      sb.from("production_batches").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("quality_status", ["pending", "pass"]),
      sb.from("machines").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["offline", "maintenance"]),
      sb.from("maintenance_orders").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["scheduled", "in_progress"]),
      quality.passRate(sb, companyId, 30),
    ]);
    return {
      active_production_orders: active.count ?? 0,
      active_batches: batchesActive.count ?? 0,
      machines_offline_or_maintenance: downMachines.count ?? 0,
      maintenance_pending: dueMaintenance.count ?? 0,
      quality_30d: qr,
    };
  },
};
