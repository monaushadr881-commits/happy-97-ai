/**
 * HAPPY OS — Workspace Memory (R21)
 * Client-side persistence of workspace preferences: pinned, favorites,
 * recent modules, search history, active workspace, active business,
 * layout preferences. All keys are namespaced under `happyx.ws.*`.
 * No PII, no secrets — only UX preferences.
 */

const K = {
  activeWorkspace: "happyx.ws.active.v1",
  activeBusiness: "happyx.ws.business.v1",
  recents: "happyx.ws.recents.v1",
  favorites: "happyx.ws.favorites.v1",
  history: "happyx.ws.history.v1",
  layout: "happyx.ws.layout.v1",
} as const;

const MAX_RECENTS = 12;
const MAX_HISTORY = 30;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export const workspaceMemory = {
  getActiveWorkspace: () => read<string | null>(K.activeWorkspace, null),
  setActiveWorkspace: (id: string) => write(K.activeWorkspace, id),

  getActiveBusiness: () => read<string | null>(K.activeBusiness, null),
  setActiveBusiness: (id: string) => write(K.activeBusiness, id),

  getRecents: () => read<string[]>(K.recents, []),
  pushRecent: (route: string) => {
    const cur = read<string[]>(K.recents, []).filter((r) => r !== route);
    cur.unshift(route);
    write(K.recents, cur.slice(0, MAX_RECENTS));
  },

  getFavorites: () => read<string[]>(K.favorites, []),
  toggleFavorite: (route: string): string[] => {
    const cur = read<string[]>(K.favorites, []);
    const next = cur.includes(route) ? cur.filter((r) => r !== route) : [...cur, route];
    write(K.favorites, next);
    return next;
  },
  setFavorites: (next: string[]) => write(K.favorites, next),

  getHistory: () => read<string[]>(K.history, []),
  pushHistory: (q: string) => {
    if (!q.trim()) return;
    const cur = read<string[]>(K.history, []).filter((v) => v !== q);
    cur.unshift(q);
    write(K.history, cur.slice(0, MAX_HISTORY));
  },

  getLayout: () => read<{ sidebar?: "expanded" | "collapsed" }>(K.layout, {}),
  setLayout: (patch: { sidebar?: "expanded" | "collapsed" }) => {
    const cur = read<Record<string, unknown>>(K.layout, {});
    write(K.layout, { ...cur, ...patch });
  },
};
