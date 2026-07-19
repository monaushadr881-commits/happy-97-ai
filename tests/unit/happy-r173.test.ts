import { describe, it, expect } from "vitest";
import {
  RESPONSIBILITIES, FINANCIAL_METRICS, SUBSCRIPTION_AREAS, CREDIT_AREAS,
  COST_AREAS, KPI_DIMENSIONS, RISK_KINDS, REPORT_SECTIONS, FOUNDER_CONTROLS,
  PRIORITY_LEVELS, AI_DECISION_KINDS, CANONICAL_OWNERS, HANDOFF_CHAIN,
  PIPELINE_STAGES, R173_POLICY,
  analyzeFinancials, forecastRevenue, computeKpis, detectRisks,
  scorePriority, recommend, composeCfoReport,
} from "@/lib/founder/ai-cfo";

const fin = {
  revenue: 120000, expenses: 80000, mrr: 12000, arr: 144000,
  ltv: 900, cac: 300, cashOnHand: 240000, monthlyBurn: 30000,
};
const sub = {
  trialConversionPct: 25, renewalPct: 88, churnPct: 8,
  refundsPct: 1.5, chargebacksPct: 0.4,
};
const credits = {
  dailyFreeIssued: 50000, subscriptionCreditsIssued: 20000,
  purchasedCreditsIssued: 15000, totalConsumed: 70000,
  suspectedAbuseCount: 20, guardianFlags: 3,
};
const costs = {
  infrastructure: 8000, ai: 12000, storage: 1500,
  bandwidth: 900, communications: 600, operations: 5000,
};

describe("R173 — AI CFO™", () => {
  it("enumerates governance taxonomy", () => {
    expect(RESPONSIBILITIES.length).toBe(12);
    expect(FINANCIAL_METRICS.length).toBe(11);
    expect(SUBSCRIPTION_AREAS.length).toBe(8);
    expect(CREDIT_AREAS.length).toBe(7);
    expect(COST_AREAS.length).toBe(6);
    expect(KPI_DIMENSIONS.length).toBe(8);
    expect(RISK_KINDS.length).toBe(6);
    expect(REPORT_SECTIONS.length).toBe(9);
    expect(FOUNDER_CONTROLS.length).toBe(6);
    expect(AI_DECISION_KINDS.length).toBe(9);
    expect(PRIORITY_LEVELS.length).toBe(4);
    expect(PIPELINE_STAGES.length).toBe(10);
    expect(HANDOFF_CHAIN[HANDOFF_CHAIN.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("references canonical owners only (no V2, no duplicates)", () => {
    expect(CANONICAL_OWNERS).toContain("R127_Finance");
    expect(CANONICAL_OWNERS).toContain("R129_Billing");
    expect(CANONICAL_OWNERS).toContain("R172_AICOO");
    expect(CANONICAL_OWNERS.every((o) => !/V2/i.test(o))).toBe(true);
    expect(new Set(CANONICAL_OWNERS).size).toBe(CANONICAL_OWNERS.length);
  });

  it("analyzeFinancials derives profit, margin, runway, LTV:CAC", () => {
    const f = analyzeFinancials(fin);
    expect(f.profit).toBe(40000);
    expect(f.loss).toBe(0);
    expect(f.ltvToCac).toBe(3);
    expect(f.grossMarginPct).toBe(33);
    expect(f.cashRunwayMonths).toBe(8);
  });

  it("forecastRevenue projects 30d/90d/12m", () => {
    const fc = forecastRevenue(12000, 10);
    expect(fc.next30dRevenue).toBe(13200);
    expect(fc.next90dRevenue).toBeGreaterThan(36000);
    expect(fc.next12mArr).toBeGreaterThan(144000);
  });

  it("computeKpis aggregates overall financial score", () => {
    const f = analyzeFinancials(fin);
    const k = computeKpis(f, sub, credits, costs);
    expect(k.profitability_score).toBe(33);
    expect(k.subscription_score).toBeGreaterThan(0);
    expect(k.overall_financial_score).toBeGreaterThan(0);
    expect(k.overall_financial_score).toBeLessThanOrEqual(100);
  });

  it("detectRisks flags churn, chargebacks, credit abuse", () => {
    const f = analyzeFinancials({ ...fin, cashOnHand: 60000 });
    const risks = detectRisks(f, { ...sub, churnPct: 22, chargebacksPct: 4 }, credits);
    const kinds = risks.map((r) => r.kind);
    expect(kinds).toContain("revenue_risk");
    expect(kinds).toContain("subscription_risk");
    expect(kinds).toContain("billing_risk");
    expect(kinds).toContain("credit_abuse");
  });

  it("scorePriority ranks ROI vs effort", () => {
    expect(scorePriority(90, 10)).toBe("p0");
    expect(scorePriority(60, 40)).toBe("p1");
    expect(scorePriority(30, 40)).toBe("p2");
    expect(scorePriority(5, 90)).toBe("p3");
  });

  it("recommend attaches full handoff chain ending in R158", () => {
    const r = recommend("cost_reduction", "Consolidate AI vendors",
      "Duplicate providers", 78, 24000, 30);
    expect(r.priority).toBe("p0");
    expect(r.handoff[r.handoff.length - 1]).toBe("R158_ApprovalGateway");
  });

  it("composeCfoReport sorts actions and risks, enforces governance locks", () => {
    const f = analyzeFinancials(fin);
    const k = computeKpis(f, sub, credits, costs);
    const fc = forecastRevenue(fin.mrr, 8);
    const risks = detectRisks(f, sub, credits);
    const actions = [
      recommend("budget_reallocation", "Shift marketing to product", "Better ROI", 50, 5000, 40),
      recommend("cost_reduction", "AI cost optimization", "Cache LLM", 85, 18000, 20),
    ];
    const report = composeCfoReport({
      financials: f, kpis: k, subscriptions: sub, creditEconomy: credits,
      costs, forecast: fc, risks,
      opportunities: ["Upsell to enterprise"],
      actions, budgetRecommendations: ["Cap AI spend at 10% of revenue"],
      summary: "Healthy runway; AI cost optimization is top ROI.",
    });
    expect(report.priorityActions[0].kind).toBe("cost_reduction");
    expect(report.estimatedSavings).toBe(23000);
    expect(report.estimatedRoi).toBe(Math.round((50 + 85) / 2));
    expect(report.canExecutePayments).toBe(false);
    expect(report.canEditBillingRules).toBe(false);
    expect(report.canChangePricing).toBe(false);
    expect(report.canChangeCreditPolicies).toBe(false);
    expect(report.canAutoImplement).toBe(false);
    expect(report.handoffTarget).toBe("R158_ApprovalGateway");
    expect(report.reuseOnly).toBe(true);
    expect(report.newRuntime).toBe(false);
  });

  it("policy locks: no runtime, no payments/billing/pricing/credit changes, credit policy intact", () => {
    expect(R173_POLICY.canAutoImplement).toBe(false);
    expect(R173_POLICY.canExecutePayments).toBe(false);
    expect(R173_POLICY.canEditBillingRules).toBe(false);
    expect(R173_POLICY.canChangePricing).toBe(false);
    expect(R173_POLICY.canChangeCreditPolicies).toBe(false);
    expect(R173_POLICY.newRuntime).toBe(false);
    expect(R173_POLICY.reuseOnly).toBe(true);
    expect(R173_POLICY.handoffTarget).toBe("R158_ApprovalGateway");
    expect(R173_POLICY.companyProfile.founder).toBe("MO NAUSHAD RAZA QADRI");
    expect(R173_POLICY.dailyFreeCredits.default).toBe(5);
    expect(R173_POLICY.dailyFreeCredits.accumulate).toBe(false);
    expect(R173_POLICY.dailyFreeCredits.carryForward).toBe(false);
    expect(R173_POLICY.dailyFreeCredits.serverAuthoritative).toBe(true);
    expect(R173_POLICY.dailyFreeCredits.deductionOrder).toEqual([
      "daily_free", "subscription", "purchased",
    ]);
  });
});
