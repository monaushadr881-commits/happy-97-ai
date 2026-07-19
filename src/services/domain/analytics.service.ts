/**
 * HAPPY X — Analytics Service
 * Aggregations exposed to executive dashboards.
 */
import { defineService, type ServiceContext } from "../core";

export const analyticsService = defineService({ name: "analytics", version: "v1" }, () => ({
  async platformOverview(ctx: ServiceContext) {
    const [companies, workspaces, users, ai] = await Promise.all([
      ctx.supabase.from("companies").select("id", { count: "exact", head: true }),
      ctx.supabase.from("workspaces").select("id", { count: "exact", head: true }),
      ctx.supabase.from("profiles").select("id", { count: "exact", head: true }),
      ctx.supabase.from("ai_sessions").select("id", { count: "exact", head: true }),
    ]);
    return {
      companies: companies.count ?? 0,
      workspaces: workspaces.count ?? 0,
      users: users.count ?? 0,
      aiSessions: ai.count ?? 0,
      at: new Date().toISOString(),
    };
  },
  async recentActivity(ctx: ServiceContext, limit = 25) {
    const { data, error } = await ctx.supabase
      .from("activity_events").select("*")
      .order("occurred_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
}));
