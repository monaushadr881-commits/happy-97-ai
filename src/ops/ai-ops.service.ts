/**
 * HAPPY X Ops — AI Operations Service
 * Read-only slice over ai_sessions for cost/latency/usage dashboards.
 */
import { defineService, validate, z, type ServiceContext } from "@/services/core";

export const aiOpsService = defineService({ name: "ops.ai", version: "v1" }, () => ({
  async usage(ctx: ServiceContext, input: unknown = {}) {
    const p = validate(z.object({ hours: z.number().int().min(1).max(24 * 30).default(24) }), input);
    const since = new Date(Date.now() - p.hours * 60 * 60_000).toISOString();
    const { data, error } = await ctx.supabase
      .from("ai_sessions")
      .select("model, total_tokens, cost_credits, latency_ms, started_at")
      .gte("started_at", since).limit(5000);
    if (error) throw error;
    const rows = (data ?? []) as { model: string; total_tokens: number | null; cost_credits: number | null; latency_ms: number | null }[];
    const byModel = new Map<string, { calls: number; tokens: number; credits: number; latencySum: number; latencyN: number }>();
    for (const r of rows) {
      const b = byModel.get(r.model) ?? { calls: 0, tokens: 0, credits: 0, latencySum: 0, latencyN: 0 };
      b.calls += 1;
      b.tokens += r.total_tokens ?? 0;
      b.credits += Number(r.cost_credits ?? 0);
      if (r.latency_ms != null) { b.latencySum += r.latency_ms; b.latencyN += 1; }
      byModel.set(r.model, b);
    }
    return {
      windowHours: p.hours,
      totals: {
        calls: rows.length,
        tokens: rows.reduce((s, r) => s + (r.total_tokens ?? 0), 0),
        credits: rows.reduce((s, r) => s + Number(r.cost_credits ?? 0), 0),
      },
      byModel: Array.from(byModel.entries()).map(([model, b]) => ({
        model, calls: b.calls, tokens: b.tokens, credits: b.credits,
        avgLatencyMs: b.latencyN ? Math.round(b.latencySum / b.latencyN) : null,
      })),
    };
  },
}));
