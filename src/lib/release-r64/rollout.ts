/** R64 — staged rollout state machine. */
import type { RolloutState, RolloutPercent } from "./contracts";
import { ROLLOUT_STEPS } from "./contracts";

const ALLOWED: Record<RolloutState, RolloutState[]> = {
  planned: ["active", "cancelled"],
  active: ["paused", "completed", "rolled_back", "cancelled"],
  paused: ["active", "cancelled", "rolled_back"],
  completed: ["rolled_back"],
  cancelled: [],
  rolled_back: [],
};

export function canRolloutTransition(from: RolloutState, to: RolloutState): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function nextRolloutStep(current: number, target: number): RolloutPercent | null {
  const clamped = Math.max(0, Math.min(100, current));
  const next = ROLLOUT_STEPS.find((s) => s > clamped && s <= target);
  return (next as RolloutPercent) ?? null;
}

export function validateRolloutPercent(p: number): boolean {
  return (ROLLOUT_STEPS as number[]).includes(p) || p === 0;
}
