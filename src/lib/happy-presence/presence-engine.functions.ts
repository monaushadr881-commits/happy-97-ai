/** HPE v1.0 — Presence engine server functions. Expansion only. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";
import { PRESENCE_STATES, PRESENCE_STALE_AFTER_MS, type PresenceState } from "./contracts";

export const upsertPresence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { session_key: string; state?: PresenceState; device?: any; network?: any; workspace_id?: string | null; context?: any }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "upsertPresence", source: "api", module: "presence.engine.upsertPresence" });
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const state = data.state && PRESENCE_STATES.includes(data.state) ? data.state : "online";
    const { data: row, error } = await sb.from("happy_presence_sessions").upsert({
      user_id: context.userId,
      session_key: data.session_key,
      state,
      last_heartbeat: new Date().toISOString(),
      device: data.device ?? {},
      network: data.network ?? {},
      workspace_id: data.workspace_id ?? null,
      context: data.context ?? {},
    }, { onConflict: "user_id,session_key" }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const heartbeat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { session_key: string; state?: PresenceState; context?: any }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const patch: any = { last_heartbeat: new Date().toISOString() };
    if (data.state && PRESENCE_STATES.includes(data.state)) patch.state = data.state;
    if (data.context) patch.context = data.context;
    const { error } = await sb.from("happy_presence_sessions").update(patch)
      .eq("user_id", context.userId).eq("session_key", data.session_key);
    if (error) throw new Error(error.message);
    return { ok: true, at: patch.last_heartbeat };
  });

export const goOffline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { session_key: string }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    await sb.from("happy_presence_sessions").update({ state: "offline", last_heartbeat: new Date().toISOString() })
      .eq("user_id", context.userId).eq("session_key", data.session_key);
    return { ok: true };
  });

export const getMyPresence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data, error } = await sb.from("happy_presence_sessions")
      .select("*").eq("user_id", context.userId).order("last_heartbeat", { ascending: false });
    if (error) throw new Error(error.message);
    const now = Date.now();
    const sessions = (data ?? []).map((s: any) => ({
      ...s,
      is_stale: now - new Date(s.last_heartbeat).getTime() > PRESENCE_STALE_AFTER_MS,
    }));
    const active = sessions.find((s: any) => !s.is_stale && s.state !== "offline") ?? null;
    return { sessions, active_state: active?.state ?? "offline" };
  });
