import { describe, it, expect } from "vitest";
import { buildHappySystemPrompt } from "@/lib/happy-chat.functions";

describe("R92 HAPPY chat prompt", () => {
  it("mentions HAPPY identity and stays first-person", () => {
    const p = buildHappySystemPrompt({});
    expect(p).toMatch(/HAPPY/);
    expect(p).toMatch(/first person/);
  });
  it("includes route, persona, and role hat when provided", () => {
    const p = buildHappySystemPrompt({ route: "/_authenticated/founder", persona: "founder", role: "cto" });
    expect(p).toContain("/_authenticated/founder");
    expect(p).toContain("founder");
    expect(p).toContain("cto");
  });
  it("bounds default reply length in the prompt", () => {
    expect(buildHappySystemPrompt({})).toMatch(/<= 3 sentences/);
  });
});
