/**
 * R158 — Founder Approval Gateway™ (Explain → Preview → Approve → Execute)
 *
 * Pure governance helper. NO new runtime, NO new dashboard, NO new
 * approval engine. Consumed by existing canonical owners:
 *   - Brain / Intent (R115B)          — src/lib/brain/engine.ts
 *   - Memory Intelligence (R116)       — src/lib/memory/intelligence.ts
 *   - Workspace (R118)                 — src/workspace/*
 *   - File Engine (R119/R137)          — src/lib/happy-r137/*
 *   - Search (R120/R138)               — src/lib/happy-r138/*
 *   - Creator OS (R126/R141)           — src/routes/_authenticated/studio.*
 *   - Revenue OS (R128)                — src/lib/happy-r128/*
 *   - Founder Dashboard (R130/R139)    — src/routes/_authenticated/founder.*
 *   - Security Center (R157)           — src/components/founder/FounderSecurityCenter.tsx
 *   - Identity Fortress (R156)         — src/lib/founder/identity-fortress.ts
 *   - Unlimited Policy (R153)          — src/lib/founder/unlimited-policy.ts
 *   - RBAC / Happy ID                  — public.user_roles + public.is_platform_founder
 *   - Audit (immutable)                — public.audit_logs + public.write_audit(...)
 *   - Approvals table                  — public.approvals
 *
 * Locks: R91 · R104 · R111 · R130 · R145 · R151 · R153 · R154 · R156 · R157.
 */

// ---------- Change categories (matches Founder scope; no V2 lists) ----------
export const CHANGE_KINDS = [
  "feature", "bugfix", "ui", "database", "api", "builder",
  "business", "creative", "infra", "deploy",
] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

// ---------- Approval tiers ----------
export const APPROVAL_TIERS = ["minor", "standard", "high_risk", "critical"] as const;
export type ApprovalTier = (typeof APPROVAL_TIERS)[number];

// ---------- Founder commands ----------
export const FOUNDER_COMMANDS = [
  "approve", "reject", "modify", "ask_ai", "compare",
  "preview_again", "schedule", "cancel",
] as const;
export type FounderCommand = (typeof FOUNDER_COMMANDS)[number];

// ---------- Pipeline stages (17 — matches mission diagram) ----------
export const APPROVAL_PIPELINE = [
  "request", "intent", "requirements", "architecture",
  "duplicate_detection", "security_review", "performance_review",
  "impact_analysis", "solution_planning", "preview",
  "explanation", "questions", "approval", "implementation",
  "testing", "documentation", "deployment", "monitoring",
] as const;
export type ApprovalStage = (typeof APPROVAL_PIPELINE)[number];

// ---------- Explanation contract ("Explain Before Execute™") ----------
export const EXPLANATION_FIELDS = [
  "what_changes", "why", "benefits", "risks",
  "performance_impact", "security_impact",
  "files_affected", "routes_affected", "apis_affected",
  "database_impact", "rollback_available", "estimated_minutes",
] as const;
export type ExplanationField = (typeof EXPLANATION_FIELDS)[number];

// ---------- Preview matrix ----------
export const PREVIEW_SURFACES = [
  "desktop", "tablet", "mobile", "android", "iphone",
] as const;
export const PREVIEW_THEMES = ["light", "dark"] as const;
export type PreviewSurface = (typeof PREVIEW_SURFACES)[number];
export type PreviewTheme = (typeof PREVIEW_THEMES)[number];

// ---------- Critical actions (always tier=critical, always MFA + audit) ----------
export const CRITICAL_ACTIONS = [
  "delete_database", "delete_users", "delete_companies",
  "delete_workspace", "delete_brain", "delete_memory",
  "delete_founder_assets", "delete_revenue_data",
] as const;
export type CriticalAction = (typeof CRITICAL_ACTIONS)[number];

// ---------- Impact-report fields ----------
export const IMPACT_FIELDS = [
  "files", "components", "routes", "apis",
  "tables", "indexes", "storage",
  "estimated_downtime_minutes", "rollback_plan",
] as const;

// ---------- Rollback envelope ----------
export const ROLLBACK_FIELDS = ["backup_id", "rollback_plan", "version", "audit_id"] as const;

// ---------- Types ----------
export type ChangeDescriptor = {
  kind: ChangeKind;
  action?: string;
  isCritical?: boolean;
  filesTouched?: number;
  routesTouched?: number;
  tablesTouched?: number;
  destructive?: boolean;
  affectsProduction?: boolean;
  affectsFounderAssets?: boolean;
  affectsRevenue?: boolean;
  securityImpact?: "none" | "low" | "medium" | "high" | "critical";
};

export type ApprovalRequirement = {
  tier: ApprovalTier;
  requiresPassword: boolean;
  requiresOtp: boolean;
  requiresFounderApproval: boolean;
  requiresAudit: boolean;
  requiresPreview: boolean;
  requiresRollback: boolean;
};

// ---------- Tier classification ----------
export function classifyChange(c: ChangeDescriptor): ApprovalTier {
  if (c.isCritical || CRITICAL_ACTIONS.includes(c.action as CriticalAction)) return "critical";
  if (c.destructive || c.affectsFounderAssets || c.affectsRevenue || c.securityImpact === "critical") return "critical";
  if (c.securityImpact === "high" || (c.affectsProduction && (c.tablesTouched ?? 0) > 0)) return "high_risk";
  if ((c.filesTouched ?? 0) > 10 || (c.routesTouched ?? 0) > 2 || c.securityImpact === "medium") return "standard";
  return "minor";
}

// ---------- Approval requirements per tier ----------
export function requirementsFor(tier: ApprovalTier): ApprovalRequirement {
  switch (tier) {
    case "critical":
      return { tier, requiresPassword: true, requiresOtp: true, requiresFounderApproval: true, requiresAudit: true, requiresPreview: true, requiresRollback: true };
    case "high_risk":
      return { tier, requiresPassword: true, requiresOtp: true, requiresFounderApproval: true, requiresAudit: true, requiresPreview: true, requiresRollback: true };
    case "standard":
      return { tier, requiresPassword: false, requiresOtp: false, requiresFounderApproval: true, requiresAudit: true, requiresPreview: true, requiresRollback: true };
    case "minor":
      return { tier, requiresPassword: false, requiresOtp: false, requiresFounderApproval: true, requiresAudit: true, requiresPreview: false, requiresRollback: false };
  }
}

// ---------- Pipeline navigation ----------
export function nextStage(current: ApprovalStage): ApprovalStage | "done" {
  const i = APPROVAL_PIPELINE.indexOf(current);
  if (i < 0 || i >= APPROVAL_PIPELINE.length - 1) return "done";
  return APPROVAL_PIPELINE[i + 1];
}

// ---------- Auto-execution guard (the "NEVER auto" rule) ----------
export function canAutoExecute(): false { return false; }

export function canExecute(input: {
  tier: ApprovalTier;
  approvedByFounder: boolean;
  passwordVerified: boolean;
  otpVerified: boolean;
  previewShown: boolean;
  rollbackPrepared: boolean;
  auditWritten: boolean;
}): boolean {
  const req = requirementsFor(input.tier);
  if (req.requiresFounderApproval && !input.approvedByFounder) return false;
  if (req.requiresPassword && !input.passwordVerified) return false;
  if (req.requiresOtp && !input.otpVerified) return false;
  if (req.requiresPreview && !input.previewShown) return false;
  if (req.requiresRollback && !input.rollbackPrepared) return false;
  if (req.requiresAudit && !input.auditWritten) return false;
  return true;
}

// ---------- Explanation completeness (Explain Before Execute™) ----------
export function isExplanationComplete(explain: Partial<Record<ExplanationField, unknown>>): boolean {
  return EXPLANATION_FIELDS.every((f) => explain[f] !== undefined && explain[f] !== null && explain[f] !== "");
}

export function missingExplanationFields(explain: Partial<Record<ExplanationField, unknown>>): ExplanationField[] {
  return EXPLANATION_FIELDS.filter((f) => explain[f] === undefined || explain[f] === null || explain[f] === "");
}

// ---------- Preview matrix completeness ----------
export function previewMatrix(): Array<{ surface: PreviewSurface; theme: PreviewTheme }> {
  return PREVIEW_SURFACES.flatMap((s) => PREVIEW_THEMES.map((t) => ({ surface: s, theme: t })));
}

// ---------- Founder command validity ----------
export function isValidCommand(cmd: string): cmd is FounderCommand {
  return (FOUNDER_COMMANDS as readonly string[]).includes(cmd);
}

// ---------- Rollback envelope check ----------
export function hasRollbackEnvelope(env: Partial<Record<(typeof ROLLBACK_FIELDS)[number], unknown>>): boolean {
  return ROLLBACK_FIELDS.every((k) => env[k] !== undefined && env[k] !== null && env[k] !== "");
}

// ---------- Snapshot for the Founder Dashboard ----------
export function approvalSnapshot(c: ChangeDescriptor) {
  const tier = classifyChange(c);
  return {
    tier,
    stages: APPROVAL_PIPELINE,
    commands: FOUNDER_COMMANDS,
    explainFields: EXPLANATION_FIELDS,
    previewMatrix: previewMatrix(),
    requirements: requirementsFor(tier),
    autoExecuteAllowed: canAutoExecute(), // always false
  };
}
