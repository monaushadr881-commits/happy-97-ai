/**
 * R159 — Founder Intent Engine™ (Human Intent → AI Engineering Workflow)
 *
 * Pure governance helper. NO new runtime, NO Brain V2, NO Intent V2,
 * NO Planning V2, NO Conversation V2, NO Memory V2.
 *
 * Consumed by existing canonical owners:
 *   - Brain / Intent (R115B)          — src/lib/brain/engine.ts
 *   - Memory Intelligence (R116)       — src/lib/memory/intelligence.ts
 *   - Conversation (R115B)             — src/lib/conversation/*
 *   - Workspace (R118)                 — src/workspace/*
 *   - File / Knowledge (R119/R137)     — src/lib/happy-r137/*
 *   - Search (R120/R138)               — src/lib/happy-r138/*
 *   - Creator OS (R126/R141)
 *   - Revenue OS (R128)
 *   - Founder Dashboard (R130/R139)
 *   - Approval Gateway (R158)          — src/lib/founder/approval-gateway.ts
 *   - Security Center (R157)
 *   - Identity Fortress (R156)
 *   - Unlimited Policy (R153)
 *   - Audit / RBAC / Happy ID
 *
 * Locks: R91 · R104 · R111 · R115B · R116 · R118 · R119 · R120 · R126 ·
 *        R128 · R130 · R145 · R153 · R156 · R157 · R158.
 */

import {
  classifyChange, requirementsFor, type ApprovalTier, type ChangeDescriptor,
} from "./approval-gateway";

// ---------- Input modalities the Founder may use ----------
export const INTENT_INPUT_MODES = [
  "text", "voice", "image", "video", "pdf",
  "screenshot", "drawing", "whiteboard", "document", "url", "mixed",
] as const;
export type IntentInputMode = (typeof INTENT_INPUT_MODES)[number];

// ---------- Intent types (Founder's world, not engineering) ----------
export const INTENT_TYPES = [
  "feature", "bugfix", "ui", "ux", "performance", "security",
  "business", "marketing", "revenue", "creative", "infra",
  "deploy", "automation", "analytics", "database", "api",
  "builder", "digital_human", "website", "android", "ios",
] as const;
export type IntentType = (typeof INTENT_TYPES)[number];

// ---------- Understanding contract (what HAPPY must extract) ----------
export const UNDERSTANDING_FIELDS = [
  "goal", "problem", "priority", "urgency",
  "affected_module", "dependencies", "risk", "expected_result",
] as const;
export type UnderstandingField = (typeof UNDERSTANDING_FIELDS)[number];

// ---------- AI-thinking artifacts ----------
export const THINKING_ARTIFACTS = [
  "requirements", "acceptance_criteria", "architecture",
  "affected_modules", "affected_apis", "affected_db",
  "affected_ui", "affected_tests", "affected_docs",
] as const;

// ---------- Automatic checks (before Approval Gateway) ----------
export const AUTOMATIC_CHECKS = [
  "architecture", "duplicate_runtime", "duplicate_api", "duplicate_table",
  "security", "performance", "scalability", "accessibility", "backward_compatibility",
] as const;
export type AutomaticCheck = (typeof AUTOMATIC_CHECKS)[number];

// ---------- Output plans (fed into R158) ----------
export const OUTPUT_PLANS = [
  "engineering", "implementation", "testing",
  "documentation", "rollback", "deployment",
] as const;
export type OutputPlan = (typeof OUTPUT_PLANS)[number];

// ---------- Founder presentation fields (matches R158 Explain contract) ----------
export const PRESENTATION_FIELDS = [
  "what_changes", "why", "benefits", "risks",
  "estimated_minutes", "files", "preview", "rollback",
] as const;

// ---------- Learning surfaces (persisted in existing Memory) ----------
export const LEARNING_SURFACES = [
  "founder_preferences", "architecture_rules", "coding_style",
  "design_style", "brand_rules", "business_rules",
] as const;
export type LearningSurface = (typeof LEARNING_SURFACES)[number];

// ---------- Suggestion domains ----------
export const SUGGESTION_DOMAINS = [
  "ux", "architecture", "performance", "security", "business",
] as const;
export type SuggestionDomain = (typeof SUGGESTION_DOMAINS)[number];

// ---------- Pipeline stages (Founder-facing, not engineering) ----------
export const INTENT_PIPELINE = [
  "capture",           // any modality
  "normalize",         // convert to text intent
  "understand",        // fill UNDERSTANDING_FIELDS
  "clarify",           // ask questions if any field is missing
  "think",             // generate THINKING_ARTIFACTS
  "check",             // AUTOMATIC_CHECKS
  "plan",              // OUTPUT_PLANS
  "present",           // PRESENTATION_FIELDS
  "handoff",           // hand to R158 Approval Gateway
] as const;
export type IntentStage = (typeof INTENT_PIPELINE)[number];

// ---------- Types ----------
export type Understanding = Partial<Record<UnderstandingField, unknown>>;

export type IntentDescriptor = {
  type: IntentType;
  input: IntentInputMode | IntentInputMode[];
  understanding: Understanding;
};

// ---------- Modality validation ----------
export function normalizeInputModes(input: IntentInputMode | IntentInputMode[]): IntentInputMode[] {
  const arr = Array.isArray(input) ? input : [input];
  return arr.filter((m) => (INTENT_INPUT_MODES as readonly string[]).includes(m));
}

// ---------- Completeness of understanding ----------
export function missingUnderstanding(u: Understanding): UnderstandingField[] {
  return UNDERSTANDING_FIELDS.filter((f) => u[f] === undefined || u[f] === null || u[f] === "");
}

export function isUnderstandingComplete(u: Understanding): boolean {
  return missingUnderstanding(u).length === 0;
}

// ---------- Clarify-vs-think decision ("ask, don't guess") ----------
export function needsClarification(u: Understanding): boolean {
  return !isUnderstandingComplete(u);
}

// ---------- Pipeline navigation ----------
export function nextIntentStage(current: IntentStage, u: Understanding): IntentStage | "done" {
  if (current === "understand" && needsClarification(u)) return "clarify";
  if (current === "clarify" && needsClarification(u)) return "clarify";
  const i = INTENT_PIPELINE.indexOf(current);
  if (i < 0 || i >= INTENT_PIPELINE.length - 1) return "done";
  return INTENT_PIPELINE[i + 1];
}

// ---------- Map an Intent to an R158 Approval tier ----------
export function tierForIntent(desc: IntentDescriptor, change?: Partial<ChangeDescriptor>): ApprovalTier {
  const kindMap: Partial<Record<IntentType, ChangeDescriptor["kind"]>> = {
    feature: "feature", bugfix: "bugfix", ui: "ui", ux: "ui",
    performance: "feature", security: "feature",
    business: "business", marketing: "business", revenue: "business",
    creative: "creative", infra: "infra", deploy: "deploy",
    automation: "feature", analytics: "feature",
    database: "database", api: "api", builder: "builder",
    digital_human: "feature", website: "ui", android: "deploy", ios: "deploy",
  };
  const kind = kindMap[desc.type] ?? "feature";
  return classifyChange({ kind, ...change });
}

// ---------- Plan surface fed to Approval Gateway ----------
export function buildPlanSurface(desc: IntentDescriptor, change?: Partial<ChangeDescriptor>) {
  const tier = tierForIntent(desc, change);
  return {
    tier,
    plans: OUTPUT_PLANS,
    checks: AUTOMATIC_CHECKS,
    thinking: THINKING_ARTIFACTS,
    presentation: PRESENTATION_FIELDS,
    approvalRequirements: requirementsFor(tier),
  };
}

// ---------- Snapshot for the Founder Dashboard ----------
export function intentSnapshot(desc: IntentDescriptor, change?: Partial<ChangeDescriptor>) {
  const modes = normalizeInputModes(desc.input);
  const missing = missingUnderstanding(desc.understanding);
  return {
    type: desc.type,
    inputs: modes,
    understanding: desc.understanding,
    missing,
    needsClarification: missing.length > 0,
    stages: INTENT_PIPELINE,
    learningSurfaces: LEARNING_SURFACES,
    suggestions: SUGGESTION_DOMAINS,
    ...buildPlanSurface(desc, change),
  };
}
