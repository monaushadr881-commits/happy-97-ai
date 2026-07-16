import { describe, it, expect } from "vitest";
import { planFromPrompt } from "@/lib/uabr/planner";
import { NATIVE_BLOCK } from "@/lib/uabr/contracts";

describe("uabr planner — industry coverage", () => {
  it.each([
    ["hotel booking site", "hotel"],
    ["hospital patient portal", "hospital"],
    ["laboratory test tracker", "laboratory"],
    ["school student portal", "school"],
    ["retail pos system", "retail"],
    ["wholesale distributor app", "wholesale"],
    ["manufacturing shop-floor tracker", "manufacturing"],
    ["construction site diary", "construction"],
    ["real estate listings", "real_estate"],
    ["finance loan portal", "finance"],
    ["insurance policy issuer", "insurance"],
    ["bank statements app", "banking"],
    ["logistics fleet tracker", "logistics"],
    ["travel package builder", "travel"],
    ["salon appointment booking", "salon"],
    ["gym membership app", "gym"],
    ["event ticketing", "event_management"],
    ["multi-vendor marketplace", "marketplace"],
    ["ecommerce store online", "ecommerce"],
    ["ngo donation tracker", "ngo"],
    ["government citizen services", "government"],
    ["portfolio site", "portfolio"],
    ["ai saas platform", "ai_saas"],
    ["corporate company website", "corporate"],
  ])("classifies %s as %s", (prompt, industry) => {
    const p = planFromPrompt(prompt);
    expect(p.industry).toBe(industry);
    expect(p.modules.length).toBeGreaterThan(0);
    expect(p.features.length).toBeGreaterThan(0);
  });
});

describe("uabr planner — modes & steps", () => {
  it("website mode adds a web deployment step", () => {
    const p = planFromPrompt("portfolio", { modes: ["website"] });
    expect(p.steps.some((s) => s.category === "deployment")).toBe(true);
  });

  it("iOS mode adds ios native_build + app store publishing (both blocked)", () => {
    const p = planFromPrompt("mobile app for gym", { modes: ["ios"] });
    const nb = p.steps.filter((s) => s.category === "native_build");
    const pub = p.steps.filter((s) => s.category === "publishing");
    expect(nb.length).toBe(1);
    expect(pub.length).toBe(1);
    expect(nb[0].blocked_reason).toBe(NATIVE_BLOCK.ios.reason);
    expect(pub[0].blocked_reason).toMatch(/Apple/);
  });

  it("complete mode fans out android+ios+web deployments", () => {
    const p = planFromPrompt("event ticketing", { modes: ["complete"] });
    const cats = p.steps.map((s) => s.category);
    expect(cats.filter((c) => c === "native_build").length).toBeGreaterThanOrEqual(2);
    expect(cats).toContain("deployment");
  });

  it("enterprise mode adds desktop packaging (blocked)", () => {
    const p = planFromPrompt("bank internal ops", { modes: ["enterprise"] });
    const desktop = p.steps.find((s) => s.title.toLowerCase().includes("desktop"));
    expect(desktop?.status).toBe("blocked");
    expect(desktop?.blocked_reason).toBe(NATIVE_BLOCK.desktop.reason);
  });

  it("infers modes from prompt when opts.modes omitted", () => {
    expect(planFromPrompt("build a pwa for salon").modes).toEqual(["pwa"]);
    expect(planFromPrompt("android app for gym").modes).toEqual(["android"]);
    expect(planFromPrompt("mobile app for restaurant").modes).toEqual(["android","ios","pwa"]);
  });

  it("defaults to website when nothing matches", () => {
    expect(planFromPrompt("some vague thing").modes).toEqual(["website"]);
  });

  it("steps have strictly increasing order numbers starting at 1", () => {
    const p = planFromPrompt("hospital patient portal", { modes: ["complete"] });
    const orders = p.steps.map((s) => s.order);
    expect(orders[0]).toBe(1);
    for (let i = 1; i < orders.length; i++) expect(orders[i]).toBe(orders[i - 1] + 1);
  });
});

describe("uabr planner — output shape & derivations", () => {
  it("api_endpoints cover CRUD per module", () => {
    const p = planFromPrompt("gym", { modes: ["website"] });
    const module = p.modules[0].toLowerCase();
    expect(p.api_endpoints).toContain(`GET /api/${module}`);
    expect(p.api_endpoints).toContain(`POST /api/${module}`);
    expect(p.api_endpoints).toContain(`PATCH /api/${module}/:id`);
    expect(p.api_endpoints).toContain(`DELETE /api/${module}/:id`);
  });

  it("pages include admin/dashboard/settings/auth", () => {
    const p = planFromPrompt("portfolio", { modes: ["website"] });
    for (const path of ["/admin", "/dashboard", "/settings", "/auth"]) {
      expect(p.pages).toContain(path);
    }
  });

  it("project name derives from prompt words when possible", () => {
    const p = planFromPrompt("Sunrise Cafe booking system", { modes: ["website"] });
    // Two leading title-cased alpha words → 'SunriseCafe'
    expect(p.project_name).toBe("SunriseCafe");
  });

  it("domain slug is derived from project_name", () => {
    const p = planFromPrompt("Sunrise Cafe booking", { modes: ["website"] });
    expect(p.domain).toMatch(/^[a-z0-9-]+\.app$/);
  });

  it("complexity classification scales monotonically", () => {
    const small = planFromPrompt("portfolio", { modes: ["website"] }).complexity;
    const large = planFromPrompt("hospital patient portal", { modes: ["complete"] }).complexity;
    const rank = { small: 0, medium: 1, large: 2, enterprise: 3 } as const;
    expect(rank[large]).toBeGreaterThanOrEqual(rank[small]);
  });

  it("timeline_days & credits both scale with complexity", () => {
    // portfolio (4 modules) + 1 mode → score 6 → medium
    const small = planFromPrompt("portfolio", { modes: ["website"] });
    // hospital (7 modules) + 2 modes → score 11 → large
    const large = planFromPrompt("hospital patient portal", { modes: ["android", "ios"] });
    expect(large.complexity).toBe("large");
    expect(large.timeline_days).toBeGreaterThan(small.timeline_days);
    expect(large.estimated_credits).toBeGreaterThan(small.estimated_credits);
  });

  it("external_dependencies collect from every blocked mode without duplicates", () => {
    const p = planFromPrompt("app", { modes: ["android", "ios", "desktop"] });
    const secrets = p.external_dependencies.secrets ?? [];
    // Android keystore + Apple + MSIX/dev cert all present, still unique
    expect(secrets).toContain("ANDROID_KEYSTORE_BASE64");
    expect(secrets).toContain("APPLE_APP_SPECIFIC_PASSWORD");
    expect(secrets).toContain("MSIX_SIGNING_CERT");
    expect(new Set(secrets).size).toBe(secrets.length);
  });

  it("website-only plan has no blocked steps and no blocked_reason", () => {
    const p = planFromPrompt("portfolio", { modes: ["website"] });
    expect(p.steps.every((s) => s.status !== "blocked")).toBe(true);
    expect(p.blocked_reason).toBeUndefined();
  });

  it("plan always exposes security & accessibility & seo & performance defaults", () => {
    const p = planFromPrompt("portfolio", { modes: ["website"] });
    expect(p.security.some((s) => s.includes("RLS"))).toBe(true);
    expect(p.accessibility).toContain("WCAG AA");
    expect(p.seo.some((s) => s.toLowerCase().includes("sitemap"))).toBe(true);
    expect(p.performance.some((s) => s.toLowerCase().includes("react query"))).toBe(true);
  });
});
