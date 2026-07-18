/**
 * @deprecated R115.b Consolidation — this is a compatibility shim.
 * Canonical owner: src/lib/workspace-runtime (canonical Workspace runtime)
 * Do NOT add new logic here. All handlers already delegate through
 * services/domain/roadmap.service which is being routed to the canonical
 * engines. Kept solely to preserve public import paths (backward-compat).
 */
/** HAPPY UUE v5.0 — Workspace platform (stub). */
import { createServerFn } from "@tanstack/react-start";

export interface WorkspaceTemplate {
  id: string;
  name: string;
  persona: string;
  panels: string[];
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  { id: "business", name: "Business", persona: "Owner", panels: ["Revenue", "CRM", "Ops"] },
  { id: "education", name: "Education", persona: "Learner", panels: ["Courses", "Notes", "Coach"] },
  { id: "healthcare", name: "Healthcare", persona: "Clinician", panels: ["Patients", "Records", "Rounds"] },
  { id: "manufacturing", name: "Manufacturing", persona: "Plant", panels: ["Lines", "Quality", "Yield"] },
  { id: "research", name: "Research", persona: "Scientist", panels: ["Papers", "Data", "Notebook"] },
  { id: "creator", name: "Creator", persona: "Creator", panels: ["Studio", "Audience", "Revenue"] },
  { id: "developer", name: "Developer", persona: "Builder", panels: ["Repos", "APIs", "Logs"] },
  { id: "founder", name: "Founder", persona: "Founder", panels: ["Command", "Company", "Signals"] },
  { id: "government", name: "Government", persona: "Officer", panels: ["Citizens", "Cases", "Policy"] },
  { id: "marketplace", name: "Marketplace", persona: "Seller", panels: ["Listings", "Orders", "Insights"] },
];

export const listWorkspaceTemplates = createServerFn({ method: "GET" }).handler(async () => ({
  templates: WORKSPACE_TEMPLATES,
}));
