import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, GROWTH_CHANNELS, ANALYSIS_SIGNALS, SEO_AREAS, ASO_AREAS,
  KPI_DIMENSIONS, FUNNEL_STAGES, REPORT_SECTIONS, FOUNDER_CONTROLS,
  PRIORITY_LEVELS, AI_DECISION_KINDS, CANONICAL_OWNERS, EXECUTIVE_COUNCIL,
  HANDOFF_CHAIN, PIPELINE_STAGES, R175_POLICY,
  analyzeGrowthHealth, analyzeFunnel, prioritizeOpportunities, computeKpis,
  detectRisks, forecastGrowth, scorePriority, composeCgoReport,
} from "@/lib/founder/ai-cgo";

const channels = GROWTH_CHANNELS.map((c, i) => ({
  channel: c,
  traffic: 1000 + i * 250,
  sessions: 800 + i * 200,
  conversions: 20 + i * 3,
  engagementPct: 55 + (i % 6),
  organicReachPct: 60 - i,
  paidReachPct: 40 + i,
}));

const funnel = {
  visitor: 100000, signup: 12000, activation: 8000,
  subscription: 3000, retention: 2200, referral: 400,
};

const seo = {
  metadata: 82, indexing: 88, performance: 74, keywords: 78,
  content: 80, internal_links: 70, technical_seo: 84,
};

const aso = {
  store_listing: 78, screenshots: 82, description: 74, keywords: 76,
  ratings: 88, reviews: 80, visibility: 72,
};

const opportunities = [
  { id: "o1", title: "Founder-led referral flywheel", kind: "referral_improvement" as const, channel: "website" as const, founderRequested: true, expectedLiftPct: 85, reachPct: 70, effort: 30 },
  { id: "o2", title: "ASO screenshot refresh", kind: "aso_improvement" as const, channel: "android" as const, founderRequested: false, expectedLiftPct: 45, reachPct: 55, effort: 25 },
  { id: "o3", title: "Legacy Telegram campaign", kind: "campaign_idea" as const, channel: "telegram" as const, founderRequested: false, expectedLiftPct: 8, reachPct: 6, effort: 80 },
];

describe("R175 — AI CGO™", () => {
  it("enumerates governance taxonomy", () => {
    expect(RESPONSIBILITIES.length).toBe(14);
    expect(GROWTH_CHANNELS.length).toBe(12);
    expect(ANALYSIS_SIGNALS.length).toBe(12);
    expect(SEO_AREAS.length).toBe(7);
    expect(ASO_AREAS.length).toBe(7);
    expect(KPI_DIMENSIONS.length).toBe(9);
    expect(FUNNEL_STAGES.length).toBe(6);
    expect(REPORT_SECTIONS.length).toBe(7);
    expect(FOUNDER_CONTROLS.length).toBe(6);
    expect(AI_DECISION_KINDS.length).toBe(10);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(11);
    expect(EXECUTIVE_COUNCIL).toEqual(["R171_AICTO", "R172_AICOO", "R173_AICFO", "R174_AICPO"]);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2, no duplicates)", () => {
    expect(CANONICAL_OWNERS).toContain("R174_AICPO");
    expect(CANONICAL_OWNERS).toContain("R158_ApprovalGateway");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
    expect(new Set(CANONICAL_OWNERS).size).toBe(CANONICAL_OWNERS.length);
  });

  it("analyzeGrowthHealth aggregates channels", () => {
    const h = analyzeGrowthHealth(channels);
    expect(h.channels.length).toBe(12);
    expect(h.totalTraffic).toBe(channels.reduce((a, c) => a + c.traffic, 0));
    expect(h.totalConversions).toBe(channels.reduce((a, c) => a + c.conversions, 0));
    expect(h.averageConversionPct).toBeGreaterThan(0);
    expect(h.organicVsPaidRatio).toBeGreaterThanOrEqual(0);
    expect(h.organicVsPaidRatio).toBeLessThanOrEqual(1);
  });

  it("analyzeFunnel computes drop-off per stage", () => {
    const d = analyzeFunnel(funnel);
    expect(d.signup.conversionPct).toBe(12);
    expect(d.signup.dropPct).toBe(88);
    expect(d.referral.fromStage).toBe("retention");
  });

  it("prioritizeOpportunities ranks founder + high-lift first", () => {
    const ranked = prioritizeOpportunities(opportunities);
    expect(ranked[0].title).toBe("Founder-led referral flywheel");
    expect(ranked[ranked.length - 1].title).toBe("Legacy Telegram campaign");
    expect(ranked[0].handoff[ranked[0].handoff.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("scorePriority ranks ROI vs effort", () => {
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(5, 90)).toBe("p3");
  });

  it("computeKpis produces bounded overall growth score", () => {
    const h = analyzeGrowthHealth(channels);
    const k = computeKpis(h, funnel, seo, aso, 72, 78);
    expect(k.overall_growth_score).toBeGreaterThan(0);
    expect(k.overall_growth_score).toBeLessThanOrEqual(100);
    expect(k.community_score).toBe(72);
  });

  it("detectRisks flags churn, low conversion, SEO/ASO issues", () => {
    const weakChannels = GROWTH_CHANNELS.map((c) => ({
      channel: c, traffic: 1000, sessions: 900, conversions: 5,
      engagementPct: 10, organicReachPct: 20, paidReachPct: 60,
    }));
    const h = analyzeGrowthHealth(weakChannels);
    const weakFunnel = { visitor: 100000, signup: 2000, activation: 500, subscription: 300, retention: 100, referral: 5 };
    const weakSeo = { metadata: 30, indexing: 30, performance: 30, keywords: 30, content: 30, internal_links: 30, technical_seo: 30 };
    const weakAso = { store_listing: 30, screenshots: 30, description: 30, keywords: 30, ratings: 30, reviews: 30, visibility: 30 };
    const risks = detectRisks(h, weakFunnel, weakSeo, weakAso, 45, 40);
    const kinds = risks.map((r) => r.kind);
    expect(kinds).toContain("poor_conversion");
    expect(kinds).toContain("low_engagement");
    expect(kinds).toContain("high_churn");
    expect(kinds).toContain("seo_issue");
    expect(kinds).toContain("aso_issue");
    expect(kinds).toContain("brand_risk");
  });

  it("forecastGrowth projects 30d/90d/12m at compounding rate", () => {
    const h = analyzeGrowthHealth(channels);
    const f = forecastGrowth(h, 8);
    expect(f.map((x) => x.horizon)).toEqual(["30d", "90d", "12m"]);
    expect(f[2].projectedTraffic).toBeGreaterThan(f[0].projectedTraffic);
    expect(f[2].projectedGrowthPct).toBeGreaterThan(f[0].projectedGrowthPct);
  });

  it("composeCgoReport enforces governance locks and sorts risks", () => {
    const h = analyzeGrowthHealth(channels);
    const d = analyzeFunnel(funnel);
    const ranked = prioritizeOpportunities(opportunities);
    const k = computeKpis(h, funnel, seo, aso, 70, 75);
    const risks = detectRisks(h, funnel, seo, aso, 18, 72);
    const forecast = forecastGrowth(h, 5);
    const report = composeCgoReport({
      growthHealth: h, funnel, funnelDropoff: d, seo, aso, kpis: k,
      opportunities: ranked, risks, forecast,
      priorityActions: ["Ship referral flywheel", "Refresh ASO screenshots"],
      councilConflicts: [{ peer: "R173_AICFO", topic: "Paid spend", cgoPosition: "Scale paid reach", peerPosition: "Cap CAC" }],
      summary: "Founder-led referral flywheel is top ROI.",
    });
    expect(report.topOpportunities[0].title).toBe("Founder-led referral flywheel");
    expect(report.canLaunchCampaigns).toBe(false);
    expect(report.canEditPricing).toBe(false);
    expect(report.canEditSubscriptions).toBe(false);
    expect(report.canEditCreditPolicy).toBe(false);
    expect(report.canAutoImplement).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
    expect(report.councilConflicts.length).toBe(1);
    expect(report.forecast.length).toBe(3);
  });

  it("policy locks: no runtime, no campaigns, pricing/subscription/credit policy intact", () => {
    expect(R175_POLICY.canAutoImplement).toBe(false);
    expect(R175_POLICY.canLaunchCampaigns).toBe(false);
    expect(R175_POLICY.canEditPricing).toBe(false);
    expect(R175_POLICY.canEditSubscriptions).toBe(false);
    expect(R175_POLICY.canEditCreditPolicy).toBe(false);
    expect(R175_POLICY.newRuntime).toBe(false);
    expect(R175_POLICY.reuseOnly).toBe(true);
    expect(R175_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R175_POLICY.executiveCouncil).toEqual([
      "R171_AICTO", "R172_AICOO", "R173_AICFO", "R174_AICPO",
    ]);
    expect(R175_POLICY.companyProfile.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(R175_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R175_POLICY.dailyFreeCredits.accumulate).toBe(false);
    expect(R175_POLICY.dailyFreeCredits.carryForward).toBe(false);
    expect(R175_POLICY.dailyFreeCredits.serverAuthoritative).toBe(true);
    expect(R175_POLICY.dailyFreeCredits.deductionOrder).toEqual([
      "daily_free", "subscription", "purchased",
    ]);
  });
});
