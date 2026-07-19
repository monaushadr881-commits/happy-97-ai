import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, INNOVATION_SOURCES, FORBIDDEN_SOURCES, INNOVATION_DOMAINS,
  IDEA_LIFECYCLE, PIPELINE_QUEUES, EVALUATION_AXES, KPI_DIMENSIONS,
  RECOMMENDATIONS, FOUNDER_CONTROLS, EXECUTIVE_COUNCIL, LOCKS,
  isForbiddenSource, isValidSource, classifyIdea, computeKpis,
  detectRisks, recommend, priorityOf, detectCouncilConflicts,
  composeInnovationReport, canAutoExecute,
  type Idea,
} from "@/lib/founder/ai-innovation-director";

const good: Idea = {
  id: "i1", title: "VRM crowd choreography", source: "founder_idea",
  domain: "digital_humans", founderRequested: true,
  scores: { business_value: 90, engineering_value: 85, user_value: 88, founder_value: 95, cost: 40, risk: 30, complexity: 40, scalability: 80, maintainability: 80, dependencies: 30 },
};
const risky: Idea = {
  id: "i2", title: "copy competitor", source: "copied_product",
  domain: "website", scores: { business_value: 50, user_value: 40 },
};
const mid: Idea = {
  id: "i3", title: "AR try-on", source: "public_technology_trend",
  domain: "ar", scores: { business_value: 60, engineering_value: 50, user_value: 55, cost: 60, risk: 50 },
};

describe("R178 — AI Innovation Director™", () => {
  it("enumerates governance constants", () => {
    expect(RESPONSIBILITIES.length).toBe(10);
    expect(INNOVATION_SOURCES.length).toBe(7);
    expect(FORBIDDEN_SOURCES.length).toBe(6);
    expect(INNOVATION_DOMAINS.length).toBe(18);
    expect(IDEA_LIFECYCLE.length).toBe(10);
    expect(PIPELINE_QUEUES.length).toBe(6);
    expect(EVALUATION_AXES.length).toBe(10);
    expect(KPI_DIMENSIONS.length).toBe(8);
    expect(RECOMMENDATIONS.length).toBe(6);
    expect(FOUNDER_CONTROLS.length).toBe(7);
    expect(EXECUTIVE_COUNCIL.length).toBe(7);
  });

  it("locks are immutable and hostile to execution", () => {
    expect(LOCKS.canBuild).toBe(false);
    expect(LOCKS.canDeploy).toBe(false);
    expect(LOCKS.canChangeProduction).toBe(false);
    expect(LOCKS.canAutoImplement).toBe(false);
    expect(LOCKS.canBypassApprovalGateway).toBe(false);
    expect(LOCKS.newRuntime).toBe(false);
    expect(LOCKS.reuseOnly).toBe(true);
    expect(LOCKS.handoffTarget).toBe("R158_ApprovalGateway");
    expect(canAutoExecute()).toBe(false);
  });

  it("validates sources", () => {
    expect(isForbiddenSource("leaked_information")).toBe(true);
    expect(isValidSource("founder_idea")).toBe(true);
    expect(isValidSource("copied_product")).toBe(false);
  });

  it("classifies ideas into correct queues", () => {
    expect(classifyIdea(good).queue).toBe("innovation_queue");
    expect(classifyIdea(mid).queue).toBe("research_queue");
    expect(classifyIdea(risky).queue).toBe("idea_backlog");
    expect(classifyIdea(risky).sourceValid).toBe(false);
  });

  it("computes KPIs bounded 0-100", () => {
    const k = computeKpis(good);
    for (const v of Object.values(k)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(k.overall_innovation_score).toBeGreaterThan(60);
  });

  it("detects compliance risk on forbidden source (critical)", () => {
    const risks = detectRisks(risky);
    expect(risks.some((r) => r.kind === "compliance_risk" && r.severity === "critical")).toBe(true);
  });

  it("recommends immediate_opportunity for strong founder idea", () => {
    expect(recommend(good)).toBe("immediate_opportunity");
    expect(recommend(risky)).toBe("reject");
  });

  it("prioritizes founder ideas higher", () => {
    expect(priorityOf(good)).toBe("p0");
    expect(["p2", "p3"]).toContain(priorityOf(risky));
  });

  it("surfaces council conflicts", () => {
    const conflicts = detectCouncilConflicts({ R171_CTO: "support", R173_CFO: "block", R177_ReleaseDirector: "block" });
    expect(conflicts).toEqual(["R173_CFO", "R177_ReleaseDirector"]);
  });

  it("composes executive innovation report", () => {
    const rep = composeInnovationReport({ ideas: [good, mid, risky], councilVotes: { R173_CFO: "block" } });
    expect(rep.handoff).toBe("R158_ApprovalGateway");
    expect(rep.priorityMatrix.length).toBe(3);
    expect(rep.councilConflicts).toEqual(["R173_CFO"]);
    expect(rep.risks.some((r) => r.severity === "critical")).toBe(true);
    expect(rep.recommendation).toBe("immediate_opportunity");
    expect(rep.locks.canDeploy).toBe(false);
  });
});
