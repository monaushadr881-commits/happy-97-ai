/**
 * R171 — AI CTO™ (Chief Technology Officer)
 *
 * PURE GOVERNANCE + TECHNOLOGY LEADERSHIP LAYER. No new runtime,
 * no CTO V2, no Engineering V2, no Planning V2, no duplicate
 * planner. Reuses canonical owners only.
 *
 * The AI CTO advises, plans, reviews, coordinates, and recommends.
 * It NEVER writes production code, NEVER bypasses R158, and NEVER
 * replaces Founder authority. Every recommendation routes through
 * the R159→…→R158 handoff chain.
 */

export const RESPONSIBILITIES = [
  "technology_vision",
  "architecture_vision",
  "engineering_roadmap",
  "technical_debt",
  "scalability",
  "security_strategy",
  "infrastructure_planning",
  "ai_strategy",
  "release_planning",
  "platform_evolution",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const ENGINEERING_REVIEW_AREAS = [
  "current_architecture",
  "future_architecture",
  "module_ownership",
  "canonical_owners",
  "dependencies",
  "duplication",
  "technical_debt",
] as const;
export type EngineeringReviewArea = (typeof ENGINEERING_REVIEW_AREAS)[number];

export const ROADMAP_HORIZONS = [
  "30_day",
  "90_day",
  "6_month",
  "1_year",
  "3_year",
] as const;
export type RoadmapHorizon = (typeof ROADMAP_HORIZONS)[number];

export const AI_DECISION_KINDS = [
  "new_features",
  "module_improvements",
  "architecture_improvements",
  "security_improvements",
  "performance_improvements",
  "business_technology",
] as const;
export type AIDecisionKind = (typeof AI_DECISION_KINDS)[number];

export const HEALTH_DIMENSIONS = [
  "architecture_health",
  "engineering_health",
  "security_health",
  "performance_health",
  "maintainability",
  "documentation",
  "test_health",
] as const;
export type HealthDimension = (typeof HEALTH_DIMENSIONS)[number];

export const ENGINEERING_KPIS = [
  "architecture_score",
  "engineering_score",
  "release_score",
  "performance_score",
  "security_score",
  "quality_score",
  "innovation_score",
  "overall_technology_score",
] as const;
export type EngineeringKPI = (typeof ENGINEERING_KPIS)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "top_risks",
  "top_opportunities",
  "priority_roadmap",
  "recommended_actions",
  "estimated_roi",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "schedule",
  "compare",
  "archive",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R120_Creator",
  "R128_BusinessOS",
  "R126_RevenueOS",
  "R104_Analytics",
  "R145_FounderDashboard",
  "R160_GuardianAI",
  "R158_ApprovalGateway",
  "R159_IntentEngine",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QAEngineer",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_RollbackRecovery",
  "R167_DocumentationEngine",
  "R168_OptimizationAdvisor",
  "R169_LearningMemory",
  "R170_CompetitorIntelligence",
  "R130_Audit",
  "R156_RBAC",
  "R153_HappyID",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const HANDOFF_CHAIN = [
  "R159_IntentEngine",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QAEngineer",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_RollbackRecovery",
  "R167_DocumentationEngine",
  "R168_OptimizationAdvisor",
  "R158_ApprovalGateway",
] as const;
export type HandoffStep = (typeof HANDOFF_CHAIN)[number];

export const PIPELINE_STAGES = [
  "intake",
  "reviewArchitecture",
  "evaluateHealth",
  "computeKPIs",
  "buildRoadmaps",
  "prioritizeRecommendations",
  "composeReport",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface HealthSignals {
  architecture: number; // 0..100
  engineering: number;
  security: number;
  performance: number;
  maintainability: number;
  documentation: number;
  tests: number;
  releaseCadence?: number; // 0..100
  innovation?: number; // 0..100
}

export type HealthReport = Record<HealthDimension, number> & { overall: number };

export interface RoadmapItem {
  horizon: RoadmapHorizon;
  title: string;
  responsibility: Responsibility;
  priority: Priority;
  expectedRoi: number; // 0..100
  effort: number; // 0..100
}

export interface Recommendation {
  kind: AIDecisionKind;
  title: string;
  rationale: string;
  priority: Priority;
  expectedRoi: number;
  effort: number;
  handoff: readonly HandoffStep[];
}

export type KpiReport = Record<EngineeringKPI, number>;

export interface CtoReport {
  executiveSummary: string;
  topRisks: string[];
  topOpportunities: string[];
  priorityRoadmap: RoadmapItem[];
  recommendedActions: Recommendation[];
  estimatedRoi: number;
  kpis: KpiReport;
  health: HealthReport;
  canAutoImplement: false;
  canWriteProductionCode: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

export function evaluateHealth(s: HealthSignals): HealthReport {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const architecture_health = clamp(s.architecture);
  const engineering_health = clamp(s.engineering);
  const security_health = clamp(s.security);
  const performance_health = clamp(s.performance);
  const maintainability = clamp(s.maintainability);
  const documentation = clamp(s.documentation);
  const test_health = clamp(s.tests);
  const overall = Math.round(
    (architecture_health + engineering_health + security_health +
      performance_health + maintainability + documentation + test_health) / 7,
  );
  return {
    architecture_health, engineering_health, security_health,
    performance_health, maintainability, documentation, test_health,
    overall,
  };
}

export function computeKPIs(s: HealthSignals): KpiReport {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const architecture_score = clamp(s.architecture);
  const engineering_score = clamp(s.engineering);
  const release_score = clamp(s.releaseCadence ?? (s.engineering + s.tests) / 2);
  const performance_score = clamp(s.performance);
  const security_score = clamp(s.security);
  const quality_score = clamp((s.tests + s.maintainability + s.documentation) / 3);
  const innovation_score = clamp(s.innovation ?? (s.architecture + s.engineering) / 2);
  const overall_technology_score = clamp(
    (architecture_score + engineering_score + release_score + performance_score +
      security_score + quality_score + innovation_score) / 7,
  );
  return {
    architecture_score, engineering_score, release_score, performance_score,
    security_score, quality_score, innovation_score, overall_technology_score,
  };
}

export function scorePriority(roi: number, effort: number): Priority {
  const score = Math.max(0, Math.min(100, roi)) - Math.max(0, Math.min(100, effort)) * 0.5;
  if (score >= 60) return "p0";
  if (score >= 30) return "p1";
  if (score >= 10) return "p2";
  return "p3";
}

export function buildRoadmap(items: Omit<RoadmapItem, "priority">[]): RoadmapItem[] {
  return items.map((i) => ({ ...i, priority: scorePriority(i.expectedRoi, i.effort) }));
}

export function recommend(
  kind: AIDecisionKind,
  title: string,
  rationale: string,
  expectedRoi: number,
  effort: number,
): Recommendation {
  return {
    kind, title, rationale,
    priority: scorePriority(expectedRoi, effort),
    expectedRoi, effort,
    handoff: HANDOFF_CHAIN,
  };
}

export function composeCtoReport(input: {
  health: HealthReport;
  kpis: KpiReport;
  risks: string[];
  opportunities: string[];
  roadmap: RoadmapItem[];
  actions: Recommendation[];
  summary: string;
}): CtoReport {
  const estimatedRoi = input.actions.length
    ? Math.round(input.actions.reduce((a, r) => a + r.expectedRoi, 0) / input.actions.length)
    : 0;
  return {
    executiveSummary: input.summary,
    topRisks: input.risks,
    topOpportunities: input.opportunities,
    priorityRoadmap: input.roadmap,
    recommendedActions: input.actions,
    estimatedRoi,
    kpis: input.kpis,
    health: input.health,
    canAutoImplement: false,
    canWriteProductionCode: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R171_POLICY = {
  id: "R171",
  name: "AI CTO",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  canWriteProductionCode: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  responsibilities: RESPONSIBILITIES,
  engineeringReviewAreas: ENGINEERING_REVIEW_AREAS,
  roadmapHorizons: ROADMAP_HORIZONS,
  aiDecisionKinds: AI_DECISION_KINDS,
  healthDimensions: HEALTH_DIMENSIONS,
  engineeringKpis: ENGINEERING_KPIS,
  reportSections: REPORT_SECTIONS,
  founderControls: FOUNDER_CONTROLS,
  priorities: PRIORITY_LEVELS,
  pipeline: PIPELINE_STAGES,
  companyProfile: {
    legalName: "HAPPY PERSON PRIVATE LIMITED",
    shortName: "H.P PRIVATE LIMITED",
    founder: "MO NAUSHAD RAZA QADRI",
  },
  dailyFreeCredits: { default: 5, refresh: "daily", accumulate: false, carryForward: false },
} as const;
