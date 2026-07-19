/**
 * R174 — AI CPO™ (Chief Product Officer)
 *
 * PURE GOVERNANCE + PRODUCT LEADERSHIP LAYER. No new runtime,
 * no CPO V2, no Product/Roadmap/Feature engine V2, no duplicate.
 * Reuses canonical owners only.
 *
 * The AI CPO analyzes product surfaces (Website, Android, iOS, Builder,
 * Digital Human, Creator, Workspace, Business OS, Revenue OS, Founder
 * Dashboard), builds roadmaps, prioritizes features, evaluates UX, and
 * scores product health. It NEVER writes production code, NEVER changes
 * product directly, NEVER bypasses R158. Every recommendation routes
 * through R159→…→R158. Founder decides.
 */

export const RESPONSIBILITIES = [
  "product_vision",
  "product_strategy",
  "roadmap_planning",
  "feature_prioritization",
  "user_journey",
  "customer_experience",
  "ux_strategy",
  "product_quality",
  "product_innovation",
  "founder_alignment",
  "market_fit",
  "platform_consistency",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const PRODUCT_SURFACES = [
  "website",
  "android",
  "ios",
  "builder",
  "digital_human",
  "creator",
  "workspace",
  "business_os",
  "revenue_os",
  "founder_dashboard",
] as const;
export type ProductSurface = (typeof PRODUCT_SURFACES)[number];

export const ROADMAP_HORIZONS = [
  "30d_product_plan",
  "90d_product_plan",
  "6m_roadmap",
  "1y_roadmap",
  "product_vision",
  "feature_timeline",
] as const;
export type RoadmapHorizon = (typeof ROADMAP_HORIZONS)[number];

export const FEATURE_SIGNAL_KINDS = [
  "feature_requests",
  "founder_requests",
  "user_feedback",
  "feature_adoption",
  "feature_usage",
  "priority",
  "complexity",
  "business_value",
] as const;
export type FeatureSignalKind = (typeof FEATURE_SIGNAL_KINDS)[number];

export const UX_AREAS = [
  "navigation",
  "accessibility",
  "consistency",
  "brand_identity",
  "performance",
  "usability",
  "learning_curve",
  "onboarding",
] as const;
export type UxArea = (typeof UX_AREAS)[number];

export const KPI_DIMENSIONS = [
  "product_score",
  "ux_score",
  "quality_score",
  "innovation_score",
  "adoption_score",
  "retention_score",
  "founder_alignment_score",
  "overall_product_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "product_health",
  "top_opportunities",
  "top_risks",
  "priority_features",
  "user_value",
  "business_value",
  "estimated_roi",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "compare",
  "schedule",
  "archive",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const AI_DECISION_KINDS = [
  "feature_launch",
  "feature_deprecation",
  "ux_improvement",
  "quality_hardening",
  "onboarding_redesign",
  "platform_consistency_fix",
  "innovation_bet",
  "roadmap_reshuffle",
  "founder_alignment_action",
] as const;
export type AIDecisionKind = (typeof AI_DECISION_KINDS)[number];

export const EXECUTIVE_COUNCIL = [
  "R171_AICTO",
  "R172_AICOO",
  "R173_AICFO",
] as const;
export type ExecutivePeer = (typeof EXECUTIVE_COUNCIL)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R120_Creator",
  "R126_RevenueOS",
  "R128_BusinessOS",
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
  "R171_AICTO",
  "R172_AICOO",
  "R173_AICFO",
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
  "analyzeSurfaces",
  "analyzeFeatures",
  "analyzeUx",
  "buildRoadmap",
  "detectRisks",
  "computeKpis",
  "composeReport",
  "councilReview",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface SurfaceSignals {
  surface: ProductSurface;
  usagePct: number;      // 0..100
  satisfactionPct: number; // 0..100
  bugCount: number;
  performanceScore: number; // 0..100
}

export interface FeatureSignal {
  id: string;
  title: string;
  requestVolume: number;
  founderRequested: boolean;
  adoptionPct: number;   // 0..100
  usagePct: number;      // 0..100
  businessValue: number; // 0..100
  complexity: number;    // 0..100
}

export interface UxSignals {
  navigation: number;
  accessibility: number;
  consistency: number;
  brand_identity: number;
  performance: number;
  usability: number;
  learning_curve: number;
  onboarding: number;
}

export interface ProductHealthReport {
  surfaces: SurfaceSignals[];
  averageUsagePct: number;
  averageSatisfactionPct: number;
  totalBugs: number;
  averagePerformance: number;
}

export type KpiReport = Record<KpiDimension, number>;

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export interface Risk {
  kind: "adoption_risk" | "quality_risk" | "ux_risk" | "consistency_risk" | "alignment_risk" | "innovation_risk";
  severity: RiskSeverity;
  detail: string;
}

export interface Recommendation {
  kind: AIDecisionKind;
  title: string;
  rationale: string;
  priority: Priority;
  expectedRoi: number;      // 0..100
  userValue: number;        // 0..100
  businessValue: number;    // 0..100
  effort: number;           // 0..100
  handoff: readonly HandoffStep[];
}

export interface RoadmapItem {
  horizon: RoadmapHorizon;
  title: string;
  priority: Priority;
  surfaces: ProductSurface[];
}

export interface CouncilConflict {
  peer: ExecutivePeer;
  topic: string;
  cpoPosition: string;
  peerPosition: string;
}

export interface CpoReport {
  executiveSummary: string;
  productHealth: ProductHealthReport;
  ux: UxSignals;
  kpis: KpiReport;
  roadmap: RoadmapItem[];
  topOpportunities: string[];
  topRisks: Risk[];
  priorityFeatures: Recommendation[];
  userValue: number;
  businessValue: number;
  estimatedRoi: number;
  councilConflicts: CouncilConflict[];
  canWriteProductionCode: false;
  canChangeProductDirectly: false;
  canAutoImplement: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function analyzeProductHealth(surfaces: SurfaceSignals[]): ProductHealthReport {
  return {
    surfaces,
    averageUsagePct: Math.round(avg(surfaces.map((s) => s.usagePct))),
    averageSatisfactionPct: Math.round(avg(surfaces.map((s) => s.satisfactionPct))),
    totalBugs: surfaces.reduce((a, s) => a + s.bugCount, 0),
    averagePerformance: Math.round(avg(surfaces.map((s) => s.performanceScore))),
  };
}

export function scorePriority(roi: number, effort: number): Priority {
  const score = clamp(roi) - clamp(effort) * 0.5;
  if (score >= 60) return "p0";
  if (score >= 30) return "p1";
  if (score >= 10) return "p2";
  return "p3";
}

export function prioritizeFeatures(features: FeatureSignal[]): Recommendation[] {
  return features.map((f) => {
    const founderBoost = f.founderRequested ? 15 : 0;
    const roi = clamp(f.businessValue * 0.6 + f.adoptionPct * 0.2 + f.usagePct * 0.2 + founderBoost);
    const userValue = clamp(f.usagePct * 0.5 + f.adoptionPct * 0.5);
    return {
      kind: "feature_launch" as AIDecisionKind,
      title: f.title,
      rationale: `Requests=${f.requestVolume}, adoption=${f.adoptionPct}%, business=${f.businessValue}${f.founderRequested ? ", founder-requested" : ""}`,
      priority: scorePriority(roi, f.complexity),
      expectedRoi: roi,
      userValue,
      businessValue: clamp(f.businessValue),
      effort: clamp(f.complexity),
      handoff: HANDOFF_CHAIN,
    };
  }).sort((a, b) =>
    PRIORITY_LEVELS.indexOf(a.priority) - PRIORITY_LEVELS.indexOf(b.priority)
  );
}

export function computeKpis(
  health: ProductHealthReport,
  ux: UxSignals,
  features: Recommendation[],
  founderAlignmentPct: number,
): KpiReport {
  const uxValues = Object.values(ux) as number[];
  const ux_score = clamp(avg(uxValues));
  const quality_score = clamp(health.averagePerformance - Math.min(50, health.totalBugs));
  const adoption_score = clamp(health.averageUsagePct);
  const retention_score = clamp(health.averageSatisfactionPct);
  const innovation_score = clamp(
    features.filter((f) => f.kind === "innovation_bet" || f.expectedRoi >= 70).length * 12,
  );
  const founder_alignment_score = clamp(founderAlignmentPct);
  const product_score = clamp((ux_score + quality_score + adoption_score + retention_score) / 4);
  const overall_product_score = clamp(
    (product_score + ux_score + quality_score + innovation_score +
      adoption_score + retention_score + founder_alignment_score) / 7,
  );
  return {
    product_score, ux_score, quality_score, innovation_score,
    adoption_score, retention_score, founder_alignment_score, overall_product_score,
  };
}

export function detectRisks(
  health: ProductHealthReport,
  ux: UxSignals,
  founderAlignmentPct: number,
): Risk[] {
  const risks: Risk[] = [];
  if (health.averageUsagePct < 30) {
    risks.push({
      kind: "adoption_risk",
      severity: health.averageUsagePct < 15 ? "critical" : "high",
      detail: `Average usage at ${health.averageUsagePct}%`,
    });
  }
  if (health.totalBugs > 20) {
    risks.push({
      kind: "quality_risk",
      severity: health.totalBugs > 100 ? "critical" : health.totalBugs > 50 ? "high" : "medium",
      detail: `${health.totalBugs} open bugs across surfaces`,
    });
  }
  const uxValues = Object.values(ux) as number[];
  const uxAvg = avg(uxValues);
  if (uxAvg < 60) {
    risks.push({
      kind: "ux_risk",
      severity: uxAvg < 40 ? "high" : "medium",
      detail: `UX average at ${Math.round(uxAvg)}`,
    });
  }
  if (ux.consistency < 60 || ux.brand_identity < 60) {
    risks.push({
      kind: "consistency_risk",
      severity: "medium",
      detail: `Consistency=${ux.consistency}, Brand=${ux.brand_identity}`,
    });
  }
  if (founderAlignmentPct < 70) {
    risks.push({
      kind: "alignment_risk",
      severity: founderAlignmentPct < 50 ? "high" : "medium",
      detail: `Founder alignment at ${founderAlignmentPct}%`,
    });
  }
  return risks;
}

export function buildRoadmap(features: Recommendation[]): RoadmapItem[] {
  const items: RoadmapItem[] = [];
  const p0 = features.filter((f) => f.priority === "p0");
  const p1 = features.filter((f) => f.priority === "p1");
  const p2 = features.filter((f) => f.priority === "p2");
  const p3 = features.filter((f) => f.priority === "p3");
  for (const f of p0) items.push({ horizon: "30d_product_plan", title: f.title, priority: f.priority, surfaces: [] });
  for (const f of p1) items.push({ horizon: "90d_product_plan", title: f.title, priority: f.priority, surfaces: [] });
  for (const f of p2) items.push({ horizon: "6m_roadmap", title: f.title, priority: f.priority, surfaces: [] });
  for (const f of p3) items.push({ horizon: "1y_roadmap", title: f.title, priority: f.priority, surfaces: [] });
  return items;
}

export function composeCpoReport(input: {
  productHealth: ProductHealthReport;
  ux: UxSignals;
  kpis: KpiReport;
  roadmap: RoadmapItem[];
  opportunities: string[];
  risks: Risk[];
  priorityFeatures: Recommendation[];
  councilConflicts: CouncilConflict[];
  summary: string;
}): CpoReport {
  const userValue = input.priorityFeatures.length
    ? Math.round(avg(input.priorityFeatures.map((f) => f.userValue)))
    : 0;
  const businessValue = input.priorityFeatures.length
    ? Math.round(avg(input.priorityFeatures.map((f) => f.businessValue)))
    : 0;
  const estimatedRoi = input.priorityFeatures.length
    ? Math.round(avg(input.priorityFeatures.map((f) => f.expectedRoi)))
    : 0;
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const topRisks = [...input.risks].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  return {
    executiveSummary: input.summary,
    productHealth: input.productHealth,
    ux: input.ux,
    kpis: input.kpis,
    roadmap: input.roadmap,
    topOpportunities: input.opportunities,
    topRisks,
    priorityFeatures: input.priorityFeatures,
    userValue,
    businessValue,
    estimatedRoi,
    councilConflicts: input.councilConflicts,
    canWriteProductionCode: false,
    canChangeProductDirectly: false,
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R174_POLICY = {
  id: "R174",
  name: "AI CPO",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  canWriteProductionCode: false,
  canChangeProductDirectly: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  executiveCouncil: EXECUTIVE_COUNCIL,
  responsibilities: RESPONSIBILITIES,
  productSurfaces: PRODUCT_SURFACES,
  roadmapHorizons: ROADMAP_HORIZONS,
  featureSignals: FEATURE_SIGNAL_KINDS,
  uxAreas: UX_AREAS,
  kpiDimensions: KPI_DIMENSIONS,
  reportSections: REPORT_SECTIONS,
  founderControls: FOUNDER_CONTROLS,
  aiDecisionKinds: AI_DECISION_KINDS,
  priorities: PRIORITY_LEVELS,
  pipeline: PIPELINE_STAGES,
  companyProfile: {
    legalName: "HAPPY PERSON PRIVATE LIMITED",
    shortName: "H.P PRIVATE LIMITED",
    founder: "MO NAUSHAD RAZA QADRI",
  },
  dailyFreeCredits: {
    default: 5,
    refresh: "daily",
    accumulate: false,
    carryForward: false,
    serverAuthoritative: true,
    deductionOrder: ["daily_free", "subscription", "purchased"] as const,
    purchasedIntact: true,
    subscriptionIntact: true,
  },
} as const;
