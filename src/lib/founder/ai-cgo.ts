/**
 * R175 — AI CGO™ (Chief Growth Officer)
 *
 * PURE GOVERNANCE + GROWTH LEADERSHIP LAYER. No new runtime,
 * no CGO V2, no Growth/Marketing/SEO/Campaign engine V2, no duplicate.
 * Reuses canonical owners only.
 *
 * The AI CGO analyzes growth signals (traffic, funnels, conversions,
 * retention, communities, SEO, ASO) across channels (Web, Android, iOS,
 * PWA, YouTube, Instagram, Facebook, LinkedIn, WhatsApp, Telegram, Email,
 * Push), scores growth health, prioritizes opportunities, and drafts
 * executive reports. It NEVER launches campaigns, NEVER edits pricing,
 * subscriptions, or credit policy, NEVER bypasses R158. Every
 * recommendation routes through R159→…→R158. Founder decides.
 */

export const RESPONSIBILITIES = [
  "growth_strategy",
  "user_acquisition",
  "activation",
  "retention",
  "referral_strategy",
  "marketing_intelligence",
  "seo",
  "aso",
  "brand_growth",
  "community_growth",
  "creator_growth",
  "business_growth",
  "enterprise_growth",
  "global_expansion",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const GROWTH_CHANNELS = [
  "website",
  "android",
  "ios",
  "pwa",
  "youtube",
  "instagram",
  "facebook",
  "linkedin",
  "whatsapp",
  "telegram",
  "email",
  "push",
] as const;
export type GrowthChannel = (typeof GROWTH_CHANNELS)[number];

export const ANALYSIS_SIGNALS = [
  "website_growth",
  "android_growth",
  "ios_growth",
  "traffic",
  "funnels",
  "conversions",
  "retention",
  "sessions",
  "engagement",
  "communities",
  "organic_reach",
  "paid_reach",
] as const;
export type AnalysisSignal = (typeof ANALYSIS_SIGNALS)[number];

export const SEO_AREAS = [
  "metadata",
  "indexing",
  "performance",
  "keywords",
  "content",
  "internal_links",
  "technical_seo",
] as const;
export type SeoArea = (typeof SEO_AREAS)[number];

export const ASO_AREAS = [
  "store_listing",
  "screenshots",
  "description",
  "keywords",
  "ratings",
  "reviews",
  "visibility",
] as const;
export type AsoArea = (typeof ASO_AREAS)[number];

export const KPI_DIMENSIONS = [
  "traffic_score",
  "conversion_score",
  "retention_score",
  "acquisition_score",
  "engagement_score",
  "growth_score",
  "brand_score",
  "community_score",
  "overall_growth_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const FUNNEL_STAGES = [
  "visitor",
  "signup",
  "activation",
  "subscription",
  "retention",
  "referral",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "growth_health",
  "top_opportunities",
  "top_risks",
  "growth_forecast",
  "estimated_roi",
  "priority_actions",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "schedule",
  "archive",
  "compare",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const AI_DECISION_KINDS = [
  "growth_opportunity",
  "marketing_improvement",
  "seo_improvement",
  "aso_improvement",
  "referral_improvement",
  "community_improvement",
  "campaign_idea",
  "brand_improvement",
  "retention_action",
  "acquisition_action",
] as const;
export type AIDecisionKind = (typeof AI_DECISION_KINDS)[number];

export const EXECUTIVE_COUNCIL = [
  "R171_AICTO",
  "R172_AICOO",
  "R173_AICFO",
  "R174_AICPO",
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
  "R130_Audit",
  "R156_RBAC",
  "R153_HappyID",
  "CRM_Intelligence",
  "Marketing_Intelligence",
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
  "analyzeChannels",
  "analyzeFunnel",
  "analyzeSeo",
  "analyzeAso",
  "computeKpis",
  "detectRisks",
  "forecastGrowth",
  "composeReport",
  "councilReview",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface ChannelSignals {
  channel: GrowthChannel;
  traffic: number;          // absolute count
  sessions: number;
  conversions: number;      // 0..traffic
  engagementPct: number;    // 0..100
  organicReachPct: number;  // 0..100
  paidReachPct: number;     // 0..100
}

export interface FunnelSignals {
  visitor: number;
  signup: number;
  activation: number;
  subscription: number;
  retention: number;
  referral: number;
}

export interface SeoSignals {
  metadata: number;
  indexing: number;
  performance: number;
  keywords: number;
  content: number;
  internal_links: number;
  technical_seo: number;
}

export interface AsoSignals {
  store_listing: number;
  screenshots: number;
  description: number;
  keywords: number;
  ratings: number;
  reviews: number;
  visibility: number;
}

export interface OpportunitySignal {
  id: string;
  title: string;
  kind: AIDecisionKind;
  channel: GrowthChannel;
  founderRequested: boolean;
  expectedLiftPct: number;   // 0..100
  reachPct: number;          // 0..100
  effort: number;            // 0..100
}

export interface GrowthHealthReport {
  channels: ChannelSignals[];
  totalTraffic: number;
  totalConversions: number;
  averageConversionPct: number;
  averageEngagementPct: number;
  organicVsPaidRatio: number; // organic / (organic + paid)
}

export type KpiReport = Record<KpiDimension, number>;

export type FunnelDropoff = Record<
  Exclude<FunnelStage, "visitor">,
  { fromStage: FunnelStage; toStage: FunnelStage; conversionPct: number; dropPct: number }
>;

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export interface Risk {
  kind:
    | "growth_slowdown"
    | "high_churn"
    | "poor_conversion"
    | "low_engagement"
    | "seo_issue"
    | "aso_issue"
    | "brand_risk";
  severity: RiskSeverity;
  detail: string;
}

export interface Recommendation {
  kind: AIDecisionKind;
  title: string;
  channel: GrowthChannel;
  rationale: string;
  priority: Priority;
  expectedRoi: number;    // 0..100
  reachPct: number;       // 0..100
  effort: number;         // 0..100
  handoff: readonly HandoffStep[];
}

export interface GrowthForecast {
  horizon: "30d" | "90d" | "12m";
  projectedTraffic: number;
  projectedConversions: number;
  projectedGrowthPct: number;
}

export interface CouncilConflict {
  peer: ExecutivePeer;
  topic: string;
  cgoPosition: string;
  peerPosition: string;
}

export interface CgoReport {
  executiveSummary: string;
  growthHealth: GrowthHealthReport;
  funnel: FunnelSignals;
  funnelDropoff: FunnelDropoff;
  seo: SeoSignals;
  aso: AsoSignals;
  kpis: KpiReport;
  topOpportunities: Recommendation[];
  topRisks: Risk[];
  forecast: GrowthForecast[];
  estimatedRoi: number;
  priorityActions: string[];
  councilConflicts: CouncilConflict[];
  canLaunchCampaigns: false;
  canEditPricing: false;
  canEditSubscriptions: false;
  canEditCreditPolicy: false;
  canAutoImplement: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const safePct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

export function analyzeGrowthHealth(channels: ChannelSignals[]): GrowthHealthReport {
  const totalTraffic = channels.reduce((a, c) => a + c.traffic, 0);
  const totalConversions = channels.reduce((a, c) => a + c.conversions, 0);
  const organic = avg(channels.map((c) => c.organicReachPct));
  const paid = avg(channels.map((c) => c.paidReachPct));
  return {
    channels,
    totalTraffic,
    totalConversions,
    averageConversionPct: Math.round(safePct(totalConversions, totalTraffic)),
    averageEngagementPct: Math.round(avg(channels.map((c) => c.engagementPct))),
    organicVsPaidRatio: organic + paid > 0 ? +(organic / (organic + paid)).toFixed(2) : 0,
  };
}

export function analyzeFunnel(f: FunnelSignals): FunnelDropoff {
  const step = (from: FunnelStage, to: FunnelStage, a: number, b: number) => {
    const conv = safePct(b, a);
    return { fromStage: from, toStage: to, conversionPct: Math.round(conv), dropPct: Math.round(100 - conv) };
  };
  return {
    signup: step("visitor", "signup", f.visitor, f.signup),
    activation: step("signup", "activation", f.signup, f.activation),
    subscription: step("activation", "subscription", f.activation, f.subscription),
    retention: step("subscription", "retention", f.subscription, f.retention),
    referral: step("retention", "referral", f.retention, f.referral),
  };
}

export function scorePriority(roi: number, effort: number): Priority {
  const score = clamp(roi) - clamp(effort) * 0.5;
  if (score >= 60) return "p0";
  if (score >= 30) return "p1";
  if (score >= 10) return "p2";
  return "p3";
}

export function prioritizeOpportunities(ops: OpportunitySignal[]): Recommendation[] {
  return ops
    .map((o) => {
      const founderBoost = o.founderRequested ? 15 : 0;
      const roi = clamp(o.expectedLiftPct * 0.6 + o.reachPct * 0.4 + founderBoost);
      return {
        kind: o.kind,
        title: o.title,
        channel: o.channel,
        rationale: `lift=${o.expectedLiftPct}%, reach=${o.reachPct}%, effort=${o.effort}${
          o.founderRequested ? ", founder-requested" : ""
        }`,
        priority: scorePriority(roi, o.effort),
        expectedRoi: roi,
        reachPct: clamp(o.reachPct),
        effort: clamp(o.effort),
        handoff: HANDOFF_CHAIN,
      } satisfies Recommendation;
    })
    .sort((a, b) => PRIORITY_LEVELS.indexOf(a.priority) - PRIORITY_LEVELS.indexOf(b.priority));
}

export function computeKpis(
  health: GrowthHealthReport,
  funnel: FunnelSignals,
  seo: SeoSignals,
  aso: AsoSignals,
  communityHealthPct: number,
  brandHealthPct: number,
): KpiReport {
  const traffic_score = clamp(Math.log10(Math.max(1, health.totalTraffic)) * 15);
  const conversion_score = clamp(health.averageConversionPct * 5);
  const retention_score = clamp(safePct(funnel.retention, Math.max(1, funnel.subscription)));
  const acquisition_score = clamp(safePct(funnel.signup, Math.max(1, funnel.visitor)) * 4);
  const engagement_score = clamp(health.averageEngagementPct);
  const seoAvg = clamp(avg(Object.values(seo) as number[]));
  const asoAvg = clamp(avg(Object.values(aso) as number[]));
  const brand_score = clamp((brandHealthPct + seoAvg + asoAvg) / 3);
  const community_score = clamp(communityHealthPct);
  const growth_score = clamp(
    (traffic_score + conversion_score + acquisition_score + retention_score + engagement_score) / 5,
  );
  const overall_growth_score = clamp(
    (growth_score + brand_score + community_score + seoAvg + asoAvg) / 5,
  );
  return {
    traffic_score,
    conversion_score,
    retention_score,
    acquisition_score,
    engagement_score,
    growth_score,
    brand_score,
    community_score,
    overall_growth_score,
  };
}

export function detectRisks(
  health: GrowthHealthReport,
  funnel: FunnelSignals,
  seo: SeoSignals,
  aso: AsoSignals,
  churnPct: number,
  brandHealthPct: number,
): Risk[] {
  const risks: Risk[] = [];
  if (health.averageConversionPct < 2) {
    risks.push({
      kind: "poor_conversion",
      severity: health.averageConversionPct < 1 ? "high" : "medium",
      detail: `Average conversion at ${health.averageConversionPct}%`,
    });
  }
  if (health.averageEngagementPct < 30) {
    risks.push({
      kind: "low_engagement",
      severity: health.averageEngagementPct < 15 ? "high" : "medium",
      detail: `Engagement at ${health.averageEngagementPct}%`,
    });
  }
  const retentionPct = safePct(funnel.retention, Math.max(1, funnel.subscription));
  if (retentionPct < 60 || churnPct > 20) {
    risks.push({
      kind: "high_churn",
      severity: churnPct > 40 ? "critical" : churnPct > 25 ? "high" : "medium",
      detail: `Retention ${Math.round(retentionPct)}%, churn ${churnPct}%`,
    });
  }
  if (funnel.visitor > 0 && safePct(funnel.signup, funnel.visitor) < 5) {
    risks.push({
      kind: "growth_slowdown",
      severity: "medium",
      detail: `Visitor→signup conversion ${Math.round(safePct(funnel.signup, funnel.visitor))}%`,
    });
  }
  const seoAvg = avg(Object.values(seo) as number[]);
  if (seoAvg < 60) {
    risks.push({
      kind: "seo_issue",
      severity: seoAvg < 40 ? "high" : "medium",
      detail: `SEO average ${Math.round(seoAvg)}`,
    });
  }
  const asoAvg = avg(Object.values(aso) as number[]);
  if (asoAvg < 60) {
    risks.push({
      kind: "aso_issue",
      severity: asoAvg < 40 ? "high" : "medium",
      detail: `ASO average ${Math.round(asoAvg)}`,
    });
  }
  if (brandHealthPct < 60) {
    risks.push({
      kind: "brand_risk",
      severity: brandHealthPct < 40 ? "high" : "medium",
      detail: `Brand health at ${brandHealthPct}%`,
    });
  }
  return risks;
}

export function forecastGrowth(
  health: GrowthHealthReport,
  monthlyGrowthPct: number,
): GrowthForecast[] {
  const rate = monthlyGrowthPct / 100;
  const projectFor = (months: number, horizon: GrowthForecast["horizon"]) => {
    const factor = Math.pow(1 + rate, months);
    return {
      horizon,
      projectedTraffic: Math.round(health.totalTraffic * factor),
      projectedConversions: Math.round(health.totalConversions * factor),
      projectedGrowthPct: Math.round((factor - 1) * 100),
    };
  };
  return [projectFor(1, "30d"), projectFor(3, "90d"), projectFor(12, "12m")];
}

export function composeCgoReport(input: {
  growthHealth: GrowthHealthReport;
  funnel: FunnelSignals;
  funnelDropoff: FunnelDropoff;
  seo: SeoSignals;
  aso: AsoSignals;
  kpis: KpiReport;
  opportunities: Recommendation[];
  risks: Risk[];
  forecast: GrowthForecast[];
  priorityActions: string[];
  councilConflicts: CouncilConflict[];
  summary: string;
}): CgoReport {
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const topRisks = [...input.risks].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  const estimatedRoi = input.opportunities.length
    ? Math.round(avg(input.opportunities.map((o) => o.expectedRoi)))
    : 0;
  return {
    executiveSummary: input.summary,
    growthHealth: input.growthHealth,
    funnel: input.funnel,
    funnelDropoff: input.funnelDropoff,
    seo: input.seo,
    aso: input.aso,
    kpis: input.kpis,
    topOpportunities: input.opportunities,
    topRisks,
    forecast: input.forecast,
    estimatedRoi,
    priorityActions: input.priorityActions,
    councilConflicts: input.councilConflicts,
    canLaunchCampaigns: false,
    canEditPricing: false,
    canEditSubscriptions: false,
    canEditCreditPolicy: false,
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R175_POLICY = {
  id: "R175",
  name: "AI CGO",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  canLaunchCampaigns: false,
  canEditPricing: false,
  canEditSubscriptions: false,
  canEditCreditPolicy: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  executiveCouncil: EXECUTIVE_COUNCIL,
  responsibilities: RESPONSIBILITIES,
  channels: GROWTH_CHANNELS,
  analysisSignals: ANALYSIS_SIGNALS,
  seoAreas: SEO_AREAS,
  asoAreas: ASO_AREAS,
  kpiDimensions: KPI_DIMENSIONS,
  funnelStages: FUNNEL_STAGES,
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
