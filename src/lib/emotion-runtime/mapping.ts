/**
 * R42 — deterministic input → emotion mapping.
 *
 * Inputs are structured signals from the Conversation, Voice, Brain, Memory,
 * Knowledge, Automation, Agent, and Founder runtimes. No LLM inference.
 */

import type {
  BehaviorMode, Emotion, EmotionState, GestureIntent, JsonValue, Mood, PresenceState,
} from "./contracts";
import { isBehaviorMode, isEmotion, isMood } from "./contracts";

export type EmotionInputs = {
  behavior_mode?: BehaviorMode;
  intent?: string | null;
  capability?: string | null;
  confidence?: number | null;
  presence?: PresenceState | null;
  speaking?: boolean;
  listening?: boolean;
  thinking?: boolean;
  founder_mode?: boolean;
  greeting?: boolean;
  approval_pending?: boolean;
  celebration?: boolean;
  concern?: boolean;
  empathy?: boolean;
  language?: string | null;
  source?: string;
  evidence?: { [k: string]: JsonValue };
};

const MODE_DEFAULTS: Record<BehaviorMode, { emotion: Emotion; mood: Mood; speech: string }> = {
  founder:      { emotion: "founder",      mood: "executive",    speech: "founder" },
  business:     { emotion: "business",     mood: "professional", speech: "business" },
  receptionist: { emotion: "greeting",     mood: "friendly",     speech: "neutral" },
  sales:        { emotion: "confident",    mood: "energetic",    speech: "business" },
  support:      { emotion: "empathy",      mood: "supportive",   speech: "neutral" },
  research:     { emotion: "research",     mood: "focused",      speech: "teaching" },
  meeting:      { emotion: "listening",    mood: "professional", speech: "business" },
  learning:     { emotion: "teaching",     mood: "learning",     speech: "teaching" },
  presentation: { emotion: "presentation", mood: "energetic",    speech: "presentation" },
};

const INTENT_TO_EMOTION: Record<string, Emotion> = {
  greeting: "greeting", hello: "greeting", welcome: "greeting",
  goodbye: "greeting", thanks: "happy",
  approve: "approval", approval: "approval",
  concern: "concern", warning: "concern", risk: "concern",
  celebrate: "celebration", success: "celebration",
  research: "research", analyze: "research",
  teach: "teaching", explain: "teaching",
  present: "presentation", demo: "presentation",
  business: "business", commerce: "business", finance: "business",
  empathy: "empathy", support: "empathy",
  curious: "curiosity", question: "curiosity",
};

export function classifyEmotion(inputs: EmotionInputs): EmotionState {
  const mode: BehaviorMode = isBehaviorMode(inputs.behavior_mode)
    ? inputs.behavior_mode
    : (inputs.founder_mode ? "founder" : "business");
  const defaults = MODE_DEFAULTS[mode];

  let emotion: Emotion = defaults.emotion;
  if (inputs.greeting) emotion = "greeting";
  else if (inputs.celebration) emotion = "celebration";
  else if (inputs.approval_pending) emotion = "approval";
  else if (inputs.concern) emotion = "concern";
  else if (inputs.empathy) emotion = "empathy";
  else if (inputs.thinking) emotion = "thinking";
  else if (inputs.listening) emotion = "listening";
  else if (inputs.speaking) emotion = "speaking";
  else if (inputs.intent) {
    const key = inputs.intent.toLowerCase().trim();
    const hit = INTENT_TO_EMOTION[key];
    if (hit && isEmotion(hit)) emotion = hit;
  }

  const mood: Mood = isMood(defaults.mood) ? defaults.mood : "professional";
  const presence: PresenceState = inputs.presence
    ?? (inputs.speaking ? "speaking"
      : inputs.listening ? "listening"
      : inputs.thinking ? "thinking"
      : "available");

  const rawConf = typeof inputs.confidence === "number" ? inputs.confidence : 0.7;
  const confidence = Math.max(0, Math.min(1, rawConf));

  return {
    emotion,
    mood,
    presence,
    behavior_mode: mode,
    emotion_weight: confidence,
    mood_weight: 1,
    confidence,
    source: inputs.source ?? "conversation",
    evidence: { intent: inputs.intent ?? null, capability: inputs.capability ?? null, ...(inputs.evidence ?? {}) },
    timestamp: new Date().toISOString(),
  };
}

const EMOTION_TO_GESTURE: Record<Emotion, GestureIntent> = {
  neutral: "idle", greeting: "greeting", happy: "celebrate", confident: "present",
  listening: "listen", thinking: "think", speaking: "explain", teaching: "teach",
  presentation: "present", business: "explain", founder: "present", research: "think",
  approval: "point_right", concern: "explain", empathy: "listen", curiosity: "think",
  celebration: "celebrate", busy: "idle", offline: "idle",
};

export function inferGesture(state: EmotionState): {
  intent: GestureIntent; intensity: number; duration_ms: number; reason: string;
} {
  const g = EMOTION_TO_GESTURE[state.emotion] ?? "idle";
  const intensity = Math.max(0.3, Math.min(1, state.emotion_weight));
  const duration = g === "idle" ? 1200 : 800 + Math.round(intensity * 600);
  return { intent: g, intensity, duration_ms: duration, reason: `emotion:${state.emotion}` };
}
