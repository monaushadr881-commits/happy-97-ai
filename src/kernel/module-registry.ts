/**
 * HAPPY X Kernel — Module Manager
 *
 * Declarative registry of every product module (Assistant, Studio, Business
 * OS, etc.). Drives navigation, permission gating, and feature flags in one
 * place so no route or sidebar hardcodes module metadata.
 *
 * The v2.0 – v6.0 roadmap modules are pre-registered as `planned` so routes,
 * sidebars, and permission checks all resolve today without a redesign when
 * each phase ships.
 */

import type { FeatureFlagKey } from "./feature-flags";
import type { Permission } from "./permissions";

export type ModuleId =
  // v1.0 — live modules
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
  | "settings"
  // v2.0 – v6.0 roadmap (reserved)
  | "agent-os"
  | "intelligence"
  | "global"
  | "enterprise-cloud"
  | "autonomous";

export type RoadmapVersion = "v1.0" | "v2.0" | "v3.0" | "v4.0" | "v5.0" | "v6.0";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  tagline: string;
  route: string;
  group: "core" | "product" | "enterprise" | "system" | "roadmap";
  order: number;
  permission?: Permission;
  featureFlag?: FeatureFlagKey;
  status: "live" | "beta" | "planned";
  version: RoadmapVersion;
}

export const MODULES: readonly ModuleDefinition[] = Object.freeze([
  { id: "dashboard", label: "Overview", tagline: "Your day, at a glance", route: "/dashboard", group: "core", order: 0, status: "live", version: "v1.0" },
  { id: "assistant", label: "Assistant", tagline: "HAPPY AI, always on", route: "/assistant", group: "core", order: 1, permission: "assistant.use", status: "live", version: "v1.0" },
  { id: "studio", label: "Studio", tagline: "Create anything", route: "/studio", group: "product", order: 10, permission: "studio.use", status: "beta", version: "v1.0" },
  { id: "education", label: "Education", tagline: "Learn until mastered", route: "/education", group: "product", order: 11, status: "planned", version: "v1.0" },
  { id: "business", label: "Business OS", tagline: "Run the company", route: "/business", group: "product", order: 12, status: "planned", version: "v1.0" },
  { id: "community", label: "Community", tagline: "People and mentors", route: "/community", group: "product", order: 13, permission: "community.post", status: "planned", version: "v1.0" },
  { id: "marketplace", label: "Marketplace", tagline: "Sell and buy", route: "/marketplace", group: "product", order: 14, permission: "marketplace.buy", status: "planned", version: "v1.0" },
  { id: "knowledge", label: "Knowledge", tagline: "Everything, indexed", route: "/knowledge", group: "product", order: 15, status: "planned", version: "v1.0" },
  { id: "enterprise", label: "Enterprise", tagline: "Control center", route: "/enterprise", group: "enterprise", order: 20, permission: "audit.view", status: "planned", version: "v1.0" },
  { id: "founder", label: "Founder", tagline: "Sovereign dashboard", route: "/founder", group: "enterprise", order: 21, permission: "platform.manage", status: "planned", version: "v1.0" },
  { id: "settings", label: "Settings", tagline: "Account & workspace", route: "/settings", group: "system", order: 90, status: "live", version: "v1.0" },

  // Roadmap — reserved, planned
  { id: "agent-os", label: "Agent OS", tagline: "Autonomous agents & developer platform", route: "/agent-os", group: "roadmap", order: 200, permission: "agents.use", featureFlag: "roadmap.v2.agentOs", status: "planned", version: "v2.0" },
  { id: "intelligence", label: "Intelligence", tagline: "Predictive analytics & decision AI", route: "/intelligence", group: "roadmap", order: 210, permission: "intelligence.view", featureFlag: "roadmap.v3.decisionIntelligence", status: "planned", version: "v3.0" },
  { id: "global", label: "Global", tagline: "Localization, compliance, tax & currency", route: "/global", group: "roadmap", order: 220, permission: "global.localization.manage", featureFlag: "roadmap.v4.globalExpansion", status: "planned", version: "v4.0" },
  { id: "enterprise-cloud", label: "Enterprise Cloud", tagline: "SSO, partners, resellers & integrations", route: "/enterprise-cloud", group: "roadmap", order: 230, permission: "cloud.sso.manage", featureFlag: "roadmap.v5.sso", status: "planned", version: "v5.0" },
  { id: "autonomous", label: "Autonomous", tagline: "Robotics, IoT, digital twin & AI ops", route: "/autonomous", group: "roadmap", order: 240, permission: "autonomous.aiops.manage", featureFlag: "roadmap.v6.aiOps", status: "planned", version: "v6.0" },
]);

export function modulesByGroup() {
  const groups: Record<ModuleDefinition["group"], ModuleDefinition[]> = {
    core: [], product: [], enterprise: [], system: [], roadmap: [],
  };
  for (const m of MODULES) groups[m.group].push(m);
  for (const g of Object.values(groups)) g.sort((a, b) => a.order - b.order);
  return groups;
}

export function getModule(id: ModuleId): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}
