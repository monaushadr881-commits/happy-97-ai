/**
 * R176 — AI Research Director™
 *
 * PURE GOVERNANCE + RESEARCH LEADERSHIP LAYER. No new runtime,
 * no Research/Knowledge/Innovation engine V2, no duplicate. Reuses
 * canonical owners only.
 *
 * The AI Research Director evaluates technologies, frameworks, platforms,
 * and standards across 18 research domains, produces feasibility studies,
 * risk/cost/ROI analyses, and executive research reports. It NEVER
 * implements, NEVER deploys, NEVER accesses private information, NEVER
 * bypasses R158. Every recommendation routes through R159→…→R158.
 * Founder decides.
 */

export const RESPONSIBILITIES = [
  "technology_research",
  "ai_research",
  "market_research",
  "framework_research",
  "infrastructure_research",
  "architecture_research",
  "developer_tool_research",
  "security_research",
  "performance_research",
  "business_research",
  "future_platform_research",
  "standards_research",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const RESEARCH_DOMAINS = [
  "artificial_intelligence",
  "llms",
  "multimodal_ai",
  "mobile",
  "web",
  "cloud",
  "security",
  "databases",
  "networking",
  "xr",
  "ar",
  "vr",
  "vision_pro",
  "metahuman",
  "nvidia_ace",
  "live2d",
  "developer_tools",
  "enterprise_software",
] as const;
export type ResearchDomain = (typeof RESEARCH_DOMAINS)[number];

export const RESEARCH_TYPES = [
  "technology_review",
  "feasibility_study",
  "proof_of_concept_plan",
  "risk_analysis",
  "cost_analysis",
  "roi_analysis",
  "trend_analysis",
  "architecture_analysis",
] as const;
export type ResearchType = (typeof RESEARCH_TYPES)[number];

export const ALLOWED_SOURCES = [
  "founder_knowledge",
  "approved_internal_documentation",
  "official_documentation",
  "public_standards",
  "public_specifications",
  "academic_papers",
  "official_sdk_documentation",
] as const;
export type AllowedSource = (typeof ALLOWED_SOURCES)[number];

export const FORBIDDEN_SOURCES = [
  "leaked_information",
  "private_repositories",
  "protected_documentation",
  "unauthorized_apis",
  "reverse_engineering",
  "copyright_violations",
] as const;
export type ForbiddenSource = (typeof FORBIDDEN_SOURCES)[number];

export const EVALUATION_AXES = [
  "benefits",
  "risks",
  "cost",
  "complexity",
  "dependencies",
  "compatibility",
  "scalability",
  "maintainability",
] as const;
export type EvaluationAxis = (typeof EVALUATION_AXES)[number];

export const KPI_DIMENSIONS = [
  "innovation_score",
  "research_confidence",
  "technology_readiness",
  "feasibility_score",
  "risk_score",
  "business_value",
  "engineering_value",
  "overall_research_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const RECOMMENDATION_KINDS = [
  "adopt",
  "evaluate_later",
  "prototype",
  "reject",
  "needs_more_research",
] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "research_findings",
  "technology_comparison",
  "future_opportunities",
  "top_risks",
  "estimated_cost",
  "estimated_roi",
  "priority",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "archive",
  "schedule",
  "compare",
  "bookmark",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const EXECUTIVE_COUNCIL = [
  "R171_AICTO",
  "R172_AICOO",
  "R173_AICFO",
  "R174_AICPO",
  "R175_AICGO",
] as const;
export type ExecutivePeer = (typeof EXECUTIVE_COUNCIL)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R120_Analytics",
  "R126_Creator",
  "R128_RevenueOS",
  "R104_Analytics",
  "R145_BusinessOS",
  "R130_FounderDashboard",
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
  "R174_AICPO",
  "R175_AICGO",
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
  "sourceValidation",
  "evaluate",
  "compareTechnologies",
  "computeKpis",
  "detectRisks",
  "forecastAdoption",
  "recommend",
  "composeReport",
  "councilReview",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface Source {
  kind: AllowedSource | ForbiddenSource | string;
  citation: string;
}

export interface EvaluationScores {
  benefits: number;
  risks: number;
  cost: number;
  complexity: number;
  dependencies: number;
  compatibility: number;
  scalability: number;
  maintainability: number;
}

export interface TechnologyCandidate {
  id: string;
  name: string;
  domain: ResearchDomain;
  type: ResearchType;
  founderRequested: boolean;
  technologyReadinessLevel: number; // 1..9
  sources: Source[];
  scores: EvaluationScores;
}

export type KpiReport = Record<KpiDimension, number>;

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export interface Risk {
  kind:
    | "adoption_risk"
    | "security_risk"
    | "cost_risk"
    | "compatibility_risk"
    | "dependency_risk"
    | "obsolescence_risk"
    | "compliance_risk";
  severity: RiskSeverity;
  detail: string;
}

export interface Recommendation {
  candidateId: string;
  name: string;
  kind: RecommendationKind;
  rationale: string;
  priority: Priority;
  expectedRoi: number;      // 0..100
  estimatedCost: number;    // 0..100 relative
  handoff: readonly HandoffStep[];
}

export interface ComparisonRow {
  name: string;
  domain: ResearchDomain;
  overall: number;
  benefits: number;
  risks: number;
  cost: number;
  readiness: number;
}

export interface AdoptionForecast {
  candidateId: string;
  horizon: "30d" | "90d" | "12m";
  adoptionLikelihoodPct: number;
}

export interface CouncilConflict {
  peer: ExecutivePeer;
  topic: string;
  researchPosition: string;
  peerPosition: string;
}

export interface ResearchReport {
  executiveSummary: string;
  researchFindings: string[];
  comparison: ComparisonRow[];
  futureOpportunities: string[];
  topRisks: Risk[];
  kpis: KpiReport;
  recommendations: Recommendation[];
  forecast: AdoptionForecast[];
  estimatedCost: number;
  estimatedRoi: number;
  priorityActions: string[];
  councilConflicts: CouncilConflict[];
  canImplement: false;
  canDeploy: false;
  canAccessPrivateInfo: false;
  canAutoImplement: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const FORBIDDEN_SET = new Set<string>(FORBIDDEN_SOURCES);
const ALLOWED_SET = new Set<string>(ALLOWED_SOURCES);

export function validateSources(sources: Source[]): {
  ok: boolean;
  allowed: Source[];
  rejected: Source[];
} {
  const allowed: Source[] = [];
  const rejected: Source[] = [];
  for (const s of sources) {
    if (FORBIDDEN_SET.has(s.kind)) rejected.push(s);
    else if (ALLOWED_SET.has(s.kind)) allowed.push(s);
    else rejected.push(s);
  }
  return { ok: rejected.length === 0, allowed, rejected };
}

export function scoreOverall(s: EvaluationScores, trl: number): number {
  const positives = s.benefits * 0.35 + s.scalability * 0.15 +
    s.maintainability * 0.10 + s.compatibility * 0.10;
  const negatives = s.risks * 0.20 + s.cost * 0.10 + s.complexity * 0.10;
  const readiness = (Math.max(1, Math.min(9, trl)) / 9) * 15;
  return clamp(positives - negatives + readiness);
}

export function scorePriority(roi: number, cost: number): Priority {
  const score = clamp(roi) - clamp(cost) * 0.5;
  if (score >= 60) return "p0";
  if (score >= 30) return "p1";
  if (score >= 10) return "p2";
  return "p3";
}

export function evaluateCandidates(
  candidates: TechnologyCandidate[],
): { candidate: TechnologyCandidate; overall: number; sourcesOk: boolean }[] {
  return candidates.map((c) => {
    const validation = validateSources(c.sources);
    return {
      candidate: c,
      overall: validation.ok ? scoreOverall(c.scores, c.technologyReadinessLevel) : 0,
      sourcesOk: validation.ok,
    };
  });
}

export function compareTechnologies(
  candidates: TechnologyCandidate[],
): ComparisonRow[] {
  return evaluateCandidates(candidates)
    .map(({ candidate, overall }) => ({
      name: candidate.name,
      domain: candidate.domain,
      overall,
      benefits: clamp(candidate.scores.benefits),
      risks: clamp(candidate.scores.risks),
      cost: clamp(candidate.scores.cost),
      readiness: candidate.technologyReadinessLevel,
    }))
    .sort((a, b) => b.overall - a.overall);
}

export function recommend(candidates: TechnologyCandidate[]): Recommendation[] {
  return evaluateCandidates(candidates).map(({ candidate, overall, sourcesOk }) => {
    const founderBoost = candidate.founderRequested ? 15 : 0;
    const roi = clamp(overall + founderBoost - candidate.scores.cost * 0.3);
    let kind: RecommendationKind;
    if (!sourcesOk) kind = "reject";
    else if (overall >= 70 && candidate.technologyReadinessLevel >= 7) kind = "adopt";
    else if (overall >= 55) kind = "prototype";
    else if (overall >= 40) kind = "evaluate_later";
    else if (overall >= 20) kind = "needs_more_research";
    else kind = "reject";
    return {
      candidateId: candidate.id,
      name: candidate.name,
      kind,
      rationale: `overall=${overall}, TRL=${candidate.technologyReadinessLevel}, cost=${candidate.scores.cost}${
        candidate.founderRequested ? ", founder-requested" : ""
      }${sourcesOk ? "" : ", forbidden-source"}`,
      priority: scorePriority(roi, candidate.scores.cost),
      expectedRoi: roi,
      estimatedCost: clamp(candidate.scores.cost),
      handoff: HANDOFF_CHAIN,
    } satisfies Recommendation;
  }).sort((a, b) => PRIORITY_LEVELS.indexOf(a.priority) - PRIORITY_LEVELS.indexOf(b.priority));
}

export function computeKpis(
  candidates: TechnologyCandidate[],
  recommendations: Recommendation[],
): KpiReport {
  const evals = evaluateCandidates(candidates);
  const overalls = evals.map((e) => e.overall);
  const trls = candidates.map((c) => c.technologyReadinessLevel);
  const risks = candidates.map((c) => c.scores.risks);
  const benefits = candidates.map((c) => c.scores.benefits);
  const complexity = candidates.map((c) => c.scores.complexity);
  const compat = candidates.map((c) => c.scores.compatibility);
  const innovation_score = clamp(
    (recommendations.filter((r) => r.kind === "adopt" || r.kind === "prototype").length /
      Math.max(1, recommendations.length)) * 100,
  );
  const research_confidence = clamp(
    (evals.filter((e) => e.sourcesOk).length / Math.max(1, evals.length)) * 100,
  );
  const technology_readiness = clamp((avg(trls) / 9) * 100);
  const feasibility_score = clamp(avg(compat) * 0.5 + (100 - avg(complexity)) * 0.5);
  const risk_score = clamp(100 - avg(risks));
  const business_value = clamp(avg(benefits));
  const engineering_value = clamp(avg(overalls));
  const overall_research_score = clamp(
    (innovation_score + research_confidence + technology_readiness +
      feasibility_score + risk_score + business_value + engineering_value) / 7,
  );
  return {
    innovation_score,
    research_confidence,
    technology_readiness,
    feasibility_score,
    risk_score,
    business_value,
    engineering_value,
    overall_research_score,
  };
}

export function detectRisks(candidates: TechnologyCandidate[]): Risk[] {
  const risks: Risk[] = [];
  for (const c of candidates) {
    const v = validateSources(c.sources);
    if (!v.ok) {
      risks.push({
        kind: "compliance_risk",
        severity: "critical",
        detail: `${c.name}: forbidden source(s) — ${v.rejected.map((r) => r.kind).join(", ")}`,
      });
    }
    if (c.scores.risks >= 70) {
      risks.push({
        kind: "security_risk",
        severity: c.scores.risks >= 85 ? "high" : "medium",
        detail: `${c.name}: risk score ${c.scores.risks}`,
      });
    }
    if (c.scores.cost >= 75) {
      risks.push({
        kind: "cost_risk",
        severity: c.scores.cost >= 90 ? "high" : "medium",
        detail: `${c.name}: cost score ${c.scores.cost}`,
      });
    }
    if (c.scores.compatibility <= 40) {
      risks.push({
        kind: "compatibility_risk",
        severity: c.scores.compatibility <= 20 ? "high" : "medium",
        detail: `${c.name}: compatibility ${c.scores.compatibility}`,
      });
    }
    if (c.scores.dependencies >= 75) {
      risks.push({
        kind: "dependency_risk",
        severity: "medium",
        detail: `${c.name}: dependencies ${c.scores.dependencies}`,
      });
    }
    if (c.technologyReadinessLevel <= 3) {
      risks.push({
        kind: "obsolescence_risk",
        severity: c.technologyReadinessLevel <= 2 ? "high" : "medium",
        detail: `${c.name}: low TRL ${c.technologyReadinessLevel}`,
      });
    }
  }
  return risks;
}

export function forecastAdoption(
  candidates: TechnologyCandidate[],
): AdoptionForecast[] {
  const evals = evaluateCandidates(candidates);
  const out: AdoptionForecast[] = [];
  for (const { candidate, overall, sourcesOk } of evals) {
    const base = sourcesOk ? overall : 0;
    out.push({ candidateId: candidate.id, horizon: "30d", adoptionLikelihoodPct: clamp(base * 0.4) });
    out.push({ candidateId: candidate.id, horizon: "90d", adoptionLikelihoodPct: clamp(base * 0.7) });
    out.push({ candidateId: candidate.id, horizon: "12m", adoptionLikelihoodPct: clamp(base) });
  }
  return out;
}

export function composeResearchReport(input: {
  candidates: TechnologyCandidate[];
  findings: string[];
  futureOpportunities: string[];
  councilConflicts: CouncilConflict[];
  summary: string;
  priorityActions: string[];
}): ResearchReport {
  const comparison = compareTechnologies(input.candidates);
  const recommendations = recommend(input.candidates);
  const kpis = computeKpis(input.candidates, recommendations);
  const risks = detectRisks(input.candidates);
  const forecast = forecastAdoption(input.candidates);
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const topRisks = [...risks].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  const estimatedRoi = recommendations.length
    ? Math.round(avg(recommendations.map((r) => r.expectedRoi))) : 0;
  const estimatedCost = recommendations.length
    ? Math.round(avg(recommendations.map((r) => r.estimatedCost))) : 0;
  return {
    executiveSummary: input.summary,
    researchFindings: input.findings,
    comparison,
    futureOpportunities: input.futureOpportunities,
    topRisks,
    kpis,
    recommendations,
    forecast,
    estimatedCost,
    estimatedRoi,
    priorityActions: input.priorityActions,
    councilConflicts: input.councilConflicts,
    canImplement: false,
    canDeploy: false,
    canAccessPrivateInfo: false,
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R176_POLICY = {
  id: "R176",
  name: "AI Research Director",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  canImplement: false,
  canDeploy: false,
  canAccessPrivateInfo: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  executiveCouncil: EXECUTIVE_COUNCIL,
  responsibilities: RESPONSIBILITIES,
  researchDomains: RESEARCH_DOMAINS,
  researchTypes: RESEARCH_TYPES,
  allowedSources: ALLOWED_SOURCES,
  forbiddenSources: FORBIDDEN_SOURCES,
  evaluationAxes: EVALUATION_AXES,
  kpiDimensions: KPI_DIMENSIONS,
  recommendationKinds: RECOMMENDATION_KINDS,
  reportSections: REPORT_SECTIONS,
  founderControls: FOUNDER_CONTROLS,
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
