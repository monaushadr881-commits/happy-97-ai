/**
 * R173 — AI CFO™ (Chief Financial Officer)
 *
 * PURE GOVERNANCE + FINANCIAL LEADERSHIP LAYER. No new runtime,
 * no CFO V2, no Finance/Accounting/Billing/Revenue V2, no duplicate engine.
 * Reuses canonical owners only.
 *
 * The AI CFO analyzes revenue, cash flow, expenses, subscriptions, credit
 * economy, and financial risk. It NEVER executes payments, NEVER edits
 * billing rules, NEVER changes pricing, NEVER changes credit policies,
 * NEVER bypasses R158. Every recommendation routes through the
 * R159→…→R158 handoff chain. Founder decides.
 */

export const RESPONSIBILITIES = [
  "revenue_forecasting",
  "cash_flow_analysis",
  "expense_analysis",
  "budget_planning",
  "subscription_analysis",
  "credit_economy",
  "cost_optimization",
  "profitability",
  "roi_analysis",
  "financial_strategy",
  "financial_risk",
  "investment_planning",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const FINANCIAL_METRICS = [
  "revenue",
  "expenses",
  "profit",
  "loss",
  "mrr",
  "arr",
  "ltv",
  "cac",
  "margins",
  "burn_rate",
  "cash_runway",
] as const;
export type FinancialMetric = (typeof FINANCIAL_METRICS)[number];

export const SUBSCRIPTION_AREAS = [
  "plans",
  "trials",
  "conversions",
  "renewals",
  "churn",
  "refunds",
  "chargebacks",
  "coupon_usage",
] as const;
export type SubscriptionArea = (typeof SUBSCRIPTION_AREAS)[number];

export const CREDIT_AREAS = [
  "daily_free_credits",
  "subscription_credits",
  "purchased_credits",
  "credit_usage",
  "credit_burn",
  "credit_abuse",
  "guardian_ai_signals",
] as const;
export type CreditArea = (typeof CREDIT_AREAS)[number];

export const COST_AREAS = [
  "infrastructure",
  "ai",
  "storage",
  "bandwidth",
  "communications",
  "operations",
] as const;
export type CostArea = (typeof COST_AREAS)[number];

export const KPI_DIMENSIONS = [
  "revenue_score",
  "cost_score",
  "growth_score",
  "cash_flow_score",
  "subscription_score",
  "credit_health_score",
  "profitability_score",
  "overall_financial_score",
] as const;
export type KpiDimension = (typeof KPI_DIMENSIONS)[number];

export const RISK_KINDS = [
  "revenue_risk",
  "fraud_risk",
  "credit_abuse",
  "billing_risk",
  "subscription_risk",
  "operational_risk",
] as const;
export type RiskKind = (typeof RISK_KINDS)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "revenue_health",
  "cash_flow",
  "forecast",
  "top_risks",
  "top_opportunities",
  "cost_savings",
  "roi",
  "budget_recommendations",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "compare",
  "archive",
  "schedule",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const AI_DECISION_KINDS = [
  "revenue_growth",
  "cost_reduction",
  "pricing_review",
  "subscription_optimization",
  "credit_policy_review",
  "budget_reallocation",
  "cash_flow_action",
  "risk_mitigation",
  "investment_opportunity",
] as const;
export type AIDecisionKind = (typeof AI_DECISION_KINDS)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R120_Creator",
  "R126_RevenueOS",
  "R128_BusinessOS",
  "R127_Finance",
  "R129_Billing",
  "R104_Analytics",
  "R145_FounderDashboard",
  "R160_GuardianAI",
  "R158_ApprovalGateway",
  "R159_IntentEngine",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QAEngineer",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_RollbackRecovery",
  "R167_DocumentationEngine",
  "R168_OptimizationAdvisor",
  "R169_LearningMemory",
  "R170_CompetitorIntelligence",
  "R171_AICTO",
  "R172_AICOO",
  "R130_Audit",
  "R156_RBAC",
  "R153_HappyID",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const HANDOFF_CHAIN = [
  "R159_IntentEngine",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QAEngineer",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_RollbackRecovery",
  "R167_DocumentationEngine",
  "R168_OptimizationAdvisor",
  "R158_ApprovalGateway",
] as const;
export type HandoffStep = (typeof HANDOFF_CHAIN)[number];

export const PIPELINE_STAGES = [
  "intake",
  "analyzeRevenue",
  "analyzeCashFlow",
  "analyzeExpenses",
  "analyzeSubscriptions",
  "analyzeCreditEconomy",
  "detectRisks",
  "computeKpis",
  "composeReport",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface FinancialSignals {
  revenue: number;
  expenses: number;
  mrr: number;
  arr: number;
  ltv: number;
  cac: number;
  cashOnHand: number;
  monthlyBurn: number;
}

export interface SubscriptionSignals {
  trialConversionPct: number; // 0..100
  renewalPct: number; // 0..100
  churnPct: number; // 0..100
  refundsPct: number; // 0..100
  chargebacksPct: number; // 0..100
}

export interface CreditSignals {
  dailyFreeIssued: number;
  subscriptionCreditsIssued: number;
  purchasedCreditsIssued: number;
  totalConsumed: number;
  suspectedAbuseCount: number;
  guardianFlags: number;
}

export interface CostSignals {
  infrastructure: number;
  ai: number;
  storage: number;
  bandwidth: number;
  communications: number;
  operations: number;
}

export interface FinancialReport {
  revenue: number;
  expenses: number;
  profit: number;
  loss: number;
  mrr: number;
  arr: number;
  ltv: number;
  cac: number;
  ltvToCac: number;
  grossMarginPct: number;
  burnRate: number;
  cashRunwayMonths: number;
}

export type KpiReport = Record<KpiDimension, number>;

export interface Risk {
  kind: RiskKind;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
}

export interface Recommendation {
  kind: AIDecisionKind;
  title: string;
  rationale: string;
  priority: Priority;
  expectedRoi: number; // 0..100
  estimatedSavings: number;
  effort: number; // 0..100
  handoff: readonly HandoffStep[];
}

export interface CfoReport {
  executiveSummary: string;
  financials: FinancialReport;
  kpis: KpiReport;
  subscriptions: SubscriptionSignals;
  creditEconomy: CreditSignals;
  costs: CostSignals;
  forecast: { next30dRevenue: number; next90dRevenue: number; next12mArr: number };
  topRisks: Risk[];
  topOpportunities: string[];
  priorityActions: Recommendation[];
  estimatedSavings: number;
  estimatedRoi: number;
  budgetRecommendations: string[];
  canExecutePayments: false;
  canEditBillingRules: false;
  canChangePricing: false;
  canChangeCreditPolicies: false;
  canAutoImplement: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const nonNeg = (n: number) => Math.max(0, Math.round(n));

export function analyzeFinancials(s: FinancialSignals): FinancialReport {
  const profit = s.revenue - s.expenses;
  const loss = profit < 0 ? -profit : 0;
  const ltvToCac = s.cac > 0 ? +(s.ltv / s.cac).toFixed(2) : 0;
  const grossMarginPct = s.revenue > 0
    ? clamp(((s.revenue - s.expenses) / s.revenue) * 100)
    : 0;
  const cashRunwayMonths = s.monthlyBurn > 0
    ? +(s.cashOnHand / s.monthlyBurn).toFixed(1)
    : Infinity;
  return {
    revenue: nonNeg(s.revenue),
    expenses: nonNeg(s.expenses),
    profit: Math.round(profit),
    loss: Math.round(loss),
    mrr: nonNeg(s.mrr),
    arr: nonNeg(s.arr),
    ltv: nonNeg(s.ltv),
    cac: nonNeg(s.cac),
    ltvToCac,
    grossMarginPct,
    burnRate: nonNeg(s.monthlyBurn),
    cashRunwayMonths,
  };
}

export function forecastRevenue(mrr: number, growthPct: number) {
  const g = Math.max(-100, growthPct) / 100;
  const next30dRevenue = Math.round(mrr * (1 + g));
  const next90dRevenue = Math.round(mrr * 3 * (1 + g * 1.5));
  const next12mArr = Math.round(mrr * 12 * (1 + g * 3));
  return { next30dRevenue, next90dRevenue, next12mArr };
}

export function computeKpis(
  fin: FinancialReport,
  sub: SubscriptionSignals,
  credits: CreditSignals,
  costs: CostSignals,
): KpiReport {
  const revenue_score = clamp(Math.log10(Math.max(1, fin.revenue)) * 20);
  const totalCost = costs.infrastructure + costs.ai + costs.storage +
    costs.bandwidth + costs.communications + costs.operations;
  const cost_score = fin.revenue > 0
    ? clamp(100 - (totalCost / fin.revenue) * 100)
    : 0;
  const growth_score = clamp(sub.trialConversionPct + sub.renewalPct - sub.churnPct);
  const cash_flow_score = fin.cashRunwayMonths === Infinity
    ? 100
    : clamp(fin.cashRunwayMonths * 8);
  const subscription_score = clamp(
    sub.renewalPct - sub.churnPct - sub.refundsPct - sub.chargebacksPct * 2,
  );
  const abuseRatio = credits.totalConsumed > 0
    ? (credits.suspectedAbuseCount / credits.totalConsumed) * 100
    : 0;
  const credit_health_score = clamp(100 - abuseRatio * 5 - credits.guardianFlags);
  const profitability_score = clamp(fin.grossMarginPct);
  const overall_financial_score = clamp(
    (revenue_score + cost_score + growth_score + cash_flow_score +
      subscription_score + credit_health_score + profitability_score) / 7,
  );
  return {
    revenue_score, cost_score, growth_score, cash_flow_score,
    subscription_score, credit_health_score, profitability_score,
    overall_financial_score,
  };
}

export function detectRisks(
  fin: FinancialReport,
  sub: SubscriptionSignals,
  credits: CreditSignals,
): Risk[] {
  const risks: Risk[] = [];
  if (fin.cashRunwayMonths !== Infinity && fin.cashRunwayMonths < 6) {
    risks.push({
      kind: "revenue_risk",
      severity: fin.cashRunwayMonths < 3 ? "critical" : "high",
      detail: `Cash runway is ${fin.cashRunwayMonths} months`,
    });
  }
  if (sub.churnPct > 10) {
    risks.push({
      kind: "subscription_risk",
      severity: sub.churnPct > 20 ? "high" : "medium",
      detail: `Churn at ${sub.churnPct}%`,
    });
  }
  if (sub.chargebacksPct > 1) {
    risks.push({
      kind: "billing_risk",
      severity: sub.chargebacksPct > 3 ? "high" : "medium",
      detail: `Chargebacks at ${sub.chargebacksPct}%`,
    });
  }
  if (credits.suspectedAbuseCount > 0 || credits.guardianFlags > 0) {
    risks.push({
      kind: "credit_abuse",
      severity: credits.guardianFlags > 10 ? "high" : "low",
      detail: `${credits.suspectedAbuseCount} suspected, ${credits.guardianFlags} guardian flags`,
    });
  }
  if (fin.ltv > 0 && fin.cac > 0 && fin.ltvToCac < 1) {
    risks.push({
      kind: "operational_risk",
      severity: "high",
      detail: `LTV:CAC ratio ${fin.ltvToCac} below 1`,
    });
  }
  return risks;
}

export function scorePriority(roi: number, effort: number): Priority {
  const score = clamp(roi) - clamp(effort) * 0.5;
  if (score >= 60) return "p0";
  if (score >= 30) return "p1";
  if (score >= 10) return "p2";
  return "p3";
}

export function recommend(
  kind: AIDecisionKind,
  title: string,
  rationale: string,
  expectedRoi: number,
  estimatedSavings: number,
  effort: number,
): Recommendation {
  return {
    kind, title, rationale,
    priority: scorePriority(expectedRoi, effort),
    expectedRoi, estimatedSavings, effort,
    handoff: HANDOFF_CHAIN,
  };
}

export function composeCfoReport(input: {
  financials: FinancialReport;
  kpis: KpiReport;
  subscriptions: SubscriptionSignals;
  creditEconomy: CreditSignals;
  costs: CostSignals;
  forecast: { next30dRevenue: number; next90dRevenue: number; next12mArr: number };
  risks: Risk[];
  opportunities: string[];
  actions: Recommendation[];
  budgetRecommendations: string[];
  summary: string;
}): CfoReport {
  const estimatedSavings = input.actions.reduce((a, r) => a + r.estimatedSavings, 0);
  const estimatedRoi = input.actions.length
    ? Math.round(input.actions.reduce((a, r) => a + r.expectedRoi, 0) / input.actions.length)
    : 0;
  const priorityActions = [...input.actions].sort((a, b) =>
    PRIORITY_LEVELS.indexOf(a.priority) - PRIORITY_LEVELS.indexOf(b.priority)
  );
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const topRisks = [...input.risks].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  return {
    executiveSummary: input.summary,
    financials: input.financials,
    kpis: input.kpis,
    subscriptions: input.subscriptions,
    creditEconomy: input.creditEconomy,
    costs: input.costs,
    forecast: input.forecast,
    topRisks,
    topOpportunities: input.opportunities,
    priorityActions,
    estimatedSavings,
    estimatedRoi,
    budgetRecommendations: input.budgetRecommendations,
    canExecutePayments: false,
    canEditBillingRules: false,
    canChangePricing: false,
    canChangeCreditPolicies: false,
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R173_POLICY = {
  id: "R173",
  name: "AI CFO",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  canExecutePayments: false,
  canEditBillingRules: false,
  canChangePricing: false,
  canChangeCreditPolicies: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  responsibilities: RESPONSIBILITIES,
  financialMetrics: FINANCIAL_METRICS,
  subscriptionAreas: SUBSCRIPTION_AREAS,
  creditAreas: CREDIT_AREAS,
  costAreas: COST_AREAS,
  kpiDimensions: KPI_DIMENSIONS,
  riskKinds: RISK_KINDS,
  reportSections: REPORT_SECTIONS,
  founderControls: FOUNDER_CONTROLS,
  aiDecisionKinds: AI_DECISION_KINDS,
  priorities: PRIORITY_LEVELS,
  pipeline: PIPELINE_STAGES,
  companyProfile: {
    legalName: "HAPPY PERSON PRIVATE LIMITED",
    shortName: "H.P PRIVATE LIMITED",
    founder: "MO NAUSHAD RAZA QADRI",
  },
  dailyFreeCredits: {
    default: 5,
    refresh: "daily",
    accumulate: false,
    carryForward: false,
    serverAuthoritative: true,
    deductionOrder: ["daily_free", "subscription", "purchased"] as const,
    purchasedIntact: true,
    subscriptionIntact: true,
  },
} as const;
