/**
 * R180 — AI Creative Director™
 *
 * PURE GOVERNANCE + CREATIVE LEADERSHIP LAYER. No new runtime,
 * no Creative/Image/Video/Audio/Avatar engine V2, no duplicate.
 * Reuses canonical owners only (R104 Analytics, R114 Happy ID,
 * R115 Brain, R116 Memory, R117 Conversation, R118 Workspace,
 * R119 Files, R120 Search, R126 Creator, R128 Revenue,
 * R130 Audit, R145 Founder Dashboard, R153/R156 Founder,
 * R158 Approval Gateway, R159 Intent, R160 Guardian,
 * R164 Impact, R168 Optimization, R169 Learning,
 * R170 Competitor, R171–R179 Executive Council, RBAC).
 *
 * The AI Creative Director plans, reviews, organizes and evaluates
 * creative work. It NEVER edits production assets automatically,
 * NEVER publishes media automatically, NEVER bypasses R158.
 * Founder decides.
 */

export const RESPONSIBILITIES = [
  "creative_strategy",
  "brand_identity",
  "visual_language",
  "design_reviews",
  "creative_quality",
  "campaign_concepts",
  "media_planning",
  "content_direction",
  "digital_human_appearance",
  "brand_consistency",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const CREATIVE_DOMAINS = [
  "image",
  "video",
  "voice",
  "audio",
  "animation",
  "logo",
  "brand_kit",
  "poster",
  "banner",
  "thumbnail",
  "presentation",
  "ui",
  "ux",
  "avatar",
  "digital_human",
  "3d",
] as const;
export type CreativeDomain = (typeof CREATIVE_DOMAINS)[number];

export const OUTPUT_TYPES = [
  "concept",
  "creative_brief",
  "moodboard",
  "style_guide",
  "storyboard",
  "design_review",
  "creative_report",
] as const;
export type OutputType = (typeof OUTPUT_TYPES)[number];

export const QUALITY_AXES = [
  "brand_consistency",
  "visual_quality",
  "accessibility",
  "readability",
  "professionalism",
  "performance_impact",
] as const;
export type QualityAxis = (typeof QUALITY_AXES)[number];

export const KPI_DIMENSIONS = [
  "brand_score",
  "creative_score",
  "design_score",
  "consistency_score",
  "innovation_score",
  "accessibility_score",
  "overall_creative_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const RECOMMENDATIONS = [
  "approve",
  "revise",
  "rework",
  "reject",
  "reference_only",
  "elevate_to_brand_kit",
] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "revise",
  "compare",
  "archive",
  "pin",
  "publish_via_r158",
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
  "R179_StrategyDirector",
] as const;
export type Council = (typeof EXECUTIVE_COUNCIL)[number];

// -------- Governance Locks ----------

export const LOCKS = {
  canEditProductionAssets: false,
  canPublishMedia: false,
  canOverwriteBrandKit: false,
  canBypassApprovalGateway: false,
  canAutoImplement: false,
  newRuntime: false,
  reuseOnly: true,
  handoffTarget: "R158_ApprovalGateway",
} as const;

// -------- Types ----------

export interface CreativeAsset {
  id: string;
  title: string;
  domain: CreativeDomain;
  output: OutputType;
  founderRequested?: boolean;
  scores: Partial<Record<QualityAxis, number>>; // 0-100
  brandRefs?: string[]; // referenced brand tokens
}

export interface Kpis {
  brand_score: number;
  creative_score: number;
  design_score: number;
  consistency_score: number;
  innovation_score: number;
  accessibility_score: number;
  overall_creative_score: number;
}

export interface RiskFinding {
  kind:
    | "brand_drift"
    | "accessibility_risk"
    | "readability_risk"
    | "performance_risk"
    | "professionalism_risk"
    | "ip_risk";
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
}

export interface CreativeReport {
  summary: string;
  kpis: Kpis;
  recommendation: Recommendation;
  handoff: typeof LOCKS.handoffTarget;
  risks: RiskFinding[];
  councilConflicts: Council[];
  reviewMatrix: Array<{ id: string; recommendation: Recommendation }>;
  locks: typeof LOCKS;
}

// -------- Helpers ----------

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const avg = (...xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

// -------- KPIs ----------

export function computeKpis(assets: CreativeAsset[]): Kpis {
  const pick = (a: QualityAxis) =>
    Math.round(
      avg(
        ...assets
          .map((x) => x.scores[a])
          .filter((v): v is number => typeof v === "number"),
      ),
    );
  const brand = pick("brand_consistency");
  const visual = pick("visual_quality");
  const access = pick("accessibility");
  const read = pick("readability");
  const pro = pick("professionalism");
  const perf = pick("performance_impact");
  const consistency = brand;
  const design = Math.round(avg(visual, read, pro));
  const creative = Math.round(avg(visual, pro));
  const innovation = Math.round(avg(visual, creative));
  const overall = Math.round(
    clamp(
      brand * 0.25 +
        design * 0.25 +
        creative * 0.15 +
        innovation * 0.1 +
        access * 0.15 +
        (100 - Math.max(0, 100 - perf)) * 0.1,
    ),
  );
  return {
    brand_score: brand,
    creative_score: creative,
    design_score: design,
    consistency_score: consistency,
    innovation_score: innovation,
    accessibility_score: access,
    overall_creative_score: overall,
  };
}

// -------- Risks ----------

export function detectRisks(asset: CreativeAsset): RiskFinding[] {
  const out: RiskFinding[] = [];
  const s = asset.scores;
  const push = (
    kind: RiskFinding["kind"],
    score: number | undefined,
    label: string,
    criticalUnder = -1,
  ) => {
    if (typeof score !== "number") return;
    if (score <= criticalUnder)
      out.push({ kind, severity: "critical", reason: `${label} ${score}` });
    else if (score <= 30)
      out.push({ kind, severity: "high", reason: `${label} ${score}` });
    else if (score <= 50)
      out.push({ kind, severity: "medium", reason: `${label} ${score}` });
  };
  push("brand_drift", s.brand_consistency, "brand consistency", 20);
  push("accessibility_risk", s.accessibility, "accessibility", 20);
  push("readability_risk", s.readability, "readability");
  push("performance_risk", s.performance_impact, "performance");
  push("professionalism_risk", s.professionalism, "professionalism");
  if (!asset.brandRefs || asset.brandRefs.length === 0) {
    out.push({
      kind: "brand_drift",
      severity: "medium",
      reason: "no brand tokens referenced",
    });
  }
  return out;
}

// -------- Recommendation ----------

export function reviewAsset(asset: CreativeAsset): Recommendation {
  const k = computeKpis([asset]);
  const risks = detectRisks(asset);
  if (risks.some((r) => r.severity === "critical")) return "reject";
  if (k.overall_creative_score >= 85 && asset.founderRequested) return "elevate_to_brand_kit";
  if (k.overall_creative_score >= 75) return "approve";
  if (k.overall_creative_score >= 60) return "revise";
  if (k.overall_creative_score >= 40) return "rework";
  if (k.overall_creative_score >= 25) return "reference_only";
  return "reject";
}

// -------- Council conflicts ----------

export function detectCouncilConflicts(
  votes: Partial<Record<Council, "support" | "block" | "neutral">>,
): Council[] {
  return (Object.entries(votes) as Array<[Council, string]>)
    .filter(([, v]) => v === "block")
    .map(([c]) => c);
}

// -------- Creative Report ----------

export function composeCreativeReport(input: {
  assets: CreativeAsset[];
  councilVotes?: Partial<Record<Council, "support" | "block" | "neutral">>;
}): CreativeReport {
  const assets = input.assets ?? [];
  const kpis = computeKpis(assets);
  const risks = assets.flatMap(detectRisks);
  const matrix = assets.map((a) => ({ id: a.id, recommendation: reviewAsset(a) }));
  const rec: Recommendation = assets.length
    ? matrix.some((m) => m.recommendation === "reject")
      ? "reject"
      : kpis.overall_creative_score >= 75
        ? "approve"
        : kpis.overall_creative_score >= 60
          ? "revise"
          : "rework"
    : "reference_only";
  return {
    summary: `${assets.length} assets reviewed across ${CREATIVE_DOMAINS.length} domains; overall ${kpis.overall_creative_score}, brand ${kpis.brand_score}.`,
    kpis,
    recommendation: rec,
    handoff: LOCKS.handoffTarget,
    risks,
    councilConflicts: detectCouncilConflicts(input.councilVotes ?? {}),
    reviewMatrix: matrix,
    locks: LOCKS,
  };
}

export function canAutoExecute(): false {
  return false;
}
