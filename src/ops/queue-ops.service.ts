/**
 * HAPPY X Ops — Queue Ops Service
 * Operational view over the existing `job_queue` (Phase 5 jobsService owns
 * enqueue/consume; this owns inspection, retries, and DLQ handling).
 */
import { defineService, V, validate, z, type ServiceContext } from "@/services/core";

export const queueOpsService = defineService({ name: "ops.queue", version: "v1" }, () => ({
  async stats(ctx: ServiceContext) {
    const counts = await Promise.all(
      (["ready", "running", "succeeded", "failed", "dead"] as const).map(async (s) => {
        const { count } = await ctx.supabase
          .from("job_queue").select("id", { head: true, count: "exact" }).eq("status", s);
        return [s, count ?? 0] as const;
      }),
    );
    return Object.fromEntries(counts);
  },
  async listFailed(ctx: ServiceContext, limit = 50) {
    const { data, error } = await ctx.supabase
      .from("job_queue").select("*").eq("status", "failed")
      .order("updated_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  async retry(ctx: ServiceContext, id: string) {
    const uid = validate(V.uuid, id);
    const { data, error } = await ctx.supabase.from("job_queue").update({
      status: "ready", run_at: new Date().toISOString(), last_error: null,
    } as never).eq("id", uid).select("*").single();
    if (error) throw error;
    return data;
  },
  async moveToDlq(ctx: ServiceContext, id: string) {
    const uid = validate(V.uuid, id);
    const { data, error } = await ctx.supabase.from("job_queue").update({ status: "dead" } as never)
      .eq("id", uid).select("*").single();
    if (error) throw error;
    return data;
  },
  async recordCron(ctx: ServiceContext, input: unknown) {
    const p = validate(z.object({
      job_name: z.string().min(1).max(120),
      status: z.enum(["ok", "failed"]).default("ok"),
      duration_ms: z.number().int().min(0).optional(),
      message: z.string().max(2000).optional(),
    }), input);
    const now = new Date().toISOString();
    const { error } = await ctx.supabase.from("cron_runs").insert({
      job_name: p.job_name, status: p.status, duration_ms: p.duration_ms ?? null,
      message: p.message ?? null, finished_at: now,
    } as never);
    if (error) throw error;
    return { ok: true };
  },
}));
