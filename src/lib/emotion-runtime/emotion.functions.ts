/**
 * R42 Emotion & Expression Runtime — server functions.
 *
 * Auth-gated RPCs. All writes go through RLS as the caller. No service_role.
 * Renderers never called here; only structured emotion/expression/gesture data.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeAnalytics, currentState, emitExpressionTimeline, listBehaviorProfiles,
  listExpressionFrames, listRecentEmotions, recordEmotion, recordGesture, snapshotMood,
} from "./engine";
import { BEHAVIOR_MODES, EMOTIONS, GESTURES, MOODS, PRESENCE_STATES } from "./contracts";

const EmotionEnum = z.enum(EMOTIONS);
const MoodEnum = z.enum(MOODS);
const GestureEnum = z.enum(GESTURES);
const ModeEnum = z.enum(BEHAVIOR_MODES);
const PresenceEnum = z.enum(PRESENCE_STATES);

const InputsSchema = z.object({
  behavior_mode: ModeEnum.optional(),
  intent: z.string().max(200).nullable().optional(),
  capability: z.string().max(200).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  presence: PresenceEnum.nullable().optional(),
  speaking: z.boolean().optional(),
  listening: z.boolean().optional(),
  thinking: z.boolean().optional(),
  founder_mode: z.boolean().optional(),
  greeting: z.boolean().optional(),
  approval_pending: z.boolean().optional(),
  celebration: z.boolean().optional(),
  concern: z.boolean().optional(),
  empathy: z.boolean().optional(),
  language: z.string().max(16).nullable().optional(),
  source: z.string().max(80).optional(),
  evidence: z.record(z.string(), z.any()).optional(),
});

const RecordEmotionInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  happy_session_id: z.string().uuid().nullable().optional(),
  voice_session_id: z.string().uuid().nullable().optional(),
  conversation_turn_id: z.string().uuid().nullable().optional(),
  inputs: InputsSchema,
});
export const recordEmotionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof RecordEmotionInput>) => RecordEmotionInput.parse(d))
  .handler(async ({ data, context }) => recordEmotion(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null,
    happySessionId: data.happy_session_id ?? null,
    voiceSessionId: data.voice_session_id ?? null,
    conversationTurnId: data.conversation_turn_id ?? null,
    inputs: data.inputs,
  }));

const StateSchema = z.object({
  emotion: EmotionEnum,
  mood: MoodEnum,
  presence: PresenceEnum,
  behavior_mode: ModeEnum,
  emotion_weight: z.number().min(0).max(1),
  mood_weight: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  evidence: z.record(z.string(), z.any()).default({}),
  timestamp: z.string(),
});

const EmitExpressionInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  happy_session_id: z.string().uuid().nullable().optional(),
  emotion_event_id: z.string().uuid().nullable().optional(),
  state: StateSchema,
  window_ms: z.number().int().min(200).max(60_000).optional(),
  tick_ms: z.number().int().min(50).max(1000).optional(),
  gesture: GestureEnum.optional(),
  viseme_sync_ref: z.string().nullable().optional(),
});
export const emitExpressionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof EmitExpressionInput>) => EmitExpressionInput.parse(d))
  .handler(async ({ data, context }) => emitExpressionTimeline(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null,
    happySessionId: data.happy_session_id ?? null,
    emotionEventId: data.emotion_event_id ?? null,
    state: data.state,
    window_ms: data.window_ms,
    tick_ms: data.tick_ms,
    gesture: data.gesture,
    viseme_sync_ref: data.viseme_sync_ref ?? null,
  }));

const RecordGestureInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  happy_session_id: z.string().uuid().nullable().optional(),
  emotion_event_id: z.string().uuid().nullable().optional(),
  state: StateSchema,
  override: GestureEnum.optional(),
  target: z.string().max(120).nullable().optional(),
});
export const recordGestureFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof RecordGestureInput>) => RecordGestureInput.parse(d))
  .handler(async ({ data, context }) => recordGesture(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null,
    happySessionId: data.happy_session_id ?? null,
    emotionEventId: data.emotion_event_id ?? null,
    state: data.state,
    override: data.override,
    target: data.target ?? null,
  }));

const SnapshotMoodInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  happy_session_id: z.string().uuid().nullable().optional(),
  window_start: z.string(),
  window_end: z.string(),
});
export const snapshotMoodFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SnapshotMoodInput>) => SnapshotMoodInput.parse(d))
  .handler(async ({ data, context }) => snapshotMood(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null,
    happySessionId: data.happy_session_id ?? null,
    windowStart: data.window_start,
    windowEnd: data.window_end,
  }));

const AnalyticsInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  happy_session_id: z.string().uuid().nullable().optional(),
  window_start: z.string(),
  window_end: z.string(),
  persist: z.boolean().optional(),
});
export const analyticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof AnalyticsInput>) => AnalyticsInput.parse(d))
  .handler(async ({ data, context }) => computeAnalytics(context.supabase, { userId: context.userId }, {
    companyId: data.company_id ?? null,
    happySessionId: data.happy_session_id ?? null,
    windowStart: data.window_start,
    windowEnd: data.window_end,
    persist: data.persist ?? false,
  }));

const ListEmotionsInput = z.object({
  happy_session_id: z.string().uuid().nullable().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});
export const listEmotionsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListEmotionsInput>) => ListEmotionsInput.parse(d))
  .handler(async ({ data, context }) => listRecentEmotions(context.supabase, { userId: context.userId }, {
    happySessionId: data.happy_session_id ?? null,
    limit: data.limit,
  }));

const ListFramesInput = z.object({
  happy_session_id: z.string().uuid(),
  limit: z.number().int().min(1).max(5000).optional(),
});
export const listFramesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListFramesInput>) => ListFramesInput.parse(d))
  .handler(async ({ data, context }) => listExpressionFrames(context.supabase, { userId: context.userId }, {
    happySessionId: data.happy_session_id,
    limit: data.limit,
  }));

export const listBehaviorProfilesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listBehaviorProfiles(context.supabase));

const CurrentStateInput = z.object({
  happy_session_id: z.string().uuid().nullable().optional(),
});
export const currentStateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof CurrentStateInput>) => CurrentStateInput.parse(d))
  .handler(async ({ data, context }) => currentState(context.supabase, { userId: context.userId }, {
    happySessionId: data.happy_session_id ?? null,
  }));
