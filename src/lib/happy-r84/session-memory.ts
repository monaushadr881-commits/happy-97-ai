/**
 * R84 — Session memory (pure logic).
 *
 * Tracks, within the active session, what the user opened / edited /
 * skipped / postponed, plus a rolling task log. No persistence, no DB —
 * purely in-memory reducer so behaviour is deterministic and testable.
 */

export type SessionEventKind = "opened" | "edited" | "skipped" | "postponed" | "task";

export interface SessionEvent {
  kind: SessionEventKind;
  label: string;
  at: number;
  meta?: Record<string, string | number | undefined>;
}

export interface SessionState {
  events: SessionEvent[];
  routesVisited: string[];
  postponedTasks: string[];
  askedTopics: Record<string, number>;
}

export function initialSession(): SessionState {
  return { events: [], routesVisited: [], postponedTasks: [], askedTopics: {} };
}

const MAX_EVENTS = 100;
const MAX_ROUTES = 30;

export function reduce(state: SessionState, event: SessionEvent): SessionState {
  const events = [...state.events, event].slice(-MAX_EVENTS);
  const next: SessionState = { ...state, events };

  if (event.kind === "opened") {
    const route = event.label;
    if (state.routesVisited[state.routesVisited.length - 1] !== route) {
      next.routesVisited = [...state.routesVisited, route].slice(-MAX_ROUTES);
    }
  }
  if (event.kind === "postponed") {
    if (!state.postponedTasks.includes(event.label)) {
      next.postponedTasks = [...state.postponedTasks, event.label];
    }
  }
  if (event.kind === "skipped") {
    next.postponedTasks = state.postponedTasks.filter((t) => t !== event.label);
  }
  return next;
}

export function noteAskedTopic(state: SessionState, topic: string): SessionState {
  return { ...state, askedTopics: { ...state.askedTopics, [topic]: (state.askedTopics[topic] ?? 0) + 1 } };
}

/** Resume line: the most useful unfinished thread the user left behind. */
export function resumeLine(state: SessionState): string | null {
  const pending = state.postponedTasks[state.postponedTasks.length - 1];
  if (pending) return `You postponed "${pending}" earlier — want to pick it back up?`;
  const lastEdit = [...state.events].reverse().find((e) => e.kind === "edited");
  if (lastEdit) return `Last thing you edited was "${lastEdit.label}". Continue there?`;
  const lastRoute = state.routesVisited[state.routesVisited.length - 2];
  if (lastRoute) return `Want to jump back to ${lastRoute}?`;
  return null;
}
