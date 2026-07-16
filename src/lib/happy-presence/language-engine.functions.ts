/** HPE v1.0 — Language engine server functions. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";
import { detectLanguage } from "./language-detect";

export const detectAndRecordLanguage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { lang, confidence } = detectLanguage(data.text);
    const { data: existing } = await sb.from("happy_language_profile")
      .select("recent_samples").eq("user_id", context.userId).maybeSingle();
    const samples = Array.isArray(existing?.recent_samples) ? existing!.recent_samples : [];
    const nextSamples = [{ lang, confidence, at: new Date().toISOString() }, ...samples].slice(0, 20);
    await sb.from("happy_language_profile").upsert({
      user_id: context.userId,
      detected_lang: lang,
      confidence,
      recent_samples: nextSamples,
    }, { onConflict: "user_id" });
    return { lang, confidence };
  });

export const getLanguageProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_language_profile")
      .select("*").eq("user_id", context.userId).maybeSingle();
    return { profile: data ?? { detected_lang: "en", confidence: 0, recent_samples: [] } };
  });
