/**
 * HAPPY X Ops — Metrics Service
 * Append-only metrics stream, plus quick rollups for dashboards.
 */
import { defineService, V, validate, z, type ServiceContext } from "@/services/core";

const EmitInput = z.object({
  service: z.string().min(1).max(80),
  metric: z.string().min(1).max(120),
  value: z.number(),
  unit: z.string().max(20).optional(),
  labels: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

const RangeInput = z.object({
  service: z.string().min(1).max(80),
  metric: z.string().min(1).max(120),
  sinceMinutes: z.number().int().min(1).max(60 * 24 * 7).default(60),
});

export const metricsService = defineService({ name: "ops.metrics", version: "v1" }, () => ({
  async emit(ctx: ServiceContext, input: unknown) {
    const p = validate(EmitInput, input);
    const { error } = await ctx.supabase.from("metrics_events").insert({
      service: p.service, metric: p.metric, value: p.value, unit: p.unit ?? null, labels: p.labels as never,
    } as never);
    if (error) throw error;
    return { ok: true };
  },
  async range(ctx: ServiceContext, input: unknown) {
    const p = validate(RangeInput, input);
    const since = new Date(Date.now() - p.sinceMinutes * 60_000).toISOString();
    const { data, error } = await ctx.supabase
      .from("metrics_events")
      .select("value, occurred_at, labels")
      .eq("service", p.service).eq("metric", p.metric)
      .gte("occurred_at", since).order("occurred_at", { ascending: true });
    if (error) throw error;
    const points = (data ?? []) as { value: number; occurred_at: string }[];
    const values = points.map((r) => Number(r.value));
    return {
      points,
      count: values.length,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    };
  },
  async lastByService(ctx: ServiceContext, service: string) {
    const s = validate(z.string().min(1).max(80), service);
    const { data, error } = await ctx.supabase
      .from("metrics_events").select("*")
      .eq("service", s).order("occurred_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  },
}));

export { V };
