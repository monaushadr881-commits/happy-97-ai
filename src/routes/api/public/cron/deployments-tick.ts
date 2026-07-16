/**
 * R14 — Deployment queue tick (external cron).
 *
 * Picks up any queued deployments and runs them. Idempotent: `runDeployment`
 * only claims rows still in 'queued' state. Authenticated via
 * CRON_SHARED_SECRET (server-only) — R106.
 */
import { createFileRoute } from "@tanstack/react-router";
import { runDeployment } from "@/lib/deployment/engine";
import { assertCronAuth } from "@/lib/security/cron-auth";

export const Route = createFileRoute("/api/public/cron/deployments-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = assertCronAuth(request);
        if (denied) return denied;
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
