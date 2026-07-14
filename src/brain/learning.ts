const obs: Array<{ module: string; at: string; intent: string; capability: string; confidence: number }> = [];
export const learningEngine = {
  observe(module: string, e: { intent: string; capability: string; confidence: number; reflection: unknown }) {
    obs.push({ module, at: new Date().toISOString(), intent: e.intent, capability: e.capability, confidence: e.confidence });
    if (obs.length > 500) obs.splice(0, obs.length - 500);
  },
  digest() {
    return {
      total: obs.length,
      avgConfidence: obs.reduce((a, o) => a + o.confidence, 0) / Math.max(1, obs.length),
      recent: obs.slice(-10),
    };
  },
};
