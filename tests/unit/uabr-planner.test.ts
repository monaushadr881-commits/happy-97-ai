import { describe, it, expect } from "vitest";
import { planFromPrompt } from "@/lib/uabr/planner";

describe("uabr planFromPrompt", () => {
  it("classifies a restaurant prompt", () => {
    const p = planFromPrompt("Build a restaurant with menu and orders", { modes: ["website"] });
    expect(p.industry).toBe("restaurant");
    expect(p.modules).toContain("Menu");
    expect(p.modes).toEqual(["website"]);
    expect(p.database_tables).toContain("menu");
    expect(p.steps.length).toBeGreaterThan(5);
  });

  it("falls back to custom for unknown domain", () => {
    const p = planFromPrompt("some random unclassified brief");
    expect(p.industry).toBe("custom");
    expect(p.modules).toContain("Home");
  });

  it("marks native android build as blocked", () => {
    const p = planFromPrompt("hotel booking mobile app", { modes: ["android"] });
    const nativeStep = p.steps.find((s) => s.category === "native_build");
    expect(nativeStep?.status).toBe("blocked");
    expect(p.blocked_reason).toBeTruthy();
  });

  it("scales complexity with modules & modes", () => {
    const small = planFromPrompt("portfolio", { modes: ["website"] });
    const big = planFromPrompt("full enterprise ecommerce marketplace", { modes: ["enterprise"] });
    expect(["small", "medium"]).toContain(small.complexity);
    expect(["large", "enterprise"]).toContain(big.complexity);
    expect(big.estimated_credits).toBeGreaterThan(small.estimated_credits);
  });

  it("deduplicates external deps", () => {
    const p = planFromPrompt("everything", { modes: ["android", "ios", "desktop"] });
    const secrets = p.external_dependencies.secrets ?? [];
    expect(new Set(secrets).size).toBe(secrets.length);
  });
});
