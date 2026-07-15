/**
 * R14 — Deployment queue tick (external cron).
 *
 * Picks up any queued deployments and runs them. Idempotent: `runDeployment`
 * only claims rows still in 'queued' state, so parallel ticks won't
 * double-process. Authenticate with the Supabase anon `apikey` header per
 * schedule-jobs pattern (no custom shared secret needed — `/api/public/*`
 * bypasses edge auth).
 */
import { createFileRoute } from "@tanstack/react-router";
import { runDeployment } from "@/lib/deployment/engine";

export const Route = createFileRoute("/api/public/cron/deployments-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.from("project_deployments")
          .select("id")
          .eq("status", "queued")
          .order("created_at", { ascending: true })
          .limit(10);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        const ids = (data ?? []).map((r) => (r as { id: string }).id);
        const results: Array<{ id: string; status: string | null }> = [];
        for (const id of ids) {
          try {
            const r = await runDeployment(supabaseAdmin, id);
            results.push({ id, status: r?.status ?? null });
          } catch (e) {
            results.push({ id, status: `error:${(e as Error).message.slice(0, 80)}` });
          }
        }
        return Response.json({ processed: results.length, results });
      },
    },
  },
});
