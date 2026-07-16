/**
 * R86 — Session restore.
 *
 * Persist a small slice of HAPPY's runtime state across browser refresh:
 * last route, workspace mode, dismissed suggestion kinds, last task
 * strip label. Pure functions with a guarded localStorage backing so
 * they work in SSR/tests.
 */

export interface RestorableSession {
  lastRoute?: string;
  lastTaskLabel?: string;
  workspaceMode?: string;
  dismissedSuggestions?: string[];
  savedAt?: number;
}

const KEY = "happy.r86.session.v1";
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

function storage(): Storage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

export function saveSession(patch: RestorableSession): void {
  const s = storage(); if (!s) return;
  try {
    const prev = loadSession() ?? {};
    const next: RestorableSession = { ...prev, ...patch, savedAt: Date.now() };
    s.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore quota */ }
}

export function loadSession(): RestorableSession | null {
  const s = storage(); if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RestorableSession;
    if (parsed.savedAt && Date.now() - parsed.savedAt > TTL_MS) {
      s.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

export function clearSession(): void {
  const s = storage(); if (!s) return;
  try { s.removeItem(KEY); } catch { /* ignore */ }
}
