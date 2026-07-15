/**
 * HAPPY X — Analytics Service
 * Aggregations exposed to executive dashboards.
 */
import { defineService, type ServiceContext } from "../core";

export const analyticsService = defineService({ name: "analytics", version: "v1" }, () => ({
  async platformOverview(ctx: ServiceContext) {
    const countOf = async (table: string) => {
      const { count, error } = await ctx.supabase
        .from(table as never)
        .select("id", { count: "exact", head: true });
      // Treat missing/inaccessible tables as null (=> "Not Available Yet") rather than 0.
      if (error) return null;
      return count ?? 0;
    };
    const [
      companies, workspaces, brands, users,
      aiSessions, conversations, deployments, notifications,
    ] = await Promise.all([
      countOf("companies"),
      countOf("workspaces"),
      countOf("brands"),
      countOf("profiles"),
      countOf("ai_sessions"),
      countOf("conversations"),
      countOf("deployments"),
      countOf("notifications"),
    ]);
    return {
      companies, workspaces, brands, users,
      // Provide both snake_case and camelCase so no caller sees a stale mismatch.
      ai_sessions: aiSessions, aiSessions,
      conversations, deployments, notifications,
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
