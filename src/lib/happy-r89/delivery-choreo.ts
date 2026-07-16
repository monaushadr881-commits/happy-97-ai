/**
 * R89 — Personal delivery choreography.
 *
 * Sequences the "walk to user → deliver message → wait naturally →
 * return to desk" flow used when HAPPY personally delivers deployment,
 * payment, order, review, or critical events. Pure timing plan; the UI
 * layer plays it back with existing translate/scale animations.
 *
 * Respects reduced-motion by compressing durations.
 */

import type { DeliveryTone } from "@/components/happy-desk/delivery-bus";

export type ChoreoStage =
  | "look"
  | "turn"
  | "walk-out"
  | "arrive"
  | "deliver"
  | "hold"
  | "walk-back"
  | "seated";

export interface ChoreoStep { at_ms: number; stage: ChoreoStage }

interface Options { tone?: DeliveryTone; reducedMotion?: boolean }

/** Plan a delivery timeline. Critical tones get a slightly firmer arrival. */
export function planDelivery(opts: Options = {}): ChoreoStep[] {
  const rm = opts.reducedMotion === true;
  const scale = rm ? 0.35 : 1;
  const critical = opts.tone === "critical";
  const holdMs = (critical ? 2600 : 1900) * scale;
  const walkMs = (critical ? 900 : 1100) * scale;

  const steps: ChoreoStep[] = [];
  let t = 0;
  steps.push({ at_ms: t, stage: "look" });                     t += 220 * scale;
  steps.push({ at_ms: t, stage: "turn" });                     t += 220 * scale;
  steps.push({ at_ms: t, stage: "walk-out" });                 t += walkMs;
  steps.push({ at_ms: t, stage: "arrive" });                   t += 140 * scale;
  steps.push({ at_ms: t, stage: "deliver" });                  t += holdMs;
  steps.push({ at_ms: t, stage: "hold" });                     t += 400 * scale;
  steps.push({ at_ms: t, stage: "walk-back" });                t += walkMs;
  steps.push({ at_ms: t, stage: "seated" });
  return steps;
}

export function totalDurationMs(steps: ChoreoStep[]): number {
  return steps.length ? steps[steps.length - 1].at_ms : 0;
}
