import { describe, it, expect } from "vitest";
import {
  LEARNING_DOMAINS, MEMORY_CLASSES, LEARNING_SOURCES, NEVER_LEARN_SOURCES,
  QUALITY_DIMENSIONS, AUTOMATIC_CHECKS, SUGGESTION_KINDS, PROTECTED_DOMAINS,
  FOUNDER_CONTROLS, OUTPUT_REPORTS, PIPELINE_STAGES, CANONICAL_OWNERS,
  R169_POLICY, isForbiddenSource, scoreQuality, detectConflicts,
  detectChecks, evaluateLearning, type CandidateLearning,
} from "@/lib/founder/learning-memory";

const cand = (over: Partial<CandidateLearning> = {}): CandidateLearning => ({
  id: "m1", domain: "founder_preferences", source: "founder_approvals",
  memoryClass: "long_term", content: "prefer dark mode",
  approvedByFounder: true, confidence: 0.95, recencyDays: 1,
  ownerId: "founder-1", ...over,
});

describe("R169 — Founder Learning Memory™", () => {
  it("enumerates governance taxonomy", () => {
    expect(LEARNING_DOMAINS.length).toBe(20);
    expect(MEMORY_CLASSES.length).toBe(7);
    expect(LEARNING_SOURCES.length).toBe(7);
    expect(NEVER_LEARN_SOURCES.length).toBe(4);
    expect(QUALITY_DIMENSIONS.length).toBe(6);
    expect(AUTOMATIC_CHECKS.length).toBe(6);
    expect(SUGGESTION_KINDS.length).toBe(6);
    expect(FOUNDER_CONTROLS.length).toBe(9);
    expect(OUTPUT_REPORTS.length).toBe(7);
    expect(PIPELINE_STAGES.length).toBe(11);
    expect(PROTECTED_DOMAINS).toEqual(
      expect.arrayContaining(["architecture_decisions", "security_decisions", "revenue_policies"]),
    );
  });

  it("references canonical owners only (no V2)", () => {
    expect(CANONICAL_OWNERS).toContain("R168_OptimizationAdvisor");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
  });

  it("isForbiddenSource flags never-learn sources", () => {
    expect(isForbiddenSource("rejected_ideas")).toBe(true);
    expect(isForbiddenSource("founder_approvals")).toBe(false);
  });

  it("scoreQuality reflects approval, recency, source", () => {
    const good = scoreQuality(cand());
    expect(good.overall).toBeGreaterThanOrEqual(90);
    const bad = scoreQuality(cand({
      approvedByFounder: false, confidence: 0.1, recencyDays: 400,
      source: "rejected_ideas",
    }));
    expect(bad.approval_status).toBe(0);
    expect(bad.source).toBe(0);
    expect(bad.overall).toBeLessThan(50);
  });

  it("detects duplicates, conflicts, and invalid references", () => {
    const existing: CandidateLearning[] = [
      cand({ id: "m2" }),
      cand({ id: "m3", content: "prefer light mode" }),
    ];
    const report = detectConflicts(cand({ references: ["missing-ref"] }), existing);
    expect(report.duplicates).toContain("m2");
    expect(report.conflicts).toContain("m3");
    expect(report.invalidReferences).toContain("missing-ref");
  });

  it("detectChecks maps every conflict category", () => {
    const checks = detectChecks({
      duplicates: ["a"], conflicts: ["b"], expired: ["c"],
      invalidReferences: ["d"], missingApproval: ["e"], architectureConflicts: ["f"],
    });
    expect(checks.sort()).toEqual([...AUTOMATIC_CHECKS].sort());
  });

  it("rejects forbidden sources outright", () => {
    const d = evaluateLearning(cand({ source: "rejected_ideas" }));
    expect(d.recommendation).toBe("reject");
  });

  it("rejects overwrite of protected domain without founder approval", () => {
    const d = evaluateLearning(cand({
      domain: "security_decisions",
      overwrites: { domain: "security_decisions", existingId: "old", founderApproved: false },
    }));
    expect(d.recommendation).toBe("reject");
    expect(d.conflicts.architectureConflicts).toContain("old");
  });

  it("holds low quality or conflicting candidates", () => {
    const d = evaluateLearning(cand({ approvedByFounder: false }));
    expect(d.recommendation).toBe("hold");
    expect(d.checks).toContain("missing_approval");
  });

  it("learns clean, high-quality, approved candidates", () => {
    const d = evaluateLearning(cand());
    expect(d.recommendation).toBe("learn");
    expect(d.checks).toEqual([]);
  });

  it("enforces compile-time locks + handoff", () => {
    const d = evaluateLearning(cand());
    expect(d.canAutoLearn).toBe(false);
    expect(d.handoffTarget).toBe("R158_ApprovalGateway");
    expect(d.reuseOnly).toBe(true);
    expect(d.newRuntime).toBe(false);
    expect(R169_POLICY.canAutoLearn).toBe(false);
    expect(R169_POLICY.newRuntime).toBe(false);
  });
});
