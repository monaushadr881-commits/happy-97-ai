/**
 * R177 — AI Release Director™
 *
 * PURE GOVERNANCE + RELEASE LEADERSHIP LAYER. No new runtime,
 * no Release/Deployment/Version/Rollout engine V2, no duplicate.
 * Reuses canonical owners only (R64 Release Engineering, R158 Approval
 * Gateway, R159 Intent, R160 Guardian, R161 Architect, R162 Code Review,
 * R163 QA, R164 Impact, R165 Preview, R166 Rollback, R167 Docs,
 * R168 Optimization, R169 Learning, R170 Competitor, R171–R176 Council,
 * R130 Audit, R145 Founder Dashboard, R153/R156 Founder Identity, RBAC).
 *
 * The AI Release Director plans, coordinates, validates, monitors and
 * recommends releases. It NEVER deploys, NEVER edits production, NEVER
 * bypasses R158. Founder decides.
 */

export const RESPONSIBILITIES = [
  "release_planning",
  "release_calendar",
  "version_management",
  "release_readiness",
  "deployment_coordination",
  "rollback_coordination",
  "post_release_monitoring",
  "incident_coordination",
  "change_communication",
  "release_documentation",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const RELEASE_TYPES = [
  "website",
  "android",
  "ios",
  "backend",
  "api",
  "database",
  "creator",
  "business_os",
  "founder_dashboard",
] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

export const VERSION_KINDS = [
  "major",
  "minor",
  "patch",
  "hotfix",
  "emergency",
  "maintenance",
] as const;
export type VersionKind = (typeof VERSION_KINDS)[number];

export const ROLLOUT_STRATEGIES = [
  "manual",
  "staged",
  "canary",
  "pilot",
  "regional",
  "internal_testing",
  "founder_preview",
] as const;
export type RolloutStrategy = (typeof ROLLOUT_STRATEGIES)[number];

export const CHECKLIST_ITEMS = [
  "architecture_approved",
  "security_approved",
  "qa_passed",
  "impact_reviewed",
  "preview_approved",
  "rollback_ready",
  "documentation_complete",
  "optimization_reviewed",
  "guardian_ai_clear",
  "founder_approval_ready",
] as const;
export type ChecklistItem = (typeof CHECKLIST_ITEMS)[number];

export const KPI_DIMENSIONS = [
  "release_health",
  "deployment_readiness",
  "rollback_readiness",
  "incident_risk",
  "quality_score",
  "stability_score",
  "release_confidence",
  "overall_release_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const INCIDENT_RISK_KINDS = [
  "release_failure",
  "deployment_risk",
  "rollback_risk",
  "configuration_risk",
  "dependency_risk",
  "compatibility_risk",
] as const;
export type IncidentRiskKind = (typeof INCIDENT_RISK_KINDS)[number];

export const POST_RELEASE_SIGNALS = [
  "health",
  "performance",
  "errors",
  "stability",
  "adoption",
  "rollback_requests",
] as const;
export type PostReleaseSignal = (typeof POST_RELEASE_SIGNALS)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "release_status",
  "readiness",
  "top_risks",
  "rollback_plan",
  "timeline",
  "recommendations",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "delay",
  "reschedule",
  "archive",
  "compare",
  "rollback",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const CANONICAL_OWNERS = [
  "R64_ReleaseEngineering",
  "R104_Analytics",
  "R114_HappyId",
  "R115_Brain",
  "R116_Memory",
  "R117_Conversation",
  "R118_Workspace",
  "R119_Files",
  "R120_Search",
  "R126_Creator",
  "R128_Revenue",
  "R130_Audit",
  "R145_FounderDashboard",
  "R153_FounderPrivileges",
  "R156_FounderIdentity",
  "R157_SecurityCenter",
  "R158_ApprovalGateway",
  "R159_IntentEngine",
  "R160_GuardianAI",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QA",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_Rollback",
  "R167_Documentation",
  "R168_Optimization",
  "R169_LearningMemory",
  "R170_CompetitorIntelligence",
  "R171_AI_CTO",
  "R172_AI_COO",
  "R173_AI_CFO",
  "R174_AI_CPO",
  "R175_AI_CGO",
  "R176_AI_ResearchDirector",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const EXECUTIVE_COUNCIL = [
  "R171_AI_CTO",
  "R172_AI_COO",
  "R173_AI_CFO",
  "R174_AI_CPO",
  "R175_AI_CGO",
  "R176_AI_ResearchDirector",
] as const;
export type CouncilMember = (typeof EXECUTIVE_COUNCIL)[number];

export const HANDOFF_CHAIN = [
  "R159_IntentEngine",
  "R161_SoftwareArchitect",
  "R164_ImpactAnalyzer",
  "R160_GuardianAI",
  "R165_PreviewStudio",
  "R166_Rollback",
  "R158_ApprovalGateway",
] as const;

export const PIPELINE_STAGES = [
  "plan",
  "readiness_check",
  "checklist_verify",
  "risk_scan",
  "council_review",
  "recommend",
  "handoff",
  "founder_decision",
  "post_release_monitor",
  "audit",
] as const;

export const R177_POLICY = Object.freeze({
  module: "R177_AI_ReleaseDirector",
  canDeploy: false,
  canEditProduction: false,
  canEditReleaseConfig: false,
  canBypassApprovalGateway: false,
  canAutoImplement: false,
  newRuntime: false,
  reuseOnly: true,
  handoffTarget: "R158_ApprovalGateway",
  handoffChain: HANDOFF_CHAIN,
} as const);

// ---------- Types ----------

export type ChecklistState = Partial<Record<ChecklistItem, boolean>>;

export interface ReleaseCandidate {
  id: string;
  name: string;
  type: ReleaseType;
  version: string;
  versionKind: VersionKind;
  rollout: RolloutStrategy;
  founderRequested?: boolean;
  scheduledAt?: string; // ISO
  checklist: ChecklistState;
  scores: {
    quality: number;       // 0..100 (QA)
    stability: number;     // 0..100
    performance: number;   // 0..100
    security: number;      // 0..100
    docCompleteness: number; // 0..100
    rollbackReadiness: number; // 0..100
    dependencyHealth: number;  // 0..100
    compatibility: number;     // 0..100
  };
  incidents30d?: number;
  adoption?: { region: string; pct: number }[];
}

export interface PostReleaseMetrics {
  health: number;
  performance: number;
  errors: number;   // count
  stability: number;
  adoption: number; // 0..100
  rollbackRequests: number;
}

// ---------- Checklist ----------

export function checklistMissing(state: ChecklistState): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((k) => state[k] !== true);
}

export function checklistComplete(state: ChecklistState): boolean {
  return checklistMissing(state).length === 0;
}

// ---------- Version ----------

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
export function isValidSemver(v: string): boolean {
  return SEMVER.test(v);
}

// ---------- Readiness / scoring ----------

export function scoreReadiness(c: ReleaseCandidate): number {
  const s = c.scores;
  const base =
    s.quality * 0.18 +
    s.stability * 0.16 +
    s.performance * 0.10 +
    s.security * 0.18 +
    s.docCompleteness * 0.08 +
    s.rollbackReadiness * 0.14 +
    s.dependencyHealth * 0.08 +
    s.compatibility * 0.08;
  const checklistPct = ((CHECKLIST_ITEMS.length - checklistMissing(c.checklist).length) / CHECKLIST_ITEMS.length) * 100;
  const combined = base * 0.75 + checklistPct * 0.25;
  return Math.round(Math.max(0, Math.min(100, combined)));
}

export function releaseConfidence(c: ReleaseCandidate): number {
  const readiness = scoreReadiness(c);
  const incidentPenalty = Math.min(20, (c.incidents30d ?? 0) * 4);
  const emergencyPenalty = c.versionKind === "emergency" ? 10 : c.versionKind === "hotfix" ? 5 : 0;
  return Math.round(Math.max(0, Math.min(100, readiness - incidentPenalty - emergencyPenalty)));
}

// ---------- Priority ----------

export function scorePriority(c: ReleaseCandidate): Priority {
  const conf = releaseConfidence(c);
  const founderBoost = c.founderRequested ? 10 : 0;
  const urgency = c.versionKind === "emergency" ? 25 : c.versionKind === "hotfix" ? 15 : 0;
  const total = conf * 0.5 + urgency + founderBoost;
  if (total >= 75) return "p0";
  if (total >= 55) return "p1";
  if (total >= 35) return "p2";
  return "p3";
}

// ---------- Risks ----------

export interface IncidentRisk {
  kind: IncidentRiskKind;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}

export function detectRisks(c: ReleaseCandidate): IncidentRisk[] {
  const risks: IncidentRisk[] = [];
  if (c.scores.rollbackReadiness < 60) {
    risks.push({ kind: "rollback_risk", severity: c.scores.rollbackReadiness < 30 ? "critical" : "high", message: "Rollback readiness below safe threshold." });
  }
  if (c.scores.dependencyHealth < 60) {
    risks.push({ kind: "dependency_risk", severity: "high", message: "Dependency health below safe threshold." });
  }
  if (c.scores.compatibility < 60) {
    risks.push({ kind: "compatibility_risk", severity: "medium", message: "Compatibility concerns detected." });
  }
  if (c.scores.quality < 70) {
    risks.push({ kind: "release_failure", severity: c.scores.quality < 50 ? "critical" : "high", message: "QA quality score below release bar." });
  }
  if (!c.checklist.rollback_ready) {
    risks.push({ kind: "deployment_risk", severity: "high", message: "Rollback checklist not confirmed." });
  }
  if (!c.checklist.security_approved || !c.checklist.guardian_ai_clear) {
    risks.push({ kind: "configuration_risk", severity: "high", message: "Security / Guardian AI approval missing." });
  }
  return risks;
}

// ---------- KPIs ----------

export function computeKpis(c: ReleaseCandidate): Record<KpiDimension, number> {
  const readiness = scoreReadiness(c);
  const confidence = releaseConfidence(c);
  return {
    release_health: Math.round((c.scores.stability + c.scores.performance) / 2),
    deployment_readiness: readiness,
    rollback_readiness: c.scores.rollbackReadiness,
    incident_risk: Math.max(0, 100 - confidence),
    quality_score: c.scores.quality,
    stability_score: c.scores.stability,
    release_confidence: confidence,
    overall_release_score: Math.round(readiness * 0.6 + confidence * 0.4),
  };
}

// ---------- Recommendation ----------

export type RecommendationKind =
  | "release_now"
  | "release_staged"
  | "release_canary"
  | "founder_preview_first"
  | "delay"
  | "block";

export interface Recommendation {
  candidateId: string;
  kind: RecommendationKind;
  priority: Priority;
  rationale: string;
  handoffTarget: "R158_ApprovalGateway";
}

export function recommend(c: ReleaseCandidate): Recommendation {
  const conf = releaseConfidence(c);
  const risks = detectRisks(c);
  const critical = risks.some((r) => r.severity === "critical");
  const priority = scorePriority(c);
  let kind: RecommendationKind;
  let rationale: string;
  if (critical || conf < 45) {
    kind = "block";
    rationale = "Critical risks or confidence below block threshold.";
  } else if (conf < 65) {
    kind = "delay";
    rationale = "Confidence below release bar; delay pending remediation.";
  } else if (c.versionKind === "emergency" || c.versionKind === "hotfix") {
    kind = "release_canary";
    rationale = "Urgent fix; canary rollout to limit blast radius.";
  } else if (c.rollout === "founder_preview" || c.founderRequested) {
    kind = "founder_preview_first";
    rationale = "Founder preview first, then staged rollout.";
  } else if (conf >= 85 && risks.length === 0) {
    kind = "release_now";
    rationale = "High confidence, no risks detected.";
  } else {
    kind = "release_staged";
    rationale = "Confidence acceptable; staged rollout recommended.";
  }
  return { candidateId: c.id, kind, priority, rationale, handoffTarget: "R158_ApprovalGateway" };
}

// ---------- Post release ----------

export function evaluatePostRelease(m: PostReleaseMetrics): {
  score: number;
  rollbackRecommended: boolean;
  signals: Record<PostReleaseSignal, number>;
} {
  const errorsPenalty = Math.min(40, m.errors * 2);
  const rollbackPenalty = Math.min(30, m.rollbackRequests * 5);
  const raw = (m.health + m.performance + m.stability + m.adoption) / 4 - errorsPenalty - rollbackPenalty;
  const score = Math.round(Math.max(0, Math.min(100, raw)));
  return {
    score,
    rollbackRecommended: score < 55 || m.rollbackRequests >= 5 || m.stability < 50,
    signals: {
      health: m.health,
      performance: m.performance,
      errors: m.errors,
      stability: m.stability,
      adoption: m.adoption,
      rollback_requests: m.rollbackRequests,
    },
  };
}

// ---------- Executive Council conflicts ----------

export interface CouncilInputs {
  cto?: { blockingRisk?: boolean; note?: string };
  coo?: { blockingRisk?: boolean; note?: string };
  cfo?: { blockingRisk?: boolean; note?: string };
  cpo?: { blockingRisk?: boolean; note?: string };
  cgo?: { blockingRisk?: boolean; note?: string };
  research?: { blockingRisk?: boolean; note?: string };
}

export function councilConflicts(inputs: CouncilInputs): { member: CouncilMember; note: string }[] {
  const out: { member: CouncilMember; note: string }[] = [];
  const map: Array<[CouncilMember, { blockingRisk?: boolean; note?: string } | undefined]> = [
    ["R171_AI_CTO", inputs.cto],
    ["R172_AI_COO", inputs.coo],
    ["R173_AI_CFO", inputs.cfo],
    ["R174_AI_CPO", inputs.cpo],
    ["R175_AI_CGO", inputs.cgo],
    ["R176_AI_ResearchDirector", inputs.research],
  ];
  for (const [m, v] of map) if (v?.blockingRisk) out.push({ member: m, note: v.note ?? "blocking risk" });
  return out;
}

// ---------- Report ----------

export interface ReleaseReport {
  module: "R177_AI_ReleaseDirector";
  generatedAt: string;
  candidates: number;
  kpis: Record<KpiDimension, number>;
  recommendations: Recommendation[];
  risks: { candidateId: string; risks: IncidentRisk[] }[];
  checklistGaps: { candidateId: string; missing: ChecklistItem[] }[];
  councilConflicts: { member: CouncilMember; note: string }[];
  sections: readonly ReportSection[];
  handoffTarget: "R158_ApprovalGateway";
  policy: typeof R177_POLICY;
}

function averageKpis(list: Record<KpiDimension, number>[]): Record<KpiDimension, number> {
  const acc = Object.fromEntries(KPI_DIMENSIONS.map((k) => [k, 0])) as Record<KpiDimension, number>;
  if (list.length === 0) return acc;
  for (const k of KPI_DIMENSIONS) {
    acc[k] = Math.round(list.reduce((s, x) => s + x[k], 0) / list.length);
  }
  return acc;
}

export function composeReleaseReport(candidates: ReleaseCandidate[], council: CouncilInputs = {}): ReleaseReport {
  const kpiList = candidates.map(computeKpis);
  const recs = candidates.map(recommend);
  const risks = candidates.map((c) => ({ candidateId: c.id, risks: detectRisks(c) }));
  const gaps = candidates.map((c) => ({ candidateId: c.id, missing: checklistMissing(c.checklist) }));
  return {
    module: "R177_AI_ReleaseDirector",
    generatedAt: new Date(0).toISOString(),
    candidates: candidates.length,
    kpis: averageKpis(kpiList),
    recommendations: recs,
    risks,
    checklistGaps: gaps,
    councilConflicts: councilConflicts(council),
    sections: REPORT_SECTIONS,
    handoffTarget: "R158_ApprovalGateway",
    policy: R177_POLICY,
  };
}
