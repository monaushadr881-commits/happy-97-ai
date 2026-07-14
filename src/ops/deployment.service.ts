/**
 * HAPPY X Ops — Deployment Service
 * Release history + rollback tracking. Actual deploy orchestration lives
 * outside the app (CI/CD); this records and analyses.
 */
import { defineService, V, validate, z, type ServiceContext } from "@/services/core";

const StartInput = z.object({
  version: z.string().min(1).max(80),
  channel: z.enum(["development", "testing", "staging", "production"]).default("production"),
  strategy: z.enum(["rolling", "blue_green", "canary", "hotfix"]).default("rolling"),
  notes: z.string().max(4000).optional(),
});

const FinishInput = z.object({
  id: V.uuid,
  status: z.enum(["succeeded", "failed", "rolled_back"]),
  notes: z.string().max(4000).optional(),
});

export const deploymentService = defineService({ name: "ops.deployment", version: "v1" }, () => ({
  async list(ctx: ServiceContext, channel?: string) {
    let q = ctx.supabase.from("deployments").select("*").order("started_at", { ascending: false }).limit(100);
    if (channel) q = q.eq("channel", channel);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  async start(ctx: ServiceContext, input: unknown) {
    const p = validate(StartInput, input);
    const { data, error } = await ctx.supabase.from("deployments").insert({
      version: p.version, channel: p.channel, strategy: p.strategy, notes: p.notes ?? null,
      status: "in_progress", initiated_by: ctx.userId,
    } as never).select("*").single();
    if (error) throw error;
    return data;
  },
  async finish(ctx: ServiceContext, input: unknown) {
    const p = validate(FinishInput, input);
    const { data, error } = await ctx.supabase.from("deployments").update({
      status: p.status, notes: p.notes ?? null, completed_at: new Date().toISOString(),
    } as never).eq("id", p.id).select("*").single();
    if (error) throw error;
    return data;
  },
  async analytics(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("deployments").select("status, channel, started_at").limit(500);
    if (error) throw error;
    const rows = (data ?? []) as { status: string; channel: string }[];
    const total = rows.length;
    const bucket = (k: string) => rows.filter((r) => r.status === k).length;
    return {
      total,
      succeeded: bucket("succeeded"),
      failed: bucket("failed"),
      rolledBack: bucket("rolled_back"),
      inProgress: bucket("in_progress"),
      channels: Array.from(new Set(rows.map((r) => r.channel))),
    };
  },
}));
