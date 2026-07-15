/**
 * R42 Emotion & Expression Runtime — canonical contracts.
 *
 * All values are renderer-independent. Renderers (Portrait/Layered/Live2D/Live3D)
 * consume these types; this runtime never touches DOM/canvas/WebGL.
 */

export const EMOTIONS = [
  "neutral","greeting","happy","confident","listening","thinking","speaking","teaching",
  "presentation","business","founder","research","approval","concern","empathy","curiosity",
  "celebration","busy","offline",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const MOODS = [
  "calm","professional","friendly","energetic","serious","supportive","focused","learning","executive",
] as const;
export type Mood = (typeof MOODS)[number];

export const GESTURES = [
  "idle","greeting","wave","point_left","point_right","explain","present","teach",
  "listen","think","celebrate","thank_you","goodbye",
] as const;
export type GestureIntent = (typeof GESTURES)[number];

export const BEHAVIOR_MODES = [
  "founder","business","receptionist","sales","support","research","meeting","learning","presentation",
] as const;
export type BehaviorMode = (typeof BEHAVIOR_MODES)[number];

export const PRESENCE_STATES = [
  "available","greeting","listening","thinking","speaking","teaching","presenting","busy","offline",
] as const;
export type PresenceState = (typeof PRESENCE_STATES)[number];

export type ExpressionFrame = {
  t_ms: number;
  duration_ms: number;
  eye_open: number;      // 0..1
  blink: boolean;
  double_blink: boolean;
  smile_amount: number;  // 0..1
  jaw_intent: number;    // 0..1
  brow_intent: number;   // -1..1
  head_turn: number;     // -1..1
  head_tilt: number;     // -1..1
  shoulder_intent: number; // -1..1
  hand_gesture: GestureIntent;
  body_pose: string;
  breathing_level: number;  // 0..1
  attention_level: number;  // 0..1
  interest_level: number;   // 0..1
  speaking_energy: number;  // 0..1
  viseme_sync_ref: string | null;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export type EmotionState = {
  emotion: Emotion;
  mood: Mood;
  presence: PresenceState;
  behavior_mode: BehaviorMode;
  emotion_weight: number;
  mood_weight: number;
  confidence: number;
  source: string;
  evidence: { [k: string]: JsonValue };
  timestamp: string;
};

export function isEmotion(v: unknown): v is Emotion {
  return typeof v === "string" && (EMOTIONS as readonly string[]).includes(v);
}
export function isMood(v: unknown): v is Mood {
  return typeof v === "string" && (MOODS as readonly string[]).includes(v);
}
export function isGesture(v: unknown): v is GestureIntent {
  return typeof v === "string" && (GESTURES as readonly string[]).includes(v);
}
export function isBehaviorMode(v: unknown): v is BehaviorMode {
  return typeof v === "string" && (BEHAVIOR_MODES as readonly string[]).includes(v);
}
