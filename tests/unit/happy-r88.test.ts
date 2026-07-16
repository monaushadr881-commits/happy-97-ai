import { describe, it, expect, beforeEach } from "vitest";
import {
  emptyContext, mergeContext, applySignal, summarizeContext,
  type ContextSignal,
} from "@/lib/happy-r88/context-bus";
import {
  loadDaily, saveDaily, recordDaily, dailySummaryLine,
} from "@/lib/happy-r88/daily-memory";
import { humanize, rollOpeners } from "@/lib/happy-r88/phrase-dedupe";

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
  (globalThis as unknown as { window: unknown }).window = { localStorage: makeStore() };
});

describe("R88 context bus", () => {
  it("merges patches and preserves subsystems", () => {
    const c0 = emptyContext();
    const c1 = mergeContext(c0, { route: "/x", activeTaskLabel: "deploy" });
    expect(c1.route).toBe("/x");
    expect(c1.activeTaskLabel).toBe("deploy");
  });
  it("applies signals and counts errors", () => {
    const sig: ContextSignal = { subsystem: "builder", status: "error", at: 1, detail: "boom" };
    const c1 = applySignal(emptyContext(), sig);
    expect(c1.errorsSeen).toBe(1);
    expect(c1.subsystems.builder?.status).toBe("error");
  });
  it("summarizes context into a readable line", () => {
    let c = emptyContext();
    c = mergeContext(c, { activeTaskLabel: "shipping v2", notificationsPending: 2 });
    c = applySignal(c, { subsystem: "release", status: "active", at: 1 });
    const line = summarizeContext(c);
    expect(line).toMatch(/working on shipping v2/);
    expect(line).toMatch(/2 pending/);
    expect(line).toMatch(/1 subsystem/);
  });
  it("summarizes empty context calmly", () => {
    expect(summarizeContext(emptyContext())).toMatch(/quiet/i);
  });
});

describe("R88 daily memory", () => {
  it("round-trips and moves items from pending to completed", () => {
    let m = loadDaily();
    m = recordDaily(m, "pending", "wire desk");
    m = recordDaily(m, "pending", "add tests");
    m = recordDaily(m, "completed", "wire desk");
    saveDaily(m);
    const r = loadDaily();
    expect(r.completed).toContain("wire desk");
    expect(r.pending).not.toContain("wire desk");
    expect(r.pending).toContain("add tests");
  });
  it("dedupes same-item additions", () => {
    let m = loadDaily();
    m = recordDaily(m, "suggestion", "simplify form");
    m = recordDaily(m, "suggestion", "simplify form");
    expect(m.suggestions.filter((s) => s === "simplify form")).toHaveLength(1);
  });
  it("summary line reflects state", () => {
    let m = loadDaily();
    m = recordDaily(m, "completed", "a");
    m = recordDaily(m, "pending", "b");
    expect(dailySummaryLine(m)).toMatch(/finished 1 task/);
    expect(dailySummaryLine(m)).toMatch(/1 still open/);
  });
  it("empty day reports quietly", () => {
    expect(dailySummaryLine(loadDaily())).toMatch(/quiet/i);
  });
});

describe("R88 phrase dedupe", () => {
  it("strips robotic openers", () => {
    expect(humanize("Certainly! Here's the plan.")).toBe("Here's the plan.");
    expect(humanize("As I mentioned earlier, retry it.")).toBe("Retry it.".toLowerCase() === "retry it." ? "retry it." : "retry it.");
  });
  it("removes AI-model boilerplate", () => {
    const out = humanize("As an AI model, I can't run code. Please note that this is fine.");
    expect(out.toLowerCase()).not.toMatch(/ai model/);
    expect(out.toLowerCase()).not.toMatch(/please note/);
  });
  it("drops a repeated first sentence", () => {
    const recent = ["Let's break it down."];
    const out = humanize("Let's break it down. Then we ship.", recent);
    expect(out).toBe("Then we ship.");
  });
  it("rollOpeners tracks last-used lines with dedupe", () => {
    let r: string[] = [];
    r = rollOpeners(r, "Here's the plan. And more.");
    r = rollOpeners(r, "Here's the plan. Again.");
    expect(r).toHaveLength(1);
  });
});
