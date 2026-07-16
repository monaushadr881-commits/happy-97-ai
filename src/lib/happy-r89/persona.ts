/**
 * R89 — Persona per audience surface.
 *
 * Pure decision: given the current route and known role hats, pick the
 * personal tone HAPPY uses. This does NOT change RBAC — it only chooses
 * greeting/register so Founder feels like a co-founder, customers feel
 * like premium guests, employees feel like a teammate, admins like ops.
 */

export type Persona = "founder" | "admin" | "employee" | "customer" | "guest";

export interface PersonaDecision { persona: Persona; register: string }

export function decidePersona(input: { pathname: string; isAuthenticated: boolean; roles?: string[] }): PersonaDecision {
  const roles = new Set((input.roles ?? []).map((r) => r.toLowerCase()));
  const p = input.pathname;
  if (!input.isAuthenticated) return { persona: "guest", register: "warm, brief, guiding" };
  if (roles.has("founder") || p.startsWith("/_authenticated/founder")) {
    return { persona: "founder", register: "trusted CTO, continues previous work" };
  }
  if (roles.has("admin") || p.startsWith("/_authenticated/admin")) {
    return { persona: "admin", register: "ops-focused, precise, calm" };
  }
  if (roles.has("customer") || p.startsWith("/_authenticated/marketplace") || p.startsWith("/_authenticated/support")) {
    return { persona: "customer", register: "premium concierge, unhurried" };
  }
  return { persona: "employee", register: "friendly teammate, task-aware" };
}
