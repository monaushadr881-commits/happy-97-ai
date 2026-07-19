import { describe, it, expect } from "vitest";
import {
  ARCHITECT_INPUT_MODES, ANALYSIS_FIELDS, DISCOVERY_SURFACES,
  DUPLICATE_CHECKS, ARCHITECTURE_ARTIFACTS, ENGINEERING_PLANS,
  QUALITY_DIMENSIONS, COST_BUCKETS, RISK_CATEGORIES, COMPETITORS,
  OUTPUT_SECTIONS, PRESENTATION_FIELDS, ARCHITECT_PIPELINE, ARCHITECT_META,
  normalizeInputModes, runDuplicateChecks, missingAnalysisFields,
  nextArchitectStage, buildArchitectPackage,
} from "@/lib/founder/software-architect";

describe("R161 — AI Software Architect™", () => {
  it("enumerates governance constants", () => {
    expect(ARCHITECT_INPUT_MODES.length).toBe(10);
    expect(ANALYSIS_FIELDS.length).toBe(10);
    expect(DISCOVERY_SURFACES.length).toBe(8);
    expect(DUPLICATE_CHECKS.length).toBe(7);
    expect(ARCHITECTURE_ARTIFACTS.length).toBe(8);
    expect(ENGINEERING_PLANS.length).toBe(9);
    expect(QUALITY_DIMENSIONS.length).toBe(7);
    expect(COST_BUCKETS.length).toBe(5);
    expect(RISK_CATEGORIES.length).toBe(6);
    expect(COMPETITORS.length).toBe(8);
    expect(OUTPUT_SECTIONS.length).toBe(7);
    expect(PRESENTATION_FIELDS.length).toBe(11);
    expect(ARCHITECT_PIPELINE.length).toBe(11);
  });

  it("normalizes and rejects unknown modalities", () => {
    expect(normalizeInputModes("voice")).toEqual(["voice"]);
    expect(normalizeInputModes(["text", "video", "url"]))
      .toEqual(["text", "video", "url"]);
    // @ts-expect-error runtime guard
    expect(normalizeInputModes(["text", "telepathy"])).toEqual(["text"]);
  });

  it("duplicate check is a hard gate", () => {
    const clean = runDuplicateChecks({});
    expect(clean.blocking).toBe(false);
    expect(clean.duplicatesFound).toEqual([]);

    const dirty = runDuplicateChecks({
      duplicate_runtime: true,
      duplicate_api: true,
    });
    expect(dirty.blocking).toBe(true);
    expect(dirty.duplicatesFound).toContain("duplicate_runtime");
    expect(dirty.duplicatesFound).toContain("duplicate_api");
  });

  it("missing analysis fields prevent planning (Ask, don't guess)", () => {
    expect(missingAnalysisFields({}).length).toBe(ANALYSIS_FIELDS.length);
    const full = Object.fromEntries(
      ANALYSIS_FIELDS.map((f) => [f, f === "dependencies" || f === "affectedSystems" ? ["x"] : "x"]),
    ) as any;
    expect(missingAnalysisFields(full).length).toBe(0);
  });

  it("pipeline routes correctly", () => {
    expect(nextArchitectStage({ analysisComplete: false, duplicatesBlocking: false }))
      .toBe("analyse");
    expect(nextArchitectStage({ analysisComplete: true, duplicatesBlocking: true }))
      .toBe("duplicateCheck");
    expect(nextArchitectStage({ analysisComplete: true, duplicatesBlocking: false }))
      .toBe("design");
  });

  it("builds an approval package that hands off to R158 and never auto-executes", () => {
    const pkg = buildArchitectPackage({
      analysis: {
        businessGoal: "faster onboarding",
        technicalGoal: "reduce login p95 by 40%",
        priority: "high",
        scope: "auth + dashboard",
        complexity: "medium",
        dependencies: ["Happy ID", "RBAC"],
        affectedSystems: ["auth", "dashboard"],
        risk: "medium",
        estimatedCostUsd: 1200,
        estimatedTimeHours: 24,
      },
      duplicates: runDuplicateChecks({}),
      presentation: Object.fromEntries(
        PRESENTATION_FIELDS.map((f) => [f, "documented"]),
      ) as any,
    });
    expect(pkg.version).toBe("R161");
    expect(pkg.handoffTarget).toBe("R158_ApprovalGateway");
    expect(pkg.canAutoExecute).toBe(false);
    expect(pkg.plans.length).toBe(ENGINEERING_PLANS.length);
    expect(pkg.artifacts.length).toBe(ARCHITECTURE_ARTIFACTS.length);
  });

  it("meta enforces zero-duplication + zero-execute contract", () => {
    expect(ARCHITECT_META.createsNewRuntime).toBe(false);
    expect(ARCHITECT_META.createsNewTables).toBe(false);
    expect(ARCHITECT_META.duplicatesArchitectureEngine).toBe(false);
    expect(ARCHITECT_META.autoExecutes).toBe(false);
    expect(ARCHITECT_META.handoffTarget).toBe("R158_ApprovalGateway");
  });
});
