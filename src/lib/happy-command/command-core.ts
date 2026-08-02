/**
 * HAPPY Command Engine — pure planning core.
 *
 * Extends `src/lib/happy-command/intent-registry.ts` and
 * `src/lib/happy-command/agent-roster.ts` — no duplication, no runtime.
 *
 * Kept OUT of `command.functions.ts` so that file stays a thin server-fn
 * wrapper (R183 / server-fn splitting rule).
 */

import {
  classifyCommand,
  getIntent,
  normalizeCommand,
  type HappyIntentDefinition,
  type HappyIntentId,
  type HappyRiskLevel,
} from "./intent-registry";
import { agentsForIntent, type HappyAgentId } from "./agent-roster";

export const COMMAND_AUDIT_CATEGORY = "happy.command";
export const COMMAND_MAX_LEN = 4000;

export interface CommandInterpretation {
  readonly command: string;
  readonly intent: HappyIntentId;
  readonly intentLabel: string;
  readonly confidence: number;
  readonly matched: readonly string[];
  readonly requirements: readonly string[];
  readonly targetRoute: string;
  readonly surface: string;
  readonly preset: string;
  readonly risk: HappyRiskLevel;
  readonly requiresApproval: boolean;
}

export interface CommandTask {
  readonly order: number;
  readonly stage: string;
  readonly agent: HappyAgentId;
  readonly agentTitle: string;
  readonly owner: string;
  readonly autonomous: boolean;
}

export interface CommandPlan extends CommandInterpretation {
  readonly stages: readonly string[];
  readonly tasks: readonly CommandTask[];
  readonly impact: string;
  readonly expectedResult: string;
  readonly reason: string;
}

export function parseCommandText(raw: unknown): string {
  if (typeof raw !== "string") throw new Error("command_required");
  const text = normalizeCommand(raw).slice(0, COMMAND_MAX_LEN);
  if (!text) throw new Error("command_empty");
  return text;
}

export function interpret(raw: string): CommandInterpretation {
  const command = parseCommandText(raw);
  const match = classifyCommand(command);
  const def: HappyIntentDefinition = match.intent;
  return {
    command,
    intent: def.id,
    intentLabel: def.label,
    confidence: Number(match.confidence.toFixed(2)),
    matched: match.matched,
    requirements: def.requirements,
    targetRoute: def.targetRoute,
    surface: def.surface,
    preset: def.preset,
    risk: def.risk,
    requiresApproval: def.requiresApproval,
  };
}

/** Intent → Requirements → Plan → Tasks → Agents. */
export function plan(raw: string): CommandPlan {
  const base = interpret(raw);
  const def = getIntent(base.intent);
  const agents = agentsForIntent(base.intent);

  const tasks: CommandTask[] = def.stages.map((stage, i) => {
    const agent = agents[i % agents.length]!;
    return {
      order: i + 1,
      stage,
      agent: agent.id,
      agentTitle: agent.title,
      owner: agent.owner,
      autonomous: agent.autonomous,
    };
  });

  const impact =
    def.risk === "high"
      ? "High impact — affects live users, billing, access, or public state."
      : def.risk === "medium"
        ? "Medium impact — changes project code, schema, or configuration."
        : "Low impact — analysis, drafting, or preview output only.";

  return {
    ...base,
    stages: def.stages,
    tasks,
    impact,
    reason: `Detected intent "${def.label}" with ${Math.round(base.confidence * 100)}% confidence${
      base.matched.length ? ` from: ${base.matched.join(", ")}` : " (no keyword match — clarification recommended)"
    }.`,
    expectedResult: `${def.stages.length} stages executed by ${agents.length} agents through ${def.targetRoute}.`,
  };
}

/** Shape of a persisted command row rebuilt from the canonical audit log. */
export interface CommandRecord {
  readonly id: string;
  readonly command: string;
  readonly intent: HappyIntentId;
  readonly intentLabel: string;
  readonly status: "accepted" | "awaiting_approval" | "cancelled";
  readonly risk: HappyRiskLevel;
  readonly targetRoute: string;
  readonly approvalId: string | null;
  readonly occurredAt: string;
}

interface AuditRowLike {
  id: string;
  action: string;
  occurred_at: string;
  metadata: unknown;
}

export function toCommandRecord(row: AuditRowLike): CommandRecord {
  const m = (row.metadata ?? {}) as Record<string, unknown>;
  const intent = (typeof m['intent'] === "string" ? m['intent'] : "unknown") as HappyIntentId;
  const def = getIntent(intent);
  const status: CommandRecord["status"] =
    row.action === "cancel"
      ? "cancelled"
      : m['approval_id']
        ? "awaiting_approval"
        : "accepted";
  return {
    id: row.id,
    command: typeof m['command'] === "string" ? m['command'] : "",
    intent,
    intentLabel: def.label,
    status,
    risk: def.risk,
    targetRoute: def.targetRoute,
    approvalId: typeof m['approval_id'] === "string" ? m['approval_id'] : null,
    occurredAt: row.occurred_at,
  };
}
