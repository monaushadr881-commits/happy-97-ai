export const planningEngine = {
  build(reason: { goal: string; intent: string; alternatives: string[] }, capability: string) {
    const steps = [
      { id: "s1", name: "prepare-context", capability, ms: 8 },
      { id: "s2", name: "select-tools", capability, ms: 6 },
      { id: "s3", name: `execute-${reason.intent}`, capability, ms: 18 },
      { id: "s4", name: "compose-response", capability, ms: 6 },
    ];
    return {
      goal: reason.goal,
      capability,
      steps,
      timeline: steps.reduce((a, s) => a + s.ms, 0),
      milestones: ["planned", "executed", "validated", "delivered"],
      retryPolicy: { max: 2, backoffMs: 200 },
      rollback: true,
    };
  },
};
