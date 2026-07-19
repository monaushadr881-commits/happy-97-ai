/**
 * R163 — AI QA & Testing Engineer™
 *
 * Pure governance + QA layer. ZERO new runtime, ZERO QA V2, ZERO Test
 * Engine V2, ZERO Release Engine V2. Composes existing canonical owners
 * only:
 *
 *   - Intent Engine       → src/lib/founder/intent-engine.ts (R159)
 *   - Software Architect  → src/lib/founder/software-architect.ts (R161)
 *   - Code Review         → src/lib/founder/code-review-engineer.ts (R162)
 *   - Guardian AI         → src/lib/founder/guardian-ai.ts (R160)
 *   - Approval Gateway    → src/lib/founder/approval-gateway.ts (R158) [handoff]
 *   - Identity Fortress   → src/lib/founder/identity-fortress.ts (R156/R157)
 *   - Unlimited Policy    → src/lib/founder/unlimited-policy.ts (R153)
 *   - Brain / Memory / Search / Audit / RBAC / HappyID (canonical owners)
 *
 * FOLLOWS: R91 R104 R111 R115B R116 R118 R119 R120 R126 R128 R130 R145
 *          R153 R156 R157 R158 R159 R160 R161 R162.
 *
 * The QA Engineer NEVER deploys and NEVER auto-approves. It evaluates
 * the Reviewer's report and produces a Release Readiness Report that is
 * handed off to R158 for Explain → Preview → Approve → Execute.
 */

// ─── QA test-plan families (10) ──────────────────────────────────────────
export const QA_TEST_PLANS = [
  "unit", "integration", "system", "regression", "performance",
  "security", "accessibility", "compatibility", "recovery", "deployment",
] as const;
export type QaTestPlan = (typeof QA_TEST_PLANS)[number];

// ─── Automatic checks (10) ───────────────────────────────────────────────
export const QA_AUTOMATIC_CHECKS = [
  "existing_tests", "coverage", "regression_risk",
  "broken_dependencies", "broken_imports", "broken_apis",
  "broken_ui", "broken_database_contracts", "broken_permissions",
  "backward_compatibility",
] as const;
export type QaAutomaticCheck = (typeof QA_AUTOMATIC_CHECKS)[number];

// ─── Domain-specific QA ─────────────────────────────────────────────────
export const QA_SECURITY_CHECKS = [
  "authentication", "authorization", "rls", "audit_coverage",
  "secrets", "tokens", "rate_limits", "otp", "founder_approval_flow",
] as const;
export type QaSecurityCheck = (typeof QA_SECURITY_CHECKS)[number];

export const QA_PERFORMANCE_CHECKS = [
  "bundle_size", "memory", "cpu", "search",
  "api_latency", "database_latency", "caching", "lazy_loading",
] as const;
export type QaPerformanceCheck = (typeof QA_PERFORMANCE_CHECKS)[number];

export const QA_DATABASE_CHECKS = [
  "tables", "indexes", "constraints", "relations",
  "migrations", "rollback", "data_integrity",
] as const;
export type QaDatabaseCheck = (typeof QA_DATABASE_CHECKS)[number];

export const QA_API_CHECKS = [
  "input", "output", "validation", "errors",
  "rate_limits", "pagination", "caching", "security",
] as const;
export type QaApiCheck = (typeof QA_API_CHECKS)[number];

export const QA_UI_CHECKS = [
  "desktop", "tablet", "mobile", "android", "iphone",
  "dark_mode", "light_mode", "accessibility",
] as const;
export type QaUiCheck = (typeof QA_UI_CHECKS)[number];

export const QA_COMPATIBILITY_CHECKS = [
  "website", "android", "ios", "pwa", "future_compatibility",
] as const;
export type QaCompatibilityCheck = (typeof QA_COMPATIBILITY_CHECKS)[number];

// ─── Quality scores (0-100) ──────────────────────────────────────────────
export const QA_SCORE_DIMENSIONS = [
  "unit", "integration", "regression", "security", "performance",
  "accessibility", "compatibility", "releaseReadiness", "overall",
] as const;
export type QaScoreDimension = (typeof QA_SCORE_DIMENSIONS)[number];
export type QaScores = Record<QaScoreDimension, number>;

// ─── Blocking conditions (any → NOT READY) ───────────────────────────────
export const QA_BLOCKERS = [
  "critical_test_failure", "regression_failure", "security_failure",
  "architecture_violation", "duplicate_runtime", "duplicate_api",
  "duplicate_database", "missing_tests", "missing_rollback",
  "missing_documentation",
] as const;
export type QaBlocker = (typeof QA_BLOCKERS)[number];

// ─── QA pipeline (10 stages) ─────────────────────────────────────────────
export const QA_PIPELINE = [
  "intake", "planTests", "runAutomatic", "domainQA",
  "score", "detectBlockers", "decide", "summarise", "audit", "handoff",
] as const;
export type QaStage = (typeof QA_PIPELINE)[number];

// ─── Release decisions ───────────────────────────────────────────────────
export type ReleaseDecision = "READY" | "READY_WITH_WARNINGS" | "NOT_READY";

// ─── Reused canonical owners ─────────────────────────────────────────────
export const QA_CANONICAL_OWNERS_REUSED = [
  "IntentEngine", "SoftwareArchitect", "CodeReviewEngineer", "GuardianAI",
  "ApprovalGateway", "Brain", "Memory", "Conversation", "Workspace",
  "Search", "Creator", "Revenue", "BusinessOS", "FounderDashboard",
  "Audit", "RBAC", "HappyID",
] as const;
export type QaCanonicalOwner = (typeof QA_CANONICAL_OWNERS_REUSED)[number];

// ─── Finding ─────────────────────────────────────────────────────────────
export type QaFinding = {
  plan: QaTestPlan;
  severity: "info" | "warning" | "critical";
  message: string;
};

// ─── Founder summary ─────────────────────────────────────────────────────
export type QaFounderSummary = {
  passed: string[];
  failed: string[];
  risks: string[];
  warnings: string[];
  recommendations: string[];
  releaseConfidence: number; // 0-100
};

// ─── Input contract from R162 review ─────────────────────────────────────
export type QaInput = {
  reviewApproval: "approve" | "approve_with_changes" | "block";
  hasTests: boolean;
  hasRollback: boolean;
  hasDocumentation: boolean;
  duplicatesDetected: readonly string[];
  regressionFailures: number;
  criticalFailures: number;
  securityFailures: number;
  architectureViolations: number;
};

// ─── Release Readiness Report (compile-time locked handoff to R158) ─────
export type ReleaseReadinessReport = {
  readonly version: "R163";
  readonly canAutoDeploy: false;
  readonly handoffTarget: "R158_ApprovalGateway";
  readonly reuseOnly: true;
  readonly newRuntime: false;
  plansGenerated: readonly QaTestPlan[];
  scores: QaScores;
  blockers: readonly QaBlocker[];
  decision: ReleaseDecision;
  findings: readonly QaFinding[];
  summary: QaFounderSummary;
  reused: readonly QaCanonicalOwner[];
};

// ─── Blocker detection ───────────────────────────────────────────────────
export function detectQaBlockers(input: QaInput): QaBlocker[] {
  const b: QaBlocker[] = [];
  if (input.criticalFailures > 0) b.push("critical_test_failure");
  if (input.regressionFailures > 0) b.push("regression_failure");
  if (input.securityFailures > 0) b.push("security_failure");
  if (input.architectureViolations > 0) b.push("architecture_violation");
  for (const d of input.duplicatesDetected) {
    if (d.includes("runtime")) b.push("duplicate_runtime");
    if (d.includes("api")) b.push("duplicate_api");
    if (d.includes("database") || d.includes("table")) b.push("duplicate_database");
  }
  if (!input.hasTests) b.push("missing_tests");
  if (!input.hasRollback) b.push("missing_rollback");
  if (!input.hasDocumentation) b.push("missing_documentation");
  return Array.from(new Set(b));
}

// ─── Score aggregation ───────────────────────────────────────────────────
export function computeQaOverall(scores: Omit<QaScores, "overall">): number {
  const vals = Object.values(scores);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

// ─── Release decision from blockers + review + warnings ─────────────────
export function decideRelease(
  blockers: readonly QaBlocker[],
  reviewApproval: QaInput["reviewApproval"],
  warnings: number,
): ReleaseDecision {
  if (blockers.length > 0 || reviewApproval === "block") return "NOT_READY";
  if (warnings > 0 || reviewApproval === "approve_with_changes") return "READY_WITH_WARNINGS";
  return "READY";
}

// ─── Build Release Readiness Report ──────────────────────────────────────
export function buildReleaseReadinessReport(
  input: QaInput,
  partialScores: Omit<QaScores, "overall">,
  findings: readonly QaFinding[],
): ReleaseReadinessReport {
  const blockers = detectQaBlockers(input);
  const overall = computeQaOverall(partialScores);
  const scores: QaScores = { ...partialScores, overall };
  const warnings = findings.filter(f => f.severity === "warning").map(f => f.message);
  const failed = findings.filter(f => f.severity === "critical").map(f => f.message);
  const passed = findings.filter(f => f.severity === "info").map(f => f.message);
  const decision = decideRelease(blockers, input.reviewApproval, warnings.length);
  const confidence = decision === "READY" ? overall
                   : decision === "READY_WITH_WARNINGS" ? Math.max(0, overall - 15)
                   : 0;

  return {
    version: "R163",
    canAutoDeploy: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
    plansGenerated: QA_TEST_PLANS,
    scores,
    blockers,
    decision,
    findings,
    summary: {
      passed, failed,
      risks: blockers.map(String),
      warnings,
      recommendations: [],
      releaseConfidence: confidence,
    },
    reused: QA_CANONICAL_OWNERS_REUSED,
  };
}
