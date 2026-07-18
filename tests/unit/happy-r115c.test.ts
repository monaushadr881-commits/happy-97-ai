import { describe, it, expect } from "vitest";
import { brainPipeline } from "@/lib/brain/engine";

const g = (over: any = {}) => ({
  intent: "analytics", runtime: "analytics", action: "revenue_summary",
  confidence: 0.9, reasoning: "", alternatives: [], ...over,
});

describe("R115.c — runBrain intelligence upgrades", () => {
  it("mirror() flags clarification when confidence is low or input too short", () => {
    const low = brainPipeline.mirror("do it", "guest", 0.2);
    expect(low.needsClarification).toBe(true);
    expect(low.clarification).toBeTruthy();
    const ok = brainPipeline.mirror("show me revenue for this quarter", "guest", 0.9);
    expect(ok.needsClarification).toBe(false);
  });

  it("pickReasoningMode chooses founder / developer / business / fast / deep", () => {
    expect(brainPipeline.pickReasoningMode(g(), { input: "", source: "chat", company_id: "c", founder_mode: true } as any)).toBe("founder");
    expect(brainPipeline.pickReasoningMode(g({ runtime: "builder" }), { input: "", source: "chat", company_id: "c" } as any)).toBe("developer");
    expect(brainPipeline.pickReasoningMode(g({ intent: "finance" }), { input: "", source: "chat", company_id: "c" } as any)).toBe("business");
    expect(brainPipeline.pickReasoningMode(g({ confidence: 0.9, intent: "conversation", runtime: "brain" }), { input: "", source: "chat", company_id: "c" } as any)).toBe("fast");
    expect(brainPipeline.pickReasoningMode(g({ confidence: 0.5, intent: "conversation", runtime: "brain" }), { input: "", source: "chat", company_id: "c" } as any)).toBe("deep");
  });

  it("pickPlannerTier scales with step count", () => {
    expect(brainPipeline.pickPlannerTier(g({ intent: "conversation" }), 0)).toBe("none");
    expect(brainPipeline.pickPlannerTier(g(), 1)).toBe("small");
    expect(brainPipeline.pickPlannerTier(g(), 3)).toBe("large");
    expect(brainPipeline.pickPlannerTier(g(), 5)).toBe("multi_agent");
  });

  it("pickMemoryScopes and pickKnowledgeScopes always include base scopes", () => {
    const m = brainPipeline.pickMemoryScopes(g(), { input: "", source: "chat", company_id: "c", workspace_id: "w", founder_mode: true } as any);
    expect(m).toEqual(expect.arrayContaining(["conversation", "workspace", "company", "founder", "learning"]));
    const k = brainPipeline.pickKnowledgeScopes(g(), { input: "", source: "chat", company_id: "c", workspace_id: "w" } as any);
    expect(k).toEqual(expect.arrayContaining(["internal", "workspace", "company"]));
  });

  it("pickDigitalHumanMode maps persona + intent + denial to modes", () => {
    expect(brainPipeline.pickDigitalHumanMode(g(), { input: "", source: "chat", company_id: "c" } as any, true)).toBe("warn");
    expect(brainPipeline.pickDigitalHumanMode(g(), { input: "", source: "digital_human", company_id: "c", persona: "customer" } as any, false)).toBe("friend");
    expect(brainPipeline.pickDigitalHumanMode(g(), { input: "", source: "chat", company_id: "c", persona: "founder" } as any, false)).toBe("consultant");
    expect(brainPipeline.pickDigitalHumanMode(g({ action: "forecast" }), { input: "", source: "chat", company_id: "c" } as any, false)).toBe("presentation");
    expect(brainPipeline.pickDigitalHumanMode(g({ runtime: "builder", action: "generate_website" }), { input: "", source: "chat", company_id: "c" } as any, false)).toBe("roadmap");
  });

  it("toDigitalHuman produces mode-specific voice/expression + optional payloads", () => {
    const r = brainPipeline.toDigitalHuman("plan", "roadmap");
    expect(r.mode).toBe("roadmap");
    expect(r.roadmap).toBeTruthy();
    expect(r.voice?.rate).toBeGreaterThan(0);
    const p = brainPipeline.toDigitalHuman("slide", "presentation");
    expect(p.presentation?.slides?.[0]).toBe("slide");
    const w = brainPipeline.toDigitalHuman("note", "whiteboard");
    expect(w.whiteboard?.[0]?.content).toBe("note");
  });

  it("learn() surfaces lessons, gaps, candidates, and suggestions", () => {
    const out = brainPipeline.learn(
      "weird ask",
      g({ confidence: 0.3, intent: "unknown", action: undefined }),
      [{ status: "failed" }, { denied: true }],
      [{ title: "Cash below payables", priority: "high" }],
    );
    expect(out.lessons.length).toBeGreaterThan(0);
    expect(out.knowledgeGaps.length).toBeGreaterThan(0);
    expect(out.suggestions).toContain("Cash below payables");
  });
});
