/**
 * R301 — Spending Control + Runaway Protection foundation (PURE).
 *
 * Budget/limit ARCHITECTURE only. Balances, credits and consumed amounts are
 * ALWAYS supplied by server-side reads (see `governance.server.ts`); this file
 * never trusts client state and performs no I/O.
 *
 * Extends `src/lib/revenue/credit-policy.ts` economics — it does NOT create a
 * second ledger, wallet or credit engine.
 */

import type { ActionClass } from "./action-classes";

export interface BudgetLimits {
  readonly perActionCredits: number;
  readonly perAgentDailyCredits: number;
  readonly perMissionCredits: number;
  readonly dailyCredits: number;
  readonly monthlyCredits: number;
  /** At or above this cost, Founder approval is mandatory regardless of class. */
  readonly approvalThresholdCredits: number;
}

/** Conservative defaults. Founder may only tighten these at call sites. */
export const DEFAULT_BUDGET_LIMITS: BudgetLimits = {
  perActionCredits: 50,
  perAgentDailyCredits: 500,
  perMissionCredits: 1_000,
  dailyCredits: 2_000,
  monthlyCredits: 20_000,
  approvalThresholdCredits: 25,
};

/** Server-derived consumption snapshot. Never hydrated from the client. */
export interface BudgetUsage {
  readonly agentDailySpent: number;
  readonly missionSpent: number;
  readonly dailySpent: number;
  readonly monthlySpent: number;
  /** Remaining spendable balance as reported by the canonical ledger. */
  readonly remainingCredits: number;
  /** True when the ledger could not be read — treated as a HARD STOP. */
  readonly unavailable: boolean;
}

export const UNKNOWN_USAGE: BudgetUsage = {
  agentDailySpent: 0,
  missionSpent: 0,
  dailySpent: 0,
  monthlySpent: 0,
  remainingCredits: 0,
  unavailable: true,
};

export type BudgetVerdict =
  | "within_budget"
  | "approval_required"
  | "per_action_limit_exceeded"
  | "agent_daily_limit_exceeded"
  | "mission_limit_exceeded"
  | "daily_limit_exceeded"
  | "monthly_limit_exceeded"
  | "insufficient_balance"
  | "budget_unavailable";

export interface BudgetDecision {
  readonly verdict: BudgetVerdict;
  readonly allowed: boolean;
  readonly requiresApproval: boolean;
  readonly estimatedCost: number;
  readonly remaining: number;
  readonly detail: string;
}

/** Deterministic cost estimate per action class (credits). */
export function estimateCost(cls: ActionClass): number {
  switch (cls) {
    case "READ":
      return 0;
    case "SAFE_WRITE":
      return 1;
    case "SENSITIVE_WRITE":
      return 5;
    case "EXTERNAL_ACTION":
      return 10;
    case "FINANCIAL_ACTION":
      return 25;
    case "DESTRUCTIVE_ACTION":
      return 25;
  }
}

export function evaluateBudget(input: {
  readonly actionClass: ActionClass;
  readonly estimatedCost?: number;
  readonly usage: BudgetUsage;
  readonly limits?: BudgetLimits;
}): BudgetDecision {
  const limits = input.limits ?? DEFAULT_BUDGET_LIMITS;
  const cost = input.estimatedCost ?? estimateCost(input.actionClass);
  const u = input.usage;
  const base = { estimatedCost: cost, remaining: Math.max(0, u.remainingCredits - cost) };

  if (cost === 0) {
    return { ...base, verdict: "within_budget", allowed: true, requiresApproval: false, detail: "Read-only action consumes no budget." };
  }
  if (u.unavailable) {
    return {
      ...base,
      remaining: 0,
      verdict: "budget_unavailable",
      allowed: false,
      requiresApproval: true,
      detail: "Spend ledger unreadable — hard stop (fail closed).",
    };
  }
  if (cost > limits.perActionCredits) {
    return { ...base, verdict: "per_action_limit_exceeded", allowed: false, requiresApproval: true, detail: `Action cost ${cost} exceeds per-action limit ${limits.perActionCredits}.` };
  }
  if (u.agentDailySpent + cost > limits.perAgentDailyCredits) {
    return { ...base, verdict: "agent_daily_limit_exceeded", allowed: false, requiresApproval: true, detail: "Agent daily budget exhausted." };
  }
  if (u.missionSpent + cost > limits.perMissionCredits) {
    return { ...base, verdict: "mission_limit_exceeded", allowed: false, requiresApproval: true, detail: "Mission budget exhausted." };
  }
  if (u.dailySpent + cost > limits.dailyCredits) {
    return { ...base, verdict: "daily_limit_exceeded", allowed: false, requiresApproval: true, detail: "Daily platform budget exhausted." };
  }
  if (u.monthlySpent + cost > limits.monthlyCredits) {
    return { ...base, verdict: "monthly_limit_exceeded", allowed: false, requiresApproval: true, detail: "Monthly platform budget exhausted." };
  }
  if (cost > u.remainingCredits) {
    return { ...base, verdict: "insufficient_balance", allowed: false, requiresApproval: false, detail: "Insufficient remaining credits (server-verified)." };
  }
  if (cost >= limits.approvalThresholdCredits) {
    return { ...base, verdict: "approval_required", allowed: false, requiresApproval: true, detail: `Cost ${cost} is at or above the approval threshold ${limits.approvalThresholdCredits}.` };
  }
  return { ...base, verdict: "within_budget", allowed: true, requiresApproval: false, detail: "Within all budget limits." };
}

/* ------------------------------------------------------------------ */
/* Runaway protection                                                  */
/* ------------------------------------------------------------------ */

export interface RunawayLimits {
  readonly maxSteps: number;
  readonly maxExecutionMs: number;
  readonly maxRetries: number;
  readonly maxToolCalls: number;
  readonly maxDelegationDepth: number;
  readonly maxRepeatedFailures: number;
  /** Identical (agent, tool, task) repeats treated as a loop. */
  readonly maxIdenticalRepeats: number;
}

export const DEFAULT_RUNAWAY_LIMITS: RunawayLimits = {
  maxSteps: 25,
  maxExecutionMs: 300_000,
  maxRetries: 2,
  maxToolCalls: 50,
  maxDelegationDepth: 2,
  maxRepeatedFailures: 3,
  maxIdenticalRepeats: 3,
};

/** Server-derived counters for the current mission/correlation window. */
export interface RunawayCounters {
  readonly steps: number;
  readonly elapsedMs: number;
  readonly retries: number;
  readonly toolCalls: number;
  readonly delegationDepth: number;
  readonly consecutiveFailures: number;
  readonly identicalRepeats: number;
}

export const ZERO_COUNTERS: RunawayCounters = {
  steps: 0,
  elapsedMs: 0,
  retries: 0,
  toolCalls: 0,
  delegationDepth: 0,
  consecutiveFailures: 0,
  identicalRepeats: 0,
};

export type RunawayVerdict =
  | "ok"
  | "max_steps_exceeded"
  | "max_execution_time_exceeded"
  | "max_retries_exceeded"
  | "max_tool_calls_exceeded"
  | "max_delegation_depth_exceeded"
  | "repeated_failure_cutoff"
  | "loop_detected";

export interface RunawayDecision {
  readonly verdict: RunawayVerdict;
  readonly allowed: boolean;
  /** True when the breach must also trip the agent-level kill switch. */
  readonly shutdown: boolean;
  readonly detail: string;
}

export function evaluateRunaway(
  counters: RunawayCounters,
  limits: RunawayLimits = DEFAULT_RUNAWAY_LIMITS,
): RunawayDecision {
  const stop = (verdict: RunawayVerdict, detail: string, shutdown = true): RunawayDecision => ({
    verdict,
    allowed: false,
    shutdown,
    detail,
  });
  if (counters.steps >= limits.maxSteps) return stop("max_steps_exceeded", `Step budget ${limits.maxSteps} reached.`);
  if (counters.elapsedMs >= limits.maxExecutionMs) return stop("max_execution_time_exceeded", "Execution time budget reached.");
  if (counters.retries > limits.maxRetries) return stop("max_retries_exceeded", `Retry budget ${limits.maxRetries} exceeded.`, false);
  if (counters.toolCalls >= limits.maxToolCalls) return stop("max_tool_calls_exceeded", `Tool-call budget ${limits.maxToolCalls} reached.`);
  if (counters.delegationDepth > limits.maxDelegationDepth) return stop("max_delegation_depth_exceeded", "Delegation depth limit exceeded.");
  if (counters.consecutiveFailures >= limits.maxRepeatedFailures) return stop("repeated_failure_cutoff", "Repeated-failure cutoff tripped.");
  if (counters.identicalRepeats >= limits.maxIdenticalRepeats) return stop("loop_detected", "Identical action repeated — loop detected.");
  return { verdict: "ok", allowed: true, shutdown: false, detail: "Within runaway limits." };
}
