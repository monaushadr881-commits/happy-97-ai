/** R64.1 — Release dashboard aggregation. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64 } from "./gate";
import { monitorAllStores } from "./store-monitors";

export const getReleaseDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;

    const [releases, artifacts, builds, rollouts, checks, metricsDaily] = await Promise.all([
      sb.from("release_records").select("id,version,channel,status,created_at").order("created_at", { ascending: false }).limit(20),
      sb.from("release_artifact_registry").select("id,kind,validation_status,release_id,created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("build_pipeline_runs").select("id,platform_code,status,priority,queued_at,started_at,finished_at,duration_ms,blocked_reason").order("queued_at", { ascending: false }).limit(50),
      sb.from("release_rollouts").select("id,release_id,store,current_percent,target_percent,state,updated_at").order("updated_at", { ascending: false }).limit(50),
      sb.from("release_automation_checks").select("id,release_id,check_kind,status,checked_at").order("checked_at", { ascending: false }).limit(50),
      sb.from("release_pipeline_metrics_daily").select("*").order("day", { ascending: false }).limit(30),
    ]);

    const list = (releases.data ?? []) as any[];
    const current = list.find((r) => r.status === "published") ?? list[0] ?? null;
    const latestStable = list.find((r) => r.channel === "stable" && r.status === "published") ?? null;
    const drafts = list.filter((r) => r.status === "draft");
    const publishingQueue = list.filter((r) => ["queued", "publishing"].includes(r.status));

    return {
      generated_at: new Date().toISOString(),
      widgets: {
        current_release: current,
        latest_stable: latestStable,
        drafts_count: drafts.length,
        publishing_queue_count: publishingQueue.length,
        artifacts_count: (artifacts.data ?? []).length,
        builds_by_status: countBy(builds.data ?? [], "status"),
        rollout_states: countBy(rollouts.data ?? [], "state"),
        recent_checks: (checks.data ?? []).slice(0, 10),
      },
      pipeline: {
        recent_builds: builds.data ?? [],
        metrics_daily: metricsDaily.data ?? [],
      },
      stores: monitorAllStores(),
      releases: list,
    };
  });

function countBy<T extends Record<string, any>>(rows: T[], key: keyof T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[String(r[key])] = (out[String(r[key])] ?? 0) + 1;
  return out;
}
