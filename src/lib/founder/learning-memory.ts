/**
 * R169 — Founder Learning Memory™
 *
 * PURE GOVERNANCE + LEARNING LAYER. No new runtime, no Memory V2,
 * no Learning V2, no Preference Engine V2.
 * Reuses canonical owners: R116 Memory, R158 Approval Gateway,
 * R159 Intent Engine, R160 Guardian AI, R161 Software Architect,
 * R162 Code Review, R163 QA, R164 Impact Analyzer, R165 Preview,
 * R166 Rollback, R167 Documentation Engine, R168 Optimization Advisor,
 * Brain, Conversation, Workspace, Search, Knowledge, Creator,
 * Revenue, Business OS, Founder Dashboard, Audit, Analytics,
 * Happy ID, RBAC.
 *
 * HAPPY AI never overwrites Founder decisions, architecture locks,
 * security or revenue policies. Every new learning routes through
 * R158 Approval Gateway. Compile-time lock: `canAutoLearn: false`.
 */

export const LEARNING_DOMAINS = [
  "founder_preferences",
  "architecture_decisions",
  "security_decisions",
  "business_rules",
  "revenue_policies",
  "brand_guidelines",
  "coding_style",
  "documentation_style",
  "ui_preferences",
  "ux_preferences",
  "theme_preferences",
  "color_preferences",
  "typography_preferences",
  "testing_standards",
  "deployment_standards",
  "approval_patterns",
  "rollback_preferences",
  "optimization_preferences",
  "communication_style",
  "company_sops",
] as const;
export type LearningDomain = (typeof LEARNING_DOMAINS)[number];

export const MEMORY_CLASSES = [
  "permanent",
  "long_term",
  "project",
  "workspace",
  "company",
  "brand",
  "temporary",
] as const;
export type MemoryClass = (typeof MEMORY_CLASSES)[number];

export const LEARNING_SOURCES = [
  "founder_approvals",
  "founder_conversations",
  "founder_decisions",
  "founder_registry",
  "architecture_lock",
  "approved_documentation",
  "approved_workflows",
] as const;
export type LearningSource = (typeof LEARNING_SOURCES)[number];

export const NEVER_LEARN_SOURCES = [
  "temporary_experiments",
  "rejected_ideas",
  "failed_proposals",
  "blocked_implementations",
] as const;
export type NeverLearnSource = (typeof NEVER_LEARN_SOURCES)[number];

export const QUALITY_DIMENSIONS = [
  "confidence",
  "recency",
  "approval_status",
  "source",
  "owner",
  "validity",
] as const;
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

export const AUTOMATIC_CHECKS = [
  "duplicate_memory",
  "conflicting_policies",
  "expired_decisions",
  "invalid_references",
  "missing_approval",
  "architecture_conflicts",
] as const;
export type AutomaticCheck = (typeof AUTOMATIC_CHECKS)[number];

export const SUGGESTION_KINDS = [
  "previously_approved_patterns",
  "existing_components",
  "existing_apis",
  "existing_modules",
  "existing_workflows",
  "existing_documentation",
] as const;
export type SuggestionKind = (typeof SUGGESTION_KINDS)[number];

export const PROTECTED_DOMAINS: LearningDomain[] = [
  "architecture_decisions",
  "security_decisions",
  "revenue_policies",
];

export const FOUNDER_CONTROLS = [
  "review",
  "approve",
  "reject",
  "pin",
  "archive",
  "expire",
  "restore",
  "compare",
  "search",
] as const;
export type FounderControl = (typeof FOUNDER_CONTROLS)[number];

export const OUTPUT_REPORTS = [
  "learning_summary",
  "knowledge_summary",
  "policy_summary",
  "preference_summary",
  "memory_health",
  "confidence_score",
  "conflict_report",
] as const;
export type OutputReport = (typeof OUTPUT_REPORTS)[number];

export const CANONICAL_OWNERS = [
  "R114_Brain",
  "R115_Memory",
  "R116_Conversation",
  "R117_Workspace",
  "R118_Search",
  "R119_Knowledge",
  "R120_Creator",
  "R126_Revenue",
  "R128_BusinessOS",
  "R158_ApprovalGateway",
  "R159_IntentEngine",
  "R160_GuardianAI",
  "R161_SoftwareArchitect",
  "R162_CodeReview",
  "R163_QAEngineer",
  "R164_ImpactAnalyzer",
  "R165_PreviewStudio",
  "R166_RollbackRecovery",
  "R167_DocumentationEngine",
  "R168_OptimizationAdvisor",
  "R145_FounderDashboard",
  "R130_Audit",
  "R104_Analytics",
  "R153_HappyID",
  "R156_RBAC",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const PIPELINE_STAGES = [
  "intake",
  "classifySource",
  "gateForbiddenSources",
  "classifyMemory",
  "scoreQuality",
  "detectConflicts",
  "detectDuplicates",
  "protectLocks",
  "suggest",
  "audit",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface CandidateLearning {
  id: string;
  domain: LearningDomain;
  source: LearningSource | NeverLearnSource;
  memoryClass: MemoryClass;
  content: string;
  approvedByFounder: boolean;
  confidence: number; // 0..1
  recencyDays: number;
  ownerId: string;
  overwrites?: { domain: LearningDomain; existingId: string; founderApproved: boolean };
  references?: string[];
  expiresAt?: string;
}

export interface QualityScore {
  confidence: number;
  recency: number;
  approval_status: number;
  source: number;
  owner: number;
  validity: number;
  overall: number;
}

export interface ConflictReport {
  duplicates: string[];
  conflicts: string[];
  expired: string[];
  invalidReferences: string[];
  missingApproval: string[];
  architectureConflicts: string[];
}

export interface LearningDecision {
  recommendation: "learn" | "hold" | "reject";
  checks: AutomaticCheck[];
  quality: QualityScore;
  conflicts: ConflictReport;
  canAutoLearn: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

export function isForbiddenSource(source: string): boolean {
  return (NEVER_LEARN_SOURCES as readonly string[]).includes(source);
}

export function scoreQuality(c: CandidateLearning): QualityScore {
  const confidence = Math.round(c.confidence * 100);
  const recency = c.recencyDays <= 7 ? 100 : c.recencyDays <= 30 ? 80 : c.recencyDays <= 180 ? 50 : 20;
  const approval_status = c.approvedByFounder ? 100 : 0;
  const source = isForbiddenSource(c.source) ? 0 : 100;
  const owner = c.ownerId ? 100 : 0;
  const validity = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now() ? 0 : 100;
  const overall = Math.round((confidence + recency + approval_status + source + owner + validity) / 6);
  return { confidence, recency, approval_status, source, owner, validity, overall };
}

export function detectConflicts(
  candidate: CandidateLearning,
  existing: CandidateLearning[],
): ConflictReport {
  const duplicates = existing
    .filter((e) => e.domain === candidate.domain && e.content === candidate.content)
    .map((e) => e.id);
  const conflicts = existing
    .filter((e) => e.domain === candidate.domain && e.content !== candidate.content && e.approvedByFounder)
    .map((e) => e.id);
  const expired = candidate.expiresAt && new Date(candidate.expiresAt).getTime() < Date.now()
    ? [candidate.id] : [];
  const invalidReferences = (candidate.references ?? []).filter(
    (ref) => !existing.some((e) => e.id === ref),
  );
  const missingApproval = candidate.approvedByFounder ? [] : [candidate.id];
  const architectureConflicts = candidate.overwrites &&
    PROTECTED_DOMAINS.includes(candidate.overwrites.domain) &&
    !candidate.overwrites.founderApproved
      ? [candidate.overwrites.existingId] : [];
  return { duplicates, conflicts, expired, invalidReferences, missingApproval, architectureConflicts };
}

export function detectChecks(report: ConflictReport): AutomaticCheck[] {
  const checks: AutomaticCheck[] = [];
  if (report.duplicates.length) checks.push("duplicate_memory");
  if (report.conflicts.length) checks.push("conflicting_policies");
  if (report.expired.length) checks.push("expired_decisions");
  if (report.invalidReferences.length) checks.push("invalid_references");
  if (report.missingApproval.length) checks.push("missing_approval");
  if (report.architectureConflicts.length) checks.push("architecture_conflicts");
  return checks;
}

export function evaluateLearning(
  candidate: CandidateLearning,
  existing: CandidateLearning[] = [],
): LearningDecision {
  const quality = scoreQuality(candidate);
  const conflicts = detectConflicts(candidate, existing);
  const checks = detectChecks(conflicts);

  const forbidden = isForbiddenSource(candidate.source);
  const overwritingProtected = candidate.overwrites &&
    PROTECTED_DOMAINS.includes(candidate.overwrites.domain) &&
    !candidate.overwrites.founderApproved;

  const recommendation: LearningDecision["recommendation"] =
    forbidden || overwritingProtected
      ? "reject"
      : checks.length > 0 || quality.overall < 70
        ? "hold"
        : "learn";

  return {
    recommendation,
    checks,
    quality,
    conflicts,
    canAutoLearn: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R169_POLICY = {
  id: "R169",
  name: "Founder Learning Memory",
  reuseOnly: true,
  newRuntime: false,
  canAutoLearn: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  canonicalOwners: CANONICAL_OWNERS,
  learningDomains: LEARNING_DOMAINS,
  memoryClasses: MEMORY_CLASSES,
  learningSources: LEARNING_SOURCES,
  neverLearnSources: NEVER_LEARN_SOURCES,
  qualityDimensions: QUALITY_DIMENSIONS,
  automaticChecks: AUTOMATIC_CHECKS,
  suggestionKinds: SUGGESTION_KINDS,
  protectedDomains: PROTECTED_DOMAINS,
  founderControls: FOUNDER_CONTROLS,
  outputReports: OUTPUT_REPORTS,
  pipeline: PIPELINE_STAGES,
} as const;
