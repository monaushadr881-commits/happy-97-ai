/**
 * R86 — Unified notification delivery gate.
 *
 * Small pure state machine used to decide whether HAPPY should surface
 * an incoming event now, defer it, or drop it. Enforces per-kind
 * cooldowns and refuses to interrupt an active conversation unless the
 * event is `critical`.
 */

export type NotificationKind =
  | "deployment" | "builder" | "payment" | "order" | "review" | "error" | "info";

export type NotificationTone = "info" | "success" | "warning" | "critical";

export interface Notification {
  id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  message: string;
  at: number;
}

export interface GateState {
  lastByKind: Record<NotificationKind, number>;
  lastAny: number;
}

export const initialGateState = (): GateState => ({ lastByKind: {} as Record<NotificationKind, number>, lastAny: 0 });

const KIND_COOLDOWN_MS: Record<NotificationKind, number> = {
  deployment: 20_000,
  builder: 15_000,
  payment: 8_000,
  order: 8_000,
  review: 30_000,
  error: 4_000,
  info: 45_000,
};

export interface GateDecision {
  deliver: boolean;
  defer: boolean;
  reason: "ok" | "cooldown" | "conversation" | "duplicate";
  nextState: GateState;
}

export interface GateContext {
  conversationActive: boolean;
  now?: number;
}

export function decideDelivery(state: GateState, n: Notification, ctx: GateContext): GateDecision {
  const now = ctx.now ?? n.at ?? Date.now();
  const cooldown = KIND_COOLDOWN_MS[n.kind] ?? 15_000;
  const lastKind = state.lastByKind[n.kind] ?? 0;

  if (ctx.conversationActive && n.tone !== "critical") {
    return { deliver: false, defer: true, reason: "conversation", nextState: state };
  }
  if (now - lastKind < cooldown && n.tone !== "critical") {
    return { deliver: false, defer: true, reason: "cooldown", nextState: state };
  }

  const nextState: GateState = {
    lastByKind: { ...state.lastByKind, [n.kind]: now },
    lastAny: now,
  };
  return { deliver: true, defer: false, reason: "ok", nextState };
}

/**
 * Coalesce a burst of same-kind notifications into a single summary
 * line, e.g. "3 builder tasks completed".
 */
export function coalesce(batch: Notification[]): Notification[] {
  if (batch.length < 2) return batch;
  const groups = new Map<string, Notification[]>();
  for (const n of batch) {
    const key = `${n.kind}:${n.tone}`;
    const arr = groups.get(key) ?? [];
    arr.push(n);
    groups.set(key, arr);
  }
  const out: Notification[] = [];
  for (const [, arr] of groups) {
    if (arr.length === 1) { out.push(arr[0]); continue; }
    const latest = arr[arr.length - 1];
    out.push({
      ...latest,
      message: `${arr.length} ${latest.kind} updates — latest: ${latest.message}`,
    });
  }
  return out.sort((a, b) => a.at - b.at);
}
