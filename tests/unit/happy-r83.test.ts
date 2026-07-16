import { describe, expect, it } from "vitest";
import {
  classifyIntent,
  stripWake,
  isNaturalSilence,
  shouldInterrupt,
} from "@/lib/happy-r83/voice-intent";
import {
  classifyElement,
  describe as describeUi,
  shouldOfferHelp,
} from "@/lib/happy-r83/visual-context";
import { decideRole } from "@/lib/happy-r83/team-role";

describe("R83 voice intent", () => {
  it("strips wake phrases", () => {
    expect(stripWake("Hi HAPPY, open pricing")).toEqual({ wake: true, cleaned: "open pricing" });
    expect(stripWake("Hello Happy help me")).toEqual({ wake: true, cleaned: "help me" });
    expect(stripWake("Happy: what is this?")).toEqual({ wake: true, cleaned: "what is this?" });
    expect(stripWake("thanks")).toEqual({ wake: false, cleaned: "thanks" });
  });

  it("classifies navigate/help/explain/cancel/resume", () => {
    expect(classifyIntent("HAPPY open pricing").kind).toBe("navigate");
    expect(classifyIntent("HAPPY, help me").kind).toBe("help");
    expect(classifyIntent("HAPPY explain this section").kind).toBe("explain");
    expect(classifyIntent("stop").kind).toBe("cancel");
    expect(classifyIntent("resume").kind).toBe("resume");
    expect(classifyIntent("hi HAPPY").kind).toBe("greeting");
  });

  it("detects language switch", () => {
    const r = classifyIntent("HAPPY switch to Spanish");
    expect(r.kind).toBe("language-switch");
    expect(r.languageCode).toBe("es");
  });

  it("silence gap and interruption policy", () => {
    expect(isNaturalSilence(500)).toBe(false);
    expect(isNaturalSilence(1500)).toBe(true);
    expect(shouldInterrupt(400, Date.now() - 100, Date.now())).toBe(true);
    expect(shouldInterrupt(400, 0, Date.now())).toBe(false);
  });
});

describe("R83 visual context", () => {
  it("classifies common regions", () => {
    expect(classifyElement({ tag: "nav" })).toBe("navigation");
    expect(classifyElement({ tag: "input" })).toBe("input");
    expect(classifyElement({ tag: "button" })).toBe("button");
    expect(classifyElement({ tag: "table" })).toBe("table");
    expect(classifyElement({ tag: "form" })).toBe("form");
    expect(classifyElement({ role: "dialog" })).toBe("dialog");
    expect(classifyElement({ closestSelectors: ["section#pricing"] })).toBe("pricing");
    expect(classifyElement({ closestSelectors: [".chart"] })).toBe("chart");
    expect(classifyElement({ dataset: { happyRegion: "builder-component" } })).toBe("builder-component");
  });

  it("describe returns guidance with a label", () => {
    const v = describeUi({ tag: "input", ariaLabel: "Email" });
    expect(v.region).toBe("input");
    expect(v.label).toBe("Email");
    expect(v.guidance.length).toBeGreaterThan(0);
  });

  it("hesitation gating", () => {
    expect(shouldOfferHelp(1000, "form")).toBe(false);
    expect(shouldOfferHelp(7000, "form")).toBe(true);
    expect(shouldOfferHelp(9000, "pricing")).toBe(true);
    expect(shouldOfferHelp(5000, "unknown")).toBe(false);
    expect(shouldOfferHelp(25000, "unknown")).toBe(true);
  });
});

describe("R83 team role", () => {
  it("picks the right hat per surface", () => {
    expect(decideRole({ route: "/builder/x" }).role).toBe("ui-designer");
    expect(decideRole({ route: "/pricing" }).role).toBe("business-consultant");
    expect(decideRole({ route: "/docs/api" }).role).toBe("software-architect");
    expect(decideRole({ route: "/qa" }).role).toBe("qa-engineer");
    expect(decideRole({ route: "/founder" }).role).toBe("project-manager");
    expect(decideRole({ route: "/" }).role).toBe("office-assistant");
  });
  it("uses focus region as a fallback", () => {
    expect(decideRole({ route: "/", focusRegion: "hero" }).role).toBe("ui-designer");
    expect(decideRole({ route: "/", focusRegion: "pricing" }).role).toBe("business-consultant");
  });
  it("greeting + hint are non-empty", () => {
    const d = decideRole({ route: "/founder" });
    expect(d.greeting.length).toBeGreaterThan(0);
    expect(d.hint.length).toBeGreaterThan(0);
  });
});
