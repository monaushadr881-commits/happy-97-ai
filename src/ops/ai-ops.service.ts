/**
 * HAPPY X Ops — AI Operations Service
 * Read-only slice over ai_sessions for cost/latency/usage dashboards.
 * Grouped by `channel` (persona/module label); the current schema stores
 * cost in cents and separate input/output token counters.
 */
import { defineService, validate, z, type ServiceContext } from "@/services/core";

export const aiOpsService = defineService({ name: "ops.ai", version: "v1" }, () => ({
  async usage(ctx: ServiceContext, input: unknown = {}) {
    const p = validate(z.object({ hours: z.number().int().min(1).max(24 * 30).default(24) }), input);
    const since = new Date(Date.now() - p.hours * 60 * 60_000).toISOString();
    const { data, error } = await ctx.supabase
      .from("ai_sessions")
      .select("channel, input_tokens, output_tokens, cost_cents, started_at, ended_at")
      .gte("started_at", since).limit(5000);
    if (error) throw error;
    type Row = { channel: string; input_tokens: number; output_tokens: number; cost_cents: number; started_at: string; ended_at: string | null };
    const rows = (data ?? []) as Row[];
    const byChannel = new Map<string, { calls: number; tokens: number; cents: number; latencySum: number; latencyN: number }>();
    for (const r of rows) {
      const b = byChannel.get(r.channel) ?? { calls: 0, tokens: 0, cents: 0, latencySum: 0, latencyN: 0 };
      b.calls += 1;
      b.tokens += (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
      b.cents += Number(r.cost_cents ?? 0);
      if (r.ended_at) {
        b.latencySum += new Date(r.ended_at).getTime() - new Date(r.started_at).getTime();
        b.latencyN += 1;
      }
      byChannel.set(r.channel, b);
    }
    return {
      windowHours: p.hours,
      totals: {
        calls: rows.length,
        tokens: rows.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0),
        costCents: rows.reduce((s, r) => s + Number(r.cost_cents ?? 0), 0),
      },
      byChannel: Array.from(byChannel.entries()).map(([channel, b]) => ({
        channel, calls: b.calls, tokens: b.tokens, costCents: b.cents,
        avgLatencyMs: b.latencyN ? Math.round(b.latencySum / b.latencyN) : null,
      })),
    };
  },
}));
