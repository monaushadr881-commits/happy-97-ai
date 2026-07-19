/**
 * R40 HAPPY Asset Pipeline — server functions.
 *
 * Auth-gated RPCs. Ops-admin writes are enforced by the RLS policies on
 * the underlying tables (`is_ops_admin(auth.uid())`), not by trust in the
 * caller.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { founderPanel, importAssetVersion, validateManifest } from "./engine";
import {
  ARKIT52, FINGER_BONES, REQUIRED_ANIMATIONS,
  REQUIRED_BONES, REQUIRED_VISEMES, RUNTIME_REQUIREMENTS, RUNTIME_TARGETS,
} from "./contracts";

const AssetTypeEnum = z.enum([
  "character","skeleton","blendshapes","animation","material",
  "texture","hdr_environment","voice_profile","motion_library",
]);

const RegisterAsset = z.object({
  asset_type: AssetTypeEnum,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export const registerAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof RegisterAsset>) => RegisterAsset.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "registerAsset", source: "api", module: "assets.registerAsset" });
    const { data: row, error } = await context.supabase
      .from("happy_assets")
      .insert({
        asset_type: data.asset_type,
        name: data.name,
        description: data.description ?? null,
        tags: data.tags ?? [],
        created_by: context.userId,
      })
      .select("id, asset_type, name, tags")
      .single();
    if (error) throw new Error(`register_asset_failed:${error.message}`);
    return row;
  });

const ImportVersion = z.object({
  asset_id: z.string().uuid(),
  version: z.string().min(1).max(50),
  storage_ref: z.string().min(1).max(500),
  checksum_sha256: z.string().length(64),
  size_bytes: z.number().int().nonnegative(),
  mime_type: z.string().max(120).optional(),
  meta: z.record(z.string(), z.any()).optional(),
  depends_on: z.array(z.string().uuid()).optional(),
});

export const importAssetVersionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ImportVersion>) => ImportVersion.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "importAssetVersionFn", source: "api", module: "assets.importAssetVersionFn" });
    return importAssetVersion(context.supabase, data);
  });
const CreateManifest = z.object({
  version: z.string().min(1).max(50),
  rig_meta: z.record(z.string(), z.any()).optional(),
  skeleton_meta: z.record(z.string(), z.any()).optional(),
  blendshape_profile: z.enum(["arkit52","equivalent","custom"]).default("arkit52"),
  animation_set: z.array(z.union([z.string(), z.record(z.string(), z.any())])).optional(),
  notes: z.string().max(2000).optional(),
});

export const createCharacterManifest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof CreateManifest>) => CreateManifest.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createCharacterManifest", source: "api", module: "assets.createCharacterManifest" });
    const { data: row, error } = await context.supabase
      .from("happy_character_manifests")
      .insert({
        character_key: "HAPPY",
        version: data.version,
        rig_meta: data.rig_meta ?? {},
        skeleton_meta: data.skeleton_meta ?? {},
        blendshape_profile: data.blendshape_profile,
        animation_set: data.animation_set ?? [],
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("id, character_key, version, status")
      .single();
    if (error) throw new Error(`manifest_create_failed:${error.message}`);
    return row);

const LinkAsset = z.object({
  manifest_id: z.string().uuid(),
  role: AssetTypeEnum,
  slot: z.string().max(80).optional(),
  asset_version_id: z.string().uuid(),
  required: z.boolean().default(true),
});

export const linkManifestAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof LinkAsset>) => LinkAsset.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "linkManifestAsset", source: "api", module: "assets.linkManifestAsset" });
    const { data: row, error } = await context.supabase
      .from("happy_manifest_assets")
      .insert({
        manifest_id: data.manifest_id,
        role: data.role,
        slot: data.slot ?? null,
        asset_version_id: data.asset_version_id,
        required: data.required,
      })
      .select("id, role, slot, required")
      .single();
    if (error) throw new Error(`link_asset_failed:${error.message}`);
    return row);

const ManifestId = z.object({ manifest_id: z.string().uuid() });

export const validateManifestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ManifestId>) => ManifestId.parse(d))
  .handler(async ({ data, context }) => validateManifest(context.supabase, data.manifest_id));

export const founderAssetPanel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ManifestId>) => ManifestId.parse(d))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "founderAssetPanel", source: "api", module: "assets.founderAssetPanel" });
    return founderPanel(context.supabase, data.manifest_id);
  });
/**
 * Public read: expose the pipeline's contract constants so any UI or
 * external tool knows exactly what a real HAPPY character must supply.
 * No auth required — this is documentation, not data.
 */
export const getAssetContracts = createServerFn({ method: "GET" }).handler(async () => {
  return {
    required_bones: REQUIRED_BONES,
    finger_bones: FINGER_BONES,
    arkit52: ARKIT52,
    required_visemes: REQUIRED_VISEMES,
    required_animations: REQUIRED_ANIMATIONS,
    runtime_targets: RUNTIME_TARGETS,
    runtime_requirements: RUNTIME_REQUIREMENTS,
  };
});
