/**
 * R170 — AI Competitor Intelligence™
 *
 * PURE GOVERNANCE + STRATEGY LAYER. No new runtime, no Competitor
 * Engine V2, no Scraping Engine, no private-data access.
 * Reuses canonical owners: Brain, Memory, Conversation, Workspace,
 * Search, Knowledge, Analytics, Business OS, Revenue OS, R158
 * Approval Gateway, R159 Intent Engine, R160 Guardian AI, R161
 * Software Architect, R162 Code Review, R163 QA, R164 Impact
 * Analyzer, R165 Preview Studio, R166 Rollback, R167 Documentation,
 * R168 Optimization Advisor, R169 Learning Memory, R145 Founder
 * Dashboard, R130 Audit, R153 Happy ID, R156 RBAC.
 *
 * HAPPY AI produces strategic competitive intelligence using ONLY
 * public information. It never scrapes protected resources, never
 * bypasses authentication, never copies source code, designs, or
 * licensed assets. Every recommendation routes through R158.
 * Compile-time lock: `canAutoImplement: false`.
 */

export const ALLOWED_SOURCES = [
  "public_website",
  "public_pricing_page",
  "public_product_page",
  "public_documentation",
  "public_release_notes",
  "public_roadmap",
  "public_api_docs",
  "public_blog",
  "public_changelog",
  "public_marketing",
  "founder_provided",
  "official_press_release",
] as const;
export type AllowedSource = (typeof ALLOWED_SOURCES)[number];

export const FORBIDDEN_SOURCES = [
  "private_information",
  "leaked_information",
  "unauthorized_access",
  "scraped_protected_resource",
  "reverse_engineered_binary",
  "license_violation",
  "copied_source_code",
  "copied_design",
  "copied_proprietary_asset",
  "bypassed_authentication",
] as const;
export type ForbiddenSource = (typeof FORBIDDEN_SOURCES)[number];

export const ANALYSIS_AREAS = [
  "products",
  "platforms",
  "features",
  "pricing",
  "subscriptions",
  "user_experience",
  "ui",
  "performance",
  "security",
  "ai_features",
  "business_models",
  "technology_trends",
  "developer_experience",
  "customer_experience",
  "public_apis",
  "release_notes",
  "roadmaps",
] as const;
export type AnalysisArea = (typeof ANALYSIS_AREAS)[number];

export const COMPARISON_MATRICES = [
  "feature_matrix",
  "capability_matrix",
  "pricing_matrix",
  "ux_comparison",
  "performance_comparison",
  "architecture_comparison",
  "ai_capability_comparison",
  "business_comparison",
] as const;
export type ComparisonMatrix = (typeof COMPARISON_MATRICES)[number];

export const GAP_CATEGORIES = [
  "missing_features",
  "competitive_advantages",
  "weak_areas",
  "strong_areas",
  "quick_wins",
  "long_term_opportunities",
  "innovation_opportunities",
] as const;
export type GapCategory = (typeof GAP_CATEGORIES)[number];

export const RECOMMENDATION_KINDS = [
  "build",
  "improve",
  "avoid",
  "simplify",
] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const MARKET_TRENDS = [
  "industry_trends",
  "technology_trends",
  "ai_trends",
  "business_trends",
  "founder_defined_competitors",
] as const;
export type MarketTrend = (typeof MARKET_TRENDS)[number];

export const OUTPUT_REPORTS = [
  "executive_summary",
  "competitor_report",
  "gap_analysis",
  "priority_matrix",
  "opportunity_report",
  "innovation_report",
  "founder_report",
] as const;
export type OutputReport = (typeof OUTPUT_REPORTS)[number];

export const ETHICS_RULES = [
  "never_copy_source_code",
  "never_copy_designs",
  "never_copy_proprietary_assets",
  "never_copy_licensed_content",
  "never_access_protected_systems",
  "never_bypass_authentication",
  "never_scrape_restricted_data",
  "never_reverse_engineer",
] as const;
export type EthicsRule = (typeof ETHICS_RULES)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R104_Analytics",
  "R128_BusinessOS",
  "R126_RevenueOS",
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
  "R168_OptimizationAdvisor",
  "R169_LearningMemory",
  "R145_FounderDashboard",
  "R130_Audit",
  "R153_HappyID",
  "R156_RBAC",
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
  "verifySources",
  "gateEthics",
  "collectPublicSignals",
  "buildComparisonMatrices",
  "runGapAnalysis",
  "scorePriority",
  "estimateEffortImpact",
  "composeFounderReport",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const COMPANY_PROFILE = {
  legalName: "HAPPY PERSON PRIVATE LIMITED",
  shortName: "H.P PRIVATE LIMITED",
  founder: "MO NAUSHAD RAZA QADRI",
  canonical: true,
  singleSourceOfTruth: true,
} as const;

export interface CompetitorSignal {
  competitorId: string;
  area: AnalysisArea;
  source: AllowedSource | ForbiddenSource;
  summary: string;
  citation: string; // URL or founder-provided reference
  observedAt: string;
}

export interface GapFinding {
  category: GapCategory;
  area: AnalysisArea;
  description: string;
  competitorId?: string;
  businessValue: number; // 0..100
  effort: number; // 0..100
  priority: Priority;
}

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  rationale: string;
  priority: Priority;
  expectedBusinessValue: number; // 0..100
  estimatedEngineeringEffort: number; // 0..100
  handoff: readonly HandoffStep[];
}

export interface FounderReport {
  currentPosition: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  priority: Priority;
  estimatedImpact: number; // 0..100
  ethicsCleared: boolean;
  reuseOnly: true;
  newRuntime: false;
  canAutoImplement: false;
  handoffTarget: "R158_ApprovalGateway";
}

export function isForbiddenSource(source: string): boolean {
  return (FORBIDDEN_SOURCES as readonly string[]).includes(source);
}

export function isAllowedSource(source: string): boolean {
  return (ALLOWED_SOURCES as readonly string[]).includes(source);
}

export function verifySignals(signals: CompetitorSignal[]): {
  allowed: CompetitorSignal[];
  rejected: CompetitorSignal[];
  ethicsCleared: boolean;
} {
  const allowed: CompetitorSignal[] = [];
  const rejected: CompetitorSignal[] = [];
  for (const s of signals) {
    if (isAllowedSource(s.source) && !isForbiddenSource(s.source) && s.citation) {
      allowed.push(s);
    } else {
      rejected.push(s);
    }
  }
  return { allowed, rejected, ethicsCleared: rejected.length === 0 };
}

export function scorePriority(businessValue: number, effort: number): Priority {
  const clampedV = Math.max(0, Math.min(100, businessValue));
  const clampedE = Math.max(0, Math.min(100, effort));
  const score = clampedV - clampedE * 0.5;
  if (score >= 60) return "p0";
  if (score >= 30) return "p1";
  if (score >= 10) return "p2";
  return "p3";
}

export function runGapAnalysis(
  ourFeatures: Set<string>,
  competitorFeaturesByArea: Partial<Record<AnalysisArea, string[]>>,
): GapFinding[] {
  const findings: GapFinding[] = [];
  for (const [area, list] of Object.entries(competitorFeaturesByArea) as [
    AnalysisArea,
    string[],
  ][]) {
    for (const feature of list) {
      if (!ourFeatures.has(feature)) {
        const businessValue = 60;
        const effort = 40;
        findings.push({
          category: "missing_features",
          area,
          description: `Competitor offers "${feature}" in ${area}`,
          businessValue,
          effort,
          priority: scorePriority(businessValue, effort),
        });
      }
    }
  }
  return findings;
}

export function composeFounderReport(input: {
  signals: CompetitorSignal[];
  gaps: GapFinding[];
  strengths: string[];
  weaknesses: string[];
  currentPosition: string;
}): FounderReport {
  const verify = verifySignals(input.signals);
  const recommendations: Recommendation[] = input.gaps.map((g) => ({
    kind: g.category === "missing_features" ? "build" : "improve",
    title: g.description,
    rationale: `Public evidence indicates a ${g.category.replace(/_/g, " ")} in ${g.area}`,
    priority: g.priority,
    expectedBusinessValue: g.businessValue,
    estimatedEngineeringEffort: g.effort,
    handoff: HANDOFF_CHAIN,
  }));
  const impact = recommendations.length
    ? Math.round(
        recommendations.reduce((a, r) => a + r.expectedBusinessValue, 0) /
          recommendations.length,
      )
    : 0;
  const priority = recommendations.reduce<Priority>((best, r) => {
    const rank = { p0: 0, p1: 1, p2: 2, p3: 3 } as const;
    return rank[r.priority] < rank[best] ? r.priority : best;
  }, "p3");
  return {
    currentPosition: input.currentPosition,
    strengths: input.strengths,
    weaknesses: input.weaknesses,
    recommendations,
    priority,
    estimatedImpact: impact,
    ethicsCleared: verify.ethicsCleared,
    reuseOnly: true,
    newRuntime: false,
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
  };
}

export const R170_POLICY = {
  id: "R170",
  name: "AI Competitor Intelligence",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  allowedSources: ALLOWED_SOURCES,
  forbiddenSources: FORBIDDEN_SOURCES,
  analysisAreas: ANALYSIS_AREAS,
  comparisonMatrices: COMPARISON_MATRICES,
  gapCategories: GAP_CATEGORIES,
  recommendationKinds: RECOMMENDATION_KINDS,
  priorities: PRIORITY_LEVELS,
  marketTrends: MARKET_TRENDS,
  outputReports: OUTPUT_REPORTS,
  ethicsRules: ETHICS_RULES,
  pipeline: PIPELINE_STAGES,
  companyProfile: COMPANY_PROFILE,
  dailyFreeCredits: { default: 5, refresh: "daily", accumulate: false, carryForward: false },
} as const;
