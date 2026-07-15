/**
 * R39–R50 HAPPY Runtime — Capability Router.
 *
 * A thin, real router that resolves a "capability code" (e.g. "crm.list_leads")
 * into an existing runtime route registered in `happy_skills`. It NEVER
 * duplicates business logic; it only dispatches to the module already owning
 * that domain.
 *
 * The adapter interface accepts a supabase client so runtime adapters remain
 * side-effect free — no privileged (service_role) access here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type CapabilityCall = {
  capability: string;         // e.g. "crm.list_leads"
  args?: Record<string, unknown>;
  companyId?: string;
  persona?: string;
};

export type CapabilityResult<T = unknown> = {
  ok: boolean;
  runtime_route?: string;
  skill_code?: string;
  result?: T;
  error?: string;
};

export type CapabilityAdapter = (
  supabase: SupabaseClient,
  call: CapabilityCall,
) => Promise<unknown>;

/**
 * Adapter registry. Adapters MUST call the existing runtime for that domain
 * and forward its response. They MUST NOT reimplement domain logic.
 */
const ADAPTERS = new Map<string, CapabilityAdapter>();

export function registerAdapter(runtimeRoute: string, adapter: CapabilityAdapter): void {
  ADAPTERS.set(runtimeRoute, adapter);
}

export function getRegisteredRoutes(): string[] {
  return Array.from(ADAPTERS.keys());
}

/**
 * Route a call:
 * 1. Look up the skill in happy_skills by prefix of `capability` (segment 0).
 * 2. Confirm it's enabled.
 * 3. Dispatch to the registered adapter for that runtime_route.
 * 4. Return the adapter's response verbatim.
 */
export async function routeCapability<T = unknown>(
  supabase: SupabaseClient,
  call: CapabilityCall,
): Promise<CapabilityResult<T>> {
  const skillCode = call.capability.split(".")[0];
  if (!skillCode) return { ok: false, error: "invalid_capability" };

  const { data: skill, error } = await supabase
    .from("happy_skills")
    .select("skill_code, runtime_route, enabled")
    .eq("skill_code", skillCode)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!skill) return { ok: false, error: `unknown_skill:${skillCode}` };
  if (!skill.enabled) return { ok: false, error: `skill_disabled:${skillCode}` };

  const adapter = ADAPTERS.get(skill.runtime_route);
  if (!adapter) {
    // No adapter installed. This is honest: return without pretending success.
    return {
      ok: false,
      skill_code: skill.skill_code,
      runtime_route: skill.runtime_route,
      error: `adapter_not_registered:${skill.runtime_route}`,
    };
  }

  try {
    const result = (await adapter(supabase, call)) as T;
    return { ok: true, skill_code: skill.skill_code, runtime_route: skill.runtime_route, result };
  } catch (e) {
    return {
      ok: false,
      skill_code: skill.skill_code,
      runtime_route: skill.runtime_route,
      error: e instanceof Error ? e.message : "adapter_error",
    };
  }
}
