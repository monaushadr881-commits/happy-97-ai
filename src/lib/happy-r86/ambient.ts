/**
 * R86 — Ambient presence timings.
 *
 * Pure functions that produce next-tick delays for blink, breath,
 * head-turn and posture shifts. Uses a small biased RNG so cadence
 * feels organic rather than metronomic.
 */

export interface AmbientProfile {
  blinkMinMs: number;
  blinkMaxMs: number;
  doubleBlinkChance: number;
  breathMs: [number, number];
  headTurnMs: [number, number];
  postureMs: [number, number];
}

export const DEFAULT_AMBIENT: AmbientProfile = {
  blinkMinMs: 2200,
  blinkMaxMs: 5800,
  doubleBlinkChance: 0.18,
  breathMs: [4800, 6400],
  headTurnMs: [7000, 14000],
  postureMs: [18000, 42000],
};

function rand(rng: () => number, a: number, b: number): number {
  return Math.round(a + (b - a) * rng());
}

/** Uniformly random blink delay with occasional double-blinks. */
export function nextBlinkMs(rng: () => number = Math.random, p: AmbientProfile = DEFAULT_AMBIENT): number {
  const base = rand(rng, p.blinkMinMs, p.blinkMaxMs);
  if (rng() < p.doubleBlinkChance) return Math.max(220, Math.round(base * 0.15));
  return base;
}

export function nextBreathMs(rng: () => number = Math.random, p: AmbientProfile = DEFAULT_AMBIENT): number {
  return rand(rng, p.breathMs[0], p.breathMs[1]);
}

export function nextHeadTurnMs(rng: () => number = Math.random, p: AmbientProfile = DEFAULT_AMBIENT): number {
  return rand(rng, p.headTurnMs[0], p.headTurnMs[1]);
}

export function nextPostureMs(rng: () => number = Math.random, p: AmbientProfile = DEFAULT_AMBIENT): number {
  return rand(rng, p.postureMs[0], p.postureMs[1]);
}

/**
 * Given the last N delays, ensure the next is not a near-repeat (within
 * 5%). Keeps ambient motion from settling into a mechanical rhythm.
 */
export function antiRepeat(next: number, recent: number[], tolerance = 0.05): number {
  const near = recent.some((r) => Math.abs(r - next) / Math.max(1, r) < tolerance);
  if (!near) return next;
  // nudge by ±12%
  const jitter = 1 + (Math.random() < 0.5 ? -0.12 : 0.12);
  return Math.round(next * jitter);
}
