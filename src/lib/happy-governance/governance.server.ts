/**
 * R301 — Governance server resolver (SERVER ONLY).
 *
 * Resolves kill-switch state, budget usage and runaway counters from EXISTING
 * canonical surfaces only (`public.audit_logs`, existing credit ledger). It
 * creates no table and no second engine. Every read is performed with the
 * CALLER's RLS client — service-role privileges are never used as a substitute
 * for authorization.
 *
 * Fail-closed contract: when a required signal cannot be read, the returned
 * state is marked `unavailable` and the autonomy gate DENIES.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { KILL_SWITCH_UNKNOWN, type KillSwitchState } from "./kill-switch";
import { UNKNOWN_USAGE, ZERO_COUNTERS, type BudgetUsage, type RunawayCounters } from "./budget";
import type { GateDecision } from "./autonomy-gate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

export const GOVERNANCE_AUDIT_CATEGORY = "happy.governance";

/** Canonical kill-switch control actions recorded in `audit_logs`. */
export const KILL_ACTIONS = {
  globalStop: "kill_switch_global_engaged",
  globalRelease: "kill_switch_global_released",
  agentStop: "kill_switch_agent_engaged",
  agentRelease: "kill_switch_agent_released",
  missionCancel: "kill_switch_mission_cancelled",
  executionCancel: "kill_switch_execution_cancelled",
  autoShutdown: "kill_switch_auto_shutdown",
} as const;

interface ControlRow {
  action: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Reads the current kill-switch state. Latest control event per target wins.
 * Any read failure ⇒ `unavailable: true` (gate denies).
 */
export async function readKillSwitchState(sb: SB, companyId: string | null): Promise<KillSwitchState> {
  try {
    let q = sb
      .from("audit_logs")
      .select("action, occurred_at, metadata")
      .eq("category", GOVERNANCE_AUDIT_CATEGORY)
      .order("occurred_at", { ascending: false })
      .limit(500);
    if (companyId) q = q.or(`company_id.eq.${companyId},company_id.is.null`);
    const { data, error } = await q;
    if (error) return { ...KILL_SWITCH_UNKNOWN, reason: "Kill-switch log unreadable." };

    const rows = (data ?? []) as ControlRow[];
    let globalStopped: boolean | null = null;
    let globalReason: string | null = null;
    const agentState = new Map<string, boolean>();
    const missions = new Set<string>();
    const executions = new Set<string>();

    // Rows are newest-first: only record the first decision seen per target.
    for (const row of rows) {
      const m = row.metadata ?? {};
      const agentId = typeof m['agent_id'] === "string" ? m['agent_id'] : null;
      switch (row.action) {
        case KILL_ACTIONS.globalStop:
          if (globalStopped === null) {
            globalStopped = true;
            globalReason = typeof m['reason'] === "string" ? m['reason'] : "Global kill switch engaged.";
          }
          break;
        case KILL_ACTIONS.globalRelease:
          if (globalStopped === null) globalStopped = false;
          break;
        case KILL_ACTIONS.agentStop:
        case KILL_ACTIONS.autoShutdown:
          if (agentId && !agentState.has(agentId)) agentState.set(agentId, true);
          break;
        case KILL_ACTIONS.agentRelease:
          if (agentId && !agentState.has(agentId)) agentState.set(agentId, false);
          break;
        case KILL_ACTIONS.missionCancel:
          if (typeof m['mission_id'] === "string") missions.add(m['mission_id']);
          break;
        case KILL_ACTIONS.executionCancel:
          if (typeof m['correlation_id'] === "string") executions.add(m['correlation_id']);
          break;
        default:
          break;
      }
    }

    return {
      globalStopped: globalStopped === true,
      stoppedAgents: [...agentState.entries()].filter(([, stopped]) => stopped).map(([id]) => id),
      stoppedMissions: [...missions],
      cancelledCorrelations: [...executions],
      unavailable: false,
      reason: globalStopped === true ? globalReason : null,
    };
  } catch {
    return KILL_SWITCH_UNKNOWN;
  }
}

/**
 * Spend usage from the canonical credit ledger + governance audit trail.
 *
 * BLOCKED NOTE (R301 §17): the hosted database is currently paused, so the
 * ledger shape below could not be executed live. On ANY failure this returns
 * `UNKNOWN_USAGE` (`unavailable: true`), which the gate treats as a hard stop.
 * No client-supplied balance is ever trusted.
 */
export async function readBudgetUsage(
  sb: SB,
  input: { readonly companyId: string | null; readonly agentId: string | null; readonly missionId: string | null },
): Promise<BudgetUsage> {
  if (!input.companyId) return UNKNOWN_USAGE;
  const dayStart = new Date(Date.now() - 86_400_000).toISOString();
  const monthStart = new Date(Date.now() - 30 * 86_400_000).toISOString();
  try {
    const [{ data: ledger, error: ledgerErr }, { data: spend, error: spendErr }] = await Promise.all([
      sb
        .from("credit_ledger_entries")
        .select("direction, amount_credits, created_at")
        .eq("owner_id", input.companyId)
        .gte("created_at", monthStart)
        .limit(2000),
      sb
        .from("audit_logs")
        .select("occurred_at, metadata")
        .eq("category", GOVERNANCE_AUDIT_CATEGORY)
        .eq("action", "autonomy_spend_recorded")
        .eq("company_id", input.companyId)
        .gte("occurred_at", monthStart)
        .limit(2000),
    ]);
    if (ledgerErr || spendErr) return UNKNOWN_USAGE;

    let credited = 0;
    let debited = 0;
    for (const r of (ledger ?? []) as { direction: string; amount_credits: number | null }[]) {
      const amt = Number(r.amount_credits ?? 0);
      if (r.direction === "credit") credited += amt;
      else debited += amt;
    }

    let agentDaily = 0;
    let mission = 0;
    let daily = 0;
    let monthly = 0;
    for (const r of (spend ?? []) as { occurred_at: string; metadata: Record<string, unknown> | null }[]) {
      const m = r.metadata ?? {};
      const cost = typeof m['cost_credits'] === "number" ? m['cost_credits'] : 0;
      monthly += cost;
      const isToday = r.occurred_at >= dayStart;
      if (isToday) daily += cost;
      if (isToday && input.agentId && m['agent_id'] === input.agentId) agentDaily += cost;
      if (input.missionId && m['mission_id'] === input.missionId) mission += cost;
    }

    return {
      agentDailySpent: agentDaily,
      missionSpent: mission,
      dailySpent: daily,
      monthlySpent: monthly,
      remainingCredits: Math.max(0, credited - debited),
      unavailable: false,
    };
  } catch {
    return UNKNOWN_USAGE;
  }
}

/** Runaway counters for the current mission / correlation window. */
export async function readRunawayCounters(
  sb: SB,
  input: {
    readonly companyId: string | null;
    readonly agentId: string | null;
    readonly missionId: string | null;
    readonly correlationId: string | null;
    readonly delegationDepth?: number;
    readonly startedAtMs?: number;
  },
): Promise<RunawayCounters> {
  try {
    const since = new Date(Date.now() - 3_600_000).toISOString();
    let q = sb
      .from("audit_logs")
      .select("action, occurred_at, metadata")
      .eq("category", "happy.workforce")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(500);
    if (input.companyId) q = q.eq("company_id", input.companyId);
    const { data, error } = await q;
    if (error) return { ...ZERO_COUNTERS, delegationDepth: input.delegationDepth ?? 0 };

    const rows = (data ?? []) as ControlRow[];
    let steps = 0;
    let toolCalls = 0;
    let retries = 0;
    let identicalRepeats = 0;
    let consecutiveFailures = 0;
    let failureStreakOpen = true;

    for (const row of rows) {
      const m = row.metadata ?? {};
      const sameMission = input.missionId ? m['mission_id'] === input.missionId : true;
      if (!sameMission) continue;
      if (row.action === "execution_started") toolCalls += 1;
      if (row.action === "execution_requested") steps += 1;
      if (row.action === "execution_retried") retries += 1;
      if (input.correlationId && m['correlation_id'] === input.correlationId) identicalRepeats += 1;
      if (failureStreakOpen) {
        if (row.action === "execution_failed") consecutiveFailures += 1;
        else if (row.action === "execution_completed") failureStreakOpen = false;
      }
    }

    return {
      steps,
      elapsedMs: input.startedAtMs ? Math.max(0, Date.now() - input.startedAtMs) : 0,
      retries,
      toolCalls,
      delegationDepth: input.delegationDepth ?? 0,
      consecutiveFailures,
      identicalRepeats,
    };
  } catch {
    return { ...ZERO_COUNTERS, delegationDepth: input.delegationDepth ?? 0 };
  }
}

/** Immutable-by-convention governance audit record (R301 §10). */
export async function auditGateDecision(
  sb: SB,
  userId: string,
  decision: GateDecision,
  extra: Record<string, unknown> = {},
): Promise<string | null> {
  try {
    return await writeCanonicalAudit(sb, {
      category: GOVERNANCE_AUDIT_CATEGORY,
      action: decision.allowed ? "autonomy_gate_allowed" : "autonomy_gate_denied",
      entity_type: `happy.governance.${decision.audit.agent_id ?? "unassigned"}`,
      company_id: decision.audit.company_id ?? undefined,
      severity: decision.allowed ? "info" : decision.hardStop ? "critical" : "warning",
      metadata: {
        actor_user_id: userId,
        ...decision.audit,
        risk: decision.risk,
        reversibility: decision.reversibility,
        requires_approval: decision.requiresApproval,
        approval_id: decision.approvalId,
        cost_credits: decision.estimatedCost,
        remaining_budget: decision.remainingBudget,
        hard_stop: decision.hardStop,
        ...extra,
      },
    });
  } catch {
    return null;
  }
}

/** Records an auto-shutdown when a policy violation or runaway is detected. */
export async function autoShutdownAgent(
  sb: SB,
  input: { readonly userId: string; readonly companyId: string | null; readonly agentId: string | null; readonly reason: string },
): Promise<string | null> {
  try {
    return await writeCanonicalAudit(sb, {
      category: GOVERNANCE_AUDIT_CATEGORY,
      action: KILL_ACTIONS.autoShutdown,
      entity_type: `happy.governance.${input.agentId ?? "unassigned"}`,
      company_id: input.companyId ?? undefined,
      severity: "critical",
      metadata: { agent_id: input.agentId, reason: input.reason, engaged_by: "system", actor_user_id: input.userId },
    });
  } catch {
    return null;
  }
}

/**
 * Founder / platform-owner check. Uses the existing SECURITY DEFINER role
 * function through the CALLER's client — never a client-supplied flag and
 * never service-role privileges. Unreadable ⇒ false (fail closed).
 */
export async function isPlatformFounder(sb: SB, userId: string): Promise<boolean> {
  for (const fn of ["is_platform_founder", "is_ops_admin"] as const) {
    try {
      const { data, error } = await sb.rpc(fn, { _user_id: userId } as never);
      if (!error && Boolean(data)) return true;
    } catch {
      /* fall through — fail closed */
    }
  }
  return false;
}
