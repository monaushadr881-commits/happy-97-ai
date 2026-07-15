/**
 * R42 — expression frame synthesis.
 *
 * Deterministic mapping from EmotionState → ExpressionFrame[]. Renderer-agnostic;
 * frames describe *intent* only. Blink cadence and breathing are seeded from
 * emotion + confidence — no random drift, no fake facial animation.
 */

import type { EmotionState, ExpressionFrame, GestureIntent } from "./contracts";
import { inferGesture } from "./mapping";

type ExpressionBase = {
  smile: number; jaw: number; brow: number; head_turn: number; head_tilt: number;
  breathing: number; attention: number; interest: number; speaking_energy: number;
  pose: string;
};

const BASE: Record<string, ExpressionBase> = {
  neutral:      { smile: 0.10, jaw: 0.00, brow: 0.00, head_turn: 0.00, head_tilt: 0.00, breathing: 0.50, attention: 0.55, interest: 0.50, speaking_energy: 0.00, pose: "neutral" },
  greeting:     { smile: 0.75, jaw: 0.10, brow: 0.20, head_turn: 0.10, head_tilt: 0.05, breathing: 0.55, attention: 0.80, interest: 0.75, speaking_energy: 0.35, pose: "open" },
  happy:        { smile: 0.85, jaw: 0.05, brow: 0.25, head_turn: 0.05, head_tilt: 0.10, breathing: 0.60, attention: 0.75, interest: 0.80, speaking_energy: 0.40, pose: "open" },
  confident:    { smile: 0.45, jaw: 0.05, brow: 0.10, head_turn: 0.00, head_tilt: 0.00, breathing: 0.55, attention: 0.85, interest: 0.70, speaking_energy: 0.30, pose: "upright" },
  listening:    { smile: 0.20, jaw: 0.00, brow: 0.05, head_turn: 0.05, head_tilt: 0.15, breathing: 0.45, attention: 0.95, interest: 0.90, speaking_energy: 0.00, pose: "attentive" },
  thinking:     { smile: 0.10, jaw: 0.00, brow: -0.20, head_turn: 0.15, head_tilt: 0.10, breathing: 0.40, attention: 0.70, interest: 0.65, speaking_energy: 0.00, pose: "reflective" },
  speaking:     { smile: 0.35, jaw: 0.55, brow: 0.10, head_turn: 0.10, head_tilt: 0.00, breathing: 0.65, attention: 0.80, interest: 0.75, speaking_energy: 0.75, pose: "expressive" },
  teaching:     { smile: 0.45, jaw: 0.45, brow: 0.15, head_turn: 0.20, head_tilt: 0.05, breathing: 0.60, attention: 0.85, interest: 0.85, speaking_energy: 0.65, pose: "instructive" },
  presentation: { smile: 0.55, jaw: 0.45, brow: 0.25, head_turn: 0.25, head_tilt: 0.05, breathing: 0.65, attention: 0.90, interest: 0.85, speaking_energy: 0.80, pose: "stage" },
  business:     { smile: 0.25, jaw: 0.10, brow: 0.05, head_turn: 0.00, head_tilt: 0.00, breathing: 0.50, attention: 0.85, interest: 0.70, speaking_energy: 0.30, pose: "upright" },
  founder:      { smile: 0.35, jaw: 0.10, brow: 0.10, head_turn: 0.05, head_tilt: 0.00, breathing: 0.55, attention: 0.90, interest: 0.80, speaking_energy: 0.35, pose: "executive" },
  research:     { smile: 0.10, jaw: 0.00, brow: -0.15, head_turn: 0.05, head_tilt: 0.10, breathing: 0.45, attention: 0.90, interest: 0.85, speaking_energy: 0.10, pose: "reflective" },
  approval:     { smile: 0.55, jaw: 0.05, brow: 0.15, head_turn: 0.00, head_tilt: 0.05, breathing: 0.55, attention: 0.85, interest: 0.80, speaking_energy: 0.25, pose: "affirming" },
  concern:      { smile: 0.05, jaw: 0.05, brow: -0.30, head_turn: -0.05, head_tilt: 0.15, breathing: 0.50, attention: 0.85, interest: 0.80, speaking_energy: 0.20, pose: "attentive" },
  empathy:      { smile: 0.25, jaw: 0.00, brow: -0.10, head_turn: 0.00, head_tilt: 0.20, breathing: 0.50, attention: 0.90, interest: 0.90, speaking_energy: 0.15, pose: "supportive" },
  curiosity:    { smile: 0.30, jaw: 0.05, brow: 0.20, head_turn: 0.10, head_tilt: 0.15, breathing: 0.55, attention: 0.85, interest: 0.90, speaking_energy: 0.20, pose: "inquisitive" },
  celebration:  { smile: 0.95, jaw: 0.20, brow: 0.30, head_turn: 0.10, head_tilt: 0.10, breathing: 0.70, attention: 0.85, interest: 0.90, speaking_energy: 0.55, pose: "elevated" },
  busy:         { smile: 0.05, jaw: 0.00, brow: -0.05, head_turn: 0.00, head_tilt: 0.00, breathing: 0.45, attention: 0.55, interest: 0.40, speaking_energy: 0.00, pose: "occupied" },
  offline:      { smile: 0.00, jaw: 0.00, brow: 0.00, head_turn: 0.00, head_tilt: 0.00, breathing: 0.35, attention: 0.10, interest: 0.10, speaking_energy: 0.00, pose: "away" },
};

const BLINK_INTERVAL_MS = 3200;
const DOUBLE_BLINK_EVERY = 5;

export function synthesizeFrames(
  state: EmotionState,
  opts: { window_ms?: number; tick_ms?: number; gesture?: GestureIntent } = {},
): ExpressionFrame[] {
  const window_ms = Math.max(200, Math.min(60_000, opts.window_ms ?? 3200));
  const tick_ms = Math.max(50, Math.min(1000, opts.tick_ms ?? 200));
  const base = BASE[state.emotion] ?? BASE.neutral;
  const w = state.emotion_weight;
  const gesture = opts.gesture ?? inferGesture(state).intent;

  const frames: ExpressionFrame[] = [];
  let blinkCount = 0;
  for (let t = 0; t < window_ms; t += tick_ms) {
    const blink = t > 0 && t % BLINK_INTERVAL_MS < tick_ms;
    if (blink) blinkCount += 1;
    const doubleBlink = blink && blinkCount % DOUBLE_BLINK_EVERY === 0;
    frames.push({
      t_ms: t,
      duration_ms: tick_ms,
      eye_open: blink ? 0 : 1,
      blink,
      double_blink: doubleBlink,
      smile_amount: clamp01(base.smile * w),
      jaw_intent: clamp01(base.jaw * w),
      brow_intent: clampSigned(base.brow * w),
      head_turn: clampSigned(base.head_turn * w),
      head_tilt: clampSigned(base.head_tilt * w),
      shoulder_intent: clampSigned(base.head_turn * 0.5 * w),
      hand_gesture: gesture,
      body_pose: base.pose,
      breathing_level: clamp01(base.breathing),
      attention_level: clamp01(base.attention),
      interest_level: clamp01(base.interest),
      speaking_energy: clamp01(base.speaking_energy * w),
      viseme_sync_ref: null,
    });
  }
  return frames;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function clampSigned(n: number) { return Math.max(-1, Math.min(1, n)); }
