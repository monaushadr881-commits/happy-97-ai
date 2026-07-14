import type { IntentKind } from "./intent";
export const conversationBrain = {
  compose(inp: { intent: IntentKind; capability: string; exec: { totalMs: number }; validation: { quality: number }; confidence: number }) {
    return {
      speaker: "HAPPY",
      persona: "digital-human",
      intent: inp.intent,
      capability: inp.capability,
      summary: `Handled ${inp.intent} via ${inp.capability}.`,
      latencyMs: inp.exec.totalMs,
      confidence: inp.confidence,
      quality: inp.validation.quality,
    };
  },
};
