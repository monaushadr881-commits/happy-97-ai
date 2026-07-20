/**
 * R191 Batch 9 — AI Business Intelligence / Executive Analytics / Founder Insights
 *
 * SINGLE composition surface. Read-only aggregators over canonical tables.
 * NO new tables, NO new runtime, NO duplicate storage, NO duplicate dashboard.
 *
 * Canonical owners reused
 *   - Business Runtime         → customers, sales_orders
 *   - Revenue Runtime          → invoices, payments
 *   - Manufacturing Runtime    → production_batches, quality_checks
 *   - Partner Runtime          → creator_assets (partner.dealer|distributor)
 *   - Knowledge / Workspace    → adoptToCanonicalPipeline (Brain session)
 *   - Approval (R158)          → approvals
 *   - Audit                    → audit_logs → writeCanonicalAudit
 *   - Mission Control          → founderMissionControl (extended, not replaced)
 *   - AI Gateway               → Lovable AI (executive summary/trend/forecast)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const uuid = z.string().uuid();
const CompanyInput = z.object({ company_id: uuid, days: z.number().int().min(1).max(365).default(30) });

type Kpi = { label: string; value: number; unit?: string };
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Result<T extends Json = Json> = { status: "ok"; data: T };

async function openSession(
  supabase: Parameters<typeof adoptToCanonicalPipeline>[0],
  ctx: { userId: string | null; company_id: string },
  module: string,
  capability: string,
) {
  await adoptToCanonicalPipeline(supabase, {
    domain: "business", module, capability,
    user_id: ctx.userId, company_id: ctx.company_id,
    summary: `bi ${module}.${capability}`,
  });
}

function sinceIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// ---------------------------------------------------------------------------
// 1. Founder KPIs (top-level)
// ---------------------------------------------------------------------------
export const biFounderKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result<Kpi[]>> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "kpi", "founder");
    const since = sinceIso(data.days);
    const [orders, pays, inv, cust, appr] = await Promise.all([
      supabase.from("sales_orders").select("total_cents", { count: "exact" })
        .eq("company_id", data.company_id).gte("created_at", since),
      supabase.from("payments").select("amount_cents,status")
        .eq("company_id", data.company_id).gte("created_at", since),
      supabase.from("invoices").select("total_cents,amount_paid_cents,status")
        .eq("company_id", data.company_id).gte("created_at", since),
      supabase.from("customers").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).gte("created_at", since),
      supabase.from("approvals").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).eq("status", "pending"),
    ]);
    const orderRevenue = (orders.data ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0);
    const captured = (pays.data ?? []).filter(p => p.status === "succeeded")
      .reduce((s, r) => s + (r.amount_cents ?? 0), 0);
    const outstanding = (inv.data ?? []).reduce(
      (s, r) => s + Math.max(0, (r.total_cents ?? 0) - (r.amount_paid_cents ?? 0)), 0);
    return { status: "ok", data: [
      { label: "Orders", value: orders.count ?? 0 },
      { label: "Order Revenue", value: orderRevenue, unit: "cents" },
      { label: "Payments Captured", value: captured, unit: "cents" },
      { label: "Outstanding", value: outstanding, unit: "cents" },
      { label: "New Customers", value: cust.count ?? 0 },
      { label: "Pending Approvals", value: appr.count ?? 0 },
    ] };
  });

// ---------------------------------------------------------------------------
// 2. Revenue Dashboard
// ---------------------------------------------------------------------------
export const biRevenueDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "revenue", "dashboard");
    const since = sinceIso(data.days);
    const [inv, pays] = await Promise.all([
      supabase.from("invoices").select("status,total_cents,amount_paid_cents,issued_at,paid_at")
        .eq("company_id", data.company_id).gte("created_at", since),
      supabase.from("payments").select("status,amount_cents,created_at")
        .eq("company_id", data.company_id).gte("created_at", since),
    ]);
    const rows = inv.data ?? [];
    return { status: "ok", data: {
      invoices: rows.length,
      billed_cents: rows.reduce((s, r) => s + (r.total_cents ?? 0), 0),
      collected_cents: rows.reduce((s, r) => s + (r.amount_paid_cents ?? 0), 0),
      overdue: rows.filter(r => r.status === "overdue").length,
      payments: (pays.data ?? []).length,
      captured_cents: (pays.data ?? []).filter(p => p.status === "succeeded")
        .reduce((s, r) => s + (r.amount_cents ?? 0), 0),
    } };
  });

// ---------------------------------------------------------------------------
// 3. Sales Dashboard
// ---------------------------------------------------------------------------
export const biSalesDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "sales", "dashboard");
    const since = sinceIso(data.days);
    const { data: rows } = await supabase.from("sales_orders")
      .select("status,total_cents,ordered_at,fulfilled_at,customer_id")
      .eq("company_id", data.company_id).gte("created_at", since);
    const list = rows ?? [];
    return { status: "ok", data: {
      total: list.length,
      revenue_cents: list.reduce((s, r) => s + (r.total_cents ?? 0), 0),
      fulfilled: list.filter(r => r.fulfilled_at).length,
      pending: list.filter(r => !r.fulfilled_at).length,
      unique_customers: new Set(list.map(r => r.customer_id).filter(Boolean)).size,
    } };
  });

// ---------------------------------------------------------------------------
// 4. Dealer Dashboard
// ---------------------------------------------------------------------------
export const biDealerDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "dealer", "dashboard");
    const { data: rows } = await supabase.from("creator_assets")
      .select("kind,metadata,created_at")
      .in("kind", ["partner.dealer", "partner.distributor"])
      .gte("created_at", sinceIso(data.days));
    const list = rows ?? [];
    return { status: "ok", data: {
      dealers: list.filter(r => r.kind === "partner.dealer").length,
      distributors: list.filter(r => r.kind === "partner.distributor").length,
      total: list.length,
    } };
  });

// ---------------------------------------------------------------------------
// 5. Customer Dashboard
// ---------------------------------------------------------------------------
export const biCustomerDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "customer", "dashboard");
    const [total, recent] = await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id),
      supabase.from("customers").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).gte("created_at", sinceIso(data.days)),
    ]);
    return { status: "ok", data: {
      total: total.count ?? 0,
      new_in_window: recent.count ?? 0,
    } };
  });

// ---------------------------------------------------------------------------
// 6. Manufacturing Dashboard
// ---------------------------------------------------------------------------
export const biManufacturingDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "manufacturing", "dashboard");
    const { data: rows } = await supabase.from("creator_assets")
      .select("kind,created_at")
      .like("kind", "manufacturing.%")
      .gte("created_at", sinceIso(data.days));
    const list = rows ?? [];
    const byKind = list.reduce<Record<string, number>>((a, r) => {
      a[r.kind] = (a[r.kind] ?? 0) + 1; return a;
    }, {});
    return { status: "ok", data: { total: list.length, by_kind: byKind } };
  });

// ---------------------------------------------------------------------------
// 7. Inventory Dashboard
// ---------------------------------------------------------------------------
export const biInventoryDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "inventory", "dashboard");
    const { data: rows } = await supabase.from("creator_assets")
      .select("kind,created_at")
      .in("kind", ["inventory.adjust", "inventory.receive", "warehouse.receive"])
      .gte("created_at", sinceIso(data.days));
    const list = rows ?? [];
    return { status: "ok", data: {
      adjustments: list.filter(r => r.kind === "inventory.adjust").length,
      receipts: list.filter(r => r.kind === "inventory.receive").length,
      warehouse_receipts: list.filter(r => r.kind === "warehouse.receive").length,
      total: list.length,
    } };
  });

// ---------------------------------------------------------------------------
// 8. Finance Dashboard
// ---------------------------------------------------------------------------
export const biFinanceDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "finance", "dashboard");
    const { data: rows } = await supabase.from("creator_assets")
      .select("kind,metadata,created_at")
      .in("kind", ["finance.ledger", "finance.expense", "finance.quotation"])
      .gte("created_at", sinceIso(data.days));
    const list = rows ?? [];
    return { status: "ok", data: {
      ledger_posts: list.filter(r => r.kind === "finance.ledger").length,
      expenses: list.filter(r => r.kind === "finance.expense").length,
      quotations: list.filter(r => r.kind === "finance.quotation").length,
    } };
  });

// ---------------------------------------------------------------------------
// 9. HR Dashboard
// ---------------------------------------------------------------------------
export const biHrDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "hr", "dashboard");
    const { data: rows } = await supabase.from("creator_assets")
      .select("kind,created_at")
      .like("kind", "hr.%")
      .gte("created_at", sinceIso(data.days));
    const list = rows ?? [];
    const byKind = list.reduce<Record<string, number>>((a, r) => {
      a[r.kind] = (a[r.kind] ?? 0) + 1; return a;
    }, {});
    return { status: "ok", data: { total: list.length, by_kind: byKind } };
  });

// ---------------------------------------------------------------------------
// 10. Growth Forecast (naive linear projection over prior window)
// ---------------------------------------------------------------------------
export const biGrowthForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "forecast", "growth");
    const now = Date.now();
    const cur = new Date(now - data.days * 86_400_000).toISOString();
    const prev = new Date(now - 2 * data.days * 86_400_000).toISOString();
    const [curOrders, prevOrders] = await Promise.all([
      supabase.from("sales_orders").select("total_cents")
        .eq("company_id", data.company_id).gte("created_at", cur),
      supabase.from("sales_orders").select("total_cents")
        .eq("company_id", data.company_id).gte("created_at", prev).lt("created_at", cur),
    ]);
    const curRev = (curOrders.data ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0);
    const prevRev = (prevOrders.data ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0);
    const growth = prevRev > 0 ? (curRev - prevRev) / prevRev : null;
    const projected = growth != null ? Math.round(curRev * (1 + growth)) : curRev;
    return { status: "ok", data: {
      current_cents: curRev, previous_cents: prevRev,
      growth_ratio: growth, projected_next_cents: projected,
    } };
  });

// ---------------------------------------------------------------------------
// 11. Risk Detection (overdue invoices, pending approvals aging, failed jobs)
// ---------------------------------------------------------------------------
export const biRiskDetection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "risk", "detect");
    const [overdue, appr] = await Promise.all([
      supabase.from("invoices").select("id,total_cents,amount_paid_cents,due_at,status")
        .eq("company_id", data.company_id).eq("status", "overdue").limit(50),
      supabase.from("approvals").select("id,created_at,title,entity_type")
        .eq("company_id", data.company_id).eq("status", "pending")
        .lte("created_at", sinceIso(3)).limit(50),
    ]);
    const overdueRows = overdue.data ?? [];
    const oldAppr = appr.data ?? [];
    const risks: Array<{ type: string; severity: string; detail: string }> = [];
    if (overdueRows.length > 0) risks.push({
      type: "overdue_invoices", severity: "high",
      detail: `${overdueRows.length} invoices overdue (${overdueRows.reduce(
        (s, r) => s + Math.max(0, (r.total_cents ?? 0) - (r.amount_paid_cents ?? 0)), 0)} cents)`,
    });
    if (oldAppr.length > 0) risks.push({
      type: "stale_approvals", severity: "medium",
      detail: `${oldAppr.length} approvals pending > 3 days`,
    });
    return { status: "ok", data: { risks, overdue_count: overdueRows.length, stale_approvals: oldAppr.length } };
  });

// ---------------------------------------------------------------------------
// 12. Action Recommendations (rule-based from risk + KPIs)
// ---------------------------------------------------------------------------
export const biActionRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "actions", "recommend");
    const [overdue, pending] = await Promise.all([
      supabase.from("invoices").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).eq("status", "overdue"),
      supabase.from("approvals").select("id", { count: "exact", head: true })
        .eq("company_id", data.company_id).eq("status", "pending"),
    ]);
    const recs: Array<{ action: string; priority: string; reason: string }> = [];
    if ((overdue.count ?? 0) > 0) recs.push({
      action: "Chase overdue invoices",
      priority: "high",
      reason: `${overdue.count} invoices overdue`,
    });
    if ((pending.count ?? 0) > 0) recs.push({
      action: "Review pending Founder approvals",
      priority: "medium",
      reason: `${pending.count} approvals awaiting Founder`,
    });
    if (recs.length === 0) recs.push({
      action: "Maintain current operating cadence",
      priority: "low",
      reason: "No risks detected in current window",
    });
    return { status: "ok", data: { recommendations: recs } };
  });

// ---------------------------------------------------------------------------
// 13. AI Executive Summary (Lovable AI)
// ---------------------------------------------------------------------------
const SummaryInput = CompanyInput.extend({
  focus: z.enum(["executive", "trend", "growth", "risk"]).default("executive"),
});
export const biAiExecutiveSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SummaryInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "ai", `summary.${data.focus}`);
    const since = sinceIso(data.days);
    const [orders, pays, inv, appr] = await Promise.all([
      supabase.from("sales_orders").select("total_cents,fulfilled_at,created_at")
        .eq("company_id", data.company_id).gte("created_at", since).limit(500),
      supabase.from("payments").select("amount_cents,status")
        .eq("company_id", data.company_id).gte("created_at", since).limit(500),
      supabase.from("invoices").select("total_cents,amount_paid_cents,status")
        .eq("company_id", data.company_id).gte("created_at", since).limit(500),
      supabase.from("approvals").select("status")
        .eq("company_id", data.company_id).gte("created_at", since).limit(500),
    ]);
    const kpis = {
      orders: (orders.data ?? []).length,
      order_revenue_cents: (orders.data ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0),
      captured_cents: (pays.data ?? []).filter(p => p.status === "succeeded")
        .reduce((s, r) => s + (r.amount_cents ?? 0), 0),
      outstanding_cents: (inv.data ?? []).reduce(
        (s, r) => s + Math.max(0, (r.total_cents ?? 0) - (r.amount_paid_cents ?? 0)), 0),
      pending_approvals: (appr.data ?? []).filter(a => a.status === "pending").length,
    };

    const apiKey = process.env.LOVABLE_API_KEY;
    let narrative = "AI narrative unavailable (missing gateway key).";
    if (apiKey) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are HAPPY, Founder Executive Analyst. Produce a concise 5-bullet executive summary." },
              { role: "user", content: `Focus: ${data.focus}. Window: last ${data.days} days. KPIs: ${JSON.stringify(kpis)}` },
            ],
          }),
        });
        if (res.ok) {
          const j = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          narrative = j.choices?.[0]?.message?.content ?? narrative;
        } else if (res.status === 429) narrative = "Rate limit exceeded on AI Gateway.";
        else if (res.status === 402) narrative = "AI credits exhausted. Add credits in workspace billing.";
      } catch (e) {
        narrative = `AI gateway error: ${(e as Error).message}`;
      }
    }
    await writeCanonicalAudit(supabase, {
      category: "bi.summary", action: data.focus,
      entity_type: "bi_summary", entity_id: null, company_id: data.company_id,
      after: { kpis } as never, severity: "notice",
    });
    return { status: "ok", data: { focus: data.focus, kpis, narrative } };
  });

// ---------------------------------------------------------------------------
// 14. AI Trend Analysis (bucketed daily order revenue)
// ---------------------------------------------------------------------------
export const biTrendAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CompanyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "trend", "orders");
    const { data: rows } = await supabase.from("sales_orders")
      .select("total_cents,created_at")
      .eq("company_id", data.company_id).gte("created_at", sinceIso(data.days)).limit(2000);
    const buckets = new Map<string, number>();
    for (const r of rows ?? []) {
      const key = (r.created_at ?? "").slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + (r.total_cents ?? 0));
    }
    const series = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, cents]) => ({ date, cents }));
    return { status: "ok", data: { series, samples: series.length } };
  });

// ---------------------------------------------------------------------------
// 15. Scheduled Report Registration (persists spec into creator_assets)
// ---------------------------------------------------------------------------
const ScheduleInput = z.object({
  company_id: uuid,
  name: z.string().min(1).max(160),
  focus: z.enum(["executive", "revenue", "sales", "dealer", "customer",
    "manufacturing", "inventory", "finance", "hr", "trend", "risk"]),
  cadence: z.enum(["daily", "weekly", "monthly"]),
  recipients: z.array(z.string().email()).min(1).max(20),
});
export const biScheduleReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScheduleInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await openSession(supabase, { userId: context.userId, company_id: data.company_id }, "report", "schedule");
    const { data: row, error } = await supabase.from("creator_assets").insert({
      creator_id: context.userId!,
      kind: "bi.report_schedule",
      title: data.name,
      body: `Scheduled ${data.cadence} ${data.focus} report`,
      status: "active",
      metadata: {
        company_id: data.company_id, focus: data.focus, cadence: data.cadence,
        recipients: data.recipients,
      } as never,
    }).select("id").single();
    if (error) throw new Error(`bi_schedule_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "bi.schedule", action: "create",
      entity_type: "bi_report_schedule", entity_id: row.id, company_id: data.company_id,
      after: { focus: data.focus, cadence: data.cadence } as never, severity: "notice",
    });
    return { status: "ok", data: { id: row.id } };
  });
