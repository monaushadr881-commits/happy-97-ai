/**
 * R88 — Unified global context bus.
 *
 * A single in-browser channel that lets any subsystem (builder, deploy,
 * CRM, notifications, analytics, digital human) publish a snapshot of
 * "where the user is right now" so HAPPY can behave like an operating
 * system rather than a floating chatbot.
 *
 * Pure DOM CustomEvent transport — no new architecture, no new tables.
 * Reuses the same event pattern already used by the delivery bus
 * (`HAPPY_DELIVER_EVENT`) and task bus (`HAPPY_TASK_EVENT`).
 */

export const HAPPY_CONTEXT_EVENT = "happy:context";

export type ContextSubsystem =
  | "builder" | "founder" | "crm" | "erp" | "hrms" | "marketplace"
  | "production" | "release" | "notifications" | "analytics" | "support"
  | "learning" | "documentation" | "digital-human" | "core";

export type SubsystemStatus = "idle" | "active" | "warning" | "error";

export interface ContextSignal {
  subsystem: ContextSubsystem;
  status: SubsystemStatus;
  label?: string;
  detail?: string;
  at: number;
}

export interface GlobalContext {
  route?: string;
  workspaceMode?: string;
  activeTaskLabel?: string;
  activeGoal?: string;
  buildId?: string;
  deploymentId?: string;
  errorsSeen: number;
  notificationsPending: number;
  subsystems: Partial<Record<ContextSubsystem, ContextSignal>>;
  updatedAt: number;
}

export function emptyContext(): GlobalContext {
  return { errorsSeen: 0, notificationsPending: 0, subsystems: {}, updatedAt: 0 };
}

export function mergeContext(prev: GlobalContext, patch: Partial<GlobalContext>): GlobalContext {
  const next: GlobalContext = {
    ...prev,
    ...patch,
    subsystems: { ...prev.subsystems, ...(patch.subsystems ?? {}) },
    updatedAt: Date.now(),
  };
  return next;
}

export function applySignal(prev: GlobalContext, signal: ContextSignal): GlobalContext {
  const errors = signal.status === "error" ? prev.errorsSeen + 1 : prev.errorsSeen;
  return {
    ...prev,
    errorsSeen: errors,
    subsystems: { ...prev.subsystems, [signal.subsystem]: signal },
    updatedAt: Date.now(),
  };
}

/** Fire-and-forget publish; safe in SSR. */
export function publishContext(patch: Partial<GlobalContext> | ContextSignal): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(HAPPY_CONTEXT_EVENT, { detail: patch }));
  } catch { /* environments without CustomEvent — ignore */ }
}

/** Summarize context into a one-line phrase HAPPY can speak. */
export function summarizeContext(ctx: GlobalContext): string {
  const bits: string[] = [];
  if (ctx.activeTaskLabel) bits.push(`working on ${ctx.activeTaskLabel}`);
  else if (ctx.route) bits.push(`on ${ctx.route}`);
  if (ctx.errorsSeen > 0) bits.push(`${ctx.errorsSeen} issue${ctx.errorsSeen === 1 ? "" : "s"} today`);
  if (ctx.notificationsPending > 0) bits.push(`${ctx.notificationsPending} pending`);
  const activeSubs = Object.values(ctx.subsystems).filter((s): s is ContextSignal => !!s && s.status === "active");
  if (activeSubs.length) bits.push(`${activeSubs.length} subsystem${activeSubs.length === 1 ? "" : "s"} active`);
  return bits.length ? `You're ${bits.join(", ")}.` : "All quiet.";
}
