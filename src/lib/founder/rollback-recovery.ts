/**
 * R166 — One-Click Rollback & Recovery™
 *
 * PURE GOVERNANCE + RECOVERY LAYER. No new runtime, no V2 engines.
 * Reuses canonical owners: Approval Gateway (R158), Guardian AI (R160),
 * Software Architect (R161), Code Review (R162), QA (R163),
 * Impact Analyzer (R164), Preview Studio (R165), Brain, Memory, Audit,
 * Analytics, Happy ID, RBAC.
 *
 * Every rollback MUST route through R158 Approval Gateway.
 * Auto-rollback is compile-time forbidden.
 */

export const ROLLBACK_TYPES = [
  "feature",
  "module",
  "ui",
  "api",
  "database_plan",
  "workspace",
  "company",
  "deployment",
  "configuration",
  "creative_asset",
] as const;
export type RollbackType = (typeof ROLLBACK_TYPES)[number];

export const RECOVERY_TYPES = [
  "feature",
  "deployment",
  "configuration",
  "workspace",
  "company",
  "user",
  "session",
  "creative",
] as const;
export type RecoveryType = (typeof RECOVERY_TYPES)[number];

export const SNAPSHOT_KINDS = [
  "rollback",
  "configuration",
  "metadata",
  "dependency",
  "documentation",
  "audit",
] as const;
export type SnapshotKind = (typeof SNAPSHOT_KINDS)[number];

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
  "R145_FounderDashboard",
  "R130_Audit",
  "R104_Analytics",
  "R153_HappyID",
  "R156_RBAC",
] as const;
export type CanonicalOwner = (typeof CANONICAL_OWNERS)[number];

export const QUALITY_GATES = [
  "data_loss_risk",
  "architecture_break",
  "dependency_conflict",
  "critical_security_risk",
  "incomplete_snapshot",
  "missing_audit",
] as const;
export type QualityGate = (typeof QUALITY_GATES)[number];

export const AI_VERIFICATION_AREAS = [
  "architecture",
  "security",
  "performance",
  "database",
  "api",
  "business_logic",
] as const;
export type AiVerificationArea = (typeof AI_VERIFICATION_AREAS)[number];

export const FOUNDER_CONTROLS = [
  "rollback",
  "restore",
  "compare",
  "preview",
  "recovery_simulation",
  "cancel",
  "schedule",
  "approve",
] as const;

export const PIPELINE_STAGES = [
  "intake",
  "loadVersionHistory",
  "analyseImpact",
  "verifySnapshot",
  "aiVerification",
  "qualityGates",
  "simulateRecovery",
  "founderPresentation",
  "audit",
  "handoff",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface Snapshot {
  kind: SnapshotKind;
  createdAt: string;
  versionId: string;
  complete: boolean;
}

export interface VersionHistoryEntry {
  timestamp: string;
  version: string;
  founderId: string;
  workspaceId: string;
  companyId: string;
  affectedModules: string[];
  affectedApis: string[];
  affectedFiles: string[];
  rollbackAvailable: boolean;
  recoveryAvailable: boolean;
}

export interface RollbackAnalysis {
  affectedFiles: string[];
  affectedComponents: string[];
  affectedApis: string[];
  affectedTables: string[];
  affectedUsers: number;
  affectedCompanies: number;
  affectedRevenueCents: number;
  affectedSecurityScopes: string[];
  estimatedRecoveryMinutes: number;
}

export interface RecoverySimulation {
  recoveryMinutes: number;
  affectedModules: string[];
  affectedUsers: number;
  businessImpact: "none" | "low" | "medium" | "high" | "critical";
  securityImpact: "none" | "low" | "medium" | "high" | "critical";
  successProbability: number; // 0..1
}

export interface RollbackRequest {
  type: RollbackType;
  currentVersion: string;
  targetVersion: string;
  reason: string;
  founderId: string;
  snapshots: Snapshot[];
  analysis: RollbackAnalysis;
  auditPresent: boolean;
  triggeredGates?: QualityGate[];
}

export interface FounderPresentation {
  currentVersion: string;
  targetVersion: string;
  reason: string;
  benefits: string[];
  risks: string[];
  estimatedMinutes: number;
  businessImpact: RecoverySimulation["businessImpact"];
  rollbackConfidence: number;
}

export interface RollbackDecision {
  recommendation: "proceed" | "proceed_with_care" | "block";
  gates: QualityGate[];
  presentation: FounderPresentation;
  canAutoExecute: false;
  handoffTarget: "R158_ApprovalGateway";
  reuseOnly: true;
  newRuntime: false;
}

export const REQUIRED_SNAPSHOTS: SnapshotKind[] = [
  "rollback",
  "configuration",
  "audit",
];

export function detectGates(req: RollbackRequest): QualityGate[] {
  const gates = new Set<QualityGate>(req.triggeredGates ?? []);
  const kinds = new Set(req.snapshots.filter((s) => s.complete).map((s) => s.kind));
  for (const need of REQUIRED_SNAPSHOTS) {
    if (!kinds.has(need)) gates.add("incomplete_snapshot");
  }
  if (!req.auditPresent) gates.add("missing_audit");
  if (req.analysis.affectedTables.length > 0 && req.type !== "database_plan") {
    // Data touched but no DB rollback plan attached
    gates.add("data_loss_risk");
  }
  return [...gates];
}

export function simulateRecovery(req: RollbackRequest): RecoverySimulation {
  const users = req.analysis.affectedUsers;
  const revenue = req.analysis.affectedRevenueCents;
  const businessImpact: RecoverySimulation["businessImpact"] =
    revenue > 1_000_000 || users > 10_000
      ? "critical"
      : revenue > 100_000 || users > 1_000
        ? "high"
        : revenue > 10_000 || users > 100
          ? "medium"
          : users > 0
            ? "low"
            : "none";
  const securityImpact: RecoverySimulation["securityImpact"] =
    req.analysis.affectedSecurityScopes.length > 3
      ? "high"
      : req.analysis.affectedSecurityScopes.length > 0
        ? "medium"
        : "none";
  const snapshotCoverage = req.snapshots.filter((s) => s.complete).length /
    Math.max(SNAPSHOT_KINDS.length, 1);
  const successProbability = Math.max(0, Math.min(1, snapshotCoverage * 0.9));
  return {
    recoveryMinutes: req.analysis.estimatedRecoveryMinutes,
    affectedModules: req.analysis.affectedComponents,
    affectedUsers: users,
    businessImpact,
    securityImpact,
    successProbability,
  };
}

export function evaluateRollback(req: RollbackRequest): RollbackDecision {
  const gates = detectGates(req);
  const sim = simulateRecovery(req);
  const recommendation: RollbackDecision["recommendation"] =
    gates.length > 0
      ? "block"
      : sim.businessImpact === "critical" || sim.securityImpact === "high"
        ? "proceed_with_care"
        : "proceed";

  const presentation: FounderPresentation = {
    currentVersion: req.currentVersion,
    targetVersion: req.targetVersion,
    reason: req.reason,
    benefits: [
      "Restores previously validated state",
      "Reverses regressions or incidents",
    ],
    risks: gates.length > 0
      ? gates.map((g) => `Gate triggered: ${g}`)
      : ["Standard rollback risk"],
    estimatedMinutes: sim.recoveryMinutes,
    businessImpact: sim.businessImpact,
    rollbackConfidence: sim.successProbability,
  };

  return {
    recommendation,
    gates,
    presentation,
    canAutoExecute: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
  };
}

export const R166_POLICY = {
  id: "R166",
  name: "One-Click Rollback & Recovery",
  reuseOnly: true,
  newRuntime: false,
  canAutoExecute: false,
  handoffTarget: "R158_ApprovalGateway" as const,
  canonicalOwners: CANONICAL_OWNERS,
  rollbackTypes: ROLLBACK_TYPES,
  recoveryTypes: RECOVERY_TYPES,
  snapshotKinds: SNAPSHOT_KINDS,
  qualityGates: QUALITY_GATES,
  aiVerificationAreas: AI_VERIFICATION_AREAS,
  pipeline: PIPELINE_STAGES,
} as const;
