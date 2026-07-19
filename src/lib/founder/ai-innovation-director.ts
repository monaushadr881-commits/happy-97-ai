/**
 * R178 — AI Innovation Director™
 *
 * PURE GOVERNANCE + INNOVATION LEADERSHIP LAYER. No new runtime,
 * no Innovation/Research/Idea/Future engine V2, no duplicate.
 * Reuses canonical owners only (R104 Analytics, R114 Happy ID,
 * R115 Brain, R116 Memory, R117 Conversation, R118 Workspace,
 * R119 Files, R120 Search, R126 Creator, R128 Revenue,
 * R130 Audit, R145 Founder Dashboard, R153/R156 Founder,
 * R158 Approval Gateway, R159 Intent, R160 Guardian,
 * R164 Impact, R168 Optimization, R169 Learning,
 * R170 Competitor, R171–R177 Executive Council, RBAC).
 *
 * The AI Innovation Director discovers, evaluates, prioritizes and
 * organizes future innovations. It NEVER builds, NEVER deploys,
 * NEVER changes production, NEVER bypasses R158. Founder decides.
 */

export const RESPONSIBILITIES = [
  "innovation_strategy",
  "future_product_ideas",
  "research_to_product",
  "technology_adoption",
  "experimental_planning",
  "innovation_roadmap",
  "platform_evolution",
  "future_platform_planning",
  "ip_opportunity_review",
  "long_term_vision",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const INNOVATION_SOURCES = [
  "founder_idea",
  "approved_research",
  "approved_learning",
  "competitor_intelligence",
  "public_technology_trend",
  "approved_user_feedback",
  "approved_business_report",
] as const;
export type InnovationSource = (typeof INNOVATION_SOURCES)[number];

export const FORBIDDEN_SOURCES = [
  "leaked_information",
  "copied_product",
  "copied_source_code",
  "protected_data",
  "unlicensed_material",
  "unauthorized_information",
] as const;
export type ForbiddenSource = (typeof FORBIDDEN_SOURCES)[number];

export const INNOVATION_DOMAINS = [
  "artificial_intelligence",
  "digital_humans",
  "creator_studio",
  "business_os",
  "revenue_os",
  "android",
  "ios",
  "website",
  "xr",
  "ar",
  "vr",
  "vision_pro",
  "metahuman",
  "nvidia_ace",
  "live2d",
  "enterprise_automation",
  "developer_experience",
  "future_platforms",
] as const;
export type InnovationDomain = (typeof INNOVATION_DOMAINS)[number];

export const IDEA_LIFECYCLE = [
  "capture",
  "classify",
  "research",
  "feasibility",
  "roi",
  "risk",
  "priority",
  "roadmap",
  "founder_review",
  "r158_handoff",
] as const;
export type LifecycleStage = (typeof IDEA_LIFECYCLE)[number];

export const PIPELINE_QUEUES = [
  "idea_backlog",
  "innovation_queue",
  "research_queue",
  "prototype_queue",
  "future_roadmap",
  "long_term_vision",
] as const;
export type PipelineQueue = (typeof PIPELINE_QUEUES)[number];

export const EVALUATION_AXES = [
  "business_value",
  "engineering_value",
  "founder_value",
  "user_value",
  "cost",
  "risk",
  "complexity",
  "dependencies",
  "scalability",
  "maintainability",
] as const;
export type EvaluationAxis = (typeof EVALUATION_AXES)[number];

export const KPI_DIMENSIONS = [
  "innovation_score",
  "future_readiness",
  "research_score",
  "business_value",
  "engineering_value",
  "risk_score",
  "roi_score",
  "overall_innovation_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const RECOMMENDATIONS = [
  "prototype",
  "research_more",
  "build_later",
  "archive",
  "reject",
  "immediate_opportunity",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "archive",
  "bookmark",
  "compare",
  "schedule",
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
] as const;
export type Council = (typeof EXECUTIVE_COUNCIL)[number];

// -------- Governance Locks (compile-time literals) ----------

export const LOCKS = {
  canBuild: false,
  canDeploy: false,
  canChangeProduction: false,
  canAutoImplement: false,
  canBypassApprovalGateway: false,
  newRuntime: false,
  reuseOnly: true,
  handoffTarget: "R158_ApprovalGateway",
} as const;

// -------- Types ----------

export interface Idea {
  id: string;
  title: string;
  source: InnovationSource | ForbiddenSource;
  domain: InnovationDomain;
  founderRequested?: boolean;
  scores: Partial<Record<EvaluationAxis, number>>; // 0-100
}

export interface ClassifiedIdea extends Idea {
  stage: LifecycleStage;
  queue: PipelineQueue;
  sourceValid: boolean;
}

export interface Kpis {
  innovation_score: number;
  future_readiness: number;
  research_score: number;
  business_value: number;
  engineering_value: number;
  risk_score: number;
  roi_score: number;
  overall_innovation_score: number;
}

export interface RiskFinding {
  kind:
    | "compliance_risk"
    | "dependency_risk"
    | "cost_risk"
    | "scalability_risk"
    | "maintainability_risk"
    | "adoption_risk";
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
}

export interface InnovationReport {
  summary: string;
  kpis: Kpis;
  recommendation: Recommendation;
  handoff: typeof LOCKS.handoffTarget;
  risks: RiskFinding[];
  councilConflicts: Council[];
  priorityMatrix: Array<{ id: string; priority: "p0" | "p1" | "p2" | "p3" }>;
  locks: typeof LOCKS;
}

// -------- Source validation ----------

export function isForbiddenSource(s: string): s is ForbiddenSource {
  return (FORBIDDEN_SOURCES as readonly string[]).includes(s);
}
export function isValidSource(s: string): s is InnovationSource {
  return (INNOVATION_SOURCES as readonly string[]).includes(s);
}

export function classifyIdea(i: Idea): ClassifiedIdea {
  const sourceValid = isValidSource(i.source);
  const queue: PipelineQueue = !sourceValid
    ? "idea_backlog"
    : i.founderRequested
      ? "innovation_queue"
      : "research_queue";
  return { ...i, stage: sourceValid ? "classify" : "capture", queue, sourceValid };
}

// -------- Scoring ----------

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const avg = (...xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

export function computeKpis(i: Idea): Kpis {
  const s = i.scores;
  const business = clamp(s.business_value ?? 0);
  const engineering = clamp(s.engineering_value ?? 0);
  const user = clamp(s.user_value ?? 0);
  const founder = clamp(s.founder_value ?? 0);
  const cost = clamp(s.cost ?? 50);
  const risk = clamp(s.risk ?? 50);
  const complexity = clamp(s.complexity ?? 50);
  const scalability = clamp(s.scalability ?? 50);
  const maintain = clamp(s.maintainability ?? 50);
  const deps = clamp(s.dependencies ?? 50);

  const research_score = avg(engineering, scalability, 100 - complexity);
  const roi = clamp(business * 0.6 + user * 0.4 - cost * 0.3);
  const readiness = avg(engineering, scalability, maintain, 100 - deps);
  const innovation = avg(business, engineering, user, founder);
  const overall = clamp(
    innovation * 0.4 + roi * 0.3 + readiness * 0.2 - risk * 0.1,
  );

  return {
    innovation_score: Math.round(innovation),
    future_readiness: Math.round(readiness),
    research_score: Math.round(research_score),
    business_value: Math.round(business),
    engineering_value: Math.round(engineering),
    risk_score: Math.round(risk),
    roi_score: Math.round(roi),
    overall_innovation_score: Math.round(overall),
  };
}

// -------- Risks ----------

export function detectRisks(i: Idea): RiskFinding[] {
  const out: RiskFinding[] = [];
  if (isForbiddenSource(i.source)) {
    out.push({
      kind: "compliance_risk",
      severity: "critical",
      reason: `Forbidden source: ${i.source}`,
    });
  }
  const s = i.scores;
  if ((s.cost ?? 0) >= 80)
    out.push({ kind: "cost_risk", severity: "high", reason: "cost score >= 80" });
  if ((s.dependencies ?? 0) >= 80)
    out.push({ kind: "dependency_risk", severity: "high", reason: "heavy deps" });
  if ((s.scalability ?? 100) <= 30)
    out.push({ kind: "scalability_risk", severity: "medium", reason: "low scalability" });
  if ((s.maintainability ?? 100) <= 30)
    out.push({
      kind: "maintainability_risk",
      severity: "medium",
      reason: "low maintainability",
    });
  if ((s.user_value ?? 100) <= 20)
    out.push({ kind: "adoption_risk", severity: "medium", reason: "low user value" });
  return out;
}

// -------- Recommendation ----------

export function recommend(i: Idea): Recommendation {
  if (isForbiddenSource(i.source)) return "reject";
  const k = computeKpis(i);
  if (k.overall_innovation_score >= 70 && i.founderRequested) return "immediate_opportunity";
  if (k.overall_innovation_score >= 60) return "prototype";
  if (k.overall_innovation_score >= 45) return "research_more";
  if (k.overall_innovation_score >= 30) return "build_later";
  if (k.overall_innovation_score >= 15) return "archive";
  return "reject";
}

export function priorityOf(i: Idea): "p0" | "p1" | "p2" | "p3" {
  const k = computeKpis(i);
  const boost = i.founderRequested ? 15 : 0;
  const s = k.overall_innovation_score + boost;
  if (s >= 80) return "p0";
  if (s >= 60) return "p1";
  if (s >= 40) return "p2";
  return "p3";
}

// -------- Council conflicts ----------

export function detectCouncilConflicts(
  votes: Partial<Record<Council, "support" | "block" | "neutral">>,
): Council[] {
  return (Object.entries(votes) as Array<[Council, string]>)
    .filter(([, v]) => v === "block")
    .map(([c]) => c);
}

// -------- Report ----------

export function composeInnovationReport(input: {
  ideas: Idea[];
  councilVotes?: Partial<Record<Council, "support" | "block" | "neutral">>;
}): InnovationReport {
  const ideas = input.ideas ?? [];
  const perKpis = ideas.map(computeKpis);
  const kpis: Kpis = {
    innovation_score: Math.round(avg(...perKpis.map((k) => k.innovation_score))),
    future_readiness: Math.round(avg(...perKpis.map((k) => k.future_readiness))),
    research_score: Math.round(avg(...perKpis.map((k) => k.research_score))),
    business_value: Math.round(avg(...perKpis.map((k) => k.business_value))),
    engineering_value: Math.round(avg(...perKpis.map((k) => k.engineering_value))),
    risk_score: Math.round(avg(...perKpis.map((k) => k.risk_score))),
    roi_score: Math.round(avg(...perKpis.map((k) => k.roi_score))),
    overall_innovation_score: Math.round(
      avg(...perKpis.map((k) => k.overall_innovation_score)),
    ),
  };
  const risks = ideas.flatMap(detectRisks);
  const priorityMatrix = ideas.map((i) => ({ id: i.id, priority: priorityOf(i) }));
  const top = [...ideas].sort(
    (a, b) => computeKpis(b).overall_innovation_score - computeKpis(a).overall_innovation_score,
  )[0];
  const rec: Recommendation = top ? recommend(top) : "archive";
  return {
    summary: `${ideas.length} ideas evaluated across ${INNOVATION_DOMAINS.length} domains; overall ${kpis.overall_innovation_score}.`,
    kpis,
    recommendation: rec,
    handoff: LOCKS.handoffTarget,
    risks,
    councilConflicts: detectCouncilConflicts(input.councilVotes ?? {}),
    priorityMatrix,
    locks: LOCKS,
  };
}

export function canAutoExecute(): false {
  return false;
}
