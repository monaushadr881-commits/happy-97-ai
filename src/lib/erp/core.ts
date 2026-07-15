/**
 * HAPPY X — R22 ERP Core runtime.
 * Extends the R19 engine with purchase requests, vendor quotations,
 * goods receipts, vendor catalog (categories/ratings/documents/contracts),
 * and approval delegations. Reuses existing RLS, audit, notification and
 * approval primitives — no duplication.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { approvals as approvalEngine } from "./engine";

type SB = SupabaseClient<any, "public", any>;

async function writeAudit(sb: SB, args: {
  category: string; action: string; entity_type?: string; entity_id?: string;
  company_id?: string; before?: unknown; after?: unknown; severity?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await sb.rpc("write_audit", {
      _category: args.category,
      _action: args.action,
      _entity_type: args.entity_type ?? null,
      _entity_id: args.entity_id ?? null,
      _company_id: args.company_id ?? null,
      _before: args.before ?? null,
      _after: args.after ?? null,
      _severity: (args.severity as any) ?? "info",
      _metadata: (args.metadata ?? {}) as any,
    });
  } catch { /* audit is best-effort */ }
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function nextNumber(sb: SB, table: string, companyId: string, prefix: string) {
  const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
  const seq = ((count ?? 0) + 1).toString().padStart(5, "0");
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

// ---------- Purchase Requests ----------
export const purchaseRequests = {
  list: async (sb: SB, companyId: string, opts: { status?: string; q?: string; limit?: number } = {}) => {
    let q = sb.from("purchase_requests").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(opts.limit ?? 50);
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.q) q = q.ilike("title", `%${opts.q}%`);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const req = unwrap(await sb.from("purchase_requests").select("*").eq("id", id).maybeSingle());
    const items = unwrap(await sb.from("purchase_request_items").select("*").eq("request_id", id).order("created_at"));
    return { ...(req as any), items };
  },
  create: async (sb: SB, userId: string, data: {
    company_id: string; title: string; justification?: string; department_id?: string; branch_id?: string;
    currency?: string; needed_by?: string;
    items?: Array<{ description: string; quantity: number; unit_cost_cents: number }>;
  }) => {
    const number = await nextNumber(sb, "purchase_requests", data.company_id, "PR");
    const items = data.items ?? [];
    const total = items.reduce((s, i) => s + Math.round(i.quantity * i.unit_cost_cents), 0);
    const row = unwrap(await sb.from("purchase_requests").insert({
      company_id: data.company_id, number, title: data.title, justification: data.justification ?? null,
      department_id: data.department_id ?? null, branch_id: data.branch_id ?? null,
      currency: data.currency ?? "USD", total_cents: total, needed_by: data.needed_by ?? null,
      requested_by: userId, status: "draft",
    }).select("*").single());
    if (items.length) {
      await sb.from("purchase_request_items").insert(items.map(i => ({
        request_id: (row as any).id, description: i.description, quantity: i.quantity,
        unit_cost_cents: i.unit_cost_cents, total_cents: Math.round(i.quantity * i.unit_cost_cents),
      })));
    }
    await writeAudit(sb, { category: "erp.purchase_request", action: "created", entity_type: "purchase_request", entity_id: (row as any).id, company_id: data.company_id, after: row });
    return row;
  },
  submit: async (sb: SB, userId: string, id: string) => {
    const req = unwrap(await sb.from("purchase_requests").update({ status: "submitted" }).eq("id", id).select("*").single());
    const r = req as any;
    // create approval
    await approvalEngine.create(sb, userId, {
      company_id: r.company_id, entity_type: "purchase_request", entity_id: r.id,
      title: `Purchase Request ${r.number}: ${r.title}`, amount_cents: r.total_cents, currency: r.currency,
      reason: r.justification ?? undefined,
    });
    await writeAudit(sb, { category: "erp.purchase_request", action: "submitted", entity_type: "purchase_request", entity_id: id, company_id: r.company_id });
    return req;
  },
  cancel: async (sb: SB, userId: string, id: string, reason?: string) => {
    const req = unwrap(await sb.from("purchase_requests").update({ status: "cancelled" }).eq("id", id).select("*").single());
    await writeAudit(sb, { category: "erp.purchase_request", action: "cancelled", entity_type: "purchase_request", entity_id: id, company_id: (req as any).company_id, metadata: { reason, actor: userId } });
    return req;
  },
  remove: async (sb: SB, userId: string, id: string) => {
    const before = unwrap(await sb.from("purchase_requests").select("*").eq("id", id).maybeSingle());
    unwrap(await sb.from("purchase_requests").delete().eq("id", id).select("id"));
    await writeAudit(sb, { category: "erp.purchase_request", action: "deleted", entity_type: "purchase_request", entity_id: id, company_id: (before as any)?.company_id, before, metadata: { actor: userId }, severity: "warning" });
    return { ok: true };
  },
};

// ---------- Vendor Quotations ----------
export const quotations = {
  list: async (sb: SB, companyId: string, opts: { request_id?: string; supplier_id?: string; status?: string; limit?: number } = {}) => {
    let q = sb.from("vendor_quotations").select("*, supplier:suppliers(id,name,code)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.request_id) q = q.eq("request_id", opts.request_id);
    if (opts.supplier_id) q = q.eq("supplier_id", opts.supplier_id);
    if (opts.status) q = q.eq("status", opts.status);
    return unwrap(await q);
  },
  create: async (sb: SB, userId: string, data: {
    company_id: string; supplier_id: string; request_id?: string; reference?: string;
    total_cents: number; currency?: string; valid_until?: string; notes?: string;
    attachments?: unknown[];
  }) => {
    const row = unwrap(await sb.from("vendor_quotations").insert({
      company_id: data.company_id, supplier_id: data.supplier_id, request_id: data.request_id ?? null,
      reference: data.reference ?? null, total_cents: data.total_cents, currency: data.currency ?? "USD",
      valid_until: data.valid_until ?? null, notes: data.notes ?? null,
      attachments: (data.attachments ?? []) as any, created_by: userId, status: "received",
    }).select("*").single());
    await writeAudit(sb, { category: "erp.quotation", action: "created", entity_type: "vendor_quotation", entity_id: (row as any).id, company_id: data.company_id, after: row });
    return row;
  },
  setStatus: async (sb: SB, userId: string, id: string, status: "received"|"shortlisted"|"awarded"|"rejected"|"expired") => {
    const row = unwrap(await sb.from("vendor_quotations").update({ status }).eq("id", id).select("*").single());
    await writeAudit(sb, { category: "erp.quotation", action: `status.${status}`, entity_type: "vendor_quotation", entity_id: id, company_id: (row as any).company_id, metadata: { actor: userId } });
    return row;
  },
  remove: async (sb: SB, _userId: string, id: string) => {
    unwrap(await sb.from("vendor_quotations").delete().eq("id", id).select("id"));
    return { ok: true };
  },
};

// ---------- Goods Receipts ----------
export const goodsReceipts = {
  list: async (sb: SB, companyId: string, opts: { po_id?: string; limit?: number } = {}) => {
    let q = sb.from("goods_receipts").select("*").eq("company_id", companyId).order("received_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.po_id) q = q.eq("purchase_order_id", opts.po_id);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const receipt = unwrap(await sb.from("goods_receipts").select("*").eq("id", id).maybeSingle());
    const items = unwrap(await sb.from("goods_receipt_items").select("*").eq("receipt_id", id));
    return { ...(receipt as any), items };
  },
  create: async (sb: SB, userId: string, data: {
    company_id: string; purchase_order_id: string; notes?: string; status?: "received"|"partial"|"rejected"|"returned";
    items?: Array<{ po_item_id?: string; description?: string; quantity_received: number; quantity_rejected?: number }>;
  }) => {
    const number = await nextNumber(sb, "goods_receipts", data.company_id, "GR");
    const row = unwrap(await sb.from("goods_receipts").insert({
      company_id: data.company_id, purchase_order_id: data.purchase_order_id, number,
      received_by: userId, notes: data.notes ?? null, status: data.status ?? "received",
    }).select("*").single());
    if (data.items?.length) {
      await sb.from("goods_receipt_items").insert(data.items.map(i => ({
        receipt_id: (row as any).id, po_item_id: i.po_item_id ?? null, description: i.description ?? null,
        quantity_received: i.quantity_received, quantity_rejected: i.quantity_rejected ?? 0,
      })));
    }
    // update PO received_at if status = received
    if ((data.status ?? "received") === "received") {
      await sb.from("purchase_orders").update({ received_at: new Date().toISOString() }).eq("id", data.purchase_order_id);
    }
    await writeAudit(sb, { category: "erp.goods_receipt", action: "created", entity_type: "goods_receipt", entity_id: (row as any).id, company_id: data.company_id, after: row });
    return row;
  },
};

// ---------- Vendor Catalog ----------
export const vendorCatalog = {
  categories: async (sb: SB, companyId: string) =>
    unwrap(await sb.from("vendor_categories").select("*").eq("company_id", companyId).order("name")),
  createCategory: async (sb: SB, data: { company_id: string; name: string; slug: string; description?: string }) =>
    unwrap(await sb.from("vendor_categories").insert(data).select("*").single()),
  deleteCategory: async (sb: SB, id: string) => {
    unwrap(await sb.from("vendor_categories").delete().eq("id", id).select("id"));
    return { ok: true };
  },
  assign: async (sb: SB, supplier_id: string, category_id: string) =>
    unwrap(await sb.from("vendor_category_map").upsert({ supplier_id, category_id }).select("*").single()),
  unassign: async (sb: SB, supplier_id: string, category_id: string) => {
    await sb.from("vendor_category_map").delete().eq("supplier_id", supplier_id).eq("category_id", category_id);
    return { ok: true };
  },
  supplierCategories: async (sb: SB, supplier_id: string) =>
    unwrap(await sb.from("vendor_category_map").select("category:vendor_categories(*)").eq("supplier_id", supplier_id)),

  ratings: async (sb: SB, supplier_id: string) =>
    unwrap(await sb.from("vendor_ratings").select("*").eq("supplier_id", supplier_id).order("created_at", { ascending: false })),
  rate: async (sb: SB, userId: string, data: { company_id: string; supplier_id: string; rating: number; comment?: string }) => {
    const row = unwrap(await sb.from("vendor_ratings").insert({
      company_id: data.company_id, supplier_id: data.supplier_id, rater_id: userId,
      rating: data.rating, comment: data.comment ?? null,
    }).select("*").single());
    await writeAudit(sb, { category: "erp.vendor", action: "rated", entity_type: "supplier", entity_id: data.supplier_id, company_id: data.company_id, metadata: { rating: data.rating } });
    return row;
  },
  averageRating: async (sb: SB, supplier_id: string) => {
    const rows = unwrap(await sb.from("vendor_ratings").select("rating").eq("supplier_id", supplier_id));
    const arr = rows as Array<{ rating: number }>;
    if (!arr.length) return { average: null, count: 0 };
    const sum = arr.reduce((s, r) => s + r.rating, 0);
    return { average: sum / arr.length, count: arr.length };
  },

  documents: async (sb: SB, supplier_id: string) =>
    unwrap(await sb.from("vendor_documents").select("*").eq("supplier_id", supplier_id).order("created_at", { ascending: false })),
  addDocument: async (sb: SB, userId: string, data: { company_id: string; supplier_id: string; kind?: string; name: string; url: string }) =>
    unwrap(await sb.from("vendor_documents").insert({ ...data, kind: data.kind ?? "general", uploaded_by: userId }).select("*").single()),
  removeDocument: async (sb: SB, id: string) => {
    await sb.from("vendor_documents").delete().eq("id", id); return { ok: true };
  },

  contracts: async (sb: SB, supplier_id: string) =>
    unwrap(await sb.from("vendor_contracts").select("*").eq("supplier_id", supplier_id).order("starts_on", { ascending: false })),
  createContract: async (sb: SB, data: {
    company_id: string; supplier_id: string; title: string; starts_on?: string; ends_on?: string;
    value_cents?: number; currency?: string; terms?: string;
    status?: "draft"|"active"|"expired"|"terminated";
  }) => unwrap(await sb.from("vendor_contracts").insert({
    ...data, value_cents: data.value_cents ?? 0, currency: data.currency ?? "USD", status: data.status ?? "draft",
  }).select("*").single()),
  updateContract: async (sb: SB, id: string, patch: Record<string, unknown>) =>
    unwrap(await sb.from("vendor_contracts").update(patch).eq("id", id).select("*").single()),
  deleteContract: async (sb: SB, id: string) => {
    await sb.from("vendor_contracts").delete().eq("id", id); return { ok: true };
  },
};

// ---------- Approval Delegations ----------
export const delegations = {
  list: async (sb: SB, companyId: string) =>
    unwrap(await sb.from("approval_delegations").select("*").eq("company_id", companyId).order("starts_at", { ascending: false })),
  create: async (sb: SB, userId: string, data: {
    company_id: string; delegatee_id: string; entity_type?: string;
    starts_at?: string; ends_at?: string; reason?: string;
  }) => {
    const row = unwrap(await sb.from("approval_delegations").insert({
      company_id: data.company_id, delegator_id: userId, delegatee_id: data.delegatee_id,
      entity_type: data.entity_type ?? null, starts_at: data.starts_at ?? new Date().toISOString(),
      ends_at: data.ends_at ?? null, reason: data.reason ?? null,
    }).select("*").single());
    await writeAudit(sb, { category: "erp.approval", action: "delegated", entity_type: "approval_delegation", entity_id: (row as any).id, company_id: data.company_id, after: row });
    return row;
  },
  revoke: async (sb: SB, id: string) => {
    unwrap(await sb.from("approval_delegations").update({ ends_at: new Date().toISOString() }).eq("id", id).select("id"));
    return { ok: true };
  },
  activeFor: async (sb: SB, companyId: string, userId: string) => {
    const nowIso = new Date().toISOString();
    return unwrap(await sb.from("approval_delegations").select("*")
      .eq("company_id", companyId).eq("delegatee_id", userId)
      .lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`));
  },
};

// ---------- Core Dashboard ----------
export const coreDashboard = {
  company: async (sb: SB, companyId: string) => {
    const [prPending, quotesOpen, receiptsRecent, contractsActive] = await Promise.all([
      sb.from("purchase_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "submitted"),
      sb.from("vendor_quotations").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["received", "shortlisted"]),
      sb.from("goods_receipts").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("received_at", new Date(Date.now() - 30 * 864e5).toISOString()),
      sb.from("vendor_contracts").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
    ]);
    return {
      purchase_requests_pending: prPending.count ?? 0,
      quotations_open: quotesOpen.count ?? 0,
      receipts_last_30d: receiptsRecent.count ?? 0,
      contracts_active: contractsActive.count ?? 0,
    };
  },
};
