/**
 * R121 — HAPPY Builder Ecosystem™ (Intelligence Layer)
 *
 * Pure extension layer over the canonical Builder runtime.
 * Canonical owners (unchanged):
 *   - Website Builder ......... src/lib/website-builder/engine.ts + builder.functions.ts
 *   - App Builder ............. src/lib/app-builder/engine.ts + app-builder.functions.ts
 *   - Universal AI Builder .... src/lib/uabr/* (planner, design, database, backend, frontend,
 *                               documentation, test, deployment engines)
 *   - Legacy shim wrappers .... src/lib/builder-v1.functions.ts,
 *                               src/lib/app-builder-v1.functions.ts,
 *                               src/lib/website-builder-v1.functions.ts (deprecated re-exports)
 *
 * FOUNDER LOCK — no Builder V2, no duplicate runtime, no duplicate generator,
 * component engine, theme engine, template engine, deployment engine, or preview
 * engine. This file adds intelligence helpers only — classification, routing,
 * planning, permissions, analytics, brain integration.
 */

/* --------------------------------------------------------------------- */
/* Phase 1 — Builder kinds (24 kinds mapped onto 3 canonical runtimes)   */
/* --------------------------------------------------------------------- */

export const BUILDER_KINDS = [
  "website", "landing", "portfolio", "blog", "marketplace", "store",
  "app", "pwa", "android", "ios", "desktop",
  "dashboard", "analytics", "report", "form",
  "workflow", "automation", "prompt",
  "database", "api",
  "template", "theme", "component",
  "course", "company",
  "ai_agent",
  "crm", "erp", "hrms", "inventory",
] as const;
export type BuilderKind = typeof BUILDER_KINDS[number];

export type CanonicalRuntime = "website-builder" | "app-builder" | "uabr";

/** Route a requested builder kind to its canonical runtime. */
export function runtimeFor(kind: BuilderKind): CanonicalRuntime {
  switch (kind) {
    case "website": case "landing": case "portfolio":
    case "blog": case "marketplace": case "store":
      return "website-builder";
    case "app": case "pwa": case "android": case "ios": case "desktop":
      return "app-builder";
    default:
      return "uabr"; // dashboards, workflows, database/api/agents/crm/erp/etc.
  }
}

/* --------------------------------------------------------------------- */
/* Phase 2 — Architecture V2 (contract exported to Brain/DH/Workspace)   */
/* --------------------------------------------------------------------- */

export interface BuilderPipeline {
  kind: BuilderKind;
  runtime: CanonicalRuntime;
  stages: BuilderStage[];
}

export type BuilderStage =
  | "understand"    // parse prompt/brief/asset
  | "plan"          // architecture/DB/API/UI plan
  | "design"        // theme + tokens + layout
  | "schema"        // DB tables/relations/policies/migrations
  | "backend"       // server fns / api / integrations
  | "frontend"      // components + routes
  | "permissions"   // roles/capabilities
  | "analytics"     // events + dashboards
  | "automations"   // workflows + triggers
  | "test"          // generated test plan
  | "preview"       // draft/live preview
  | "publish"       // versioning + rollback
  | "deploy";       // deployment target

const FULL_STAGES: BuilderStage[] = [
  "understand", "plan", "design", "schema", "backend", "frontend",
  "permissions", "analytics", "automations", "test", "preview",
  "publish", "deploy",
];

/** Deterministic pipeline for a kind — no runtime cost, safe in loaders. */
export function pipelineFor(kind: BuilderKind): BuilderPipeline {
  const runtime = runtimeFor(kind);
  // Website/landing/portfolio skip DB/backend unless the kind needs it.
  const light: Record<string, BuilderStage[]> = {
    landing:   ["understand", "plan", "design", "frontend", "preview", "publish", "deploy"],
    portfolio: ["understand", "plan", "design", "frontend", "preview", "publish", "deploy"],
    blog:      ["understand", "plan", "design", "schema", "frontend", "preview", "publish", "deploy"],
    theme:     ["understand", "design", "preview", "publish"],
    template:  ["understand", "design", "frontend", "preview", "publish"],
    component: ["understand", "design", "frontend", "preview", "publish"],
    prompt:    ["understand", "plan", "preview", "publish"],
  };
  const stages = light[kind] ?? FULL_STAGES;
  return { kind, runtime, stages };
}

/* --------------------------------------------------------------------- */
/* Phase 3–4 — Builder Intelligence (auto-plan from a brief)             */
/* --------------------------------------------------------------------- */

export interface BuilderBrief {
  prompt: string;
  kind?: BuilderKind;
  projectName?: string;
  audience?: "founder" | "business" | "developer" | "customer" | "student";
}

export interface BuilderPlan {
  kind: BuilderKind;
  runtime: CanonicalRuntime;
  stages: BuilderStage[];
  needsDatabase: boolean;
  needsAuth: boolean;
  needsPayments: boolean;
  needsAI: boolean;
  targets: DeploymentTarget[];
  estimatedComponents: number;
  confidence: number; // 0..1
}

export type DeploymentTarget = "web" | "pwa" | "android" | "ios" | "desktop" | "api";

const PROMPT_HINTS: Array<{ re: RegExp; kind: BuilderKind }> = [
  [/landing|one[- ]?page|hero/i, "landing"],
  [/portfolio|resume|cv/i, "portfolio"],
  [/blog|articles?|news/i, "blog"],
  [/store|shop|ecommerce|checkout/i, "store"],
  [/marketplace/i, "marketplace"],
  [/android|play store/i, "android"],
  [/ios|iphone|app store/i, "ios"],
  [/desktop|electron|tauri/i, "desktop"],
  [/pwa|progressive web/i, "pwa"],
  [/dashboard|kpi|metrics view/i, "dashboard"],
  [/report/i, "report"],
  [/form|survey|intake/i, "form"],
  [/workflow|pipeline|steps/i, "workflow"],
  [/automation|schedule|cron/i, "automation"],
  [/prompt|instruction template/i, "prompt"],
  [/database|schema|tables?/i, "database"],
  [/api|endpoint|rest/i, "api"],
  [/theme|palette|typography/i, "theme"],
  [/template/i, "template"],
  [/component|widget/i, "component"],
  [/course|lesson|lms/i, "course"],
  [/company|organi[sz]ation setup/i, "company"],
  [/agent|assistant|bot/i, "ai_agent"],
  [/crm|leads?|contacts?/i, "crm"],
  [/erp|invoic|inventory chain/i, "erp"],
  [/hrms|payroll|employees?/i, "hrms"],
  [/inventory|stock|warehouse/i, "inventory"],
  [/analytics/i, "analytics"],
  [/mobile app|app$/i, "app"],
].map(([re, kind]) => ({ re: re as RegExp, kind: kind as BuilderKind }));

function detectKind(prompt: string, hinted?: BuilderKind): BuilderKind {
  if (hinted) return hinted;
  for (const { re, kind } of PROMPT_HINTS) if (re.test(prompt)) return kind;
  return "website";
}

export function planBuilder(brief: BuilderBrief): BuilderPlan {
  const kind = detectKind(brief.prompt, brief.kind);
  const pipeline = pipelineFor(kind);
  const p = brief.prompt.toLowerCase();
  const needsDatabase = pipeline.stages.includes("schema") ||
    /login|user|save|store|record|order|customer|invoice|inventory/.test(p);
  const needsAuth = needsDatabase || /login|signup|account|role|permission/.test(p);
  const needsPayments = /pay|stripe|paddle|checkout|subscription|billing/.test(p);
  const needsAI = /ai|assistant|chat|generate|summari[sz]e|recommend/.test(p) ||
    ["ai_agent", "prompt", "workflow", "automation"].includes(kind);

  const targets: DeploymentTarget[] = [];
  if (["android", "app"].includes(kind)) targets.push("android");
  if (["ios", "app"].includes(kind)) targets.push("ios");
  if (kind === "desktop") targets.push("desktop");
  if (kind === "pwa") targets.push("pwa");
  if (["api", "database"].includes(kind)) targets.push("api");
  if (targets.length === 0) targets.push("web");

  const estimatedComponents = Math.min(
    120,
    8 + Math.round(brief.prompt.length / 40) + (needsDatabase ? 6 : 0) + (needsAI ? 4 : 0),
  );

  let confidence = 0.55;
  if (brief.kind) confidence += 0.25;
  if (brief.prompt.length > 60) confidence += 0.1;
  if (brief.prompt.length > 200) confidence += 0.05;
  confidence = Math.min(0.95, confidence);

  return {
    kind,
    runtime: pipeline.runtime,
    stages: pipeline.stages,
    needsDatabase,
    needsAuth,
    needsPayments,
    needsAI,
    targets,
    estimatedComponents,
    confidence,
  };
}

/* --------------------------------------------------------------------- */
/* Phase 11 — Universal Components / Templates catalog                   */
/* --------------------------------------------------------------------- */

export const UNIVERSAL_BLOCKS = [
  "hero", "navbar", "footer", "features", "cards", "pricing", "gallery",
  "faq", "testimonials", "contact_form", "map", "video", "cta", "text",
  "image", "columns", "table", "chart", "kanban", "calendar", "timeline",
  "stats", "signup", "login", "dashboard", "custom",
] as const;
export type UniversalBlock = typeof UNIVERSAL_BLOCKS[number];

/** Recommend a starter block set for a builder kind. */
export function recommendedBlocks(kind: BuilderKind): UniversalBlock[] {
  switch (kind) {
    case "landing":   return ["hero", "features", "pricing", "testimonials", "cta", "footer"];
    case "portfolio": return ["hero", "gallery", "cards", "contact_form", "footer"];
    case "blog":      return ["navbar", "hero", "cards", "text", "footer"];
    case "store":     return ["navbar", "hero", "cards", "pricing", "cta", "footer"];
    case "dashboard": return ["stats", "chart", "table", "kanban", "timeline"];
    case "form":      return ["hero", "contact_form", "cta"];
    case "crm":       return ["stats", "table", "kanban", "chart"];
    case "erp":       return ["stats", "table", "chart", "timeline"];
    case "hrms":      return ["stats", "table", "calendar", "chart"];
    case "inventory": return ["stats", "table", "chart"];
    case "course":    return ["hero", "cards", "video", "text", "faq"];
    default:          return ["hero", "features", "cta", "footer"];
  }
}

/* --------------------------------------------------------------------- */
/* Phase 12 — Preview / Publishing / Deployment contract                 */
/* --------------------------------------------------------------------- */

export type PublishState = "draft" | "review" | "published" | "rolled_back";
export interface PublishDecision {
  next: PublishState;
  allowed: boolean;
  reason?: string;
}

export function nextPublishState(
  current: PublishState,
  action: "save" | "submit" | "publish" | "rollback",
  role: BuilderRole,
): PublishDecision {
  const can = hasBuilderCapability(role, "publish");
  switch (action) {
    case "save":     return { next: "draft", allowed: true };
    case "submit":   return { next: "review", allowed: true };
    case "publish":  return can
      ? { next: "published", allowed: true }
      : { next: current, allowed: false, reason: "insufficient_role" };
    case "rollback": return can
      ? { next: "rolled_back", allowed: true }
      : { next: current, allowed: false, reason: "insufficient_role" };
  }
}

/* --------------------------------------------------------------------- */
/* Permissions — reuse workspace role model                              */
/* --------------------------------------------------------------------- */

export type BuilderRole =
  | "viewer" | "editor" | "designer" | "developer"
  | "admin" | "owner" | "founder";

export type BuilderCapability =
  | "read" | "edit" | "design" | "schema" | "publish"
  | "deploy" | "manage_roles" | "delete";

const ROLE_CAPS: Record<BuilderRole, BuilderCapability[]> = {
  viewer:    ["read"],
  editor:    ["read", "edit"],
  designer:  ["read", "edit", "design"],
  developer: ["read", "edit", "design", "schema"],
  admin:     ["read", "edit", "design", "schema", "publish", "deploy", "manage_roles"],
  owner:     ["read", "edit", "design", "schema", "publish", "deploy", "manage_roles", "delete"],
  founder:   ["read", "edit", "design", "schema", "publish", "deploy", "manage_roles", "delete"],
};

export function capabilitiesFor(role: BuilderRole): BuilderCapability[] {
  return ROLE_CAPS[role];
}
export function hasBuilderCapability(role: BuilderRole, cap: BuilderCapability): boolean {
  return ROLE_CAPS[role].includes(cap);
}

/* --------------------------------------------------------------------- */
/* Phase 13 — Analytics snapshot                                          */
/* --------------------------------------------------------------------- */

export interface BuilderEvent {
  kind: BuilderKind;
  stage: BuilderStage | "error";
  ms: number;
  aiAssisted: boolean;
  success: boolean;
}

export interface BuilderAnalytics {
  projects: number;
  generations: number;
  publishes: number;
  deployments: number;
  errors: number;
  avgMs: number;
  aiAssistRate: number;
  perKind: Record<string, number>;
}

export function analyticsSnapshot(events: BuilderEvent[]): BuilderAnalytics {
  const perKind: Record<string, number> = {};
  let publishes = 0, deployments = 0, errors = 0, ai = 0, ms = 0, gens = 0;
  const projects = new Set<string>();
  for (const e of events) {
    perKind[e.kind] = (perKind[e.kind] ?? 0) + 1;
    projects.add(e.kind);
    if (e.stage === "publish" && e.success) publishes++;
    if (e.stage === "deploy" && e.success) deployments++;
    if (!e.success || e.stage === "error") errors++;
    if (e.aiAssisted) ai++;
    if (e.stage === "understand" || e.stage === "plan") gens++;
    ms += e.ms;
  }
  return {
    projects: projects.size,
    generations: gens,
    publishes,
    deployments,
    errors,
    avgMs: events.length ? Math.round(ms / events.length) : 0,
    aiAssistRate: events.length ? +(ai / events.length).toFixed(3) : 0,
    perKind,
  };
}

/* --------------------------------------------------------------------- */
/* Phase 14 — Brain integration hook                                     */
/* --------------------------------------------------------------------- */

export interface BuilderBrainHint {
  runtime: CanonicalRuntime;
  kind: BuilderKind;
  stages: BuilderStage[];
  targets: DeploymentTarget[];
  needs: { db: boolean; auth: boolean; ai: boolean; payments: boolean };
  confidence: number;
}

/** Compact hint consumed by `runBrain()` Stage 6 (workspace/context). */
export function resolveForBrain(brief: BuilderBrief): BuilderBrainHint {
  const p = planBuilder(brief);
  return {
    runtime: p.runtime,
    kind: p.kind,
    stages: p.stages,
    targets: p.targets,
    needs: {
      db: p.needsDatabase,
      auth: p.needsAuth,
      ai: p.needsAI,
      payments: p.needsPayments,
    },
    confidence: p.confidence,
  };
}
