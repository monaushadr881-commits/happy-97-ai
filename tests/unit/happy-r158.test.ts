import { describe, it, expect } from "vitest";
import {
  APPROVAL_PIPELINE, APPROVAL_TIERS, CHANGE_KINDS, CRITICAL_ACTIONS,
  EXPLANATION_FIELDS, FOUNDER_COMMANDS, IMPACT_FIELDS, PREVIEW_SURFACES,
  PREVIEW_THEMES, ROLLBACK_FIELDS,
  classifyChange, requirementsFor, nextStage, canAutoExecute, canExecute,
  isExplanationComplete, missingExplanationFields, previewMatrix,
  isValidCommand, hasRollbackEnvelope, approvalSnapshot,
} from "@/lib/founder/approval-gateway";

describe("R158 — Founder Approval Gateway™", () => {
  it("enumerates governance constants", () => {
    expect(CHANGE_KINDS.length).toBe(10);
    expect(APPROVAL_TIERS.length).toBe(4);
    expect(APPROVAL_PIPELINE.length).toBe(18);
    expect(EXPLANATION_FIELDS.length).toBe(12);
    expect(PREVIEW_SURFACES.length).toBe(5);
    expect(PREVIEW_THEMES.length).toBe(2);
    expect(CRITICAL_ACTIONS.length).toBe(8);
    expect(FOUNDER_COMMANDS.length).toBe(8);
    expect(IMPACT_FIELDS.length).toBe(9);
    expect(ROLLBACK_FIELDS.length).toBe(4);
  });

  it("classifies critical / destructive actions", () => {
    expect(classifyChange({ kind: "database", action: "delete_database" })).toBe("critical");
    expect(classifyChange({ kind: "database", destructive: true })).toBe("critical");
    expect(classifyChange({ kind: "database", affectsFounderAssets: true })).toBe("critical");
    expect(classifyChange({ kind: "api", affectsRevenue: true })).toBe("critical");
    expect(classifyChange({ kind: "api", securityImpact: "critical" })).toBe("critical");
  });

  it("classifies high_risk / standard / minor", () => {
    expect(classifyChange({ kind: "database", affectsProduction: true, tablesTouched: 1 })).toBe("high_risk");
    expect(classifyChange({ kind: "api", securityImpact: "high" })).toBe("high_risk");
    expect(classifyChange({ kind: "ui", filesTouched: 25 })).toBe("standard");
    expect(classifyChange({ kind: "ui", routesTouched: 3 })).toBe("standard");
    expect(classifyChange({ kind: "bugfix", filesTouched: 1 })).toBe("minor");
  });

  it("requirements scale with tier", () => {
    const critical = requirementsFor("critical");
    expect(critical.requiresPassword && critical.requiresOtp && critical.requiresFounderApproval).toBe(true);
    expect(requirementsFor("standard").requiresOtp).toBe(false);
    expect(requirementsFor("minor").requiresPreview).toBe(false);
    expect(requirementsFor("minor").requiresFounderApproval).toBe(true);
  });

  it("pipeline advances in strict order", () => {
    expect(nextStage("request")).toBe("intent");
    expect(nextStage("approval")).toBe("implementation");
    expect(nextStage("monitoring")).toBe("done");
  });

  it("never allows auto-execution", () => {
    expect(canAutoExecute()).toBe(false);
  });

  it("canExecute enforces every requirement per tier", () => {
    const base = { approvedByFounder: true, passwordVerified: true, otpVerified: true, previewShown: true, rollbackPrepared: true, auditWritten: true };
    expect(canExecute({ tier: "critical", ...base })).toBe(true);
    expect(canExecute({ tier: "critical", ...base, otpVerified: false })).toBe(false);
    expect(canExecute({ tier: "standard", ...base, otpVerified: false, passwordVerified: false })).toBe(true);
    expect(canExecute({ tier: "minor", ...base, previewShown: false, rollbackPrepared: false, otpVerified: false, passwordVerified: false })).toBe(true);
    expect(canExecute({ tier: "minor", ...base, approvedByFounder: false })).toBe(false);
    expect(canExecute({ tier: "critical", ...base, auditWritten: false })).toBe(false);
  });

  it("explanation completeness", () => {
    const full = Object.fromEntries(EXPLANATION_FIELDS.map((f) => [f, "x"]));
    expect(isExplanationComplete(full)).toBe(true);
    expect(missingExplanationFields({})).toEqual([...EXPLANATION_FIELDS]);
    expect(missingExplanationFields({ ...full, risks: "" }).length).toBe(1);
  });

  it("preview matrix covers every surface × theme", () => {
    const m = previewMatrix();
    expect(m.length).toBe(PREVIEW_SURFACES.length * PREVIEW_THEMES.length);
  });

  it("validates founder commands + rollback envelope", () => {
    expect(isValidCommand("approve")).toBe(true);
    expect(isValidCommand("nuke")).toBe(false);
    expect(hasRollbackEnvelope({ backup_id: "b1", rollback_plan: "p", version: "v1", audit_id: "a1" })).toBe(true);
    expect(hasRollbackEnvelope({ backup_id: "b1" })).toBe(false);
  });

  it("approvalSnapshot exposes Founder-Dashboard surface", () => {
    const s = approvalSnapshot({ kind: "database", action: "delete_database" });
    expect(s.tier).toBe("critical");
    expect(s.autoExecuteAllowed).toBe(false);
    expect(s.stages).toEqual(APPROVAL_PIPELINE);
    expect(s.explainFields).toEqual(EXPLANATION_FIELDS);
    expect(s.commands).toEqual(FOUNDER_COMMANDS);
  });
});
