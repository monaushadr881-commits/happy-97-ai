import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, OPERATIONS_DOMAINS, WORKFLOW_AREAS, RESOURCE_AREAS,
  HEALTH_DIMENSIONS, PRODUCTIVITY_METRICS, REPORT_SECTIONS, FOUNDER_CONTROLS,
  PRIORITY_LEVELS, AI_DECISION_KINDS, CANONICAL_OWNERS, HANDOFF_CHAIN,
  PIPELINE_STAGES, R172_POLICY,
  evaluateHealth, measureProductivity, scorePriority, recommend, composeCooReport,
} from "@/lib/founder/ai-coo";

const ops = { operations: 78, workflow: 70, efficiency: 65, automation: 60,
  customerExperience: 80, support: 72 };
const prod = { automationPct: 55, manualWorkPct: 45, timeSavedHours: 320,
  operationalCost: 15000, growthCapacity: 70 };

describe("R172 — AI COO™", () => {
  it("enumerates governance taxonomy", () => {
    expect(RESPONSIBILITIES.length).toBe(10);
    expect(OPERATIONS_DOMAINS.length).toBe(11);
    expect(WORKFLOW_AREAS.length).toBe(7);
    expect(RESOURCE_AREAS.length).toBe(8);
    expect(HEALTH_DIMENSIONS.length).toBe(7);
    expect(PRODUCTIVITY_METRICS.length).toBe(5);
    expect(REPORT_SECTIONS.length).toBe(6);
    expect(FOUNDER_CONTROLS.length).toBe(6);
    expect(AI_DECISION_KINDS.length).toBe(7);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(9);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2, no duplicates)", () => {
    expect(CANONICAL_OWNERS).toContain("R171_AICTO");
    expect(CANONICAL_OWNERS).toContain("R128_BusinessOS");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
    expect(new Set(CANONICAL_OWNERS).size).toBe(CANONICAL_OWNERS.length);
  });

  it("evaluateHealth aggregates overall operations score", () => {
    const h = evaluateHealth(ops);
    expect(h.customer_experience_score).toBe(80);
    expect(h.overall_operations_score).toBeGreaterThan(60);
    expect(h.overall_operations_score).toBeLessThan(80);
  });

  it("measureProductivity clamps and rounds inputs", () => {
    const p = measureProductivity(prod);
    expect(p.automation_pct).toBe(55);
    expect(p.time_saved_hours).toBe(320);
    expect(p.growth_capacity).toBe(70);
  });

  it("scorePriority ranks ROI vs effort", () => {
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(5, 90)).toBe("p3");
  });

  it("recommend attaches full handoff chain ending in R158", () => {
    const r = recommend("automation_opportunity", "support",
      "Auto-triage tickets", "Cut manual load 40%", 82, 12000, 25);
    expect(r.priority).toBe("p0");
    expect(r.handoff[r.handoff.length - 1]).toBe("R158_ApprovalGateway");
    expect(r.domain).toBe("support");
  });

  it("composeCooReport sorts actions by priority and sums savings", () => {
    const h = evaluateHealth(ops);
    const p = measureProductivity(prod);
    const actions = [
      recommend("cost_reduction", "finance", "Renegotiate SaaS", "Duplicate tools", 40, 5000, 60),
      recommend("automation_opportunity", "crm", "Lead scoring", "Faster qualification", 85, 20000, 20),
    ];
    const report = composeCooReport({
      health: h, productivity: p,
      risks: ["Manual approvals in ERP"],
      opportunities: ["CRM automation"],
      actions, summary: "Automate CRM and consolidate spend.",
    });
    expect(report.priorityActions[0].domain).toBe("crm");
    expect(report.estimatedSavings).toBe(25000);
    expect(report.estimatedRoi).toBe(Math.round((40 + 85) / 2));
  });

  it("composeCooReport enforces all governance locks", () => {
    const report = composeCooReport({
      health: evaluateHealth(ops),
      productivity: measureProductivity(prod),
      risks: [], opportunities: [], actions: [], summary: "",
    });
    expect(report.canChangeProduction).toBe(false);
    expect(report.canChangeBusinessRules).toBe(false);
    expect(report.canAutoImplement).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
  });

  it("policy locks: no runtime, no production, no rule changes, credits intact", () => {
    expect(R172_POLICY.canAutoImplement).toBe(false);
    expect(R172_POLICY.canChangeProduction).toBe(false);
    expect(R172_POLICY.canChangeBusinessRules).toBe(false);
    expect(R172_POLICY.newRuntime).toBe(false);
    expect(R172_POLICY.reuseOnly).toBe(true);
    expect(R172_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R172_POLICY.companyProfile.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(R172_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R172_POLICY.dailyFreeCredits.accumulate).toBe(false);
  });
});
