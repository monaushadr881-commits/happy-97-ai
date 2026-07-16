/** R64 — Release history. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64 } from "./gate";

export const listReleases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ limit: z.number().int().min(1).max(500).default(100) }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const { data: rows, error } = await sb.from("release_records").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { releases: rows ?? [] };
  });

export const getReleaseDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const [rel, arts, subs, rollouts, checks, metrics] = await Promise.all([
      sb.from("release_records").select("*").eq("id", data.release_id).single(),
      sb.from("release_artifact_registry").select("*").eq("release_id", data.release_id),
      sb.from("release_store_submissions").select("*").eq("release_id", data.release_id),
      sb.from("release_rollouts").select("*").eq("release_id", data.release_id),
      sb.from("release_automation_checks").select("*").eq("release_id", data.release_id).order("checked_at", { ascending: false }).limit(50),
      sb.from("release_store_metrics").select("*").eq("release_id", data.release_id).order("snapshot_at", { ascending: false }).limit(50),
    ]);
    if (rel.error) throw new Error(rel.error.message);
    return {
      release: rel.data,
      artifacts: arts.data ?? [],
      submissions: subs.data ?? [],
      rollouts: rollouts.data ?? [],
      checks: checks.data ?? [],
      metrics: metrics.data ?? [],
    };
  });

export const compareVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ a: z.string().uuid(), b: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    const [a, b] = await Promise.all([
      sb.from("release_records").select("*").eq("id", data.a).single(),
      sb.from("release_records").select("*").eq("id", data.b).single(),
    ]);
    if (a.error || b.error) throw new Error(a.error?.message ?? b.error?.message ?? "not found");
    return { a: a.data, b: b.data };
  });
