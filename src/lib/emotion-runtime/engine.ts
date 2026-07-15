/**
 * R42 Emotion & Expression Runtime — engine.
 *
 * Persists emotion events, expression frames, gesture intents, mood snapshots,
 * and analytics rollups via RLS as the caller. Never renders. Never fabricates.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyEmotion, inferGesture, type EmotionInputs } from "./mapping";
import { synthesizeFrames } from "./expression";
import type { BehaviorMode, Emotion, EmotionState, ExpressionFrame, GestureIntent, Mood } from "./contracts";

type Ctx = { userId: string };

export type RecordEmotionArgs = {
  companyId?: string | null;
  happySessionId?: string | null;
  voiceSessionId?: string | null;
  conversationTurnId?: string | null;
  inputs: EmotionInputs;
};

export async function recordEmotion(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: RecordEmotionArgs,
): Promise<{ state: EmotionState; emotion_event_id: string }> {
  const state = classifyEmotion(args.inputs);
  const { data, error } = await supabase.from("happy_emotion_events").insert({
    user_id: ctx.userId,
    company_id: args.companyId ?? null,
    happy_session_id: args.happySessionId ?? null,
    voice_session_id: args.voiceSessionId ?? null,
    conversation_turn_id: args.conversationTurnId ?? null,
    emotion: state.emotion,
    mood: state.mood,
    presence: state.presence,
    behavior_mode: state.behavior_mode,
    emotion_weight: state.emotion_weight,
    mood_weight: state.mood_weight,
    confidence: state.confidence,
    source: state.source,
    evidence: state.evidence,
    context: args.inputs as unknown as Record<string, unknown>,
  }).select("id").single();
  if (error) throw error;
  return { state, emotion_event_id: data.id as string };
}

export type EmitExpressionArgs = {
  companyId?: string | null;
  happySessionId?: string | null;
  emotionEventId?: string | null;
  state: EmotionState;
  window_ms?: number;
  tick_ms?: number;
  gesture?: GestureIntent;
  viseme_sync_ref?: string | null;
};

export async function emitExpressionTimeline(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: EmitExpressionArgs,
): Promise<{ frames: ExpressionFrame[]; frame_ids: string[] }> {
  const frames = synthesizeFrames(args.state, {
    window_ms: args.window_ms,
    tick_ms: args.tick_ms,
    gesture: args.gesture,
  });
  if (frames.length === 0) return { frames, frame_ids: [] };
  const rows = frames.map((f) => ({
    user_id: ctx.userId,
    company_id: args.companyId ?? null,
    happy_session_id: args.happySessionId ?? null,
    emotion_event_id: args.emotionEventId ?? null,
    t_ms: f.t_ms,
    duration_ms: f.duration_ms,
    eye_open: f.eye_open,
    blink: f.blink,
    double_blink: f.double_blink,
    smile_amount: f.smile_amount,
    jaw_intent: f.jaw_intent,
    brow_intent: f.brow_intent,
    head_turn: f.head_turn,
    head_tilt: f.head_tilt,
    shoulder_intent: f.shoulder_intent,
    hand_gesture: f.hand_gesture,
    body_pose: f.body_pose,
    breathing_level: f.breathing_level,
    attention_level: f.attention_level,
    interest_level: f.interest_level,
    speaking_energy: f.speaking_energy,
    viseme_sync_ref: args.viseme_sync_ref ?? null,
  }));
  const { data, error } = await supabase.from("happy_expression_frames").insert(rows).select("id");
  if (error) throw error;
  return { frames, frame_ids: (data ?? []).map((r) => r.id as string) };
}

export async function recordGesture(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: {
    companyId?: string | null;
    happySessionId?: string | null;
    emotionEventId?: string | null;
    state: EmotionState;
    override?: GestureIntent;
    target?: string | null;
  },
): Promise<{ id: string; intent: GestureIntent; intensity: number; duration_ms: number }> {
  const inferred = inferGesture(args.state);
  const intent = args.override ?? inferred.intent;
  const { data, error } = await supabase.from("happy_gesture_intents").insert({
    user_id: ctx.userId,
    company_id: args.companyId ?? null,
    happy_session_id: args.happySessionId ?? null,
    emotion_event_id: args.emotionEventId ?? null,
    intent,
    target: args.target ?? null,
    intensity: inferred.intensity,
    duration_ms: inferred.duration_ms,
    reason: inferred.reason,
    confidence: args.state.confidence,
  }).select("id").single();
  if (error) throw error;
  return { id: data.id as string, intent, intensity: inferred.intensity, duration_ms: inferred.duration_ms };
}

export async function snapshotMood(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: {
    companyId?: string | null;
    happySessionId?: string | null;
    windowStart: string;
    windowEnd: string;
  },
): Promise<{ mood: Mood; behavior_mode: BehaviorMode; average_energy: number; average_attention: number; sample_count: number; id: string | null }> {
  const { data: frames, error: fErr } = await supabase
    .from("happy_expression_frames")
    .select("speaking_energy, attention_level, happy_session_id")
    .eq("user_id", ctx.userId)
    .gte("created_at", args.windowStart)
    .lte("created_at", args.windowEnd);
  if (fErr) throw fErr;
  const { data: events, error: eErr } = await supabase
    .from("happy_emotion_events")
    .select("mood, behavior_mode")
    .eq("user_id", ctx.userId)
    .gte("created_at", args.windowStart)
    .lte("created_at", args.windowEnd)
    .order("created_at", { ascending: false })
    .limit(1);
  if (eErr) throw eErr;

  const count = frames?.length ?? 0;
  const avgEnergy = count === 0 ? 0 : (frames ?? []).reduce((s, r) => s + Number(r.speaking_energy ?? 0), 0) / count;
  const avgAttention = count === 0 ? 0 : (frames ?? []).reduce((s, r) => s + Number(r.attention_level ?? 0), 0) / count;
  const mood = ((events?.[0]?.mood as Mood) ?? "professional");
  const behavior = ((events?.[0]?.behavior_mode as BehaviorMode) ?? "business");

  const { data: ins, error: iErr } = await supabase.from("happy_mood_snapshots").insert({
    user_id: ctx.userId,
    company_id: args.companyId ?? null,
    happy_session_id: args.happySessionId ?? null,
    mood, behavior_mode: behavior,
    average_energy: avgEnergy,
    average_attention: avgAttention,
    window_start: args.windowStart,
    window_end: args.windowEnd,
    sample_count: count,
  }).select("id").single();
  if (iErr) throw iErr;

  return {
    mood, behavior_mode: behavior,
    average_energy: avgEnergy, average_attention: avgAttention,
    sample_count: count, id: (ins?.id as string) ?? null,
  };
}

export async function computeAnalytics(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: { companyId?: string | null; happySessionId?: string | null; windowStart: string; windowEnd: string; persist?: boolean },
) {
  const [{ data: events, error: eErr }, { data: gestures, error: gErr }, { data: frames, error: fErr }] = await Promise.all([
    supabase.from("happy_emotion_events")
      .select("emotion, behavior_mode, created_at")
      .eq("user_id", ctx.userId)
      .gte("created_at", args.windowStart).lte("created_at", args.windowEnd),
    supabase.from("happy_gesture_intents")
      .select("intent, duration_ms")
      .eq("user_id", ctx.userId)
      .gte("created_at", args.windowStart).lte("created_at", args.windowEnd),
    supabase.from("happy_expression_frames")
      .select("speaking_energy, attention_level, hand_gesture")
      .eq("user_id", ctx.userId)
      .gte("created_at", args.windowStart).lte("created_at", args.windowEnd),
  ]);
  if (eErr) throw eErr;
  if (gErr) throw gErr;
  if (fErr) throw fErr;

  const emotionDist: Record<string, number> = {};
  const modeDist: Record<string, number> = {};
  for (const e of events ?? []) {
    emotionDist[e.emotion as string] = (emotionDist[e.emotion as string] ?? 0) + 1;
    modeDist[e.behavior_mode as string] = (modeDist[e.behavior_mode as string] ?? 0) + 1;
  }
  const gestureDist: Record<string, number> = {};
  let listeningMs = 0;
  for (const g of gestures ?? []) {
    gestureDist[g.intent as string] = (gestureDist[g.intent as string] ?? 0) + 1;
    if (g.intent === "listen") listeningMs += Number(g.duration_ms ?? 0);
  }
  const usage: Record<string, number> = {};
  let energySum = 0; let attentionSum = 0;
  for (const f of frames ?? []) {
    usage[f.hand_gesture as string] = (usage[f.hand_gesture as string] ?? 0) + 1;
    energySum += Number(f.speaking_energy ?? 0);
    attentionSum += Number(f.attention_level ?? 0);
  }
  const frameCount = (frames ?? []).length;
  const avgEnergy = frameCount === 0 ? 0 : energySum / frameCount;
  const avgAttention = frameCount === 0 ? 0 : attentionSum / frameCount;
  const quality = Math.max(0, Math.min(1, 0.5 * avgAttention + 0.5 * (1 - Math.min(1, Math.abs(avgEnergy - 0.5) * 2))));

  const rollup = {
    emotion_distribution: emotionDist,
    mode_distribution: modeDist,
    gesture_distribution: gestureDist,
    expression_usage: usage,
    average_speaking_energy: avgEnergy,
    average_listening_time_ms: listeningMs,
    conversation_quality: quality,
    sample_count: (events ?? []).length,
    window_start: args.windowStart,
    window_end: args.windowEnd,
  };

  if (args.persist) {
    const { data, error } = await supabase.from("happy_emotion_analytics").insert({
      user_id: ctx.userId,
      company_id: args.companyId ?? null,
      happy_session_id: args.happySessionId ?? null,
      ...rollup,
    }).select("id").single();
    if (error) throw error;
    return { ...rollup, id: data.id as string };
  }
  return rollup;
}

export async function listRecentEmotions(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: { happySessionId?: string | null; limit?: number },
) {
  const q = supabase.from("happy_emotion_events")
    .select("id, emotion, mood, presence, behavior_mode, confidence, source, evidence, created_at, happy_session_id")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, args.limit ?? 100)));
  if (args.happySessionId) q.eq("happy_session_id", args.happySessionId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listExpressionFrames(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: { happySessionId: string; limit?: number },
) {
  const { data, error } = await supabase.from("happy_expression_frames")
    .select("*")
    .eq("user_id", ctx.userId)
    .eq("happy_session_id", args.happySessionId)
    .order("t_ms", { ascending: true })
    .limit(Math.max(1, Math.min(5000, args.limit ?? 500)));
  if (error) throw error;
  return data ?? [];
}

export async function listBehaviorProfiles(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("happy_behavior_profiles")
    .select("*").eq("is_active", true).order("code");
  if (error) throw error;
  return data ?? [];
}

export async function currentState(
  supabase: SupabaseClient,
  ctx: Ctx,
  args: { happySessionId?: string | null },
): Promise<EmotionState | null> {
  const q = supabase.from("happy_emotion_events")
    .select("emotion, mood, presence, behavior_mode, emotion_weight, mood_weight, confidence, source, evidence, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (args.happySessionId) q.eq("happy_session_id", args.happySessionId);
  const { data, error } = await q;
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    emotion: row.emotion as Emotion,
    mood: row.mood as Mood,
    presence: row.presence as EmotionState["presence"],
    behavior_mode: row.behavior_mode as BehaviorMode,
    emotion_weight: Number(row.emotion_weight),
    mood_weight: Number(row.mood_weight),
    confidence: Number(row.confidence),
    source: row.source as string,
    evidence: (row.evidence as Record<string, unknown>) ?? {},
    timestamp: row.created_at as string,
  };
}
