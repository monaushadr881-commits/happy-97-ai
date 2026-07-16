/** HPE v1.0 — Relationship (personalization) prefs. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireHpeUser } from "./gate";
import { RELATIONSHIP_DEFAULTS } from "./contracts";

export const getRelationship = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_relationship_prefs")
      .select("*").eq("user_id", context.userId).maybeSingle();
    return {
      prefs: { ...RELATIONSHIP_DEFAULTS, ...(data?.prefs ?? {}) },
      personalization_enabled: data?.personalization_enabled ?? true,
      updated_at: data?.updated_at ?? null,
    };
  });

export const updateRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prefs?: Record<string, unknown>; personalization_enabled?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data: existing } = await sb.from("happy_relationship_prefs")
      .select("prefs").eq("user_id", context.userId).maybeSingle();
    const nextPrefs = { ...(existing?.prefs ?? {}), ...(data.prefs ?? {}) };
    const { error } = await sb.from("happy_relationship_prefs").upsert({
      user_id: context.userId,
      prefs: nextPrefs,
      personalization_enabled: data.personalization_enabled ?? true,
    }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true, prefs: { ...RELATIONSHIP_DEFAULTS, ...nextPrefs } };
  });

export const resetRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    await sb.from("happy_relationship_prefs").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const exportRelationship = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireHpeUser(context);
    const sb: any = context.supabase;
    const { data } = await sb.from("happy_relationship_prefs")
      .select("*").eq("user_id", context.userId).maybeSingle();
    return { export: data ?? null, generated_at: new Date().toISOString() };
  });
