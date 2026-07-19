import { describe, it, expect } from "vitest";
import {
  R166_POLICY,
  ROLLBACK_TYPES,
  RECOVERY_TYPES,
  SNAPSHOT_KINDS,
  QUALITY_GATES,
  detectGates,
  simulateRecovery,
  evaluateRollback,
  type RollbackRequest,
} from "@/lib/founder/rollback-recovery";

const baseAnalysis = {
  affectedFiles: ["a.ts"],
  affectedComponents: ["ModuleA"],
  affectedApis: ["/api/x"],
  affectedTables: [],
  affectedUsers: 10,
  affectedCompanies: 1,
  affectedRevenueCents: 0,
  affectedSecurityScopes: [],
  estimatedRecoveryMinutes: 5,
};

const completeSnapshots = [
  { kind: "rollback" as const, createdAt: "t", versionId: "v1", complete: true },
  { kind: "configuration" as const, createdAt: "t", versionId: "v1", complete: true },
  { kind: "audit" as const, createdAt: "t", versionId: "v1", complete: true },
  { kind: "metadata" as const, createdAt: "t", versionId: "v1", complete: true },
  { kind: "dependency" as const, createdAt: "t", versionId: "v1", complete: true },
  { kind: "documentation" as const, createdAt: "t", versionId: "v1", complete: true },
];

const okReq: RollbackRequest = {
  type: "feature",
  currentVersion: "v2",
  targetVersion: "v1",
  reason: "regression",
  founderId: "f1",
  snapshots: completeSnapshots,
  analysis: baseAnalysis,
  auditPresent: true,
};

describe("R166 policy", () => {
  it("locks reuse-only and no auto-execute", () => {
    expect(R166_POLICY.reuseOnly).toBe(true);
    expect(R166_POLICY.newRuntime).toBe(false);
    expect(R166_POLICY.canAutoExecute).toBe(false);
    expect(R166_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
  });

  it("exposes required taxonomies", () => {
    expect(ROLLBACK_TYPES).toContain("database_plan");
    expect(RECOVERY_TYPES).toContain("session");
    expect(SNAPSHOT_KINDS).toContain("audit");
    expect(QUALITY_GATES).toContain("data_loss_risk");
  });

  it("detects missing snapshot gate", () => {
    const req = { ...okReq, snapshots: [completeSnapshots[0]] };
    expect(detectGates(req)).toContain("incomplete_snapshot");
  });

  it("detects missing audit gate", () => {
    expect(detectGates({ ...okReq, auditPresent: false })).toContain("missing_audit");
  });

  it("detects data loss risk when tables touched without db plan", () => {
    const req = {
      ...okReq,
      analysis: { ...baseAnalysis, affectedTables: ["public.orders"] },
    };
    expect(detectGates(req)).toContain("data_loss_risk");
  });

  it("passes clean request with no gates", () => {
    expect(detectGates(okReq)).toEqual([]);
  });

  it("simulates business impact by revenue/users", () => {
    const sim = simulateRecovery({
      ...okReq,
      analysis: { ...baseAnalysis, affectedRevenueCents: 2_000_000, affectedUsers: 50_000 },
    });
    expect(sim.businessImpact).toBe("critical");
    expect(sim.successProbability).toBeGreaterThan(0);
  });

  it("blocks when any gate triggers", () => {
    const decision = evaluateRollback({ ...okReq, auditPresent: false });
    expect(decision.recommendation).toBe("block");
    expect(decision.canAutoExecute).toBe(false);
    expect(decision.handoffTarget).toBe("R158_ApprovalGateway");
  });

  it("recommends proceed for clean low-impact rollback", () => {
    expect(evaluateRollback(okReq).recommendation).toBe("proceed");
  });

  it("recommends proceed_with_care under critical business impact", () => {
    const decision = evaluateRollback({
      ...okReq,
      analysis: { ...baseAnalysis, affectedRevenueCents: 5_000_000 },
    });
    expect(decision.recommendation).toBe("proceed_with_care");
  });
});
