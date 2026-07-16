/** R64.7 — Release analytics. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64 } from "./gate";

export const getPipelineAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ days: z.number().int().min(1).max(180).default(30) }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { data: rows, error } = await sb.from("build_pipeline_runs").select("status,duration_ms,build_kind,queued_at").gte("queued_at", since).limit(5000);
    if (error) throw new Error(error.message);
    const all = (rows ?? []) as any[];
    const total = all.length;
    const ok = all.filter((r) => r.status === "succeeded").length;
    const fail = all.filter((r) => r.status === "failed").length;
    const blocked = all.filter((r) => r.status === "blocked").length;
    const durs = all.map((r) => r.duration_ms).filter((n): n is number => typeof n === "number" && n > 0);
    const avg = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null;
    return {
      window_days: data.days,
      builds_total: total,
      success_rate: total ? ok / total : 0,
      failure_rate: total ? fail / total : 0,
      blocked_rate: total ? blocked / total : 0,
      avg_duration_ms: avg,
    };
  });

export const getReleaseAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ days: z.number().int().min(1).max(365).default(90) }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const [releases, rollbacks, metrics] = await Promise.all([
      sb.from("release_records").select("id,status,channel,created_at").gte("created_at", since).limit(1000),
      sb.from("release_rollbacks").select("id,created_at").gte("created_at", since).limit(1000),
      sb.from("release_store_metrics").select("store,downloads,installs,rating_avg,crash_free_rate,revenue_cents,snapshot_at").gte("snapshot_at", since).limit(2000),
    ]);
    const rel = (releases.data ?? []) as any[];
    const rb = (rollbacks.data ?? []) as any[];
    const met = (metrics.data ?? []) as any[];
    const published = rel.filter((r) => r.status === "published").length;
    return {
      window_days: data.days,
      releases_total: rel.length,
      releases_published: published,
      success_rate: rel.length ? published / rel.length : 0,
      rollback_count: rb.length,
      rollback_rate: rel.length ? rb.length / rel.length : 0,
      store_totals: aggregateStoreMetrics(met),
      per_channel: countBy(rel, "channel"),
    };
  });

export const getDailyMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data, error } = await sb.from("release_pipeline_metrics_daily").select("*").order("day", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return { days: data ?? [] };
  });

function countBy<T extends Record<string, any>>(rows: T[], key: keyof T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r[key])] = (out[String(r[key])] ?? 0) + 1;
  return out;
}

function aggregateStoreMetrics(rows: any[]): Record<string, { downloads: number; installs: number; revenue_cents: number; rating_avg: number | null }> {
  const out: Record<string, { downloads: number; installs: number; revenue_cents: number; rating_avg: number | null; _rc: number }> = {};
  for (const r of rows) {
    const s = String(r.store);
    if (!out[s]) out[s] = { downloads: 0, installs: 0, revenue_cents: 0, rating_avg: null, _rc: 0 };
    out[s].downloads += Number(r.downloads ?? 0);
    out[s].installs += Number(r.installs ?? 0);
    out[s].revenue_cents += Number(r.revenue_cents ?? 0);
    if (typeof r.rating_avg === "number") {
      out[s].rating_avg = ((out[s].rating_avg ?? 0) * out[s]._rc + r.rating_avg) / (out[s]._rc + 1);
      out[s]._rc++;
    }
  }
  const clean: Record<string, { downloads: number; installs: number; revenue_cents: number; rating_avg: number | null }> = {};
  for (const [k, v] of Object.entries(out)) {
    const { _rc, ...rest } = v as any;
    void _rc;
    clean[k] = rest;
  }
  return clean;
}
