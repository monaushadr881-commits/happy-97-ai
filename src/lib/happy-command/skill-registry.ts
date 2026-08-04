/**
 * HAPPY Skill Registry — canonical catalogue of what an AGENT can do.
 *
 * Extends `agent-roster.ts` (who) and `tool-registry.ts` (what executes).
 * PURE DATA + PURE FUNCTIONS: no runtime, no table, no approval engine.
 */

import type { HappyAgentId } from "./agent-roster";
import type { HappyToolCategory, WorkforceRisk } from "./tool-registry";

export type HappySkillCategory =
  | "research"
  | "development"
  | "product"
  | "creative"
  | "business"
  | "deployment";

export interface HappySkill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: HappySkillCategory;
  readonly input: string;
  readonly output: string;
  readonly permissions: readonly string[];
  readonly risk: WorkforceRisk;
  readonly agents: readonly HappyAgentId[];
  /** Tool category this skill must execute through. */
  readonly tool: HappyToolCategory;
  /** Lowercase keywords used to resolve a task/stage to this skill. */
  readonly keywords: readonly string[];
  readonly version: string;
  readonly enabled: boolean;
}

function s(
  id: string,
  name: string,
  category: HappySkillCategory,
  risk: WorkforceRisk,
  tool: HappyToolCategory,
  agents: readonly HappyAgentId[],
  keywords: readonly string[],
  description: string,
  permissions: readonly string[],
  input = "{ goal, context }",
  output = "{ result, evidence }",
): HappySkill {
  return {
    id,
    name,
    description,
    category,
    input,
    output,
    permissions,
    risk,
    agents,
    tool,
    keywords,
    version: "v1",
    enabled: true,
  };
}

export const HAPPY_SKILLS: readonly HappySkill[] = [
  // ---- Research
  s("skill.research.web", "Web Research", "research", "low", "browser", ["research", "ai-manager"], ["research", "web"], "Gather external evidence with citations.", ["read:knowledge"]),
  s("skill.research.market", "Market Research", "research", "low", "search", ["research", "business-analyst"], ["market"], "Size the market and identify segments.", ["read:knowledge"]),
  s("skill.research.competitor", "Competitor Research", "research", "low", "search", ["research", "marketing"], ["competitor", "competitive"], "Compare competing products and positioning.", ["read:knowledge"]),
  s("skill.research.document", "Document Research", "research", "low", "document", ["research", "knowledge"], ["document research"], "Extract findings from supplied documents.", ["read:knowledge"]),
  s("skill.research.knowledge", "Knowledge Search", "research", "low", "search", ["knowledge", "research"], ["knowledge", "search"], "Search authorized internal knowledge only.", ["read:knowledge"]),
  s("skill.research.data", "Data Analysis", "research", "low", "analytics", ["business-analyst", "research"], ["analysis", "analyse", "analyze", "insight"], "Analyse data sets and report findings.", ["read:analytics"]),

  // ---- Development
  s("skill.dev.codegen", "Code Generation", "development", "medium", "build", ["frontend", "backend", "fullstack", "developer", "mobile", "game-developer"], ["frontend", "backend", "code", "implement", "build"], "Generate new application code.", ["write:code"]),
  s("skill.dev.modify", "Code Modification", "development", "medium", "file", ["developer", "fullstack"], ["modify", "change", "update code"], "Modify existing code with a reviewable diff.", ["write:code"]),
  s("skill.dev.review", "Code Review", "development", "low", "git", ["code-review", "security"], ["review"], "Review a diff for duplication and safety.", ["read:repo"]),
  s("skill.dev.debug", "Debugging", "development", "medium", "build", ["debugging", "developer"], ["debug", "bug", "error", "fix"], "Reproduce and isolate a defect.", ["read:repo"]),
  s("skill.dev.refactor", "Refactoring", "development", "medium", "file", ["developer", "code-review"], ["refactor"], "Restructure code without behaviour change.", ["write:code"]),
  s("skill.dev.test", "Testing", "development", "low", "build", ["qa", "testing"], ["test", "testing", "qa"], "Author and run automated tests.", ["write:tests"]),
  s("skill.dev.build", "Build", "development", "medium", "build", ["devops", "deployment"], ["build", "compile", "preview"], "Produce a build artefact.", ["read:repo"]),
  s("skill.dev.dependency", "Dependency Analysis", "development", "low", "build", ["code-review", "security"], ["dependency", "package"], "Inspect dependencies for risk.", ["read:repo"]),

  // ---- Product
  s("skill.product.requirements", "Requirement Analysis", "product", "low", "document", ["product-manager", "business-analyst"], ["requirement", "requirements", "scope"], "Turn a goal into measurable requirements.", ["write:plan"]),
  s("skill.product.prd", "PRD Creation", "product", "low", "document", ["product-manager"], ["prd", "spec"], "Write the product requirements document.", ["write:docs"]),
  s("skill.product.architecture", "Architecture Planning", "product", "low", "document", ["software-architect"], ["architecture", "architect"], "Choose architecture and canonical owners.", ["write:plan"]),
  s("skill.product.uiux", "UI/UX Planning", "product", "low", "document", ["uiux", "content-designer"], ["ui", "ux", "ui/ux", "design"], "Define flows, IA and interaction quality.", ["write:plan"]),
  s("skill.product.database", "Database Design", "product", "high", "database", ["database"], ["database", "schema", "rls"], "Design schema, relations, indexes and RLS.", ["write:migration"]),
  s("skill.product.api", "API Design", "product", "medium", "api", ["api", "backend"], ["api", "endpoint", "contract"], "Define API contracts and connectors.", ["write:code"]),

  // ---- Creative
  s("skill.creative.image", "Image Generation", "creative", "low", "image", ["image", "graphic-designer"], ["image", "picture"], "Generate images from a brief.", ["write:content"]),
  s("skill.creative.image_edit", "Image Editing", "creative", "low", "image", ["image"], ["image edit", "retouch"], "Edit or restyle an existing image.", ["write:content"]),
  s("skill.creative.video", "Video Creation", "creative", "medium", "video", ["video"], ["video", "reel"], "Create a video from a script and assets.", ["write:content"]),
  s("skill.creative.video_edit", "Video Editing", "creative", "medium", "video", ["video"], ["video edit", "cut"], "Edit an existing video.", ["write:content"]),
  s("skill.creative.audio", "Audio Generation", "creative", "low", "audio", ["audio"], ["audio", "voice", "voiceover"], "Generate voiceover or audio bed.", ["write:content"]),
  s("skill.creative.music", "Music Assistance", "creative", "low", "audio", ["audio"], ["music"], "Assist with music selection and timing.", ["write:content"]),
  s("skill.creative.script", "Script Writing", "creative", "low", "document", ["content", "video"], ["script", "copy", "caption"], "Write scripts, copy and captions.", ["write:content"]),
  s("skill.creative.presentation", "Presentation Creation", "creative", "low", "document", ["presentation"], ["presentation", "deck", "slides"], "Build a deck with notes.", ["write:docs"]),
  s("skill.creative.poster", "Poster Creation", "creative", "low", "image", ["graphic-designer"], ["poster", "banner"], "Design a poster or banner.", ["write:content"]),
  s("skill.creative.thumbnail", "Thumbnail Creation", "creative", "low", "image", ["graphic-designer"], ["thumbnail"], "Design a thumbnail.", ["write:content"]),
  s("skill.creative.brand", "Logo / Graphic Design", "creative", "low", "image", ["brand-designer", "graphic-designer"], ["logo", "brand", "identity"], "Design logo and brand assets.", ["write:content"]),

  // ---- Business
  s("skill.business.plan", "Business Planning", "business", "low", "document", ["business-consultant", "business-analyst"], ["business plan", "business"], "Draft business model and growth plan.", ["read:analytics"]),
  s("skill.business.marketing", "Marketing Planning", "business", "medium", "document", ["marketing", "social-media"], ["marketing", "campaign"], "Plan campaigns, audiences and messaging.", ["write:campaign"]),
  s("skill.business.leadgen", "Lead Generation", "business", "medium", "analytics", ["sales", "marketing"], ["lead", "leads", "pipeline"], "Identify and score leads.", ["write:crm"]),
  s("skill.business.crm", "CRM Operations", "business", "medium", "database", ["crm", "sales"], ["crm", "contact", "deal"], "Maintain contacts, deals and activities.", ["write:crm"]),
  s("skill.business.support", "Customer Support", "business", "medium", "communication", ["customer-support"], ["support", "ticket"], "Resolve tickets from authorized knowledge.", ["write:ticket"]),
  s("skill.business.inventory", "Inventory Operations", "business", "medium", "database", ["inventory", "manufacturing", "logistics"], ["inventory", "stock", "warehouse"], "Track stock and movements.", ["write:inventory"]),
  s("skill.business.finance", "Finance Assistance", "business", "high", "database", ["finance-assistant"], ["finance", "invoice", "payment", "billing"], "Assist with invoices, expenses and forecast.", ["read:finance"]),
  s("skill.business.hr", "HR Operations", "business", "medium", "database", ["hr-assistant"], ["hr", "payroll", "employee"], "Support people-operations workflows.", ["read:hr"]),
  s("skill.business.reporting", "Reporting", "business", "low", "analytics", ["business-analyst", "operations"], ["report", "kpi", "dashboard"], "Produce operational and business reports.", ["read:analytics"]),

  // ---- Deployment
  s("skill.deploy.build", "Release Build", "deployment", "medium", "build", ["devops", "deployment"], ["release build"], "Produce the release artefact.", ["read:repo"]),
  s("skill.deploy.deploy", "Deployment", "deployment", "high", "deployment", ["deployment", "devops"], ["deploy", "ship", "production", "launch"], "Deploy to an environment.", ["write:deployment"]),
  s("skill.deploy.domain", "Domain Management", "deployment", "high", "deployment", ["cloud", "devops"], ["domain", "dns"], "Attach and verify domains.", ["write:deployment"]),
  s("skill.deploy.ssl", "SSL Management", "deployment", "high", "deployment", ["cloud"], ["ssl", "certificate", "https"], "Issue and renew certificates.", ["write:deployment"]),
  s("skill.deploy.monitor", "Monitoring", "deployment", "low", "analytics", ["monitoring", "operations"], ["monitor", "monitoring", "health", "uptime"], "Watch health, errors and performance.", ["read:ops"]),
  s("skill.deploy.rollback", "Rollback", "deployment", "critical", "deployment", ["deployment", "devops"], ["rollback", "revert"], "Roll production back to a known-good release.", ["write:deployment"]),
  s("skill.deploy.redeploy", "Redeployment", "deployment", "high", "deployment", ["deployment"], ["redeploy"], "Redeploy the current release.", ["write:deployment"]),
  s("skill.security.review", "Security Review", "development", "medium", "database", ["security"], ["security", "rls", "permission", "audit"], "Review permissions, RLS and secret hygiene.", ["read:schema"]),
];

const BY_ID = new Map(HAPPY_SKILLS.map((k) => [k.id, k]));

export function getSkill(id: string): HappySkill | undefined {
  return BY_ID.get(id);
}

export function skillsForAgent(agent: HappyAgentId): readonly HappySkill[] {
  return HAPPY_SKILLS.filter((k) => k.agents.includes(agent));
}

export function skillsInCategory(category: HappySkillCategory): readonly HappySkill[] {
  return HAPPY_SKILLS.filter((k) => k.category === category);
}

/**
 * Deterministic skill match for a task/stage description, optionally
 * constrained to the assigned agent's skill set.
 */
export function matchSkill(task: string, agent?: HappyAgentId): HappySkill | undefined {
  const text = task.toLowerCase();
  const pool = agent ? skillsForAgent(agent) : HAPPY_SKILLS;
  const scored = (pool.length > 0 ? pool : HAPPY_SKILLS)
    .filter((k) => k.enabled)
    .map((k) => ({
      skill: k,
      score: k.keywords.reduce((n, w) => (text.includes(w) ? n + w.length : n), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.skill ?? (agent ? skillsForAgent(agent)[0] : undefined);
}
