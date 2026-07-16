import { describe, it, expect } from "vitest";
import { composeLivingCore } from "@/lib/happy-living/core";
import { shouldSpeak, proactiveLine } from "@/lib/happy-living/proactive";
import { planEntry, planExit } from "@/lib/happy-living/entry-exit";
import { describeContext } from "@/lib/happy-living/visual-understanding";

describe("happy-living core", () => {
  it("engaged when conversing", () => {
    const s = composeLivingCore({ invoked: true, conversing: true, userIdleMs: 0, reducedMotion: false, tier: "high" });
    expect(s.mode).toBe("engaged");
    expect(s.eyeContact).toBe(true);
    expect(s.walking).toBe(false);
  });
  it("walking-in when invoked but not conversing", () => {
    const s = composeLivingCore({ invoked: true, conversing: false, userIdleMs: 0, reducedMotion: false, tier: "high" });
    expect(s.mode).toBe("walking-in");
    expect(s.walking).toBe(true);
    expect(s.greetingArmed).toBe(true);
  });
  it("office when idle long", () => {
    const s = composeLivingCore({ invoked: false, conversing: false, userIdleMs: 60_000, reducedMotion: false, tier: "high" });
    expect(s.mode).toBe("office");
  });
  it("attentive when short idle", () => {
    const s = composeLivingCore({ invoked: false, conversing: false, userIdleMs: 1000, reducedMotion: false, tier: "high" });
    expect(s.mode).toBe("attentive");
    expect(s.eyeContact).toBe(true);
  });
  it("no blink when reduced motion", () => {
    const s = composeLivingCore({ invoked: false, conversing: true, userIdleMs: 0, reducedMotion: true, tier: "low" });
    expect(s.blink).toBe(false);
    expect(s.walking).toBe(false);
  });
  it("arms closing when engaged and idle > 12s", () => {
    const s = composeLivingCore({ invoked: false, conversing: true, userIdleMs: 15_000, reducedMotion: false, tier: "high" });
    expect(s.closingArmed).toBe(true);
  });
});

describe("proactive signal gate", () => {
  it("does not speak while conversing", () => {
    expect(shouldSpeak({ signal: "task-pending", alreadyDelivered: [], userIdleMs: 10_000, conversing: true })).toBe(false);
  });
  it("does not repeat a delivered signal", () => {
    expect(shouldSpeak({ signal: "task-pending", alreadyDelivered: ["task-pending"], userIdleMs: 10_000, conversing: false })).toBe(false);
  });
  it("requires >3s idle before speaking", () => {
    expect(shouldSpeak({ signal: "task-pending", alreadyDelivered: [], userIdleMs: 1000, conversing: false })).toBe(false);
    expect(shouldSpeak({ signal: "task-pending", alreadyDelivered: [], userIdleMs: 4000, conversing: false })).toBe(true);
  });
  it("returns a non-empty line for every signal", () => {
    for (const s of ["deployment-completed", "project-ready", "task-pending", "opportunity-found", "performance-improved"] as const) {
      expect(proactiveLine(s).length).toBeGreaterThan(5);
    }
  });
});

describe("entry/exit choreography", () => {
  it("entry ends with greeting", () => {
    const steps = planEntry();
    expect(steps.at(-1)?.action).toBe("greet");
    expect(steps.every((s, i, arr) => i === 0 || arr[i - 1].at_ms <= s.at_ms)).toBe(true);
  });
  it("exit ends with returning to office mode", () => {
    const steps = planExit();
    expect(steps.at(-1)?.action).toBe("resume-office-mode");
  });
});

describe("visual context hint", () => {
  it("prefers section over component", () => {
    expect(describeContext({ section: "Pricing", component: "Card" })).toContain("Pricing");
  });
  it("returns null for empty ctx", () => {
    expect(describeContext({})).toBeNull();
  });
  it("falls back to route", () => {
    expect(describeContext({ route: "/founder" })).toContain("/founder");
  });
});
