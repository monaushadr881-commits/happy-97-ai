/**
 * R162 — AI Code Review Engineer™
 *
 * Pure governance + review layer. ZERO new runtime, ZERO Review V2,
 * ZERO Security V2, ZERO Architecture V2. Composes existing canonical
 * owners only:
 *
 *   - Intent Engine       → src/lib/founder/intent-engine.ts (R159)
 *   - Software Architect  → src/lib/founder/software-architect.ts (R161)
 *   - Guardian AI         → src/lib/founder/guardian-ai.ts (R160)
 *   - Approval Gateway    → src/lib/founder/approval-gateway.ts (R158) [handoff]
 *   - Identity Fortress   → src/lib/founder/identity-fortress.ts (R156/R157)
 *   - Unlimited Policy    → src/lib/founder/unlimited-policy.ts (R153)
 *   - Brain               → src/lib/brain/engine.ts (R115B)
 *   - Memory              → src/lib/memory/intelligence.ts (R116)
 *   - Search              → src/lib/happy-r138/semantic-knowledge.ts
 *   - Audit               → public.audit_logs + write_audit(...)
 *
 * FOLLOWS: R91 R104 R111 R115B R116 R118 R119 R120 R126 R128 R130 R145
 *          R153 R156 R157 R158 R159 R160 R161.
 *
 * The Reviewer NEVER implements and NEVER auto-approves. It reviews the
 * Architect's Approval Package (R161) and produces a Review Report that
 * is handed off to R158 for Explain → Preview → Approve → Execute.
 */

// ─── Review areas (15) ───────────────────────────────────────────────────
export const REVIEW_AREAS = [
  "architecture", "security", "performance", "scalability",
  "maintainability", "readability", "accessibility", "reliability",
  "businessLogic", "errorHandling", "apiDesign", "databaseDesign",
  "folderStructure", "documentation", "testing",
] as const;
export type ReviewArea = (typeof REVIEW_AREAS)[number];

// ─── Automatic static checks ─────────────────────────────────────────────
export const AUTOMATIC_CHECKS = [
  "duplicate_runtime", "duplicate_api", "duplicate_table",
  "dead_code", "unused_imports", "circular_dependencies",
  "large_files", "large_components",
  "security_violations", "performance_bottlenecks", "architecture_violations",
] as const;
export type AutomaticCheck = (typeof AUTOMATIC_CHECKS)[number];

// ─── Domain-specific reviews ─────────────────────────────────────────────
export const SECURITY_CHECKS = [
  "authentication", "authorization", "rls", "secrets", "tokens",
  "rate_limits", "input_validation", "output_validation",
  "prompt_safety", "audit_coverage",
] as const;
export type SecurityCheck = (typeof SECURITY_CHECKS)[number];

export const PERFORMANCE_CHECKS = [
  "bundle_size", "memory_usage", "lazy_loading", "caching",
  "queries", "indexes", "api_calls", "search_performance",
] as const;
export type PerformanceCheck = (typeof PERFORMANCE_CHECKS)[number];

export const DATABASE_CHECKS = [
  "tables", "indexes", "relations", "constraints",
  "migrations", "backward_compatibility",
] as const;
export type DatabaseCheck = (typeof DATABASE_CHECKS)[number];

export const API_CHECKS = [
  "rest_design", "validation", "error_responses", "pagination",
  "rate_limits", "caching", "security",
] as const;
export type ApiCheck = (typeof API_CHECKS)[number];

export const UI_CHECKS = [
  "consistency", "accessibility", "responsiveness",
  "dark_mode", "light_mode", "navigation",
] as const;
export type UiCheck = (typeof UI_CHECKS)[number];

// ─── Quality score dimensions (0-100) ────────────────────────────────────
export const SCORE_DIMENSIONS = [
  "architecture", "security", "performance", "maintainability",
  "accessibility", "businessLogic", "documentation", "overall",
] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];
export type QualityScores = Record<ScoreDimension, number>;

// ─── Blocking conditions (any triggers hard-block to R158) ───────────────
export const BLOCKING_CONDITIONS = [
  "critical_security_issue", "architecture_break",
  "duplicate_runtime", "duplicate_api", "duplicate_database",
  "missing_documentation", "missing_tests",
] as const;
export type BlockingCondition = (typeof BLOCKING_CONDITIONS)[number];

// ─── Recommendation categories ───────────────────────────────────────────
export const RECOMMENDATION_KINDS = [
  "refactor", "optimization", "security_improvement",
  "performance_improvement", "ux_improvement", "documentation_improvement",
] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

// ─── Pipeline stages (10) ────────────────────────────────────────────────
export const REVIEW_PIPELINE = [
  "intake",       // receive Architect approval package (R161)
  "staticScan",   // AUTOMATIC_CHECKS
  "areaReview",   // REVIEW_AREAS × domain checks
  "score",        // QualityScores 0-100 per dimension
  "detect",       // BLOCKING_CONDITIONS
  "recommend",    // RECOMMENDATION_KINDS
  "summarise",    // FounderSummary
  "audit",        // write_audit(...)
  "present",      // ReviewReport
  "handoff",      // ALWAYS → R158 Approval Gateway
] as const;
export type ReviewStage = (typeof REVIEW_PIPELINE)[number];

// ─── Founder summary (6 sections) ────────────────────────────────────────
export type FounderSummary = {
  whatIsGood: string[];
  whatNeedsImprovement: string[];
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  approvalRecommendation: "approve" | "approve_with_changes" | "block";
};

// ─── Finding record ──────────────────────────────────────────────────────
export type ReviewFinding = {
  area: ReviewArea;
  severity: "info" | "warning" | "critical";
  message: string;
  canonicalOwner?: string;
};

// ─── Reuse manifest (must be satisfied — no unknown owners allowed) ──────
export const CANONICAL_OWNERS_REUSED = [
  "IntentEngine", "SoftwareArchitect", "GuardianAI", "ApprovalGateway",
  "Brain", "Memory", "Conversation", "Workspace", "Search", "Creator",
  "Revenue", "BusinessOS", "FounderDashboard", "Audit", "HappyID", "RBAC",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS_REUSED)[number];

// ─── Approval package (from R161) — minimal contract ─────────────────────
export type ArchitectPackage = {
  intentId: string;
  duplicatesDetected: readonly string[];
  hasArchitecture: boolean;
  hasPlans: boolean;
  hasTests: boolean;
  hasDocumentation: boolean;
  affectedSystems: readonly string[];
};

// ─── Review Report (compile-time locked handoff to R158) ─────────────────
export type ReviewReport = {
  readonly version: "R162";
  readonly canAutoExecute: false;
  readonly handoffTarget: "R158_ApprovalGateway";
  readonly reuseOnly: true;
  readonly newRuntime: false;
  areasReviewed: readonly ReviewArea[];
  scores: QualityScores;
  findings: readonly ReviewFinding[];
  blockers: readonly BlockingCondition[];
  recommendations: readonly RecommendationKind[];
  summary: FounderSummary;
  reused: readonly CanonicalOwner[];
};

// ─── Detect blocking conditions from Architect package ───────────────────
export function detectBlockers(pkg: ArchitectPackage): BlockingCondition[] {
  const blockers: BlockingCondition[] = [];
  for (const d of pkg.duplicatesDetected) {
    if (d.includes("runtime")) blockers.push("duplicate_runtime");
    if (d.includes("api")) blockers.push("duplicate_api");
    if (d.includes("database") || d.includes("table")) blockers.push("duplicate_database");
  }
  if (!pkg.hasArchitecture) blockers.push("architecture_break");
  if (!pkg.hasDocumentation) blockers.push("missing_documentation");
  if (!pkg.hasTests) blockers.push("missing_tests");
  return Array.from(new Set(blockers));
}

// ─── Score aggregation (clamped 0-100) ───────────────────────────────────
export function computeOverall(scores: Omit<QualityScores, "overall">): number {
  const vals = Object.values(scores);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

// ─── Build a full ReviewReport for handoff ───────────────────────────────
export function buildReviewReport(
  pkg: ArchitectPackage,
  partialScores: Omit<QualityScores, "overall">,
  findings: readonly ReviewFinding[],
  recommendations: readonly RecommendationKind[],
): ReviewReport {
  const blockers = detectBlockers(pkg);
  const overall = computeOverall(partialScores);
  const scores: QualityScores = { ...partialScores, overall };
  const critical = findings.filter(f => f.severity === "critical").map(f => f.message);
  const warnings = findings.filter(f => f.severity === "warning").map(f => f.message);
  const approvalRecommendation: FounderSummary["approvalRecommendation"] =
    blockers.length > 0 || critical.length > 0 ? "block"
    : warnings.length > 0 ? "approve_with_changes"
    : "approve";

  return {
    version: "R162",
    canAutoExecute: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
    areasReviewed: REVIEW_AREAS,
    scores,
    findings,
    blockers,
    recommendations,
    summary: {
      whatIsGood: findings.filter(f => f.severity === "info").map(f => f.message),
      whatNeedsImprovement: warnings,
      criticalIssues: critical,
      warnings,
      recommendations: recommendations.map(String),
      approvalRecommendation,
    },
    reused: CANONICAL_OWNERS_REUSED,
  };
}
