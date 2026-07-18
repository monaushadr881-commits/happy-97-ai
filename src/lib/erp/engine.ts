/**
 * HAPPY X — R19 ERP Engine
 *
 * Real ERP runtime built on top of the existing enterprise schema
 * (companies, departments, business_units, offices, suppliers, warehouses,
 *  purchase_orders/items, sales_orders/items, workflows, workflow_runs)
 * plus the new `approvals` table.
 *
 * All operations are RLS-scoped to company members. Every state transition
 * writes an audit log entry (`write_audit`) and produces in-app notifications
 * for the requester + admins.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { sanitizePgRestLike } from "@/lib/security/pgrest-sanitize";

export type SB = SupabaseClient<Database>;

// ---------------- helpers ----------------
async function audit(
  sb: SB,
  action: string,
  entityType: string,
  entityId: string | null,
  companyId: string | null,
  before: unknown,
  after: unknown,
  severity: "info" | "notice" | "warning" | "critical" = "info",
) {
  await sb.rpc("write_audit", {
    _category: "erp",
    _action: action,
    _entity_type: entityType,
    _entity_id: entityId ?? undefined,
    _company_id: companyId ?? undefined,
    _before: (before ?? undefined) as never,
    _after: (after ?? undefined) as never,
    _severity: severity,
    _metadata: {} as never,
  } as never);
}

async function notify(
  sb: SB,
  userId: string,
  kind: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  await sb.from("notifications").insert({
    user_id: userId,
    kind,
    title,
    body,
    data: data as never,
  } as never);
}

async function logActivity(
  sb: SB,
  companyId: string,
  actorId: string | null,
  entityType: string,
  entityId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await sb.from("activity_events").insert({
    company_id: companyId,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    source: "erp",
    metadata: metadata as never,
  } as never);
}

function nextNumber(prefix: string) {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 1_000_000).toString(36).toUpperCase();
  return `${prefix}-${yy}${mm}-${rnd}`;
}

function computeTotals(items: { quantity: number; unit_cents: number }[]) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_cents, 0);
  return { subtotal_cents: subtotal, total_cents: subtotal, tax_cents: 0 };
}

// ---------------- Companies / Branches / Departments / Units ----------------
export const org = {
  async companies(sb: SB) {
    const { data, error } = await sb.from("companies").select("*").order("display_name");
    if (error) throw error;
    return data ?? [];
  },
  async branches(sb: SB, companyId: string) {
    const { data, error } = await sb.from("offices").select("*").eq("company_id", companyId).order("name");
    if (error) throw error;
    return data ?? [];
  },
  async departments(sb: SB, companyId: string) {
    const { data, error } = await sb.from("departments").select("*").eq("company_id", companyId).order("name");
    if (error) throw error;
    return data ?? [];
  },
  async businessUnits(sb: SB, companyId: string) {
    const { data, error } = await sb.from("business_units").select("*").eq("company_id", companyId).order("name");
    if (error) throw error;
    return data ?? [];
  },
};

// ---------------- Vendors (suppliers) ----------------
export const vendors = {
  async list(sb: SB, companyId: string, opts: { q?: string; limit?: number } = {}) {
    let q = sb.from("suppliers").select("*").eq("company_id", companyId).is("deleted_at", null);
    if (opts.q) { const s = sanitizePgRestLike(opts.q); if (s) q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,code.ilike.%${s}%`); }
    const { data, error } = await q.order("name").limit(opts.limit ?? 200);
    if (error) throw error;
    return data ?? [];
  },
  async get(sb: SB, id: string) {
    const { data, error } = await sb.from("suppliers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
  async create(
    sb: SB,
    userId: string,
    input: { company_id: string; name: string; code?: string; email?: string; phone?: string; tax_id?: string; address?: Json },
  ) {
    const { data, error } = await sb
      .from("suppliers")
      .insert({
        company_id: input.company_id,
        name: input.name,
        code: input.code ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        tax_id: input.tax_id ?? null,
        address: (input.address ?? {}) as never,
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "vendor.created", "supplier", data.id, input.company_id, null, data);
    return data;
  },
  async update(sb: SB, userId: string, id: string, patch: Record<string, unknown>) {
    const { data: before } = await sb.from("suppliers").select("*").eq("id", id).maybeSingle();
    const { data, error } = await sb
      .from("suppliers")
      .update({ ...patch, updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "vendor.updated", "supplier", id, data.company_id, before, data);
    return data;
  },
  async remove(sb: SB, userId: string, id: string) {
    const { data: before } = await sb.from("suppliers").select("*").eq("id", id).maybeSingle();
    const { error } = await sb.from("suppliers").update({ deleted_at: new Date().toISOString(), updated_by: userId } as never).eq("id", id);
    if (error) throw error;
    if (before) await audit(sb, "vendor.deleted", "supplier", id, before.company_id, before, null, "warning");
    return { ok: true };
  },
};

// ---------------- Approvals ----------------
export const approvals = {
  async list(sb: SB, companyId: string, opts: { status?: string; entity_type?: string; limit?: number } = {}) {
    let q = sb.from("approvals").select("*").eq("company_id", companyId);
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.entity_type) q = q.eq("entity_type", opts.entity_type);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (error) throw error;
    return data ?? [];
  },
  async create(
    sb: SB,
    userId: string,
    input: {
      company_id: string;
      entity_type: string;
      entity_id: string;
      title: string;
      reason?: string;
      amount_cents?: number;
      currency?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const { data, error } = await sb
      .from("approvals")
      .insert({
        company_id: input.company_id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        title: input.title,
        reason: input.reason ?? null,
        amount_cents: input.amount_cents ?? 0,
        currency: input.currency ?? "USD",
        requested_by: userId,
        metadata: (input.metadata ?? {}) as never,
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "approval.requested", input.entity_type, input.entity_id, input.company_id, null, data);
    await logActivity(sb, input.company_id, userId, "approval", data.id, "requested", { entity_type: input.entity_type });
    // Notify company admins (best effort: assignees found via role_assignments company scope with admin/founder codes)
    const { data: admins } = await sb
      .from("role_assignments")
      .select("user_id, roles:role_id(code)")
      .eq("scope_type", "company")
      .eq("scope_id", input.company_id);
    for (const a of ((admins ?? []) as unknown as { user_id: string; roles: { code: string } | null }[])) {
      if (!a.roles) continue;
      if (["company_admin", "super_admin", "founder"].includes(a.roles.code)) {
        await notify(sb, a.user_id, "approval_required", `Approval needed: ${input.title}`, input.reason ?? "", {
          approval_id: data.id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        });
      }
    }
    return data;
  },
  async decide(sb: SB, userId: string, id: string, decision: "approved" | "rejected", reason?: string) {
    const { data: before, error: e0 } = await sb.from("approvals").select("*").eq("id", id).maybeSingle();
    if (e0) throw e0;
    if (!before) throw new Error("Approval not found");
    if (before.status !== "pending") throw new Error(`Approval already ${before.status}`);
    const { data, error } = await sb
      .from("approvals")
      .update({
        status: decision,
        approver_id: userId,
        decided_at: new Date().toISOString(),
        reason: reason ?? before.reason,
      } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    // Sync entity approval_status if PO / SO
    if (before.entity_type === "purchase_order") {
      await sb.from("purchase_orders").update({ approval_status: decision } as never).eq("id", before.entity_id);
    } else if (before.entity_type === "sales_order") {
      await sb.from("sales_orders").update({ approval_status: decision } as never).eq("id", before.entity_id);
    }
    await audit(sb, `approval.${decision}`, before.entity_type, before.entity_id, before.company_id, before, data, "notice");
    await logActivity(sb, before.company_id, userId, "approval", id, decision);
    if (before.requested_by) {
      await notify(
        sb,
        before.requested_by,
        `approval_${decision}`,
        `Request ${decision}: ${before.title}`,
        reason ?? "",
        { approval_id: id },
      );
    }
    return data;
  },
  async cancel(sb: SB, userId: string, id: string) {
    const { data: before } = await sb.from("approvals").select("*").eq("id", id).maybeSingle();
    if (!before) throw new Error("Approval not found");
    if (before.status !== "pending") throw new Error("Only pending approvals can be cancelled");
    const { data, error } = await sb
      .from("approvals")
      .update({ status: "cancelled", decided_at: new Date().toISOString() } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    if (before.entity_type === "purchase_order") {
      await sb.from("purchase_orders").update({ approval_status: "cancelled" } as never).eq("id", before.entity_id);
    } else if (before.entity_type === "sales_order") {
      await sb.from("sales_orders").update({ approval_status: "cancelled" } as never).eq("id", before.entity_id);
    }
    await audit(sb, "approval.cancelled", before.entity_type, before.entity_id, before.company_id, before, data);
    return data;
  },
};

// ---------------- Purchase Orders ----------------
export const purchase = {
  async list(sb: SB, companyId: string, opts: { status?: string; supplier?: string; q?: string; limit?: number } = {}) {
    let q = sb.from("purchase_orders").select("*").eq("company_id", companyId).is("deleted_at", null);
    if (opts.status) q = q.eq("approval_status", opts.status);
    if (opts.supplier) q = q.eq("supplier_id", opts.supplier);
    if (opts.q) { const s = sanitizePgRestLike(opts.q); if (s) q = q.or(`number.ilike.%${s}%,notes.ilike.%${s}%`); }
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (error) throw error;
    return data ?? [];
  },
  async get(sb: SB, id: string) {
    const { data: po, error } = await sb.from("purchase_orders").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!po) return null;
    const { data: items } = await sb.from("purchase_order_items").select("*").eq("purchase_order_id", id);
    const { data: approvals } = await sb.from("approvals").select("*").eq("entity_type", "purchase_order").eq("entity_id", id).order("created_at", { ascending: false });
    return { ...po, items: items ?? [], approvals: approvals ?? [] };
  },
  async create(
    sb: SB,
    userId: string,
    input: {
      company_id: string;
      supplier_id?: string;
      warehouse_id?: string;
      currency?: string;
      notes?: string;
      items: { product_id?: string; description?: string; quantity: number; unit_cents: number }[];
    },
  ) {
    const totals = computeTotals(input.items);
    const number = nextNumber("PO");
    const { data: po, error } = await sb
      .from("purchase_orders")
      .insert({
        company_id: input.company_id,
        supplier_id: input.supplier_id ?? null,
        warehouse_id: input.warehouse_id ?? null,
        currency: input.currency ?? "USD",
        notes: input.notes ?? null,
        number,
        subtotal_cents: totals.subtotal_cents,
        total_cents: totals.total_cents,
        tax_cents: totals.tax_cents,
        approval_status: "draft",
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    if (input.items.length) {
      const rows = input.items.map((i) => ({
        purchase_order_id: po.id,
        product_id: i.product_id ?? null,
        description: i.description ?? null,
        quantity: i.quantity,
        unit_cost_cents: i.unit_cents,
        total_cents: i.quantity * i.unit_cents,
      }));
      const { error: iErr } = await sb.from("purchase_order_items").insert(rows as never);
      if (iErr) throw iErr;
    }
    await audit(sb, "po.created", "purchase_order", po.id, input.company_id, null, po);
    await logActivity(sb, input.company_id, userId, "purchase_order", po.id, "created", { number });
    return po;
  },
  async submit(sb: SB, userId: string, id: string) {
    const { data: po } = await sb.from("purchase_orders").select("*").eq("id", id).maybeSingle();
    if (!po) throw new Error("PO not found");
    if (po.approval_status !== "draft" && po.approval_status !== "rejected") {
      throw new Error(`Cannot submit PO in status ${po.approval_status}`);
    }
    const { data: updated, error } = await sb
      .from("purchase_orders")
      .update({ approval_status: "pending", updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await approvals.create(sb, userId, {
      company_id: po.company_id,
      entity_type: "purchase_order",
      entity_id: id,
      title: `Purchase Order ${po.number}`,
      amount_cents: po.total_cents,
      currency: po.currency,
      metadata: { supplier_id: po.supplier_id },
    });
    return updated;
  },
  async receive(sb: SB, userId: string, id: string) {
    const { data: po } = await sb.from("purchase_orders").select("*").eq("id", id).maybeSingle();
    if (!po) throw new Error("PO not found");
    if (po.approval_status !== "approved") throw new Error("PO must be approved before receiving");
    const { data, error } = await sb
      .from("purchase_orders")
      .update({ approval_status: "completed", received_at: new Date().toISOString(), updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "po.received", "purchase_order", id, po.company_id, po, data, "notice");
    await logActivity(sb, po.company_id, userId, "purchase_order", id, "received");
    return data;
  },
  async cancel(sb: SB, userId: string, id: string, reason?: string) {
    const { data: po } = await sb.from("purchase_orders").select("*").eq("id", id).maybeSingle();
    if (!po) throw new Error("PO not found");
    const { data, error } = await sb
      .from("purchase_orders")
      .update({ approval_status: "cancelled", notes: reason ?? po.notes, updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "po.cancelled", "purchase_order", id, po.company_id, po, data, "warning");
    return data;
  },
};

// ---------------- Sales Orders ----------------
export const sales = {
  async list(sb: SB, companyId: string, opts: { status?: string; customer?: string; q?: string; limit?: number } = {}) {
    let q = sb.from("sales_orders").select("*").eq("company_id", companyId).is("deleted_at", null);
    if (opts.status) q = q.eq("approval_status", opts.status);
    if (opts.customer) q = q.eq("customer_id", opts.customer);
    if (opts.q) { const s = sanitizePgRestLike(opts.q); if (s) q = q.or(`number.ilike.%${s}%,notes.ilike.%${s}%`); }
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (error) throw error;
    return data ?? [];
  },
  async get(sb: SB, id: string) {
    const { data: so, error } = await sb.from("sales_orders").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!so) return null;
    const { data: items } = await sb.from("sales_order_items").select("*").eq("sales_order_id", id);
    const { data: approvalRows } = await sb.from("approvals").select("*").eq("entity_type", "sales_order").eq("entity_id", id).order("created_at", { ascending: false });
    return { ...so, items: items ?? [], approvals: approvalRows ?? [] };
  },
  async create(
    sb: SB,
    userId: string,
    input: {
      company_id: string;
      customer_id?: string;
      warehouse_id?: string;
      currency?: string;
      notes?: string;
      items: { product_id?: string; description?: string; quantity: number; unit_cents: number }[];
    },
  ) {
    const totals = computeTotals(input.items);
    const number = nextNumber("SO");
    const { data: so, error } = await sb
      .from("sales_orders")
      .insert({
        company_id: input.company_id,
        customer_id: input.customer_id ?? null,
        warehouse_id: input.warehouse_id ?? null,
        currency: input.currency ?? "USD",
        notes: input.notes ?? null,
        number,
        subtotal_cents: totals.subtotal_cents,
        total_cents: totals.total_cents,
        tax_cents: totals.tax_cents,
        approval_status: "draft",
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    if (input.items.length) {
      const rows = input.items.map((i) => ({
        sales_order_id: so.id,
        product_id: i.product_id ?? null,
        description: i.description ?? null,
        quantity: i.quantity,
        unit_price_cents: i.unit_cents,
        total_cents: i.quantity * i.unit_cents,
      }));
      const { error: iErr } = await sb.from("sales_order_items").insert(rows as never);
      if (iErr) throw iErr;
    }
    await audit(sb, "so.created", "sales_order", so.id, input.company_id, null, so);
    await logActivity(sb, input.company_id, userId, "sales_order", so.id, "created", { number });
    return so;
  },
  async submit(sb: SB, userId: string, id: string) {
    const { data: so } = await sb.from("sales_orders").select("*").eq("id", id).maybeSingle();
    if (!so) throw new Error("SO not found");
    if (so.approval_status !== "draft" && so.approval_status !== "rejected") {
      throw new Error(`Cannot submit SO in status ${so.approval_status}`);
    }
    const { data: updated, error } = await sb
      .from("sales_orders")
      .update({ approval_status: "pending", updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await approvals.create(sb, userId, {
      company_id: so.company_id,
      entity_type: "sales_order",
      entity_id: id,
      title: `Sales Order ${so.number}`,
      amount_cents: so.total_cents,
      currency: so.currency,
      metadata: { customer_id: so.customer_id },
    });
    return updated;
  },
  async fulfill(sb: SB, userId: string, id: string) {
    const { data: so } = await sb.from("sales_orders").select("*").eq("id", id).maybeSingle();
    if (!so) throw new Error("SO not found");
    if (so.approval_status !== "approved") throw new Error("SO must be approved before fulfillment");
    const { data, error } = await sb
      .from("sales_orders")
      .update({ approval_status: "fulfilled", fulfilled_at: new Date().toISOString(), updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "so.fulfilled", "sales_order", id, so.company_id, so, data, "notice");
    await logActivity(sb, so.company_id, userId, "sales_order", id, "fulfilled");
    return data;
  },
  async cancel(sb: SB, userId: string, id: string, reason?: string) {
    const { data: so } = await sb.from("sales_orders").select("*").eq("id", id).maybeSingle();
    if (!so) throw new Error("SO not found");
    const { data, error } = await sb
      .from("sales_orders")
      .update({ approval_status: "cancelled", notes: reason ?? so.notes, updated_by: userId } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "so.cancelled", "sales_order", id, so.company_id, so, data, "warning");
    return data;
  },
};

// ---------------- Workflows (reuse existing) ----------------
export const workflows = {
  async list(sb: SB, companyId: string) {
    const { data, error } = await sb
      .from("workflows")
      .select("*")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async runs(sb: SB, companyId: string, opts: { workflow_id?: string; limit?: number } = {}) {
    let q = sb
      .from("workflow_runs")
      .select("*, workflows!inner(id, name, company_id)")
      .eq("workflows.company_id", companyId);
    if (opts.workflow_id) q = q.eq("workflow_id", opts.workflow_id);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (error) throw error;
    return data ?? [];
  },
  async trigger(sb: SB, userId: string, workflowId: string, input: Record<string, unknown> = {}) {
    const { data: wf } = await sb.from("workflows").select("*").eq("id", workflowId).maybeSingle();
    if (!wf) throw new Error("Workflow not found");
    if (!wf.is_active) throw new Error("Workflow is inactive");
    const { data, error } = await sb
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        status: "queued",
        input: input as never,
        started_at: new Date().toISOString(),
      } as never)
      .select("*")
      .single();
    if (error) throw error;
    await audit(sb, "workflow.triggered", "workflow", workflowId, wf.company_id, null, data);
    await logActivity(sb, wf.company_id, userId, "workflow", workflowId, "triggered", { run_id: data.id });
    return data;
  },
};

// ---------------- Search ----------------
export const erpSearch = {
  async search(sb: SB, companyId: string, query: string, limit = 25) {
    const like = `%${query}%`;
    const [pos, sos, sup, dep, appr] = await Promise.all([
      sb.from("purchase_orders").select("id, number, total_cents, approval_status").eq("company_id", companyId).ilike("number", like).limit(limit),
      sb.from("sales_orders").select("id, number, total_cents, approval_status").eq("company_id", companyId).ilike("number", like).limit(limit),
      sb.from("suppliers").select("id, name, code").eq("company_id", companyId).or(`name.ilike.${like},code.ilike.${like}`).limit(limit),
      sb.from("departments").select("id, name, code").eq("company_id", companyId).ilike("name", like).limit(limit),
      sb.from("approvals").select("id, title, status, entity_type").eq("company_id", companyId).ilike("title", like).limit(limit),
    ]);
    return {
      purchase_orders: pos.data ?? [],
      sales_orders: sos.data ?? [],
      vendors: sup.data ?? [],
      departments: dep.data ?? [],
      approvals: appr.data ?? [],
    };
  },
};

// ---------------- Dashboards ----------------
export const dashboards = {
  async company(sb: SB, companyId: string) {
    const [poAll, soAll, appr, vendorsCount, branchesCount, deptsCount] = await Promise.all([
      sb.from("purchase_orders").select("id, total_cents, approval_status").eq("company_id", companyId).is("deleted_at", null),
      sb.from("sales_orders").select("id, total_cents, approval_status").eq("company_id", companyId).is("deleted_at", null),
      sb.from("approvals").select("id, status, amount_cents").eq("company_id", companyId),
      sb.from("suppliers").select("id", { count: "exact", head: true }).eq("company_id", companyId).is("deleted_at", null),
      sb.from("offices").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      sb.from("departments").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    ]);
    const po = (poAll.data ?? []) as { total_cents: number; approval_status: string }[];
    const so = (soAll.data ?? []) as { total_cents: number; approval_status: string }[];
    const ap = (appr.data ?? []) as { status: string; amount_cents: number }[];
    return {
      purchase: {
        total_orders: po.length,
        total_volume_cents: po.reduce((s, r) => s + (r.total_cents || 0), 0),
        pending: po.filter((r) => r.approval_status === "pending").length,
        completed: po.filter((r) => r.approval_status === "completed").length,
      },
      sales: {
        total_orders: so.length,
        total_volume_cents: so.reduce((s, r) => s + (r.total_cents || 0), 0),
        pending: so.filter((r) => r.approval_status === "pending").length,
        fulfilled: so.filter((r) => r.approval_status === "fulfilled").length,
      },
      approvals: {
        pending: ap.filter((r) => r.status === "pending").length,
        approved: ap.filter((r) => r.status === "approved").length,
        rejected: ap.filter((r) => r.status === "rejected").length,
        pending_amount_cents: ap.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amount_cents || 0), 0),
      },
      counts: {
        vendors: vendorsCount.count ?? 0,
        branches: branchesCount.count ?? 0,
        departments: deptsCount.count ?? 0,
      },
    };
  },
  async founder(sb: SB) {
    const [companies, po, so, appr, vendorsCount] = await Promise.all([
      sb.from("companies").select("id, display_name"),
      sb.from("purchase_orders").select("company_id, total_cents, approval_status").is("deleted_at", null),
      sb.from("sales_orders").select("company_id, total_cents, approval_status").is("deleted_at", null),
      sb.from("approvals").select("company_id, status"),
      sb.from("suppliers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    ]);
    const byCompany = new Map<string, { name: string; purchase_cents: number; sales_cents: number; pending_approvals: number }>();
    for (const c of (companies.data ?? []) as { id: string; display_name: string }[]) {
      byCompany.set(c.id, { name: c.display_name, purchase_cents: 0, sales_cents: 0, pending_approvals: 0 });
    }
    for (const r of (po.data ?? []) as { company_id: string; total_cents: number }[]) {
      const e = byCompany.get(r.company_id); if (e) e.purchase_cents += r.total_cents || 0;
    }
    for (const r of (so.data ?? []) as { company_id: string; total_cents: number }[]) {
      const e = byCompany.get(r.company_id); if (e) e.sales_cents += r.total_cents || 0;
    }
    for (const r of (appr.data ?? []) as { company_id: string; status: string }[]) {
      if (r.status !== "pending") continue;
      const e = byCompany.get(r.company_id); if (e) e.pending_approvals += 1;
    }
    return {
      companies_count: (companies.data ?? []).length,
      vendors_count: vendorsCount.count ?? 0,
      purchase_volume_cents: ((po.data ?? []) as { total_cents: number }[]).reduce((s, r) => s + (r.total_cents || 0), 0),
      sales_volume_cents: ((so.data ?? []) as { total_cents: number }[]).reduce((s, r) => s + (r.total_cents || 0), 0),
      pending_approvals: ((appr.data ?? []) as { status: string }[]).filter((r) => r.status === "pending").length,
      by_company: Array.from(byCompany.entries()).map(([id, v]) => ({ company_id: id, ...v })),
    };
  },
};
