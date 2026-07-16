/**
 * R84 — HAPPY Task Companion bus.
 *
 * A tiny in-browser event channel so any surface (builder, deploy, tests,
 * founder ops, notifications…) can announce task lifecycle events to
 * HAPPY without touching notifications/RBAC/DB. HappyDesk listens and
 * reacts visibly (posture, panel task strip, celebrations, blockers).
 *
 * Emit with `announceTask({...})`. HappyDesk keeps a small session log.
 */

export type TaskStatus = "started" | "progress" | "completed" | "failed" | "milestone";

export interface TaskEvent {
  id: string;                // stable per task
  label: string;             // "Deploy staging", "Builder — hero section", …
  status: TaskStatus;
  progress?: number;         // 0..1 for status="progress"
  detail?: string;           // short reason / next step
  milestone?: string;        // e.g. "100 tests passed", "Builder finished"
  at?: number;               // ms epoch, defaults to Date.now()
}

export const HAPPY_TASK_EVENT = "happy:task";

export function announceTask(evt: TaskEvent): void {
  if (typeof window === "undefined") return;
  const detail: TaskEvent = { at: Date.now(), ...evt };
  window.dispatchEvent(new CustomEvent<TaskEvent>(HAPPY_TASK_EVENT, { detail }));
}
