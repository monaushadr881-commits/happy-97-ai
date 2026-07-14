import type { IntentKind } from "./intent";

type MemEntry = { userId: string; intent: string; text: string; at: string; score: number };
const store: MemEntry[] = [];

export const memoryCoordinator = {
  recall(userId: string | undefined, intent: IntentKind, query: string) {
    const u = userId ?? "anonymous";
    return store
      .filter((m) => m.userId === u)
      .map((m) => ({ ...m, score: m.intent === intent ? m.score + 0.2 : m.score, match: query && m.text.toLowerCase().includes(query.toLowerCase()) ? 1 : 0 }))
      .sort((a, b) => (b.score + b.match) - (a.score + a.match))
      .slice(0, 5);
  },
  commit(userId: string | undefined, e: { intent: string; capability: string; response: unknown; at: string }) {
    store.push({ userId: userId ?? "anonymous", intent: e.intent, text: JSON.stringify(e.response).slice(0, 240), at: e.at, score: 0.5 });
    if (store.length > 500) store.splice(0, store.length - 500);
  },
  snapshot() {
    return {
      total: store.length,
      byUser: Object.entries(store.reduce<Record<string, number>>((a, m) => { a[m.userId] = (a[m.userId] ?? 0) + 1; return a; }, {})).map(([userId, count]) => ({ userId, count })),
      recent: store.slice(-10),
    };
  },
};
