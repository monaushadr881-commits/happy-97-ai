import { describe, it, expect } from "vitest";
import {
  BUILDER_KINDS, runtimeFor, pipelineFor, planBuilder,
  recommendedBlocks, nextPublishState, capabilitiesFor,
  hasBuilderCapability, analyticsSnapshot, resolveForBrain,
  type BuilderEvent,
} from "@/lib/happy-r121/builder-intelligence";

describe("R121 Builder Intelligence", () => {
  it("covers all 24+ kinds", () => {
    expect(BUILDER_KINDS.length).toBeGreaterThanOrEqual(24);
  });

  it("routes kinds to canonical runtimes", () => {
    expect(runtimeFor("landing")).toBe("website-builder");
    expect(runtimeFor("android")).toBe("app-builder");
    expect(runtimeFor("workflow")).toBe("uabr");
    expect(runtimeFor("crm")).toBe("uabr");
  });

  it("pipeline shortens for lightweight kinds", () => {
    expect(pipelineFor("theme").stages).not.toContain("schema");
    expect(pipelineFor("crm").stages).toContain("schema");
    expect(pipelineFor("landing").stages).toContain("deploy");
  });

  it("plans builder from prompt", () => {
    const plan = planBuilder({ prompt: "Build an ecommerce store with Stripe checkout and login" });
    expect(plan.kind).toBe("store");
    expect(plan.needsPayments).toBe(true);
    expect(plan.needsAuth).toBe(true);
    expect(plan.targets).toContain("web");
    expect(plan.confidence).toBeGreaterThan(0.5);
  });

  it("recommends blocks per kind", () => {
    expect(recommendedBlocks("landing")).toContain("hero");
    expect(recommendedBlocks("dashboard")).toContain("chart");
    expect(recommendedBlocks("crm")).toContain("kanban");
  });

  it("enforces role-gated publish/rollback", () => {
    expect(nextPublishState("draft", "publish", "editor").allowed).toBe(false);
    expect(nextPublishState("draft", "publish", "admin").allowed).toBe(true);
    expect(nextPublishState("published", "rollback", "founder").next).toBe("rolled_back");
  });

  it("maps 7 roles to capabilities", () => {
    expect(capabilitiesFor("viewer")).toEqual(["read"]);
    expect(hasBuilderCapability("developer", "schema")).toBe(true);
    expect(hasBuilderCapability("developer", "publish")).toBe(false);
    expect(hasBuilderCapability("owner", "delete")).toBe(true);
  });

  it("summarises analytics", () => {
    const evts: BuilderEvent[] = [
      { kind: "landing", stage: "understand", ms: 100, aiAssisted: true, success: true },
      { kind: "landing", stage: "publish", ms: 500, aiAssisted: false, success: true },
      { kind: "crm", stage: "deploy", ms: 900, aiAssisted: true, success: true },
      { kind: "crm", stage: "error", ms: 50, aiAssisted: false, success: false },
    ];
    const a = analyticsSnapshot(evts);
    expect(a.publishes).toBe(1);
    expect(a.deployments).toBe(1);
    expect(a.errors).toBe(1);
    expect(a.aiAssistRate).toBeGreaterThan(0);
    expect(a.perKind.landing).toBe(2);
  });

  it("emits compact Brain hint", () => {
    const hint = resolveForBrain({ prompt: "Design a HRMS with payroll and employee login" });
    expect(hint.kind).toBe("hrms");
    expect(hint.runtime).toBe("uabr");
    expect(hint.needs.db).toBe(true);
    expect(hint.needs.auth).toBe(true);
  });
});
