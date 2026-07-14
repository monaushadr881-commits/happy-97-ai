/**
 * HAPPY X Kernel — Permission Engine
 *
 * Role → permission mapping evaluated in-memory. The database remains the
 * source of truth (public.user_roles + has_role RPC); this engine mirrors it
 * for fast UI gating.
 */

export type AppRole = "founder" | "admin" | "enterprise" | "creator" | "user";

export type Permission =
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
  | "knowledge.contribute";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  founder: [
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
  ],
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
  ],
  creator: ["assistant.use", "studio.use", "marketplace.sell", "community.post", "knowledge.contribute"],
  user: ["assistant.use", "marketplace.buy", "community.post"],
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
