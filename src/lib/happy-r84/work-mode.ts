/**
 * R84 — Focus / meeting / learning modes (pure logic).
 *
 * Given lightweight signals (recent keystrokes, route, question repeats),
 * decide how HAPPY should behave: focused user → hush, presenter route →
 * presentation posture, repeated questions → adapt tutoring depth.
 */

export type WorkMode = "focus" | "meeting" | "learning" | "normal";

export interface WorkModeInput {
  route: string;
  keystrokesLastMinute: number;
  mouseMovesLastMinute: number;
  hasOpenPanel: boolean;
  askedSameTopicCount: number;
  now: number;
  lastInterruptionAt: number | null;
}

export interface WorkModeDecision {
  mode: WorkMode;
  allowSuggestions: boolean;
  posture: "focused" | "presentation" | "coaching" | "standing";
  reason: string;
}

const MEETING_ROUTE = /(present|demo|meeting|showcase|slides?)/i;
const FOCUS_KEYSTROKES = 60;      // ~1/sec typing
const RESPECT_COOLDOWN_MS = 45_000;

export function decideMode(input: WorkModeInput): WorkModeDecision {
  if (MEETING_ROUTE.test(input.route)) {
    return {
      mode: "meeting",
      allowSuggestions: false,
      posture: "presentation",
      reason: "Presentation route — HAPPY switches to presentation posture.",
    };
  }
  const focused = input.keystrokesLastMinute >= FOCUS_KEYSTROKES && !input.hasOpenPanel;
  if (focused) {
    return {
      mode: "focus",
      allowSuggestions: false,
      posture: "focused",
      reason: "Deep work detected — HAPPY stays quiet until you pause.",
    };
  }
  if (input.askedSameTopicCount >= 2) {
    return {
      mode: "learning",
      allowSuggestions: true,
      posture: "coaching",
      reason: "You've asked about this before — HAPPY adapts the explanation.",
    };
  }
  const cooling = input.lastInterruptionAt !== null
    && (input.now - input.lastInterruptionAt) < RESPECT_COOLDOWN_MS;
  return {
    mode: "normal",
    allowSuggestions: !cooling,
    posture: "standing",
    reason: cooling ? "Just spoke — giving you a moment." : "Available.",
  };
}

export type TutorLevel = "beginner" | "intermediate" | "advanced";

export function tutorLevelFor(askCount: number): TutorLevel {
  if (askCount <= 1) return "beginner";
  if (askCount <= 3) return "intermediate";
  return "advanced";
}

const EXPLAIN_PREFIX: Record<TutorLevel, string> = {
  beginner: "Here's the plain-English version: ",
  intermediate: "You've seen this before — quick recap: ",
  advanced: "Straight to the nuance: ",
};

export function adaptExplanation(base: string, level: TutorLevel): string {
  return EXPLAIN_PREFIX[level] + base;
}
