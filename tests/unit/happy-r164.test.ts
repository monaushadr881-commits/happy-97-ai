import { describe, it, expect } from "vitest";
import {
  IMPACT_SCOPE, CHANGE_SURFACES, DEPENDENCY_ARTIFACTS, BUSINESS_IMPACT,
  SECURITY_IMPACT, PERFORMANCE_IMPACT, DATABASE_IMPACT, API_IMPACT,
  UI_IMPACT, DEPLOYMENT_IMPACT, RISK_DIMENSIONS, IMPACT_QUALITY_GATES,
  IMPACT_PIPELINE, IMPACT_CANONICAL_OWNERS_REUSED,
  detectQualityGates, computeOverallRisk, recommendFromRisk,
  buildImpactReport, type ChangeSet,
} from "@/lib/founder/impact-analyzer";

const cleanChange: ChangeSet = {
  files: ["src/lib/x.ts", "src/lib/y.ts"],
  routes: ["/x"], components: ["X"], modules: ["mod-x"],
  tables: [], policies: [], workers: [],
  tests: ["tests/x.test.ts"], documentation: ["docs/X.md"], migrations: [],
  duplicatesDetected: [],
  hasRollback: true, hasTests: true, hasDocumentation: true,
  criticalSecurityRisk: false, architectureBreak: false,
};

const lowRisk = {
  technical: 20, security: 10, business: 15, performance: 20,
  migration: 10, deployment: 15, operational: 10,
};
const highRisk = {
  technical: 80, security: 90, business: 70, performance: 60,
  migration: 55, deployment: 65, operational: 50,
};

const basePresentation = {
  whatWillChange: ["add x"], why: "founder request",
  benefits: ["speed"], risks: [],
  estimatedEffort: "low" as const, estimatedTimeHours: 2, estimatedCostUsd: 0,
  affectedModules: ["mod-x"], affectedUsersEstimate: 10,
};

describe("R164 AI Impact Analyzer", () => {
  it("exposes complete impact taxonomy", () => {
    expect(IMPACT_SCOPE).toHaveLength(16);
    expect(CHANGE_SURFACES).toHaveLength(15);
    expect(DEPENDENCY_ARTIFACTS).toHaveLength(6);
    expect(BUSINESS_IMPACT).toHaveLength(8);
    expect(SECURITY_IMPACT).toHaveLength(9);
    expect(PERFORMANCE_IMPACT).toHaveLength(10);
    expect(DATABASE_IMPACT).toHaveLength(8);
    expect(API_IMPACT).toHaveLength(7);
    expect(UI_IMPACT).toHaveLength(8);
    expect(DEPLOYMENT_IMPACT).toHaveLength(5);
    expect(RISK_DIMENSIONS).toHaveLength(8);
    expect(IMPACT_QUALITY_GATES).toHaveLength(8);
    expect(IMPACT_PIPELINE).toHaveLength(10);
  });

  it("reuses only canonical owners", () => {
    expect(IMPACT_CANONICAL_OWNERS_REUSED).toContain("SoftwareArchitect");
    expect(IMPACT_CANONICAL_OWNERS_REUSED).toContain("CodeReviewEngineer");
    expect(IMPACT_CANONICAL_OWNERS_REUSED).toContain("QaTestingEngineer");
    expect(IMPACT_CANONICAL_OWNERS_REUSED).toContain("ApprovalGateway");
  });

  it("detects all quality-gate categories", () => {
    const gates = detectQualityGates({
      ...cleanChange,
      duplicatesDetected: ["duplicate_runtime", "duplicate_api", "duplicate_table"],
      hasRollback: false, hasTests: false, hasDocumentation: false,
      architectureBreak: true, criticalSecurityRisk: true,
    });
    expect(gates).toEqual(expect.arrayContaining([
      "duplicate_runtime", "duplicate_api", "duplicate_database",
      "architecture_break", "missing_rollback", "missing_tests",
      "missing_documentation", "critical_security_risk",
    ]));
  });

  it("computeOverallRisk is worst-case weighted", () => {
    expect(computeOverallRisk(lowRisk)).toBeLessThan(40);
    expect(computeOverallRisk(highRisk)).toBeGreaterThanOrEqual(60);
  });

  it("recommendation ladder from risk+gates", () => {
    expect(recommendFromRisk([], 10)).toBe("proceed");
    expect(recommendFromRisk([], 50)).toBe("proceed_with_care");
    expect(recommendFromRisk([], 80)).toBe("block");
    expect(recommendFromRisk(["missing_tests"], 10)).toBe("block");
  });

  it("builds a clean proceed report", () => {
    const r = buildImpactReport(cleanChange, lowRisk, basePresentation);
    expect(r.canAutoImplement).toBe(false);
    expect(r.handoffTarget).toBe("R158_ApprovalGateway");
    expect(r.presentation.recommendation).toBe("proceed");
    expect(r.presentation.rollbackAvailable).toBe(true);
    expect(r.discovered.counts.files).toBe(2);
    expect(r.discovered.counts.tests).toBe(1);
    expect(r.gatesTriggered).toEqual([]);
  });

  it("blocks when gates triggered", () => {
    const r = buildImpactReport(
      { ...cleanChange, hasTests: false, criticalSecurityRisk: true },
      highRisk,
      basePresentation,
    );
    expect(r.presentation.recommendation).toBe("block");
    expect(r.gatesTriggered).toEqual(expect.arrayContaining([
      "missing_tests", "critical_security_risk",
    ]));
  });

  it("locks compile-time invariants: reuseOnly + no new runtime", () => {
    const r = buildImpactReport(cleanChange, lowRisk, basePresentation);
    expect(r.version).toBe("R164");
    expect(r.reuseOnly).toBe(true);
    expect(r.newRuntime).toBe(false);
  });
});
