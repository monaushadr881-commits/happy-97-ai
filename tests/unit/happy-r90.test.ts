/**
 * R90 — Integration assertions for the mode-aware anchor selection.
 *
 * These verify that the R89 anchor system, wired into HappyDesk, picks
 * the right corner as HAPPY moves between idle → conversation →
 * notification → presentation without recreating the runtime.
 */
import { describe, it, expect } from "vitest";
import { anchorFor } from "@/lib/happy-r89/route-anchors";
import { decidePersona } from "@/lib/happy-r89/persona";

function anchorToCorner(a: ReturnType<typeof anchorFor>) {
  switch (a) {
    case "br": case "center-bottom": return "br";
    case "bl": return "bl";
    case "tr": case "center-right": return "tr";
    case "tl": return "tl";
  }
}

describe("R90 mode-aware anchor integration", () => {
  it("Builder idle stays out of the canvas (bl)", () => {
    expect(anchorToCorner(anchorFor("/_authenticated/builder", "idle"))).toBe("bl");
  });
  it("Analytics conversation lifts to the right so charts stay visible", () => {
    expect(anchorToCorner(anchorFor("/_authenticated/analytics", "conversation"))).toBe("tr");
  });
  it("Notification on the founder surface stays top-left", () => {
    expect(anchorToCorner(anchorFor("/_authenticated/founder", "notification"))).toBe("tl");
  });
  it("Persona chip shifts by surface without touching RBAC", () => {
    expect(decidePersona({ pathname: "/_authenticated/founder", isAuthenticated: true }).persona).toBe("founder");
    expect(decidePersona({ pathname: "/_authenticated/marketplace/a", isAuthenticated: true }).persona).toBe("customer");
    expect(decidePersona({ pathname: "/", isAuthenticated: false }).persona).toBe("guest");
  });
});
