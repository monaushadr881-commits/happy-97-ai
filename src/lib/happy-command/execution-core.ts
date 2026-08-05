/**
 * HAPPY Skill & Tool Execution — PURE core (Batch 4).
 *
 * TASK → AGENT → SKILL → TOOL → AUTHORIZATION → RISK → APPROVAL →
 * EXECUTOR → RESULT → VERIFICATION → AUDIT
 *
 * Extends `workforce-core.ts` (resolution), `tool-registry.ts` (tools),
 * `skill-registry.ts` (skills). NO new runtime, NO new table, NO second
 * approval or audit engine. Pure data + pure functions only.
 *
 * Honesty rule (Phase 18): a tool with no wired adapter NEVER reports
 * SUCCESS. It reports CAPABILITY_UNAVAILABLE.
 */

import type { WorkforceRisk } from "./tool-registry";
import type { WorkforceResolution } from "./workforce-core";

export type ExecutionStatus =
  | "SUCCESS"
  | "FAILED"
  | "BLOCKED"
  | "CAPABILITY_UNAVAILABLE"
  | "REQUIRES_APPROVAL"
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "TIMEOUT";

export type VerificationStatus =
  | "VERIFIED"
  | "VERIFICATION_FAILED"
  | "VERIFICATION_UNAVAILABLE"
  | "NOT_APPLICABLE";

/** Server-derived only. Never hydrate any field from client input. */
export interface ExecutionContext {
  readonly userId: string;
  readonly companyId: string | null;
  readonly isCompanyMember: boolean;
  readonly isCompanyAdmin: boolean;
  readonly agentId: string | null;
  readonly skillId: string | null;
  readonly toolId: string | null;
  readonly task: string;
  readonly goal: string | null;
  readonly missionId: string | null;
  readonly commandId: string | null;
  readonly risk: WorkforceRisk;
  /** True only when a server-side approval row was found APPROVED. */
  readonly approved: boolean;
  readonly approvalId: string | null;
  readonly correlationId: string;
  readonly startedAt: string;
}

export interface ExecutionResult {
  readonly execution_id: string | null;
  readonly correlation_id: string;
  readonly task: string;
  readonly agent_id: string | null;
  readonly skill_id: string | null;
  readonly tool_id: string | null;
  readonly status: ExecutionStatus;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly duration_ms: number;
  readonly output: unknown;
  readonly error: string | null;
  readonly verification: VerificationStatus;
  readonly verification_note: string;
  readonly approval_id: string | null;
  readonly audit_id: string | null;
  readonly retryable: boolean;
  readonly message: string;
}

/** Raw adapter outcome — no audit, no approval, no persistence. */
export interface ToolOutcome {
  readonly status: ExecutionStatus;
  readonly output: unknown;
  readonly error: string | null;
  readonly verification: VerificationStatus;
  readonly verification_note: string;
  readonly retryable: boolean;
}

export function outcome(partial: Partial<ToolOutcome> & { status: ExecutionStatus }): ToolOutcome {
  return {
    output: null,
    error: null,
    verification: "VERIFICATION_UNAVAILABLE",
    verification_note: "No verification evidence available for this operation.",
    retryable: false,
    ...partial,
  };
}

export const EXECUTION_TIMEOUT_MS = 15_000;

/** Bounded retry (Phase 11). */
export const MAX_RETRIES = 2;

/**
 * Categories where a blind retry could duplicate real-world harm.
 * Retry is only offered when the failure never reached the outside world.
 */
const UNSAFE_RETRY_TOOLS: readonly string[] = [
  "tool.database.migration",
  "tool.deployment.release",
  "tool.communication.send",
  "tool.github.repo",
  "tool.git.commit",
];

export function isRetrySafe(toolId: string | null, status: ExecutionStatus): boolean {
  if (!toolId) return false;
  if (UNSAFE_RETRY_TOOLS.includes(toolId)) return false;
  return status === "FAILED" || status === "TIMEOUT";
}

export function retryDelayMs(attempt: number): number {
  return Math.min(8_000, 500 * 2 ** Math.max(0, attempt));
}

/** Operations where duplicate execution is harmful → idempotency required. */
export function requiresIdempotency(toolId: string | null): boolean {
  if (!toolId) return false;
  return (
    UNSAFE_RETRY_TOOLS.includes(toolId) ||
    toolId === "tool.storage.object" ||
    toolId === "tool.build.pipeline"
  );
}

/**
 * Stable correlation identity derived from server-side values only.
 * Same user + company + skill + tool + task ⇒ same key.
 */
export function idempotencyKey(input: {
  userId: string;
  companyId: string | null;
  skillId: string | null;
  toolId: string | null;
  task: string;
}): string {
  const raw = [
    input.userId,
    input.companyId ?? "-",
    input.skillId ?? "-",
    input.toolId ?? "-",
    input.task.trim().toLowerCase().replace(/\s+/g, " "),
  ].join("|");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < raw.length; i += 1) {
    h1 = (h1 ^ raw.charCodeAt(i)) * 16777619 >>> 0;
    h2 = (h2 + raw.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return `hxe_${h1.toString(16)}${h2.toString(16)}`;
}

/** Maps a pure resolution to the pre-execution gate decision. */
export function preflight(r: WorkforceResolution): { blockedStatus: ExecutionStatus | null; note: string } {
  if (r.status === "unresolved") {
    return { blockedStatus: "INVALID_INPUT", note: "No agent/skill combination matched this task." };
  }
  if (r.status === "capability_unavailable") {
    return { blockedStatus: "CAPABILITY_UNAVAILABLE", note: r.note };
  }
  return { blockedStatus: null, note: r.note };
}

export function finalize(
  ctx: ExecutionContext,
  o: ToolOutcome,
  ids: { auditId: string | null; approvalId?: string | null },
): ExecutionResult {
  const completedAt = new Date().toISOString();
  const duration = Math.max(0, Date.parse(completedAt) - Date.parse(ctx.startedAt));
  return {
    execution_id: ids.auditId,
    correlation_id: ctx.correlationId,
    task: ctx.task,
    agent_id: ctx.agentId,
    skill_id: ctx.skillId,
    tool_id: ctx.toolId,
    status: o.status,
    startedAt: ctx.startedAt,
    completedAt,
    duration_ms: duration,
    output: o.output,
    error: o.error,
    verification: o.verification,
    verification_note: o.verification_note,
    approval_id: ids.approvalId ?? ctx.approvalId,
    audit_id: ids.auditId,
    retryable: o.retryable && isRetrySafe(ctx.toolId, o.status),
    message: messageFor(o.status, o),
  };
}

function messageFor(status: ExecutionStatus, o: ToolOutcome): string {
  switch (status) {
    case "SUCCESS":
      return o.verification === "VERIFIED"
        ? "Executed and verified."
        : "Executed. Verification unavailable — not reported as verified.";
    case "FAILED":
      return o.error ?? "Tool execution failed.";
    case "BLOCKED":
      return o.error ?? "Blocked by policy, authorization or approval.";
    case "CAPABILITY_UNAVAILABLE":
      return o.error ?? "No wired integration for this tool. Nothing was executed.";
    case "REQUIRES_APPROVAL":
      return "Founder approval required before execution.";
    case "UNAUTHORIZED":
      return "Not authorized for this scope.";
    case "INVALID_INPUT":
      return o.error ?? "Invalid input.";
    case "TIMEOUT":
      return "Tool execution timed out.";
  }
}

/**
 * Mission gate (Phase 10): a phase advances ONLY on verified success.
 * `VERIFICATION_UNAVAILABLE` is NOT treated as verified.
 */
export function canAdvancePhase(results: readonly ExecutionResult[]): { advance: boolean; reason: string } {
  if (results.length === 0) return { advance: false, reason: "No executed tasks for this phase." };
  const failed = results.filter((r) => r.status !== "SUCCESS");
  if (failed.length > 0) {
    return { advance: false, reason: `${failed.length} task(s) did not succeed (${failed[0]!.status}).` };
  }
  const unverified = results.filter(
    (r) => r.verification !== "VERIFIED" && r.verification !== "NOT_APPLICABLE",
  );
  if (unverified.length > 0) {
    return { advance: false, reason: `${unverified.length} task(s) lack verification evidence.` };
  }
  const missingOutput = results.filter((r) => r.output === null || r.output === undefined);
  if (missingOutput.length > 0) {
    return { advance: false, reason: "Required outputs are missing." };
  }
  return { advance: true, reason: "All tasks executed and verified." };
}
