/**
 * R42 — synchronized conversation/emotion/expression/presence/voice timelines.
 *
 * Merges recorded events into a single ordered timeline for founder dashboards
 * and downstream renderers. Purely read-side — never writes.
 */

export type TimelineEntry = {
  t: string; // ISO timestamp
  kind: "emotion" | "expression" | "gesture" | "mood" | "voice" | "presence" | "turn";
  session_id: string | null;
  payload: Record<string, unknown>;
};

export function mergeTimeline(streams: TimelineEntry[][]): TimelineEntry[] {
  const merged = streams.flat();
  merged.sort((a, b) => a.t.localeCompare(b.t));
  return merged;
}

export function windowTimeline(entries: TimelineEntry[], from: string, to: string): TimelineEntry[] {
  return entries.filter((e) => e.t >= from && e.t <= to);
}
