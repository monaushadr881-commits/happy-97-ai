import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, ANALYSIS_DIMENSIONS, PLANNING_HORIZONS, EXECUTIVE_REPORTS,
  PORTFOLIO_PLATFORMS, PRIORITY_AXES, KPI_DIMENSIONS, RISK_KINDS,
  RECOMMENDATIONS, FOUNDER_CONTROLS, EXECUTIVE_COUNCIL, LOCKS,
  alignmentScore, detectCouncilConflicts, computeKpis, detectRisks,
  priorityOf, buildHorizons, recommend, synthesize, canAutoExecute,
  type ExecutiveInput, type PriorityItem,
} from "@/lib/founder/ai-strategy-director";

const strongExec: ExecutiveInput[] = [
  { from: "cto", vote: "support", weight: 100, scores: { technology: 85, operations: 80, security: 90, release: 80, product: 80, founder_vision: 90 } },
  { from: "coo", vote: "support", weight: 100, scores: { operations: 85, business: 80, customer: 75 } },
  { from: "cfo", vote: "support", weight: 100, scores: { finance: 82, revenue: 80 } },
  { from: "cpo", vote: "support", weight: 100, scores: { product: 85, customer: 80 } },
  { from: "cgo", vote: "support", weight: 100, scores: { growth: 80, customer: 78 } },
  { from: "research", vote: "support", weight: 80, scores: { research: 78 } },
  { from: "release", vote: "support", weight: 100, scores: { release: 82 } },
  { from: "innovation", vote: "support", weight: 100, scores: { innovation: 80 } },
];

const conflictExec: ExecutiveInput[] = [
  { from: "cto", vote: "support", weight: 100, scores: { technology: 70 } },
  { from: "cfo", vote: "block", weight: 100, scores: { finance: 40 } },
  { from: "cgo", vote: "block", weight: 100, scores: { growth: 45 } },
];

const items: PriorityItem[] = [
  { id: "a", title: "Digital Human premium tier", founderRequested: true, scores: { business_value: 85, founder_value: 95, roi: 80, risk: 30, complexity: 40, dependencies: 40 } },
  { id: "b", title: "Business OS module", scores: { business_value: 70, founder_value: 60, roi: 65, risk: 40, complexity: 50 } },
  { id: "c", title: "Legacy migration", scores: { business_value: 30, founder_value: 25, roi: 20, risk: 60, complexity: 80 } },
];

describe("R179 — AI Strategy Director™", () => {
  it("enumerates governance constants", () => {
    expect(RESPONSIBILITIES.length).toBe(15);
    expect(ANALYSIS_DIMENSIONS.length).toBe(13);
    expect(PLANNING_HORIZONS.length).toBe(7);
    expect(EXECUTIVE_REPORTS.length).toBe(8);
    expect(PORTFOLIO_PLATFORMS.length).toBe(7);
    expect(PRIORITY_AXES.length).toBe(8);
    expect(KPI_DIMENSIONS.length).toBe(8);
    expect(RISK_KINDS.length).toBe(8);
    expect(RECOMMENDATIONS.length).toBe(6);
    expect(FOUNDER_CONTROLS.length).toBe(7);
    expect(EXECUTIVE_COUNCIL.length).toBe(8);
  });

  it("locks forbid execution", () => {
    expect(LOCKS.canExecute).toBe(false);
    expect(LOCKS.canDeploy).toBe(false);
    expect(LOCKS.canEditProduction).toBe(false);
    expect(LOCKS.canChangeCompanyPolicy).toBe(false);
    expect(LOCKS.canBypassApprovalGateway).toBe(false);
    expect(LOCKS.canAutoImplement).toBe(false);
    expect(LOCKS.newRuntime).toBe(false);
    expect(LOCKS.reuseOnly).toBe(true);
    expect(LOCKS.handoffTarget).toBe("R158_ApprovalGateway");
    expect(canAutoExecute()).toBe(false);
  });

  it("computes alignment score", () => {
    expect(alignmentScore(strongExec)).toBeGreaterThanOrEqual(90);
    expect(alignmentScore(conflictExec)).toBeLessThan(50);
  });

  it("surfaces blocking council conflicts", () => {
    const c = detectCouncilConflicts(conflictExec);
    expect(c).toContain("R173_CFO");
    expect(c).toContain("R175_CGO");
    expect(detectCouncilConflicts(strongExec)).toEqual([]);
  });

  it("KPIs bounded 0-100 and overall reflects strong council", () => {
    const k = computeKpis(strongExec);
    for (const v of Object.values(k)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(k.overall_strategy_score).toBeGreaterThan(60);
    expect(k.alignment_score).toBeGreaterThanOrEqual(90);
  });

  it("detects founder-alignment risk when council fractured", () => {
    const k = computeKpis(conflictExec);
    const r = detectRisks(conflictExec, k);
    expect(r.some((x) => x.kind === "founder_alignment_risk")).toBe(true);
  });

  it("prioritizes founder-requested items to p0", () => {
    expect(priorityOf(items[0])).toBe("p0");
    expect(priorityOf(items[2])).toBe("p3");
  });

  it("builds all planning horizons", () => {
    const h = buildHorizons(items);
    expect(h.length).toBe(PLANNING_HORIZONS.length);
    expect(h.find((x) => x.horizon === "30d")?.items).toContain("Digital Human premium tier");
  });

  it("recommends execute for strong aligned strategy", () => {
    const k = computeKpis(strongExec);
    const r = detectRisks(strongExec, k);
    expect(recommend(k, r)).toBe("execute");
  });

  it("synthesizes unified strategy with handoff to R158", () => {
    const s = synthesize({ executives: strongExec, items });
    expect(s.handoff).toBe("R158_ApprovalGateway");
    expect(s.priorityMatrix.length).toBe(3);
    expect(s.horizons.length).toBe(7);
    expect(s.recommendation).toBe("execute");
    expect(s.locks.canExecute).toBe(false);
  });

  it("rejects strategy on critical security risk", () => {
    const bad: ExecutiveInput[] = [
      { from: "cto", vote: "support", scores: { technology: 80, security: 10, founder_vision: 80 } },
    ];
    const k = computeKpis(bad);
    const r = detectRisks(bad, k);
    expect(recommend(k, r)).toBe("reject");
  });
});
