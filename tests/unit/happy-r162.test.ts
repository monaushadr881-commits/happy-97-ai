import { describe, it, expect } from "vitest";
import {
  REVIEW_AREAS, AUTOMATIC_CHECKS, SECURITY_CHECKS, PERFORMANCE_CHECKS,
  DATABASE_CHECKS, API_CHECKS, UI_CHECKS, SCORE_DIMENSIONS,
  BLOCKING_CONDITIONS, RECOMMENDATION_KINDS, REVIEW_PIPELINE,
  CANONICAL_OWNERS_REUSED, detectBlockers, computeOverall, buildReviewReport,
  type ArchitectPackage,
} from "@/lib/founder/code-review-engineer";

const okPkg: ArchitectPackage = {
  intentId: "i1",
  duplicatesDetected: [],
  hasArchitecture: true,
  hasPlans: true,
  hasTests: true,
  hasDocumentation: true,
  affectedSystems: ["Brain"],
};

const scores = {
  architecture: 90, security: 95, performance: 80, maintainability: 85,
  accessibility: 90, businessLogic: 88, documentation: 82,
};

describe("R162 AI Code Review Engineer", () => {
  it("exposes the full taxonomy", () => {
    expect(REVIEW_AREAS).toHaveLength(15);
    expect(AUTOMATIC_CHECKS).toHaveLength(11);
    expect(SECURITY_CHECKS).toHaveLength(10);
    expect(PERFORMANCE_CHECKS).toHaveLength(8);
    expect(DATABASE_CHECKS).toHaveLength(6);
    expect(API_CHECKS).toHaveLength(7);
    expect(UI_CHECKS).toHaveLength(6);
    expect(SCORE_DIMENSIONS).toHaveLength(8);
    expect(BLOCKING_CONDITIONS).toHaveLength(7);
    expect(RECOMMENDATION_KINDS).toHaveLength(6);
    expect(REVIEW_PIPELINE).toHaveLength(10);
  });

  it("reuses only canonical owners, never invents new runtime", () => {
    expect(CANONICAL_OWNERS_REUSED).toContain("ApprovalGateway");
    expect(CANONICAL_OWNERS_REUSED).toContain("SoftwareArchitect");
    expect(CANONICAL_OWNERS_REUSED).toContain("GuardianAI");
  });

  it("detects duplicate-runtime/api/database blockers", () => {
    const b = detectBlockers({
      ...okPkg,
      duplicatesDetected: ["duplicate_runtime", "duplicate_api", "duplicate_table"],
    });
    expect(b).toContain("duplicate_runtime");
    expect(b).toContain("duplicate_api");
    expect(b).toContain("duplicate_database");
  });

  it("flags missing docs/tests/architecture as blockers", () => {
    const b = detectBlockers({
      ...okPkg, hasArchitecture: false, hasDocumentation: false, hasTests: false,
    });
    expect(b).toEqual(expect.arrayContaining([
      "architecture_break", "missing_documentation", "missing_tests",
    ]));
  });

  it("computes overall as clamped average", () => {
    expect(computeOverall(scores)).toBeGreaterThanOrEqual(80);
    expect(computeOverall(scores)).toBeLessThanOrEqual(100);
  });

  it("produces an approval-block when blockers exist", () => {
    const report = buildReviewReport(
      { ...okPkg, hasTests: false }, scores, [], [],
    );
    expect(report.canAutoExecute).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.summary.approvalRecommendation).toBe("block");
    expect(report.blockers).toContain("missing_tests");
  });

  it("recommends approve when clean and approve_with_changes on warnings", () => {
    const clean = buildReviewReport(okPkg, scores, [], []);
    expect(clean.summary.approvalRecommendation).toBe("approve");

    const warned = buildReviewReport(okPkg, scores,
      [{ area: "performance", severity: "warning", message: "large bundle" }], []);
    expect(warned.summary.approvalRecommendation).toBe("approve_with_changes");
  });

  it("locks compile-time invariants: reuseOnly + no new runtime", () => {
    const r = buildReviewReport(okPkg, scores, [], []);
    expect(r.version).toBe("R162");
    expect(r.reuseOnly).toBe(true);
    expect(r.newRuntime).toBe(false);
  });
});
