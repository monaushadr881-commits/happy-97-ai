/**
 * R112 — Digital Human behavior extensions.
 *
 * Pure helpers consumed by existing `HappyVRM` / `HappyAvatar` /
 * `conversation-engine`. NO new avatar, NO new runtime. Extends only.
 * Enumerated behaviors from Founder Mission:
 *   - Natural lip-sync, blinking, breathing, eye-contact, smile
 *   - Head tracking, gestures, walking, conversation expressions
 *   - Listening / Thinking / Whiteboard / Presentation / Roadmap /
 *     Consultant / Friend modes
 *   - Voice→Text fallback, interrupt recovery
 * All computed values plug into existing HappyVRM props — no rewrite.
 */

export type DHMode =
  | "idle" | "listening" | "thinking" | "speaking"
  | "whiteboard" | "presentation" | "roadmap"
  | "consultant" | "friend";

/** Randomized natural blink schedule (ms until next blink). */
export function nextBlinkDelay(rng: () => number = Math.random): number {
  // Human blink ~15-20/min → mean ~3500ms, jittered.
  return 2500 + Math.floor(rng() * 3000);
}

/** Idle breathing amplitude (0..1) for a given time (seconds). */
export function breathingAmplitude(tSec: number, bpm = 14): number {
  const w = (2 * Math.PI * bpm) / 60;
  return 0.5 + 0.5 * Math.sin(w * tSec); // 0..1 sine
}

/** Smile intensity (0..1) driven by sentiment [-1..1]. */
export function smileFromSentiment(sentiment: number): number {
  return Math.max(0, Math.min(1, sentiment));
}

/** Eye-contact strength (0..1) — higher when user is speaking or focused. */
export function eyeContactStrength(mode: DHMode, userSpeaking: boolean): number {
  if (userSpeaking) return 1;
  switch (mode) {
    case "listening":    return 0.95;
    case "consultant":   return 0.9;
    case "friend":       return 0.85;
    case "presentation": return 0.55; // glance at audience + slide
    case "whiteboard":   return 0.45; // often glances at board
    case "roadmap":      return 0.5;
    case "thinking":     return 0.3;  // avert gaze while thinking
    case "speaking":     return 0.7;
    default:             return 0.6;
  }
}

/** Posture bias per mode — feeds existing HappyVRM `postureCue` prop. */
export function postureBiasForMode(mode: DHMode) {
  switch (mode) {
    case "whiteboard":   return { spine: 0.05, head: -0.05 };
    case "presentation": return { spine: 0.08, head: 0.02 };
    case "roadmap":      return { spine: 0.06, head: 0.0 };
    case "consultant":   return { spine: 0.04, head: 0.03 };
    case "friend":       return { spine: -0.02, head: 0.05 };
    case "thinking":     return { spine: -0.03, head: -0.08 };
    case "listening":    return { spine: 0.02, head: 0.06 };
    case "speaking":     return { spine: 0.03, head: 0.02 };
    default:             return { spine: 0.0, head: 0.0 };
  }
}

/** Recovery plan after an interruption — reuses existing engine state names. */
export function interruptRecoveryPlan(prevMode: DHMode) {
  return {
    immediate: "listening" as DHMode,
    resumeAfterMs: 400,
    resumeMode: prevMode,
  };
}

/** Walk keyframe schedule (t=0..1) for smart-movement engine. */
export function walkKeyframes(distancePx: number, speedPxPerSec = 280) {
  const durationMs = Math.max(600, (distancePx / speedPxPerSec) * 1000);
  return {
    durationMs,
    steps: Math.max(2, Math.round(distancePx / 90)),
    swayHz: 1.7,
  };
}
