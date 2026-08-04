/**
 * HAPPY Autonomous Agent Roster — Canonical registry of the named AI agents.
 *
 * Extends `src/lib/founder/executive/members.ts` (Executive Board) — no
 * duplication: the board reviews, this roster EXECUTES. Every agent maps to
 * an EXISTING canonical runtime owner; this file adds no runtime of its own.
 */

import type { HappyIntentId } from "./intent-registry";

export type HappyAgentId =
  | "product-manager"
  | "software-architect"
  | "developer"
  | "frontend"
  | "backend"
  | "database"
  | "api"
  | "uiux"
  | "qa"
  | "security"
  | "devops"
  | "seo"
  | "marketing"
  | "content"
  | "documentation"
  | "research"
  | "business-consultant"
  | "sales"
  | "customer-support"
  | "hr-assistant"
  | "finance-assistant"
  | "operations"
  | "project-manager"
  | "orchestrator"
  | "ai-manager"
  | "ai-planner"
  | "business-analyst"
  | "graphic-designer"
  | "brand-designer"
  | "content-designer"
  | "fullstack"
  | "mobile"
  | "game-developer"
  | "testing"
  | "debugging"
  | "code-review"
  | "deployment"
  | "cloud"
  | "monitoring"
  | "crm"
  | "inventory"
  | "manufacturing"
  | "logistics"
  | "social-media"
  | "video"
  | "image"
  | "audio"
  | "presentation"
  | "knowledge"
  | "education";

export interface HappyAgent {
  readonly id: HappyAgentId;
  readonly title: string;
  readonly mission: string;
  /** Existing canonical owner this agent delegates work to. */
  readonly owner: string;
  readonly capabilities: readonly string[];
  /** Intents this agent participates in. */
  readonly intents: readonly HappyIntentId[];
  /** Least-privilege permission scopes. */
  readonly permissions: readonly string[];
  /** Whether this agent's output can execute without Founder approval. */
  readonly autonomous: boolean;
}

export const HAPPY_AGENTS: readonly HappyAgent[] = [
  {
    id: "product-manager",
    title: "AI Product Manager",
    mission: "Turn the command into requirements, scope, and acceptance criteria.",
    owner: "src/lib/founder/pipeline.ts",
    capabilities: ["requirement analysis", "PRD", "scope control", "acceptance criteria"],
    intents: ["build_app", "build_website", "build_mobile", "build_game", "build_agent"],
    permissions: ["read:project", "write:plan"],
    autonomous: true,
  },
  {
    id: "software-architect",
    title: "AI Software Architect",
    mission: "Choose the architecture and enforce single canonical ownership.",
    owner: "docs/MASTER_ARCHITECTURE_LOCK.md",
    capabilities: ["architecture", "module boundaries", "duplication prevention"],
    intents: ["build_app", "build_mobile", "build_api", "build_database"],
    permissions: ["read:repo", "write:plan"],
    autonomous: true,
  },
  {
    id: "developer",
    title: "AI Developer Agent",
    mission: "Implement the planned change end to end.",
    owner: "src/lib/builder/builder-submit.functions.ts",
    capabilities: ["code generation", "refactor", "diff preview"],
    intents: ["build_app", "fix_bug", "build_api", "automate_task"],
    permissions: ["read:repo", "write:code"],
    autonomous: false,
  },
  {
    id: "frontend",
    title: "AI Frontend Agent",
    mission: "Build responsive, token-driven interfaces.",
    owner: "src/design-system/index.ts",
    capabilities: ["react", "responsive layout", "design tokens"],
    intents: ["build_app", "build_website", "build_mobile"],
    permissions: ["read:repo", "write:code"],
    autonomous: false,
  },
  {
    id: "backend",
    title: "AI Backend Agent",
    mission: "Build server functions and business logic.",
    owner: "src/services/index.ts",
    capabilities: ["server functions", "validation", "business rules"],
    intents: ["build_app", "build_api", "automate_task"],
    permissions: ["read:repo", "write:code"],
    autonomous: false,
  },
  {
    id: "database",
    title: "AI Database Agent",
    mission: "Design schema, relationships, indexes, and RLS.",
    owner: "src/services/core/context.ts",
    capabilities: ["schema design", "migrations", "RLS policies", "seed data"],
    intents: ["build_database", "build_app"],
    permissions: ["read:schema", "write:migration"],
    autonomous: false,
  },
  {
    id: "api",
    title: "AI API Agent",
    mission: "Define contracts, endpoints, and connectors.",
    owner: "src/lib/api-v1.functions.ts",
    capabilities: ["REST design", "webhooks", "OAuth", "API docs"],
    intents: ["build_api", "build_app"],
    permissions: ["read:repo", "write:code"],
    autonomous: false,
  },
  {
    id: "uiux",
    title: "AI UI/UX Agent",
    mission: "Own information architecture and interaction quality.",
    owner: "src/design-system/primitives.tsx",
    capabilities: ["wireframes", "flows", "accessibility"],
    intents: ["build_app", "build_website", "build_mobile", "build_game"],
    permissions: ["read:repo", "write:plan"],
    autonomous: true,
  },
  {
    id: "qa",
    title: "AI QA Agent",
    mission: "Write and run tests; block unsafe releases.",
    owner: "docs/R183_MIGRATION_GUARDRAILS.md",
    capabilities: ["unit tests", "integration tests", "regression gate"],
    intents: ["build_app", "fix_bug", "deploy"],
    permissions: ["read:repo", "write:tests"],
    autonomous: true,
  },
  {
    id: "security",
    title: "AI Security Agent",
    mission: "Enforce least privilege, RLS, and secret hygiene.",
    owner: "src/ops/security-ops.service.ts",
    capabilities: ["RLS review", "permission audit", "vulnerability scan"],
    intents: ["build_app", "build_api", "build_database", "deploy"],
    permissions: ["read:repo", "read:schema"],
    autonomous: true,
  },
  {
    id: "devops",
    title: "AI DevOps Agent",
    mission: "Build, stage, deploy, and roll back safely.",
    owner: "src/ops/deployment.service.ts",
    capabilities: ["build pipeline", "staging", "rollback", "health checks"],
    intents: ["deploy", "connect_domain", "inspect_production"],
    permissions: ["read:repo", "write:deployment"],
    autonomous: false,
  },
  {
    id: "seo",
    title: "AI SEO Agent",
    mission: "Own metadata, structure, and discoverability.",
    owner: "src/lib/knowledge-v1.functions.ts",
    capabilities: ["metadata", "sitemap", "keyword mapping"],
    intents: ["build_website", "create_campaign"],
    permissions: ["read:repo", "write:content"],
    autonomous: true,
  },
  {
    id: "marketing",
    title: "AI Marketing Agent",
    mission: "Plan campaigns, audiences, and messaging.",
    owner: "src/lib/communication/communication-runtime.functions.ts",
    capabilities: ["campaign plan", "audience", "A/B tests"],
    intents: ["create_campaign", "analyze_business"],
    permissions: ["read:analytics", "write:campaign"],
    autonomous: false,
  },
  {
    id: "content",
    title: "AI Content Agent",
    mission: "Produce copy, captions, and creative briefs.",
    owner: "src/lib/creator-v1.functions.ts",
    capabilities: ["copywriting", "captions", "scripts"],
    intents: ["create_content", "create_campaign", "build_website"],
    permissions: ["write:content"],
    autonomous: true,
  },
  {
    id: "documentation",
    title: "AI Documentation Agent",
    mission: "Generate README, API docs, and changelogs.",
    owner: "src/lib/founder/document.functions.ts",
    capabilities: ["README", "API docs", "release notes"],
    intents: ["build_app", "build_api", "deploy"],
    permissions: ["write:docs"],
    autonomous: true,
  },
  {
    id: "research",
    title: "AI Research Agent",
    mission: "Gather and verify external and internal evidence.",
    owner: "src/lib/knowledge/knowledge-runtime.functions.ts",
    capabilities: ["research", "citation", "competitive scan"],
    intents: ["analyze_business", "manage_knowledge", "create_campaign"],
    permissions: ["read:knowledge"],
    autonomous: true,
  },
  {
    id: "business-consultant",
    title: "AI Business Consultant",
    mission: "Advise on model, pricing, and growth.",
    owner: "src/lib/business/business-runtime.functions.ts",
    capabilities: ["business model", "pricing", "growth plan"],
    intents: ["analyze_business"],
    permissions: ["read:analytics"],
    autonomous: true,
  },
  {
    id: "sales",
    title: "AI Sales Agent",
    mission: "Own pipeline, lead scoring, and follow-ups.",
    owner: "src/lib/business/crm-finance-hr-runtime.functions.ts",
    capabilities: ["pipeline", "lead scoring", "proposals"],
    intents: ["analyze_business", "create_campaign"],
    permissions: ["read:crm", "write:crm"],
    autonomous: false,
  },
  {
    id: "customer-support",
    title: "AI Customer Support Agent",
    mission: "Resolve tickets using authorized knowledge only.",
    owner: "src/lib/business/support-service-runtime.functions.ts",
    capabilities: ["ticket triage", "answers", "escalation"],
    intents: ["build_agent", "manage_knowledge"],
    permissions: ["read:knowledge", "write:ticket"],
    autonomous: false,
  },
  {
    id: "hr-assistant",
    title: "AI HR Assistant",
    mission: "Support people operations workflows.",
    owner: "src/lib/business/crm-finance-hr-runtime.functions.ts",
    capabilities: ["job specs", "onboarding", "policy answers"],
    intents: ["analyze_business", "automate_task"],
    permissions: ["read:hr"],
    autonomous: false,
  },
  {
    id: "finance-assistant",
    title: "AI Finance Assistant",
    mission: "Support invoicing, expenses, and forecasting.",
    owner: "src/lib/revenue/revenue.functions.ts",
    capabilities: ["invoices", "expenses", "forecast"],
    intents: ["analyze_business"],
    permissions: ["read:finance"],
    autonomous: false,
  },
  {
    id: "operations",
    title: "AI Operations Agent",
    mission: "Keep queues, jobs, and incidents healthy.",
    owner: "src/ops/index.ts",
    capabilities: ["queue health", "incidents", "runbooks"],
    intents: ["inspect_production", "automate_task"],
    permissions: ["read:ops"],
    autonomous: true,
  },
  {
    id: "project-manager",
    title: "AI Project Manager",
    mission: "Sequence tasks, track progress, and report.",
    owner: "src/lib/founder/mission-control.functions.ts",
    capabilities: ["task sequencing", "progress tracking", "reporting"],
    intents: [
      "build_app",
      "build_website",
      "build_mobile",
      "build_game",
      "deploy",
      "automate_task",
    ],
    permissions: ["read:project", "write:task"],
    autonomous: true,
  },
];

const BY_ID = new Map<HappyAgentId, HappyAgent>(HAPPY_AGENTS.map((a) => [a.id, a]));

export function getAgent(id: HappyAgentId): HappyAgent | undefined {
  return BY_ID.get(id);
}

/** Agents that participate in a given intent, in execution order. */
export function agentsForIntent(intent: HappyIntentId): readonly HappyAgent[] {
  const matched = HAPPY_AGENTS.filter((a) => a.intents.includes(intent));
  return matched.length > 0
    ? matched
    : [BY_ID.get("product-manager")!, BY_ID.get("project-manager")!];
}
