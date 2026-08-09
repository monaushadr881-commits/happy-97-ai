/**
 * R301 — Kill switch + delegation governance (PURE).
 *
 * State is ALWAYS resolved server-side (`governance.server.ts`) from existing
 * canonical surfaces. This file only holds the deterministic policy.
 */

export type KillSwitchLevel = "global" | "agent" | "mission" | "execution";

export interface KillSwitchState {
  readonly globalStopped: boolean;
  readonly stoppedAgents: readonly string[];
  readonly stoppedMissions: readonly string[];
  readonly cancelledCorrelations: readonly string[];
  /** True when kill-switch state could not be read — fail CLOSED. */
  readonly unavailable: boolean;
  readonly reason: string | null;
}

export const KILL_SWITCH_UNKNOWN: KillSwitchState = {
  globalStopped: false,
  stoppedAgents: [],
  stoppedMissions: [],
  cancelledCorrelations: [],
  unavailable: true,
  reason: "Kill-switch state unreadable.",
};

export const KILL_SWITCH_CLEAR: KillSwitchState = {
  globalStopped: false,
  stoppedAgents: [],
  stoppedMissions: [],
  cancelledCorrelations: [],
  unavailable: false,
  reason: null,
};

export type KillSwitchVerdict =
  | "clear"
  | "global_stop"
  | "agent_stopped"
  | "mission_cancelled"
  | "execution_cancelled"
  | "state_unavailable";

export interface KillSwitchDecision {
  readonly verdict: KillSwitchVerdict;
  readonly allowed: boolean;
  readonly level: KillSwitchLevel | null;
  readonly detail: string;
}

export function evaluateKillSwitch(
  state: KillSwitchState,
  target: { readonly agentId: string | null; readonly missionId: string | null; readonly correlationId: string | null },
): KillSwitchDecision {
  if (state.unavailable) {
    return {
      verdict: "state_unavailable",
      allowed: false,
      level: "global",
      detail: "Kill-switch state unreadable — execution denied (fail closed).",
    };
  }
  if (state.globalStopped) {
    return { verdict: "global_stop", allowed: false, level: "global", detail: state.reason ?? "Global HAPPY kill switch is engaged." };
  }
  if (target.agentId && state.stoppedAgents.includes(target.agentId)) {
    return { verdict: "agent_stopped", allowed: false, level: "agent", detail: `Agent ${target.agentId} is stopped by Founder.` };
  }
  if (target.missionId && state.stoppedMissions.includes(target.missionId)) {
    return { verdict: "mission_cancelled", allowed: false, level: "mission", detail: "Mission is cancelled." };
  }
  if (target.correlationId && state.cancelledCorrelations.includes(target.correlationId)) {
    return { verdict: "execution_cancelled", allowed: false, level: "execution", detail: "This execution was cancelled." };
  }
  return { verdict: "clear", allowed: true, level: null, detail: "No kill switch engaged." };
}

/* ------------------------------------------------------------------ */
/* Agent-to-agent delegation                                           */
/* ------------------------------------------------------------------ */

export interface DelegationRequest {
  readonly parentAgentId: string;
  readonly childAgentId: string;
  readonly depth: number;
  /** Scopes the parent explicitly hands down. */
  readonly delegatedScopes: readonly string[];
}

export interface DelegationPrincipal {
  readonly agentId: string;
  readonly scopes: readonly string[];
  readonly maxDelegationDepth: number;
}

export type DelegationVerdict =
  | "allowed"
  | "delegation_not_permitted"
  | "depth_exceeded"
  | "privilege_escalation"
  | "self_delegation"
  | "child_scope_not_granted";

export interface DelegationDecision {
  readonly verdict: DelegationVerdict;
  readonly allowed: boolean;
  /** Effective scopes for the child — intersection only, never a superset. */
  readonly effectiveScopes: readonly string[];
  readonly detail: string;
}

/**
 * Delegation is an INTERSECTION, never an inheritance. A child agent receives
 * at most `parent.scopes ∩ child.scopes ∩ delegatedScopes`.
 */
export function evaluateDelegation(
  req: DelegationRequest,
  parent: DelegationPrincipal,
  child: DelegationPrincipal,
): DelegationDecision {
  const nothing: readonly string[] = [];
  if (req.parentAgentId === req.childAgentId) {
    return { verdict: "self_delegation", allowed: false, effectiveScopes: nothing, detail: "An agent cannot delegate to itself." };
  }
  if (parent.maxDelegationDepth <= 0) {
    return { verdict: "delegation_not_permitted", allowed: false, effectiveScopes: nothing, detail: `${parent.agentId} is not permitted to delegate.` };
  }
  if (req.depth > parent.maxDelegationDepth) {
    return { verdict: "depth_exceeded", allowed: false, effectiveScopes: nothing, detail: `Delegation depth ${req.depth} exceeds ${parent.maxDelegationDepth}.` };
  }
  const beyondParent = req.delegatedScopes.filter((s) => !parent.scopes.includes(s));
  if (beyondParent.length > 0) {
    return {
      verdict: "privilege_escalation",
      allowed: false,
      effectiveScopes: nothing,
      detail: `Parent cannot delegate scopes it does not hold: ${beyondParent.join(", ")}.`,
    };
  }
  const effective = req.delegatedScopes.filter((s) => child.scopes.includes(s));
  if (effective.length === 0) {
    return {
      verdict: "child_scope_not_granted",
      allowed: false,
      effectiveScopes: nothing,
      detail: "Child agent holds none of the delegated scopes.",
    };
  }
  return { verdict: "allowed", allowed: true, effectiveScopes: effective, detail: "Delegated within intersected scope." };
}
