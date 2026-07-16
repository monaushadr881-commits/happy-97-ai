/** HPE v1.0 — Founder briefings (morning/evening/night, revenue, health, security). */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";
import { BRIEF_TYPES, type BriefType } from "./contracts";

export const generateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { brief_type: BriefType }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    if (!BRIEF_TYPES.includes(data.brief_type)) throw new Error("invalid brief_type");
    const sb: any = context.supabase;

    // Best-effort aggregation. Any missing table returns empty; briefing still emits.
    async function safeCount(table: string, filters: (q: any) => any = (q) => q) {
      try {
        const q = filters(sb.from(table).select("*", { count: "exact", head: true }));
        const { count } = await q;
        return count ?? 0;
      } catch { return 0; }
    }
    async function safeList(table: string, cols: string, filters: (q: any) => any = (q) => q, limit = 5) {
      try {
        const { data: rows } = await filters(sb.from(table).select(cols)).limit(limit);
        return rows ?? [];
      } catch { return []; }
    }

    const [releases, builds, rollouts, events] = await Promise.all([
      safeList("release_records", "id,version,channel,status,created_at", (q) => q.order("created_at", { ascending: false })),
      safeList("build_pipeline_runs", "id,platform_code,status,queued_at", (q) => q.order("queued_at", { ascending: false })),
      safeList("release_rollouts", "id,store,state,current_percent", (q) => q.order("updated_at", { ascending: false })),
      safeList("happy_live_events", "id,event_type,created_at", (q) => q.eq("user_id", context.userId).order("created_at", { ascending: false }), 10),
    ]);
    const pendingBuilds = await safeCount("build_pipeline_runs", (q) => q.eq("status", "queued"));

    const content = {
      generated_at: new Date().toISOString(),
      brief_type: data.brief_type,
      highlights: {
        releases_recent: releases,
        builds_recent: builds,
        builds_queued_count: pendingBuilds,
        rollouts_recent: rollouts,
        activity_events: events,
      },
      suggestions: buildSuggestions(data.brief_type, { pendingBuilds }),
    };

    const { data: row, error } = await sb.from("happy_founder_briefs").insert({
      user_id: context.userId,
      brief_type: data.brief_type,
      content,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listBriefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_founder_briefs")
      .select("*").eq("user_id", context.userId)
      .order("generated_at", { ascending: false }).limit(30);
    return { briefs: data ?? [] };
  });

function buildSuggestions(type: BriefType, ctx: { pendingBuilds: number }): string[] {
  const s: string[] = [];
  if (type === "morning") s.push("Start with the highest-priority release check.");
  if (type === "evening") s.push("Review today's revenue and pending tasks.");
  if (type === "night") s.push("Schedule tomorrow's top 3 priorities.");
  if (ctx.pendingBuilds > 0) s.push(`${ctx.pendingBuilds} build(s) queued — check the pipeline.`);
  return s;
}
