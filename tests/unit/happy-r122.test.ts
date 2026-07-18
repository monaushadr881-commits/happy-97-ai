import { describe, it, expect } from "vitest";
import {
  classifyParty, normalizeStage, stageProgress, buildTimeline, taskUrgency,
  scoreLead, dealRisk, nextBestAction, summarizeCustomer, buildRelationshipSnapshot,
  defaultAutomationRules, buildFunnel, conversionRate, forecastRevenueCents,
  resolveForBrain, pickDhCrmMode, crmCan, analyticsSnapshot, CANONICAL_PIPELINE,
} from "@/lib/happy-r122/crm-intelligence";

describe("R122 CRM Intelligence", () => {
  it("classifies parties", () => {
    expect(classifyParty({ is_org: true })).toBe("organization");
    expect(classifyParty({ email: "a@b.co", name: "A" })).toBe("contact");
    expect(classifyParty({})).toBe("lead");
  });

  it("normalizes free-form stages onto canonical pipeline", () => {
    expect(normalizeStage("Closed Won")).toBe("won");
    expect(normalizeStage("negotiating price")).toBe("negotiation");
    expect(normalizeStage("Qualified Lead")).toBe("qualified");
    expect(normalizeStage(null)).toBe("lead");
    expect(CANONICAL_PIPELINE).toHaveLength(7);
  });

  it("computes stage progress", () => {
    expect(stageProgress("lost")).toBe(0);
    expect(stageProgress("won")).toBe(1);
    expect(stageProgress("proposal")).toBeGreaterThan(stageProgress("qualified"));
  });

  it("builds a de-duped timeline sorted desc", () => {
    const t = buildTimeline([
      { id: "1", at: "2025-01-01T00:00Z", channel: "email" },
      { id: "1", at: "2025-01-01T00:00Z", channel: "email" },
      { id: "2", at: "2025-02-01T00:00Z", channel: "call" },
    ]);
    expect(t).toHaveLength(2);
    expect(t[0].id).toBe("2");
  });

  it("bucketizes task urgency", () => {
    const now = Date.parse("2025-06-01T00:00Z");
    expect(taskUrgency({ due_at: "2025-05-30T00:00Z" }, now)).toBe("overdue");
    expect(taskUrgency({ due_at: "2025-06-01T12:00Z" }, now)).toBe("today");
    expect(taskUrgency({ status: "done", due_at: "2025-05-30T00:00Z" }, now)).toBe("none");
  });

  it("scores leads deterministically", () => {
    expect(scoreLead({})).toBe(0);
    const s = scoreLead({ email: "x", phone: "y", company_id: "z", budgetKnown: true, meetingsHeld: 2, source: "referral" });
    expect(s).toBeGreaterThanOrEqual(70);
    expect(s).toBeLessThanOrEqual(100);
  });

  it("computes deal risk & next-best action", () => {
    expect(dealRisk({ stage: "won" })).toBe(0);
    expect(dealRisk({ stage: "lost" })).toBe(1);
    const r = dealRisk({ stage: "negotiation", daysSinceLastActivity: 30, ownerAssigned: false });
    expect(r).toBeGreaterThan(0.5);
    expect(nextBestAction({ stage: "meeting" })).toBe("proposal");
    expect(nextBestAction({ stage: "negotiation", risk: 0.9 })).toBe("reassign");
  });

  it("summarizes and snapshots relationships", () => {
    const timeline = [
      { id: "a", at: "2025-06-01T00:00Z", channel: "email" as const },
      { id: "b", at: "2025-05-01T00:00Z", channel: "call" as const },
    ];
    expect(summarizeCustomer([])).toMatch(/No recent/);
    expect(summarizeCustomer(timeline)).toMatch(/email/);
    const snap = buildRelationshipSnapshot({ timeline, invoices: 3, supportOpen: 1 });
    expect(snap.totalInteractions).toBe(2);
    expect(snap.invoicesCount).toBe(3);
  });

  it("ships default automation rules", () => {
    const rules = defaultAutomationRules();
    expect(rules.length).toBeGreaterThan(3);
    expect(rules.some((r) => r.trigger === "invoice.overdue")).toBe(true);
  });

  it("builds funnel, conversion, forecast", () => {
    const deals = [
      { stage: "lead", amount_cents: 1000 },
      { stage: "won", amount_cents: 2000 },
      { stage: "negotiation", amount_cents: 5000 },
    ];
    const funnel = buildFunnel(deals);
    expect(funnel.find((f) => f.stage === "won")!.count).toBe(1);
    expect(conversionRate(funnel)).toBeGreaterThan(0);
    expect(forecastRevenueCents(deals)).toBeGreaterThan(2000);
    const snap = analyticsSnapshot(deals);
    expect(snap.total_deals).toBe(3);
  });

  it("routes Brain to CRM domain", () => {
    expect(resolveForBrain("what's the weather").wantsCrm).toBe(false);
    const hint = resolveForBrain("show my open deals in negotiation");
    expect(hint.wantsCrm).toBe(true);
    expect(hint.entity).toBe("deal");
  });

  it("picks DH CRM mode", () => {
    expect(pickDhCrmMode({ inMeeting: true })).toBe("meeting");
    expect(pickDhCrmMode({ hasSlides: true })).toBe("presentation");
    expect(pickDhCrmMode({ stage: "negotiation" })).toBe("sales");
    expect(pickDhCrmMode({})).toBe("business");
  });

  it("enforces role x capability matrix", () => {
    expect(crmCan("viewer", "view")).toBe(true);
    expect(crmCan("viewer", "delete")).toBe(false);
    expect(crmCan("sales_rep", "quote")).toBe(true);
    expect(crmCan("sales_rep", "refund")).toBe(false);
    expect(crmCan("admin", "refund")).toBe(true);
  });
});
