import { describe, it, expect } from "vitest";
import { buildHappySystemPrompt } from "@/lib/happy-chat.functions";

describe("R93 — HAPPY multi-turn chat", () => {
  it("system prompt includes route, persona, role", () => {
    const p = buildHappySystemPrompt({ route: "/dashboard", persona: "founder", role: "consultant" });
    expect(p).toContain("/dashboard");
    expect(p).toContain("founder");
    expect(p).toContain("consultant");
  });

  it("system prompt applies safe defaults", () => {
    const p = buildHappySystemPrompt({});
    expect(p).toContain("employee");
    expect(p).toContain("assistant");
    expect(p).toContain("/");
  });
});
