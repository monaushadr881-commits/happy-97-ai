/**
 * R164 — AI Impact Analyzer™
 *
 * Pure governance + analysis layer. ZERO new runtime, ZERO Impact
 * Engine V2, ZERO Analysis Runtime V2. Composes existing canonical
 * owners only:
 *
 *   - Intent Engine       → src/lib/founder/intent-engine.ts (R159)
 *   - Software Architect  → src/lib/founder/software-architect.ts (R161)
 *   - Code Review         → src/lib/founder/code-review-engineer.ts (R162)
 *   - QA & Testing        → src/lib/founder/qa-testing-engineer.ts (R163)
 *   - Guardian AI         → src/lib/founder/guardian-ai.ts (R160)
 *   - Approval Gateway    → src/lib/founder/approval-gateway.ts (R158) [handoff]
 *   - Brain / Memory / Search / Audit / RBAC / HappyID / Analytics
 *
 * FOLLOWS: R91 R104 R111 R115B R116 R118 R119 R120 R126 R128 R130 R145
 *          R153 R156 R157 R158 R159 R160 R161 R162 R163.
 *
 * The Impact Analyzer NEVER implements. It calculates the complete
 * impact of a change and produces an Impact Report handed off to
 * R158 for Explain → Preview → Approve → Execute.
 */

// ─── Analysis scope (16 areas) ───────────────────────────────────────────
export const IMPACT_SCOPE = [
  "architecture", "business", "security", "performance", "revenue",
  "database", "api", "ui", "ux", "storage", "search", "memory",
  "brain", "deployment", "rollback", "compatibility",
] as const;
export type ImpactArea = (typeof IMPACT_SCOPE)[number];

// ─── Change-discovery surfaces (15) ──────────────────────────────────────
export const CHANGE_SURFACES = [
  "files", "folders", "routes", "components", "modules",
  "services", "libraries", "tables", "indexes", "policies",
  "storage_buckets", "workers", "tests", "documentation", "migrations",
] as const;
export type ChangeSurface = (typeof CHANGE_SURFACES)[number];

// ─── Dependency-analysis artifacts (6) ───────────────────────────────────
export const DEPENDENCY_ARTIFACTS = [
  "dependency_graph", "module_relations", "api_relations",
  "database_relations", "event_flow", "execution_flow",
] as const;
export type DependencyArtifact = (typeof DEPENDENCY_ARTIFACTS)[number];

// ─── Business impact dimensions (8) ──────────────────────────────────────
export const BUSINESS_IMPACT = [
  "revenue", "subscription", "credit", "enterprise",
  "workspace", "user", "company", "founder",
] as const;
export type BusinessImpact = (typeof BUSINESS_IMPACT)[number];

// ─── Security impact dimensions (9) ──────────────────────────────────────
export const SECURITY_IMPACT = [
  "authentication", "authorization", "rls", "secrets", "tokens",
  "audit", "founder_security", "guardian_ai", "risk_engine",
] as const;
export type SecurityImpact = (typeof SECURITY_IMPACT)[number];

// ─── Performance impact dimensions (10) ──────────────────────────────────
export const PERFORMANCE_IMPACT = [
  "bundle_size", "memory", "cpu", "network", "database",
  "search", "caching", "lazy_loading", "ai_cost", "startup",
] as const;
export type PerformanceImpact = (typeof PERFORMANCE_IMPACT)[number];

// ─── Database impact dimensions (8) ──────────────────────────────────────
export const DATABASE_IMPACT = [
  "tables", "indexes", "constraints", "relations",
  "triggers", "policies", "migrations", "rollback",
] as const;
export type DatabaseImpact = (typeof DATABASE_IMPACT)[number];

// ─── API impact dimensions (7) ───────────────────────────────────────────
export const API_IMPACT = [
  "endpoints", "validation", "contracts", "versioning",
  "caching", "rate_limits", "backward_compatibility",
] as const;
export type ApiImpact = (typeof API_IMPACT)[number];

// ─── UI impact dimensions (8) ────────────────────────────────────────────
export const UI_IMPACT = [
  "desktop", "tablet", "mobile", "android", "ios",
  "dark_mode", "light_mode", "accessibility",
] as const;
export type UiImpact = (typeof UI_IMPACT)[number];

// ─── Deployment impact dimensions (5) ────────────────────────────────────
export const DEPLOYMENT_IMPACT = [
  "downtime", "migration_time", "rollback_time",
  "risk_level", "deployment_complexity",
] as const;
export type DeploymentImpact = (typeof DEPLOYMENT_IMPACT)[number];

// ─── Risk matrix (8 dimensions, 0-100) ───────────────────────────────────
export const RISK_DIMENSIONS = [
  "technical", "security", "business", "performance",
  "migration", "deployment", "operational", "overall",
] as const;
export type RiskDimension = (typeof RISK_DIMENSIONS)[number];
export type RiskMatrix = Record<RiskDimension, number>;

// ─── Quality gates (any → block) ─────────────────────────────────────────
export const IMPACT_QUALITY_GATES = [
  "duplicate_runtime", "duplicate_api", "duplicate_database",
  "architecture_break", "missing_rollback", "missing_tests",
  "missing_documentation", "critical_security_risk",
] as const;
export type ImpactQualityGate = (typeof IMPACT_QUALITY_GATES)[number];

// ─── Pipeline stages (10) ────────────────────────────────────────────────
export const IMPACT_PIPELINE = [
  "intake", "discover", "graph", "estimate",
  "risk", "gate", "report", "founderPresentation", "audit", "handoff",
] as const;
export type ImpactStage = (typeof IMPACT_PIPELINE)[number];

// ─── Canonical owners reused ─────────────────────────────────────────────
export const IMPACT_CANONICAL_OWNERS_REUSED = [
  "IntentEngine", "SoftwareArchitect", "CodeReviewEngineer",
  "QaTestingEngineer", "GuardianAI", "ApprovalGateway",
  "Brain", "Memory", "Conversation", "Workspace", "Search", "Knowledge",
  "Creator", "Revenue", "BusinessOS", "FounderDashboard",
  "Audit", "RBAC", "HappyID", "Analytics",
] as const;
export type ImpactCanonicalOwner = (typeof IMPACT_CANONICAL_OWNERS_REUSED)[number];

// ─── Change discovery input ──────────────────────────────────────────────
export type ChangeSet = {
  files: readonly string[];
  routes: readonly string[];
  components: readonly string[];
  modules: readonly string[];
  tables: readonly string[];
  policies: readonly string[];
  workers: readonly string[];
  tests: readonly string[];
  documentation: readonly string[];
  migrations: readonly string[];
  duplicatesDetected: readonly string[];
  hasRollback: boolean;
  hasTests: boolean;
  hasDocumentation: boolean;
  criticalSecurityRisk: boolean;
  architectureBreak: boolean;
};

// ─── Founder presentation (11 fields) ────────────────────────────────────
export type ImpactFounderPresentation = {
  whatWillChange: string[];
  why: string;
  benefits: string[];
  risks: string[];
  estimatedEffort: "low" | "medium" | "high";
  estimatedTimeHours: number;
  estimatedCostUsd: number;
  affectedModules: readonly string[];
  affectedUsersEstimate: number;
  rollbackAvailable: boolean;
  recommendation: "proceed" | "proceed_with_care" | "block";
};

// ─── Impact Report (compile-time locked handoff to R158) ─────────────────
export type ImpactReport = {
  readonly version: "R164";
  readonly canAutoImplement: false;
  readonly handoffTarget: "R158_ApprovalGateway";
  readonly reuseOnly: true;
  readonly newRuntime: false;
  scope: readonly ImpactArea[];
  discovered: {
    surfaces: readonly ChangeSurface[];
    counts: Record<ChangeSurface, number>;
  };
  dependencyArtifacts: readonly DependencyArtifact[];
  risk: RiskMatrix;
  gatesTriggered: readonly ImpactQualityGate[];
  presentation: ImpactFounderPresentation;
  reused: readonly ImpactCanonicalOwner[];
};

// ─── Quality-gate detection ──────────────────────────────────────────────
export function detectQualityGates(change: ChangeSet): ImpactQualityGate[] {
  const g: ImpactQualityGate[] = [];
  for (const d of change.duplicatesDetected) {
    if (d.includes("runtime")) g.push("duplicate_runtime");
    if (d.includes("api")) g.push("duplicate_api");
    if (d.includes("database") || d.includes("table")) g.push("duplicate_database");
  }
  if (change.architectureBreak) g.push("architecture_break");
  if (!change.hasRollback) g.push("missing_rollback");
  if (!change.hasTests) g.push("missing_tests");
  if (!change.hasDocumentation) g.push("missing_documentation");
  if (change.criticalSecurityRisk) g.push("critical_security_risk");
  return Array.from(new Set(g));
}

// ─── Overall risk aggregation (clamped 0-100) ────────────────────────────
export function computeOverallRisk(risk: Omit<RiskMatrix, "overall">): number {
  const vals = Object.values(risk);
  const max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Weighted toward the worst dimension so a single critical risk dominates.
  return Math.max(0, Math.min(100, Math.round(max * 0.6 + avg * 0.4)));
}

// ─── Recommendation from gates + risk ────────────────────────────────────
export function recommendFromRisk(
  gates: readonly ImpactQualityGate[],
  overall: number,
): ImpactFounderPresentation["recommendation"] {
  if (gates.length > 0 || overall >= 75) return "block";
  if (overall >= 40) return "proceed_with_care";
  return "proceed";
}

// ─── Count discovered surfaces ───────────────────────────────────────────
function countSurfaces(c: ChangeSet): Record<ChangeSurface, number> {
  return {
    files: c.files.length,
    folders: new Set(c.files.map(f => f.split("/").slice(0, -1).join("/"))).size,
    routes: c.routes.length,
    components: c.components.length,
    modules: c.modules.length,
    services: 0,
    libraries: 0,
    tables: c.tables.length,
    indexes: 0,
    policies: c.policies.length,
    storage_buckets: 0,
    workers: c.workers.length,
    tests: c.tests.length,
    documentation: c.documentation.length,
    migrations: c.migrations.length,
  };
}

// ─── Build Impact Report ─────────────────────────────────────────────────
export function buildImpactReport(
  change: ChangeSet,
  partialRisk: Omit<RiskMatrix, "overall">,
  presentation: Omit<ImpactFounderPresentation, "recommendation" | "rollbackAvailable">,
): ImpactReport {
  const gates = detectQualityGates(change);
  const overall = computeOverallRisk(partialRisk);
  const risk: RiskMatrix = { ...partialRisk, overall };
  const recommendation = recommendFromRisk(gates, overall);

  return {
    version: "R164",
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
    scope: IMPACT_SCOPE,
    discovered: {
      surfaces: CHANGE_SURFACES,
      counts: countSurfaces(change),
    },
    dependencyArtifacts: DEPENDENCY_ARTIFACTS,
    risk,
    gatesTriggered: gates,
    presentation: {
      ...presentation,
      rollbackAvailable: change.hasRollback,
      recommendation,
    },
    reused: IMPACT_CANONICAL_OWNERS_REUSED,
  };
}
