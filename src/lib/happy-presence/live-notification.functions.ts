/** HPE v1.0 — Human-toned notification helper (reuses existing notification storage). */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";

const HUMAN_TEMPLATES: Record<string, Record<string, string>> = {
  en: {
    reminder: "😊 I was waiting — ready when you are.",
    almost_done: "Aaj ka target almost complete hai 🚀",
    quick_session: "Chalo 15 minute kaam karte hain.",
    prepared: "I have prepared everything.",
    important_update: "Ek important update hai.",
    congratulations: "Congratulations 🎉",
  },
  hi: {
    reminder: "😊 main wait kar raha tha.",
    almost_done: "aaj ka target almost complete hai.",
    quick_session: "chalo 15 minute kaam karte hain.",
    prepared: "sab kuch tayaar hai.",
    important_update: "ek important update hai.",
    congratulations: "बधाई हो! 🎉",
  },
};

export const humanNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: string; language?: string; body?: string; metadata?: any }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const lang = data.language ?? "en";
    const body = data.body ?? HUMAN_TEMPLATES[lang]?.[data.kind] ?? HUMAN_TEMPLATES.en[data.kind] ?? "😊";
    const { data: row, error } = await sb.from("happy_proactive_messages").insert({
      user_id: context.userId,
      kind: `notify:${data.kind}`,
      message: body,
      language: lang,
      tone: "friendly",
      metadata: data.metadata ?? {},
      dispatched_at: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return { ok: true, message: row };
  });
