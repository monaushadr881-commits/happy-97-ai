/**
 * R84 — Smart suggestions & anti-repeat gating (pure logic).
 *
 * Contextual suggestions that reference the current focus/surface/route
 * and are deduplicated across the session so HAPPY never repeats itself.
 */

import type { UiRegion } from "@/lib/happy-r83/visual-context";

export type SuggestionKind =
  | "duplicate-code"
  | "simplify-form"
  | "long-loading"
  | "low-contrast-cta"
  | "shorten-workflow"
  | "explain-chart"
  | "review-copy";

export interface SuggestionContext {
  surface: string;               // R80 workspace surface
  region: UiRegion;              // R83 focused UI region
  route: string;
  idleMs: number;
  errorsSeenInSession: number;
  builderTouches: number;        // number of builder edits this session
}

export interface Suggestion {
  kind: SuggestionKind;
  message: string;
  priority: number;              // higher wins
}

const CATALOG: Record<SuggestionKind, string> = {
  "duplicate-code": "I noticed duplicate code here — want me to extract it?",
  "simplify-form": "This form could be simplified — I can suggest fewer fields.",
  "long-loading": "The loading state feels long — I can profile it with you.",
  "low-contrast-cta": "This button is difficult to notice — want a stronger contrast?",
  "shorten-workflow": "This workflow could be one step shorter — shall I sketch it?",
  "explain-chart": "Want me to read the trend in this chart?",
  "review-copy": "I can review the copy in this section for tone and clarity.",
};

export function pickSuggestion(
  ctx: SuggestionContext,
  alreadyShown: Set<SuggestionKind>,
): Suggestion | null {
  const candidates: Suggestion[] = [];

  if (ctx.surface === "builder" && ctx.builderTouches > 5) {
    candidates.push({ kind: "duplicate-code", message: CATALOG["duplicate-code"], priority: 0.7 });
  }
  if (ctx.region === "form") {
    candidates.push({ kind: "simplify-form", message: CATALOG["simplify-form"], priority: 0.65 });
  }
  if (ctx.idleMs > 45_000 && ctx.surface !== "focus") {
    candidates.push({ kind: "long-loading", message: CATALOG["long-loading"], priority: 0.4 });
  }
  if (ctx.region === "button") {
    candidates.push({ kind: "low-contrast-cta", message: CATALOG["low-contrast-cta"], priority: 0.55 });
  }
  if (ctx.region === "chart") {
    candidates.push({ kind: "explain-chart", message: CATALOG["explain-chart"], priority: 0.6 });
  }
  if (ctx.region === "hero" || ctx.region === "pricing") {
    candidates.push({ kind: "review-copy", message: CATALOG["review-copy"], priority: 0.5 });
  }
  if (ctx.surface === "builder" && ctx.builderTouches > 12) {
    candidates.push({ kind: "shorten-workflow", message: CATALOG["shorten-workflow"], priority: 0.6 });
  }

  const fresh = candidates
    .filter((c) => !alreadyShown.has(c.kind))
    .sort((a, b) => b.priority - a.priority);

  return fresh[0] ?? null;
}
