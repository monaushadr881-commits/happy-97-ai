import { describe, it, expect } from "vitest";
import { resolveZone } from "@/lib/happy-cinematic/presence-zones";
import { summarizeRoute, contextFor } from "@/lib/happy-cinematic/workspace-awareness";
import { pickOfficeAction } from "@/lib/happy-cinematic/office-behaviour";
import { greet, dayparts } from "@/lib/happy-cinematic/relationship-greeting";
import { shouldSimplify } from "@/lib/happy-cinematic/production-quality";
import { sampleMicroHuman } from "@/lib/happy-cinematic/micro-human";
import { expressionFor, poseFor } from "@/lib/happy-cinematic/micro-expression";
import { detectQualityTier, planVfx } from "@/lib/happy-cinematic/quality";
import { resolveCamera, pickSceneFromRoute } from "@/lib/happy-cinematic/camera";
import { composeLiving } from "@/lib/happy-cinematic/living-intelligence";
import { frameBudgetMs, particleCap, shouldRunFrame } from "@/lib/happy-cinematic/performance-optimizer";
import { normalizeWorkspace } from "@/lib/happy-cinematic/workspace-context";
import { detectConfusion } from "@/lib/happy-cinematic/confusion";

describe("presence zones", () => {
  it("resolves known routes", () => {
    expect(resolveZone("/pricing").facing).toBe("left");
    expect(resolveZone("/builder").facing).toBe("right");
    expect(resolveZone("/marketplace").facing).toBe("center");
  });
  it("prefix-matches nested routes", () => {
    expect(resolveZone("/founder/dashboard").facing).toBe("left");
  });
  it("falls back to home zone", () => {
    expect(resolveZone("/unknown-route")).toEqual(resolveZone("/"));
  });
  it("prefers longest prefix", () => {
    expect(resolveZone("/founder-ai").greetingDistance).toBe(210);
  });
});

describe("workspace awareness", () => {
  it.each([
    ["/pricing", "Pricing"], ["/builder", "Website Builder"], ["/uabr", "AI Builder Runtime"],
    ["/founder", "Founder Dashboard"], ["/crm", "CRM"], ["/erp", "ERP"], ["/hrms", "HRMS"],
    ["/marketplace", "Marketplace"], ["/learning", "Learning"], ["/analytics", "Analytics"],
    ["/live", "Presence"], ["/", "Home"], ["/other", "Workspace"],
  ])("summarizes %s", (route, area) => {
    expect(summarizeRoute(route).area).toBe(area);
  });
  it("contextFor fills defaults", () => {
    const c = contextFor("/x");
    expect(c.hasErrors).toBe(false);
    expect(c.pendingDeployment).toBe(false);
  });
});

describe("office behaviour", () => {
  it("returns a valid action label", () => {
    const a = pickOfficeAction(1000, {});
    expect(typeof a).toBe("string");
  });
  it("respects cooldown by excluding recent action", () => {
    // long cooldown action should be filtered
    const last = { "posture-adjust": 1000 };
    const result = pickOfficeAction(1500, last);
    expect(result).not.toBe("posture-adjust");
  });
});

describe("relationship greeting", () => {
  it.each([
    [3, "night"], [8, "morning"], [14, "afternoon"], [19, "evening"], [22, "night"],
  ])("dayparts hour %i -> %s", (h, dp) => expect(dayparts(h)).toBe(dp));

  it("founder greeting mentions approvals & deployment", () => {
    const g = greet({ hour: 9, kind: "founder", returning: true, pendingApprovals: 3, incompleteDeployments: 1 });
    expect(g.emotion).toBe("supportive");
    expect(g.lines.join(" ")).toMatch(/3 approvals/);
    expect(g.lines.join(" ")).toMatch(/deployment/i);
  });
  it("student greeting has learning line", () => {
    const g = greet({ hour: 10, kind: "student", returning: false });
    expect(g.lines.join(" ")).toMatch(/learning/i);
  });
  it("returning guest emotion happy", () => {
    expect(greet({ hour: 10, kind: "guest", returning: true }).emotion).toBe("happy");
  });
});

describe("production quality simplifier", () => {
  it("strips heavy effects on battery/slow network", () => {
    const r = shouldSimplify({ animationsReduced: false, battery: true, slowNetwork: false, smallViewport: false });
    expect(r.smoke).toBe(false);
    expect(r.particles).toBe(false);
  });
  it("keeps reflection off small viewport", () => {
    const r = shouldSimplify({ animationsReduced: false, battery: false, slowNetwork: false, smallViewport: true });
    expect(r.reflection).toBe(false);
  });
  it("full effects on healthy device", () => {
    const r = shouldSimplify({ animationsReduced: false, battery: false, slowNetwork: false, smallViewport: false });
    expect(r).toEqual({ camera: true, smoke: true, particles: true, reflection: true });
  });
});

describe("micro-human", () => {
  it("returns bounded values", () => {
    for (const t of [0, 500, 1500, 3200, 9999]) {
      const s = sampleMicroHuman(t);
      expect(s.blinkOpen).toBeGreaterThanOrEqual(0);
      expect(s.blinkOpen).toBeLessThanOrEqual(1);
      expect(s.headTiltDeg).toBeGreaterThanOrEqual(-3);
      expect(s.headTiltDeg).toBeLessThanOrEqual(3);
    }
  });
});

describe("micro-expression + pose", () => {
  it("celebration overrides all", () => {
    expect(expressionFor({ speaking: true, listening: true, working: true, celebrating: true, concerned: true })).toBe("celebration");
  });
  it("concern beats speaking", () => {
    expect(expressionFor({ speaking: true, listening: false, working: false, celebrating: false, concerned: true })).toBe("concern");
  });
  it("default is tiny-smile", () => {
    expect(expressionFor({ speaking: false, listening: false, working: false, celebrating: false, concerned: false })).toBe("tiny-smile");
  });
  it("pose reflects walking", () => {
    expect(poseFor({ mode: "floating", speaking: false, walking: true, working: false })).toBe("walking");
  });
  it("presentation mode pose", () => {
    expect(poseFor({ mode: "presentation", speaking: false, walking: false, working: false })).toBe("presentation");
  });
});

describe("quality tier detection + vfx plan", () => {
  it("reducedMotion always low tier", () => {
    expect(detectQualityTier({ reducedMotion: true, hardwareConcurrency: 16 })).toBe("low");
  });
  it("desktop 12+ cores ultra", () => {
    expect(detectQualityTier({ hardwareConcurrency: 16, deviceMemory: 16 })).toBe("ultra");
  });
  it("mobile modest -> low", () => {
    expect(detectQualityTier({ isMobile: true, hardwareConcurrency: 2, deviceMemory: 2 })).toBe("low");
  });
  it("vfx plan disables everything for low tier", () => {
    const p = planVfx("low", false);
    expect(p.particles.enabled).toBe(false);
    expect(p.smoke.enabled).toBe(false);
  });
  it("vfx plan ultra > medium particle cap", () => {
    expect(planVfx("ultra", false).particles.cap).toBeGreaterThan(planVfx("medium", false).particles.cap);
  });
});

describe("camera", () => {
  it("presets are shape-consistent", () => {
    for (const s of ["conversation", "presentation", "builder", "founder", "meeting"] as const) {
      const p = resolveCamera(s, false);
      expect(p.dollyRange).toBeGreaterThan(0);
    }
  });
  it("reducedMotion zeros dolly & DoF", () => {
    const p = resolveCamera("conversation", true);
    expect(p.dollyRange).toBe(0);
    expect(p.depthOfField).toBe(0);
    expect(p.microMotion).toBe(false);
  });
  it.each([
    ["/happy/presentation", "presentation"], ["/founder", "founder"],
    ["/builder", "builder"], ["/uabr", "builder"],
    ["/happy/video", "meeting"], ["/anything", "conversation"],
  ])("picks scene for %s", (r, s) => expect(pickSceneFromRoute(r)).toBe(s));
});

describe("living intelligence", () => {
  it("walking beats speaking", () => {
    const s = composeLiving({ listening: false, speaking: true, walking: true, celebrating: false, concerned: false, hasNotification: false, focusedElement: false });
    expect(s.state).toBe("walking");
  });
  it("thinking when planning/executing", () => {
    expect(composeLiving({ faiosStatus: "executing", listening: false, speaking: false, walking: false, celebrating: false, concerned: false, hasNotification: false, focusedElement: false }).state).toBe("thinking");
  });
  it("concerned emotion overrides celebrating", () => {
    const s = composeLiving({ listening: false, speaking: false, walking: false, celebrating: true, concerned: true, hasNotification: false, focusedElement: false });
    expect(s.emotion).toBe("concerned");
  });
});

describe("performance optimizer", () => {
  it.each([["ultra", 16.6], ["high", 16.6], ["medium", 22], ["low", 33], ["battery", 33]])(
    "frame budget %s", (t, ms) => expect(frameBudgetMs(t as any)).toBe(ms),
  );
  it("particle cap ordering", () => {
    expect(particleCap("ultra")).toBeGreaterThan(particleCap("high"));
    expect(particleCap("battery")).toBe(0);
  });
  it("shouldRunFrame respects budget", () => {
    expect(shouldRunFrame(0, 15, "ultra")).toBe(false);
    expect(shouldRunFrame(0, 17, "ultra")).toBe(true);
  });
});

describe("workspace normalizer", () => {
  it("fills notification default", () => {
    expect(normalizeWorkspace({ route: "/x" }).notificationCount).toBe(0);
  });
  it("preserves cursor", () => {
    expect(normalizeWorkspace({ route: "/x", cursor: { x: 1, y: 2 } }).cursor).toEqual({ x: 1, y: 2 });
  });
});

describe("confusion detector", () => {
  it("flags long idle", () => {
    const r = detectConfusion(100_000, [{ tMs: 0, kind: "click" }]);
    expect(r.confused).toBe(true);
    expect(r.reason).toBe("long-idle");
  });
  it("flags repeated clicks on same target", () => {
    const signals = Array.from({ length: 6 }, (_, i) => ({ tMs: 1000 + i * 100, kind: "click" as const, target: "btn" }));
    const r = detectConfusion(2000, signals);
    expect(r.confused).toBe(true);
    expect(r.reason).toBe("repeat-click");
  });
  it("flags repeated back navigation", () => {
    const signals = Array.from({ length: 3 }, (_, i) => ({ tMs: 1000 + i * 500, kind: "back-nav" as const }));
    expect(detectConfusion(3000, signals).reason).toBe("repeat-back");
  });
  it("not confused on healthy activity", () => {
    const r = detectConfusion(5000, [{ tMs: 4000, kind: "click", target: "a" }, { tMs: 4500, kind: "click", target: "b" }]);
    expect(r.confused).toBe(false);
  });
});
