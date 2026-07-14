/**
 * HAPPY X Kernel — Permission Engine
 *
 * Role → permission mapping evaluated in-memory. The database remains the
 * source of truth (public.user_roles + has_role RPC); this engine mirrors it
 * for fast UI gating.
 *
 * Includes reserved permissions for the v2.0 – v6.0 roadmap so guards can be
 * wired ahead of feature delivery.
 */

export type AppRole = "founder" | "admin" | "enterprise" | "creator" | "user";

export type Permission =
  // v1.0 — current
  | "platform.manage"
  | "companies.manage"
  | "brands.manage"
  | "workspaces.manage"
  | "users.manage"
  | "billing.manage"
  | "audit.view"
  | "assistant.use"
  | "studio.use"
  | "marketplace.sell"
  | "marketplace.buy"
  | "community.post"
  | "knowledge.contribute"
  // v2.0 — Agent OS & Developer Platform (reserved)
  | "agents.use"
  | "agents.manage"
  | "agents.publish"
  | "workflows.manage"
  | "plugins.install"
  | "plugins.publish"
  | "developer.apiKeys"
  | "developer.sdk"
  | "skills.publish"
  | "prompts.publish"
  // v3.0 — Enterprise Intelligence (reserved)
  | "intelligence.view"
  | "intelligence.forecast"
  | "intelligence.scenarios"
  | "intelligence.decisions"
  // v4.0 — Global Platform (reserved)
  | "global.localization.manage"
  | "global.compliance.manage"
  | "global.tax.manage"
  | "global.currency.manage"
  | "global.expansion.manage"
  // v5.0 — Enterprise Cloud (reserved)
  | "cloud.sso.manage"
  | "cloud.org.manage"
  | "cloud.partners.manage"
  | "cloud.resellers.manage"
  | "cloud.integrations.manage"
  | "cloud.identity.federate"
  // v6.0 — Autonomous Enterprise (reserved)
  | "autonomous.robotics.operate"
  | "autonomous.iot.manage"
  | "autonomous.factory.operate"
  | "autonomous.twin.view"
  | "autonomous.aiops.manage"
  | "autonomous.process.orchestrate";

const V1_FOUNDER: Permission[] = [
  "platform.manage",
  "companies.manage",
  "brands.manage",
  "workspaces.manage",
  "users.manage",
  "billing.manage",
  "audit.view",
  "assistant.use",
  "studio.use",
  "marketplace.sell",
  "marketplace.buy",
  "community.post",
  "knowledge.contribute",
];

const ROADMAP_FOUNDER: Permission[] = [
  "agents.use", "agents.manage", "agents.publish",
  "workflows.manage", "plugins.install", "plugins.publish",
  "developer.apiKeys", "developer.sdk", "skills.publish", "prompts.publish",
  "intelligence.view", "intelligence.forecast", "intelligence.scenarios", "intelligence.decisions",
  "global.localization.manage", "global.compliance.manage", "global.tax.manage",
  "global.currency.manage", "global.expansion.manage",
  "cloud.sso.manage", "cloud.org.manage", "cloud.partners.manage",
  "cloud.resellers.manage", "cloud.integrations.manage", "cloud.identity.federate",
  "autonomous.robotics.operate", "autonomous.iot.manage", "autonomous.factory.operate",
  "autonomous.twin.view", "autonomous.aiops.manage", "autonomous.process.orchestrate",
];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  founder: [...V1_FOUNDER, ...ROADMAP_FOUNDER],
  admin: [
    "companies.manage",
    "brands.manage",
    "workspaces.manage",
    "users.manage",
    "audit.view",
    "assistant.use",
    "studio.use",
    "marketplace.sell",
    "marketplace.buy",
    "community.post",
    "knowledge.contribute",
    // Reserved: admins co-manage roadmap surfaces once shipped
    "agents.use", "agents.manage", "workflows.manage",
    "plugins.install", "developer.apiKeys",
    "intelligence.view", "intelligence.forecast",
    "cloud.sso.manage", "cloud.org.manage", "cloud.integrations.manage",
    "autonomous.iot.manage", "autonomous.twin.view",
  ],
  enterprise: [
    "brands.manage",
    "workspaces.manage",
    "audit.view",
    "assistant.use",
    "studio.use",
    "marketplace.buy",
    "community.post",
    "knowledge.contribute",
    "agents.use", "workflows.manage",
    "intelligence.view",
  ],
  creator: [
    "assistant.use", "studio.use", "marketplace.sell", "community.post", "knowledge.contribute",
    "agents.use", "plugins.publish", "skills.publish", "prompts.publish",
  ],
  user: ["assistant.use", "marketplace.buy", "community.post", "agents.use"],
};

export function permissionsForRoles(roles: AppRole[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) out.add(p);
  return out;
}

export function can(roles: AppRole[], permission: Permission): boolean {
  return permissionsForRoles(roles).has(permission);
}

export function canAny(roles: AppRole[], perms: Permission[]): boolean {
  const set = permissionsForRoles(roles);
  return perms.some((p) => set.has(p));
}

export function canAll(roles: AppRole[], perms: Permission[]): boolean {
  const set = permissionsForRoles(roles);
  return perms.every((p) => set.has(p));
}
