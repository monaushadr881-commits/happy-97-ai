/**
 * R80 — Initiative AI (pure logic).
 * Decides *when* Happy should proactively surface a suggestion so it feels
 * helpful, not spammy. Uses cooldowns + relevance thresholds.
 */

export type InitiativeSignal = {
  kind:
    | "repeated-error"
    | "slow-page"
    | "accessibility-issue"
    | "deployment-complete"
    | "build-failed"
    | "payment-received"
    | "new-customer"
    | "optimization"
    | "workflow-simplification";
  relevance: number; // 0..1
  detectedAt: number; // epoch ms
};

export type InitiativeInput = {
  signals: InitiativeSignal[];
  lastSuggestionAt: number | null;
  nowMs: number;
  reducedMotion: boolean;
  userBusy: boolean; // typing/dragging
};

export type InitiativeSuggestion = {
  kind: InitiativeSignal["kind"];
  message: string;
  urgency: "info" | "attention" | "critical";
};

const COOLDOWN_MS = 90_000;
const RELEVANCE_MIN = 0.55;

const MESSAGE: Record<InitiativeSignal["kind"], string> = {
  "repeated-error": "I noticed the same error a few times. Want me to look into it?",
  "slow-page": "This page is loading slowly. I found an optimization.",
  "accessibility-issue": "Accessibility could be improved here.",
  "deployment-complete": "Your deployment completed.",
  "build-failed": "The build failed. I have the log ready.",
  "payment-received": "A payment just arrived.",
  "new-customer": "A new customer just signed up.",
  "optimization": "I found an optimization for this workflow.",
  "workflow-simplification": "This workflow can be simplified.",
};

const URGENCY: Record<InitiativeSignal["kind"], InitiativeSuggestion["urgency"]> = {
  "repeated-error": "attention",
  "slow-page": "info",
  "accessibility-issue": "info",
  "deployment-complete": "info",
  "build-failed": "critical",
  "payment-received": "attention",
  "new-customer": "info",
  "optimization": "info",
  "workflow-simplification": "info",
};

export function pickInitiative(inp: InitiativeInput): InitiativeSuggestion | null {
  if (inp.userBusy) return null;
  if (inp.lastSuggestionAt !== null && inp.nowMs - inp.lastSuggestionAt < COOLDOWN_MS) return null;
  const relevant = inp.signals.filter((s) => s.relevance >= RELEVANCE_MIN);
  if (relevant.length === 0) return null;
  const best = [...relevant].sort((a, b) => b.relevance - a.relevance)[0];
  return { kind: best.kind, message: MESSAGE[best.kind], urgency: URGENCY[best.kind] };
}
