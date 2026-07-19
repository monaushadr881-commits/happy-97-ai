/** HPE v1.0 — Proactive AI engine. HAPPY-initiated messages with rate limiting. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";

const MIN_INTERVAL_MS = 60_000; // never spam: 1/min per kind

export const scheduleProactive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: string; message: string; language?: string; tone?: string; scheduled_for?: string; metadata?: any }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "scheduleProactive", source: "api", module: "presence.proactive.scheduleProactive" });
    await requireHpeUser(context);
    const sb: any = context.supabase;
    // Rate limit: check last proactive of same kind
    const { data: recent } = await sb.from("happy_proactive_messages")
      .select("created_at").eq("user_id", context.userId).eq("kind", data.kind)
      .order("created_at", { ascending: false }).limit(1);
    if (recent?.[0]) {
      const gap = Date.now() - new Date(recent[0].created_at).getTime();
      if (gap < MIN_INTERVAL_MS) return { ok: false, throttled: true, retry_after_ms: MIN_INTERVAL_MS - gap };
    }
    const { data: row, error } = await sb.from("happy_proactive_messages").insert({
      user_id: context.userId,
      kind: data.kind,
      message: data.message,
      language: data.language ?? "en",
      tone: data.tone ?? "friendly",
      scheduled_for: data.scheduled_for ?? null,
      metadata: data.metadata ?? {},
      dispatched_at: data.scheduled_for ? null : new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return { ok: true, message: row };
  });

export const listProactive = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_proactive_messages")
      .select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    return { messages: data ?? [] };
  });

export const markProactiveSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    await sb.from("happy_proactive_messages").update({ seen_at: new Date().toISOString() })
      .eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
