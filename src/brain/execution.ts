export const executionEngine = {
  run(plan: { steps: Array<{ id: string; name: string; ms: number }>; capability: string }, _priority: unknown) {
    const results = plan.steps.map((s) => ({ id: s.id, name: s.name, ok: true, ms: s.ms }));
    return {
      capability: plan.capability,
      mode: "sequential" as const,
      results,
      totalMs: results.reduce((a, r) => a + r.ms, 0),
      queueDepth: 0,
      cancelled: false,
    };
  },
};
