import { describe, it, expect } from "vitest";
import {
  OPTIMIZATION_AREAS, AUTOMATIC_ANALYSIS_CHECKS, PERFORMANCE_METRICS,
  DATABASE_CHECKS, API_CHECKS, AI_CHECKS, BUSINESS_CHECKS,
  RECOMMENDATION_KINDS, QUALITY_SCORE_DIMENSIONS, FOUNDER_REPORT_FIELDS,
  PIPELINE_STAGES, CANONICAL_OWNERS, R168_POLICY,
  worstSeverity, topPriority, computeScores, buildFounderReport,
  evaluateOptimization, type OptimizationRequest, type Finding, type Recommendation,
} from "@/lib/founder/optimization-advisor";

const finding = (over: Partial<Finding> = {}): Finding => ({
  check: "slow_queries", area: "database", severity: "high", detail: "x", ...over,
});
const rec = (over: Partial<Recommendation> = {}): Recommendation => ({
  kind: "performance", area: "performance", title: "t", rationale: "r",
  estimatedSavingsCents: 1000, estimatedPerformanceGainPct: 10,
  estimatedCostReductionPct: 5, priority: "high", ...over,
});
const baseReq = (over: Partial<OptimizationRequest> = {}): OptimizationRequest => ({
  workspaceId: "w1", founderId: "f1", findings: [], recommendations: [],
  scores: {}, auditPresent: true, ...over,
});

describe("R168 — AI Optimization Advisor™", () => {
  it("enumerates governance taxonomy", () => {
    expect(OPTIMIZATION_AREAS.length).toBe(18);
    expect(AUTOMATIC_ANALYSIS_CHECKS.length).toBe(16);
    expect(PERFORMANCE_METRICS.length).toBe(11);
    expect(DATABASE_CHECKS.length).toBe(7);
    expect(API_CHECKS.length).toBe(7);
    expect(AI_CHECKS.length).toBe(7);
    expect(BUSINESS_CHECKS.length).toBe(8);
    expect(RECOMMENDATION_KINDS.length).toBe(10);
    expect(QUALITY_SCORE_DIMENSIONS.length).toBe(8);
    expect(FOUNDER_REPORT_FIELDS.length).toBe(7);
    expect(PIPELINE_STAGES.length).toBe(12);
  });

  it("references canonical owners only (no V2)", () => {
    expect(CANONICAL_OWNERS).toContain("R158_ApprovalGateway");
    expect(CANONICAL_OWNERS).toContain("R167_DocumentationEngine");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
  });

  it("worstSeverity returns highest severity", () => {
    expect(worstSeverity([])).toBe("low");
    expect(worstSeverity([finding({ severity: "low" }), finding({ severity: "critical" })])).toBe("critical");
  });

  it("topPriority returns highest priority", () => {
    expect(topPriority([])).toBe("low");
    expect(topPriority([rec({ priority: "medium" }), rec({ priority: "urgent" })])).toBe("urgent");
  });

  it("computeScores deducts by severity per area", () => {
    const s = computeScores(baseReq({
      findings: [finding({ area: "database", severity: "critical" })],
    }));
    expect(s.database).toBe(85);
    expect(s.overall).toBeLessThan(100);
  });

  it("aggregates founder report totals", () => {
    const report = buildFounderReport(baseReq({
      findings: [finding({ severity: "critical" })],
      recommendations: [rec(), rec({ estimatedSavingsCents: 500, priority: "urgent" })],
    }));
    expect(report.current_health).toBe("critical");
    expect(report.estimated_savings).toBe(1500);
    expect(report.priority).toBe("urgent");
    expect(report.recommendations.length).toBe(2);
  });

  it("evaluateOptimization returns report + scores + locks", () => {
    const d = evaluateOptimization(baseReq({
      findings: [finding()], recommendations: [rec()],
    }));
    expect(d.canAutoOptimize).toBe(false);
    expect(d.handoffTarget).toBe("R158_ApprovalGateway");
    expect(d.reuseOnly).toBe(true);
    expect(d.newRuntime).toBe(false);
    expect(d.scores.overall).toBeGreaterThan(0);
  });

  it("policy enforces compile-time locks", () => {
    expect(R168_POLICY.canAutoOptimize).toBe(false);
    expect(R168_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R168_POLICY.reuseOnly).toBe(true);
    expect(R168_POLICY.newRuntime).toBe(false);
  });
});
