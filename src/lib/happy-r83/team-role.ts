/**
 * R83 — HAPPY Team Member Mode (pure logic).
 *
 * Chooses which "hat" HAPPY wears based on the current surface and the
 * user's recent activity. Purely deterministic so it's easy to unit-test.
 */

export type TeamRole =
  | "ui-designer"
  | "business-consultant"
  | "software-architect"
  | "qa-engineer"
  | "project-manager"
  | "office-assistant";

export interface TeamRoleInput {
  route: string;
  focusRegion?: string;
  recentActions?: string[]; // e.g. ["edit", "deploy", "review"]
}

export interface TeamRoleDecision {
  role: TeamRole;
  greeting: string;
  hint: string;
}

const GREETINGS: Record<TeamRole, string> = {
  "ui-designer": "Design hat on — want me to review this layout?",
  "business-consultant": "Consultant mode — I can weigh trade-offs with you.",
  "software-architect": "Architect mode — happy to reason about the structure.",
  "qa-engineer": "QA mode — I'll double-check edge cases with you.",
  "project-manager": "PM mode — let's line up the next moves.",
  "office-assistant": "I'm here — anything I can pick up for you?",
};

const HINTS: Record<TeamRole, string> = {
  "ui-designer": "Try: 'HAPPY, restyle this section' or 'explain this component'.",
  "business-consultant": "Try: 'HAPPY, compare these tiers' or 'what would you cut?'.",
  "software-architect": "Try: 'HAPPY, walk me through this flow' or 'where would this break?'.",
  "qa-engineer": "Try: 'HAPPY, what edge cases am I missing?'.",
  "project-manager": "Try: 'HAPPY, what's next?' or 'resume where I left off'.",
  "office-assistant": "Try: 'HAPPY, open initiative' or 'summarise this page'.",
};

export function decideRole(input: TeamRoleInput): TeamRoleDecision {
  const route = (input.route || "/").toLowerCase();
  const focus = (input.focusRegion || "").toLowerCase();
  const recent = new Set((input.recentActions || []).map((s) => s.toLowerCase()));

  let role: TeamRole = "office-assistant";
  if (route.includes("/builder") || focus === "builder-component" || focus === "hero" || focus === "card") {
    role = "ui-designer";
  } else if (route.includes("/pricing") || route.includes("/business") || focus === "pricing") {
    role = "business-consultant";
  } else if (route.includes("/architecture") || route.includes("/docs") || route.includes("/api")) {
    role = "software-architect";
  } else if (route.includes("/tests") || route.includes("/qa") || recent.has("review")) {
    role = "qa-engineer";
  } else if (route.includes("/founder") || route.includes("/dashboard") || recent.has("deploy")) {
    role = "project-manager";
  }

  return { role, greeting: GREETINGS[role], hint: HINTS[role] };
}
