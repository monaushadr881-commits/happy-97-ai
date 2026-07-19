/**
 * R167 — AI Documentation Engine™
 *
 * PURE GOVERNANCE + DOCUMENTATION LAYER. No new runtime, no V2 engines.
 * Reuses canonical owners: Approval Gateway (R158), Intent Engine (R159),
 * Guardian AI (R160), Software Architect (R161), Code Review (R162),
 * QA (R163), Impact Analyzer (R164), Preview Studio (R165),
 * Rollback (R166), Brain, Memory, Conversation, Workspace, Search,
 * Knowledge, Creator, Revenue, Business OS, Founder Dashboard, Audit,
 * Analytics, Happy ID, RBAC.
 *
 * Every implementation MUST produce complete documentation before
 * R158 Approval Gateway marks it COMPLETE. Auto-completion without
 * documentation is compile-time forbidden.
 */

export const DOCUMENTATION_TYPES = [
  "architecture",
  "api",
  "database",
  "module",
  "component",
  "business",
  "founder",
  "user",
  "developer",
  "security",
  "deployment",
  "recovery",
  "release",
  "migration",
  "integration",
] as const;
export type DocumentationType = (typeof DOCUMENTATION_TYPES)[number];

export const CHANGELOG_FIELDS = [
  "version",
  "date",
  "founder",
  "summary",
  "files_changed",
  "modules_changed",
  "apis_changed",
  "tables_changed",
  "security_impact",
  "performance_impact",
  "rollback_available",
] as const;
export type ChangelogField = (typeof CHANGELOG_FIELDS)[number];

export const RELEASE_NOTES_SECTIONS = [
  "new_features",
  "bug_fixes",
  "performance_improvements",
  "security_improvements",
  "architecture_changes",
  "known_limitations",
  "future_work",
] as const;
export type ReleaseNotesSection = (typeof RELEASE_NOTES_SECTIONS)[number];

export const API_DOC_FIELDS = [
  "endpoints",
  "methods",
  "authentication",
  "authorization",
  "validation",
  "examples",
  "responses",
  "errors",
  "rate_limits",
] as const;
export type ApiDocField = (typeof API_DOC_FIELDS)[number];

export const DATABASE_DOC_FIELDS = [
  "tables",
  "relations",
  "indexes",
  "constraints",
  "policies",
  "migrations",
  "rollback_plan",
] as const;
export type DatabaseDocField = (typeof DATABASE_DOC_FIELDS)[number];

export const ARCHITECTURE_DOC_FIELDS = [
  "system_overview",
  "module_diagram",
  "dependency_graph",
  "component_map",
  "data_flow",
  "service_flow",
  "folder_structure",
] as const;
export type ArchitectureDocField = (typeof ARCHITECTURE_DOC_FIELDS)[number];

export const SECURITY_DOC_FIELDS = [
  "authentication",
  "authorization",
  "risk_controls",
  "guardian_ai",
  "founder_security",
  "audit_coverage",
  "recovery_strategy",
] as const;
export type SecurityDocField = (typeof SECURITY_DOC_FIELDS)[number];

export const USER_DOC_FIELDS = [
  "how_to_use",
  "screens",
  "settings",
  "permissions",
  "troubleshooting",
  "faq",
] as const;
export type UserDocField = (typeof USER_DOC_FIELDS)[number];

export const DEVELOPER_DOC_FIELDS = [
  "implementation_notes",
  "architecture_notes",
  "code_references",
  "dependencies",
  "extension_points",
  "canonical_owners",
] as const;
export type DeveloperDocField = (typeof DEVELOPER_DOC_FIELDS)[number];

export const FOUNDER_DOC_FIELDS = [
  "executive_summary",
  "business_impact",
  "revenue_impact",
  "security_impact",
  "risk_summary",
  "recommendation",
] as const;
export type FounderDocField = (typeof FOUNDER_DOC_FIELDS)[number];

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
  "R145_FounderDashboard",
  "R130_Audit",
  "R104_Analytics",
  "R153_HappyID",
  "R156_RBAC",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const QUALITY_GATES = [
  "documentation_missing",
  "architecture_missing",
  "api_docs_missing",
  "database_docs_missing",
  "security_docs_missing",
  "release_notes_missing",
] as const;
export type QualityGate = (typeof QUALITY_GATES)[number];

export const AI_REVIEW_AREAS = [
  "accuracy",
  "completeness",
  "consistency",
  "canonical_owner_references",
  "architecture_compliance",
] as const;
export type AiReviewArea = (typeof AI_REVIEW_AREAS)[number];

export const PIPELINE_STAGES = [
  "intake",
  "collectContext",
  "generateDocs",
  "generateChangelog",
  "generateReleaseNotes",
  "aiReview",
  "qualityGates",
  "founderPresentation",
  "audit",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface GeneratedDoc {
  type: DocumentationType;
  path: string;
  complete: boolean;
  reviewed: boolean;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  founder: string;
  summary: string;
  files_changed: string[];
  modules_changed: string[];
  apis_changed: string[];
  tables_changed: string[];
  security_impact: "none" | "low" | "medium" | "high" | "critical";
  performance_impact: "none" | "low" | "medium" | "high" | "critical";
  rollback_available: boolean;
}

export interface ReleaseNotes {
  version: string;
  sections: Record<ReleaseNotesSection, string[]>;
}

export interface DocumentationRequest {
  implementationId: string;
  founderId: string;
  affectsApi: boolean;
  affectsDatabase: boolean;
  affectsSecurity: boolean;
  affectsUi: boolean;
  affectsBusiness: boolean;
  docs: GeneratedDoc[];
  changelog?: ChangelogEntry;
  releaseNotes?: ReleaseNotes;
  auditPresent: boolean;
}

export interface AiReview {
  area: AiReviewArea;
  score: number; // 0..100
  issues: string[];
}

export interface FounderPresentation {
  implementationId: string;
  docTypes: DocumentationType[];
  changelogVersion?: string;
  releaseVersion?: string;
  gates: QualityGate[];
  aiReviewScore: number;
}

export interface DocumentationDecision {
  recommendation: "complete" | "needs_revision" | "block";
  gates: QualityGate[];
  presentation: FounderPresentation;
  aiReview: AiReview[];
  canAutoComplete: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

/** Required documentation types for a given change surface. */
export function requiredDocTypes(req: DocumentationRequest): DocumentationType[] {
  const required: DocumentationType[] = ["architecture", "developer", "founder", "release"];
  if (req.affectsApi) required.push("api");
  if (req.affectsDatabase) required.push("database", "migration");
  if (req.affectsSecurity) required.push("security");
  if (req.affectsUi || req.affectsBusiness) required.push("user");
  return required;
}

export function detectGates(req: DocumentationRequest): QualityGate[] {
  const gates = new Set<QualityGate>();
  const present = new Set(req.docs.filter((d) => d.complete).map((d) => d.type));
  const required = requiredDocTypes(req);

  if (required.some((t) => !present.has(t))) gates.add("documentation_missing");
  if (!present.has("architecture")) gates.add("architecture_missing");
  if (req.affectsApi && !present.has("api")) gates.add("api_docs_missing");
  if (req.affectsDatabase && !present.has("database")) gates.add("database_docs_missing");
  if (req.affectsSecurity && !present.has("security")) gates.add("security_docs_missing");
  if (!req.releaseNotes) gates.add("release_notes_missing");

  return [...gates];
}

export function runAiReview(req: DocumentationRequest): AiReview[] {
  const reviewed = req.docs.filter((d) => d.reviewed).length;
  const total = Math.max(req.docs.length, 1);
  const coverage = Math.round((reviewed / total) * 100);
  const complete = req.docs.every((d) => d.complete) ? 100 : 60;
  const canonicalRefs = req.docs.length > 0 ? 90 : 0;
  return [
    { area: "accuracy", score: coverage, issues: [] },
    { area: "completeness", score: complete, issues: complete < 100 ? ["Some docs incomplete"] : [] },
    { area: "consistency", score: coverage, issues: [] },
    { area: "canonical_owner_references", score: canonicalRefs, issues: [] },
    { area: "architecture_compliance", score: complete, issues: [] },
  ];
}

export function evaluateDocumentation(req: DocumentationRequest): DocumentationDecision {
  const gates = detectGates(req);
  const aiReview = runAiReview(req);
  const avgScore = Math.round(aiReview.reduce((a, r) => a + r.score, 0) / aiReview.length);
  const recommendation: DocumentationDecision["recommendation"] =
    gates.length > 0 ? "block" : avgScore < 80 ? "needs_revision" : "complete";

  const presentation: FounderPresentation = {
    implementationId: req.implementationId,
    docTypes: req.docs.map((d) => d.type),
    changelogVersion: req.changelog?.version,
    releaseVersion: req.releaseNotes?.version,
    gates,
    aiReviewScore: avgScore,
  };

  return {
    recommendation,
    gates,
    presentation,
    aiReview,
    canAutoComplete: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R167_POLICY = {
  id: "R167",
  name: "AI Documentation Engine",
  reuseOnly: true,
  newRuntime: false,
  canAutoComplete: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  canonicalOwners: CANONICAL_OWNERS,
  documentationTypes: DOCUMENTATION_TYPES,
  changelogFields: CHANGELOG_FIELDS,
  releaseNotesSections: RELEASE_NOTES_SECTIONS,
  apiDocFields: API_DOC_FIELDS,
  databaseDocFields: DATABASE_DOC_FIELDS,
  architectureDocFields: ARCHITECTURE_DOC_FIELDS,
  securityDocFields: SECURITY_DOC_FIELDS,
  userDocFields: USER_DOC_FIELDS,
  developerDocFields: DEVELOPER_DOC_FIELDS,
  founderDocFields: FOUNDER_DOC_FIELDS,
  qualityGates: QUALITY_GATES,
  aiReviewAreas: AI_REVIEW_AREAS,
  pipeline: PIPELINE_STAGES,
} as const;
