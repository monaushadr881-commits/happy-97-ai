/**
 * HAPPY X — Background Jobs Service
 *
 * Thin queue on top of the `job_queue` table. Workers can pull ready jobs;
 * a future edge cron promotes ready jobs and moves failed ones to DLQ.
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";

const EnqueueInput = z.object({
  kind: z.string().min(1).max(120),
  payload: z.record(z.unknown()).default({}),
  run_at: z.string().datetime().optional(),
  max_attempts: z.number().int().min(1).max(20).default(5),
});

export const jobsService = defineService({ name: "jobs", version: "v1" }, () => ({
  async enqueue(ctx: ServiceContext, input: unknown) {
    const p = validate(EnqueueInput, input);
    const { data, error } = await ctx.supabase.from("job_queue").insert({
      kind: p.kind,
      payload: p.payload as never,
      run_at: p.run_at ?? new Date().toISOString(),
      max_attempts: p.max_attempts,
      status: "ready",
      enqueued_by: ctx.userId,
    } as never).select("*").single();
    if (error) throw error;
    return data;
  },
  async status(ctx: ServiceContext, id: string) {
    const { data, error } = await ctx.supabase
      .from("job_queue").select("*").eq("id", validate(V.uuid, id)).maybeSingle();
    if (error) throw error;
    return data;
  },
}));
