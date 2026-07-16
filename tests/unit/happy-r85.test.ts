import { describe, it, expect } from "vitest";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  mergePreferences,
  suggestionCooldownMs,
  greetingLead,
} from "@/lib/happy-r85/preferences";
import {
  deskRectFor,
  rectsOverlap,
  pickSafeCorner,
} from "@/lib/happy-r85/collision";
import { pickIndicator, indicatorLabel } from "@/lib/happy-r85/indicators";
import { pickInitiative } from "@/lib/happy-r80/initiative-ai";

describe("R85 preferences", () => {

  it("returns defaults when no storage is available (node env)", () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("mergePreferences applies patches without mutating input", () => {
    const next = mergePreferences(DEFAULT_PREFERENCES, { frequency: "quiet", language: "fr-FR" });
    expect(next.frequency).toBe("quiet");
    expect(next.language).toBe("fr-FR");
    expect(DEFAULT_PREFERENCES.frequency).toBe("balanced");
  });

  it("savePreferences is a no-op without storage and does not throw", () => {
    expect(() => savePreferences(DEFAULT_PREFERENCES)).not.toThrow();
  });

  it("scales cooldown by interaction frequency", () => {
    expect(suggestionCooldownMs("quiet")).toBeGreaterThan(suggestionCooldownMs("balanced"));
    expect(suggestionCooldownMs("balanced")).toBeGreaterThan(suggestionCooldownMs("chatty"));
  });

  it("shapes greeting to style + daypart", () => {
    expect(greetingLead("professional", 9)).toMatch(/morning/);
    expect(greetingLead("casual", 20)).toMatch(/evening/i);
    expect(greetingLead("warm", 2)).toMatch(/late/);
  });
});

describe("R85 collision", () => {
  const vp = { w: 1280, h: 800 };

  it("keeps preferred corner when nothing overlaps", () => {
    expect(pickSafeCorner("br", vp, [])).toBe("br");
  });

  it("moves off a corner when a dialog covers it", () => {
    const dr = deskRectFor("br", vp);
    const obstacle = { x: dr.x - 20, y: dr.y - 20, w: dr.w + 40, h: dr.h + 40 };
    expect(rectsOverlap(dr, obstacle)).toBe(true);
    expect(pickSafeCorner("br", vp, [obstacle])).not.toBe("br");
  });

  it("prefers original corner on true tie (no obstacles)", () => {
    expect(pickSafeCorner("tl", vp, [])).toBe("tl");
  });
});

describe("R85 indicators", () => {
  const base = { listening: false, delivering: false, activeTask: false, panelOpen: false, userTypingWithinMs: 99_999 };
  it("prefers speaking over listening", () => {
    expect(pickIndicator({ ...base, delivering: true, listening: true })).toBe("speaking");
  });
  it("shows thinking for active tasks", () => {
    expect(pickIndicator({ ...base, activeTask: true })).toBe("thinking");
  });
  it("shows typing only inside the open panel with recent keystrokes", () => {
    expect(pickIndicator({ ...base, panelOpen: true, userTypingWithinMs: 500 })).toBe("typing");
    expect(pickIndicator({ ...base, panelOpen: true, userTypingWithinMs: 5000 })).toBe("idle");
  });
  it("labels every kind", () => {
    for (const k of ["idle","listening","thinking","typing","speaking"] as const) {
      expect(indicatorLabel(k).length).toBeGreaterThan(1);
    }
  });
});

describe("R85 personalized cooldown + dismissal in pickInitiative", () => {
  it("honours a shorter cooldown from preferences", () => {
    const now = 10_000;
    const signals = [{ kind: "optimization" as const, relevance: 0.9, detectedAt: now }];
    // 45s ago, default cooldown (90s) would block; chatty (30s) allows.
    const lastAt = now - 45_000;
    expect(pickInitiative({ signals, lastSuggestionAt: lastAt, nowMs: now, reducedMotion: false, userBusy: false })).toBeNull();
    const chatty = pickInitiative({ signals, lastSuggestionAt: lastAt, nowMs: now, reducedMotion: false, userBusy: false, cooldownMs: 30_000 });
    expect(chatty?.kind).toBe("optimization");
  });
  it("drops signals whose kind was dismissed this session", () => {
    const signals = [
      { kind: "optimization" as const, relevance: 0.9, detectedAt: 0 },
      { kind: "workflow-simplification" as const, relevance: 0.8, detectedAt: 0 },
    ];
    const s = pickInitiative({ signals, lastSuggestionAt: null, nowMs: 0, reducedMotion: false, userBusy: false, dismissedKinds: ["optimization"] });
    expect(s?.kind).toBe("workflow-simplification");
  });
});
