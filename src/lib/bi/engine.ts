/**
 * HAPPY X — R26 Business Intelligence / Analytics engine.
 *
 * Real-data only. Every KPI is computed from live tables:
 *   invoices, payments, subscriptions, customers, leads, deals,
 *   vendor_bills, journal_lines, chart_of_accounts,
 *   inventory_transactions, inventory_lots,
 *   production_orders, production_batches, quality_inspections, machines,
 *   listings, listing_purchases, marketplace_transactions,
 *   project_deployments, ai_sessions, metrics_events, audit_logs, notifications, alert_rules.
 *
 * Facts and AI recommendations are stored separately in `bi_insights`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

type SB = SupabaseClient<any, any, any>;

function unwrap<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw res.error;
  return res.data as T;
}
function num(n: unknown, d = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}
function iso(d: Date): string { return d.toISOString(); }
function startOf(grain: Grain, d = new Date()): Date {
  const x = new Date(d);
  if (grain === "hour") { x.setMinutes(0, 0, 0); return x; }
  if (grain === "day") { x.setHours(0, 0, 0, 0); return x; }
  if (grain === "week") { const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; }
  if (grain === "month") { x.setDate(1); x.setHours(0,0,0,0); return x; }
  if (grain === "quarter") { const q = Math.floor(x.getMonth() / 3) * 3; x.setMonth(q, 1); x.setHours(0,0,0,0); return x; }
  if (grain === "year") { x.setMonth(0, 1); x.setHours(0,0,0,0); return x; }
  return x;
}
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function addMonths(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; }

export type Grain = "hour" | "day" | "week" | "month" | "quarter" | "year" | "all";

async function safeSelect<T = any>(sb: SB, table: string, sel: (s: string) => string = (s) => s): Promise<T[]> {
  try {
    const q = await (sb as any).from(table).select(sel("*"));
    if (q.error) return [];
    return (q.data ?? []) as T[];
  } catch { return []; }
}

/* ------------------------------------------------------------------ */
/* revenue KPIs                                                        */
/* ------------------------------------------------------------------ */

export const revenue = {
  async series(sb: SB, company_id: string, grain: Grain = "month", periods = 12) {
    const to = new Date();
    const from = grain === "day" ? addDays(to, -periods)
               : grain === "week" ? addDays(to, -periods * 7)
               : grain === "year" ? addMonths(to, -periods * 12)
               : addMonths(to, -periods);
    const invs = unwrap(await sb.from("invoices")
      .select("id, total_cents, issued_at, status, customer_id")
      .eq("company_id", company_id)
      .gte("issued_at", iso(from))
      .neq("status", "cancelled")) as any[];
    const bucket = new Map<string, { gross: number; count: number; customers: Set<string> }>();
    for (const inv of invs) {
      const t = startOf(grain, new Date(inv.issued_at ?? inv.created_at ?? Date.now()));
      const key = t.toISOString();
      const b = bucket.get(key) ?? { gross: 0, count: 0, customers: new Set<string>() };
      b.gross += num(inv.total_cents) / 100;
      b.count += 1;
      if (inv.customer_id) b.customers.add(inv.customer_id);
      bucket.set(key, b);
    }
    return Array.from(bucket.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([t, v]) => ({ t, gross: v.gross, invoices: v.count, customers: v.customers.size }));
  },

  async summary(sb: SB, company_id: string) {
    const now = new Date();
    const monthStart = startOf("month", now);
    const prevStart = startOf("month", addMonths(now, -1));
    const yearStart = startOf("year", now);
    const invs = unwrap(await sb.from("invoices")
      .select("total_cents, tax_cents, amount_paid_cents, issued_at, status, customer_id")
      .eq("company_id", company_id)
      .neq("status", "cancelled")) as any[];
    let gross = 0, paid = 0, tax = 0, mtdGross = 0, prevMonthGross = 0, ytd = 0;
    const customers = new Set<string>();
    for (const inv of invs) {
      const t = new Date(inv.issued_at ?? inv.created_at ?? Date.now());
      const g = num(inv.total_cents) / 100;
      gross += g;
      paid += num(inv.amount_paid_cents) / 100;
      tax += num(inv.tax_cents) / 100;
      if (t >= monthStart) mtdGross += g;
      if (t >= prevStart && t < monthStart) prevMonthGross += g;
      if (t >= yearStart) ytd += g;
      if (inv.customer_id) customers.add(inv.customer_id);
    }
    const subs = await safeSelect<any>(sb, "subscriptions", () =>
      "amount_cents, currency, interval, status, company_id"
    );
    const activeSubs = subs.filter((s) => s.company_id === company_id && s.status === "active");
    const mrr = activeSubs.reduce((acc, s) => acc + (s.interval === "year" ? num(s.amount_cents)/12 : num(s.amount_cents)), 0) / 100;
    const arr = mrr * 12;
    const refundsData = await safeSelect<any>(sb, "payments", () => "amount_cents, status, company_id, received_at");
    const refunds = refundsData.filter((p) => p.company_id === company_id && p.status === "refunded")
      .reduce((a, p) => a + num(p.amount_cents), 0) / 100;
    const growthPct = prevMonthGross > 0 ? ((mtdGross - prevMonthGross) / prevMonthGross) * 100 : null;
    return {
      gross_revenue: gross,
      net_revenue: gross - refunds,
      collected_revenue: paid,
      outstanding: gross - paid,
      tax_collected: tax,
      refunds,
      mtd_gross: mtdGross,
      prev_month_gross: prevMonthGross,
      growth_pct: growthPct,
      ytd_gross: ytd,
      mrr,
      arr,
      active_subscriptions: activeSubs.length,
      invoices_count: invs.length,
      customers_count: customers.size,
      revenue_per_customer: customers.size ? gross / customers.size : 0,
    };
  },
};

/* ------------------------------------------------------------------ */
/* customer KPIs                                                       */
/* ------------------------------------------------------------------ */

export const customers = {
  async summary(sb: SB, company_id: string) {
    const [cust, leads, deals] = await Promise.all([
      safeSelect<any>(sb, "customers"),
      safeSelect<any>(sb, "leads"),
      safeSelect<any>(sb, "deals"),
    ]);
    const cScoped = cust.filter((c) => c.company_id === company_id);
    const lScoped = leads.filter((l) => l.company_id === company_id);
    const dScoped = deals.filter((d) => d.company_id === company_id);
    const won = dScoped.filter((d) => d.stage === "won" || d.status === "won").length;
    const lost = dScoped.filter((d) => d.stage === "lost" || d.status === "lost").length;
    const converted = lScoped.filter((l) => l.status === "converted" || l.converted_at).length;
    const invs = unwrap(await sb.from("invoices").select("customer_id, total_cents").eq("company_id", company_id)) as any[];
    const perCustomer = new Map<string, { total: number; count: number }>();
    for (const inv of invs) {
      if (!inv.customer_id) continue;
      const p = perCustomer.get(inv.customer_id) ?? { total: 0, count: 0 };
      p.total += num(inv.total_cents) / 100;
      p.count += 1;
      perCustomer.set(inv.customer_id, p);
    }
    const totalRev = Array.from(perCustomer.values()).reduce((a, v) => a + v.total, 0);
    const aov = invs.length ? totalRev / invs.length : 0;
    const clv = perCustomer.size ? totalRev / perCustomer.size : 0;
    const repeat = Array.from(perCustomer.values()).filter((v) => v.count > 1).length;
    return {
      customers_total: cScoped.length,
      leads_total: lScoped.length,
      leads_converted: converted,
      lead_conversion_pct: lScoped.length ? (converted / lScoped.length) * 100 : 0,
      deals_total: dScoped.length,
      deals_won: won,
      deals_lost: lost,
      win_rate_pct: won + lost > 0 ? (won / (won + lost)) * 100 : 0,
      avg_order_value: aov,
      customer_lifetime_value: clv,
      repeat_customers: repeat,
      repeat_rate_pct: perCustomer.size ? (repeat / perCustomer.size) * 100 : 0,
    };
  },
};

/* ------------------------------------------------------------------ */
/* finance KPIs                                                        */
/* ------------------------------------------------------------------ */

export const finance = {
  async summary(sb: SB, company_id: string) {
    const bills = unwrap(await sb.from("vendor_bills")
      .select("total_cents, amount_paid_cents, status, due_at").eq("company_id", company_id)) as any[];
    const invs = unwrap(await sb.from("invoices")
      .select("total_cents, amount_paid_cents, status, due_at").eq("company_id", company_id).neq("status", "cancelled")) as any[];
    const journals = unwrap(await sb.from("journal_lines")
      .select("debit_cents, credit_cents, account_id, entry_id, journal_entries!inner(company_id, status)")
      .eq("journal_entries.company_id", company_id)
      .eq("journal_entries.status", "posted")) as any[];
    const expenses = journals.reduce((a, l) => a + num(l.debit_cents), 0) / 100;
    const income = journals.reduce((a, l) => a + num(l.credit_cents), 0) / 100;
    const revenue = invs.reduce((a, i) => a + num(i.total_cents), 0) / 100;
    const collected = invs.reduce((a, i) => a + num(i.amount_paid_cents), 0) / 100;
    const receivables = revenue - collected;
    const vendorTotal = bills.reduce((a, b) => a + num(b.total_cents), 0) / 100;
    const vendorPaid = bills.reduce((a, b) => a + num(b.amount_paid_cents), 0) / 100;
    const payables = vendorTotal - vendorPaid;
    const banks = await safeSelect<any>(sb, "bank_accounts");
    const cash = banks.filter((b) => b.company_id === company_id).reduce((a, b) => a + num(b.balance_cents), 0) / 100;
    return {
      revenue, expenses, net_profit: revenue - expenses, income_recorded: income,
      cash_balance: cash, receivables, payables,
      outstanding_invoices: invs.filter((i) => i.status !== "paid").length,
      overdue_invoices: invs.filter((i) => i.due_at && new Date(i.due_at) < new Date() && i.status !== "paid").length,
      financial_health_score: Math.max(0, Math.min(100, Math.round(50 + (cash > payables ? 25 : -25) + (revenue > expenses ? 25 : -25)))),
    };
  },
};

/* ------------------------------------------------------------------ */
/* marketplace KPIs                                                    */
/* ------------------------------------------------------------------ */

export const marketplace = {
  async summary(sb: SB, _company_id: string) {
    const [listings, purchases, reviews, downloads] = await Promise.all([
      safeSelect<any>(sb, "listings"),
      safeSelect<any>(sb, "listing_purchases"),
      safeSelect<any>(sb, "listing_reviews"),
      safeSelect<any>(sb, "listing_downloads"),
    ]);
    const revenue = purchases.reduce((a, p) => a + num(p.amount_cents), 0) / 100;
    const ratingSum = reviews.reduce((a, r) => a + num(r.rating), 0);
    const perListing = new Map<string, { revenue: number; count: number }>();
    for (const p of purchases) {
      const v = perListing.get(p.listing_id) ?? { revenue: 0, count: 0 };
      v.revenue += num(p.amount_cents) / 100; v.count += 1;
      perListing.set(p.listing_id, v);
    }
    const top = Array.from(perListing.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
      .map(([listing_id, v]) => ({ listing_id, ...v }));
    return {
      listings_total: listings.length,
      listings_published: listings.filter((l) => l.status === "published").length,
      purchases_total: purchases.length,
      downloads_total: downloads.length,
      revenue,
      reviews_total: reviews.length,
      avg_rating: reviews.length ? ratingSum / reviews.length : 0,
      creators_active: new Set(listings.map((l) => l.creator_id).filter(Boolean)).size,
      top_listings: top,
    };
  },
};

/* ------------------------------------------------------------------ */
/* builder / deployment KPIs                                           */
/* ------------------------------------------------------------------ */

export const builder = {
  async summary(sb: SB, _company_id: string) {
    const deps = await safeSelect<any>(sb, "project_deployments");
    const domains = await safeSelect<any>(sb, "project_domains");
    const success = deps.filter((d) => d.status === "succeeded" || d.status === "deployed" || d.status === "live").length;
    const failed = deps.filter((d) => d.status === "failed" || d.status === "error").length;
    const durations = deps.map((d) => num(d.duration_ms)).filter((n) => n > 0);
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return {
      deployments_total: deps.length,
      deployments_succeeded: success,
      deployments_failed: failed,
      deployments_success_rate_pct: deps.length ? (success / deps.length) * 100 : 0,
      avg_build_duration_ms: avg,
      domains_total: domains.length,
      domains_live: domains.filter((d) => d.status === "verified" || d.status === "live").length,
    };
  },
};

/* ------------------------------------------------------------------ */
/* manufacturing KPIs                                                  */
/* ------------------------------------------------------------------ */

export const manufacturing = {
  async summary(sb: SB, company_id: string) {
    const [orders, batches, quality, machines] = await Promise.all([
      safeSelect<any>(sb, "production_orders"),
      safeSelect<any>(sb, "production_batches"),
      safeSelect<any>(sb, "quality_inspections"),
      safeSelect<any>(sb, "machines"),
    ]);
    const oS = orders.filter((o) => o.company_id === company_id);
    const bS = batches.filter((b) => b.company_id === company_id);
    const qS = quality.filter((q) => q.company_id === company_id);
    const mS = machines.filter((m) => m.company_id === company_id);
    const passed = qS.filter((q) => q.status === "passed").length;
    const output = bS.reduce((a, b) => a + num(b.output_qty ?? b.quantity_produced), 0);
    const rejected = bS.reduce((a, b) => a + num(b.rejected_qty), 0);
    const running = mS.filter((m) => m.status === "running").length;
    return {
      production_orders_total: oS.length,
      production_orders_active: oS.filter((o) => ["scheduled","in_progress","running"].includes(o.status)).length,
      batches_total: bS.length,
      output_units: output,
      rejected_units: rejected,
      quality_pass_rate_pct: qS.length ? (passed / qS.length) * 100 : 0,
      machines_total: mS.length,
      machines_running: running,
      machine_utilization_pct: mS.length ? (running / mS.length) * 100 : 0,
    };
  },
};

/* ------------------------------------------------------------------ */
/* warehouse KPIs                                                      */
/* ------------------------------------------------------------------ */

export const warehouse = {
  async summary(sb: SB, company_id: string) {
    const [txns, lots, reservations, transfers, thresholds] = await Promise.all([
      safeSelect<any>(sb, "inventory_transactions"),
      safeSelect<any>(sb, "inventory_lots"),
      safeSelect<any>(sb, "stock_reservations"),
      safeSelect<any>(sb, "stock_transfers"),
      safeSelect<any>(sb, "inventory_thresholds"),
    ]);
    const scope = <T extends { company_id?: string }>(rows: T[]) => rows.filter((r) => r.company_id === company_id);
    const tS = scope(txns), lS = scope(lots), rS = scope(reservations), trS = scope(transfers), thS = scope(thresholds);
    const stockValueCents = lS.reduce((a, l: any) => a + num(l.qty_available) * num(l.unit_cost_cents), 0);
    const now = new Date();
    const nearExpiry = lS.filter((l: any) => l.expiry_at && new Date(l.expiry_at) > now && new Date(l.expiry_at) < addDays(now, 30)).length;
    const expired = lS.filter((l: any) => l.expiry_at && new Date(l.expiry_at) <= now).length;
    const lowStock = thS.filter((t: any) => {
      const totalQty = lS.filter((l: any) => l.item_id === t.item_id).reduce((a, l: any) => a + num(l.qty_available), 0);
      return totalQty < num(t.reorder_level);
    }).length;
    return {
      lots_total: lS.length,
      transactions_total: tS.length,
      receiving_last_30d: tS.filter((t: any) => t.txn_type === "receipt" && new Date(t.created_at) > addDays(now, -30)).length,
      dispatch_last_30d: tS.filter((t: any) => t.txn_type === "issue" && new Date(t.created_at) > addDays(now, -30)).length,
      transfers_open: trS.filter((t: any) => ["draft","in_transit","dispatched"].includes(t.status)).length,
      reservations_active: rS.filter((r: any) => r.status === "active").length,
      stock_value: stockValueCents / 100,
      near_expiry_lots: nearExpiry,
      expired_lots: expired,
      low_stock_items: lowStock,
    };
  },
};

/* ------------------------------------------------------------------ */
/* system KPIs                                                         */
/* ------------------------------------------------------------------ */

export const system = {
  async summary(sb: SB, company_id: string) {
    const [metrics, notifs, alerts, audits, aiSessions] = await Promise.all([
      safeSelect<any>(sb, "metrics_events"),
      safeSelect<any>(sb, "notifications"),
      safeSelect<any>(sb, "alert_rules"),
      safeSelect<any>(sb, "audit_logs"),
      safeSelect<any>(sb, "ai_sessions"),
    ]);
    const now = new Date();
    const last24 = addDays(now, -1);
    const scope = <T extends { company_id?: string }>(rows: T[]) => rows.filter((r) => !r.company_id || r.company_id === company_id);
    const auditsS = scope(audits);
    const errors = auditsS.filter((a: any) => a.severity === "error" || a.severity === "critical").length;
    return {
      metrics_events_total: metrics.length,
      notifications_pending: notifs.filter((n: any) => n.status === "pending").length,
      alert_rules_active: alerts.filter((a: any) => a.enabled ?? a.is_active).length,
      audit_events_24h: auditsS.filter((a: any) => new Date(a.created_at) > last24).length,
      errors_24h: errors,
      ai_sessions_24h: aiSessions.filter((s: any) => new Date(s.created_at) > last24).length,
    };
  },
};

/* ------------------------------------------------------------------ */
/* founder command center                                              */
/* ------------------------------------------------------------------ */

export const founder = {
  async overview(sb: SB, company_id: string) {
    const [rev, cust, fin, mkt, bld, mfg, whs, sys] = await Promise.all([
      revenue.summary(sb, company_id),
      customers.summary(sb, company_id),
      finance.summary(sb, company_id),
      marketplace.summary(sb, company_id),
      builder.summary(sb, company_id),
      manufacturing.summary(sb, company_id),
      warehouse.summary(sb, company_id),
      system.summary(sb, company_id),
    ]);
    const health = Math.round((
      (rev.growth_pct != null ? Math.max(0, Math.min(100, 50 + rev.growth_pct)) : 50) * 0.25 +
      fin.financial_health_score * 0.25 +
      (bld.deployments_success_rate_pct || 50) * 0.15 +
      (mfg.quality_pass_rate_pct || 50) * 0.15 +
      Math.max(0, 100 - whs.expired_lots * 2) * 0.10 +
      Math.max(0, 100 - sys.errors_24h * 5) * 0.10
    ));
    return {
      generated_at: new Date().toISOString(),
      business_health_score: Math.max(0, Math.min(100, health)),
      revenue: rev, customers: cust, finance: fin, marketplace: mkt,
      builder: bld, manufacturing: mfg, warehouse: whs, system: sys,
    };
  },
};

/* ------------------------------------------------------------------ */
/* snapshots (cache) and reports                                       */
/* ------------------------------------------------------------------ */

export const snapshots = {
  async upsert(sb: SB, company_id: string, scope: string, metric_key: string,
               grain: Grain, period_start: string, period_end: string,
               value_numeric: number | null, value_json: Record<string, unknown> = {}) {
    const res = await sb.from("bi_snapshots").upsert({
      company_id, scope, metric_key, period_grain: grain,
      period_start, period_end, value_numeric, value_json,
      computed_at: new Date().toISOString(),
    }, { onConflict: "company_id,scope,metric_key,period_grain,period_start" }).select().single();
    return unwrap(res);
  },
  async list(sb: SB, company_id: string, scope?: string, metric_key?: string, limit = 200) {
    let q: any = sb.from("bi_snapshots").select("*").eq("company_id", company_id)
      .order("period_start", { ascending: false }).limit(limit);
    if (scope) q = q.eq("scope", scope);
    if (metric_key) q = q.eq("metric_key", metric_key);
    return unwrap(await q);
  },
  async captureFounder(sb: SB, company_id: string) {
    const now = new Date();
    const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
    const dayStart = startOf("day", now);
    const overview = await founder.overview(sb, company_id);
    const rows: Array<[string, string, number | null]> = [
      ["revenue", "gross", overview.revenue.gross_revenue],
      ["revenue", "mrr", overview.revenue.mrr],
      ["revenue", "arr", overview.revenue.arr],
      ["finance", "cash", overview.finance.cash_balance],
      ["finance", "receivables", overview.finance.receivables],
      ["finance", "payables", overview.finance.payables],
      ["customers", "total", overview.customers.customers_total],
      ["mfg", "output", overview.manufacturing.output_units],
      ["wms", "stock_value", overview.warehouse.stock_value],
      ["builder", "deployments_success_rate", overview.builder.deployments_success_rate_pct],
      ["founder", "health", overview.business_health_score],
    ];
    for (const [scope, key, v] of rows) {
      await snapshots.upsert(sb, company_id, scope, key, "day", dayStart.toISOString(), dayEnd.toISOString(), v);
    }
    return { captured: rows.length, at: now.toISOString() };
  },
};

/* ------------------------------------------------------------------ */
/* report engine                                                       */
/* ------------------------------------------------------------------ */

export type ReportSpec = { scope: string; grain?: Grain; periods?: number };

export const reports = {
  async definitions(sb: SB, company_id: string) {
    return unwrap(await sb.from("bi_report_definitions").select("*").eq("company_id", company_id).order("created_at")) as any[];
  },
  async saveDefinition(sb: SB, company_id: string, userId: string, def: {
    code: string; name: string; description?: string; category?: string;
    query_spec?: Record<string, unknown>; visualization?: Record<string, unknown>;
    schedule?: string | null; delivery?: Record<string, unknown>;
  }) {
    const res = await sb.from("bi_report_definitions").upsert({
      company_id, created_by: userId, category: def.category ?? "general",
      code: def.code, name: def.name, description: def.description,
      query_spec: def.query_spec ?? {}, visualization: def.visualization ?? {},
      schedule: def.schedule ?? null, delivery: def.delivery ?? {},
    }, { onConflict: "company_id,code" }).select().single();
    return unwrap(res);
  },

  async run(sb: SB, company_id: string, userId: string, code: string, spec: ReportSpec, format = "json") {
    const started = Date.now();
    let output: Record<string, unknown> = {};
    let status: "succeeded" | "failed" = "succeeded";
    let err: string | undefined;
    try {
      switch (spec.scope) {
        case "revenue":
          output = {
            summary: await revenue.summary(sb, company_id),
            series: await revenue.series(sb, company_id, spec.grain ?? "month", spec.periods ?? 12),
          };
          break;
        case "customers": output = await customers.summary(sb, company_id); break;
        case "finance": output = await finance.summary(sb, company_id); break;
        case "marketplace": output = await marketplace.summary(sb, company_id); break;
        case "builder": output = await builder.summary(sb, company_id); break;
        case "manufacturing": output = await manufacturing.summary(sb, company_id); break;
        case "warehouse": output = await warehouse.summary(sb, company_id); break;
        case "system": output = await system.summary(sb, company_id); break;
        case "founder":
        default: output = await founder.overview(sb, company_id); break;
      }
    } catch (e: any) {
      status = "failed"; err = String(e?.message ?? e);
    }
    const row = await sb.from("bi_report_runs").insert({
      company_id, code, format, status, error: err,
      requested_by: userId, output,
      duration_ms: Date.now() - started,
    }).select().single();
    return unwrap(row);
  },

  async history(sb: SB, company_id: string, code?: string, limit = 50) {
    let q: any = sb.from("bi_report_runs").select("id, code, status, format, duration_ms, created_at, error")
      .eq("company_id", company_id).order("created_at", { ascending: false }).limit(limit);
    if (code) q = q.eq("code", code);
    return unwrap(await q);
  },

  toCSV(rows: Array<Record<string, unknown>>): string {
    if (!rows.length) return "";
    const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    const esc = (v: unknown) => {
      if (v == null) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  },
};

/* ------------------------------------------------------------------ */
/* forecast engine — real historical data only                         */
/* ------------------------------------------------------------------ */

export const forecast = {
  linear(points: Array<{ t: string; v: number }>, horizon: number): Array<{ t: string; v: number }> {
    if (points.length < 2) return [];
    const xs = points.map((_, i) => i);
    const ys = points.map((p) => p.v);
    const n = xs.length;
    const sx = xs.reduce((a, b) => a + b, 0);
    const sy = ys.reduce((a, b) => a + b, 0);
    const sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sxx = xs.reduce((a, b) => a + b * b, 0);
    const denom = n * sxx - sx * sx;
    const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;
    const last = new Date(points[points.length - 1].t);
    const stepMs = points.length > 1
      ? (new Date(points[points.length - 1].t).getTime() - new Date(points[0].t).getTime()) / (points.length - 1)
      : 24 * 3600 * 1000;
    const out: Array<{ t: string; v: number }> = [];
    for (let i = 1; i <= horizon; i++) {
      const t = new Date(last.getTime() + i * stepMs);
      out.push({ t: t.toISOString(), v: Math.max(0, intercept + slope * (n - 1 + i)) });
    }
    return out;
  },

  async revenueForecast(sb: SB, company_id: string, userId: string, horizonMonths = 6) {
    const series = await revenue.series(sb, company_id, "month", 12);
    const hist = series.map((s) => ({ t: s.t, v: s.gross }));
    if (hist.length < 2) {
      const row = await sb.from("bi_forecasts").insert({
        company_id, scope: "revenue", metric_key: "gross", method: "linear",
        horizon_days: horizonMonths * 30, generated_by: userId,
        history_from: hist[0]?.t ?? new Date().toISOString(),
        history_to: hist[hist.length - 1]?.t ?? new Date().toISOString(),
        history_points: hist, forecast_points: [],
        confidence: 0,
      }).select().single();
      return unwrap(row);
    }
    const points = forecast.linear(hist, horizonMonths);
    // Confidence = 1 - normalized MAE / mean
    const mean = hist.reduce((a, p) => a + p.v, 0) / hist.length;
    const fitted = forecast.linear(hist.slice(0, -1), 1);
    const mae = fitted.length ? Math.abs(fitted[0].v - hist[hist.length - 1].v) : 0;
    const confidence = mean > 0 ? Math.max(0, Math.min(1, 1 - mae / mean)) : 0;
    const row = await sb.from("bi_forecasts").insert({
      company_id, scope: "revenue", metric_key: "gross", method: "linear",
      horizon_days: horizonMonths * 30, generated_by: userId,
      history_from: hist[0].t, history_to: hist[hist.length - 1].t,
      history_points: hist, forecast_points: points,
      confidence,
    }).select().single();
    return unwrap(row);
  },

  async list(sb: SB, company_id: string, scope?: string, limit = 50) {
    let q: any = sb.from("bi_forecasts").select("*").eq("company_id", company_id)
      .order("created_at", { ascending: false }).limit(limit);
    if (scope) q = q.eq("scope", scope);
    return unwrap(await q);
  },
};

/* ------------------------------------------------------------------ */
/* insight engine — facts vs recommendations                           */
/* ------------------------------------------------------------------ */

export const insights = {
  async generateFounder(sb: SB, company_id: string) {
    const o = await founder.overview(sb, company_id);
    const facts: Array<{ label: string; value: number | string; unit?: string }> = [
      { label: "Gross revenue (all time)", value: Math.round(o.revenue.gross_revenue), unit: "currency" },
      { label: "MTD revenue", value: Math.round(o.revenue.mtd_gross), unit: "currency" },
      { label: "MoM growth", value: o.revenue.growth_pct != null ? `${o.revenue.growth_pct.toFixed(2)}%` : "n/a" },
      { label: "Cash balance", value: Math.round(o.finance.cash_balance), unit: "currency" },
      { label: "Receivables", value: Math.round(o.finance.receivables), unit: "currency" },
      { label: "Payables", value: Math.round(o.finance.payables), unit: "currency" },
      { label: "Business health", value: o.business_health_score, unit: "score" },
      { label: "Quality pass rate", value: `${o.manufacturing.quality_pass_rate_pct.toFixed(1)}%` },
      { label: "Deployment success rate", value: `${o.builder.deployments_success_rate_pct.toFixed(1)}%` },
      { label: "Stock value", value: Math.round(o.warehouse.stock_value), unit: "currency" },
      { label: "Errors (24h)", value: o.system.errors_24h },
    ];
    const recommendations: Array<{ title: string; rationale: string; priority: "low" | "medium" | "high" }> = [];
    if (o.revenue.growth_pct != null && o.revenue.growth_pct < 0) {
      recommendations.push({ title: "Revenue is contracting month-over-month",
        rationale: `MTD gross ${o.revenue.mtd_gross.toFixed(0)} vs prev ${o.revenue.prev_month_gross.toFixed(0)}. Investigate CRM funnel, marketplace top listings, and expiring subscriptions.`,
        priority: "high" });
    }
    if (o.finance.cash_balance < o.finance.payables) {
      recommendations.push({ title: "Cash below payables",
        rationale: `Cash ${o.finance.cash_balance.toFixed(0)} < payables ${o.finance.payables.toFixed(0)}. Prioritize AR collections or defer vendor bills where terms allow.`,
        priority: "high" });
    }
    if (o.finance.overdue_invoices > 0) {
      recommendations.push({ title: `${o.finance.overdue_invoices} overdue invoices`,
        rationale: "Send collection reminders and enable late-fee policies in Finance.", priority: "medium" });
    }
    if (o.warehouse.near_expiry_lots > 0 || o.warehouse.expired_lots > 0) {
      recommendations.push({ title: `${o.warehouse.near_expiry_lots} lots near expiry, ${o.warehouse.expired_lots} expired`,
        rationale: "Trigger clearance pricing or dispose expired inventory to protect valuation.", priority: "medium" });
    }
    if (o.warehouse.low_stock_items > 0) {
      recommendations.push({ title: `${o.warehouse.low_stock_items} items below reorder level`,
        rationale: "Generate purchase requests from WMS thresholds.", priority: "medium" });
    }
    if (o.builder.deployments_failed > 0 && o.builder.deployments_success_rate_pct < 90) {
      recommendations.push({ title: "Deployment reliability below 90%",
        rationale: `Success rate ${o.builder.deployments_success_rate_pct.toFixed(1)}%. Review CI logs and rollback frequency.`, priority: "medium" });
    }
    if (o.manufacturing.quality_pass_rate_pct > 0 && o.manufacturing.quality_pass_rate_pct < 90) {
      recommendations.push({ title: "Quality pass rate below 90%",
        rationale: "Route recent failing batches through QA and audit SOP compliance.", priority: "medium" });
    }
    if (recommendations.length === 0) {
      recommendations.push({ title: "All monitored KPIs within healthy bounds",
        rationale: "Continue current cadence and monitor daily snapshots.", priority: "low" });
    }
    const row = await sb.from("bi_insights").insert({
      company_id, scope: "founder", kind: "summary",
      title: `Founder brief — health ${o.business_health_score}`,
      facts, recommendations, source: "engine",
      period_start: new Date(Date.now() - 30 * 86400_000).toISOString(),
      period_end: new Date().toISOString(),
      severity: o.business_health_score < 40 ? "critical" : o.business_health_score < 60 ? "warning" : "info",
    }).select().single();
    return unwrap(row);
  },

  async list(sb: SB, company_id: string, scope?: string, limit = 50) {
    let q: any = sb.from("bi_insights").select("*").eq("company_id", company_id)
      .order("created_at", { ascending: false }).limit(limit);
    if (scope) q = q.eq("scope", scope);
    return unwrap(await q);
  },
};

/* ------------------------------------------------------------------ */
/* alert engine — evaluate rules against real KPIs                     */
/* ------------------------------------------------------------------ */

export const alerts = {
  async evaluate(sb: SB, company_id: string) {
    const rulesRes = unwrap(await sb.from("alert_rules").select("*").eq("company_id", company_id)) as any[];
    const active = rulesRes.filter((r) => r.enabled ?? r.is_active ?? true);
    if (active.length === 0) return { evaluated: 0, triggered: 0, events: [] };
    const [rev, fin, whs, mfg, bld] = await Promise.all([
      revenue.summary(sb, company_id),
      finance.summary(sb, company_id),
      warehouse.summary(sb, company_id),
      manufacturing.summary(sb, company_id),
      builder.summary(sb, company_id),
    ]);
    const kpiMap: Record<string, number> = {
      "revenue.mtd": rev.mtd_gross,
      "revenue.growth_pct": rev.growth_pct ?? 0,
      "finance.cash": fin.cash_balance,
      "finance.payables": fin.payables,
      "finance.receivables": fin.receivables,
      "finance.overdue_invoices": fin.overdue_invoices,
      "wms.low_stock_items": whs.low_stock_items,
      "wms.expired_lots": whs.expired_lots,
      "wms.near_expiry_lots": whs.near_expiry_lots,
      "mfg.quality_pass_rate_pct": mfg.quality_pass_rate_pct,
      "builder.deployments_failed": bld.deployments_failed,
    };
    const cmp = (op: string, v: number, t: number) => {
      switch (op) {
        case "lt": case "<": return v < t;
        case "lte": case "<=": return v <= t;
        case "gt": case ">": return v > t;
        case "gte": case ">=": return v >= t;
        case "eq": case "==": return v === t;
        default: return false;
      }
    };
    const events: any[] = [];
    for (const r of active) {
      const key = r.metric_key ?? r.metric ?? r.metricPath;
      if (!key || !(key in kpiMap)) continue;
      const observed = kpiMap[key];
      const threshold = num(r.threshold ?? r.threshold_value);
      const operator = String(r.operator ?? r.comparator ?? "lt");
      if (!cmp(operator, observed, threshold)) continue;
      const ins = await sb.from("bi_alert_events").insert({
        company_id, rule_id: r.id, scope: r.scope ?? "system",
        metric_key: key, severity: r.severity ?? "warning",
        observed_value: observed, threshold_value: threshold,
        message: r.message ?? `${key} ${operator} ${threshold} (observed ${observed})`,
        payload: { rule: r.name ?? r.code ?? r.id },
      }).select().single();
      events.push(unwrap(ins));
    }
    return { evaluated: active.length, triggered: events.length, events };
  },

  async list(sb: SB, company_id: string, limit = 100) {
    return unwrap(await sb.from("bi_alert_events").select("*").eq("company_id", company_id)
      .order("triggered_at", { ascending: false }).limit(limit)) as any[];
  },

  async acknowledge(sb: SB, id: string, userId: string) {
    const res = await sb.from("bi_alert_events").update({
      acknowledged_at: new Date().toISOString(), acknowledged_by: userId,
    }).eq("id", id).select().single();
    return unwrap(res);
  },
};

/* ------------------------------------------------------------------ */
/* search — cross-domain lookup                                        */
/* ------------------------------------------------------------------ */

export const search = {
  async run(sb: SB, company_id: string, term: string, limit = 20) {
    const q = `%${term.replace(/[%_]/g, "\\$&")}%`;
    const [invoices, customers, deals, listings, products, deployments, reports] = await Promise.all([
      sb.from("invoices").select("id, number, total_cents, status").eq("company_id", company_id).ilike("number", q).limit(limit).then((r: any) => r.data ?? []),
      sb.from("customers").select("id, name, email").eq("company_id", company_id).ilike("name", q).limit(limit).then((r: any) => r.data ?? []),
      sb.from("deals").select("id, name, value_cents, stage").eq("company_id", company_id).ilike("name", q).limit(limit).then((r: any) => r.data ?? []),
      sb.from("listings").select("id, title, status").ilike("title", q).limit(limit).then((r: any) => r.data ?? []),
      sb.from("products").select("id, name, sku").eq("company_id", company_id).ilike("name", q).limit(limit).then((r: any) => r.data ?? []),
      sb.from("project_deployments").select("id, project_id, status, created_at").ilike("id", q).limit(limit).then((r: any) => r.data ?? []),
      sb.from("bi_report_definitions").select("id, code, name").eq("company_id", company_id).ilike("name", q).limit(limit).then((r: any) => r.data ?? []),
    ]);
    return { invoices, customers, deals, listings, products, deployments, reports };
  },
};
