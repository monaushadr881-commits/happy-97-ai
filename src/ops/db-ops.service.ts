/**
 * HAPPY X Ops — Database Operations Service
 * Migration history + slow-query surface (populated by DB tools; here we
 * expose what the app can see via information_schema-safe reads).
 */
import { defineService, type ServiceContext } from "@/services/core";

export const dbOpsService = defineService({ name: "ops.db", version: "v1" }, () => ({
  async schemaCounts(ctx: ServiceContext) {
    // Rough size signal from a few core tables.
    const tables = ["profiles", "companies", "workspaces", "audit_logs", "job_queue", "ai_sessions"] as const;
    const results = await Promise.all(tables.map(async (t) => {
      const { count, error } = await ctx.supabase.from(t).select("id", { head: true, count: "exact" });
      return { table: t, count: error ? null : (count ?? 0), error: error?.message ?? null };
    }));
    return results;
  },
}));
