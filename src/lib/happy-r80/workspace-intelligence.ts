/**
 * R80 — Workspace Intelligence (pure logic).
 * Understands the *current* route/component so Happy can look, comment,
 * and adapt. Reuses ideas from happy-cinematic/workspace-awareness.ts.
 */

export type WorkspaceSurface =
  | "builder" | "analytics" | "crm" | "erp" | "hrms"
  | "marketplace" | "learning" | "support" | "release"
  | "production" | "settings" | "founder" | "public" | "unknown";

export type WorkspaceContext = {
  surface: WorkspaceSurface;
  route: string;
  hasForm: boolean;
  hasError: boolean;
  hasBuilder: boolean;
  focusHint: string; // where Happy should look
};

const SURFACE_MAP: Array<[RegExp, WorkspaceSurface]> = [
  [/^\/_?authenticated\/builder|^\/builder|^\/_authenticated\/app-builder/, "builder"],
  [/^\/_?authenticated\/analytics|^\/analytics/, "analytics"],
  [/^\/_?authenticated\/crm/, "crm"],
  [/^\/_?authenticated\/erp/, "erp"],
  [/^\/_?authenticated\/hrms|^\/_authenticated\/people/, "hrms"],
  [/^\/_?authenticated\/marketplace|^\/marketplace/, "marketplace"],
  [/^\/_?authenticated\/learning|^\/learning/, "learning"],
  [/^\/_?authenticated\/support|^\/support/, "support"],
  [/^\/_?authenticated\/release|^\/release/, "release"],
  [/^\/_?authenticated\/production|^\/production/, "production"],
  [/^\/_?authenticated\/settings|^\/settings/, "settings"],
  [/^\/_?authenticated\/founder|^\/founder/, "founder"],
  [/^\/(login|register|auth|forgot-password|reset-password|status|trust|design|$)/, "public"],
];

export function detectSurface(route: string): WorkspaceSurface {
  for (const [re, s] of SURFACE_MAP) if (re.test(route)) return s;
  return "unknown";
}

export function contextFor(route: string, flags: { hasForm?: boolean; hasError?: boolean; hasBuilder?: boolean } = {}): WorkspaceContext {
  const surface = detectSurface(route);
  const focusHint =
    flags.hasError ? "error"
    : flags.hasForm ? "form"
    : flags.hasBuilder || surface === "builder" ? "canvas"
    : surface === "analytics" ? "charts"
    : "user";
  return {
    surface, route,
    hasForm: !!flags.hasForm,
    hasError: !!flags.hasError,
    hasBuilder: !!flags.hasBuilder || surface === "builder",
    focusHint,
  };
}

export function summarize(ctx: WorkspaceContext): string {
  if (ctx.hasError) return "I noticed an error on this page.";
  switch (ctx.surface) {
    case "builder": return "You're building. I'll stay ready to help.";
    case "analytics": return "Reviewing analytics — let me know what to dig into.";
    case "crm": return "In the CRM. I can help with a customer or a pipeline view.";
    case "erp": return "In the ERP — operations at a glance.";
    case "hrms": return "In HRMS — people and teams.";
    case "marketplace": return "Browsing the marketplace.";
    case "learning": return "Learning mode — I can explain anything here.";
    case "support": return "Support view — I can draft a reply.";
    case "release": return "Release Center — I'll watch the pipeline.";
    case "production": return "Production Center — everything looks live.";
    case "founder": return "Founder view — I'll keep it focused.";
    case "settings": return "Settings — I'll wait quietly.";
    default: return "I'm here.";
  }
}
