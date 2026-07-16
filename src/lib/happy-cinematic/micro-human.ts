/** R71.2 — deterministic micro-human schedules. Pure, no allocations per frame. */

export interface MicroHumanState {
  blinkOpen: number;      // 0..1
  smile: number;          // 0..1
  headTiltDeg: number;    // -3..3
  shoulderShiftPx: number;// -1.5..1.5
  fingerRelax: number;    // 0..1
  weightShift: number;    // -1..1
  breath: number;         // 0..1
}

/** cheap deterministic hash → [0,1) */
function h(x: number) {
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function sampleMicroHuman(tMs: number): MicroHumanState {
  const t = tMs / 1000;
  const blinkPhase = t / 3.6 + h(Math.floor(t / 3.6)) * 0.7;
  const blinkClose = Math.max(0, 1 - Math.abs((blinkPhase % 1) - 0.5) * 20);
  const smileWobble = 0.06 * Math.sin(t / 4.1) + 0.04 * Math.sin(t / 1.7 + 1.3);
  return {
    blinkOpen: 1 - blinkClose,
    smile: 0.35 + smileWobble,
    headTiltDeg: 2.4 * Math.sin(t / 5.3) + 0.6 * Math.sin(t / 1.9),
    shoulderShiftPx: 1.2 * Math.sin(t / 6.1 + 0.7),
    fingerRelax: 0.5 + 0.5 * Math.sin(t / 9.7),
    weightShift: Math.sin(t / 7.2),
    breath: 0.5 + 0.5 * Math.sin(t / 3.2),
  };
}
