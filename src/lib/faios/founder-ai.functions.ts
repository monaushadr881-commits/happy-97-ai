/** R66 FAIOS — dashboard + morning brief aggregations. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFaiosAccess } from "./gate";

export const getFounderAIDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const [commands, activity, terminal, workspace, memory] = await Promise.all([
      sb.from("faios_commands").select("id,raw_text,intent,category,status,risk_level,created_at").eq("founder_id", context.userId).order("created_at", { ascending: false }).limit(20),
      sb.from("faios_activity").select("id,stage,status,detail,created_at,command_id").eq("founder_id", context.userId).order("created_at", { ascending: false }).limit(30),
      sb.from("faios_terminal_lines").select("id,channel,level,message,created_at").eq("founder_id", context.userId).order("created_at", { ascending: false }).limit(30),
      sb.from("faios_workspace_items").select("*").eq("founder_id", context.userId).order("updated_at", { ascending: false }).limit(30),
      sb.from("faios_memory").select("scope,key,value,updated_at").eq("founder_id", context.userId).order("updated_at", { ascending: false }).limit(30),
    ]);

    const cmdRows = (commands.data ?? []) as any[];
    const byStatus: Record<string, number> = {};
    for (const c of cmdRows) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

    return {
      generated_at: new Date().toISOString(),
      widgets: {
        commands_total: cmdRows.length,
        by_status: byStatus,
        pending_approvals: cmdRows.filter((c) => c.status === "awaiting_approval").length,
        blocked: cmdRows.filter((c) => c.status === "blocked").length,
        workspace_pinned: (workspace.data ?? []).filter((w: any) => w.pinned).length,
      },
      recent_commands: cmdRows,
      recent_activity: activity.data ?? [],
      terminal: terminal.data ?? [],
      workspace: workspace.data ?? [],
      memory: memory.data ?? [],
    };
  });

export const getFounderMorningBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertFaiosAccess(context);
    const sb: any = context.supabase;
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [cmds, activity] = await Promise.all([
      sb.from("faios_commands").select("intent,status,created_at").eq("founder_id", context.userId).gte("created_at", since),
      sb.from("faios_activity").select("stage,status,created_at").eq("founder_id", context.userId).gte("created_at", since),
    ]);
    const cmdRows = (cmds.data ?? []) as any[];
    const actRows = (activity.data ?? []) as any[];
    return {
      window_hours: 24,
      summary: `${cmdRows.length} command(s) submitted, ${actRows.filter(a => a.status === "succeeded").length} succeeded.`,
      commands_by_status: cmdRows.reduce((acc: Record<string, number>, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; }, {}),
      activity_by_stage: actRows.reduce((acc: Record<string, number>, a) => { acc[a.stage] = (acc[a.stage] ?? 0) + 1; return acc; }, {}),
      suggestions: [
        "Review pending approvals in Founder Terminal.",
        "Rerun a typecheck if UI-heavy work landed overnight.",
        "Check Release Center rollout progress.",
      ],
    };
  });
