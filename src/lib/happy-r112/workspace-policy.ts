/**
 * R112 — Workspace unlimited-quota policy.
 *
 * Extends existing `workspaces`, `workspace_memberships`, `companies`,
 * `brands`, `teams`. NO new workspace schema.
 *
 * Founder Mission: unlimited projects/chats/companies/brands/teams/
 * documents/memory + universal search under one Brain. This module
 * encodes the *policy*; enforcement runs in existing server functions
 * by consulting `quotaFor(...)`.
 */

export type Tier = "free" | "pro" | "enterprise" | "founder";
export type Resource =
  | "projects" | "chats" | "companies" | "brands"
  | "teams" | "documents" | "memory_items";

/** -1 === unlimited. Never return 0 for a resource the user is entitled to. */
export function quotaFor(tier: Tier, resource: Resource): number {
  if (tier === "founder" || tier === "enterprise") return -1; // unlimited
  if (tier === "pro") {
    switch (resource) {
      case "projects":    return 100;
      case "chats":       return -1;
      case "companies":   return 10;
      case "brands":      return 25;
      case "teams":       return 50;
      case "documents":   return 10000;
      case "memory_items":return -1;
    }
  }
  // free
  switch (resource) {
    case "projects":    return 3;
    case "chats":       return -1;
    case "companies":   return 1;
    case "brands":      return 1;
    case "teams":       return 3;
    case "documents":   return 100;
    case "memory_items":return 5000;
  }
}

export function isUnlimited(tier: Tier, resource: Resource): boolean {
  return quotaFor(tier, resource) === -1;
}
