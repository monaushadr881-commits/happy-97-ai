/**
 * R179 — AI Strategy Director™
 *
 * PURE GOVERNANCE + STRATEGY LEADERSHIP LAYER. No new runtime,
 * no Strategy/Planning/Decision/Executive engine V2, no duplicate.
 * Reuses canonical owners only (R104 Analytics, R114 Happy ID,
 * R115 Brain, R116 Memory, R117 Conversation, R118 Workspace,
 * R119 Files, R120 Search, R126 Creator, R128 Revenue,
 * R130 Audit, R145 Founder Dashboard, R153/R156 Founder,
 * R158 Approval Gateway, R159 Intent, R160 Guardian,
 * R164 Impact, R168 Optimization, R169 Learning,
 * R170 Competitor, R171–R178 Executive Council, RBAC).
 *
 * The AI Strategy Director aligns, prioritizes, coordinates and
 * evaluates all executive recommendations, producing a unified
 * strategy. It NEVER executes, NEVER deploys, NEVER edits
 * production, NEVER changes company policy, NEVER bypasses R158.
 * Founder decides.
 */

export const RESPONSIBILITIES = [
  "corporate_strategy",
  "executive_alignment",
  "company_vision",
  "business_prioritization",
  "technology_alignment",
  "financial_alignment",
  "operational_alignment",
  "product_alignment",
  "growth_alignment",
  "innovation_alignment",
  "research_alignment",
  "release_alignment",
  "risk_alignment",
  "long_term_planning",
  "enterprise_expansion",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const ANALYSIS_DIMENSIONS = [
  "technology",
  "operations",
  "finance",
  "product",
  "growth",
  "research",
  "release",
  "innovation",
  "security",
  "revenue",
  "business",
  "customer",
  "founder_vision",
] as const;
export type AnalysisDimension = (typeof ANALYSIS_DIMENSIONS)[number];

export const PLANNING_HORIZONS = [
  "30d",
  "90d",
  "6m",
  "1y",
  "3y",
  "5y",
  "10y",
] as const;
export type PlanningHorizon = (typeof PLANNING_HORIZONS)[number];

export const EXECUTIVE_REPORTS = [
  "cto",
  "coo",
  "cfo",
  "cpo",
  "cgo",
  "research",
  "release",
  "innovation",
] as const;
export type ExecutiveReportKind = (typeof EXECUTIVE_REPORTS)[number];

export const PORTFOLIO_PLATFORMS = [
  "web",
  "android",
  "ios",
  "digital_human",
  "business_os",
  "revenue_os",
  "future_platforms",
] as const;
export type PortfolioPlatform = (typeof PORTFOLIO_PLATFORMS)[number];

export const PRIORITY_AXES = [
  "business_value",
  "founder_value",
  "engineering_value",
  "risk",
  "roi",
  "complexity",
  "dependencies",
  "time",
] as const;
export type PriorityAxis = (typeof PRIORITY_AXES)[number];

export const KPI_DIMENSIONS = [
  "vision_score",
  "alignment_score",
  "execution_score",
  "growth_score",
  "innovation_score",
  "financial_score",
  "technology_score",
  "overall_strategy_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const RISK_KINDS = [
  "technology_risk",
  "financial_risk",
  "growth_risk",
  "operational_risk",
  "security_risk",
  "market_risk",
  "execution_risk",
  "founder_alignment_risk",
] as const;
export type RiskKind = (typeof RISK_KINDS)[number];

export const RECOMMENDATIONS = [
  "execute",
  "delay",
  "research",
  "prototype",
  "archive",
  "reject",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "compare",
  "schedule",
  "archive",
  "pin",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const EXECUTIVE_COUNCIL = [
  "R171_CTO",
  "R172_COO",
  "R173_CFO",
  "R174_CPO",
  "R175_CGO",
  "R176_ResearchDirector",
  "R177_ReleaseDirector",
  "R178_InnovationDirector",
] as const;
export type Council = (typeof EXECUTIVE_COUNCIL)[number];

// -------- Governance Locks ----------

export const LOCKS = {
  canExecute: false,
  canDeploy: false,
  canEditProduction: false,
  canChangeCompanyPolicy: false,
  canBypassApprovalGateway: false,
  canAutoImplement: false,
  newRuntime: false,
  reuseOnly: true,
  handoffTarget: "R158_ApprovalGateway",
} as const;

// -------- Types ----------

export interface ExecutiveInput {
  from: ExecutiveReportKind;
  vote: "support" | "block" | "neutral";
  weight?: number; // 0-100
  scores?: Partial<Record<AnalysisDimension, number>>; // 0-100
  headline?: string;
}

export interface PriorityItem {
  id: string;
  title: string;
  founderRequested?: boolean;
  scores: Partial<Record<PriorityAxis, number>>; // 0-100
}

export interface Kpis {
  vision_score: number;
  alignment_score: number;
  execution_score: number;
  growth_score: number;
  innovation_score: number;
  financial_score: number;
  technology_score: number;
  overall_strategy_score: number;
}

export interface RiskFinding {
  kind: RiskKind;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
}

export interface HorizonPlan {
  horizon: PlanningHorizon;
  focus: string;
  items: string[];
}

export interface UnifiedStrategy {
  summary: string;
  kpis: Kpis;
  recommendation: Recommendation;
  handoff: typeof LOCKS.handoffTarget;
  risks: RiskFinding[];
  councilConflicts: Council[];
  priorityMatrix: Array<{ id: string; priority: "p0" | "p1" | "p2" | "p3" }>;
  horizons: HorizonPlan[];
  locks: typeof LOCKS;
}

// -------- Helpers ----------

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const avg = (...xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

// -------- Executive Alignment ----------

export function alignmentScore(inputs: ExecutiveInput[]): number {
  if (!inputs.length) return 0;
  const total = inputs.reduce((sum, i) => sum + (i.weight ?? 100), 0);
  const supported = inputs.reduce(
    (sum, i) => sum + (i.vote === "support" ? i.weight ?? 100 : 0),
    0,
  );
  return Math.round(clamp((supported / (total || 1)) * 100));
}

export function detectCouncilConflicts(inputs: ExecutiveInput[]): Council[] {
  const map: Record<ExecutiveReportKind, Council> = {
    cto: "R171_CTO",
    coo: "R172_COO",
    cfo: "R173_CFO",
    cpo: "R174_CPO",
    cgo: "R175_CGO",
    research: "R176_ResearchDirector",
    release: "R177_ReleaseDirector",
    innovation: "R178_InnovationDirector",
  };
  return inputs.filter((i) => i.vote === "block").map((i) => map[i.from]);
}

// -------- KPIs ----------

export function computeKpis(inputs: ExecutiveInput[]): Kpis {
  const dim = (d: AnalysisDimension) =>
    Math.round(
      avg(
        ...inputs
          .map((i) => i.scores?.[d])
          .filter((v): v is number => typeof v === "number"),
      ),
    );

  const alignment = alignmentScore(inputs);
  const vision = dim("founder_vision") || alignment;
  const growth = dim("growth");
  const innovation = dim("innovation");
  const financial = dim("finance");
  const technology = dim("technology");
  const execution = Math.round(
    avg(dim("operations"), dim("release"), dim("product")),
  );
  const overall = Math.round(
    clamp(
      vision * 0.15 +
        alignment * 0.2 +
        execution * 0.15 +
        growth * 0.1 +
        innovation * 0.1 +
        financial * 0.15 +
        technology * 0.15,
    ),
  );

  return {
    vision_score: vision,
    alignment_score: alignment,
    execution_score: execution,
    growth_score: growth,
    innovation_score: innovation,
    financial_score: financial,
    technology_score: technology,
    overall_strategy_score: overall,
  };
}

// -------- Risks ----------

export function detectRisks(inputs: ExecutiveInput[], k: Kpis): RiskFinding[] {
  const out: RiskFinding[] = [];
  const push = (kind: RiskKind, score: number, label: string) => {
    if (score <= 30)
      out.push({ kind, severity: "high", reason: `${label} score ${score}` });
    else if (score <= 50)
      out.push({ kind, severity: "medium", reason: `${label} score ${score}` });
  };
  push("technology_risk", k.technology_score, "technology");
  push("financial_risk", k.financial_score, "financial");
  push("growth_risk", k.growth_score, "growth");
  push("execution_risk", k.execution_score, "execution");

  const opsScores = inputs
    .map((i) => i.scores?.operations)
    .filter((v): v is number => typeof v === "number");
  if (opsScores.length && avg(...opsScores) <= 40)
    out.push({ kind: "operational_risk", severity: "medium", reason: "low ops score" });

  const secScores = inputs
    .map((i) => i.scores?.security)
    .filter((v): v is number => typeof v === "number");
  if (secScores.length && avg(...secScores) <= 30)
    out.push({ kind: "security_risk", severity: "critical", reason: "security below floor" });

  const marketScores = inputs
    .map((i) => i.scores?.customer)
    .filter((v): v is number => typeof v === "number");
  if (marketScores.length && avg(...marketScores) <= 30)
    out.push({ kind: "market_risk", severity: "high", reason: "customer signal low" });

  if (k.alignment_score <= 50)
    out.push({
      kind: "founder_alignment_risk",
      severity: k.alignment_score <= 30 ? "critical" : "high",
      reason: `alignment ${k.alignment_score}`,
    });

  return out;
}

// -------- Priority Matrix ----------

export function priorityOf(item: PriorityItem): "p0" | "p1" | "p2" | "p3" {
  const s = item.scores;
  const business = clamp(s.business_value ?? 0);
  const founder = clamp(s.founder_value ?? 0);
  const roi = clamp(s.roi ?? 0);
  const risk = clamp(s.risk ?? 50);
  const complexity = clamp(s.complexity ?? 50);
  const deps = clamp(s.dependencies ?? 50);
  const boost = item.founderRequested ? 15 : 0;
  const score = clamp(
    business * 0.3 +
      founder * 0.25 +
      roi * 0.25 +
      (100 - risk) * 0.1 +
      (100 - complexity) * 0.05 +
      (100 - deps) * 0.05 +
      boost,
  );
  if (score >= 75) return "p0";
  if (score >= 55) return "p1";
  if (score >= 35) return "p2";
  return "p3";
}

// -------- Horizons ----------

export function buildHorizons(items: PriorityItem[]): HorizonPlan[] {
  const buckets: Record<PlanningHorizon, string[]> = {
    "30d": [], "90d": [], "6m": [], "1y": [], "3y": [], "5y": [], "10y": [],
  };
  for (const it of items) {
    const p = priorityOf(it);
    if (p === "p0") buckets["30d"].push(it.title);
    else if (p === "p1") buckets["90d"].push(it.title);
    else if (p === "p2") buckets["1y"].push(it.title);
    else buckets["3y"].push(it.title);
  }
  return PLANNING_HORIZONS.map((h) => ({
    horizon: h,
    focus:
      h === "30d" ? "execute now"
        : h === "90d" ? "high-confidence bets"
        : h === "6m" ? "portfolio balance"
        : h === "1y" ? "platform scale"
        : h === "3y" ? "expansion"
        : h === "5y" ? "market leadership"
        : "long-term vision",
    items: buckets[h],
  }));
}

// -------- Recommendation ----------

export function recommend(k: Kpis, risks: RiskFinding[]): Recommendation {
  if (risks.some((r) => r.severity === "critical")) return "reject";
  if (k.overall_strategy_score >= 75 && k.alignment_score >= 70) return "execute";
  if (k.overall_strategy_score >= 60) return "prototype";
  if (k.overall_strategy_score >= 45) return "research";
  if (k.overall_strategy_score >= 30) return "delay";
  if (k.overall_strategy_score >= 15) return "archive";
  return "reject";
}

// -------- Unified Strategy ----------

export function synthesize(input: {
  executives: ExecutiveInput[];
  items?: PriorityItem[];
}): UnifiedStrategy {
  const executives = input.executives ?? [];
  const items = input.items ?? [];
  const kpis = computeKpis(executives);
  const risks = detectRisks(executives, kpis);
  const conflicts = detectCouncilConflicts(executives);
  const matrix = items.map((i) => ({ id: i.id, priority: priorityOf(i) }));
  const horizons = buildHorizons(items);
  const rec = recommend(kpis, risks);
  return {
    summary: `${executives.length} executive inputs, ${items.length} portfolio items; overall ${kpis.overall_strategy_score}, alignment ${kpis.alignment_score}.`,
    kpis,
    recommendation: rec,
    handoff: LOCKS.handoffTarget,
    risks,
    councilConflicts: conflicts,
    priorityMatrix: matrix,
    horizons,
    locks: LOCKS,
  };
}

export function canAutoExecute(): false {
  return false;
}
