import type { IntentKind } from "./intent";
import type { BrainRequest } from "./kernel";

export const reasoningEngine = {
  analyze(req: BrainRequest, intent: IntentKind, memory: unknown[]) {
    const goal = req.goal ?? req.input ?? "respond";
    const constraints = req.constraints ?? [];
    return {
      goal,
      intent,
      constraints,
      dependencies: constraints.length,
      alternatives: [`${intent}.primary`, `${intent}.secondary`],
      recommended: `${intent}.primary`,
      confidence: Math.min(0.95, 0.55 + memory.length * 0.05 + (constraints.length ? 0.1 : 0)),
      risks: constraints.length > 3 ? ["complexity-high"] : [],
    };
  },
};
