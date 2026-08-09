/**
 * R301 — Agent Capability / Tool Allowlist (PURE, default DENY).
 *
 * Extends `agent-roster.ts` (identity + permissions) and `tool-registry.ts`
 * (executors). This file adds the EXPLICIT allowlist that R301 requires:
 * which tools, categories, modules, data scopes and external integrations an
 * agent may touch. Nothing is allowed implicitly.
 *
 * NO new runtime, NO table, NO I/O.
 */

import { getAgent, type HappyAgentId } from "@/lib/happy-command/agent-roster";
import { getTool, type HappyToolCategory } from "@/lib/happy-command/tool-registry";
import { getSkill } from "@/lib/happy-command/skill-registry";

export type DataScope =
  | "own_user"
  | "company"
  | "founder_only"
  | "platform"
  | "public";

export interface AgentCapabilityGrant {
  /** Tool categories the agent may use at all. */
  readonly toolCategories: readonly HappyToolCategory[];
  /** Additional per-tool allowlist (ids). Empty = category rule only. */
  readonly tools: readonly string[];
  /** Data scopes the agent may read/write within. */
  readonly dataScopes: readonly DataScope[];
  /** Canonical modules/owners the agent may drive. */
  readonly modules: readonly string[];
  /** External integrations explicitly permitted (empty = none). */
  readonly externalIntegrations: readonly string[];
  /** Maximum delegation depth this agent may create. */
  readonly maxDelegationDepth: number;
}

const NONE: readonly string[] = [];

const READ_ONLY: AgentCapabilityGrant = {
  toolCategories: ["database", "search", "analytics"],
  tools: NONE,
  dataScopes: ["own_user", "company"],
  modules: ["src/lib/founder/pipeline.ts"],
  externalIntegrations: NONE,
  maxDelegationDepth: 0,
};

const CONTENT: AgentCapabilityGrant = {
  toolCategories: ["search", "document", "image", "audio", "video", "storage"],
  tools: NONE,
  dataScopes: ["own_user", "company"],
  modules: ["src/lib/founder/creator.functions.ts", "src/lib/founder/document.functions.ts"],
  externalIntegrations: NONE,
  maxDelegationDepth: 0,
};

const ENGINEERING: AgentCapabilityGrant = {
  toolCategories: ["database", "search", "api", "build", "file", "git"],
  tools: NONE,
  dataScopes: ["own_user", "company"],
  modules: ["src/lib/builder/builder-submit.functions.ts"],
  externalIntegrations: NONE,
  maxDelegationDepth: 0,
};

const ORCHESTRATION: AgentCapabilityGrant = {
  toolCategories: ["database", "search", "analytics", "document"],
  tools: NONE,
  dataScopes: ["own_user", "company", "founder_only"],
  modules: ["src/lib/happy-command/mission-core.ts", "src/lib/founder/pipeline.ts"],
  externalIntegrations: NONE,
  /** Only orchestration agents may delegate, and only one level. */
  maxDelegationDepth: 1,
};

/**
 * Explicit grants. An agent absent from this map gets NO capabilities
 * (default DENY) — it can still plan, but never execute a tool.
 */
export const AGENT_CAPABILITY_MATRIX: Readonly<Partial<Record<HappyAgentId, AgentCapabilityGrant>>> = {
  orchestrator: ORCHESTRATION,
  "ai-manager": ORCHESTRATION,
  "ai-planner": ORCHESTRATION,
  "project-manager": ORCHESTRATION,
  "product-manager": READ_ONLY,
  "business-analyst": READ_ONLY,
  "software-architect": READ_ONLY,
  research: READ_ONLY,
  knowledge: READ_ONLY,
  documentation: CONTENT,
  content: CONTENT,
  "content-designer": CONTENT,
  "graphic-designer": CONTENT,
  "brand-designer": CONTENT,
  presentation: CONTENT,
  image: CONTENT,
  video: CONTENT,
  audio: CONTENT,
  seo: READ_ONLY,
  developer: ENGINEERING,
  frontend: ENGINEERING,
  backend: ENGINEERING,
  fullstack: ENGINEERING,
  mobile: ENGINEERING,
  api: ENGINEERING,
  uiux: ENGINEERING,
  database: {
    ...ENGINEERING,
    toolCategories: ["database", "search", "analytics"],
    modules: ["src/enterprise/repositories.server.ts"],
  },
  qa: READ_ONLY,
  testing: READ_ONLY,
  debugging: READ_ONLY,
  "code-review": READ_ONLY,
  security: {
    ...READ_ONLY,
    dataScopes: ["own_user", "company", "founder_only"],
    modules: ["src/ops/security-ops.service.ts"],
  },
  monitoring: { ...READ_ONLY, modules: ["src/ops/metrics.service.ts"] },
  operations: READ_ONLY,
  crm: READ_ONLY,
  inventory: READ_ONLY,
  manufacturing: READ_ONLY,
  logistics: READ_ONLY,
  sales: READ_ONLY,
  marketing: READ_ONLY,
  "social-media": CONTENT,
  "customer-support": READ_ONLY,
  "hr-assistant": READ_ONLY,
  "finance-assistant": READ_ONLY,
  "business-consultant": READ_ONLY,
  education: READ_ONLY,
  // Intentionally NOT granted (R301 §15 — no autonomy expansion):
  // devops, deployment, cloud, game-developer.
};

export function grantFor(agentId: string | null): AgentCapabilityGrant | null {
  if (!agentId) return null;
  return AGENT_CAPABILITY_MATRIX[agentId as HappyAgentId] ?? null;
}

export type AllowlistDenyReason =
  | "unknown_agent"
  | "no_capability_grant"
  | "unknown_tool"
  | "tool_category_not_allowed"
  | "tool_not_allowlisted"
  | "skill_not_supported_by_agent"
  | "data_scope_not_allowed"
  | "external_integration_not_allowed";

export interface AllowlistDecision {
  readonly allowed: boolean;
  readonly reason: AllowlistDenyReason | "allowed";
  readonly detail: string;
}

const ok: AllowlistDecision = { allowed: true, reason: "allowed", detail: "Within agent allowlist." };

function deny(reason: AllowlistDenyReason, detail: string): AllowlistDecision {
  return { allowed: false, reason, detail };
}

/** Deterministic allowlist check. Default DENY at every step. */
export function checkAllowlist(input: {
  readonly agentId: string | null;
  readonly skillId: string | null;
  readonly toolId: string | null;
  readonly dataScope: DataScope;
  readonly externalIntegration?: string | null;
}): AllowlistDecision {
  const agent = input.agentId ? getAgent(input.agentId as HappyAgentId) : undefined;
  if (!agent) return deny("unknown_agent", `Agent "${input.agentId ?? "none"}" is not in the canonical roster.`);

  const grant = grantFor(agent.id);
  if (!grant) return deny("no_capability_grant", `${agent.title} has no capability grant (default DENY).`);

  if (input.skillId) {
    const skill = getSkill(input.skillId);
    if (!skill || !skill.agents.includes(agent.id)) {
      return deny("skill_not_supported_by_agent", `${agent.title} is not granted skill "${input.skillId}".`);
    }
  }

  if (!grant.dataScopes.includes(input.dataScope)) {
    return deny("data_scope_not_allowed", `${agent.title} may not operate on data scope "${input.dataScope}".`);
  }

  if (input.externalIntegration) {
    if (!grant.externalIntegrations.includes(input.externalIntegration)) {
      return deny(
        "external_integration_not_allowed",
        `External integration "${input.externalIntegration}" is not allowlisted for ${agent.title}.`,
      );
    }
  }

  if (!input.toolId) return ok;
  const tool = getTool(input.toolId);
  if (!tool) return deny("unknown_tool", `Tool "${input.toolId}" is not in the canonical tool registry.`);

  if (grant.tools.includes(tool.id)) return ok;
  if (!grant.toolCategories.includes(tool.category)) {
    return deny(
      "tool_category_not_allowed",
      `${agent.title} is not allowlisted for "${tool.category}" tools (${tool.name}).`,
    );
  }
  return ok;
}

export interface CapabilityMatrixRow {
  readonly agentId: HappyAgentId;
  readonly title: string;
  readonly owner: string;
  readonly granted: boolean;
  readonly toolCategories: readonly HappyToolCategory[];
  readonly dataScopes: readonly DataScope[];
  readonly externalIntegrations: readonly string[];
  readonly maxDelegationDepth: number;
}

/** Founder-facing governance matrix. Read-only projection. */
export function capabilityMatrix(agents: readonly { id: HappyAgentId; title: string; owner: string }[]): readonly CapabilityMatrixRow[] {
  return agents.map((a) => {
    const g = grantFor(a.id);
    return {
      agentId: a.id,
      title: a.title,
      owner: a.owner,
      granted: Boolean(g),
      toolCategories: g?.toolCategories ?? [],
      dataScopes: g?.dataScopes ?? [],
      externalIntegrations: g?.externalIntegrations ?? [],
      maxDelegationDepth: g?.maxDelegationDepth ?? 0,
    };
  });
}
