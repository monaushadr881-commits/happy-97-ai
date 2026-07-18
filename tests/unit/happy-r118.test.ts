import { describe, it, expect } from "vitest";
import {
  classifyWorkspaceType, hierarchyPath, detectContext, planSwitch,
  capabilitiesFor, hasCapability, scopesForSurface, emptyAnalytics,
  resolveForBrain, pickDHMode, greetingFor,
} from "@/lib/happy-r118/workspace-intelligence";

describe("R118 Workspace Intelligence", () => {
  it("classifies workspace types", () => {
    expect(classifyWorkspaceType({ founderMode: true })).toBe("founder");
    expect(classifyWorkspaceType({ hasCitizens: true })).toBe("government");
    expect(classifyWorkspaceType({ hasStudents: true })).toBe("education");
    expect(classifyWorkspaceType({ memberCount: 500 })).toBe("enterprise");
    expect(classifyWorkspaceType({ companyCount: 1, memberCount: 25 })).toBe("company");
    expect(classifyWorkspaceType({ companyCount: 1, memberCount: 2 })).toBe("business");
    expect(classifyWorkspaceType({ templateId: "creator" })).toBe("creator");
    expect(classifyWorkspaceType({})).toBe("personal");
  });

  it("builds hierarchy path in order", () => {
    const path = hierarchyPath({ workspace_id: "w", company_id: "c", brand_id: "b", team_id: "t", project_id: "p" });
    expect(path).toEqual(["workspace:w","company:c","brand:b","team:t","project:p"]);
  });

  it("detects context from route + hierarchy", () => {
    const ctx = detectContext("/builder/app-1", { workspace_id: "w1" }, "ship v1");
    expect(ctx.surface).toBe("builder");
    expect(ctx.workspace_id).toBe("w1");
    expect(ctx.goal).toBe("ship v1");
  });

  it("plans a context-preserving switch", () => {
    const s = planSwitch("w1", "w2");
    expect(s.preserve).toEqual({ memory: true, ai_session: true, digital_human: true });
    expect(s.from).toBe("w1"); expect(s.to).toBe("w2");
  });

  it("maps roles → capabilities", () => {
    expect(hasCapability("owner", "workspace.delete")).toBe(true);
    expect(hasCapability("viewer", "workspace.write")).toBe(false);
    expect(hasCapability("member", "projects.create")).toBe(true);
    expect(capabilitiesFor("custom", ["workspace.read"])).toEqual(["workspace.read"]);
  });

  it("picks memory scopes per surface", () => {
    expect(scopesForSurface("builder")).toContain("builder");
    expect(scopesForSurface("crm")).toContain("automation");
    expect(scopesForSurface("founder")).toContain("digital_human");
  });

  it("has an empty analytics shape", () => {
    const a = emptyAnalytics();
    expect(a.usage.active_users).toBe(0);
    expect(a.subscriptions.tier).toBe("free");
  });

  it("resolves brain hint from route + hints", () => {
    const hint = resolveForBrain("/founder", { workspace_id: "w1", founderMode: true, company_id: "c1" });
    expect(hint.workspace_type).toBe("founder");
    expect(hint.surface).toBe("founder");
    expect(hint.memory_scopes).toContain("digital_human");
    expect(hint.hierarchy[0]).toBe("workspace:w1");
  });

  it("picks DH mode + greeting by type", () => {
    expect(pickDHMode("founder", "founder")).toBe("founder");
    expect(pickDHMode("education", "learning" as any)).toBe("education");
    expect(pickDHMode("business", "crm")).toBe("business");
    expect(pickDHMode("personal", "builder")).toBe("presentation");
    expect(greetingFor("founder", "Ada")).toMatch(/Ada/);
    expect(greetingFor("personal")).toMatch(/Personal workspace/);
  });
});
