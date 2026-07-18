/**
 * R118 — HAPPY Workspace Intelligence™ (pure extension layer).
 *
 * Canonical owner: src/services/domain/workspace.service.ts
 * Extends (never replaces): workspace.service, company.service, brand.service,
 * happy-r80/workspace-intelligence.ts (surface detection),
 * happy-r112/workspace-policy.ts (quotas), happy-r88/context-bus.ts (global signals).
 *
 * FOUNDER LOCK: no new Workspace runtime, no new schema, no new APIs.
 * Everything here is a pure helper that consumers can compose against the
 * existing runtime. Analytics/permissions/greeting logic lives here so the
 * canonical service stays a thin data layer.
 */

import type { WorkspaceSurface } from "@/lib/happy-r80/workspace-intelligence";
import { detectSurface } from "@/lib/happy-r80/workspace-intelligence";

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Workspace Types
// ─────────────────────────────────────────────────────────────────────────────
export type WorkspaceType =
  | "personal" | "student" | "creator" | "business" | "company"
  | "enterprise" | "education" | "government" | "founder";

export interface WorkspaceHints {
  memberCount?: number;
  companyCount?: number;
  hasBilling?: boolean;
  hasStudents?: boolean;
  hasCitizens?: boolean;
  founderMode?: boolean;
  templateId?: string;
}

export function classifyWorkspaceType(h: WorkspaceHints): WorkspaceType {
  if (h.founderMode) return "founder";
  if (h.hasCitizens) return "government";
  if (h.hasStudents) return "education";
  if ((h.memberCount ?? 1) >= 200 || (h.companyCount ?? 0) > 3) return "enterprise";
  if (h.templateId === "creator") return "creator";
  if (h.templateId === "student") return "student";
  if ((h.companyCount ?? 0) >= 1 || h.hasBilling) return h.memberCount && h.memberCount > 10 ? "company" : "business";
  return "personal";
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — Hierarchy resolver
// ─────────────────────────────────────────────────────────────────────────────
export interface HierarchyNode {
  workspace_id: string;
  company_id?: string | null;
  brand_id?: string | null;
  department_id?: string | null;
  team_id?: string | null;
  project_id?: string | null;
}

export function hierarchyPath(n: HierarchyNode): string[] {
  return [
    n.workspace_id && `workspace:${n.workspace_id}`,
    n.company_id && `company:${n.company_id}`,
    n.brand_id && `brand:${n.brand_id}`,
    n.department_id && `dept:${n.department_id}`,
    n.team_id && `team:${n.team_id}`,
    n.project_id && `project:${n.project_id}`,
  ].filter(Boolean) as string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — Current-context detection
// ─────────────────────────────────────────────────────────────────────────────
export interface WorkspaceContextSnapshot {
  surface: WorkspaceSurface;
  route: string;
  workspace_id?: string;
  company_id?: string;
  brand_id?: string;
  project_id?: string;
  goal?: string;
}

export function detectContext(route: string, n: Partial<HierarchyNode> = {}, goal?: string): WorkspaceContextSnapshot {
  return {
    surface: detectSurface(route),
    route,
    workspace_id: n.workspace_id,
    company_id: n.company_id ?? undefined,
    brand_id: n.brand_id ?? undefined,
    project_id: n.project_id ?? undefined,
    goal,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 — Workspace switcher (context preservation contract)
// ─────────────────────────────────────────────────────────────────────────────
export interface SwitchPayload {
  from: string;
  to: string;
  preserve: { memory: true; ai_session: true; digital_human: true };
  at: number;
}
export function planSwitch(from: string, to: string): SwitchPayload {
  return { from, to, preserve: { memory: true, ai_session: true, digital_human: true }, at: Date.now() };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7 — Permissions
// ─────────────────────────────────────────────────────────────────────────────
export type WorkspaceRole = "owner" | "founder" | "admin" | "manager" | "member" | "guest" | "viewer" | "custom";
export type Capability =
  | "workspace.read" | "workspace.write" | "workspace.delete"
  | "members.manage" | "billing.manage" | "settings.manage"
  | "projects.create" | "projects.delete" | "files.upload" | "files.delete"
  | "automation.manage" | "builder.publish" | "analytics.view";

const ROLE_CAPS: Record<Exclude<WorkspaceRole, "custom">, Capability[]> = {
  owner:    ["workspace.read","workspace.write","workspace.delete","members.manage","billing.manage","settings.manage","projects.create","projects.delete","files.upload","files.delete","automation.manage","builder.publish","analytics.view"],
  founder:  ["workspace.read","workspace.write","workspace.delete","members.manage","billing.manage","settings.manage","projects.create","projects.delete","files.upload","files.delete","automation.manage","builder.publish","analytics.view"],
  admin:    ["workspace.read","workspace.write","members.manage","settings.manage","projects.create","projects.delete","files.upload","files.delete","automation.manage","builder.publish","analytics.view"],
  manager:  ["workspace.read","workspace.write","projects.create","files.upload","files.delete","automation.manage","builder.publish","analytics.view"],
  member:   ["workspace.read","workspace.write","projects.create","files.upload","analytics.view"],
  guest:    ["workspace.read","files.upload"],
  viewer:   ["workspace.read","analytics.view"],
};

export function capabilitiesFor(role: WorkspaceRole, custom?: Capability[]): Capability[] {
  if (role === "custom") return Array.from(new Set(custom ?? []));
  return ROLE_CAPS[role];
}
export function hasCapability(role: WorkspaceRole, cap: Capability, custom?: Capability[]): boolean {
  return capabilitiesFor(role, custom).includes(cap);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 8 — Workspace memory scopes (13-category alignment with R116)
// ─────────────────────────────────────────────────────────────────────────────
export const WORKSPACE_MEMORY_SCOPES = [
  "conversation","projects","files","knowledge","automation","builder","digital_human",
] as const;
export type WorkspaceMemoryScope = (typeof WORKSPACE_MEMORY_SCOPES)[number];

export function scopesForSurface(surface: WorkspaceSurface): WorkspaceMemoryScope[] {
  switch (surface) {
    case "builder":    return ["conversation","builder","files"];
    case "analytics":  return ["conversation","projects"];
    case "crm":
    case "erp":
    case "hrms":       return ["conversation","projects","automation"];
    case "founder":    return ["conversation","projects","knowledge","digital_human"];
    default:           return ["conversation"];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 9 — Dashboard sections (declarative, consumed by UI)
// ─────────────────────────────────────────────────────────────────────────────
export const DASHBOARD_SECTIONS = [
  "overview","projects","companies","brands","tasks","calendar","documents","ai","analytics","activity",
] as const;
export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 10 — Analytics snapshot shape
// ─────────────────────────────────────────────────────────────────────────────
export interface WorkspaceAnalytics {
  usage: { active_users: number; sessions: number };
  users: { total: number; active_30d: number };
  storage: { bytes: number; documents: number };
  credits: { used: number; remaining: number };
  subscriptions: { tier: string; renews_at?: string };
  ai: { messages: number; tokens: number };
  files: { count: number; uploaded_30d: number };
  automation: { runs_30d: number; failures_30d: number };
  builder: { apps_published: number; builds_30d: number };
}

export function emptyAnalytics(): WorkspaceAnalytics {
  return {
    usage: { active_users: 0, sessions: 0 },
    users: { total: 0, active_30d: 0 },
    storage: { bytes: 0, documents: 0 },
    credits: { used: 0, remaining: 0 },
    subscriptions: { tier: "free" },
    ai: { messages: 0, tokens: 0 },
    files: { count: 0, uploaded_30d: 0 },
    automation: { runs_30d: 0, failures_30d: 0 },
    builder: { apps_published: 0, builds_30d: 0 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 11 — Brain resolver hook (pure, called from src/lib/brain/engine.ts)
// ─────────────────────────────────────────────────────────────────────────────
export interface BrainWorkspaceHint {
  workspace_id?: string;
  workspace_type: WorkspaceType;
  surface: WorkspaceSurface;
  memory_scopes: WorkspaceMemoryScope[];
  hierarchy: string[];
}

export function resolveForBrain(
  route: string,
  hints: WorkspaceHints & Partial<HierarchyNode> = {},
): BrainWorkspaceHint {
  const surface = detectSurface(route);
  const type = classifyWorkspaceType(hints);
  return {
    workspace_id: hints.workspace_id,
    workspace_type: type,
    surface,
    memory_scopes: scopesForSurface(surface),
    hierarchy: hierarchyPath({
      workspace_id: hints.workspace_id ?? "",
      company_id: hints.company_id, brand_id: hints.brand_id,
      department_id: hints.department_id, team_id: hints.team_id,
      project_id: hints.project_id,
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 12 — Digital Human greeting per workspace type
// ─────────────────────────────────────────────────────────────────────────────
export type DHWorkspaceMode = "business" | "education" | "founder" | "friend" | "presentation";

export function pickDHMode(type: WorkspaceType, surface: WorkspaceSurface): DHWorkspaceMode {
  if (surface === "founder" || type === "founder") return "founder";
  if (type === "education" || type === "student") return "education";
  if (type === "business" || type === "company" || type === "enterprise") return "business";
  if (surface === "builder" || surface === "analytics") return "presentation";
  return "friend";
}

export function greetingFor(type: WorkspaceType, name?: string): string {
  const who = name ? `, ${name}` : "";
  switch (type) {
    case "founder":    return `Welcome back${who}. Command centre is ready.`;
    case "enterprise": return `Good to see you${who}. Enterprise workspace is online.`;
    case "company":    return `Hi${who}. Your company workspace is ready.`;
    case "business":   return `Hey${who}. Let's run the business.`;
    case "education":  return `Welcome${who}. Ready to learn?`;
    case "student":    return `Hey${who}. Let's pick up where you left off.`;
    case "creator":    return `Studio's warm${who}. What are we making today?`;
    case "government": return `Welcome${who}. Casework is loaded.`;
    default:           return `Hi${who}. Personal workspace ready.`;
  }
}
