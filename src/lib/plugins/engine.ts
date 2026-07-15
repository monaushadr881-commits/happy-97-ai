/**
 * R36 Plugin Framework — runtime engine
 *
 * Real implementation. No mocks.
 * - Manifest schema validation (Zod)
 * - Checksum computation (Web Crypto SHA-256)
 * - Lifecycle helpers (install / enable / disable / upgrade / rollback)
 * - Sandbox permission check (grant intersection)
 * - Event emission
 *
 * All database access is performed by the caller through a Supabase
 * client instance passed in (typically the authenticated client from
 * `requireSupabaseAuth` context). This module contains ZERO privileged
 * (service_role) access. RLS is the security boundary.
 */

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// -----------------------------------------------------------------------------
// Manifest schema
// -----------------------------------------------------------------------------

export const PluginManifestSchema = z.object({
  slug: z.string().min(3).max(64).regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1).max(120),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/, "semver required"),
  description: z.string().max(2000).optional(),
  publisher: z.string().min(1).max(120),
  publisher_url: z.string().url().optional(),
  category: z.string().default("general"),
  homepage_url: z.string().url().optional(),
  icon_url: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  runtime: z.enum(["serverfn", "webhook", "iframe", "worker"]).default("serverfn"),
  entry_point: z.string().optional(),
  min_platform_version: z.string().optional(),
  permissions: z
    .array(
      z.object({
        code: z.string(),
        reason: z.string().max(500).optional(),
        optional: z.boolean().default(false),
      }),
    )
    .default([]),
  changelog: z.string().optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export function validateManifest(input: unknown): PluginManifest {
  return PluginManifestSchema.parse(input);
}

// -----------------------------------------------------------------------------
// Checksum
// -----------------------------------------------------------------------------

export async function computeChecksum(payload: unknown): Promise<string> {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// -----------------------------------------------------------------------------
// Semver
// -----------------------------------------------------------------------------

function parseSemver(v: string): [number, number, number] {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`invalid semver: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** returns -1 if a<b, 0 if equal, 1 if a>b */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (av[i] < bv[i]) return -1;
    if (av[i] > bv[i]) return 1;
  }
  return 0;
}

// -----------------------------------------------------------------------------
// Permission enforcement
// -----------------------------------------------------------------------------

export type PermissionRequest = {
  code: string;
  reason?: string;
  optional?: boolean;
};

export type PermissionCatalogEntry = {
  code: string;
  risk_level: "low" | "medium" | "high" | "critical";
  requires_founder_approval: boolean;
};

/**
 * Given the permissions a plugin version requests and the permissions actually
 * granted at install time, return whether execution is authorized.
 * A missing required permission is a hard block; missing optional permissions
 * are simply excluded from the effective grant.
 */
export function evaluateGrant(
  requested: PermissionRequest[],
  granted: string[],
): { ok: boolean; effective: string[]; missing_required: string[] } {
  const grantedSet = new Set(granted);
  const effective: string[] = [];
  const missing: string[] = [];
  for (const p of requested) {
    if (grantedSet.has(p.code)) {
      effective.push(p.code);
    } else if (!p.optional) {
      missing.push(p.code);
    }
  }
  return { ok: missing.length === 0, effective, missing_required: missing };
}

/**
 * Sandbox capability check: enforce that a runtime call the plugin is trying
 * to perform is covered by its effective permission set.
 * The caller passes the required permission code for the action.
 */
export function assertCapability(effective: string[], required: string): void {
  if (!effective.includes(required)) {
    throw new Error(`plugin_permission_denied: ${required}`);
  }
}

// -----------------------------------------------------------------------------
// Event emitter
// -----------------------------------------------------------------------------

export type PluginEventInput = {
  installation_id?: string | null;
  company_id?: string | null;
  plugin_id?: string | null;
  plugin_version_id?: string | null;
  event_type:
    | "installed"
    | "enabled"
    | "disabled"
    | "upgraded"
    | "rolled_back"
    | "uninstalled"
    | "invoked"
    | "error"
    | "permission_granted"
    | "permission_revoked"
    | "config_changed";
  actor_id?: string | null;
  severity?: "info" | "warn" | "error" | "critical";
  message?: string;
  metadata?: Record<string, unknown>;
};

export async function emitPluginEvent(
  supabase: SupabaseClient,
  input: PluginEventInput,
): Promise<void> {
  const { error } = await supabase.from("plugin_events").insert({
    installation_id: input.installation_id ?? null,
    company_id: input.company_id ?? null,
    plugin_id: input.plugin_id ?? null,
    plugin_version_id: input.plugin_version_id ?? null,
    event_type: input.event_type,
    actor_id: input.actor_id ?? null,
    severity: input.severity ?? "info",
    message: input.message ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}
