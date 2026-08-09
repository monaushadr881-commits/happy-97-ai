/**
 * R301 — Action Risk Classification (PURE).
 *
 * Extends `src/lib/happy-command/tool-registry.ts`. It does NOT replace the
 * existing `WorkforceRisk` scale (low/medium/high/critical) — it adds the
 * ORTHOGONAL question "what kind of real-world effect does this action have?"
 * which the approval + budget + kill-switch gates need.
 *
 * NO new runtime, NO table, NO I/O. Default classification = most restrictive
 * that the evidence supports (never silently downgrade to READ).
 */

import { getTool, type HappyToolCategory, type WorkforceRisk } from "@/lib/happy-command/tool-registry";

export type ActionClass =
  | "READ"
  | "SAFE_WRITE"
  | "SENSITIVE_WRITE"
  | "EXTERNAL_ACTION"
  | "FINANCIAL_ACTION"
  | "DESTRUCTIVE_ACTION";

export const ACTION_CLASSES: readonly ActionClass[] = [
  "READ",
  "SAFE_WRITE",
  "SENSITIVE_WRITE",
  "EXTERNAL_ACTION",
  "FINANCIAL_ACTION",
  "DESTRUCTIVE_ACTION",
];

/** Higher ordinal = stronger governance requirements. */
const ORDER: Record<ActionClass, number> = {
  READ: 0,
  SAFE_WRITE: 1,
  SENSITIVE_WRITE: 2,
  EXTERNAL_ACTION: 3,
  FINANCIAL_ACTION: 4,
  DESTRUCTIVE_ACTION: 5,
};

export function maxActionClass(...classes: readonly ActionClass[]): ActionClass {
  return classes.reduce<ActionClass>((a, b) => (ORDER[b] > ORDER[a] ? b : a), "READ");
}

/** Explicit per-tool classification. Anything unlisted is treated conservatively. */
const TOOL_CLASS: Record<string, ActionClass> = {
  "tool.database.query": "READ",
  "tool.search.universal": "READ",
  "tool.analytics.report": "READ",
  "tool.browser.fetch": "EXTERNAL_ACTION",
  "tool.document.generate": "SAFE_WRITE",
  "tool.audio.tts": "SAFE_WRITE",
  "tool.image.generate": "SAFE_WRITE",
  "tool.video.render": "SAFE_WRITE",
  "tool.storage.object": "SENSITIVE_WRITE",
  "tool.api.serverfn": "SENSITIVE_WRITE",
  "tool.build.pipeline": "SENSITIVE_WRITE",
  "tool.file.workspace": "SENSITIVE_WRITE",
  "tool.git.commit": "SENSITIVE_WRITE",
  "tool.database.migration": "DESTRUCTIVE_ACTION",
  "tool.computer.shell": "DESTRUCTIVE_ACTION",
  "tool.github.repo": "EXTERNAL_ACTION",
  "tool.deployment.release": "EXTERNAL_ACTION",
  "tool.communication.send": "EXTERNAL_ACTION",
};

/** Categories that always reach outside this platform. */
const EXTERNAL_CATEGORIES: readonly HappyToolCategory[] = [
  "browser",
  "communication",
  "deployment",
  "github",
];

/** Permission scopes that indicate money/credit movement. */
const FINANCIAL_SCOPES: readonly string[] = [
  "write:billing",
  "write:payment",
  "write:invoice",
  "write:credits",
  "write:payout",
];

export function classifyAction(input: {
  readonly toolId: string | null;
  readonly permissions?: readonly string[];
  readonly risk?: WorkforceRisk;
}): ActionClass {
  const scopes = input.permissions ?? [];
  if (scopes.some((s) => FINANCIAL_SCOPES.includes(s))) return "FINANCIAL_ACTION";

  if (!input.toolId) {
    // Unknown executor: never assume READ.
    return scopes.some((s) => s.startsWith("write:")) ? "SENSITIVE_WRITE" : "READ";
  }

  const explicit = TOOL_CLASS[input.toolId];
  if (explicit) return explicit;

  const tool = getTool(input.toolId);
  if (!tool) return "SENSITIVE_WRITE";
  if (EXTERNAL_CATEGORIES.includes(tool.category)) return "EXTERNAL_ACTION";
  if (tool.risk === "critical") return "DESTRUCTIVE_ACTION";
  if (tool.permission.startsWith("write:") || tool.permission === "platform.manage") {
    return tool.risk === "high" ? "SENSITIVE_WRITE" : "SAFE_WRITE";
  }
  return "READ";
}

/** Action classes that can NEVER run without a recorded Founder approval. */
export const APPROVAL_REQUIRED_CLASSES: readonly ActionClass[] = [
  "SENSITIVE_WRITE",
  "EXTERNAL_ACTION",
  "FINANCIAL_ACTION",
  "DESTRUCTIVE_ACTION",
];

export function requiresFounderApproval(cls: ActionClass, risk: WorkforceRisk): boolean {
  return APPROVAL_REQUIRED_CLASSES.includes(cls) || risk === "high" || risk === "critical";
}

/** Action classes that consume spendable resources and must be budget-checked. */
export function consumesBudget(cls: ActionClass): boolean {
  return cls !== "READ";
}

/** Whether the effect can be undone by the platform itself. */
export type Reversibility = "reversible" | "partially_reversible" | "irreversible";

export function reversibility(cls: ActionClass): Reversibility {
  switch (cls) {
    case "READ":
      return "reversible";
    case "SAFE_WRITE":
      return "reversible";
    case "SENSITIVE_WRITE":
      return "partially_reversible";
    case "EXTERNAL_ACTION":
      return "irreversible";
    case "FINANCIAL_ACTION":
      return "irreversible";
    case "DESTRUCTIVE_ACTION":
      return "irreversible";
  }
}
