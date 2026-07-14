import type { BrainRequest } from "./kernel";
const BLOCK = /\b(drop\s+table|rm\s+-rf|sudo\s+rm|;\s*shutdown)\b/i;
export const safetyEngine = {
  check(req: BrainRequest) {
    const text = `${req.input ?? ""} ${req.goal ?? ""}`;
    if (BLOCK.test(text)) return { ok: false as const, reason: "unsafe-input" };
    return { ok: true as const };
  },
};
