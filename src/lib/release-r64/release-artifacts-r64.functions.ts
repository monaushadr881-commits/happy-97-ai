/** R64.1 — Artifact registry. Metadata only. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOpsAdminR64, writeAudit } from "./gate";
import { validateArtifactMetadata } from "./artifact-registry";
import { ARTIFACT_KINDS } from "./contracts";

export const listArtifacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid().optional() }).parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const sb: any = context.supabase;
    let q = sb.from("release_artifact_registry").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.release_id) q = q.eq("release_id", data.release_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { artifacts: rows ?? [] };
  });

export const registerArtifact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({
      release_id: z.string().uuid(),
      kind: z.enum(ARTIFACT_KINDS as [string, ...string[]]),
      filename: z.string().min(1).max(512),
      sha256: z.string().optional().nullable(),
      size_bytes: z.number().int().nonnegative().optional().nullable(),
      storage_url: z.string().url().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional(),
    }).parse(raw))
  .handler(async ({ context, data }) => {
    await assertOpsAdminR64(context);
    const v = validateArtifactMetadata({
      kind: data.kind as any,
      filename: data.filename,
      sha256: data.sha256 ?? null,
      size_bytes: data.size_bytes ?? null,
      storage_url: data.storage_url ?? null,
    });
    const sb: any = context.supabase;
    const { data: row, error } = await sb.from("release_artifact_registry").insert({
      release_id: data.release_id,
      kind: data.kind,
      filename: data.filename,
      sha256: data.sha256 ?? null,
      size_bytes: data.size_bytes ?? null,
      storage_url: data.storage_url ?? null,
      validation_status: v.valid ? "valid" : "invalid",
      validation_detail: { errors: v.errors, warnings: v.warnings },
      metadata: data.metadata ?? {},
      uploaded_by: context.userId,
    }).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(context, { category: "release", action: "artifact_registered", entity_type: "release_artifact_registry", entity_id: row.id });
    return { artifact: row, validation: v };
  });

export const uploadArtifactBinary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ release_id: z.string().uuid(), kind: z.string() }).parse(raw))
  .handler(async ({ context }) => {
    await assertOpsAdminR64(context);
    return {
      status: "blocked",
      reason: "No storage bucket provisioned for release artifacts. Register metadata + external storage_url instead.",
      required: ["Supabase storage bucket 'release-artifacts' with admin-only policies"],
    };
  });
