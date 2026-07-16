/** HPE v1.0 — Live context capture (current project/page/dashboard). */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";

export const recordContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { context: Record<string, unknown>; source?: string }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { error } = await sb.from("happy_live_events").insert({
      user_id: context.userId,
      event_type: "context_update",
      source: data.source ?? "client",
      payload: data.context,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCurrentContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_live_events")
      .select("payload, created_at")
      .eq("user_id", context.userId)
      .eq("event_type", "context_update")
      .order("created_at", { ascending: false })
      .limit(1);
    return { context: data?.[0]?.payload ?? null, at: data?.[0]?.created_at ?? null };
  });

export const listRecentEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_live_events")
      .select("id,event_type,source,payload,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { events: data ?? [] };
  });
