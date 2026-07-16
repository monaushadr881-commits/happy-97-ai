import { describe, it, expect, beforeEach } from "vitest";
import {
  composeGreeting, composeFarewell, shouldGreetOnce, resetGreetingSession,
  trackAndDeriveRelationship,
} from "@/lib/happy-r86/greeting";
import {
  nextBlinkMs, nextBreathMs, nextHeadTurnMs, nextPostureMs, antiRepeat, DEFAULT_AMBIENT,
} from "@/lib/happy-r86/ambient";
import {
  decideDelivery, coalesce, initialGateState, type Notification,
} from "@/lib/happy-r86/notifications";
import { saveSession, loadSession, clearSession } from "@/lib/happy-r86/session-restore";

function makeStore(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    removeItem: (k: string) => { m.delete(k); },
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
  } as Storage;
}
beforeEach(() => {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: makeStore(),
    sessionStorage: makeStore(),
  };
});

describe("R86 greeting", () => {
  it("composes distinct greetings by relationship", () => {
    const base = { hourOfDay: 10, style: "warm" as const };
    expect(composeGreeting({ ...base, relationship: "new" })).toMatch(/welcome/i);
    expect(composeGreeting({ ...base, relationship: "familiar" })).toMatch(/again/i);
    expect(composeGreeting({ ...base, relationship: "returning", role: "consultant" })).toMatch(/consultant/i);
  });
  it("farewell adapts to daypart + style", () => {
    expect(composeFarewell("professional", 9)).toMatch(/morning/);
    expect(composeFarewell("casual", 23)).toMatch(/later|enjoy/i);
  });
  it("shouldGreetOnce fires once per session", () => {
    resetGreetingSession();
    expect(shouldGreetOnce()).toBe(true);
    expect(shouldGreetOnce()).toBe(false);
  });
  it("relationship derives from visit history", () => {
    expect(trackAndDeriveRelationship()).toBe("new");
  });
});

describe("R86 ambient timings", () => {
  const rng = () => 0.5;
  it("produces delays inside profile bounds", () => {
    expect(nextBreathMs(rng)).toBeGreaterThanOrEqual(DEFAULT_AMBIENT.breathMs[0]);
    expect(nextBreathMs(rng)).toBeLessThanOrEqual(DEFAULT_AMBIENT.breathMs[1]);
    expect(nextHeadTurnMs(rng)).toBeLessThanOrEqual(DEFAULT_AMBIENT.headTurnMs[1]);
    expect(nextPostureMs(rng)).toBeGreaterThanOrEqual(DEFAULT_AMBIENT.postureMs[0]);
  });
  it("blink can emit fast double-blinks", () => {
    const fast = nextBlinkMs(() => 0.01);
    expect(fast).toBeLessThan(1500);
  });
  it("antiRepeat nudges near-repeats", () => {
    const v = 1000;
    const nudged = antiRepeat(v, [v]);
    expect(nudged).not.toBe(v);
  });
});

describe("R86 notification gate", () => {
  const mk = (over: Partial<Notification> = {}): Notification => ({
    id: "n1", kind: "builder", tone: "info", message: "done", at: 1000, ...over,
  });
  it("delivers first event, then cools down", () => {
    const s0 = initialGateState();
    const d1 = decideDelivery(s0, mk({ at: 1000 }), { conversationActive: false, now: 1000 });
    expect(d1.deliver).toBe(true);
    const d2 = decideDelivery(d1.nextState, mk({ at: 2000 }), { conversationActive: false, now: 2000 });
    expect(d2.deliver).toBe(false);
    expect(d2.reason).toBe("cooldown");
  });
  it("defers non-critical events during active conversation", () => {
    const d = decideDelivery(initialGateState(), mk(), { conversationActive: true, now: 5000 });
    expect(d.deliver).toBe(false);
    expect(d.reason).toBe("conversation");
  });
  it("critical events bypass conversation gate", () => {
    const d = decideDelivery(initialGateState(), mk({ tone: "critical", kind: "error" }), { conversationActive: true, now: 5000 });
    expect(d.deliver).toBe(true);
  });
  it("coalesces bursts of same-kind events", () => {
    const out = coalesce([
      mk({ id: "a", at: 1 }), mk({ id: "b", at: 2 }), mk({ id: "c", at: 3, message: "latest" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].message).toMatch(/3 builder/);
    expect(out[0].message).toMatch(/latest/);
  });
});

describe("R86 session restore", () => {
  it("saves and reloads a slice", () => {
    saveSession({ lastRoute: "/x", workspaceMode: "focus", dismissedSuggestions: ["tip1"] });
    const r = loadSession();
    expect(r?.lastRoute).toBe("/x");
    expect(r?.dismissedSuggestions).toContain("tip1");
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
