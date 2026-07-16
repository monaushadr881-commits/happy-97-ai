import type { WorkspaceContext } from "./contracts";

export function summarizeRoute(route: string): { area: string; hint?: string } {
  if (route.startsWith("/pricing")) return { area: "Pricing", hint: "I have two improvement ideas for this pricing section." };
  if (route.startsWith("/builder")) return { area: "Website Builder", hint: "Want me to review the current layout?" };
  if (route.startsWith("/uabr")) return { area: "AI Builder Runtime", hint: "I can draft a full project plan." };
  if (route.startsWith("/founder")) return { area: "Founder Dashboard", hint: "Shall we review today's priorities?" };
  if (route.startsWith("/crm")) return { area: "CRM" };
  if (route.startsWith("/erp")) return { area: "ERP" };
  if (route.startsWith("/hrms")) return { area: "HRMS" };
  if (route.startsWith("/marketplace")) return { area: "Marketplace" };
  if (route.startsWith("/learning")) return { area: "Learning" };
  if (route.startsWith("/analytics")) return { area: "Analytics" };
  if (route.startsWith("/live")) return { area: "Presence" };
  if (route === "/" || route === "") return { area: "Home" };
  return { area: "Workspace" };
}

export function contextFor(route: string, extras: Partial<WorkspaceContext> = {}): WorkspaceContext {
  return {
    route,
    builder: extras.builder,
    project: extras.project,
    component: extras.component,
    hasErrors: extras.hasErrors ?? false,
    pendingDeployment: extras.pendingDeployment ?? false,
  };
}
