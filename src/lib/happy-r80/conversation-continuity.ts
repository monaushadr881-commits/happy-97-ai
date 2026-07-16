/**
 * R80 — Conversation Continuity (pure logic).
 * Truncates + rehydrates conversation history so Happy can "resume"
 * naturally across sessions without ballooning token cost.
 */

export type ConvTurn = {
  role: "user" | "assistant" | "system";
  text: string;
  at: number; // epoch ms
};

export type ContinuityInput = {
  turns: ConvTurn[];
  nowMs: number;
  maxTurns?: number;
  staleAfterMs?: number; // treat older gap as fresh session
};

export type ContinuityResult = {
  resumed: boolean;
  gapMs: number;
  bridge: string | null;   // short natural sentence to prepend
  turns: ConvTurn[];        // trimmed rolling window
};

export function continue_(inp: ContinuityInput): ContinuityResult {
  const maxTurns = inp.maxTurns ?? 20;
  const staleAfter = inp.staleAfterMs ?? 6 * 60 * 60_000; // 6h
  const sorted = [...inp.turns].sort((a, b) => a.at - b.at);
  const trimmed = sorted.slice(-maxTurns);
  const last = trimmed[trimmed.length - 1];
  const gapMs = last ? inp.nowMs - last.at : 0;
  const resumed = !!last && gapMs > staleAfter;
  let bridge: string | null = null;
  if (resumed) {
    const hours = Math.round(gapMs / 3_600_000);
    bridge = hours < 24
      ? `Picking up from where we left off ${hours} hour${hours === 1 ? "" : "s"} ago.`
      : "Welcome back — I remember our last conversation.";
  }
  return { resumed, gapMs, bridge, turns: trimmed };
}
