/**
 * HAPPY Agent Workforce — pure resolution core.
 *
 * TASK → AGENT → SKILL → TOOL → PERMISSION → RISK → APPROVAL → EXECUTION
 *
 * Extends `agent-roster.ts`, `skill-registry.ts`, `tool-registry.ts`,
 * `command-core.ts` and `mission-core.ts`. NO new runtime, NO new table,
 * NO second approval or audit engine.
 */

import {
  HAPPY_AGENTS,
  agentsForIntent,
  getAgent,
  type HappyAgent,
  type HappyAgentId,
} from "./agent-roster";
import { HAPPY_SKILLS, matchSkill, type HappySkill } from "./skill-registry";
import {
  CAPABILITY_UNAVAILABLE,
  HAPPY_TOOLS,
  maxRisk,
  preferredTool,
  riskRequiresApproval,
  type HappyTool,
  type WorkforceRisk,
} from "./tool-registry";
import { plan as planCommandCore, type CommandPlan } from "./command-core";
import type { HappyIntentId } from "./intent-registry";

export const WORKFORCE_AUDIT_CATEGORY = "happy.workforce";

export type WorkforceStatus =
  | "ready"
  | "awaiting_approval"
  | "capability_unavailable"
  | "unresolved";

export interface WorkforceAgentCategory {
  readonly category: string;
  readonly agents: readonly HappyAgentId[];
}

/** Founder-facing grouping of the canonical roster. */
export const AGENT_CATEGORIES: readonly WorkforceAgentCategory[] = [
  { category: "Core", agents: ["orchestrator", "ai-manager", "research", "ai-planner"] },
  { category: "Product", agents: ["product-manager", "business-analyst", "software-architect"] },
  { category: "Design", agents: ["uiux", "graphic-designer", "brand-designer", "content-designer"] },
  {
    category: "Engineering",
    agents: ["frontend", "backend", "fullstack", "mobile", "game-developer", "database", "api", "developer"],
  },
  { category: "Quality", agents: ["qa", "testing", "debugging", "security", "code-review"] },
  { category: "Infrastructure", agents: ["devops", "deployment", "cloud", "monitoring"] },
  {
    category: "Business",
    agents: [
      "business-consultant",
      "marketing",
      "sales",
      "customer-support",
      "crm",
      "finance-assistant",
      "hr-assistant",
      "operations",
      "inventory",
      "manufacturing",
      "logistics",
    ],
  },
  { category: "Content", agents: ["content", "social-media", "video", "image", "audio", "presentation"] },
  { category: "Knowledge", agents: ["knowledge", "education", "documentation", "seo"] },
  { category: "Delivery", agents: ["project-manager"] },
];

export interface WorkforceResolution {
  readonly task: string;
  readonly order: number;
  readonly agentId: HappyAgentId | null;
  readonly agentTitle: string;
  readonly owner: string;
  readonly skillId: string | null;
  readonly skillName: string;
  readonly toolId: string | null;
  readonly toolName: string;
  readonly toolAvailability: "available" | "unavailable" | "none";
  readonly permissions: readonly string[];
  readonly risk: WorkforceRisk;
  readonly requiresApproval: boolean;
  readonly status: WorkforceStatus;
  readonly note: string;
}

function unresolved(task: string, order: number): WorkforceResolution {
  return {
    task,
    order,
    agentId: null,
    agentTitle: "—",
    owner: "—",
    skillId: null,
    skillName: "—",
    toolId: null,
    toolName: "—",
    toolAvailability: "none",
    permissions: [],
    risk: "low",
    requiresApproval: false,
    status: "unresolved",
    note: "No agent or skill matched this task.",
  };
}

/** Resolve ONE task to agent → skill → tool with risk and approval flags. */
export function resolveTask(
  task: string,
  opts: { readonly agent?: HappyAgentId; readonly intent?: HappyIntentId; readonly order?: number } = {},
): WorkforceResolution {
  const order = opts.order ?? 1;
  const text = (task ?? "").trim();
  if (!text) return unresolved(task ?? "", order);

  const agent: HappyAgent | undefined =
    (opts.agent ? getAgent(opts.agent) : undefined) ??
    (opts.intent ? agentsForIntent(opts.intent)[0] : undefined);

  const skill: HappySkill | undefined = matchSkill(text, agent?.id);
  if (!agent || !skill) return unresolved(text, order);

  const tool: HappyTool | undefined = preferredTool(skill.tool);
  const risk = maxRisk(skill.risk, tool?.risk ?? "low");
  const unavailable = !tool || tool.availability === "unavailable";

  return {
    task: text,
    order,
    agentId: agent.id,
    agentTitle: agent.title,
    owner: agent.owner,
    skillId: skill.id,
    skillName: skill.name,
    toolId: tool?.id ?? null,
    toolName: tool?.name ?? "—",
    toolAvailability: tool ? tool.availability : "none",
    permissions: Array.from(new Set([...agent.permissions, ...skill.permissions, ...(tool ? [tool.permission] : [])])),
    risk,
    requiresApproval: riskRequiresApproval(risk) || !agent.autonomous,
    status: unavailable
      ? "capability_unavailable"
      : riskRequiresApproval(risk)
        ? "awaiting_approval"
        : "ready",
    note: unavailable
      ? `${CAPABILITY_UNAVAILABLE}: no wired integration for ${skill.tool} tools.`
      : `${agent.title} executes "${skill.name}" via ${tool!.name}.`,
  };
}

export interface WorkforcePlan {
  readonly goal: string;
  readonly intent: HappyIntentId;
  readonly intentLabel: string;
  readonly risk: WorkforceRisk;
  readonly requiresApproval: boolean;
  readonly unavailable: readonly string[];
  readonly resolutions: readonly WorkforceResolution[];
}

/**
 * Resolve a whole goal: reuses the canonical command planner for the
 * intent/stage/agent assignment, then layers skill + tool resolution.
 */
export function resolveWorkforcePlan(goal: string): WorkforcePlan {
  const p: CommandPlan = planCommandCore(goal);
  const resolutions = p.tasks.map((t) =>
    resolveTask(t.stage, { agent: t.agent, intent: p.intent, order: t.order }),
  );
  const risk = maxRisk(p.risk, ...resolutions.map((r) => r.risk));
  return {
    goal: p.command,
    intent: p.intent,
    intentLabel: p.intentLabel,
    risk,
    requiresApproval: p.requiresApproval || riskRequiresApproval(risk),
    unavailable: resolutions
      .filter((r) => r.status === "capability_unavailable")
      .map((r) => r.toolName || r.skillName),
    resolutions,
  };
}

export interface WorkforceCatalog {
  readonly agents: number;
  readonly skills: number;
  readonly tools: number;
  readonly toolsAvailable: number;
  readonly categories: readonly WorkforceAgentCategory[];
}

export function catalogSummary(): WorkforceCatalog {
  return {
    agents: HAPPY_AGENTS.length,
    skills: HAPPY_SKILLS.length,
    tools: HAPPY_TOOLS.length,
    toolsAvailable: HAPPY_TOOLS.filter((t) => t.availability === "available").length,
    categories: AGENT_CATEGORIES,
  };
}

/** Permission gate input is derived server-side ONLY — never from the client. */
export function requiredScopes(r: WorkforceResolution): readonly string[] {
  return r.permissions;
}

export function isWriteScope(scopes: readonly string[]): boolean {
  return scopes.some((s) => s.startsWith("write:") || s === "platform.manage");
}
