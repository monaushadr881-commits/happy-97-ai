/**
 * HAPPY X Ops — Security Operations Service
 * Read-only surface over audit_logs + failed-login detection.
 */
import { defineService, validate, z, type ServiceContext } from "@/services/core";

export const securityOpsService = defineService({ name: "ops.security", version: "v1" }, () => ({
  async summary(ctx: ServiceContext) {
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const [critical, warnings, auth] = await Promise.all([
      ctx.supabase.from("audit_logs").select("id", { head: true, count: "exact" })
        .eq("severity", "critical").gte("occurred_at", since),
      ctx.supabase.from("audit_logs").select("id", { head: true, count: "exact" })
        .eq("severity", "warning").gte("occurred_at", since),
      ctx.supabase.from("audit_logs").select("id", { head: true, count: "exact" })
        .eq("category", "auth").gte("occurred_at", since),
    ]);
    return {
      window: "24h",
      criticalEvents: critical.count ?? 0,
      warningEvents: warnings.count ?? 0,
      authEvents: auth.count ?? 0,
    };
  },
  async recentAudit(ctx: ServiceContext, input: unknown = {}) {
    const p = validate(z.object({ limit: z.number().int().min(1).max(500).default(100), severity: z.string().optional() }), input);
    let q = ctx.supabase.from("audit_logs").select("*").order("occurred_at", { ascending: false }).limit(p.limit);
    if (p.severity) q = q.eq("severity", p.severity);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
}));
