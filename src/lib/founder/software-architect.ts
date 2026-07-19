/**
 * R161 — AI Software Architect™ (Chief Engineering Architect)
 *
 * Pure governance + planning helper. ZERO new runtime, ZERO Brain V2,
 * ZERO Memory V2, ZERO Builder V2, ZERO duplicate architecture engine.
 * Composes existing canonical owners only:
 *
 *   - Intent Engine       → `src/lib/founder/intent-engine.ts` (R159)
 *   - Approval Gateway    → `src/lib/founder/approval-gateway.ts` (R158) [handoff]
 *   - Guardian AI         → `src/lib/founder/guardian-ai.ts` (R160)
 *   - Identity Fortress   → `src/lib/founder/identity-fortress.ts` (R156)
 *   - Unlimited Policy    → `src/lib/founder/unlimited-policy.ts` (R153)
 *   - Brain               → `src/lib/brain/engine.ts` (R115B)
 *   - Memory              → `src/lib/memory/intelligence.ts` (R116)
 *   - Search              → `src/lib/happy-r138/semantic-knowledge.ts`
 *   - File Engine         → `src/lib/happy-r137/file-intelligence.ts`
 *   - Audit               → `public.audit_logs` + `write_audit(...)`
 *
 * FOLLOWS: R91 R104 R111 R115B R116 R118 R119 R120 R126 R128 R130 R145
 *          R153 R156 R157 R158 R159 R160.
 *
 * The Architect NEVER implements. It analyses, discovers, designs, and
 * produces an Approval Package that is handed off to R158 for
 * Explain → Preview → Approve → Execute.
 */

// ─── Input modalities (superset of R159, no new capture layer) ───────────
export const ARCHITECT_INPUT_MODES = [
  "text", "voice", "image", "video", "screenshot",
  "whiteboard", "pdf", "document", "url", "mixed",
] as const;
export type ArchitectInputMode = (typeof ARCHITECT_INPUT_MODES)[number];

// ─── Analysis fields ─────────────────────────────────────────────────────
export const ANALYSIS_FIELDS = [
  "businessGoal", "technicalGoal", "priority", "scope", "complexity",
  "dependencies", "affectedSystems", "risk", "estimatedCost", "estimatedTime",
] as const;
export type AnalysisField = (typeof ANALYSIS_FIELDS)[number];

// ─── Module-discovery surfaces (all point at existing owners) ────────────
export const DISCOVERY_SURFACES = [
  "existingModules", "existingApis", "existingTables", "existingBuilders",
  "existingComponents", "existingServices", "existingDocuments", "existingTests",
] as const;
export type DiscoverySurface = (typeof DISCOVERY_SURFACES)[number];

// ─── Duplicate-prevention checks (enforced BEFORE any plan is emitted) ───
export const DUPLICATE_CHECKS = [
  "duplicate_runtime", "duplicate_api", "duplicate_database",
  "duplicate_ui", "duplicate_builder", "duplicate_service",
  "duplicate_business_logic",
] as const;
export type DuplicateCheck = (typeof DUPLICATE_CHECKS)[number];

// ─── Architecture-design artifacts ───────────────────────────────────────
export const ARCHITECTURE_ARTIFACTS = [
  "systemArchitecture", "moduleDiagram", "dataFlow", "serviceFlow",
  "componentMap", "dependencyGraph", "folderImpact", "fileImpact",
] as const;

// ─── Engineering plans generated (9) ─────────────────────────────────────
export const ENGINEERING_PLANS = [
  "frontend", "backend", "database", "api", "security",
  "testing", "deployment", "rollback", "migration",
] as const;
export type EngineeringPlan = (typeof ENGINEERING_PLANS)[number];

// ─── Quality analysis dimensions (7) ─────────────────────────────────────
export const QUALITY_DIMENSIONS = [
  "performance", "security", "accessibility", "scalability",
  "maintainability", "compatibility", "reliability",
] as const;
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

// ─── Business cost buckets (5) ───────────────────────────────────────────
export const COST_BUCKETS = [
  "development", "infrastructure", "ai", "storage", "operational",
] as const;
export type CostBucket = (typeof COST_BUCKETS)[number];

// ─── Risk categories (6) ─────────────────────────────────────────────────
export const RISK_CATEGORIES = [
  "architecture", "security", "performance", "migration", "business", "deployment",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

// ─── Competitor benchmarks (opt-in) ──────────────────────────────────────
export const COMPETITORS = [
  "chatgpt", "claude", "gemini", "github",
  "notion", "canva", "slack", "shopify",
] as const;
export type Competitor = (typeof COMPETITORS)[number];

// ─── Output package sections (7) ─────────────────────────────────────────
export const OUTPUT_SECTIONS = [
  "architectureReport", "engineeringReport", "implementationPlan",
  "previewPlan", "testingPlan", "documentationPlan", "approvalPackage",
] as const;
export type OutputSection = (typeof OUTPUT_SECTIONS)[number];

// ─── Founder-presentation fields (11) ────────────────────────────────────
export const PRESENTATION_FIELDS = [
  "whatChanges", "why", "benefits", "risks",
  "estimatedTime", "estimatedCost", "affectedModules", "affectedFiles",
  "affectedApis", "affectedDatabase", "rollbackAvailable",
] as const;
export type PresentationField = (typeof PRESENTATION_FIELDS)[number];

// ─── Architect pipeline (11 stages, handoff to R158 at end) ──────────────
export const ARCHITECT_PIPELINE = [
  "intake",          // reuse R159 Intent Engine
  "analyse",         // ANALYSIS_FIELDS
  "discover",        // DISCOVERY_SURFACES
  "duplicateCheck",  // DUPLICATE_CHECKS (hard gate)
  "design",          // ARCHITECTURE_ARTIFACTS
  "plan",            // ENGINEERING_PLANS
  "quality",         // QUALITY_DIMENSIONS
  "cost",            // COST_BUCKETS
  "risk",            // RISK_CATEGORIES
  "present",         // PRESENTATION_FIELDS
  "handoff",         // R158 Approval Gateway (no direct execute)
] as const;

// ─── Contracts ───────────────────────────────────────────────────────────
export type Complexity = "trivial" | "small" | "medium" | "large" | "epic";
export type Priority = "low" | "normal" | "high" | "critical";

export interface AnalysisReport {
  businessGoal: string;
  technicalGoal: string;
  priority: Priority;
  scope: string;
  complexity: Complexity;
  dependencies: string[];
  affectedSystems: string[];
  risk: "low" | "medium" | "high" | "critical";
  estimatedCostUsd: number;
  estimatedTimeHours: number;
}

export interface DuplicateFindings {
  checks: Record<DuplicateCheck, boolean>; // true = duplicate detected
  duplicatesFound: DuplicateCheck[];
  blocking: boolean;
}

export interface ArchitectPackage {
  version: "R161";
  analysis: AnalysisReport;
  duplicates: DuplicateFindings;
  artifacts: readonly (typeof ARCHITECTURE_ARTIFACTS)[number][];
  plans: readonly EngineeringPlan[];
  quality: readonly QualityDimension[];
  costs: readonly CostBucket[];
  risks: readonly RiskCategory[];
  presentation: Record<PresentationField, string>;
  handoffTarget: "R158_ApprovalGateway";
  canAutoExecute: false; // compile-time constant
}

// ─── Helpers ─────────────────────────────────────────────────────────────
export function normalizeInputModes(
  input: ArchitectInputMode | ArchitectInputMode[],
): ArchitectInputMode[] {
  const set = new Set<ArchitectInputMode>(ARCHITECT_INPUT_MODES);
  const arr = Array.isArray(input) ? input : [input];
  return arr.filter((m): m is ArchitectInputMode => set.has(m));
}

export function runDuplicateChecks(
  detected: Partial<Record<DuplicateCheck, boolean>>,
): DuplicateFindings {
  const checks = Object.fromEntries(
    DUPLICATE_CHECKS.map((c) => [c, !!detected[c]]),
  ) as Record<DuplicateCheck, boolean>;
  const duplicatesFound = DUPLICATE_CHECKS.filter((c) => checks[c]);
  return { checks, duplicatesFound, blocking: duplicatesFound.length > 0 };
}

/**
 * Missing fields prevent the architect from producing a plan — enforces
 * "Ask, don't guess" (R159) at the architecture layer.
 */
export function missingAnalysisFields(
  a: Partial<AnalysisReport>,
): AnalysisField[] {
  return ANALYSIS_FIELDS.filter((f) => {
    const v = a[f as keyof AnalysisReport];
    return v === undefined || v === null || v === "";
  });
}

export function nextArchitectStage(state: {
  analysisComplete: boolean;
  duplicatesBlocking: boolean;
}): (typeof ARCHITECT_PIPELINE)[number] {
  if (!state.analysisComplete) return "analyse";
  if (state.duplicatesBlocking) return "duplicateCheck";
  return "design";
}

/**
 * Build the Approval Package handed off to R158. Never executes; the
 * `canAutoExecute: false` field is a compile-time lock.
 */
export function buildArchitectPackage(input: {
  analysis: AnalysisReport;
  duplicates: DuplicateFindings;
  presentation: Record<PresentationField, string>;
}): ArchitectPackage {
  return {
    version: "R161",
    analysis: input.analysis,
    duplicates: input.duplicates,
    artifacts: ARCHITECTURE_ARTIFACTS,
    plans: ENGINEERING_PLANS,
    quality: QUALITY_DIMENSIONS,
    costs: COST_BUCKETS,
    risks: RISK_CATEGORIES,
    presentation: input.presentation,
    handoffTarget: "R158_ApprovalGateway",
    canAutoExecute: false,
  };
}

// ─── Meta for docs, dashboards, audits ───────────────────────────────────
export const ARCHITECT_META = {
  version: "R161",
  canonicalOwners: [
    "src/lib/founder/intent-engine.ts",
    "src/lib/founder/approval-gateway.ts",
    "src/lib/founder/guardian-ai.ts",
    "src/lib/brain/engine.ts",
    "src/lib/memory/intelligence.ts",
    "src/lib/happy-r138/semantic-knowledge.ts",
    "src/lib/happy-r137/file-intelligence.ts",
  ],
  inputModes: ARCHITECT_INPUT_MODES.length,
  pipelineStages: ARCHITECT_PIPELINE.length,
  engineeringPlans: ENGINEERING_PLANS.length,
  qualityDimensions: QUALITY_DIMENSIONS.length,
  costBuckets: COST_BUCKETS.length,
  riskCategories: RISK_CATEGORIES.length,
  competitorsSupported: COMPETITORS.length,
  createsNewRuntime: false,
  createsNewTables: false,
  duplicatesArchitectureEngine: false,
  autoExecutes: false,
  handoffTarget: "R158_ApprovalGateway",
} as const;
