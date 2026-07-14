const marks: Record<string, { ok: number; err: number; totalMs: number }> = Object.create(null);
export const analyticsEngine = {
  mark(module: string, ms: number, ok: boolean) {
    const m = (marks[module] ??= { ok: 0, err: 0, totalMs: 0 });
    m.totalMs += ms;
    if (ok) m.ok += 1; else m.err += 1;
  },
  digest() {
    return Object.entries(marks).map(([module, v]) => ({
      module, ok: v.ok, err: v.err,
      avgMs: Math.round(v.totalMs / Math.max(1, v.ok + v.err)),
      successRate: v.ok / Math.max(1, v.ok + v.err),
    }));
  },
};
