/**
 * R88 — Smart daily memory.
 *
 * Rolling one-day summary of what HAPPY observed: completed tasks,
 * pending tasks, interrupted tasks, suggestions, and a conversation
 * summary line. Purely local (localStorage) — respects existing
 * privacy controls; no server writes.
 */

export interface DailyMemory {
  date: string;              // YYYY-MM-DD (local)
  completed: string[];
  pending: string[];
  interrupted: string[];
  suggestions: string[];
  conversationSummary?: string;
}

const KEY = "happy.r88.daily-memory.v1";
const MAX_ITEMS = 40;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function storage(): Storage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

export function loadDaily(): DailyMemory {
  const s = storage();
  const fresh: DailyMemory = { date: today(), completed: [], pending: [], interrupted: [], suggestions: [] };
  if (!s) return fresh;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as DailyMemory;
    if (parsed.date !== today()) return fresh; // auto-roll at midnight
    return parsed;
  } catch { return fresh; }
}

export function saveDaily(m: DailyMemory): void {
  const s = storage(); if (!s) return;
  try { s.setItem(KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

function push(list: string[], item: string): string[] {
  const trimmed = item.trim();
  if (!trimmed) return list;
  const deduped = list.filter((x) => x !== trimmed);
  return [trimmed, ...deduped].slice(0, MAX_ITEMS);
}

export type DailyEventKind = "completed" | "pending" | "interrupted" | "suggestion" | "summary";

export function recordDaily(m: DailyMemory, kind: DailyEventKind, label: string): DailyMemory {
  const base: DailyMemory = m.date === today() ? m : { ...m, date: today(), completed: [], pending: [], interrupted: [], suggestions: [] };
  switch (kind) {
    case "completed":  return { ...base, completed: push(base.completed, label), pending: base.pending.filter((x) => x !== label) };
    case "pending":    return { ...base, pending: push(base.pending, label) };
    case "interrupted":return { ...base, interrupted: push(base.interrupted, label) };
    case "suggestion": return { ...base, suggestions: push(base.suggestions, label) };
    case "summary":    return { ...base, conversationSummary: label.slice(0, 400) };
  }
}

/** One-line human summary of today's work — used by end-of-session recap. */
export function dailySummaryLine(m: DailyMemory): string {
  const parts: string[] = [];
  if (m.completed.length) parts.push(`finished ${m.completed.length} task${m.completed.length === 1 ? "" : "s"}`);
  if (m.pending.length)   parts.push(`${m.pending.length} still open`);
  if (m.interrupted.length) parts.push(`${m.interrupted.length} interrupted`);
  if (!parts.length) return "Quiet day so far.";
  return `Today: ${parts.join(", ")}.`;
}
