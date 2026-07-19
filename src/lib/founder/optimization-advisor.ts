/**
 * R168 — AI Optimization Advisor™
 *
 * PURE GOVERNANCE + OPTIMIZATION LAYER. No new runtime, no V2 engines.
 * Reuses canonical owners: Approval Gateway (R158), Intent Engine (R159),
 * Guardian AI (R160), Software Architect (R161), Code Review (R162),
 * QA (R163), Impact Analyzer (R164), Preview Studio (R165),
 * Rollback (R166), Documentation Engine (R167), Brain, Memory,
 * Conversation, Workspace, Search, Knowledge, Creator, Revenue,
 * Business OS, Founder Dashboard, Audit, Analytics, Happy ID, RBAC.
 *
 * HAPPY AI never optimizes production automatically. Every recommendation
 * routes through R158 Approval Gateway. Compile-time forbidden:
 * `canAutoOptimize: false`.
 */

export const OPTIMIZATION_AREAS = [
  "performance",
  "security",
  "architecture",
  "database",
  "api",
  "frontend",
  "backend",
  "business_logic",
  "revenue",
  "ai_usage",
  "storage",
  "search",
  "files",
  "creative_assets",
  "deployment",
  "seo",
  "accessibility",
  "user_experience",
] as const;
export type OptimizationArea = (typeof OPTIMIZATION_AREAS)[number];

export const AUTOMATIC_ANALYSIS_CHECKS = [
  "unused_code",
  "dead_code",
  "large_components",
  "large_bundles",
  "duplicate_logic",
  "duplicate_assets",
  "slow_queries",
  "slow_apis",
  "slow_search",
  "high_ai_cost",
  "high_storage_usage",
  "large_uploads",
  "unused_media",
  "unused_routes",
  "unused_tables",
  "unused_indexes",
] as const;
export type AutomaticAnalysisCheck = (typeof AUTOMATIC_ANALYSIS_CHECKS)[number];

export const PERFORMANCE_METRICS = [
  "bundle_size",
  "lcp",
  "inp",
  "tti",
  "cls",
  "memory_usage",
  "cpu_usage",
  "search_time",
  "database_latency",
  "api_latency",
  "ai_latency",
] as const;
export type PerformanceMetric = (typeof PERFORMANCE_METRICS)[number];

export const DATABASE_CHECKS = [
  "indexes",
  "queries",
  "relations",
  "constraints",
  "unused_tables",
  "unused_indexes",
  "migration_complexity",
] as const;
export type DatabaseCheck = (typeof DATABASE_CHECKS)[number];

export const API_CHECKS = [
  "response_time",
  "payload_size",
  "caching",
  "validation",
  "pagination",
  "compression",
  "rate_limits",
] as const;
export type ApiCheck = (typeof API_CHECKS)[number];

export const AI_CHECKS = [
  "token_usage",
  "prompt_length",
  "context_size",
  "memory_usage",
  "model_selection",
  "inference_cost",
  "reasoning_time",
] as const;
export type AiCheck = (typeof AI_CHECKS)[number];

export const BUSINESS_CHECKS = [
  "revenue",
  "credits",
  "subscriptions",
  "conversion",
  "retention",
  "growth",
  "founder_cost",
  "infrastructure_cost",
] as const;
export type BusinessCheck = (typeof BUSINESS_CHECKS)[number];

export const RECOMMENDATION_KINDS = [
  "performance",
  "security",
  "architecture",
  "database",
  "api",
  "ui",
  "ux",
  "seo",
  "business",
  "cost_savings",
] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export const QUALITY_SCORE_DIMENSIONS = [
  "performance",
  "security",
  "architecture",
  "database",
  "api",
  "business",
  "ai_efficiency",
  "overall",
] as const;
export type QualityScoreDimension = (typeof QUALITY_SCORE_DIMENSIONS)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R120_Creator",
  "R126_Revenue",
  "R128_BusinessOS",
  "R158_ApprovalGateway",
  "R159_IntentEngine",
  "R160_GuardianAI",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QAEngineer",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_RollbackRecovery",
  "R167_DocumentationEngine",
  "R145_FounderDashboard",
  "R130_Audit",
  "R104_Analytics",
  "R153_HappyID",
  "R156_RBAC",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const PIPELINE_STAGES = [
  "intake",
  "analyseAutomatic",
  "analysePerformance",
  "analyseDatabase",
  "analyseApi",
  "analyseAi",
  "analyseBusiness",
  "recommend",
  "score",
  "founderReport",
  "audit",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const FOUNDER_REPORT_FIELDS = [
  "current_health",
  "problems",
  "recommendations",
  "estimated_savings",
  "estimated_performance_gain",
  "estimated_cost_reduction",
  "priority",
] as const;
export type FounderReportField = (typeof FOUNDER_REPORT_FIELDS)[number];

export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Finding {
  check: AutomaticAnalysisCheck;
  area: OptimizationArea;
  severity: Severity;
  detail: string;
}

export interface Recommendation {
  kind: RecommendationKind;
  area: OptimizationArea;
  title: string;
  rationale: string;
  estimatedSavingsCents: number;
  estimatedPerformanceGainPct: number;
  estimatedCostReductionPct: number;
  priority: Priority;
}

export interface QualityScores {
  performance: number;
  security: number;
  architecture: number;
  database: number;
  api: number;
  business: number;
  ai_efficiency: number;
  overall: number;
}

export interface OptimizationRequest {
  workspaceId: string;
  founderId: string;
  findings: Finding[];
  recommendations: Recommendation[];
  scores: Partial<QualityScores>;
  auditPresent: boolean;
}

export interface FounderReport {
  current_health: Severity;
  problems: Finding[];
  recommendations: Recommendation[];
  estimated_savings: number;
  estimated_performance_gain: number;
  estimated_cost_reduction: number;
  priority: Priority;
}

export interface OptimizationDecision {
  report: FounderReport;
  scores: QualityScores;
  canAutoOptimize: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];
const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "urgent"];

export function worstSeverity(findings: Finding[]): Severity {
  if (findings.length === 0) return "low";
  return findings.reduce<Severity>((acc, f) =>
    SEVERITY_ORDER.indexOf(f.severity) > SEVERITY_ORDER.indexOf(acc) ? f.severity : acc,
    "low");
}

export function topPriority(recs: Recommendation[]): Priority {
  if (recs.length === 0) return "low";
  return recs.reduce<Priority>((acc, r) =>
    PRIORITY_ORDER.indexOf(r.priority) > PRIORITY_ORDER.indexOf(acc) ? r.priority : acc,
    "low");
}

export function computeScores(req: OptimizationRequest): QualityScores {
  const dims: (keyof QualityScores)[] = [
    "performance", "security", "architecture", "database",
    "api", "business", "ai_efficiency",
  ];
  const filled: QualityScores = {
    performance: req.scores.performance ?? 100,
    security: req.scores.security ?? 100,
    architecture: req.scores.architecture ?? 100,
    database: req.scores.database ?? 100,
    api: req.scores.api ?? 100,
    business: req.scores.business ?? 100,
    ai_efficiency: req.scores.ai_efficiency ?? 100,
    overall: 0,
  };
  // Deduct for findings.
  for (const f of req.findings) {
    const delta = { low: 1, medium: 3, high: 7, critical: 15 }[f.severity];
    if (f.area in filled) {
      const k = f.area as keyof QualityScores;
      filled[k] = Math.max(0, filled[k] - delta);
    } else {
      filled.overall = Math.max(0, (filled.overall || 0) - delta);
    }
  }
  const sum = dims.reduce((a, k) => a + filled[k], 0);
  filled.overall = Math.round(sum / dims.length);
  return filled;
}

export function buildFounderReport(req: OptimizationRequest): FounderReport {
  const savings = req.recommendations.reduce((a, r) => a + r.estimatedSavingsCents, 0);
  const perf = req.recommendations.reduce((a, r) => a + r.estimatedPerformanceGainPct, 0);
  const cost = req.recommendations.reduce((a, r) => a + r.estimatedCostReductionPct, 0);
  return {
    current_health: worstSeverity(req.findings),
    problems: req.findings,
    recommendations: req.recommendations,
    estimated_savings: savings,
    estimated_performance_gain: perf,
    estimated_cost_reduction: cost,
    priority: topPriority(req.recommendations),
  };
}

export function evaluateOptimization(req: OptimizationRequest): OptimizationDecision {
  return {
    report: buildFounderReport(req),
    scores: computeScores(req),
    canAutoOptimize: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R168_POLICY = {
  id: "R168",
  name: "AI Optimization Advisor",
  reuseOnly: true,
  newRuntime: false,
  canAutoOptimize: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  canonicalOwners: CANONICAL_OWNERS,
  optimizationAreas: OPTIMIZATION_AREAS,
  automaticAnalysisChecks: AUTOMATIC_ANALYSIS_CHECKS,
  performanceMetrics: PERFORMANCE_METRICS,
  databaseChecks: DATABASE_CHECKS,
  apiChecks: API_CHECKS,
  aiChecks: AI_CHECKS,
  businessChecks: BUSINESS_CHECKS,
  recommendationKinds: RECOMMENDATION_KINDS,
  qualityScoreDimensions: QUALITY_SCORE_DIMENSIONS,
  founderReportFields: FOUNDER_REPORT_FIELDS,
  pipeline: PIPELINE_STAGES,
} as const;
