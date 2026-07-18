import { describe, it, expect } from "vitest";
import { brainPipeline, type DigitalHumanEnvelope } from "@/lib/brain/engine";

describe("R115.b — canonical Brain consolidation", () => {
  it("mirror() reflects framing with persona-aware opener", () => {
    expect(brainPipeline.mirror("show revenue now", "founder", 0.9).text).toMatch(/Founder/);
    expect(brainPipeline.mirror("hi there friend", "customer", 0.9).text).toMatch(/Got it/);
    expect(brainPipeline.mirror("hello there", undefined, 0.9).text).toMatch(/Understood/);
  });

  it("selectAgents() maps known runtimes and falls back to router", () => {
    const guess: any = { runtime: "revenue", intent: "analytics", confidence: 1, reasoning: "", alternatives: [] };
    expect(brainPipeline.selectAgents(guess)).toContain("revenue-analyst");
    expect(brainPipeline.selectAgents({ ...guess, runtime: "brain" })).toContain("router");
  });

  it("toDigitalHuman() produces a valid Digital Human envelope", () => {
    const env: DigitalHumanEnvelope = brainPipeline.toDigitalHuman("hello", "celebrate");
    expect(env.text).toBe("hello");
    expect(env.eyeContact).toBe(true);
    expect(env.emotion).toBe("celebratory");
    expect(env.gesture).toBe("celebrate");
  });
});
