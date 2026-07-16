/**
 * R89 — Living Presence Runtime tests.
 *
 * Pure-logic assertions for route anchors, delivery choreography, and
 * persona selection. No DOM, no timers.
 */

import { describe, it, expect } from "vitest";
import { anchorFor, anchorsForRoute } from "@/lib/happy-r89/route-anchors";
import { planDelivery, totalDurationMs } from "@/lib/happy-r89/delivery-choreo";
import { decidePersona } from "@/lib/happy-r89/persona";

describe("R89 route anchors", () => {
  it("returns default br when route is unknown", () => {
    expect(anchorFor("/some/random/path", "idle")).toBe("br");
  });
  it("moves out of the way in the Builder", () => {
    expect(anchorFor("/_authenticated/builder", "idle")).toBe("bl");
  });
  it("prefers top-right for analytics dashboards", () => {
    expect(anchorsForRoute("/_authenticated/analytics").idle).toBe("tr");
  });
  it("centers HAPPY during presentation mode", () => {
    expect(anchorFor("/_authenticated/happy/presentation", "presentation")).toBe("center-bottom");
  });
});

describe("R89 delivery choreography", () => {
  it("produces a monotonic timeline", () => {
    const steps = planDelivery({ tone: "info" });
    for (let i = 1; i < steps.length; i++) expect(steps[i].at_ms).toBeGreaterThanOrEqual(steps[i - 1].at_ms);
    expect(steps[0].stage).toBe("look");
    expect(steps[steps.length - 1].stage).toBe("seated");
  });
  it("critical tone lingers longer than info", () => {
    const info = totalDurationMs(planDelivery({ tone: "info" }));
    const crit = totalDurationMs(planDelivery({ tone: "critical" }));
    expect(crit).toBeGreaterThan(info);
  });
  it("reduced motion compresses the timeline", () => {
    const full = totalDurationMs(planDelivery({ tone: "info" }));
    const rm = totalDurationMs(planDelivery({ tone: "info", reducedMotion: true }));
    expect(rm).toBeLessThan(full);
  });
});

describe("R89 persona", () => {
  it("guest for unauthenticated visitors", () => {
    expect(decidePersona({ pathname: "/", isAuthenticated: false }).persona).toBe("guest");
  });
  it("founder on founder routes", () => {
    expect(decidePersona({ pathname: "/_authenticated/founder", isAuthenticated: true }).persona).toBe("founder");
  });
  it("customer on marketplace", () => {
    expect(decidePersona({ pathname: "/_authenticated/marketplace/x", isAuthenticated: true }).persona).toBe("customer");
  });
  it("employee fallback for authenticated non-privileged routes", () => {
    expect(decidePersona({ pathname: "/_authenticated/dashboard", isAuthenticated: true }).persona).toBe("employee");
  });
  it("respects explicit role hats", () => {
    expect(decidePersona({ pathname: "/", isAuthenticated: true, roles: ["admin"] }).persona).toBe("admin");
  });
});
