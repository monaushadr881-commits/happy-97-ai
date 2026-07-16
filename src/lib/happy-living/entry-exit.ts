/**
 * R75 — Entry / Exit choreography.
 * Deterministic time-based schedule; no per-frame allocations.
 */
export type ChoreoStep = { at_ms: number; action: string };

export function planEntry(): ChoreoStep[] {
  return [
    { at_ms: 0, action: "look-toward-user" },
    { at_ms: 220, action: "micro-smile" },
    { at_ms: 380, action: "turn" },
    { at_ms: 620, action: "walk-start" },
    { at_ms: 1900, action: "stop-at-greeting-distance" },
    { at_ms: 2050, action: "eye-contact-lock" },
    { at_ms: 2200, action: "greet" },
  ];
}

export function planExit(): ChoreoStep[] {
  return [
    { at_ms: 0, action: "closing-line" },
    { at_ms: 900, action: "turn" },
    { at_ms: 1100, action: "walk-back" },
    { at_ms: 2600, action: "return-to-waiting-position" },
    { at_ms: 2750, action: "resume-office-mode" },
  ];
}
