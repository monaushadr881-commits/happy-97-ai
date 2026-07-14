export const confidenceEngine = {
  score(inp: { reason?: { confidence?: number }; validation?: { quality?: number }; exec?: { results?: unknown[] } }) {
    const r = inp.reason?.confidence ?? 0.7;
    const q = inp.validation?.quality ?? 0.9;
    const n = (inp.exec?.results?.length ?? 1);
    return Math.max(0, Math.min(1, r * 0.5 + q * 0.4 + Math.min(0.1, n * 0.02)));
  },
};
