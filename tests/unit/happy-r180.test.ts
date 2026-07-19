import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, CREATIVE_DOMAINS, OUTPUT_TYPES, QUALITY_AXES,
  KPI_DIMENSIONS, RECOMMENDATIONS, FOUNDER_CONTROLS, EXECUTIVE_COUNCIL, LOCKS,
  computeKpis, detectRisks, reviewAsset, detectCouncilConflicts,
  composeCreativeReport, canAutoExecute,
  type CreativeAsset,
} from "@/lib/founder/ai-creative-director";

const heroPoster: CreativeAsset = {
  id: "a1", title: "HAPPY Launch Poster", domain: "poster", output: "design_review",
  founderRequested: true, brandRefs: ["primary","accent","display-font"],
  scores: { brand_consistency: 92, visual_quality: 90, accessibility: 88, readability: 90, professionalism: 92, performance_impact: 85 },
};
const badBanner: CreativeAsset = {
  id: "a2", title: "Third-party banner", domain: "banner", output: "design_review",
  brandRefs: [],
  scores: { brand_consistency: 15, visual_quality: 40, accessibility: 12, readability: 35, professionalism: 40, performance_impact: 30 },
};
const midAvatar: CreativeAsset = {
  id: "a3", title: "Avatar concept", domain: "avatar", output: "concept",
  brandRefs: ["primary"],
  scores: { brand_consistency: 65, visual_quality: 60, accessibility: 70, readability: 65, professionalism: 62, performance_impact: 60 },
};

describe("R180 — AI Creative Director™", () => {
  it("enumerates governance constants", () => {
    expect(RESPONSIBILITIES.length).toBe(10);
    expect(CREATIVE_DOMAINS.length).toBe(16);
    expect(OUTPUT_TYPES.length).toBe(7);
    expect(QUALITY_AXES.length).toBe(6);
    expect(KPI_DIMENSIONS.length).toBe(7);
    expect(RECOMMENDATIONS.length).toBe(6);
    expect(FOUNDER_CONTROLS.length).toBe(7);
    expect(EXECUTIVE_COUNCIL.length).toBe(9);
  });

  it("locks forbid auto-editing / publishing", () => {
    expect(LOCKS.canEditProductionAssets).toBe(false);
    expect(LOCKS.canPublishMedia).toBe(false);
    expect(LOCKS.canOverwriteBrandKit).toBe(false);
    expect(LOCKS.canBypassApprovalGateway).toBe(false);
    expect(LOCKS.canAutoImplement).toBe(false);
    expect(LOCKS.newRuntime).toBe(false);
    expect(LOCKS.reuseOnly).toBe(true);
    expect(LOCKS.handoffTarget).toBe("R158_ApprovalGateway");
    expect(canAutoExecute()).toBe(false);
  });

  it("computes KPIs bounded 0-100", () => {
    const k = computeKpis([heroPoster]);
    for (const v of Object.values(k)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(k.overall_creative_score).toBeGreaterThan(70);
  });

  it("detects critical brand + accessibility risks", () => {
    const risks = detectRisks(badBanner);
    expect(risks.some((r) => r.kind === "brand_drift" && r.severity === "critical")).toBe(true);
    expect(risks.some((r) => r.kind === "accessibility_risk" && r.severity === "critical")).toBe(true);
  });

  it("flags missing brand tokens as brand drift", () => {
    const risks = detectRisks({ ...midAvatar, brandRefs: [] });
    expect(risks.some((r) => r.kind === "brand_drift")).toBe(true);
  });

  it("reviews assets appropriately", () => {
    expect(reviewAsset(heroPoster)).toBe("elevate_to_brand_kit");
    expect(reviewAsset(badBanner)).toBe("reject");
    expect(["revise","rework"]).toContain(reviewAsset(midAvatar));
  });

  it("surfaces council conflicts", () => {
    const c = detectCouncilConflicts({ R171_CTO: "support", R174_CPO: "block", R179_StrategyDirector: "block" });
    expect(c).toEqual(["R174_CPO", "R179_StrategyDirector"]);
  });

  it("composes creative report with handoff to R158", () => {
    const r = composeCreativeReport({ assets: [heroPoster, midAvatar, badBanner], councilVotes: { R174_CPO: "block" } });
    expect(r.handoff).toBe("R158_ApprovalGateway");
    expect(r.reviewMatrix.length).toBe(3);
    expect(r.councilConflicts).toEqual(["R174_CPO"]);
    expect(r.recommendation).toBe("reject"); // any reject cascades
    expect(r.locks.canPublishMedia).toBe(false);
  });

  it("empty asset set returns reference_only", () => {
    const r = composeCreativeReport({ assets: [] });
    expect(r.recommendation).toBe("reference_only");
  });
});
