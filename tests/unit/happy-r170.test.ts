import { describe, it, expect } from "vitest";
import {
  ALLOWED_SOURCES, FORBIDDEN_SOURCES, ANALYSIS_AREAS, COMPARISON_MATRICES,
  GAP_CATEGORIES, RECOMMENDATION_KINDS, PRIORITY_LEVELS, MARKET_TRENDS,
  OUTPUT_REPORTS, ETHICS_RULES, CANONICAL_OWNERS, HANDOFF_CHAIN,
  PIPELINE_STAGES, COMPANY_PROFILE, R170_POLICY,
  isAllowedSource, isForbiddenSource, verifySignals, scorePriority,
  runGapAnalysis, composeFounderReport, type CompetitorSignal,
} from "@/lib/founder/competitor-intelligence";

const sig = (over: Partial<CompetitorSignal> = {}): CompetitorSignal => ({
  competitorId: "c1", area: "features", source: "public_website",
  summary: "has feature X", citation: "https://example.com", observedAt: "2026-01-01",
  ...over,
});

describe("R170 — AI Competitor Intelligence™", () => {
  it("enumerates governance taxonomy", () => {
    expect(ALLOWED_SOURCES.length).toBe(12);
    expect(FORBIDDEN_SOURCES.length).toBe(10);
    expect(ANALYSIS_AREAS.length).toBe(17);
    expect(COMPARISON_MATRICES.length).toBe(8);
    expect(GAP_CATEGORIES.length).toBe(7);
    expect(RECOMMENDATION_KINDS.length).toBe(4);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(MARKET_TRENDS.length).toBe(5);
    expect(OUTPUT_REPORTS.length).toBe(7);
    expect(ETHICS_RULES.length).toBe(8);
    expect(PIPELINE_STAGES.length).toBe(10);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2)", () => {
    expect(CANONICAL_OWNERS).toContain("R169_LearningMemory");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
  });

  it("locks the canonical Company Profile", () => {
    expect(COMPANY_PROFILE.legalName).toBe("HAPPY PERSON PRIVATE LIMITED");
    expect(COMPANY_PROFILE.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(COMPANY_PROFILE.canonical).toBe(true);
    expect(COMPANY_PROFILE.singleSourceOfTruth).toBe(true);
  });

  it("classifies sources correctly", () => {
    expect(isAllowedSource("public_pricing_page")).toBe(true);
    expect(isForbiddenSource("leaked_information")).toBe(true);
    expect(isAllowedSource("leaked_information")).toBe(false);
  });

  it("verifySignals blocks forbidden sources and reports ethics", () => {
    const v = verifySignals([
      sig(),
      sig({ source: "leaked_information" as any }),
      sig({ source: "scraped_protected_resource" as any }),
    ]);
    expect(v.allowed.length).toBe(1);
    expect(v.rejected.length).toBe(2);
    expect(v.ethicsCleared).toBe(false);
  });

  it("scorePriority ranks value vs effort", () => {
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(10, 90)).toBe("p3");
  });

  it("runGapAnalysis surfaces missing features", () => {
    const gaps = runGapAnalysis(
      new Set(["chat"]),
      { features: ["chat", "voice", "video"], ai_features: ["copilot"] },
    );
    const descs = gaps.map((g) => g.description);
    expect(descs.some((d) => d.includes("voice"))).toBe(true);
    expect(descs.some((d) => d.includes("copilot"))).toBe(true);
    expect(descs.some((d) => d.includes("chat"))).toBe(false);
  });

  it("composeFounderReport enforces handoff and locks", () => {
    const gaps = runGapAnalysis(new Set(), { features: ["voice"] });
    const report = composeFounderReport({
      signals: [sig()],
      gaps,
      strengths: ["ONE HAPPY runtime"],
      weaknesses: ["No voice yet"],
      currentPosition: "Emerging",
    });
    expect(report.canAutoImplement).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
    expect(report.ethicsCleared).toBe(true);
    expect(report.recommendations[0].handoff[report.recommendations[0].handoff.length - 1])
      .toBe("R158_ApprovalGateway");
    expect(report.estimatedImpact).toBeGreaterThan(0);
  });

  it("flags ethics failure when signals include forbidden sources", () => {
    const report = composeFounderReport({
      signals: [sig({ source: "reverse_engineered_binary" as any })],
      gaps: [], strengths: [], weaknesses: [], currentPosition: "n/a",
    });
    expect(report.ethicsCleared).toBe(false);
  });

  it("enforces compile-time policy locks + daily free credits", () => {
    expect(R170_POLICY.canAutoImplement).toBe(false);
    expect(R170_POLICY.newRuntime).toBe(false);
    expect(R170_POLICY.reuseOnly).toBe(true);
    expect(R170_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R170_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R170_POLICY.dailyFreeCredits.accumulate).toBe(false);
    expect(R170_POLICY.dailyFreeCredits.carryForward).toBe(false);
  });
});
