import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, PRODUCT_SURFACES, ROADMAP_HORIZONS, FEATURE_SIGNAL_KINDS,
  UX_AREAS, KPI_DIMENSIONS, REPORT_SECTIONS, FOUNDER_CONTROLS, PRIORITY_LEVELS,
  AI_DECISION_KINDS, CANONICAL_OWNERS, EXECUTIVE_COUNCIL, HANDOFF_CHAIN,
  PIPELINE_STAGES, R174_POLICY,
  analyzeProductHealth, prioritizeFeatures, computeKpis, detectRisks,
  buildRoadmap, scorePriority, composeCpoReport,
} from "@/lib/founder/ai-cpo";

const surfaces = PRODUCT_SURFACES.map((s, i) => ({
  surface: s,
  usagePct: 40 + i * 3,
  satisfactionPct: 70 + (i % 5),
  bugCount: i,
  performanceScore: 80 - i,
}));

const ux = {
  navigation: 82, accessibility: 78, consistency: 74, brand_identity: 88,
  performance: 80, usability: 76, learning_curve: 70, onboarding: 68,
};

const features = [
  { id: "f1", title: "Founder onboarding revamp", requestVolume: 120, founderRequested: true, adoptionPct: 65, usagePct: 70, businessValue: 88, complexity: 30 },
  { id: "f2", title: "Digital Human voice presets", requestVolume: 60, founderRequested: false, adoptionPct: 30, usagePct: 40, businessValue: 55, complexity: 45 },
  { id: "f3", title: "Legacy Builder theme", requestVolume: 5, founderRequested: false, adoptionPct: 3, usagePct: 4, businessValue: 8, complexity: 80 },
];

describe("R174 — AI CPO™", () => {
  it("enumerates governance taxonomy", () => {
    expect(RESPONSIBILITIES.length).toBe(12);
    expect(PRODUCT_SURFACES.length).toBe(10);
    expect(ROADMAP_HORIZONS.length).toBe(6);
    expect(FEATURE_SIGNAL_KINDS.length).toBe(8);
    expect(UX_AREAS.length).toBe(8);
    expect(KPI_DIMENSIONS.length).toBe(8);
    expect(REPORT_SECTIONS.length).toBe(8);
    expect(FOUNDER_CONTROLS.length).toBe(6);
    expect(AI_DECISION_KINDS.length).toBe(9);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(10);
    expect(EXECUTIVE_COUNCIL).toEqual(["R171_AICTO", "R172_AICOO", "R173_AICFO"]);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2, no duplicates)", () => {
    expect(CANONICAL_OWNERS).toContain("R171_AICTO");
    expect(CANONICAL_OWNERS).toContain("R172_AICOO");
    expect(CANONICAL_OWNERS).toContain("R173_AICFO");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
    expect(new Set(CANONICAL_OWNERS).size).toBe(CANONICAL_OWNERS.length);
  });

  it("analyzeProductHealth aggregates surfaces", () => {
    const h = analyzeProductHealth(surfaces);
    expect(h.surfaces.length).toBe(10);
    expect(h.averageUsagePct).toBeGreaterThan(0);
    expect(h.totalBugs).toBe(surfaces.reduce((a, s) => a + s.bugCount, 0));
  });

  it("prioritizeFeatures ranks founder request + high business value first", () => {
    const ranked = prioritizeFeatures(features);
    expect(ranked[0].title).toBe("Founder onboarding revamp");
    expect(ranked[ranked.length - 1].title).toBe("Legacy Builder theme");
    expect(ranked[0].handoff[ranked[0].handoff.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("scorePriority ranks ROI vs effort", () => {
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(5, 90)).toBe("p3");
  });

  it("computeKpis produces bounded overall product score", () => {
    const h = analyzeProductHealth(surfaces);
    const ranked = prioritizeFeatures(features);
    const k = computeKpis(h, ux, ranked, 85);
    expect(k.overall_product_score).toBeGreaterThan(0);
    expect(k.overall_product_score).toBeLessThanOrEqual(100);
    expect(k.founder_alignment_score).toBe(85);
  });

  it("detectRisks flags low adoption, alignment, and ux issues", () => {
    const lowH = analyzeProductHealth(
      PRODUCT_SURFACES.map((s) => ({ surface: s, usagePct: 10, satisfactionPct: 50, bugCount: 15, performanceScore: 50 })),
    );
    const lowUx = { ...ux, consistency: 40, brand_identity: 40, navigation: 30, accessibility: 30, performance: 30, usability: 30, learning_curve: 30, onboarding: 30 };
    const risks = detectRisks(lowH, lowUx, 40);
    const kinds = risks.map((r) => r.kind);
    expect(kinds).toContain("adoption_risk");
    expect(kinds).toContain("ux_risk");
    expect(kinds).toContain("consistency_risk");
    expect(kinds).toContain("alignment_risk");
  });

  it("buildRoadmap distributes by priority horizon", () => {
    const ranked = prioritizeFeatures(features);
    const roadmap = buildRoadmap(ranked);
    expect(roadmap.length).toBe(ranked.length);
    const p0 = roadmap.find((r) => r.priority === "p0");
    if (p0) expect(p0.horizon).toBe("30d_product_plan");
  });

  it("composeCpoReport enforces governance locks and sorts risks", () => {
    const h = analyzeProductHealth(surfaces);
    const ranked = prioritizeFeatures(features);
    const k = computeKpis(h, ux, ranked, 82);
    const risks = detectRisks(h, ux, 65);
    const roadmap = buildRoadmap(ranked);
    const report = composeCpoReport({
      productHealth: h, ux, kpis: k, roadmap,
      opportunities: ["Improve onboarding drop-off"],
      risks,
      priorityFeatures: ranked,
      councilConflicts: [{ peer: "R173_AICFO", topic: "AI credit budget", cpoPosition: "Ship voice presets", peerPosition: "Cap AI spend" }],
      summary: "Founder onboarding revamp is top ROI.",
    });
    expect(report.priorityFeatures[0].title).toBe("Founder onboarding revamp");
    expect(report.canWriteProductionCode).toBe(false);
    expect(report.canChangeProductDirectly).toBe(false);
    expect(report.canAutoImplement).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
    expect(report.councilConflicts.length).toBe(1);
  });

  it("policy locks: no runtime, no direct product changes, no code writes, credit policy intact", () => {
    expect(R174_POLICY.canAutoImplement).toBe(false);
    expect(R174_POLICY.canWriteProductionCode).toBe(false);
    expect(R174_POLICY.canChangeProductDirectly).toBe(false);
    expect(R174_POLICY.newRuntime).toBe(false);
    expect(R174_POLICY.reuseOnly).toBe(true);
    expect(R174_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R174_POLICY.executiveCouncil).toEqual(["R171_AICTO", "R172_AICOO", "R173_AICFO"]);
    expect(R174_POLICY.companyProfile.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(R174_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R174_POLICY.dailyFreeCredits.accumulate).toBe(false);
    expect(R174_POLICY.dailyFreeCredits.carryForward).toBe(false);
    expect(R174_POLICY.dailyFreeCredits.serverAuthoritative).toBe(true);
    expect(R174_POLICY.dailyFreeCredits.deductionOrder).toEqual([
      "daily_free", "subscription", "purchased",
    ]);
  });
});
