import { describe, it, expect } from "vitest";
import {
  QA_TEST_PLANS, QA_AUTOMATIC_CHECKS, QA_SECURITY_CHECKS,
  QA_PERFORMANCE_CHECKS, QA_DATABASE_CHECKS, QA_API_CHECKS, QA_UI_CHECKS,
  QA_COMPATIBILITY_CHECKS, QA_SCORE_DIMENSIONS, QA_BLOCKERS, QA_PIPELINE,
  QA_CANONICAL_OWNERS_REUSED, detectQaBlockers, computeQaOverall,
  decideRelease, buildReleaseReadinessReport, type QaInput,
} from "@/lib/founder/qa-testing-engineer";

const cleanInput: QaInput = {
  reviewApproval: "approve",
  hasTests: true, hasRollback: true, hasDocumentation: true,
  duplicatesDetected: [],
  regressionFailures: 0, criticalFailures: 0,
  securityFailures: 0, architectureViolations: 0,
};

const scores = {
  unit: 95, integration: 90, regression: 92, security: 96,
  performance: 88, accessibility: 90, compatibility: 91, releaseReadiness: 93,
};

describe("R163 AI QA & Testing Engineer", () => {
  it("exposes complete QA taxonomy", () => {
    expect(QA_TEST_PLANS).toHaveLength(10);
    expect(QA_AUTOMATIC_CHECKS).toHaveLength(10);
    expect(QA_SECURITY_CHECKS).toHaveLength(9);
    expect(QA_PERFORMANCE_CHECKS).toHaveLength(8);
    expect(QA_DATABASE_CHECKS).toHaveLength(7);
    expect(QA_API_CHECKS).toHaveLength(8);
    expect(QA_UI_CHECKS).toHaveLength(8);
    expect(QA_COMPATIBILITY_CHECKS).toHaveLength(5);
    expect(QA_SCORE_DIMENSIONS).toHaveLength(9);
    expect(QA_BLOCKERS).toHaveLength(10);
    expect(QA_PIPELINE).toHaveLength(10);
  });

  it("reuses only canonical owners", () => {
    expect(QA_CANONICAL_OWNERS_REUSED).toContain("CodeReviewEngineer");
    expect(QA_CANONICAL_OWNERS_REUSED).toContain("ApprovalGateway");
    expect(QA_CANONICAL_OWNERS_REUSED).toContain("SoftwareArchitect");
  });

  it("detects critical/regression/security/architecture blockers", () => {
    const b = detectQaBlockers({
      ...cleanInput,
      criticalFailures: 1, regressionFailures: 2,
      securityFailures: 1, architectureViolations: 1,
    });
    expect(b).toEqual(expect.arrayContaining([
      "critical_test_failure", "regression_failure",
      "security_failure", "architecture_violation",
    ]));
  });

  it("flags duplicates and missing docs/tests/rollback", () => {
    const b = detectQaBlockers({
      ...cleanInput,
      duplicatesDetected: ["duplicate_runtime", "duplicate_api", "duplicate_table"],
      hasTests: false, hasRollback: false, hasDocumentation: false,
    });
    expect(b).toEqual(expect.arrayContaining([
      "duplicate_runtime", "duplicate_api", "duplicate_database",
      "missing_tests", "missing_rollback", "missing_documentation",
    ]));
  });

  it("release decision: READY / WARNINGS / NOT_READY", () => {
    expect(decideRelease([], "approve", 0)).toBe("READY");
    expect(decideRelease([], "approve", 3)).toBe("READY_WITH_WARNINGS");
    expect(decideRelease([], "approve_with_changes", 0)).toBe("READY_WITH_WARNINGS");
    expect(decideRelease(["missing_tests"], "approve", 0)).toBe("NOT_READY");
    expect(decideRelease([], "block", 0)).toBe("NOT_READY");
  });

  it("computes overall as clamped average", () => {
    const o = computeQaOverall(scores);
    expect(o).toBeGreaterThanOrEqual(80);
    expect(o).toBeLessThanOrEqual(100);
  });

  it("builds a clean READY report", () => {
    const r = buildReleaseReadinessReport(cleanInput, scores, []);
    expect(r.canAutoDeploy).toBe(false);
    expect(r.handoffTarget).toBe("R158_ApprovalGateway");
    expect(r.decision).toBe("READY");
    expect(r.summary.releaseConfidence).toBeGreaterThan(0);
    expect(r.plansGenerated).toEqual(QA_TEST_PLANS);
  });

  it("blocks release when critical findings + blockers exist", () => {
    const r = buildReleaseReadinessReport(
      { ...cleanInput, hasTests: false, criticalFailures: 1 },
      scores,
      [{ plan: "unit", severity: "critical", message: "login broken" }],
    );
    expect(r.decision).toBe("NOT_READY");
    expect(r.summary.releaseConfidence).toBe(0);
    expect(r.blockers).toEqual(expect.arrayContaining(["missing_tests", "critical_test_failure"]));
  });

  it("locks compile-time invariants: reuseOnly + no new runtime", () => {
    const r = buildReleaseReadinessReport(cleanInput, scores, []);
    expect(r.version).toBe("R163");
    expect(r.reuseOnly).toBe(true);
    expect(r.newRuntime).toBe(false);
  });
});
