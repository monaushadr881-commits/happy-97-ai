/**
 * HAPPY X Kernel — Module Manager
 *
 * Declarative registry of every product module (Assistant, Studio, Business
 * OS, etc.). Drives navigation, permission gating, and feature flags in one
 * place so no route or sidebar hardcodes module metadata.
 */

import type { FeatureFlagKey } from "./feature-flags";
import type { Permission } from "./permissions";

export type ModuleId =
  | "founder"
  | "enterprise"
  | "dashboard"
  | "assistant"
  | "education"
  | "business"
  | "studio"
  | "community"
  | "marketplace"
  | "knowledge"
  | "settings";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  tagline: string;
  route: string;
  group: "core" | "product" | "enterprise" | "system";
  order: number;
  permission?: Permission;
  featureFlag?: FeatureFlagKey;
  status: "live" | "beta" | "planned";
}

export const MODULES: readonly ModuleDefinition[] = Object.freeze([
  { id: "dashboard", label: "Overview", tagline: "Your day, at a glance", route: "/dashboard", group: "core", order: 0, status: "live" },
  { id: "assistant", label: "Assistant", tagline: "HAPPY AI, always on", route: "/assistant", group: "core", order: 1, permission: "assistant.use", status: "live" },
  { id: "studio", label: "Studio", tagline: "Create anything", route: "/studio", group: "product", order: 10, permission: "studio.use", status: "beta" },
  { id: "education", label: "Education", tagline: "Learn until mastered", route: "/education", group: "product", order: 11, status: "planned" },
  { id: "business", label: "Business OS", tagline: "Run the company", route: "/business", group: "product", order: 12, status: "planned" },
  { id: "community", label: "Community", tagline: "People and mentors", route: "/community", group: "product", order: 13, permission: "community.post", status: "planned" },
  { id: "marketplace", label: "Marketplace", tagline: "Sell and buy", route: "/marketplace", group: "product", order: 14, permission: "marketplace.buy", status: "planned" },
  { id: "knowledge", label: "Knowledge", tagline: "Everything, indexed", route: "/knowledge", group: "product", order: 15, status: "planned" },
  { id: "enterprise", label: "Enterprise", tagline: "Control center", route: "/enterprise", group: "enterprise", order: 20, permission: "audit.view", status: "planned" },
  { id: "founder", label: "Founder", tagline: "Sovereign dashboard", route: "/founder", group: "enterprise", order: 21, permission: "platform.manage", status: "planned" },
  { id: "settings", label: "Settings", tagline: "Account & workspace", route: "/settings", group: "system", order: 90, status: "live" },
]);

export function modulesByGroup() {
  const groups: Record<ModuleDefinition["group"], ModuleDefinition[]> = {
    core: [], product: [], enterprise: [], system: [],
  };
  for (const m of MODULES) groups[m.group].push(m);
  for (const g of Object.values(groups)) g.sort((a, b) => a.order - b.order);
  return groups;
}

export function getModule(id: ModuleId): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}
