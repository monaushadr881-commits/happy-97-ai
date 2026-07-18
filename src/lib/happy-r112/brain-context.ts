/**
 * R112 — Unified Brain Context resolver.
 *
 * Extends the existing brain (brain-v4.functions.ts, memory_items,
 * brain_sessions, kg_*). NO new brain, NO new memory store. This module
 * only *composes* the existing sources into one permissioned context
 * bundle that HAPPY can pass to the AI Gateway.
 *
 * Sources composed (all pre-existing):
 *   - Long-term memory:  memory_items          (RLS-scoped)
 *   - Short-term memory: brain_sessions        (per-session)
 *   - Recall:            agent_messages        (last N turns)
 *   - Workspace:         workspaces / workspace_memberships
 *   - Files:             storage.objects       (owner-scoped)
 *   - Projects:          creator_projects / apps
 *   - Business:          companies / employees
 *   - Learning:          courses / course_enrollments
 *   - Founder KB:        founder_briefings / founder_decision_records
 *   - Company KB:        knowledge_articles
 *   - Preferences:       user_preferences
 */

export type BrainScope =
  | "long_term" | "short_term" | "recall"
  | "workspace" | "files" | "projects"
  | "business" | "learning"
  | "founder_kb" | "company_kb" | "preferences";

export type BrainRequest = {
  scopes: BrainScope[];
  query?: string;
  limitPerScope?: number;
};

export type BrainContextBundle = Record<BrainScope, unknown[]>;

/** Pure helper: normalize + validate a request before hitting the DB. */
export function normalizeBrainRequest(req: BrainRequest): Required<BrainRequest> {
  const uniq = Array.from(new Set(req.scopes));
  return {
    scopes: uniq,
    query: (req.query ?? "").trim().slice(0, 512),
    limitPerScope: Math.max(1, Math.min(50, req.limitPerScope ?? 10)),
  };
}

/** Permission mask — every scope is only ever queried under the caller's RLS. */
export const SCOPE_TABLE: Record<BrainScope, string> = {
  long_term:   "memory_items",
  short_term:  "brain_sessions",
  recall:      "agent_messages",
  workspace:   "workspaces",
  files:       "storage.objects",
  projects:    "creator_projects",
  business:    "companies",
  learning:    "course_enrollments",
  founder_kb:  "founder_briefings",
  company_kb:  "knowledge_articles",
  preferences: "user_preferences",
};

export function emptyBundle(scopes: BrainScope[]): BrainContextBundle {
  const b = {} as BrainContextBundle;
  for (const s of scopes) b[s] = [];
  return b;
}
