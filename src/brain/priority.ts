export const priorityEngine = {
  rank(plan: { steps: Array<{ id: string; ms: number }> }) {
    return [...plan.steps].sort((a, b) => a.ms - b.ms).map((s, i) => ({ id: s.id, priority: i + 1 }));
  },
};
