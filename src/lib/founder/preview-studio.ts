/**
 * R165 — AI Preview Studio™ (Preview • Simulation • Sandbox • Approval)
 *
 * Pure governance + preview layer. ZERO new runtime, ZERO Preview V2,
 * ZERO Sandbox V2, ZERO Simulation Engine V2. Composes existing
 * canonical owners only:
 *
 *   - Intent Engine       → src/lib/founder/intent-engine.ts (R159)
 *   - Software Architect  → src/lib/founder/software-architect.ts (R161)
 *   - Code Review         → src/lib/founder/code-review-engineer.ts (R162)
 *   - QA & Testing        → src/lib/founder/qa-testing-engineer.ts (R163)
 *   - Impact Analyzer     → src/lib/founder/impact-analyzer.ts (R164)
 *   - Guardian AI         → src/lib/founder/guardian-ai.ts (R160)
 *   - Approval Gateway    → src/lib/founder/approval-gateway.ts (R158) [handoff]
 *   - Brain / Memory / Search / Audit / RBAC / HappyID / Analytics
 *
 * FOLLOWS: R91 R104 R111 R115B R116 R118 R119 R120 R126 R128 R130 R145
 *          R153 R156 R157 R158 R159 R160 R161 R162 R163 R164.
 *
 * The Preview Studio NEVER deploys. It runs previews inside an isolated
 * sandbox and produces a Preview Package handed off to R158.
 */

// ─── Supported preview surfaces (15) ─────────────────────────────────────
export const PREVIEW_SURFACES = [
  "website", "landing_pages", "admin_panels", "founder_dashboard",
  "business_os", "crm", "erp", "inventory", "finance", "creator",
  "website_builder", "android_builder", "ios_builder", "digital_human",
  "creative_studio",
] as const;
export type PreviewSurface = (typeof PREVIEW_SURFACES)[number];

// ─── Device previews (8) ─────────────────────────────────────────────────
export const PREVIEW_DEVICES = [
  "desktop", "laptop", "tablet", "android",
  "iphone", "foldables", "landscape", "portrait",
] as const;
export type PreviewDevice = (typeof PREVIEW_DEVICES)[number];

// ─── Display modes (5) ───────────────────────────────────────────────────
export const PREVIEW_DISPLAY_MODES = [
  "light", "dark", "high_contrast", "founder_theme", "brand_theme",
] as const;
export type PreviewDisplayMode = (typeof PREVIEW_DISPLAY_MODES)[number];

// ─── Simulation flows (11) ───────────────────────────────────────────────
export const SIMULATION_FLOWS = [
  "navigation", "user_journey", "founder_journey", "builder_journey",
  "checkout", "login", "registration", "payments", "credits",
  "deployments", "preview",
] as const;
export type SimulationFlow = (typeof SIMULATION_FLOWS)[number];

// ─── Change-preview diff kinds (6) ───────────────────────────────────────
export const CHANGE_PREVIEW_KINDS = [
  "current_version", "proposed_version",
  "visual_diff", "component_diff", "layout_diff", "style_diff",
] as const;
export type ChangePreviewKind = (typeof CHANGE_PREVIEW_KINDS)[number];

// ─── Impact overlay layers (10) ──────────────────────────────────────────
export const IMPACT_OVERLAY_LAYERS = [
  "files", "components", "routes", "database", "apis",
  "users", "companies", "revenue", "performance", "security",
] as const;
export type ImpactOverlayLayer = (typeof IMPACT_OVERLAY_LAYERS)[number];

// ─── AI review checks (8) ────────────────────────────────────────────────
export const PREVIEW_AI_REVIEW_CHECKS = [
  "accessibility", "responsiveness", "consistency", "brand_identity",
  "typography", "spacing", "alignment", "dark_mode",
] as const;
export type PreviewAiReviewCheck = (typeof PREVIEW_AI_REVIEW_CHECKS)[number];

// ─── Founder controls (8) ────────────────────────────────────────────────
export const FOUNDER_PREVIEW_CONTROLS = [
  "approve", "reject", "modify", "compare",
  "ask_ai", "preview_again", "schedule", "cancel",
] as const;
export type FounderPreviewControl = (typeof FOUNDER_PREVIEW_CONTROLS)[number];

// ─── Quality gates (any → block preview approval) ────────────────────────
export const PREVIEW_QUALITY_GATES = [
  "architecture_break", "duplicate_runtime", "duplicate_api",
  "duplicate_database", "security_failure",
  "critical_qa_failure", "critical_review_failure",
] as const;
export type PreviewQualityGate = (typeof PREVIEW_QUALITY_GATES)[number];

// ─── Pipeline (10 stages) ────────────────────────────────────────────────
export const PREVIEW_PIPELINE = [
  "intake", "sandbox", "render", "simulate", "overlay",
  "aiReview", "gate", "founderPresentation", "audit", "handoff",
] as const;
export type PreviewStage = (typeof PREVIEW_PIPELINE)[number];

// ─── Canonical owners reused ─────────────────────────────────────────────
export const PREVIEW_CANONICAL_OWNERS_REUSED = [
  "IntentEngine", "SoftwareArchitect", "CodeReviewEngineer",
  "QaTestingEngineer", "ImpactAnalyzer", "GuardianAI", "ApprovalGateway",
  "Brain", "Memory", "Conversation", "Workspace", "Search", "Knowledge",
  "Creator", "Revenue", "BusinessOS", "FounderDashboard",
  "Audit", "RBAC", "HappyID", "Analytics",
] as const;
export type PreviewCanonicalOwner = (typeof PREVIEW_CANONICAL_OWNERS_REUSED)[number];

// ─── Input contract from prior stages ────────────────────────────────────
export type PreviewInput = {
  surface: PreviewSurface;
  devices: readonly PreviewDevice[];
  displayModes: readonly PreviewDisplayMode[];
  flows: readonly SimulationFlow[];
  reviewApproval: "approve" | "approve_with_changes" | "block"; // R162
  qaDecision: "READY" | "READY_WITH_WARNINGS" | "NOT_READY";    // R163
  impactRecommendation: "proceed" | "proceed_with_care" | "block"; // R164
  duplicatesDetected: readonly string[];
  architectureBreak: boolean;
  securityFailure: boolean;
};

// ─── Founder presentation ────────────────────────────────────────────────
export type PreviewFounderPresentation = {
  whatChanged: string[];
  why: string;
  benefits: string[];
  risks: string[];
  performanceImpact: string;
  businessImpact: string;
  securityImpact: string;
  rollback: string;
};

// ─── Preview Package (compile-time locked handoff to R158) ───────────────
export type PreviewPackage = {
  readonly version: "R165";
  readonly canAutoDeploy: false;
  readonly sandboxed: true;
  readonly touchesProduction: false;
  readonly handoffTarget: "R158_ApprovalGateway";
  readonly reuseOnly: true;
  readonly newRuntime: false;
  surface: PreviewSurface;
  devices: readonly PreviewDevice[];
  displayModes: readonly PreviewDisplayMode[];
  simulations: readonly SimulationFlow[];
  changePreviews: readonly ChangePreviewKind[];
  overlays: readonly ImpactOverlayLayer[];
  aiReviewChecks: readonly PreviewAiReviewCheck[];
  founderControls: readonly FounderPreviewControl[];
  gatesTriggered: readonly PreviewQualityGate[];
  presentation: PreviewFounderPresentation;
  reused: readonly PreviewCanonicalOwner[];
};

// ─── Detect quality gates ────────────────────────────────────────────────
export function detectPreviewGates(input: PreviewInput): PreviewQualityGate[] {
  const g: PreviewQualityGate[] = [];
  for (const d of input.duplicatesDetected) {
    if (d.includes("runtime")) g.push("duplicate_runtime");
    if (d.includes("api")) g.push("duplicate_api");
    if (d.includes("database") || d.includes("table")) g.push("duplicate_database");
  }
  if (input.architectureBreak) g.push("architecture_break");
  if (input.securityFailure) g.push("security_failure");
  if (input.qaDecision === "NOT_READY") g.push("critical_qa_failure");
  if (input.reviewApproval === "block") g.push("critical_review_failure");
  return Array.from(new Set(g));
}

// ─── Build Preview Package ───────────────────────────────────────────────
export function buildPreviewPackage(
  input: PreviewInput,
  presentation: PreviewFounderPresentation,
): PreviewPackage {
  const gates = detectPreviewGates(input);
  return {
    version: "R165",
    canAutoDeploy: false,
    sandboxed: true,
    touchesProduction: false,
    handoffTarget: "R158_ApprovalGateway",
    reuseOnly: true,
    newRuntime: false,
    surface: input.surface,
    devices: input.devices,
    displayModes: input.displayModes,
    simulations: input.flows,
    changePreviews: CHANGE_PREVIEW_KINDS,
    overlays: IMPACT_OVERLAY_LAYERS,
    aiReviewChecks: PREVIEW_AI_REVIEW_CHECKS,
    founderControls: FOUNDER_PREVIEW_CONTROLS,
    gatesTriggered: gates,
    presentation,
    reused: PREVIEW_CANONICAL_OWNERS_REUSED,
  };
}
