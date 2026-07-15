/**
 * R41 Voice Intelligence Runtime — Session lifecycle & analytics engine.
 *
 * Sessions, turns, interruptions, and analytics all live in DB. Nothing is
 * kept in-memory only. This engine is the sole writer path used by the
 * server functions layer.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveLanguage, type SupportedLanguage } from "./language";
import { selectVoice, synthesizeWithFallback, type JsonValue, type SelectedVoice } from "./providers";
import { buildEstimatedTimeline, buildTimelineFromProvider, type SpeechTimeline } from "./timeline";
import { availableVoiceProviders, type VoiceProvider } from "@/lib/happy-runtime/voice";

export type VoiceStyle = "business" | "teaching" | "founder" | "presentation" | "neutral";
export type VoiceChannel = "website" | "mobile" | "desktop" | "presentation" | "meeting" | "training" | "api";

export type StartVoiceSessionInput = {
  userId: string;
  companyId?: string | null;
  happySessionId?: string | null;
  channel: VoiceChannel;
  language?: SupportedLanguage;
  style?: VoiceStyle;
  provider?: VoiceProvider;
  voice_id?: string;
  timeout_ms?: number;
  meta?: Record<string, unknown>;
};

export type VoiceSessionRow = {
  id: string;
  user_id: string;
  company_id: string | null;
  channel: VoiceChannel;
  provider: VoiceProvider;
  voice_id: string;
  language: string;
  style: VoiceStyle;
  status: "active" | "paused" | "ended" | "timeout" | "error";
  started_at: string;
  ended_at: string | null;
  timeout_at: string | null;
  last_activity_at: string;
  error: string | null;
};

export async function startVoiceSession(
  supabase: SupabaseClient,
  input: StartVoiceSessionInput,
): Promise<VoiceSessionRow> {
  const language = input.language ?? "en";
  const selected = await selectVoice(supabase, {
    companyId: input.companyId ?? null,
    language,
    preferredProvider: input.provider,
    preferredVoiceId: input.voice_id,
  });
  if (!selected) throw new Error("no_voice_provider_available");
  const timeoutAt = input.timeout_ms
    ? new Date(Date.now() + input.timeout_ms).toISOString()
    : null;
  const { data, error } = await supabase
    .from("voice_sessions")
    .insert({
      user_id: input.userId,
      company_id: input.companyId ?? null,
      happy_session_id: input.happySessionId ?? null,
      channel: input.channel,
      provider: selected.provider,
      voice_id: selected.voice_id,
      language: selected.language,
      style: input.style ?? "business",
      status: "active",
      timeout_at: timeoutAt,
      meta: input.meta ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`start_voice_session_failed: ${error?.message}`);
  return data as VoiceSessionRow;
}

async function touchSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  await supabase
    .from("voice_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function transitionSessionStatus(
  supabase: SupabaseClient,
  sessionId: string,
  status: VoiceSessionRow["status"],
  errorMessage?: string,
): Promise<VoiceSessionRow> {
  const patch: Record<string, unknown> = {
    status,
    last_activity_at: new Date().toISOString(),
  };
  if (status === "ended" || status === "timeout" || status === "error") {
    patch.ended_at = new Date().toISOString();
  }
  if (errorMessage) patch.error = errorMessage;
  const { data, error } = await supabase
    .from("voice_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error || !data) throw new Error(`transition_session_failed: ${error?.message}`);
  return data as VoiceSessionRow;
}

export type UserTurnInput = {
  sessionId: string;
  text: string;
  language?: SupportedLanguage;
  audio_ref?: string;
  audio_bytes?: number;
  duration_ms?: number;
};

export async function recordUserTurn(
  supabase: SupabaseClient,
  input: UserTurnInput,
): Promise<{ turn_id: string; language: SupportedLanguage }> {
  const language = resolveLanguage(input.text, { requested: input.language ?? "auto" });
  const { data, error } = await supabase
    .from("voice_turns")
    .insert({
      session_id: input.sessionId,
      role: "user",
      kind: input.audio_ref ? "audio" : "text",
      text: input.text,
      language,
      audio_ref: input.audio_ref ?? null,
      audio_bytes: input.audio_bytes ?? null,
      duration_ms: input.duration_ms ?? null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`record_user_turn_failed: ${error?.message}`);
  await touchSession(supabase, input.sessionId);
  return { turn_id: data.id as string, language };
}

export type SpeakInput = {
  sessionId: string;
  text: string;
  language?: SupportedLanguage;
  style?: VoiceStyle;
  provider?: VoiceProvider;
  voice_id?: string;
  format?: "mp3" | "wav" | "opus";
};

export type SpeakResult =
  | {
      ok: true;
      turn_id: string;
      selected: SelectedVoice;
      timeline: SpeechTimeline;
      audio_base64: string;
      content_type: string;
      latency_ms: number;
      attempts: Array<{ provider: VoiceProvider; ok: boolean; error?: string; latency_ms: number }>;
    }
  | {
      ok: false;
      turn_id: string;
      error: string;
      attempts: Array<{ provider: VoiceProvider; ok: boolean; error?: string; latency_ms: number }>;
    };

export async function speak(
  supabase: SupabaseClient,
  input: SpeakInput,
): Promise<SpeakResult> {
  // Load session for company + language context.
  const { data: session, error: sErr } = await supabase
    .from("voice_sessions")
    .select("id, company_id, language, provider, voice_id, style")
    .eq("id", input.sessionId)
    .single();
  if (sErr || !session) throw new Error(`session_not_found: ${sErr?.message ?? "missing"}`);

  const language = resolveLanguage(input.text, {
    requested: input.language ?? "auto",
    companyLanguage: (session.language as SupportedLanguage) ?? "en",
  });

  // Insert pending turn row up front so we can attribute latency + errors.
  const { data: turnRow, error: tErr } = await supabase
    .from("voice_turns")
    .insert({
      session_id: input.sessionId,
      role: "assistant",
      kind: "audio",
      text: input.text,
      language,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (tErr || !turnRow) throw new Error(`create_turn_failed: ${tErr?.message}`);
  const turnId = turnRow.id as string;

  const t0 = Date.now();
  const result = await synthesizeWithFallback(
    supabase,
    {
      companyId: session.company_id,
      language,
      preferredProvider: input.provider ?? (session.provider as VoiceProvider),
      preferredVoiceId: input.voice_id ?? (session.voice_id as string),
    },
    input.text,
    { format: input.format ?? "mp3" },
  );
  const latency = Date.now() - t0;

  if (!result.ok) {
    await supabase
      .from("voice_turns")
      .update({
        kind: "text",
        ended_at: new Date().toISOString(),
        latency_ms: latency,
        timings: { error: result.error, attempts: result.attempts },
      })
      .eq("id", turnId);
    await touchSession(supabase, input.sessionId);
    return { ok: false, turn_id: turnId, error: result.error, attempts: result.attempts };
  }

  const audio = result.audio;
  // Rough duration estimate (no decoder in worker): use text char rate at
  // ~15 chars/sec unless provider returns timing. Renderers should prefer
  // provider-supplied timing when integrated later.
  const estimatedDuration = Math.max(400, Math.round((input.text.length / 15) * 1000));
  const timeline = buildTimelineFromProvider(input.text, estimatedDuration, undefined);
  // We always fall through to estimated in this environment; keep source honest.
  const timelineFinal: SpeechTimeline = timeline.source === "estimated" ? timeline : buildEstimatedTimeline(input.text, estimatedDuration);

  const audio_base64 = arrayBufferToBase64(audio);

  await supabase
    .from("voice_turns")
    .update({
      ended_at: new Date().toISOString(),
      audio_bytes: audio.byteLength,
      duration_ms: timelineFinal.duration_ms,
      latency_ms: latency,
      provider: result.selected.provider,
      voice_id: result.selected.voice_id,
      timings: timelineFinal,
    })
    .eq("id", turnId);
  await touchSession(supabase, input.sessionId);

  return {
    ok: true,
    turn_id: turnId,
    selected: result.selected,
    timeline: timelineFinal,
    audio_base64,
    content_type: result.content_type,
    latency_ms: latency,
    attempts: result.attempts,
  };
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export type InterruptInput = {
  sessionId: string;
  turnId?: string | null;
  cause: "user_speak" | "user_cancel" | "network" | "timeout" | "provider_error" | "system";
  from_state?: string;
  to_state?: string;
  offset_ms?: number;
  note?: string;
};

export async function interruptSession(
  supabase: SupabaseClient,
  input: InterruptInput,
): Promise<{ interruption_id: string }> {
  const { data, error } = await supabase
    .from("voice_interruptions")
    .insert({
      session_id: input.sessionId,
      turn_id: input.turnId ?? null,
      cause: input.cause,
      from_state: input.from_state ?? null,
      to_state: input.to_state ?? null,
      offset_ms: input.offset_ms ?? null,
      note: input.note ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`interrupt_failed: ${error?.message}`);
  if (input.turnId) {
    await supabase
      .from("voice_turns")
      .update({ interrupted: true, ended_at: new Date().toISOString() })
      .eq("id", input.turnId);
  }
  await touchSession(supabase, input.sessionId);
  return { interruption_id: data.id as string };
}

export async function listTurns(
  supabase: SupabaseClient,
  sessionId: string,
  limit = 100,
): Promise<Array<Record<string, JsonValue>>> {
  const { data, error } = await supabase
    .from("voice_turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("started_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`list_turns_failed: ${error.message}`);
  return (data ?? []) as unknown as Array<Record<string, JsonValue>>;
}

export async function reconnectSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<VoiceSessionRow> {
  return transitionSessionStatus(supabase, sessionId, "active");
}

export type ProviderHealthRow = {
  provider: VoiceProvider;
  ok: boolean;
  latency_ms: number | null;
  error: string | null;
  checked_at: string;
};

/** Real health probe: attempts a tiny synth per available provider. */
export async function probeProviders(
  supabase: SupabaseClient,
): Promise<ProviderHealthRow[]> {
  const availability = availableVoiceProviders();
  const providers = (Object.keys(availability) as VoiceProvider[]).filter((p) => availability[p]);
  const results: ProviderHealthRow[] = [];
  for (const provider of providers) {
    const t0 = Date.now();
    const { synthesizeSpeech } = await import("@/lib/happy-runtime/voice");
    const r = await synthesizeSpeech({
      provider,
      voice_id: provider === "elevenlabs" ? "21m00Tcm4TlvDq8ikWAM" : "alloy",
      text: "ok",
      format: "mp3",
    });
    const latency = Date.now() - t0;
    const row: ProviderHealthRow = {
      provider,
      ok: r.ok,
      latency_ms: latency,
      error: r.ok ? null : r.error,
      checked_at: new Date().toISOString(),
    };
    results.push(row);
    await supabase.from("voice_provider_health").insert({
      provider,
      ok: r.ok,
      latency_ms: latency,
      error: r.ok ? null : r.error.slice(0, 500),
    });
  }
  return results;
}

export type VoiceAnalytics = {
  window_start: string;
  window_end: string;
  sessions: number;
  total_duration_ms: number;
  interruptions: number;
  avg_latency_ms: number | null;
  failure_rate: number;
  by_provider: Record<string, number>;
  by_language: Record<string, number>;
  provider_health: Record<string, { ok: boolean; latency_ms: number | null; checked_at: string }>;
};

export async function computeAnalytics(
  supabase: SupabaseClient,
  companyId?: string | null,
  windowHours = 24,
): Promise<VoiceAnalytics> {
  const start = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
  const end = new Date().toISOString();

  const sessionsQ = supabase
    .from("voice_sessions")
    .select("id, status, provider, language, started_at, ended_at, company_id")
    .gte("started_at", start);
  const { data: sessions, error: sErr } = companyId
    ? await sessionsQ.eq("company_id", companyId)
    : await sessionsQ;
  if (sErr) throw new Error(`analytics_sessions_failed: ${sErr.message}`);

  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  const turnsQ = supabase
    .from("voice_turns")
    .select("session_id, duration_ms, latency_ms, provider, language, kind")
    .in("session_id", sessionIds.length ? sessionIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: turns } = await turnsQ;

  const intQ = supabase
    .from("voice_interruptions")
    .select("id, session_id")
    .in("session_id", sessionIds.length ? sessionIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: interruptions } = await intQ;

  const by_provider: Record<string, number> = {};
  const by_language: Record<string, number> = {};
  let totalDuration = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let assistantTurns = 0;
  let failedTurns = 0;
  for (const t of turns ?? []) {
    const p = (t.provider as string) ?? "unknown";
    by_provider[p] = (by_provider[p] ?? 0) + 1;
    const l = (t.language as string) ?? "unknown";
    by_language[l] = (by_language[l] ?? 0) + 1;
    if (typeof t.duration_ms === "number") totalDuration += t.duration_ms;
    if (typeof t.latency_ms === "number") { latencySum += t.latency_ms; latencyCount++; }
    if (t.kind === "audio" || t.kind === "text") assistantTurns++;
    if (t.kind === "text" && !t.duration_ms) failedTurns++;
  }

  const { data: latestHealth } = await supabase
    .from("voice_provider_health")
    .select("provider, ok, latency_ms, checked_at")
    .gte("checked_at", start)
    .order("checked_at", { ascending: false });
  const provider_health: VoiceAnalytics["provider_health"] = {};
  for (const h of latestHealth ?? []) {
    const p = h.provider as string;
    if (!provider_health[p]) {
      provider_health[p] = {
        ok: h.ok as boolean,
        latency_ms: (h.latency_ms as number | null) ?? null,
        checked_at: h.checked_at as string,
      };
    }
  }

  return {
    window_start: start,
    window_end: end,
    sessions: sessions?.length ?? 0,
    total_duration_ms: totalDuration,
    interruptions: interruptions?.length ?? 0,
    avg_latency_ms: latencyCount ? Math.round(latencySum / latencyCount) : null,
    failure_rate: assistantTurns ? failedTurns / assistantTurns : 0,
    by_provider,
    by_language,
    provider_health,
  };
}
