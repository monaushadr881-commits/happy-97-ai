// R117 — HAPPY Digital Human Intelligence (pure helpers, no new runtime).
// Extends the canonical owners:
//   • src/components/digital-human/HappyVRM.tsx       (renderer)
//   • src/components/digital-human/HappyAvatar.tsx    (fallback renderer)
//   • src/components/digital-human/conversation-engine.ts  (behaviour)
//   • src/lib/happy-cinematic/*                       (cinematic subsystems)
//   • src/lib/happy-r112/dh-extensions.ts             (idle/blink/breath)
//
// This module ADDS decision helpers (relationship, environment, gesture
// intelligence, voice personality, analytics) that call sites route through.
// No new avatar, no new VRM, no new animation engine.

import type {
  ConvoState,
  GestureCue,
  Intent,
  PostureCue,
  VoiceProfile,
} from "@/components/digital-human/conversation-engine";

/* ────────────────── Phase 3 · Natural human idle ────────────────── */

export type IdleTelemetry = {
  breathHz: number;         // breaths per second (~0.2)
  blinkEveryMs: number;     // mean interval between blinks
  microExpressionEveryMs: number;
  headSwayDeg: number;
  weightShiftEveryMs: number;
};

export function idleTelemetry(persona: "founder" | "admin" | "employee" | "customer" | "guest" = "guest"): IdleTelemetry {
  const focused = persona === "founder" || persona === "admin";
  return {
    breathHz: focused ? 0.22 : 0.2,
    blinkEveryMs: focused ? 4200 : 3800,
    microExpressionEveryMs: focused ? 9000 : 7000,
    headSwayDeg: focused ? 1.2 : 1.8,
    weightShiftEveryMs: focused ? 14000 : 11000,
  };
}

/* ────────────────── Phase 4 · Conversation behaviour ────────────── */

export type ConvoBehaviour =
  | "listening" | "thinking" | "talking" | "agreement" | "disagreement"
  | "question" | "explanation" | "celebration" | "concern";

export function behaviourFor(state: ConvoState, intent?: Intent): ConvoBehaviour {
  if (state === "listening") return "listening";
  if (state === "thinking") return "thinking";
  if (state === "speaking") {
    switch (intent) {
      case "congrats": return "celebration";
      case "warning": return "concern";
      case "teaching": return "explanation";
      case "creative": return "explanation";
      case "greeting":
      case "farewell": return "agreement";
      default: return "talking";
    }
  }
  return "listening";
}

/* ────────────────── Phase 5 · Gesture intelligence ─────────────── */

export type GestureContext =
  | "conversation" | "emotion" | "business" | "education"
  | "presentation" | "friend";

/**
 * Choose a gesture from intent + context. Never emits a random gesture;
 * callers get "none" if no cue is warranted. Ids stay aligned with
 * animations.json — no new gesture taxonomy is introduced.
 */
export function gestureIntelligence(intent: Intent, context: GestureContext): GestureCue {
  if (intent === "greeting") return context === "friend" ? "wave" : "greeting";
  if (intent === "farewell") return "goodbye";
  if (intent === "congrats") return "celebrate";
  if (intent === "warning") return "point";
  if (context === "presentation") {
    if (intent === "teaching") return "whiteboard";
    if (intent === "complex" || intent === "code") return "presentation";
    return "explain";
  }
  if (context === "education") return intent === "teaching" ? "teaching" : "explain";
  if (context === "business") return intent === "teaching" ? "presentation" : "explain";
  if (context === "friend") return intent === "short" ? "none" : "explain";
  if (context === "emotion") return "explain";
  // "conversation"
  return intent === "short" || intent === "general" ? "none" : "explain";
}

/* ────────────────── Phase 6 · Relationship engine ───────────────── */

export type RelationshipTier = "stranger" | "acquaintance" | "colleague" | "friend" | "founder";

export function relationshipTier(input: {
  interactions: number;
  daysKnown: number;
  founder?: boolean;
  employee?: boolean;
}): RelationshipTier {
  if (input.founder) return "founder";
  if (input.employee) return "colleague";
  if (input.interactions >= 40 && input.daysKnown >= 14) return "friend";
  if (input.interactions >= 8) return "acquaintance";
  return "stranger";
}

export function memoryAwareGreeting(input: {
  tier: RelationshipTier;
  firstName?: string | null;
  hourLocal: number;                // 0-23
  lastTopic?: string | null;
  daysSinceLast?: number;
}): string {
  const timeOfDay =
    input.hourLocal < 5 ? "Hello" :
    input.hourLocal < 12 ? "Good morning" :
    input.hourLocal < 17 ? "Good afternoon" :
    input.hourLocal < 22 ? "Good evening" : "Hello";
  const name = input.firstName ? `, ${input.firstName}` : "";
  const tail =
    input.lastTopic ? ` Want to pick up on ${input.lastTopic}?` :
    (input.daysSinceLast ?? 0) > 14 ? " Good to see you back." : "";
  switch (input.tier) {
    case "founder": return `${timeOfDay}${name}. Ready when you are.${tail}`;
    case "friend": return `${timeOfDay}${name}!${tail}`;
    case "colleague": return `${timeOfDay}${name}. How can I help today?${tail}`;
    case "acquaintance": return `${timeOfDay}${name}. Nice to see you again.${tail}`;
    default: return `${timeOfDay}. I'm HAPPY — how can I help?`;
  }
}

/* ────────────────── Phase 7 · Dynamic environment ───────────────── */

export type EnvironmentScene =
  | "office" | "board_room" | "coffee_shop" | "classroom"
  | "studio" | "virtual_space" | "future_lab";

export function pickEnvironment(input: {
  mode?: string | null;
  tier?: RelationshipTier;
  presentation?: boolean;
}): EnvironmentScene {
  if (input.presentation) return "board_room";
  const m = (input.mode ?? "").toLowerCase();
  if (m.includes("teach") || m.includes("tutor") || m.includes("language")) return "classroom";
  if (m.includes("creator") || m.includes("studio")) return "studio";
  if (m.includes("research") || m.includes("lab")) return "future_lab";
  if (m.includes("board") || m.includes("enterprise")) return "board_room";
  if (input.tier === "friend") return "coffee_shop";
  if (m.includes("virtual") || m.includes("meta")) return "virtual_space";
  return "office";
}

/* ────────────────── Phase 8 · Presentation surface ───────────────── */

export type PresentationSurface =
  | "none" | "whiteboard" | "roadmap" | "charts" | "slides"
  | "business_canvas" | "teaching";

export function presentationFor(intent: Intent, mode?: string | null): PresentationSurface {
  const m = (mode ?? "").toLowerCase();
  if (m.includes("teach") || intent === "teaching") return "teaching";
  if (m.includes("roadmap")) return "roadmap";
  if (m.includes("chart") || m.includes("analytics") || m.includes("bi")) return "charts";
  if (m.includes("canvas") || m.includes("business")) return "business_canvas";
  if (m.includes("slide") || m.includes("presentation")) return "slides";
  if (intent === "complex" || intent === "code") return "whiteboard";
  return "none";
}

/* ────────────────── Phase 9 · Cinematic entry variants ──────────── */

export type CinematicEntry =
  | "none" | "walk" | "bmw_m5" | "office" | "presentation" | "coffee" | "classroom";

/** Entry is opt-in per user preference; default is "none". */
export function pickEntry(input: {
  enabled?: boolean;
  preferred?: CinematicEntry;
  scene?: EnvironmentScene;
  tier?: RelationshipTier;
}): CinematicEntry {
  if (!input.enabled) return "none";
  if (input.preferred && input.preferred !== "none") return input.preferred;
  switch (input.scene) {
    case "board_room": return "presentation";
    case "classroom": return "classroom";
    case "coffee_shop": return "coffee";
    case "office": return "office";
    default: return input.tier === "founder" ? "bmw_m5" : "walk";
  }
}

/* ────────────────── Phase 10 · Voice personality ────────────────── */

export type VoicePersonality = VoiceProfile & {
  emotion: "neutral" | "warm" | "focused" | "excited" | "gentle" | "concerned";
  confidence: number;   // 0..1
  pauseScaleMs: number; // multiplier applied on top of sentencePauseScale
};

export function voicePersonality(base: VoiceProfile, intent: Intent, tier: RelationshipTier): VoicePersonality {
  const emotion: VoicePersonality["emotion"] =
    intent === "congrats" ? "excited" :
    intent === "warning" ? "concerned" :
    intent === "greeting" ? "warm" :
    intent === "teaching" ? "focused" :
    tier === "friend" ? "warm" : "neutral";
  const confidence =
    intent === "warning" ? 0.7 :
    intent === "greeting" ? 0.9 :
    intent === "teaching" ? 0.85 : 0.8;
  const pauseScaleMs = intent === "teaching" ? 1.15 : intent === "warning" ? 1.1 : 1.0;
  return { ...base, emotion, confidence, pauseScaleMs };
}

/* ────────────────── Phase 11 · DH analytics ─────────────────────── */

export type DHFrame = {
  gesture: GestureCue;
  behaviour: ConvoBehaviour;
  posture: PostureCue;
  frameTimeMs: number;      // last render frame time
  eyeContact: boolean;
  speaking: boolean;
  at: number;               // Date.now()
};

export type DHAnalytics = {
  frames: number;
  avgFrameTimeMs: number;
  p95FrameTimeMs: number;
  speakingMs: number;
  eyeContactRatio: number;
  gestureUsage: Record<string, number>;
  expressionUsage: Record<string, number>;
};

export function analyticsSnapshot(frames: DHFrame[]): DHAnalytics {
  if (!frames.length) {
    return {
      frames: 0, avgFrameTimeMs: 0, p95FrameTimeMs: 0,
      speakingMs: 0, eyeContactRatio: 0,
      gestureUsage: {}, expressionUsage: {},
    };
  }
  const times = frames.map((f) => f.frameTimeMs).sort((a, b) => a - b);
  const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))];
  const avg = times.reduce((s, x) => s + x, 0) / times.length;
  const speakingCount = frames.filter((f) => f.speaking).length;
  const eyeCount = frames.filter((f) => f.eyeContact).length;
  const gestureUsage: Record<string, number> = {};
  const expressionUsage: Record<string, number> = {};
  for (const f of frames) {
    gestureUsage[f.gesture] = (gestureUsage[f.gesture] ?? 0) + 1;
    expressionUsage[f.behaviour] = (expressionUsage[f.behaviour] ?? 0) + 1;
  }
  // Approximate speaking ms via avg frame time * speaking frames.
  const speakingMs = Math.round(speakingCount * avg);
  return {
    frames: frames.length,
    avgFrameTimeMs: Math.round(avg * 100) / 100,
    p95FrameTimeMs: Math.round(p95 * 100) / 100,
    speakingMs,
    eyeContactRatio: Math.round((eyeCount / frames.length) * 100) / 100,
    gestureUsage,
    expressionUsage,
  };
}
