/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: MERGE
 * Canonical owner: src/lib/happy-r122/crm-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — Business OS API v1 (server functions)
 *
 * Company-scoped RPCs for the Business Operating System — CRM, Sales,
 * Purchase, Inventory, Warehouse, Manufacturing, HRMS, Finance, Projects,
 * Automation and AI Advisor. Every call is authenticated via
 * `requireSupabaseAuth`; RLS (`is_company_member`, `is_company_admin`)
 * enforces per-company isolation. UI never touches the database directly.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { sanitizePgRestLike } from "@/lib/security/pgrest-sanitize";
import { z } from "zod";

const uuid = z.string().uuid();
const CompanyId = z.object({ company_id: uuid });
const CompanyIdWithLimit = z.object({
  company_id: uuid,
  limit: z.number().int().min(1).max(500).optional(),
});
const CompanyIdWithRange = z.object({
  company_id: uuid,
  days: z.number().int().min(1).max(365).optional(),
});

const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// =================================================================
// COCKPIT — cross-module KPIs
// =================================================================
export const bizCockpit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyId.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const s = context.supabase;
    const cid = data.company_id;
    const head = { count: "exact" as const, head: true };
    const [customers, leads, deals, orders, invoices, expenses, products, suppliers, warehouses, employees, workflows] = await Promise.all([
      s.from("customers").select("id", head).eq("company_id", cid),
      s.from("leads").select("id", head).eq("company_id", cid),
      s.from("deals").select("id", head).eq("company_id", cid),
      s.from("sales_orders").select("id", head).eq("company_id", cid),
      s.from("invoices").select("id", head).eq("company_id", cid),
      s.from("expenses").select("id", head).eq("company_id", cid),
      s.from("products").select("id", head).eq("company_id", cid),
      s.from("suppliers").select("id", head).eq("company_id", cid),
      s.from("warehouses").select("id", head).eq("company_id", cid),
      s.from("employees").select("id", head).eq("company_id", cid),
      s.from("workflows").select("id", head).eq("company_id", cid),
    ]);
    const invSums = await s.from("invoices")
      .select("total_cents, amount_paid_cents, status")
      .eq("company_id", cid).limit(2000);
    let receivable = 0, paid = 0;
    for (const r of (invSums.data ?? []) as Array<{ total_cents: number | null; amount_paid_cents: number | null; status: string | null }>) {
      const total = r.total_cents ?? 0;
      const rec = total - (r.amount_paid_cents ?? 0);
      if (r.status !== "paid" && rec > 0) receivable += rec;
      paid += (r.amount_paid_cents ?? 0);
    }
    return {
      customers: customers.count ?? 0,
      leads: leads.count ?? 0,
      deals: deals.count ?? 0,
      orders: orders.count ?? 0,
      invoices: invoices.count ?? 0,
      expenses: expenses.count ?? 0,
      products: products.count ?? 0,
      suppliers: suppliers.count ?? 0,
      warehouses: warehouses.count ?? 0,
      employees: employees.count ?? 0,
      workflows: workflows.count ?? 0,
      receivable_cents: receivable,
      paid_cents: paid,
    };
  }));

// =================================================================
// Small factory for company-scoped list endpoints
// =================================================================
type Table =
  | "customers" | "leads" | "deals"
  | "products" | "product_categories" | "inventory_items"
  | "warehouses" | "suppliers"
  | "sales_orders" | "purchase_orders"
  | "invoices" | "payments" | "expenses"
  | "employees" | "chart_of_accounts" | "ledger_entries"
  | "workflows" | "tax_rates";

const list = (table: Table, cols: string, orderBy: string, desc = true) =>
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((i: unknown) => CompanyIdWithLimit.parse(i))
    .handler(async ({ data, context }) => guard(async () => {
      const r = await context.supabase
        .from(table)
        .select(cols)
        .eq("company_id", data.company_id)
        .order(orderBy, { ascending: !desc })
        .limit(data.limit ?? 100);
      if (r.error) throw r.error;
      return r.data ?? [];
    }));

// -------- CRM --------
export const bizListCustomers = list("customers",
  "id, code, name, email, phone, status, brand_id, tax_id, created_at",
  "created_at");
export const bizListLeads = list("leads",
  "id, name, email, phone, source, stage, status, score, owner_id, created_at",
  "created_at");
export const bizListDeals = list("deals",
  "id, title, stage, status, amount_cents, currency, probability, expected_close_at, closed_at, customer_id, owner_id, created_at",
  "created_at");

// -------- Sales --------
export const bizListSalesOrders = list("sales_orders",
  "id, number, status, customer_id, warehouse_id, subtotal_cents, tax_cents, total_cents, currency, ordered_at, fulfilled_at, created_at",
  "created_at");
export const bizListInvoices = list("invoices",
  "id, number, status, customer_id, sales_order_id, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, issued_at, due_at, paid_at, created_at",
  "created_at");
export const bizListPayments = list("payments",
  "id, invoice_id, customer_id, amount_cents, currency, provider, provider_ref, status, received_at",
  "received_at");

// -------- Purchase --------
export const bizListSuppliers = list("suppliers",
  "id, code, name, email, phone, status, tax_id, created_at",
  "created_at");
export const bizListPurchaseOrders = list("purchase_orders",
  "id, number, status, supplier_id, warehouse_id, subtotal_cents, tax_cents, total_cents, currency, ordered_at, received_at, created_at",
  "created_at");

// -------- Inventory / Catalog --------
export const bizListProducts = list("products",
  "id, sku, name, description, status, is_service, price_cents, cost_cents, currency, category_id, brand_id, tax_rate_id, created_at",
  "created_at");
export const bizListCategories = list("product_categories",
  "id, name, slug, parent_id, position, status, created_at",
  "position", false);

export const bizListInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyIdWithLimit.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase
      .from("inventory_items")
      .select("id, product_id, warehouse_id, quantity, reserved, reorder_point, updated_at, products:product_id(name, sku), warehouses:warehouse_id(name, code)")
      .eq("company_id", data.company_id)
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// -------- Warehouse --------
export const bizListWarehouses = list("warehouses",
  "id, code, name, address, status, created_at",
  "created_at");

// -------- HRMS --------
export const bizListEmployees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyIdWithLimit.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase
      .from("employees")
      .select("id, employee_code, title, status, department_id, office_id, team_id, manager_id, user_id, hired_on, updated_at")
      .eq("company_id", data.company_id)
      .order("hired_on", { ascending: false })
      .limit(data.limit ?? 200);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// -------- Finance --------
export const bizListAccounts = list("chart_of_accounts",
  "id, code, name, kind, currency, parent_id, is_active, created_at",
  "code", false);
export const bizListExpenses = list("expenses",
  "id, category, vendor, amount_cents, currency, status, spent_on, memo, created_at",
  "spent_on");
export const bizListLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyIdWithLimit.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const r = await context.supabase
      .from("ledger_entries")
      .select("id, account_id, debit_cents, credit_cents, currency, entry_date, memo, reference_type, reference_id, created_at")
      .eq("company_id", data.company_id)
      .order("entry_date", { ascending: false })
      .limit(data.limit ?? 200);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));
export const bizListTaxRates = list("tax_rates",
  "id, code, name, rate_bps, country, region, is_active, created_at",
  "created_at");

// -------- Automation --------
export const bizListWorkflows = list("workflows",
  "id, name, trigger, is_active, steps, created_at, updated_at",
  "updated_at");

export const bizWorkflowRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyIdWithLimit.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const wfs = await context.supabase
      .from("workflows").select("id").eq("company_id", data.company_id).limit(500);
    if (wfs.error) throw wfs.error;
    const ids = (wfs.data ?? []).map((w) => w.id as string);
    if (!ids.length) return [];
    const r = await context.supabase
      .from("workflow_runs")
      .select("id, workflow_id, status, started_at, completed_at, error")
      .in("workflow_id", ids)
      .order("started_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// =================================================================
// ANALYTICS — 30-day series
// =================================================================
export const bizAnalyticsSeries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyIdWithRange.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const days = data.days ?? 30;
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const s = context.supabase;
    const [orders, invoices, expenses] = await Promise.all([
      s.from("sales_orders").select("total_cents, created_at").eq("company_id", data.company_id).gte("created_at", since),
      s.from("invoices").select("total_cents, amount_paid_cents, status, issued_at").eq("company_id", data.company_id).gte("issued_at", since),
      s.from("expenses").select("amount_cents, spent_on").eq("company_id", data.company_id).gte("spent_on", since.slice(0, 10)),
    ]);
    const bucket: Record<string, { orders: number; invoiced: number; collected: number; expenses: number }> = {};
    const key = (d: string) => d.slice(0, 10);
    for (const o of (orders.data ?? []) as Array<{ total_cents: number | null; created_at: string }>) {
      const k = key(o.created_at);
      (bucket[k] ??= { orders: 0, invoiced: 0, collected: 0, expenses: 0 }).orders += o.total_cents ?? 0;
    }
    for (const i of (invoices.data ?? []) as Array<{ total_cents: number | null; amount_paid_cents: number | null; status: string | null; issued_at: string | null }>) {
      if (!i.issued_at) continue;
      const b = (bucket[key(i.issued_at)] ??= { orders: 0, invoiced: 0, collected: 0, expenses: 0 });
      b.invoiced += i.total_cents ?? 0;
      b.collected += i.amount_paid_cents ?? 0;
    }
    for (const e of (expenses.data ?? []) as Array<{ amount_cents: number | null; spent_on: string | null }>) {
      if (!e.spent_on) continue;
      (bucket[key(e.spent_on)] ??= { orders: 0, invoiced: 0, collected: 0, expenses: 0 }).expenses += e.amount_cents ?? 0;
    }
    return Object.entries(bucket)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date < b.date ? -1 : 1);
  }));

// =================================================================
// UNIVERSAL SEARCH
// =================================================================
const SearchInput = z.object({
  company_id: uuid,
  q: z.string().min(1).max(120),
  limit: z.number().int().min(1).max(50).optional(),
});
export const bizUniversalSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SearchInput.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const safe = sanitizePgRestLike(data.q);
    if (!safe) {
      return { customers: [], products: [], invoices: [], orders: [], suppliers: [], employees: [] };
    }
    const q = `%${safe}%`;
    const s = context.supabase;
    const lim = data.limit ?? 8;
    const cid = data.company_id;
    const [customers, products, invoices, orders, suppliers, employees] = await Promise.all([
      s.from("customers").select("id, name, email, code").eq("company_id", cid).or(`name.ilike.${q},email.ilike.${q},code.ilike.${q}`).limit(lim),
      s.from("products").select("id, name, sku").eq("company_id", cid).or(`name.ilike.${q},sku.ilike.${q}`).limit(lim),
      s.from("invoices").select("id, number, total_cents, status").eq("company_id", cid).ilike("number", q).limit(lim),
      s.from("sales_orders").select("id, number, total_cents, status").eq("company_id", cid).ilike("number", q).limit(lim),
      s.from("suppliers").select("id, name, email, code").eq("company_id", cid).or(`name.ilike.${q},email.ilike.${q},code.ilike.${q}`).limit(lim),
      s.from("employees").select("id, employee_code, title").eq("company_id", cid).or(`employee_code.ilike.${q},title.ilike.${q}`).limit(lim),
    ]);
    return {
      customers: customers.data ?? [],
      products: products.data ?? [],
      invoices: invoices.data ?? [],
      orders: orders.data ?? [],
      suppliers: suppliers.data ?? [],
      employees: employees.data ?? [],
    };
  }));

// =================================================================
// AI BUSINESS ADVISOR — derived heuristics from real data.
// Deterministic signals; the AI Gateway (Lovable AI) can be layered
// on top by future modules — this endpoint intentionally has no
// external calls so it is safe, cheap and always available.
// =================================================================
export const bizAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyId.parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const s = context.supabase;
    const cid = data.company_id;
    const [inv, low, overdueInv, deals] = await Promise.all([
      s.from("inventory_items").select("id, product_id, quantity, reorder_point, warehouse_id, products:product_id(name, sku)").eq("company_id", cid).limit(1000),
      s.from("products").select("id", { count: "exact", head: true }).eq("company_id", cid).eq("status", "active"),
      s.from("invoices").select("id, total_cents, amount_paid_cents, due_at, status, customer_id").eq("company_id", cid).neq("status", "paid").lt("due_at", new Date().toISOString()).limit(500),
      s.from("deals").select("id, amount_cents, stage, expected_close_at, probability").eq("company_id", cid).is("closed_at", null).limit(500),
    ]);
    const inventory = (inv.data ?? []) as Array<{ id: string; quantity: number | null; reorder_point: number | null; products: { name: string | null; sku: string | null } | null }>;
    const lowStock = inventory.filter((r) => (r.quantity ?? 0) <= (r.reorder_point ?? 0));
    const overdueTotal = ((overdueInv.data ?? []) as Array<{ total_cents: number | null; amount_paid_cents: number | null }>)
      .reduce((a, r) => a + ((r.total_cents ?? 0) - (r.amount_paid_cents ?? 0)), 0);
    const pipeline = ((deals.data ?? []) as Array<{ amount_cents: number | null; probability: number | null }>)
      .reduce((a, d) => a + Math.round(((d.amount_cents ?? 0) * ((d.probability ?? 50) / 100))), 0);

    const insights: Array<{ level: "info" | "warn" | "risk"; module: string; message: string }> = [];
    if (lowStock.length) insights.push({ level: "warn", module: "Inventory", message: `${lowStock.length} product(s) at or below reorder point.` });
    if (overdueTotal > 0) insights.push({ level: "risk", module: "Finance", message: `Overdue receivables total $${(overdueTotal / 100).toFixed(0)}.` });
    if (pipeline > 0) insights.push({ level: "info", module: "Sales", message: `Weighted deal pipeline: $${(pipeline / 100).toFixed(0)}.` });
    if (!inventory.length && (low.count ?? 0) > 0) insights.push({ level: "info", module: "Inventory", message: "Products exist but no inventory positions recorded — set up warehouses." });
    if (!insights.length) insights.push({ level: "info", module: "Overview", message: "No signals detected. Populate CRM, catalog and orders to unlock advisor insights." });

    return {
      inventory_positions: inventory.length,
      low_stock: lowStock.length,
      low_stock_top: lowStock.slice(0, 8).map((r) => ({ id: r.id, name: r.products?.name ?? "—", sku: r.products?.sku ?? "—", quantity: r.quantity ?? 0, reorder_point: r.reorder_point ?? 0 })),
      overdue_receivables_cents: overdueTotal,
      pipeline_weighted_cents: pipeline,
      insights,
    };
  }));
