/**
 * HAPPY Autonomous Mission System — pure lifecycle core.
 *
 * Extends `src/lib/happy-command/command-core.ts` (planning),
 * `agent-roster.ts` (agents) and the canonical audit log for persistence.
 * NO new table, NO new runtime, NO second approval engine.
 *
 * Lifecycle (canonical, ordered):
 *   GOAL → PLAN → TASKS → AGENTS → EXECUTION → VERIFICATION →
 *   RESULT → REPORT → MONITORING → IMPROVEMENT
 */

import { plan, type CommandPlan, type CommandTask } from "./command-core";
import type { HappyRiskLevel } from "./intent-registry";

export const MISSION_AUDIT_CATEGORY = "happy.mission";

export const MISSION_PHASES = [
  "goal",
  "plan",
  "tasks",
  "agents",
  "execution",
  "verification",
  "result",
  "report",
  "monitoring",
  "improvement",
] as const;

export type MissionPhase = (typeof MISSION_PHASES)[number];

export type MissionStatus =
  | "planned"
  | "awaiting_approval"
  | "running"
  | "verified"
  | "completed"
  | "aborted";

export interface MissionBlueprint {
  readonly goal: string;
  readonly intent: CommandPlan["intent"];
  readonly intentLabel: string;
  readonly risk: HappyRiskLevel;
  readonly requiresApproval: boolean;
  readonly targetRoute: string;
  readonly phases: readonly MissionPhase[];
  readonly tasks: readonly CommandTask[];
  readonly agents: readonly string[];
  readonly impact: string;
  readonly expectedResult: string;
  readonly reason: string;
}

/** GOAL → PLAN → TASKS → AGENTS, deterministic and side-effect free. */
export function buildMission(goal: string): MissionBlueprint {
  const p = plan(goal);
  const agents = Array.from(new Set(p.tasks.map((t) => t.agentTitle)));
  return {
    goal: p.command,
    intent: p.intent,
    intentLabel: p.intentLabel,
    risk: p.risk,
    requiresApproval: p.requiresApproval,
    targetRoute: p.targetRoute,
    phases: MISSION_PHASES,
    tasks: p.tasks,
    agents,
    impact: p.impact,
    expectedResult: p.expectedResult,
    reason: p.reason,
  };
}

export function nextPhase(current: MissionPhase): MissionPhase | null {
  const i = MISSION_PHASES.indexOf(current);
  return i >= 0 && i < MISSION_PHASES.length - 1
    ? (MISSION_PHASES[i + 1] as MissionPhase)
    : null;
}

export function isMissionPhase(value: unknown): value is MissionPhase {
  return (
    typeof value === "string" &&
    (MISSION_PHASES as readonly string[]).includes(value)
  );
}

export function phaseProgress(phase: MissionPhase): number {
  return Number(
    (((MISSION_PHASES.indexOf(phase) + 1) / MISSION_PHASES.length) * 100).toFixed(0),
  );
}

/** One persisted mission event, rebuilt from a canonical audit row. */
export interface MissionEvent {
  readonly id: string;
  readonly action: string;
  readonly phase: MissionPhase;
  readonly note: string | null;
  readonly occurredAt: string;
}

export interface MissionRecord {
  readonly id: string;
  readonly goal: string;
  readonly intentLabel: string;
  readonly risk: HappyRiskLevel;
  readonly status: MissionStatus;
  readonly phase: MissionPhase;
  readonly progress: number;
  readonly targetRoute: string;
  readonly approvalId: string | null;
  readonly agents: readonly string[];
  readonly startedAt: string;
  readonly events: readonly MissionEvent[];
}

export interface AuditRowLike {
  id: string;
  action: string;
  occurred_at: string;
  metadata: unknown;
}

function meta(row: AuditRowLike): Record<string, unknown> {
  return (row.metadata ?? {}) as Record<string, unknown>;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value ? value : fallback;
}

export function toMissionEvent(row: AuditRowLike): MissionEvent {
  const m = meta(row);
  return {
    id: row.id,
    action: row.action,
    phase: isMissionPhase(m['phase']) ? m['phase'] : "goal",
    note: typeof m['note'] === "string" ? m['note'] : null,
    occurredAt: row.occurred_at,
  };
}

/** Fold the start row + its events into one mission record. */
export function toMissionRecord(
  start: AuditRowLike,
  eventRows: readonly AuditRowLike[],
): MissionRecord {
  const m = meta(start);
  const events = eventRows.map(toMissionEvent);
  const last = events[events.length - 1];
  const aborted = events.some((e) => e.action === "abort");
  const phase: MissionPhase = last?.phase ?? "goal";

  const status: MissionStatus = aborted
    ? "aborted"
    : m['approval_id'] && !events.some((e) => e.action === "approve")
      ? "awaiting_approval"
      : phase === "improvement"
        ? "completed"
        : phase === "verification" || phase === "result"
          ? "verified"
          : events.length > 0
            ? "running"
            : "planned";

  const agents = Array.isArray(m['agents'])
    ? (m['agents'] as unknown[]).filter((a): a is string => typeof a === "string")
    : [];

  return {
    id: start.id,
    goal: str(m['goal'], ""),
    intentLabel: str(m['intent_label'], str(m['intent'], "unknown")),
    risk: (str(m['risk'], "low") as HappyRiskLevel),
    status,
    phase,
    progress: phaseProgress(phase),
    targetRoute: str(m['target_route'], "/mission-control"),
    approvalId: typeof m['approval_id'] === "string" ? m['approval_id'] : null,
    agents,
    startedAt: start.occurred_at,
    events,
  };
}
