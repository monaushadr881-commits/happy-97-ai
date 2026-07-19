/**
 * R41 Voice Intelligence Runtime — server functions.
 *
 * Auth-gated RPCs. All persistence goes through RLS as the caller;
 * no service_role escalation. Providers are real; failures surface honestly.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeAnalytics,
  interruptSession,
  listTurns,
  probeProviders,
  reconnectSession,
  recordUserTurn,
  speak,
  startVoiceSession,
  transitionSessionStatus,
} from "./engine";
import { listProviderConfigs, selectVoice } from "./providers";
import { availableVoiceProviders } from "@/lib/happy-runtime/voice";
import { detectLanguage, resolveLanguage, SUPPORTED_LANGUAGES } from "./language";

const ChannelEnum = z.enum(["website", "mobile", "desktop", "presentation", "meeting", "training", "api"]);
const LangEnum = z.enum(["en", "hi", "ur", "auto"]);
const StyleEnum = z.enum(["business", "teaching", "founder", "presentation", "neutral"]);
const ProviderEnum = z.enum(["lovable", "openai", "gemini", "elevenlabs"]);
const CauseEnum = z.enum(["user_speak", "user_cancel", "network", "timeout", "provider_error", "system"]);

const StartInput = z.object({
  channel: ChannelEnum,
  company_id: z.string().uuid().optional(),
  happy_session_id: z.string().uuid().optional(),
  language: LangEnum.default("en"),
  style: StyleEnum.default("business"),
  provider: ProviderEnum.optional(),
  voice_id: z.string().optional(),
  timeout_ms: z.number().int().positive().max(24 * 3600 * 1000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export const startVoiceSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof StartInput>) => StartInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "startVoiceSessionFn", source: "api", module: "voice.startVoiceSessionFn" });
    return startVoiceSession(context.supabase, {
      userId: context.userId,
      companyId: data.company_id ?? null,
      happySessionId: data.happy_session_id ?? null,
      channel: data.channel,
      language: data.language,
      style: data.style,
      provider: data.provider,
      voice_id: data.voice_id,
      timeout_ms: data.timeout_ms,
      meta: data.meta,
    }),;
  });
const IdInput = z.object({ session_id: z.string().uuid() });

export const pauseVoiceSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof IdInput>) => IdInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "pauseVoiceSessionFn", source: "api", module: "voice.pauseVoiceSessionFn" });
    return transitionSessionStatus(context.supabase, data.session_id, "paused");
  });export const resumeVoiceSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof IdInput>) => IdInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "resumeVoiceSessionFn", source: "api", module: "voice.resumeVoiceSessionFn" });
    return reconnectSession(context.supabase, data.session_id);
  });export const endVoiceSessionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof IdInput>) => IdInput.parse(d))
  .handler(async ({ data, context }) => transitionSessionStatus(context.supabase, data.session_id, "ended"));

const UserTurnInput = z.object({
  session_id: z.string().uuid(),
  text: z.string().min(1),
  language: LangEnum.optional(),
  audio_ref: z.string().optional(),
  audio_bytes: z.number().int().nonnegative().optional(),
  duration_ms: z.number().int().nonnegative().optional(),
});
export const recordUserTurnFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UserTurnInput>) => UserTurnInput.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "recordUserTurnFn", source: "api", module: "voice.recordUserTurnFn" });
    return recordUserTurn(context.supabase, {
      sessionId: data.session_id,
      text: data.text,
      language: data.language,
      audio_ref: data.audio_ref,
      audio_bytes: data.audio_bytes,
      duration_ms: data.duration_ms,
    }),;
  });
const SpeakInput = z.object({
  session_id: z.string().uuid(),
  text: z.string().min(1).max(8000),
  language: LangEnum.optional(),
  style: StyleEnum.optional(),
  provider: ProviderEnum.optional(),
  voice_id: z.string().optional(),
  format: z.enum(["mp3", "wav", "opus"]).optional(),
});
export const speakFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SpeakInput>) => SpeakInput.parse(d))
  .handler(async ({ data, context }) =>
    speak(context.supabase, {
      sessionId: data.session_id,
      text: data.text,
      language: data.language,
      style: data.style,
      provider: data.provider,
      voice_id: data.voice_id,
      format: data.format,
    }),
  );

const InterruptInput = z.object({
  session_id: z.string().uuid(),
  turn_id: z.string().uuid().optional(),
  cause: CauseEnum,
  from_state: z.string().optional(),
  to_state: z.string().optional(),
  offset_ms: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
});
export const interruptVoiceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof InterruptInput>) => InterruptInput.parse(d))
  .handler(async ({ data, context }) =>
    interruptSession(context.supabase, {
      sessionId: data.session_id,
      turnId: data.turn_id,
      cause: data.cause,
      from_state: data.from_state,
      to_state: data.to_state,
      offset_ms: data.offset_ms,
      note: data.note,
    }),
  );

const ListTurnsInput = z.object({ session_id: z.string().uuid(), limit: z.number().int().min(1).max(500).default(100) });
export const listVoiceTurnsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListTurnsInput>) => ListTurnsInput.parse(d))
  .handler(async ({ data, context }) => listTurns(context.supabase, data.session_id, data.limit));

const SelectInput = z.object({
  company_id: z.string().uuid().optional(),
  language: LangEnum.default("en"),
  preferred_provider: ProviderEnum.optional(),
  preferred_voice_id: z.string().optional(),
});
export const selectVoiceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SelectInput>) => SelectInput.parse(d))
  .handler(async ({ data, context }) =>
    selectVoice(context.supabase, {
      companyId: data.company_id ?? null,
      language: data.language,
      preferredProvider: data.preferred_provider,
      preferredVoiceId: data.preferred_voice_id,
    }),
  );

const ListConfigsInput = z.object({ company_id: z.string().uuid().optional() });
export const listVoiceProviderConfigsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListConfigsInput>) => ListConfigsInput.parse(d))
  .handler(async ({ data, context }) => listProviderConfigs(context.supabase, data.company_id ?? null));

export const probeVoiceProvidersFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => probeProviders(context.supabase));

export const voiceProviderAvailabilityFn = createServerFn({ method: "GET" })
  .handler(async () => availableVoiceProviders());

const AnalyticsInput = z.object({
  company_id: z.string().uuid().optional(),
  window_hours: z.number().int().min(1).max(24 * 30).default(24),
});
export const voiceAnalyticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof AnalyticsInput>) => AnalyticsInput.parse(d))
  .handler(async ({ data, context }) =>
    computeAnalytics(context.supabase, data.company_id ?? null, data.window_hours),
  );

const DetectInput = z.object({ text: z.string().min(1) });
export const detectLanguageFn = createServerFn({ method: "POST" })
  .inputValidator((d: z.input<typeof DetectInput>) => DetectInput.parse(d))
  .handler(async ({ data }) => ({
    detected: detectLanguage(data.text),
    resolved: resolveLanguage(data.text, { requested: "auto" }),
    supported: SUPPORTED_LANGUAGES,
  }));
