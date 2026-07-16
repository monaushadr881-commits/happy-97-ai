/**
 * R82 — HAPPY delivery bus (visible messages HAPPY personally delivers).
 *
 * Any part of the app dispatches `window.dispatchEvent(new CustomEvent(
 * "happy:deliver", { detail: { kind, message, tone } }))` and HAPPY walks
 * out from the desk, presents the message, then walks back.
 *
 * Reuse only — no DB, no RBAC, no external service.
 */

export type DeliveryTone = "info" | "success" | "warn" | "critical";
export type DeliveryKind =
  | "deployment" | "build" | "payment" | "order"
  | "task" | "review" | "message" | "alert" | "generic";

export type DeliveryEvent = {
  kind: DeliveryKind;
  message: string;
  tone?: DeliveryTone;
};

export const HAPPY_DELIVER_EVENT = "happy:deliver";

export function deliver(evt: DeliveryEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HAPPY_DELIVER_EVENT, { detail: evt }));
}

/** Idle corner per top-level route surface so HAPPY never overlaps important UI. */
export type DeskCorner = "br" | "bl" | "tr" | "tl";
export function deskCornerFor(route: string): DeskCorner {
  if (route.startsWith("/_authenticated/builder") || route.startsWith("/builder")) return "bl";
  if (route.startsWith("/_authenticated/analytics") || route.startsWith("/analytics")) return "tr";
  if (route.startsWith("/_authenticated/founder")) return "tl";
  return "br";
}
