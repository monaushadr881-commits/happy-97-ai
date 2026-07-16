/** R64 — daily pipeline metrics rollup cron. */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/release-metrics-rollup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? "";
        if (!process.env.SUPABASE_PUBLISHABLE_KEY || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb: any = supabaseAdmin;
        const today = new Date().toISOString().slice(0, 10);
        const since = new Date(Date.now() - 86400_000).toISOString();
        const { data: runs } = await sb.from("build_pipeline_runs").select("status,duration_ms").gte("queued_at", since).limit(5000);
        const rows = (runs ?? []) as any[];
        const durs = rows.map((r) => r.duration_ms).filter((n): n is number => typeof n === "number" && n > 0);
        const patch = {
          day: today,
          builds_total: rows.length,
          builds_succeeded: rows.filter((r) => r.status === "succeeded").length,
          builds_failed: rows.filter((r) => r.status === "failed").length,
          builds_blocked: rows.filter((r) => r.status === "blocked").length,
          builds_cancelled: rows.filter((r) => r.status === "cancelled").length,
          avg_duration_ms: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null,
        };
        await sb.from("release_pipeline_metrics_daily").upsert(patch);
        return Response.json({ ok: true, day: today, rolled: rows.length });
      },
    },
  },
});
