/**
 * R41 Voice Intelligence Runtime — Provider registry & router.
 *
 * The registry is DB-backed (voice_provider_configs). Provider capability is
 * probed at runtime; nothing is hardcoded to a single provider. Selection is:
 *   1. company-scoped config (if enabled + healthy)
 *   2. global config (company_id IS NULL) fallback
 *   3. any healthy provider whose secret is available
 * If nothing is available the router returns a BLOCKED result so the caller
 * can fail cleanly instead of pretending audio was produced.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { assertUuid } from "@/lib/security/pgrest-sanitize";
import {
  availableVoiceProviders,
  synthesizeSpeech,
  type SynthesizeInput,
  type SynthesizeResult,
  type VoiceProvider,
} from "@/lib/happy-runtime/voice";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type ProviderConfigRow = {
  id: string;
  company_id: string | null;
  provider: VoiceProvider;
  voice_id: string;
  label: string | null;
  language: string;
  priority: number;
  enabled: boolean;
  style_defaults: Record<string, JsonValue>;
};

export type SelectVoiceInput = {
  companyId?: string | null;
  language?: string;
  preferredProvider?: VoiceProvider;
  preferredVoiceId?: string;
};

export type SelectedVoice = {
  provider: VoiceProvider;
  voice_id: string;
  language: string;
  source: "preference" | "company" | "global" | "fallback";
  style_defaults: Record<string, JsonValue>;
};

export async function listProviderConfigs(
  supabase: SupabaseClient,
  companyId?: string | null,
): Promise<ProviderConfigRow[]> {
  let q = supabase
    .from("voice_provider_configs")
    .select("*")
    .eq("enabled", true)
    .order("priority", { ascending: true });
  if (companyId) { const cid = assertUuid(companyId, "company_id"); q = q.or(`company_id.eq.${cid},company_id.is.null`); }
  else q = q.is("company_id", null);
  const { data, error } = await q;
  if (error) throw new Error(`list_provider_configs_failed: ${error.message}`);
  return (data ?? []) as ProviderConfigRow[];
}

export async function selectVoice(
  supabase: SupabaseClient,
  input: SelectVoiceInput,
): Promise<SelectedVoice | null> {
  const availability = availableVoiceProviders();
  const configs = await listProviderConfigs(supabase, input.companyId ?? null);
  const lang = input.language ?? "en";

  // 1. explicit preference
  if (input.preferredProvider && input.preferredVoiceId && availability[input.preferredProvider]) {
    return {
      provider: input.preferredProvider,
      voice_id: input.preferredVoiceId,
      language: lang,
      source: "preference",
      style_defaults: {},
    };
  }

  const matchLang = (r: ProviderConfigRow) => r.language === lang || r.language === "auto";

  // 2. company config (highest priority = lowest number)
  const companyConfigs = configs.filter(
    (r) => r.company_id === input.companyId && availability[r.provider] && matchLang(r),
  );
  if (companyConfigs[0]) {
    const r = companyConfigs[0];
    return {
      provider: r.provider,
      voice_id: r.voice_id,
      language: r.language === "auto" ? lang : r.language,
      source: "company",
      style_defaults: r.style_defaults ?? {},
    };
  }

  // 3. global config
  const globalConfigs = configs.filter(
    (r) => r.company_id === null && availability[r.provider] && matchLang(r),
  );
  if (globalConfigs[0]) {
    const r = globalConfigs[0];
    return {
      provider: r.provider,
      voice_id: r.voice_id,
      language: r.language === "auto" ? lang : r.language,
      source: "global",
      style_defaults: r.style_defaults ?? {},
    };
  }

  // 4. hard fallback — only if a Lovable-routed provider is actually available
  if (availability.lovable) {
    return {
      provider: "lovable",
      voice_id: "alloy",
      language: lang,
      source: "fallback",
      style_defaults: {},
    };
  }
  return null;
}

export type SynthesizeWithFallbackResult =
  | (SynthesizeResult & { selected: SelectedVoice; attempts: Array<{ provider: VoiceProvider; ok: boolean; error?: string; latency_ms: number }> })
  | { ok: false; provider: "none"; error: string; attempts: Array<{ provider: VoiceProvider; ok: boolean; error?: string; latency_ms: number }>; selected: SelectedVoice | null };

export async function synthesizeWithFallback(
  supabase: SupabaseClient,
  select: SelectVoiceInput,
  text: string,
  style: Partial<Omit<SynthesizeInput, "provider" | "voice_id" | "text">> = {},
): Promise<SynthesizeWithFallbackResult> {
  const availability = availableVoiceProviders();
  const attempts: Array<{ provider: VoiceProvider; ok: boolean; error?: string; latency_ms: number }> = [];
  const primary = await selectVoice(supabase, select);
  if (!primary) {
    return { ok: false, provider: "none", error: "no_voice_provider_available", attempts, selected: null };
  }
  const order: SelectedVoice[] = [primary];
  // Add other available providers as fallbacks, distinct from primary.
  for (const p of ["lovable", "openai", "gemini", "elevenlabs"] as VoiceProvider[]) {
    if (p !== primary.provider && availability[p]) {
      order.push({ provider: p, voice_id: primary.voice_id, language: primary.language, source: "fallback", style_defaults: {} });
    }
  }
  let last: SynthesizeResult | null = null;
  for (const sv of order) {
    const t0 = Date.now();
    const r = await synthesizeSpeech({
      provider: sv.provider,
      voice_id: sv.voice_id,
      text,
      language: sv.language,
      ...style,
    });
    const latency = Date.now() - t0;
    attempts.push({ provider: sv.provider, ok: r.ok, error: r.ok ? undefined : r.error, latency_ms: latency });
    if (r.ok) {
      return { ...r, selected: sv, attempts };
    }
    last = r;
  }
  return {
    ok: false,
    provider: "none",
    error: last && !last.ok ? `all_providers_failed: ${last.error}` : "all_providers_failed",
    attempts,
    selected: primary,
  };
}
