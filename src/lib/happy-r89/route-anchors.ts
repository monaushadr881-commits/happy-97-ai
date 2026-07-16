/**
 * R89 — Per-route position anchors for the Living Presence Runtime.
 *
 * Pure logic. Every top-level surface declares where HAPPY should stand
 * when idle, when in conversation, when delivering a notification, and
 * when presenting. The runtime reads these to avoid overlapping
 * important UI (Builder canvas, analytics charts, tables, dialogs).
 *
 * Coordinates are viewport corners, not pixel offsets — the stage
 * translates them per-viewport.
 */

export type Anchor = "br" | "bl" | "tr" | "tl" | "center-bottom" | "center-right";
export type PresenceMode = "idle" | "conversation" | "notification" | "presentation" | "return";

export interface RouteAnchors {
  idle: Anchor;
  conversation: Anchor;
  notification: Anchor;
  presentation: Anchor;
  return: Anchor;
}

const DEFAULT: RouteAnchors = {
  idle: "br",
  conversation: "center-bottom",
  notification: "center-bottom",
  presentation: "center-bottom",
  return: "br",
};

const MAP: Array<{ prefix: string; anchors: RouteAnchors }> = [
  { prefix: "/_authenticated/builder", anchors: { idle: "bl", conversation: "center-bottom", notification: "tl", presentation: "center-bottom", return: "bl" } },
  { prefix: "/builder",                anchors: { idle: "bl", conversation: "center-bottom", notification: "tl", presentation: "center-bottom", return: "bl" } },
  { prefix: "/_authenticated/analytics", anchors: { idle: "tr", conversation: "center-right", notification: "tr", presentation: "center-bottom", return: "tr" } },
  { prefix: "/_authenticated/founder", anchors: { idle: "tl", conversation: "center-right", notification: "tl", presentation: "center-bottom", return: "tl" } },
  { prefix: "/_authenticated/happy/presentation", anchors: { idle: "center-bottom", conversation: "center-bottom", notification: "center-bottom", presentation: "center-bottom", return: "center-bottom" } },
  { prefix: "/_authenticated/crm",     anchors: { idle: "br", conversation: "center-right", notification: "tr", presentation: "center-bottom", return: "br" } },
  { prefix: "/_authenticated/erp",     anchors: { idle: "br", conversation: "center-right", notification: "tr", presentation: "center-bottom", return: "br" } },
  { prefix: "/_authenticated/marketplace", anchors: { idle: "br", conversation: "center-bottom", notification: "tr", presentation: "center-bottom", return: "br" } },
  { prefix: "/_authenticated/support", anchors: { idle: "br", conversation: "center-bottom", notification: "br", presentation: "center-bottom", return: "br" } },
];

export function anchorsForRoute(pathname: string): RouteAnchors {
  for (const entry of MAP) {
    if (pathname.startsWith(entry.prefix)) return entry.anchors;
  }
  return DEFAULT;
}

export function anchorFor(pathname: string, mode: PresenceMode): Anchor {
  return anchorsForRoute(pathname)[mode];
}
