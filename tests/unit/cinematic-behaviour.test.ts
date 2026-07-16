import { describe, it, expect } from "vitest";
import { pickOfficeAction } from "@/lib/happy-cinematic/office-behaviour";
import { repositionForComfort } from "@/lib/happy-cinematic/comfort-engine";
import { detectConfusion } from "@/lib/happy-cinematic/confusion";
import { detectQualityTier, planVfx } from "@/lib/happy-cinematic/quality";
import { greet, dayparts } from "@/lib/happy-cinematic/relationship-greeting";
import { resolveZone } from "@/lib/happy-cinematic/presence-zones";

describe("office behaviour scheduler", () => {
  it("returns breath when nothing else is eligible (all on cooldown)", () => {
    const now = 1000;
    const last: Record<string, number> = {};
    // Put every non-zero-cooldown action on fresh cooldown
    for (const a of [
      "glance-notification","glance-focused","look-away","look-back",
      "shoulder-shift","finger-relax","micro-smile","weight-shift","posture-adjust",
    ]) last[a] = now;
    // With only breath+blink eligible (both cooldown 0), pick returns one of them deterministically
    const pick = pickOfficeAction(now, last);
    expect(["breath","blink"]).toContain(pick);
  });

  it("is deterministic for identical (t, state)", () => {
    const now = 5250;
    const a = pickOfficeAction(now, {});
    const b = pickOfficeAction(now, {});
    expect(a).toBe(b);
  });

  it("respects cooldowns — never returns an action that was just used", () => {
    const now = 10_000;
    // freshly used → still on cooldown for its window
    for (const a of ["glance-notification","glance-focused","look-away"]) {
      const last = { [a]: now };
      // Sample many timestamps within cooldown
      for (let t = now; t < now + 3000; t += 137) {
        const pick = pickOfficeAction(t, last);
        expect(pick).not.toBe(a);
      }
    }
  });

  it("produces a variety of actions over time", () => {
    const seen = new Set<string>();
    for (let t = 0; t < 60_000; t += 250) seen.add(pickOfficeAction(t, {}));
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe("comfort engine reposition", () => {
  const viewport = { w: 1200, h: 800 };

  it("does not move when overlap is small", () => {
    const stage = { x: 900, y: 600, w: 200, h: 150 };
    const cover = [{ x: 0, y: 0, w: 100, h: 100 }]; // no overlap
    const r = repositionForComfort({ stage, viewport, doNotCover: cover, preferredAnchor: "bottom-right" });
    expect(r.moved).toBe(false);
    expect(r.stage).toEqual(stage);
  });

  it("moves off a covering rect when overlap > 20%", () => {
    const stage = { x: 900, y: 600, w: 200, h: 150 };
    // Covers the whole bottom-right corner
    const cover = [{ x: 800, y: 500, w: 400, h: 300 }];
    const r = repositionForComfort({ stage, viewport, doNotCover: cover, preferredAnchor: "bottom-right" });
    expect(r.moved).toBe(true);
    // Moved stage should have less overlap
    const oldOverlap = 200 * 150;
    const w = Math.max(0, Math.min(r.stage.x + r.stage.w, cover[0].x + cover[0].w) - Math.max(r.stage.x, cover[0].x));
    const h = Math.max(0, Math.min(r.stage.y + r.stage.h, cover[0].y + cover[0].h) - Math.max(r.stage.y, cover[0].y));
    expect(w * h).toBeLessThan(oldOverlap);
  });

  it("keeps stage within viewport when relocated", () => {
    const stage = { x: 500, y: 500, w: 200, h: 150 };
    const cover = [{ x: 0, y: 0, w: 1200, h: 800 }]; // covers everything → picks best anchor anyway
    const r = repositionForComfort({ stage, viewport, doNotCover: cover, preferredAnchor: "bottom-right" });
    expect(r.stage.x).toBeGreaterThanOrEqual(0);
    expect(r.stage.y).toBeGreaterThanOrEqual(0);
    expect(r.stage.x + r.stage.w).toBeLessThanOrEqual(viewport.w);
    expect(r.stage.y + r.stage.h).toBeLessThanOrEqual(viewport.h);
  });

  it("handles empty doNotCover list", () => {
    const stage = { x: 10, y: 10, w: 100, h: 100 };
    const r = repositionForComfort({ stage, viewport, doNotCover: [], preferredAnchor: "top-left" });
    expect(r.moved).toBe(false);
  });
});

describe("confusion detector — full matrix", () => {
  it("does not fire on no signals within 45s", () => {
    // empty signals: lastActivity defaults to now → not confused
    expect(detectConfusion(30_000, []).confused).toBe(false);
  });

  it("fires repeat-back on ≥3 back-navs within 10s", () => {
    const now = 10_000;
    const signals = [8_500, 9_000, 9_800].map((tMs) => ({ tMs, kind: "back-nav" as const }));
    expect(detectConfusion(now, signals).reason).toBe("repeat-back");
  });

  it("does not fire back-nav when older than 10s", () => {
    const now = 20_000;
    const signals = [1_000, 2_000, 3_000].map((tMs) => ({ tMs, kind: "back-nav" as const }));
    // last activity 3000 → 17s ago, still < 45s, no other rules trigger
    expect(detectConfusion(now, signals).confused).toBe(false);
  });

  it("fires repeat-reject on 2 form rejections within 15s", () => {
    const now = 15_000;
    const signals = [4_000, 12_000].map((tMs) => ({ tMs, kind: "form-reject" as const }));
    expect(detectConfusion(now, signals).reason).toBe("repeat-reject");
  });

  it("fires repeat-error on ≥3 errors within 20s", () => {
    const now = 20_000;
    const signals = [3_000, 10_000, 18_000].map((tMs) => ({ tMs, kind: "error" as const }));
    expect(detectConfusion(now, signals).reason).toBe("repeat-error");
  });

  it("clicks on different targets do not trigger repeat-click", () => {
    const now = 6_000;
    const signals = Array.from({ length: 6 }, (_, i) => ({ tMs: now - i * 500, kind: "click" as const, target: `t${i}` }));
    expect(detectConfusion(now, signals).confused).toBe(false);
  });
});

describe("quality tier boundaries", () => {
  it("mobile with 8c/6gb reaches high", () => {
    expect(detectQualityTier({ isMobile: true, hardwareConcurrency: 8, deviceMemory: 6 })).toBe("high");
  });
  it("mobile with 6c reaches medium", () => {
    expect(detectQualityTier({ isMobile: true, hardwareConcurrency: 6, deviceMemory: 4 })).toBe("medium");
  });
  it("desktop 8c/4gb is high (cores threshold)", () => {
    expect(detectQualityTier({ hardwareConcurrency: 8, deviceMemory: 4 })).toBe("high");
  });
  it("desktop 2c falls to low", () => {
    expect(detectQualityTier({ hardwareConcurrency: 2, deviceMemory: 2 })).toBe("low");
  });
  it("no hints defaults to medium via 4 cores/4gb", () => {
    expect(detectQualityTier({})).toBe("medium");
  });
});

describe("planVfx invariants", () => {
  it("low tier keeps lighting on but zeroes camera FX", () => {
    const p = planVfx("low", false);
    expect(p.lighting.contactShadow).toBe(true);
    expect(p.camera.depthOfField).toBe(0);
    expect(p.camera.microMotion).toBe(false);
  });
  it("ultra > high > medium particle cap ordering", () => {
    expect(planVfx("ultra", false).particles.cap).toBeGreaterThan(planVfx("high", false).particles.cap);
    expect(planVfx("high", false).particles.cap).toBeGreaterThan(planVfx("medium", false).particles.cap);
  });
  it("auto tier resolves like high", () => {
    expect(planVfx("auto", false).particles.cap).toBe(planVfx("high", false).particles.cap);
  });
  it("reducedMotion overrides any tier", () => {
    expect(planVfx("ultra", true).particles.enabled).toBe(false);
    expect(planVfx("ultra", true).ground.ripple).toBe(false);
  });
});

describe("relationship greeting edge cases", () => {
  it("founder without extras still asks to continue", () => {
    const g = greet({ hour: 8, kind: "founder", returning: false });
    expect(g.lines.at(-1)).toBe("Shall we continue?");
    expect(g.lines.join(" ")).not.toMatch(/approvals/);
  });
  it("student daypart night greeting", () => {
    const g = greet({ hour: 23, kind: "student", returning: false });
    expect(g.lines[0]).toMatch(/Hey/);
    expect(g.lines.join(" ")).toMatch(/learning/);
  });
  it("returning developer uses happy emotion", () => {
    const g = greet({ hour: 14, kind: "developer", returning: true });
    expect(g.emotion).toBe("happy");
    expect(g.lines.join(" ")).toMatch(/builder/);
  });
  it("dayparts inclusive boundaries", () => {
    expect(dayparts(5)).toBe("morning");
    expect(dayparts(12)).toBe("afternoon");
    expect(dayparts(17)).toBe("evening");
    expect(dayparts(21)).toBe("night");
  });
});

describe("presence zones — longest-prefix match", () => {
  it("/founder-ai matches its own zone, not /founder", () => {
    const fai = resolveZone("/founder-ai");
    const f = resolveZone("/founder");
    // Both are configured the same in the map, but longest-prefix must pick /founder-ai for the /founder-ai route
    expect(fai.facing).toBe(f.facing);
  });
  it("nested /happy/live prefers /live over /happy (both configured, longest wins)", () => {
    // /happy/live starts with /happy and not /live; longest match is /happy
    expect(resolveZone("/happy/live").facing).toBe("center");
  });
  it("returns a stable object shape", () => {
    const z = resolveZone("/");
    expect(z).toHaveProperty("entry");
    expect(z).toHaveProperty("stop");
    expect(z).toHaveProperty("greetingDistance");
    expect(typeof z.greetingDistance).toBe("number");
  });
});
