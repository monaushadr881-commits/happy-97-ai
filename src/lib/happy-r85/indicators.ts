/**
 * R85 — Conversation indicator selection.
 * Pure mapping used by the desk panel to render a single, calm
 * status indicator (listening / thinking / speaking / typing / idle).
 */

export type IndicatorKind = "idle" | "listening" | "thinking" | "typing" | "speaking";

export interface IndicatorInput {
  listening: boolean;
  delivering: boolean;
  activeTask: boolean;
  panelOpen: boolean;
  userTypingWithinMs: number; // ms since last keystroke
}

export function pickIndicator(i: IndicatorInput): IndicatorKind {
  if (i.delivering) return "speaking";
  if (i.listening) return "listening";
  if (i.activeTask) return "thinking";
  if (i.panelOpen && i.userTypingWithinMs < 1500) return "typing";
  return "idle";
}

export function indicatorLabel(k: IndicatorKind): string {
  switch (k) {
    case "listening": return "Listening";
    case "thinking": return "Thinking";
    case "typing": return "Typing";
    case "speaking": return "Speaking";
    default: return "Here";
  }
}
