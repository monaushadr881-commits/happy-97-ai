/**
 * R51 HAPPY AI Employee Studio — engine.
 *
 * Real implementation:
 * - Deterministic snapshot builder
 * - SHA-256 checksum via Web Crypto
 * - Version status transitions
 * - Deployment status transitions
 *
 * Single-identity guarantee: enforced by the `singleton BOOLEAN UNIQUE`
 * constraint in the database.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type IdentitySnapshot = {
  identity: unknown;
  appearance: unknown;
  voice: unknown[];
  behavior: unknown[];
  skills: unknown[];
  knowledge_refs: unknown[];
  animations: unknown[];
};

export async function buildSnapshot(
  supabase: SupabaseClient,
  identityId: string,
): Promise<IdentitySnapshot> {
  const [identity, appearance, voice, behavior, skills, knowledge, animations] = await Promise.all([
    supabase.from("happy_identity").select("*").eq("id", identityId).single(),
    supabase.from("happy_appearance").select("*").eq("identity_id", identityId).maybeSingle(),
    supabase.from("happy_voice").select("*").eq("identity_id", identityId).order("language"),
    supabase.from("happy_behavior").select("*").eq("identity_id", identityId).order("mode"),
    supabase.from("happy_skills").select("*").eq("identity_id", identityId).order("skill_code"),
    supabase.from("happy_knowledge_refs").select("*").eq("identity_id", identityId).order("priority"),
    supabase.from("happy_animations").select("*").eq("identity_id", identityId).order("clip_code"),
  ]);
  if (identity.error) throw identity.error;
  return {
    identity: identity.data,
    appearance: appearance.data ?? null,
    voice: voice.data ?? [],
    behavior: behavior.data ?? [],
    skills: skills.data ?? [],
    knowledge_refs: knowledge.data ?? [],
    animations: animations.data ?? [],
  };
}

export async function computeSnapshotChecksum(snapshot: IdentitySnapshot): Promise<string> {
  // Deterministic stringify: sort object keys at top level. Rows already sorted
  // by their primary sort key above.
  const canonical = JSON.stringify(snapshot, Object.keys(snapshot).sort());
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type VersionStatus = "draft" | "review" | "approved" | "published" | "rolled_back";

const VERSION_TRANSITIONS: Record<VersionStatus, VersionStatus[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "review"],
  published: ["rolled_back"],
  rolled_back: [],
};

export function assertVersionTransition(from: VersionStatus, to: VersionStatus): void {
  if (!VERSION_TRANSITIONS[from].includes(to)) {
    throw new Error(`invalid_version_transition: ${from} -> ${to}`);
  }
}

export type DeploymentStatus = "inactive" | "active" | "paused" | "rolled_back" | "failed";

const DEPLOYMENT_TRANSITIONS: Record<DeploymentStatus, DeploymentStatus[]> = {
  inactive: ["active", "failed"],
  active: ["paused", "rolled_back", "failed"],
  paused: ["active", "rolled_back"],
  rolled_back: ["active"],
  failed: ["active", "rolled_back"],
};

export function assertDeploymentTransition(from: DeploymentStatus, to: DeploymentStatus): void {
  if (!DEPLOYMENT_TRANSITIONS[from].includes(to)) {
    throw new Error(`invalid_deployment_transition: ${from} -> ${to}`);
  }
}
