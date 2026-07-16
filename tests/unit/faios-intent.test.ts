import { describe, it, expect } from "vitest";
import { detectIntent } from "@/lib/faios/intent-engine";

describe("FAIOS intent engine", () => {
  it("detects redesign homepage as medium-risk approval-required", () => {
    const r = detectIntent("please redesign home page hero");
    expect(r.intent).toBe("redesign_homepage");
    expect(r.plan.category).toBe("ui");
    expect(r.plan.requires_approval).toBe(true);
    expect(r.plan.risk).toBe("medium");
    expect(r.autoModeAllowed).toBe(false);
  });

  it("detects UI polish as low-risk auto-mode", () => {
    const r = detectIntent("improve ui spacing");
    expect(r.intent).toBe("improve_ui");
    expect(r.autoModeAllowed).toBe(true);
    expect(r.plan.requires_approval).toBe(false);
  });

  it.each([
    ["build android apk", "build_android_apk"],
    ["create android aab bundle", "build_android_aab"],
    ["build ios ipa", "build_ios_ipa"],
    ["build desktop app", "build_desktop"],
  ])("marks native build %s as blocked with external deps", (input, expected) => {
    const r = detectIntent(input);
    expect(r.intent).toBe(expected);
    expect(r.plan.blocked).toBe(true);
    expect(r.plan.blocked_reason).toBeTruthy();
    expect(r.plan.external_dependencies).toBeTruthy();
    expect(r.plan.requires_approval).toBe(true);
    // Native build never in auto-mode
    expect(r.autoModeAllowed).toBe(false);
  });

  it("android build lists keystore secret dependency", () => {
    const r = detectIntent("build android apk");
    expect(r.plan.external_dependencies?.secrets).toContain("ANDROID_KEYSTORE_BASE64");
  });

  it("ios build requires Apple developer account", () => {
    const r = detectIntent("build iphone ipa");
    expect(r.plan.external_dependencies?.accounts).toContain("Apple Developer Program");
  });

  it("deploy intent is blocked pending Founder publish flow", () => {
    const r = detectIntent("happy deploy");
    expect(r.intent).toBe("deploy");
    expect(r.plan.blocked).toBe(true);
  });

  it("rollback intent is not blocked but requires approval", () => {
    const r = detectIntent("rollback last release");
    expect(r.intent).toBe("rollback");
    expect(r.plan.blocked).toBeFalsy();
    expect(r.plan.requires_approval).toBe(true);
  });

  it("SEO / performance / animations run in auto-mode", () => {
    expect(detectIntent("optimize seo").autoModeAllowed).toBe(true);
    expect(detectIntent("improve speed").autoModeAllowed).toBe(true);
    expect(detectIntent("add animations").autoModeAllowed).toBe(true);
  });

  it("fix bugs requires approval (medium risk)", () => {
    const r = detectIntent("fix bugs on checkout");
    expect(r.intent).toBe("fix_bugs");
    expect(r.plan.requires_approval).toBe(true);
    expect(r.plan.risk).toBe("medium");
  });

  it("database optimization is high risk", () => {
    const r = detectIntent("optimize database indexes");
    expect(r.plan.risk).toBe("high");
    expect(r.plan.requires_approval).toBe(true);
  });

  it("create website intent captures raw goal in summary", () => {
    const r = detectIntent("create website for bakery");
    expect(r.intent).toBe("create_website");
    expect(r.plan.summary.toLowerCase()).toContain("bakery");
  });

  it("unmatched input falls back to explain (read-only, auto)", () => {
    const r = detectIntent("what is happening on Mars");
    expect(r.intent).toBe("explain");
    expect(r.plan.risk).toBe("low");
    expect(r.plan.requires_approval).toBe(false);
    expect(r.autoModeAllowed).toBe(true);
    expect(r.plan.steps.length).toBeGreaterThanOrEqual(1);
  });

  it("every plan has ordered steps starting at 1", () => {
    for (const input of ["improve ui", "fix bugs", "build android apk", "unknown thing"]) {
      const { plan } = detectIntent(input);
      const orders = plan.steps.map((s) => s.order);
      expect(orders[0]).toBe(1);
      for (let i = 1; i < orders.length; i++) expect(orders[i]).toBeGreaterThan(orders[i - 1]);
    }
  });
});
