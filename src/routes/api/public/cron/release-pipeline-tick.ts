/** R64 — pipeline analytics refresh cron. Authenticated via CRON_SHARED_SECRET (R106). */
import { createFileRoute } from "@tanstack/react-router";
import { assertCronAuth } from "@/lib/security/cron-auth";

export const Route = createFileRoute("/api/public/cron/release-pipeline-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = assertCronAuth(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb: any = supabaseAdmin;
        // Timeout builds running for > 60 minutes with no updates.
        const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();
        const { data: stale } = await sb.from("build_pipeline_runs").select("id,started_at").eq("status", "running").lt("started_at", cutoff).limit(100);
        for (const r of (stale ?? []) as any[]) {
          await sb.from("build_pipeline_runs").update({ status: "failed", finished_at: new Date().toISOString(), blocked_reason: "auto-timeout: exceeded 60min" }).eq("id", r.id);
          await sb.from("build_pipeline_events").insert({ run_id: r.id, event_type: "timeout", message: "auto-timeout by pipeline tick" });
        }
        return Response.json({ ok: true, timed_out: (stale ?? []).length });
      },
    },
  },
});
