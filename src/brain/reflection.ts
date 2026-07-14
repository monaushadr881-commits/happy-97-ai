export const reflectionEngine = {
  evaluate(input: { validation?: { quality?: number; output?: boolean }; confidence?: number } | undefined) {
    const q = input?.validation?.quality ?? 1;
    const c = input?.confidence ?? 0.8;
    const complete = (input?.validation?.output ?? true) && q >= 0.8;
    // Internal only. Never expose to end users.
    return {
      complete,
      quality: q,
      confidence: c,
      note: complete ? "answer-complete" : "needs-followup",
    };
  },
};
