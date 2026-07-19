import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, RESEARCH_DOMAINS, RESEARCH_TYPES, ALLOWED_SOURCES,
  FORBIDDEN_SOURCES, EVALUATION_AXES, KPI_DIMENSIONS, RECOMMENDATION_KINDS,
  REPORT_SECTIONS, FOUNDER_CONTROLS, PRIORITY_LEVELS, CANONICAL_OWNERS,
  EXECUTIVE_COUNCIL, HANDOFF_CHAIN, PIPELINE_STAGES, R176_POLICY,
  validateSources, evaluateCandidates, compareTechnologies, recommend,
  computeKpis, detectRisks, forecastAdoption, composeResearchReport,
  scorePriority, scoreOverall,
  type TechnologyCandidate,
} from "@/lib/founder/ai-research-director";

const candidates: TechnologyCandidate[] = [
  {
    id: "t1", name: "Vision Pro spatial UI", domain: "vision_pro", type: "feasibility_study",
    founderRequested: true, technologyReadinessLevel: 7,
    sources: [{ kind: "official_sdk_documentation", citation: "developer.apple.com/visionos" }],
    scores: { benefits: 90, risks: 45, cost: 70, complexity: 60, dependencies: 55, compatibility: 65, scalability: 70, maintainability: 65 },
  },
  {
    id: "t2", name: "NVIDIA ACE avatar pipeline", domain: "nvidia_ace", type: "technology_review",
    founderRequested: false, technologyReadinessLevel: 6,
    sources: [{ kind: "official_documentation", citation: "developer.nvidia.com/ace" }],
    scores: { benefits: 80, risks: 55, cost: 65, complexity: 70, dependencies: 60, compatibility: 60, scalability: 75, maintainability: 60 },
  },
  {
    id: "t3", name: "Leaked prototype SDK", domain: "developer_tools", type: "technology_review",
    founderRequested: false, technologyReadinessLevel: 4,
    sources: [{ kind: "leaked_information", citation: "unauthorized" }],
    scores: { benefits: 60, risks: 90, cost: 40, complexity: 60, dependencies: 60, compatibility: 50, scalability: 50, maintainability: 40 },
  },
  {
    id: "t4", name: "Legacy XR bridge", domain: "xr", type: "trend_analysis",
    founderRequested: false, technologyReadinessLevel: 2,
    sources: [{ kind: "academic_papers", citation: "arxiv.org/abs/xxxx" }],
    scores: { benefits: 30, risks: 60, cost: 85, complexity: 80, dependencies: 80, compatibility: 30, scalability: 30, maintainability: 25 },
  },
];

describe("R176 — AI Research Director™", () => {
  it("enumerates governance taxonomy", () => {
    expect(RESPONSIBILITIES.length).toBe(12);
    expect(RESEARCH_DOMAINS.length).toBe(18);
    expect(RESEARCH_TYPES.length).toBe(8);
    expect(ALLOWED_SOURCES.length).toBe(7);
    expect(FORBIDDEN_SOURCES.length).toBe(6);
    expect(EVALUATION_AXES.length).toBe(8);
    expect(KPI_DIMENSIONS.length).toBe(8);
    expect(RECOMMENDATION_KINDS.length).toBe(5);
    expect(REPORT_SECTIONS.length).toBe(8);
    expect(FOUNDER_CONTROLS.length).toBe(6);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(11);
    expect(EXECUTIVE_COUNCIL).toEqual([
      "R171_AICTO", "R172_AICOO", "R173_AICFO", "R174_AICPO", "R175_AICGO",
    ]);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2, no duplicates)", () => {
    expect(CANONICAL_OWNERS).toContain("R175_AICGO");
    expect(CANONICAL_OWNERS).toContain("R158_ApprovalGateway");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
    expect(new Set(CANONICAL_OWNERS).size).toBe(CANONICAL_OWNERS.length);
  });

  it("validateSources rejects forbidden and accepts allowed", () => {
    const v = validateSources([
      { kind: "official_documentation", citation: "a" },
      { kind: "leaked_information", citation: "b" },
      { kind: "reverse_engineering", citation: "c" },
    ]);
    expect(v.ok).toBe(false);
    expect(v.allowed.length).toBe(1);
    expect(v.rejected.length).toBe(2);
  });

  it("scoreOverall and scorePriority behave as expected", () => {
    const s = scoreOverall({
      benefits: 90, risks: 20, cost: 30, complexity: 30,
      dependencies: 30, compatibility: 80, scalability: 80, maintainability: 80,
    }, 8);
    expect(s).toBeGreaterThan(60);
    expect(s).toBeLessThanOrEqual(100);
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(5, 90)).toBe("p3");
  });

  it("evaluateCandidates zeroes overall for forbidden-source candidates", () => {
    const evals = evaluateCandidates(candidates);
    const leaked = evals.find((e) => e.candidate.id === "t3");
    expect(leaked?.sourcesOk).toBe(false);
    expect(leaked?.overall).toBe(0);
  });

  it("compareTechnologies sorts by overall descending", () => {
    const rows = compareTechnologies(candidates);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].overall).toBeGreaterThanOrEqual(rows[i].overall);
    }
    expect(rows[0].name).toBe("Vision Pro spatial UI");
  });

  it("recommend routes forbidden sources to reject and adopts high-TRL winners", () => {
    const recs = recommend(candidates);
    const t1 = recs.find((r) => r.candidateId === "t1")!;
    const t3 = recs.find((r) => r.candidateId === "t3")!;
    expect(t3.kind).toBe("reject");
    expect(["adopt", "prototype"]).toContain(t1.kind);
    expect(recs[0].handoff[recs[0].handoff.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("computeKpis bounds overall research score 0..100", () => {
    const recs = recommend(candidates);
    const k = computeKpis(candidates, recs);
    expect(k.overall_research_score).toBeGreaterThan(0);
    expect(k.overall_research_score).toBeLessThanOrEqual(100);
    expect(k.research_confidence).toBeLessThan(100); // one candidate has forbidden source
  });

  it("detectRisks flags compliance, obsolescence, cost, compatibility", () => {
    const risks = detectRisks(candidates);
    const kinds = risks.map((r) => r.kind);
    expect(kinds).toContain("compliance_risk");
    expect(kinds).toContain("obsolescence_risk");
    expect(kinds).toContain("cost_risk");
    expect(kinds).toContain("compatibility_risk");
    const critical = risks.find((r) => r.severity === "critical");
    expect(critical?.kind).toBe("compliance_risk");
  });

  it("forecastAdoption grows monotonically per candidate 30d→12m", () => {
    const f = forecastAdoption(candidates);
    for (const c of candidates) {
      const items = f.filter((x) => x.candidateId === c.id);
      expect(items.length).toBe(3);
      const m30 = items.find((x) => x.horizon === "30d")!.adoptionLikelihoodPct;
      const m90 = items.find((x) => x.horizon === "90d")!.adoptionLikelihoodPct;
      const m12 = items.find((x) => x.horizon === "12m")!.adoptionLikelihoodPct;
      expect(m90).toBeGreaterThanOrEqual(m30);
      expect(m12).toBeGreaterThanOrEqual(m90);
    }
  });

  it("composeResearchReport enforces governance locks and sorts risks", () => {
    const report = composeResearchReport({
      candidates,
      findings: ["Vision Pro toolchain matured", "ACE production-ready for avatars"],
      futureOpportunities: ["Cross-device spatial workspace"],
      councilConflicts: [{
        peer: "R173_AICFO", topic: "Vision Pro rollout budget",
        researchPosition: "Prototype now", peerPosition: "Defer 90d",
      }],
      summary: "Vision Pro is top research priority.",
      priorityActions: ["Prototype Vision Pro workspace"],
    });
    expect(report.canImplement).toBe(false);
    expect(report.canDeploy).toBe(false);
    expect(report.canAccessPrivateInfo).toBe(false);
    expect(report.canAutoImplement).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
    expect(report.topRisks[0].severity).toBe("critical");
    expect(report.comparison[0].name).toBe("Vision Pro spatial UI");
    expect(report.forecast.length).toBe(candidates.length * 3);
  });

  it("policy locks: no runtime, no implementation, no private access, credit policy intact", () => {
    expect(R176_POLICY.canAutoImplement).toBe(false);
    expect(R176_POLICY.canImplement).toBe(false);
    expect(R176_POLICY.canDeploy).toBe(false);
    expect(R176_POLICY.canAccessPrivateInfo).toBe(false);
    expect(R176_POLICY.newRuntime).toBe(false);
    expect(R176_POLICY.reuseOnly).toBe(true);
    expect(R176_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R176_POLICY.executiveCouncil).toEqual([
      "R171_AICTO", "R172_AICOO", "R173_AICFO", "R174_AICPO", "R175_AICGO",
    ]);
    expect(R176_POLICY.companyProfile.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(R176_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R176_POLICY.dailyFreeCredits.accumulate).toBe(false);
    expect(R176_POLICY.dailyFreeCredits.carryForward).toBe(false);
    expect(R176_POLICY.dailyFreeCredits.serverAuthoritative).toBe(true);
    expect(R176_POLICY.dailyFreeCredits.deductionOrder).toEqual([
      "daily_free", "subscription", "purchased",
    ]);
  });
});
