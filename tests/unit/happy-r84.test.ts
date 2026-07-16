import { describe, expect, it } from "vitest";
import {
  initialSession,
  reduce,
  noteAskedTopic,
  resumeLine,
  type SessionEvent,
} from "@/lib/happy-r84/session-memory";
import {
  decideMode,
  tutorLevelFor,
  adaptExplanation,
} from "@/lib/happy-r84/work-mode";
import { pickSuggestion, type SuggestionKind } from "@/lib/happy-r84/smart-suggestions";

const now = 1_700_000_000_000;
const ev = (kind: SessionEvent["kind"], label: string, at = now): SessionEvent => ({ kind, label, at });

describe("R84 session memory", () => {
  it("records opened routes uniquely in a row", () => {
    let s = initialSession();
    s = reduce(s, ev("opened", "/a"));
    s = reduce(s, ev("opened", "/a"));
    s = reduce(s, ev("opened", "/b"));
    expect(s.routesVisited).toEqual(["/a", "/b"]);
  });

  it("tracks postpone/skip and asked topics", () => {
    let s = initialSession();
    s = reduce(s, ev("postponed", "Deploy staging"));
    s = reduce(s, ev("postponed", "Deploy staging"));
    expect(s.postponedTasks).toEqual(["Deploy staging"]);
    s = reduce(s, ev("skipped", "Deploy staging"));
    expect(s.postponedTasks).toEqual([]);
    s = noteAskedTopic(s, "auth");
    s = noteAskedTopic(s, "auth");
    expect(s.askedTopics.auth).toBe(2);
  });

  it("resumeLine prefers postponed, then edited, then previous route", () => {
    let s = initialSession();
    expect(resumeLine(s)).toBeNull();
    s = reduce(s, ev("opened", "/a"));
    s = reduce(s, ev("opened", "/b"));
    expect(resumeLine(s)).toContain("/a");
    s = reduce(s, ev("edited", "Hero copy"));
    expect(resumeLine(s)).toContain("Hero copy");
    s = reduce(s, ev("postponed", "Rename button"));
    expect(resumeLine(s)).toContain("Rename button");
  });
});

describe("R84 work mode", () => {
  const base = {
    route: "/",
    keystrokesLastMinute: 0,
    mouseMovesLastMinute: 0,
    hasOpenPanel: false,
    askedSameTopicCount: 0,
    now,
    lastInterruptionAt: null as number | null,
  };
  it("meeting route → presentation posture", () => {
    const d = decideMode({ ...base, route: "/demo/keynote" });
    expect(d.mode).toBe("meeting");
    expect(d.posture).toBe("presentation");
    expect(d.allowSuggestions).toBe(false);
  });
  it("heavy typing → focus mode", () => {
    const d = decideMode({ ...base, keystrokesLastMinute: 120 });
    expect(d.mode).toBe("focus");
    expect(d.allowSuggestions).toBe(false);
  });
  it("repeated topic → learning", () => {
    const d = decideMode({ ...base, askedSameTopicCount: 3 });
    expect(d.mode).toBe("learning");
    expect(d.posture).toBe("coaching");
  });
  it("recent interruption suppresses suggestions", () => {
    const d = decideMode({ ...base, lastInterruptionAt: now - 5_000 });
    expect(d.allowSuggestions).toBe(false);
  });
  it("tutor level and explanation adapt", () => {
    expect(tutorLevelFor(1)).toBe("beginner");
    expect(tutorLevelFor(2)).toBe("intermediate");
    expect(tutorLevelFor(9)).toBe("advanced");
    expect(adaptExplanation("routing works via files", "beginner")).toMatch(/plain-English/);
    expect(adaptExplanation("routing works via files", "advanced")).toMatch(/nuance/);
  });
});

describe("R84 smart suggestions", () => {
  const ctx = {
    surface: "builder",
    region: "form" as const,
    route: "/builder",
    idleMs: 0,
    errorsSeenInSession: 0,
    builderTouches: 10,
  };
  it("picks contextual suggestion with highest priority", () => {
    const s = pickSuggestion(ctx, new Set());
    expect(s).not.toBeNull();
    // builder+form → duplicate-code (0.7) beats simplify-form (0.65)
    expect(s?.kind).toBe("duplicate-code");
  });
  it("never repeats a shown suggestion", () => {
    const shown = new Set<SuggestionKind>(["duplicate-code"]);
    const s = pickSuggestion(ctx, shown);
    expect(s?.kind).toBe("simplify-form");
    const shown2 = new Set<SuggestionKind>(["duplicate-code", "simplify-form", "shorten-workflow"]);
    const s2 = pickSuggestion({ ...ctx, region: "unknown" }, shown2);
    expect(s2).toBeNull();
  });
});
