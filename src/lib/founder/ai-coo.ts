/**
 * R172 — AI COO™ (Chief Operating Officer)
 *
 * PURE GOVERNANCE + OPERATIONS LEADERSHIP LAYER. No new runtime,
 * no COO V2, no Operations V2, no Workflow V2, no duplicate engine.
 * Reuses canonical owners only.
 *
 * The AI COO analyzes operations, workflows, resources, and business
 * health. It NEVER changes production, NEVER changes business rules,
 * NEVER bypasses R158. Every recommendation routes through the
 * R159→…→R158 handoff chain. Founder decides.
 */

export const RESPONSIBILITIES = [
  "operations_strategy",
  "business_operations",
  "workflow_optimization",
  "cross_team_coordination",
  "business_process_design",
  "productivity_improvements",
  "customer_operations",
  "support_operations",
  "platform_operations",
  "service_quality",
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const OPERATIONS_DOMAINS = [
  "crm",
  "erp",
  "inventory",
  "finance",
  "hrms",
  "marketing",
  "sales",
  "support",
  "projects",
  "creator",
  "digital_human",
] as const;
export type OperationsDomain = (typeof OPERATIONS_DOMAINS)[number];

export const WORKFLOW_AREAS = [
  "business_processes",
  "approvals",
  "automation",
  "manual_tasks",
  "bottlenecks",
  "waiting_time",
  "team_efficiency",
] as const;
export type WorkflowArea = (typeof WORKFLOW_AREAS)[number];

export const RESOURCE_AREAS = [
  "people",
  "departments",
  "workspaces",
  "companies",
  "ai_resources",
  "credits",
  "infrastructure",
  "storage",
] as const;
export type ResourceArea = (typeof RESOURCE_AREAS)[number];

export const HEALTH_DIMENSIONS = [
  "operations_score",
  "workflow_score",
  "efficiency_score",
  "automation_score",
  "customer_experience_score",
  "support_score",
  "overall_operations_score",
] as const;
export type HealthDimension = (typeof HEALTH_DIMENSIONS)[number];

export const PRODUCTIVITY_METRICS = [
  "automation_pct",
  "manual_work_pct",
  "time_saved_hours",
  "operational_cost",
  "growth_capacity",
] as const;
export type ProductivityMetric = (typeof PRODUCTIVITY_METRICS)[number];

export const REPORT_SECTIONS = [
  "executive_summary",
  "top_operational_risks",
  "top_opportunities",
  "priority_actions",
  "estimated_savings",
  "estimated_roi",
] as const;
export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const FOUNDER_CONTROLS = [
  "approve",
  "reject",
  "modify",
  "schedule",
  "compare",
  "archive",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const PRIORITY_LEVELS = ["p0", "p1", "p2", "p3"] as const;
export type Priority = (typeof PRIORITY_LEVELS)[number];

export const AI_DECISION_KINDS = [
  "process_redesign",
  "automation_opportunity",
  "resource_reallocation",
  "workflow_simplification",
  "customer_experience",
  "support_improvement",
  "cost_reduction",
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
  "R128_BusinessOS",
  "R126_RevenueOS",
  "R122_CRM",
  "R123_ERP",
  "R124_HRMS",
  "R125_Inventory",
  "R127_Finance",
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
  "analyzeOperations",
  "analyzeWorkflows",
  "analyzeResources",
  "evaluateHealth",
  "measureProductivity",
  "prioritizeRecommendations",
  "composeReport",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface OperationsSignals {
  operations: number; // 0..100
  workflow: number;
  efficiency: number;
  automation: number;
  customerExperience: number;
  support: number;
}

export interface ProductivitySignals {
  automationPct: number; // 0..100
  manualWorkPct: number; // 0..100
  timeSavedHours: number;
  operationalCost: number;
  growthCapacity: number; // 0..100
}

export type HealthReport = Record<HealthDimension, number>;
export type ProductivityReport = Record<ProductivityMetric, number>;

export interface Recommendation {
  kind: AIDecisionKind;
  domain: OperationsDomain;
  title: string;
  rationale: string;
  priority: Priority;
  expectedRoi: number; // 0..100
  estimatedSavings: number;
  effort: number; // 0..100
  handoff: readonly HandoffStep[];
}

export interface CooReport {
  executiveSummary: string;
  topOperationalRisks: string[];
  topOpportunities: string[];
  priorityActions: Recommendation[];
  estimatedSavings: number;
  estimatedRoi: number;
  health: HealthReport;
  productivity: ProductivityReport;
  canChangeProduction: false;
  canChangeBusinessRules: false;
  canAutoImplement: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function evaluateHealth(s: OperationsSignals): HealthReport {
  const operations_score = clamp(s.operations);
  const workflow_score = clamp(s.workflow);
  const efficiency_score = clamp(s.efficiency);
  const automation_score = clamp(s.automation);
  const customer_experience_score = clamp(s.customerExperience);
  const support_score = clamp(s.support);
  const overall_operations_score = clamp(
    (operations_score + workflow_score + efficiency_score + automation_score +
      customer_experience_score + support_score) / 6,
  );
  return {
    operations_score, workflow_score, efficiency_score, automation_score,
    customer_experience_score, support_score, overall_operations_score,
  };
}

export function measureProductivity(s: ProductivitySignals): ProductivityReport {
  return {
    automation_pct: clamp(s.automationPct),
    manual_work_pct: clamp(s.manualWorkPct),
    time_saved_hours: Math.max(0, Math.round(s.timeSavedHours)),
    operational_cost: Math.max(0, Math.round(s.operationalCost)),
    growth_capacity: clamp(s.growthCapacity),
  };
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
  domain: OperationsDomain,
  title: string,
  rationale: string,
  expectedRoi: number,
  estimatedSavings: number,
  effort: number,
): Recommendation {
  return {
    kind, domain, title, rationale,
    priority: scorePriority(expectedRoi, effort),
    expectedRoi, estimatedSavings, effort,
    handoff: HANDOFF_CHAIN,
  };
}

export function composeCooReport(input: {
  health: HealthReport;
  productivity: ProductivityReport;
  risks: string[];
  opportunities: string[];
  actions: Recommendation[];
  summary: string;
}): CooReport {
  const estimatedSavings = input.actions.reduce((a, r) => a + r.estimatedSavings, 0);
  const estimatedRoi = input.actions.length
    ? Math.round(input.actions.reduce((a, r) => a + r.expectedRoi, 0) / input.actions.length)
    : 0;
  const priorityActions = [...input.actions].sort((a, b) =>
    PRIORITY_LEVELS.indexOf(a.priority) - PRIORITY_LEVELS.indexOf(b.priority)
  );
  return {
    executiveSummary: input.summary,
    topOperationalRisks: input.risks,
    topOpportunities: input.opportunities,
    priorityActions,
    estimatedSavings,
    estimatedRoi,
    health: input.health,
    productivity: input.productivity,
    canChangeProduction: false,
    canChangeBusinessRules: false,
    canAutoImplement: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R172_POLICY = {
  id: "R172",
  name: "AI COO",
  reuseOnly: true,
  newRuntime: false,
  canAutoImplement: false,
  canChangeProduction: false,
  canChangeBusinessRules: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  handoffChain: HANDOFF_CHAIN,
  canonicalOwners: CANONICAL_OWNERS,
  responsibilities: RESPONSIBILITIES,
  operationsDomains: OPERATIONS_DOMAINS,
  workflowAreas: WORKFLOW_AREAS,
  resourceAreas: RESOURCE_AREAS,
  healthDimensions: HEALTH_DIMENSIONS,
  productivityMetrics: PRODUCTIVITY_METRICS,
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
  dailyFreeCredits: { default: 5, refresh: "daily", accumulate: false, carryForward: false },
} as const;
