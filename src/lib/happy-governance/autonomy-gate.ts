/**
 * R301 — AUTONOMY GATE: the single centralized Policy Decision Point.
 *
 *   CAN_EXECUTE(action, agent, actor, resource, scope, risk, budget)
 *
 * Deterministic, pure, side-effect free. Every autonomous action MUST pass
 * through `canExecute()` before any executor runs. It composes the existing
 * canonical layers — it does NOT replace them:
 *   - identity/roster ...... agent-roster.ts
 *   - skills/tools ......... skill-registry.ts / tool-registry.ts
 *   - resolution ........... workforce-core.ts
 *   - approval ............. public.approvals (R158) + founder/enforce.ts
 *   - audit ................ founder/audit.ts writeCanonicalAudit
 *
 * ORDER (R301 §3): AUTHENTICATE → AUTHORIZE → SCOPE → TOOL → RESOURCE →
 * KILL SWITCH → RUNAWAY → BUDGET → APPROVAL → EXECUTION.
 */

import { getAgent, type HappyAgentId } from "@/lib/happy-command/agent-roster";
import { getTool, type WorkforceRisk } from "@/lib/happy-command/tool-registry";
import {
  classifyAction,
  consumesBudget,
  requiresFounderApproval,
  reversibility,
  type ActionClass,
  type Reversibility,
} from "./action-classes";
import { checkAllowlist, grantFor, type DataScope } from "./capability-matrix";
import {
  DEFAULT_BUDGET_LIMITS,
  DEFAULT_RUNAWAY_LIMITS,
  UNKNOWN_USAGE,
  ZERO_COUNTERS,
  estimateCost,
  evaluateBudget,
  evaluateRunaway,
  type BudgetLimits,
  type BudgetUsage,
  type RunawayCounters,
  type RunawayLimits,
} from "./budget";
import { KILL_SWITCH_UNKNOWN, evaluateKillSwitch, type KillSwitchState } from "./kill-switch";

export type GateDecisionCode =
  | "ALLOW"
  | "DENY_UNAUTHENTICATED"
  | "DENY_UNKNOWN_AGENT"
  | "DENY_AGENT_DISABLED"
  | "DENY_NOT_AUTHORIZED"
  | "DENY_SCOPE"
  | "DENY_TOOL_NOT_ALLOWED"
  | "DENY_CAPABILITY_UNAVAILABLE"
  | "DENY_RESOURCE"
  | "DENY_KILL_SWITCH"
  | "DENY_RUNAWAY"
  | "DENY_BUDGET"
  | "DENY_APPROVAL_REQUIRED"
  | "DENY_AUTONOMY_NOT_SHIPPED";

/** Actor identity — ALWAYS server-derived (bearer token → RLS user). */
export interface GateActor {
  readonly userId: string | null;
  readonly isCompanyMember: boolean;
  readonly isCompanyAdmin: boolean;
  readonly isFounder: boolean;
}

export interface GateAction {
  readonly task: string;
  readonly skillId: string | null;
  readonly toolId: string | null;
  readonly permissions: readonly string[];
  readonly risk: WorkforceRisk;
  readonly toolAvailable: boolean;
  readonly externalIntegration?: string | null;
}

export interface GateResource {
  readonly companyId: string | null;
  readonly dataScope: DataScope;
  readonly resourceIds?: readonly string[];
  readonly missionId?: string | null;
  readonly correlationId?: string | null;
}

export interface GateInput {
  readonly action: GateAction;
  readonly agentId: string | null;
  readonly actor: GateActor;
  readonly resource: GateResource;
  readonly killSwitch?: KillSwitchState;
  readonly usage?: BudgetUsage;
  readonly counters?: RunawayCounters;
  readonly limits?: BudgetLimits;
  readonly runawayLimits?: RunawayLimits;
  /** True only when a server-verified APPROVED approval row exists. */
  readonly approved?: boolean;
  readonly approvalId?: string | null;
  readonly estimatedCost?: number;
}

export interface GateDecision {
  readonly allowed: boolean;
  readonly code: GateDecisionCode;
  /** Machine reason (stable, auditable). */
  readonly reason: string;
  /** Safe human explanation — never leaks internals or other tenants' data. */
  readonly explanation: string;
  readonly stage:
    | "authenticate"
    | "authorize"
    | "scope"
    | "tool"
    | "resource"
    | "kill_switch"
    | "runaway"
    | "budget"
    | "approval"
    | "execution";
  readonly actionClass: ActionClass;
  readonly risk: WorkforceRisk;
  readonly reversibility: Reversibility;
  readonly requiresApproval: boolean;
  readonly approvalId: string | null;
  readonly estimatedCost: number;
  readonly remainingBudget: number;
  readonly hardStop: boolean;
  /** Stable record for the audit trail. */
  readonly audit: {
    readonly agent_id: string | null;
    readonly skill_id: string | null;
    readonly tool_id: string | null;
    readonly action_class: ActionClass;
    readonly data_scope: DataScope;
    readonly company_id: string | null;
    readonly mission_id: string | null;
    readonly correlation_id: string | null;
    readonly decision: GateDecisionCode;
    readonly stage: string;
    readonly reason: string;
  };
}

/**
 * R301 §15 — autonomy classes that must NOT ship until permissions → sandbox
 * → tool restrictions → spending limits → kill switch are all verified.
 * These are hard-denied at the gate regardless of any other configuration.
 */
export const AUTONOMY_NOT_SHIPPED_TOOLS: readonly string[] = [
  "tool.computer.shell",
  "tool.browser.fetch",
  "tool.github.repo",
  "tool.deployment.release",
  "tool.git.commit",
  "tool.file.workspace",
  "tool.communication.send",
];

export const AUTONOMY_GATE_VERSION = "R301.1" as const;

/** THE policy decision point. Pure. Deterministic. No I/O. */
export function canExecute(input: GateInput): GateDecision {
  const { action, actor, resource } = input;
  const agent = input.agentId ? getAgent(input.agentId as HappyAgentId) : undefined;
  const actionClass = classifyAction({
    toolId: action.toolId,
    permissions: action.permissions,
    risk: action.risk,
  });
  const cost = input.estimatedCost ?? estimateCost(actionClass);
  const needsApproval = requiresFounderApproval(actionClass, action.risk);
  const rev = reversibility(actionClass);

  const base = {
    actionClass,
    risk: action.risk,
    reversibility: rev,
    requiresApproval: needsApproval,
    approvalId: input.approvalId ?? null,
    estimatedCost: cost,
    remainingBudget: Math.max(0, (input.usage ?? UNKNOWN_USAGE).remainingCredits - cost),
  };

  const decide = (
    allowed: boolean,
    code: GateDecisionCode,
    stage: GateDecision["stage"],
    reason: string,
    explanation: string,
    opts: { hardStop?: boolean; remainingBudget?: number; requiresApproval?: boolean } = {},
  ): GateDecision => ({
    allowed,
    code,
    reason,
    explanation,
    stage,
    ...base,
    requiresApproval: opts.requiresApproval ?? base.requiresApproval,
    remainingBudget: opts.remainingBudget ?? base.remainingBudget,
    hardStop: opts.hardStop ?? false,
    audit: {
      agent_id: input.agentId ?? null,
      skill_id: action.skillId,
      tool_id: action.toolId,
      action_class: actionClass,
      data_scope: resource.dataScope,
      company_id: resource.companyId,
      mission_id: resource.missionId ?? null,
      correlation_id: resource.correlationId ?? null,
      decision: code,
      stage,
      reason,
    },
  });

  // 1. AUTHENTICATE
  if (!actor.userId) {
    return decide(false, "DENY_UNAUTHENTICATED", "authenticate", "no_authenticated_actor", "You must be signed in — no action was taken.");
  }

  // 2. AUTHORIZE (agent identity + ownership)
  if (!agent) {
    return decide(false, "DENY_UNKNOWN_AGENT", "authorize", "unknown_agent", "That agent is not part of the canonical roster; nothing ran.");
  }
  if (!grantFor(agent.id)) {
    return decide(false, "DENY_AGENT_DISABLED", "authorize", "no_capability_grant", `${agent.title} has no execution grant yet, so nothing ran.`);
  }

  const writeLike = actionClass !== "READ";
  if (writeLike && !actor.isCompanyMember && !actor.isFounder) {
    return decide(false, "DENY_NOT_AUTHORIZED", "authorize", "not_workspace_member", "You are not a member of a workspace that allows this change.");
  }

  // 3. SCOPE CHECK
  if (resource.dataScope === "founder_only" && !actor.isFounder) {
    return decide(false, "DENY_SCOPE", "scope", "founder_scope_denied", "That data is Founder-only; access was denied and logged.");
  }
  if (resource.dataScope === "company" && !resource.companyId) {
    return decide(false, "DENY_SCOPE", "scope", "missing_company_scope", "No workspace context was resolved for this action.");
  }
  if (resource.dataScope === "platform" && !actor.isFounder) {
    return decide(false, "DENY_SCOPE", "scope", "platform_scope_denied", "Platform-wide actions are restricted to the Founder.");
  }

  // 4. TOOL CHECK (explicit allowlist, default DENY)
  const allow = checkAllowlist({
    agentId: agent.id,
    skillId: action.skillId,
    toolId: action.toolId,
    dataScope: resource.dataScope,
    externalIntegration: action.externalIntegration ?? null,
  });
  if (!allow.allowed) {
    return decide(false, "DENY_TOOL_NOT_ALLOWED", "tool", allow.reason, allow.detail);
  }
  if (action.toolId && AUTONOMY_NOT_SHIPPED_TOOLS.includes(action.toolId)) {
    return decide(
      false,
      "DENY_AUTONOMY_NOT_SHIPPED",
      "tool",
      "autonomy_gate_not_verified",
      "This autonomous capability is intentionally not enabled yet (sandbox and spending limits are not verified). Nothing ran.",
      { hardStop: true },
    );
  }
  if (action.toolId && !action.toolAvailable) {
    return decide(false, "DENY_CAPABILITY_UNAVAILABLE", "tool", "capability_unavailable", "No wired integration exists for this tool, so nothing was executed.");
  }

  // 5. RESOURCE CHECK
  if (action.toolId && !getTool(action.toolId)) {
    return decide(false, "DENY_RESOURCE", "resource", "unknown_tool", "The requested executor does not exist.");
  }
  if (resource.resourceIds && resource.resourceIds.some((id) => !id || id.trim() === "")) {
    return decide(false, "DENY_RESOURCE", "resource", "invalid_resource_reference", "One or more target records were invalid.");
  }

  // 6. KILL SWITCH (fail closed)
  const ks = evaluateKillSwitch(input.killSwitch ?? KILL_SWITCH_UNKNOWN, {
    agentId: agent.id,
    missionId: resource.missionId ?? null,
    correlationId: resource.correlationId ?? null,
  });
  if (!ks.allowed) {
    return decide(false, "DENY_KILL_SWITCH", "kill_switch", ks.verdict, ks.detail, { hardStop: true });
  }

  // 7. RUNAWAY PROTECTION
  const ra = evaluateRunaway(input.counters ?? ZERO_COUNTERS, input.runawayLimits ?? DEFAULT_RUNAWAY_LIMITS);
  if (!ra.allowed) {
    return decide(false, "DENY_RUNAWAY", "runaway", ra.verdict, ra.detail, { hardStop: ra.shutdown });
  }

  // 8. BUDGET / SPENDING CONTROL
  if (consumesBudget(actionClass)) {
    const budget = evaluateBudget({
      actionClass,
      estimatedCost: cost,
      usage: input.usage ?? UNKNOWN_USAGE,
      limits: input.limits ?? DEFAULT_BUDGET_LIMITS,
    });
    if (!budget.allowed && !(budget.verdict === "approval_required" && input.approved === true)) {
      return decide(false, "DENY_BUDGET", "budget", budget.verdict, budget.detail, {
        remainingBudget: budget.remaining,
        requiresApproval: budget.requiresApproval || needsApproval,
        hardStop: budget.verdict === "insufficient_balance" || budget.verdict === "budget_unavailable",
      });
    }
  }

  // 9. FOUNDER APPROVAL
  if (needsApproval && input.approved !== true) {
    return decide(false, "DENY_APPROVAL_REQUIRED", "approval", "founder_approval_required", "Founder approval is required before this action can run.");
  }

  // 10. EXECUTION
  return decide(true, "ALLOW", "execution", "allowed", `${agent.title} may execute this ${actionClass} action.`);
}

/** Approval object required by R301 §6. Built from a gate decision. */
export interface ApprovalRequestObject {
  readonly requested_action: string;
  readonly reason: string;
  readonly agent_id: string | null;
  readonly agent_title: string;
  readonly affected_resources: readonly string[];
  readonly expected_impact: string;
  readonly risk_level: WorkforceRisk;
  readonly action_class: ActionClass;
  readonly estimated_cost_credits: number;
  readonly reversibility: Reversibility;
  readonly generated_plan: readonly string[];
  readonly execution_scope: {
    readonly tool_id: string | null;
    readonly skill_id: string | null;
    readonly company_id: string | null;
    readonly data_scope: DataScope;
    readonly mission_id: string | null;
  };
  readonly gate_version: typeof AUTONOMY_GATE_VERSION;
}

export function buildApprovalRequest(input: GateInput, decision: GateDecision, plan: readonly string[] = []): ApprovalRequestObject {
  const agent = input.agentId ? getAgent(input.agentId as HappyAgentId) : undefined;
  return {
    requested_action: input.action.task,
    reason: decision.explanation,
    agent_id: input.agentId ?? null,
    agent_title: agent?.title ?? "Unassigned",
    affected_resources: input.resource.resourceIds ?? [],
    expected_impact: `${decision.actionClass} on ${input.resource.dataScope} scope (${decision.reversibility}).`,
    risk_level: input.action.risk,
    action_class: decision.actionClass,
    estimated_cost_credits: decision.estimatedCost,
    reversibility: decision.reversibility,
    generated_plan: plan,
    execution_scope: {
      tool_id: input.action.toolId,
      skill_id: input.action.skillId,
      company_id: input.resource.companyId,
      data_scope: input.resource.dataScope,
      mission_id: input.resource.missionId ?? null,
    },
    gate_version: AUTONOMY_GATE_VERSION,
  };
}
