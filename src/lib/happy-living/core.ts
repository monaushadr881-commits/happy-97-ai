/**
 * R75 — HAPPY Living AI Core.
 * Pure presentation-layer orchestrator. Reuses R71/R71.1/R71.2/R72/R73.
 * No DB, no RBAC, no side effects.
 */

export type LivingMode =
  | "office"        // idle observation
  | "attentive"    // user glancing / hovering
  | "engaged"      // active conversation
  | "walking-in"
  | "walking-out"
  | "presenting";

export type LivingCoreInput = {
  invoked: boolean;                  // "Hi HAPPY" / Call button / mic
  conversing: boolean;
  userIdleMs: number;
  reducedMotion: boolean;
  tier: "ultra" | "high" | "medium" | "low" | "battery";
};

export type LivingCoreState = {
  mode: LivingMode;
  breath: boolean;
  blink: boolean;
  eyeContact: boolean;
  walking: boolean;
  greetingArmed: boolean;
  closingArmed: boolean;
};

export function composeLivingCore(inp: LivingCoreInput): LivingCoreState {
  const walking = inp.invoked && !inp.conversing;
  const mode: LivingMode = inp.conversing
    ? "engaged"
    : inp.invoked
      ? "walking-in"
      : inp.userIdleMs > 45_000
        ? "office"
        : "attentive";
  return {
    mode,
    breath: true,
    blink: !inp.reducedMotion,
    eyeContact: mode === "engaged" || mode === "attentive",
    walking: walking && !inp.reducedMotion,
    greetingArmed: mode === "walking-in",
    closingArmed: mode === "engaged" && inp.userIdleMs > 12_000,
  };
}
