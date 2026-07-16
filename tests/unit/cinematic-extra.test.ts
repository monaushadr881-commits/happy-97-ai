import { describe, expect, it } from "vitest";
import { resolveZone } from "@/lib/happy-cinematic/presence-zones";
import { dayparts, greet } from "@/lib/happy-cinematic/relationship-greeting";
import { detectQualityTier, planVfx } from "@/lib/happy-cinematic/quality";
import { resolveCamera, pickSceneFromRoute } from "@/lib/happy-cinematic/camera";
import { planEntry, planWalk } from "@/lib/happy-cinematic/choreography";
import { detectConfusion } from "@/lib/happy-cinematic/confusion";
import { summarizeRoute, contextFor } from "@/lib/happy-cinematic/workspace-awareness";
import { normalizeWorkspace } from "@/lib/happy-cinematic/workspace-context";
import { shouldSimplify } from "@/lib/happy-cinematic/production-quality";
import { frameBudgetMs, particleCap } from "@/lib/happy-cinematic/performance-optimizer";

describe("presence zones", () => {
  it("returns known zone for /pricing", () => {
    expect(resolveZone("/pricing").facing).toBe("left");
  });
  it("prefix-matches nested routes", () => {
    expect(resolveZone("/builder/projects/xyz").facing).toBe("right");
  });
  it("falls back to home", () => {
    expect(resolveZone("/nonexistent")).toEqual(resolveZone("/"));
  });
});

describe("relationship greeting", () => {
  it("day parts", () => {
    expect(dayparts(3)).toBe("night");
    expect(dayparts(8)).toBe("morning");
    expect(dayparts(14)).toBe("afternoon");
    expect(dayparts(19)).toBe("evening");
    expect(dayparts(23)).toBe("night");
  });
  it("founder returning with approvals", () => {
    const g = greet({ hour: 9, kind: "founder", returning: true, pendingApprovals: 3, incompleteDeployments: 1, lastArea: "Analytics" });
    expect(g.emotion).toBe("supportive");
    expect(g.lines.join(" ")).toMatch(/3 approvals/);
    expect(g.lines.join(" ")).toMatch(/Analytics/);
  });
  it("guest first-time is professional", () => {
    const g = greet({ hour: 10, kind: "guest", returning: false });
    expect(g.emotion).toBe("professional");
  });
});

describe("quality tier", () => {
  it("reducedMotion forces low", () => {
    expect(detectQualityTier({ reducedMotion: true, hardwareConcurrency: 16, deviceMemory: 16 })).toBe("low");
  });
  it("ultra desktop", () => {
    expect(detectQualityTier({ hardwareConcurrency: 16, deviceMemory: 16 })).toBe("ultra");
  });
  it("mobile scales down", () => {
    expect(detectQualityTier({ hardwareConcurrency: 4, deviceMemory: 4, isMobile: true })).toBe("low");
  });
});

describe("vfx planning", () => {
  it("low tier disables particles", () => {
    const p = planVfx("low", false);
    expect(p.particles.enabled).toBe(false);
  });
  it("ultra tier enables everything", () => {
    const p = planVfx("ultra", false);
    expect(p.particles.cap).toBe(512);
    expect(p.camera.focusShift).toBe(true);
  });
});

describe("camera presets", () => {
  it("reducedMotion zeroes dolly", () => {
    expect(resolveCamera("conversation", true).dollyRange).toBe(0);
  });
  it("scene picker", () => {
    expect(pickSceneFromRoute("/builder/x")).toBe("builder");
    expect(pickSceneFromRoute("/founder")).toBe("founder");
    expect(pickSceneFromRoute("/happy/presentation")).toBe("presentation");
    expect(pickSceneFromRoute("/")).toBe("conversation");
  });
});

describe("choreography", () => {
  it("full entry sequence", () => {
    const p = planEntry({ qualityTier: "high", reducedMotion: false });
    expect(p.sequence).toContain("walk-in");
    expect(p.durationMs).toBeGreaterThan(2000);
  });
  it("reducedMotion collapses walk to single step", () => {
    const w = planWalk([0, 0], [1000, 1000], true);
    expect(w.steps).toBe(1);
    expect(w.cadenceMs).toBe(0);
  });
  it("normal walk steps scale with distance", () => {
    const w = planWalk([0, 0], [600, 0], false);
    expect(w.steps).toBeGreaterThan(4);
    expect(w.steps).toBeLessThanOrEqual(14);
  });
});

describe("confusion detector", () => {
  it("no signals -> long-idle", () => {
    const r = detectConfusion(100_000, []);
    expect(r.confused).toBe(true);
    expect(r.reason).toBe("long-idle");
  });
  it("repeated same-target clicks", () => {
    const now = 10_000;
    const signals = Array.from({ length: 6 }, (_, i) => ({ tMs: now - i * 500, kind: "click" as const, target: "btn" }));
    const r = detectConfusion(now, signals);
    expect(r.reason).toBe("repeat-click");
  });
  it("clean session is fine", () => {
    const now = 10_000;
    const r = detectConfusion(now, [{ tMs: now - 1000, kind: "click", target: "a" }]);
    expect(r.confused).toBe(false);
  });
});

describe("workspace awareness", () => {
  it("summarizes route", () => {
    expect(summarizeRoute("/pricing").area).toBe("Pricing");
    expect(summarizeRoute("/unknown").area).toBe("Workspace");
  });
  it("contextFor defaults", () => {
    const c = contextFor("/", {});
    expect(c.hasErrors).toBe(false);
    expect(c.pendingDeployment).toBe(false);
  });
  it("normalizeWorkspace fills defaults", () => {
    expect(normalizeWorkspace({ route: "/" }).notificationCount).toBe(0);
  });
});

describe("production quality flags", () => {
  it("battery strips everything", () => {
    const s = shouldSimplify({ animationsReduced: false, battery: true, slowNetwork: false, smallViewport: false });
    expect(s.particles).toBe(false);
    expect(s.camera).toBe(false);
  });
  it("small viewport disables reflection", () => {
    const s = shouldSimplify({ animationsReduced: false, battery: false, slowNetwork: false, smallViewport: true });
    expect(s.reflection).toBe(false);
    expect(s.particles).toBe(true);
  });
});

describe("performance optimizer", () => {
  it("frame budgets", () => {
    expect(frameBudgetMs("ultra")).toBeCloseTo(16.6);
    expect(frameBudgetMs("low")).toBe(33);
  });
  it("particle cap tiers", () => {
    expect(particleCap("ultra")).toBeGreaterThan(particleCap("medium"));
    expect(particleCap("battery")).toBeLessThanOrEqual(particleCap("low"));
  });
});
