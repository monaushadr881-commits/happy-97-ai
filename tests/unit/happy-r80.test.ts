import { describe, it, expect } from "vitest";
import { composeCompanion } from "@/lib/happy-r80/living-companion";
import { pickInitiative } from "@/lib/happy-r80/initiative-ai";
import { contextFor, detectSurface, summarize } from "@/lib/happy-r80/workspace-intelligence";
import { recentProjects, resumeSuggestion, pendingWork } from "@/lib/happy-r80/project-memory";
import { advise } from "@/lib/happy-r80/business-advisor";
import { continue_ as continueConversation } from "@/lib/happy-r80/conversation-continuity";

describe("living-companion", () => {
  const base = { invoked: false, conversing: false, userIdleMs: 0, reducedMotion: false, tier: "high" as const, role: "founder" as const, route: "/", hasNotifications: false, hasError: false, hourOfDay: 10, languageCode: "en" };
  it("greets founder in the morning", () => {
    const s = composeCompanion(base);
    expect(s.daypart).toBe("morning");
    expect(s.greeting).toMatch(/Good morning, Founder/);
    expect(s.posture).toBe("attentive");
  });
  it("late-night working late", () => {
    expect(composeCompanion({ ...base, hourOfDay: 2 }).daypart).toBe("night");
    expect(composeCompanion({ ...base, hourOfDay: 2 }).greeting).toMatch(/Working late/);
  });
  it("goes concerned on error", () => {
    const s = composeCompanion({ ...base, hasError: true });
    expect(s.concerned).toBe(true);
    expect(s.posture).toBe("concerned");
  });
  it("suggests notification only when not conversing", () => {
    expect(composeCompanion({ ...base, hasNotifications: true }).suggestNotification).toBe(true);
    expect(composeCompanion({ ...base, hasNotifications: true, conversing: true }).suggestNotification).toBe(false);
  });
});

describe("initiative-ai", () => {
  const now = 1_000_000;
  it("returns nothing when user is busy", () => {
    expect(pickInitiative({ signals: [{ kind: "build-failed", relevance: 1, detectedAt: now }], lastSuggestionAt: null, nowMs: now, reducedMotion: false, userBusy: true })).toBeNull();
  });
  it("respects cooldown", () => {
    expect(pickInitiative({ signals: [{ kind: "build-failed", relevance: 1, detectedAt: now }], lastSuggestionAt: now - 1_000, nowMs: now, reducedMotion: false, userBusy: false })).toBeNull();
  });
  it("filters below relevance min", () => {
    expect(pickInitiative({ signals: [{ kind: "optimization", relevance: 0.1, detectedAt: now }], lastSuggestionAt: null, nowMs: now, reducedMotion: false, userBusy: false })).toBeNull();
  });
  it("picks highest relevance and marks critical", () => {
    const s = pickInitiative({ signals: [{ kind: "optimization", relevance: 0.6, detectedAt: now }, { kind: "build-failed", relevance: 0.9, detectedAt: now }], lastSuggestionAt: null, nowMs: now, reducedMotion: false, userBusy: false });
    expect(s?.kind).toBe("build-failed");
    expect(s?.urgency).toBe("critical");
  });
});

describe("workspace-intelligence", () => {
  it("classifies builder & analytics", () => {
    expect(detectSurface("/_authenticated/builder/canvas")).toBe("builder");
    expect(detectSurface("/analytics/overview")).toBe("analytics");
    expect(detectSurface("/login")).toBe("public");
    expect(detectSurface("/nowhere-known")).toBe("unknown");
  });
  it("focus hint prioritises error > form > canvas", () => {
    expect(contextFor("/builder", { hasError: true, hasForm: true }).focusHint).toBe("error");
    expect(contextFor("/builder", { hasForm: true }).focusHint).toBe("form");
    expect(contextFor("/analytics").focusHint).toBe("charts");
  });
  it("summarises each surface", () => {
    expect(summarize(contextFor("/analytics"))).toMatch(/analytics/i);
    expect(summarize(contextFor("/x", { hasError: true }))).toMatch(/error/);
  });
});

describe("project-memory", () => {
  const projects = [
    { id: "a", name: "A", lastOpenedAt: 5 },
    { id: "b", name: "B", lastOpenedAt: 10, pendingDeployments: 1 },
    { id: "c", name: "C", lastOpenedAt: 3, pinned: true },
  ];
  it("pins float to top then by recency", () => {
    const r = recentProjects({ projects, nowMs: 100 });
    expect(r[0].id).toBe("c");
    expect(r[1].id).toBe("b");
  });
  it("pendingWork filters correctly", () => {
    expect(pendingWork(projects).map((p) => p.id)).toEqual(["b"]);
  });
  it("resume picks pending deployment", () => {
    const r = resumeSuggestion({ projects, nowMs: 100 });
    expect(r?.project.id).toBe("b");
    expect(r?.reason).toBe("pending deployment");
  });
  it("resume returns null for empty list", () => {
    expect(resumeSuggestion({ projects: [], nowMs: 100 })).toBeNull();
  });
});

describe("business-advisor", () => {
  it("flags high-impact issues first", () => {
    const s = advise({ conversionRate: 0.01, seoScore: 60, cartAbandonRate: 0.7 });
    expect(s[0].impact).toBe("high");
    expect(s.some((x) => x.area === "seo")).toBe(true);
  });
  it("celebrates revenue growth", () => {
    const s = advise({ monthlyRevenue: 130, monthlyRevenuePrev: 100 });
    expect(s.some((x) => x.area === "opportunity")).toBe(true);
  });
  it("empty metrics → empty advice", () => {
    expect(advise({})).toEqual([]);
  });
});

describe("conversation-continuity", () => {
  it("bridges when session is stale", () => {
    const r = continueConversation({ turns: [{ role: "user", text: "hi", at: 0 }], nowMs: 8 * 3_600_000 });
    expect(r.resumed).toBe(true);
    expect(r.bridge).toMatch(/Picking up|Welcome back/);
  });
  it("no bridge for fresh gap", () => {
    const r = continueConversation({ turns: [{ role: "user", text: "hi", at: 0 }], nowMs: 60_000 });
    expect(r.resumed).toBe(false);
    expect(r.bridge).toBeNull();
  });
  it("trims to maxTurns", () => {
    const turns = Array.from({ length: 30 }, (_, i) => ({ role: "user" as const, text: String(i), at: i }));
    expect(continueConversation({ turns, nowMs: 100, maxTurns: 5 }).turns.length).toBe(5);
  });
});
