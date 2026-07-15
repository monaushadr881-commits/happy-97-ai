/**
 * R40 HAPPY Asset Pipeline — Import + orchestrator engine.
 *
 * Validates asset versions on ingest (files, checksums, metadata, version,
 * compatibility, dependencies) and runs the full manifest validation
 * (rig / skeleton / blendshapes / animations / compatibility). All results
 * are appended to `happy_asset_validations` — immutable audit trail.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeCompatibility, rollupStatus, validateAnimations,
  validateBlendshapes, validateRig, validateSkeleton,
  type ManifestAssetLite,
} from "./validators";
import type { ValidationStatus } from "./contracts";

const SHA256_RE = /^[a-f0-9]{64}$/i;

export type ImportAssetVersionInput = {
  asset_id: string;
  version: string;
  storage_ref: string;
  checksum_sha256: string;
  size_bytes: number;
  mime_type?: string;
  meta?: Record<string, unknown>;
  depends_on?: string[]; // asset_version_ids
};

export type ImportResult = {
  status: "accepted" | "rejected";
  version_id?: string;
  errors: string[];
};

/**
 * Validate an incoming asset version and persist it if it passes.
 * Rejects on: malformed checksum, non-positive size, missing storage_ref,
 * duplicate (asset_id, version), or unresolved dependency ids.
 */
export async function importAssetVersion(
  supabase: SupabaseClient,
  input: ImportAssetVersionInput,
): Promise<ImportResult> {
  const errors: string[] = [];
  if (!input.storage_ref) errors.push("missing_storage_ref");
  if (!SHA256_RE.test(input.checksum_sha256)) errors.push("bad_checksum_sha256");
  if (!Number.isFinite(input.size_bytes) || input.size_bytes < 0) errors.push("bad_size_bytes");
  if (!input.version) errors.push("missing_version");

  if (input.depends_on?.length) {
    const { data: deps, error } = await supabase
      .from("happy_asset_versions")
      .select("id")
      .in("id", input.depends_on);
    if (error) errors.push(`dep_lookup_failed:${error.message}`);
    else {
      const found = new Set((deps ?? []).map((d) => d.id as string));
      for (const id of input.depends_on) if (!found.has(id)) errors.push(`dep_missing:${id}`);
    }
  }

  if (errors.length) return { status: "rejected", errors };

  const { data, error } = await supabase
    .from("happy_asset_versions")
    .insert({
      asset_id: input.asset_id,
      version: input.version,
      storage_ref: input.storage_ref,
      checksum_sha256: input.checksum_sha256.toLowerCase(),
      size_bytes: input.size_bytes,
      mime_type: input.mime_type ?? null,
      meta: { ...(input.meta ?? {}), depends_on: input.depends_on ?? [] },
      status: "validated",
    })
    .select("id")
    .single();
  if (error) return { status: "rejected", errors: [`insert_failed:${error.message}`] };
  return { status: "accepted", version_id: data.id as string, errors: [] };
}

export type ManifestValidation = {
  status: ValidationStatus;
  parts: {
    rig: ReturnType<typeof validateRig>;
    skeleton: ReturnType<typeof validateSkeleton>;
    blendshape: ReturnType<typeof validateBlendshapes>;
    animation: ReturnType<typeof validateAnimations>;
    compatibility: ReturnType<typeof computeCompatibility>;
  };
  missing: string[];
};

/**
 * Run the full validation suite on a manifest. Writes one validation row
 * per kind (rig/skeleton/blendshape/animation/compatibility/manifest) into
 * `happy_asset_validations` — every row is a permanent record.
 */
export async function validateManifest(
  supabase: SupabaseClient,
  manifestId: string,
): Promise<ManifestValidation> {
  const { data: m, error: me } = await supabase
    .from("happy_character_manifests")
    .select("id, rig_meta, skeleton_meta, blendshape_profile, animation_set")
    .eq("id", manifestId)
    .maybeSingle();
  if (me) throw new Error(`manifest_read_failed:${me.message}`);
  if (!m) throw new Error("manifest_not_found");

  const { data: linkedRaw, error: ae } = await supabase
    .from("happy_manifest_assets")
    .select("role, slot, required")
    .eq("manifest_id", manifestId);
  if (ae) throw new Error(`assets_read_failed:${ae.message}`);
  const linked = (linkedRaw ?? []) as ManifestAssetLite[];

  const rigMeta = (m.rig_meta as Record<string, unknown>) ?? {};
  const skeletonMeta = (m.skeleton_meta as Record<string, unknown>) ?? {};
  const clips: string[] = Array.isArray(m.animation_set)
    ? (m.animation_set as unknown[]).map((c) =>
        typeof c === "string" ? c : ((c as { name?: string })?.name ?? ""),
      ).filter(Boolean)
    : [];

  const blendshapesProvided: string[] = Array.isArray((rigMeta as { blendshapes?: unknown }).blendshapes)
    ? ((rigMeta as { blendshapes: unknown[] }).blendshapes.map((b) =>
        typeof b === "string" ? b : ((b as { name?: string })?.name ?? ""),
      ).filter(Boolean))
    : [];

  const rig = validateRig({
    bones: Array.isArray((rigMeta as { bones?: unknown }).bones)
      ? ((rigMeta as { bones: unknown[] }).bones.filter((b) => typeof b === "string") as string[])
      : [],
    humanoid: (rigMeta as { humanoid?: boolean }).humanoid,
    animation_compatible: (rigMeta as { animation_compatible?: boolean }).animation_compatible,
  });
  const skeleton = validateSkeleton({
    bone_count: (skeletonMeta as { bone_count?: number }).bone_count,
    root: (skeletonMeta as { root?: string }).root,
  });
  const blendshape = validateBlendshapes(m.blendshape_profile as string, blendshapesProvided);
  const animation = validateAnimations(clips);
  const compatibility = computeCompatibility(linked);

  const overall = rollupStatus([rig.status, skeleton.status, blendshape.status, animation.status, compatibility.status]);
  const missing = [
    ...rig.missing, ...skeleton.missing, ...blendshape.missing,
    ...animation.missing, ...compatibility.missing,
  ];

  const rows = [
    { kind: "rig",           status: rig.status,           missing: rig.missing,           report: rig.report },
    { kind: "skeleton",      status: skeleton.status,      missing: skeleton.missing,      report: skeleton.report },
    { kind: "blendshape",    status: blendshape.status,    missing: blendshape.missing,    report: blendshape.report },
    { kind: "animation",     status: animation.status,     missing: animation.missing,     report: animation.report },
    { kind: "compatibility", status: compatibility.status, missing: compatibility.missing, report: compatibility.targets },
    { kind: "manifest",      status: overall,              missing,                        report: { parts_status: {
      rig: rig.status, skeleton: skeleton.status, blendshape: blendshape.status,
      animation: animation.status, compatibility: compatibility.status,
    } } },
  ].map((r) => ({ manifest_id: manifestId, ...r }));

  const { error: ie } = await supabase.from("happy_asset_validations").insert(rows);
  if (ie) throw new Error(`validation_insert_failed:${ie.message}`);

  return {
    status: overall,
    parts: { rig, skeleton, blendshape, animation, compatibility },
    missing,
  };
}

/**
 * Founder panel snapshot: character version + rig/blendshape/animation/voice
 * status + compatibility + missing assets. Reads latest validations only.
 */
export async function founderPanel(
  supabase: SupabaseClient,
  manifestId: string,
) {
  const { data: manifest, error: me } = await supabase
    .from("happy_character_manifests")
    .select("id, character_key, version, status, blendshape_profile, updated_at")
    .eq("id", manifestId)
    .maybeSingle();
  if (me) throw new Error(`panel_manifest_failed:${me.message}`);
  if (!manifest) throw new Error("manifest_not_found");

  const { data: linked } = await supabase
    .from("happy_manifest_assets")
    .select("role, slot, required, asset_version_id")
    .eq("manifest_id", manifestId);

  const { data: validations } = await supabase
    .from("happy_asset_validations")
    .select("kind, status, missing, report, created_at")
    .eq("manifest_id", manifestId)
    .order("created_at", { ascending: false });

  const latestByKind = new Map<string, Record<string, unknown>>();
  for (const v of validations ?? []) if (!latestByKind.has(v.kind as string)) latestByKind.set(v.kind as string, v);

  const voicePresent = (linked ?? []).some((l) => l.role === "voice_profile");
  return {
    character: manifest.character_key,
    version: manifest.version,
    status: manifest.status,
    blendshape_profile: manifest.blendshape_profile,
    rig: latestByKind.get("rig") ?? null,
    blendshape: latestByKind.get("blendshape") ?? null,
    animation: latestByKind.get("animation") ?? null,
    compatibility: latestByKind.get("compatibility") ?? null,
    manifest_rollup: latestByKind.get("manifest") ?? null,
    voice: { present: voicePresent, provider_independent: true },
    asset_count: linked?.length ?? 0,
    updated_at: manifest.updated_at,
  };
}
