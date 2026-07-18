import { describe, it, expect } from "vitest";
import {
  classifyKind, classifyPriority, pickChannels,
  renderTemplate, extractTemplateVars, validateTemplate,
  shouldThrottle, throttleLimit, dedupeMessages, batchDigest,
  inQuietHours, deferForQuietHours,
  evaluateRules,
  deliveryRate, openRate, clickThroughRate, bounceRate, channelHealth,
  classifyCommIntent, resolveForBrain, pickDhCommMode,
  commCan, commSnapshot,
} from "@/lib/happy-r127/communication-intelligence";

describe("R127 Communication Hub Intelligence", () => {
  it("classifies kinds and priority", () => {
    expect(classifyKind("New sign-in from Chrome")).toBe("security");
    expect(classifyKind("Invoice paid $29")).toBe("billing");
    expect(classifyKind("Random note")).toBe("system");
    expect(classifyPriority("System outage detected")).toBe("critical");
    expect(classifyPriority("Weekly digest")).toBe("low");
  });

  it("picks channels honoring prefs and priority", () => {
    const ch = pickChannels("marketing", "normal", [
      { kind: "marketing", channel: "email", enabled: false },
    ]);
    expect(ch).not.toContain("email");
    const crit = pickChannels("system", "critical");
    expect(crit).toContain("push");
    expect(crit).toContain("email");
  });

  it("renders and validates templates", () => {
    const t = "Hi {{user.name}}, invoice {{id}} is {{status}}";
    expect(renderTemplate(t, { user: { name: "Ada" }, id: "INV-1", status: "paid" }))
      .toBe("Hi Ada, invoice INV-1 is paid");
    expect(extractTemplateVars(t).sort()).toEqual(["id", "status", "user.name"]);
    expect(validateTemplate(t, ["user.name", "id"]).ok).toBe(true);
    expect(validateTemplate(t, ["missing"]).missing).toEqual(["missing"]);
  });

  it("throttles, dedupes, batches", () => {
    const now = Date.now();
    const ts = Array.from({ length: 3 }, (_, i) => now - i * 60_000);
    expect(throttleLimit("marketing", "email")).toBe(2);
    expect(shouldThrottle("marketing", "email", ts, now)).toBe(true);
    expect(shouldThrottle("system", "in_app", ts, now)).toBe(false);
    const dd = dedupeMessages([
      { kind: "system", title: "Hi" }, { kind: "system", title: "hi" }, { kind: "system", title: "Bye" },
    ] as never);
    expect(dd.length).toBe(2);
    const groups = batchDigest([
      { kind: "system", title: "a" }, { kind: "system", title: "b" }, { kind: "billing", title: "c" },
    ]);
    expect(groups.find((g) => g.kind === "system")!.count).toBe(2);
  });

  it("handles quiet hours + defer", () => {
    const midnight = Date.UTC(2026, 0, 1, 2, 0, 0);
    expect(inQuietHours(midnight, { start_hour: 22, end_hour: 7 })).toBe(true);
    expect(deferForQuietHours("normal", midnight, { start_hour: 22, end_hour: 7 })).toBe(true);
    expect(deferForQuietHours("critical", midnight, { start_hour: 22, end_hour: 7 })).toBe(false);
  });

  it("evaluates automation rules", () => {
    const rules = [
      { id: "r1", trigger: "event" as const, when: (c: Record<string, unknown>) => c.amount as number > 100,
        emit: { kind: "billing" as const, title: "Big charge" } },
      { id: "r2", trigger: "event" as const, when: () => { throw new Error("boom"); },
        emit: { kind: "system" as const, title: "x" } },
    ];
    const fired = evaluateRules(rules, { amount: 200 });
    expect(fired.map((r) => r.id)).toEqual(["r1"]);
  });

  it("computes delivery analytics and health", () => {
    const s = { sent: 100, delivered: 98, opened: 40, clicked: 8, bounced: 2, failed: 0, unsubscribed: 1 };
    expect(deliveryRate(s)).toBeCloseTo(0.98);
    expect(openRate(s)).toBeCloseTo(40 / 98);
    expect(clickThroughRate(s)).toBeCloseTo(0.2);
    expect(bounceRate(s)).toBeCloseTo(0.02);
    expect(["A", "B", "C", "D", "F"]).toContain(channelHealth(s).grade);
  });

  it("brain intent + DH mode + permissions + snapshot", () => {
    expect(classifyCommIntent("send an email to the team")).toBe("send");
    expect(classifyCommIntent("show open rate stats")).toBe("analytics");
    const card = resolveForBrain("update my notification preferences");
    expect(card?.route).toContain("/notifications");
    expect(pickDhCommMode("support")).toBe("concierge");
    expect(pickDhCommMode("marketing")).toBe("presenter");
    expect(commCan("viewer", "send")).toBe(false);
    expect(commCan("manager", "broadcast")).toBe(true);
    expect(commCan("founder", "impersonate")).toBe(true);
    const snap = commSnapshot([
      { kind: "billing", channel: "email",
        stats: { sent: 10, delivered: 10, opened: 5, clicked: 1, bounced: 0, failed: 0, unsubscribed: 0 } },
      { kind: "system", channel: "in_app",
        stats: { sent: 5, delivered: 5, opened: 0, clicked: 0, bounced: 0, failed: 0, unsubscribed: 0 } },
    ]);
    expect(snap.total_sent).toBe(15);
    expect(snap.by_channel.email).toBe(10);
    expect(snap.by_kind.system).toBe(5);
  });
});
