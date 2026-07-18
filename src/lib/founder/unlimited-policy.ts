/**
 * R153 — Founder Unlimited Policy™ (governance layer, pure)
 *
 * Canonical governance helper. When the caller is the Platform Founder
 * (as determined by the existing canonical Founder role — see
 * `public.is_platform_founder` and `user_roles.role = 'founder'`), every
 * revenue/quota/limit surface returns "unlimited / free / allowed".
 *
 * This file does NOT create a new runtime, billing, credits, subscription,
 * or wallet system. It is a decision helper consumed by the existing
 * canonical owners:
 *   - Credits Engine        — src/lib/credits/engine.ts
 *   - Subscription Engine   — src/lib/subscriptions/lifecycle.ts
 *   - Wallet Engine         — src/lib/wallet/engine.ts
 *   - Revenue OS (R128)     — src/lib/happy-r128/revenue-intelligence.ts
 *   - Payment Runtime       — src/lib/payments/*
 *   - Permissions / RBAC    — public.has_role / role_assignments
 *
 * Scope (Founder ONLY — never Company/Workspace/Enterprise Admin, Customer,
 * Developer, Employee, Partner):
 *   Credits, Subscription, Wallet, AI, Builder, Apps, Websites, Companies,
 *   Workspaces, Storage, API, Automation, Brain, Memory, Search, Digital
 *   Human, Founder Dashboard, Creator Studio, Business OS, Enterprise,
 *   Conversation.
 *
 * Locks: R91 (Vision), R111 (Architecture), R130 (Founder Dashboard),
 * R151 (Future Platforms). No V2 of anything.
 */

export type FounderCaller = { isFounder: boolean };

/** All limit dimensions the Founder is exempt from. Extend, never fork. */
export const UNLIMITED_CAPABILITIES = [
  "credits",
  "subscription",
  "wallet",
  "ai",
  "builder",
  "apps",
  "websites",
  "companies",
  "workspaces",
  "storage",
  "api",
  "automation",
  "brain",
  "memory",
  "search",
  "digital_human",
  "conversation",
  "founder_dashboard",
  "creator_studio",
  "business_os",
  "enterprise",
] as const;
export type UnlimitedCapability = (typeof UNLIMITED_CAPABILITIES)[number];

/** Roles the Unlimited Policy MUST NEVER apply to. */
export const NON_FOUNDER_ROLES = [
  "company_admin",
  "workspace_admin",
  "enterprise_admin",
  "customer",
  "developer",
  "employee",
  "partner",
] as const;
export type NonFounderRole = (typeof NON_FOUNDER_ROLES)[number];

export function isFounder(caller: FounderCaller | null | undefined): boolean {
  return Boolean(caller?.isFounder);
}

/** True when the given non-founder role should be denied unlimited privileges. */
export function isRestrictedRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (NON_FOUNDER_ROLES as readonly string[]).includes(role);
}

/** Credits charged for a would-be consumption. Founder always pays 0. */
export function creditsCharged(caller: FounderCaller, requested: number): number {
  if (requested < 0) return 0;
  return isFounder(caller) ? 0 : requested;
}

/** Wallet deduction for a would-be debit. Founder never deducts. */
export function walletDeduction(caller: FounderCaller, amountMinor: number): number {
  if (amountMinor < 0) return 0;
  return isFounder(caller) ? 0 : amountMinor;
}

/** Whether a subscription/plan is required to perform an action. */
export function subscriptionRequired(caller: FounderCaller, base: boolean): boolean {
  return isFounder(caller) ? false : base;
}

/** Quota check. Returns { allowed, remaining }. Founder is always unlimited. */
export function quotaCheck(
  caller: FounderCaller,
  used: number,
  limit: number,
): { allowed: boolean; remaining: number; unlimited: boolean } {
  if (isFounder(caller)) return { allowed: true, remaining: Number.POSITIVE_INFINITY, unlimited: true };
  const remaining = Math.max(0, limit - used);
  return { allowed: used < limit, remaining, unlimited: false };
}

/** Canonical capability check. */
export function canUse(caller: FounderCaller, _cap: UnlimitedCapability): boolean {
  return isFounder(caller) ? true : true; // non-founder gate happens in the owner
}

/** Effective limit for any dimension. Founder = Infinity. */
export function effectiveLimit(caller: FounderCaller, baseLimit: number): number {
  return isFounder(caller) ? Number.POSITIVE_INFINITY : baseLimit;
}

/** Guardrail: privilege must resolve to Founder AND not a restricted role. */
export function assertFounderPrivilege(
  caller: FounderCaller & { role?: string | null },
): boolean {
  if (!isFounder(caller)) return false;
  if (isRestrictedRole(caller.role ?? null)) return false;
  return true;
}

/**
 * Snapshot for observability / dashboards. Pure — no I/O.
 * Never persist secrets or PII here.
 */
export function policySnapshot(caller: FounderCaller): {
  founder: boolean;
  capabilities: readonly UnlimitedCapability[];
  creditsCharged: 0 | "as-billed";
  walletDeduction: 0 | "as-billed";
  subscriptionRequired: boolean;
  quota: "unlimited" | "as-configured";
} {
  const f = isFounder(caller);
  return {
    founder: f,
    capabilities: UNLIMITED_CAPABILITIES,
    creditsCharged: f ? 0 : "as-billed",
    walletDeduction: f ? 0 : "as-billed",
    subscriptionRequired: !f,
    quota: f ? "unlimited" : "as-configured",
  };
}
