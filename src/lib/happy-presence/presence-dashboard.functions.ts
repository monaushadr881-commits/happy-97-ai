/** HPE v1.0 — Presence dashboard aggregator (admin-only summary across all users). */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeAdmin } from "./gate";
import { PRESENCE_STALE_AFTER_MS } from "./contracts";

export const getPresenceDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeAdmin(context);
    const sb: any = context.supabase;
    const [sessions, briefs, proactive, langs] = await Promise.all([
      sb.from("happy_presence_sessions").select("user_id,state,last_heartbeat,workspace_id").order("last_heartbeat", { ascending: false }).limit(200),
      sb.from("happy_founder_briefs").select("id,user_id,brief_type,generated_at").order("generated_at", { ascending: false }).limit(30),
      sb.from("happy_proactive_messages").select("id,user_id,kind,dispatched_at,seen_at").order("created_at", { ascending: false }).limit(50),
      sb.from("happy_language_profile").select("user_id,detected_lang,confidence,updated_at").order("updated_at", { ascending: false }).limit(100),
    ]);

    const now = Date.now();
    const rows = (sessions.data ?? []) as any[];
    const online = rows.filter((r) => r.state !== "offline" && now - new Date(r.last_heartbeat).getTime() <= PRESENCE_STALE_AFTER_MS);

    const byState: Record<string, number> = {};
    for (const r of online) byState[r.state] = (byState[r.state] ?? 0) + 1;

    return {
      generated_at: new Date().toISOString(),
      online_count: online.length,
      by_state: byState,
      recent_sessions: rows.slice(0, 50),
      recent_briefs: briefs.data ?? [],
      recent_proactive: proactive.data ?? [],
      languages: langs.data ?? [],
    };
  });
