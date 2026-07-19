import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, ENGINEERING_REVIEW_AREAS, ROADMAP_HORIZONS,
  AI_DECISION_KINDS, HEALTH_DIMENSIONS, ENGINEERING_KPIS, REPORT_SECTIONS,
  FOUNDER_CONTROLS, PRIORITY_LEVELS, CANONICAL_OWNERS, HANDOFF_CHAIN,
  PIPELINE_STAGES, R171_POLICY,
  evaluateHealth, computeKPIs, scorePriority, buildRoadmap, recommend,
  composeCtoReport,
} from "@/lib/founder/ai-cto";

const health = { architecture: 80, engineering: 75, security: 90, performance: 70,
  maintainability: 65, documentation: 60, tests: 85 };

describe("R171 — AI CTO™", () => {
  it("enumerates governance taxonomy", () => {
    expect(RESPONSIBILITIES.length).toBe(10);
    expect(ENGINEERING_REVIEW_AREAS.length).toBe(7);
    expect(ROADMAP_HORIZONS.length).toBe(5);
    expect(AI_DECISION_KINDS.length).toBe(6);
    expect(HEALTH_DIMENSIONS.length).toBe(7);
    expect(ENGINEERING_KPIS.length).toBe(8);
    expect(REPORT_SECTIONS.length).toBe(6);
    expect(FOUNDER_CONTROLS.length).toBe(6);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(8);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2, no duplicates)", () => {
    expect(CANONICAL_OWNERS).toContain("R170_CompetitorIntelligence");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
    expect(new Set(CANONICAL_OWNERS).size).toBe(CANONICAL_OWNERS.length);
  });

  it("evaluateHealth returns overall aggregate", () => {
    const h = evaluateHealth(health);
    expect(h.security_health).toBe(90);
    expect(h.overall).toBeGreaterThan(65);
    expect(h.overall).toBeLessThan(85);
  });

  it("computeKPIs derives overall technology score", () => {
    const k = computeKPIs(health);
    expect(k.security_score).toBe(90);
    expect(k.overall_technology_score).toBeGreaterThan(60);
    expect(k.quality_score).toBe(Math.round((85 + 65 + 60) / 3));
  });

  it("scorePriority ranks ROI vs effort", () => {
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(5, 90)).toBe("p3");
  });

  it("buildRoadmap assigns priority per item", () => {
    const road = buildRoadmap([
      { horizon: "30_day", title: "Ship auth polish", responsibility: "release_planning", expectedRoi: 80, effort: 20 },
      { horizon: "1_year", title: "Rewrite storage", responsibility: "scalability", expectedRoi: 40, effort: 90 },
    ]);
    expect(road[0].priority).toBe("p0");
    expect(road[1].priority).toBe("p3");
  });

  it("recommend attaches full handoff chain ending in R158", () => {
    const r = recommend("security_improvements", "Enable MFA everywhere",
      "Reduces account takeover risk", 85, 25);
    expect(r.priority).toBe("p0");
    expect(r.handoff[r.handoff.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("composeCtoReport enforces all governance locks", () => {
    const h = evaluateHealth(health);
    const k = computeKPIs(health);
    const actions = [
      recommend("performance_improvements", "Cache brain results", "Cut p95 latency", 70, 30),
    ];
    const report = composeCtoReport({
      health: h, kpis: k,
      risks: ["Documentation drift"],
      opportunities: ["AI CTO leverage"],
      roadmap: buildRoadmap([{ horizon: "90_day", title: "Docs sprint",
        responsibility: "engineering_roadmap", expectedRoi: 55, effort: 30 }]),
      actions, summary: "Solid foundation; invest in docs and perf.",
    });
    expect(report.canAutoImplement).toBe(false);
    expect(report.canWriteProductionCode).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
    expect(report.estimatedRoi).toBe(70);
  });

  it("policy locks: no runtime, no code writes, daily credits intact", () => {
    expect(R171_POLICY.canAutoImplement).toBe(false);
    expect(R171_POLICY.canWriteProductionCode).toBe(false);
    expect(R171_POLICY.newRuntime).toBe(false);
    expect(R171_POLICY.reuseOnly).toBe(true);
    expect(R171_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R171_POLICY.companyProfile.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(R171_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R171_POLICY.dailyFreeCredits.accumulate).toBe(false);
  });
});
