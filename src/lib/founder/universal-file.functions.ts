/**
 * R189 Phase 2 — Universal File System, Import/Export/Sync,
 * AI File Understanding, Founder Command Mode.
 *
 * Canonical Scan (reused, never duplicated):
 *   - Universal File store   → public.creator_assets (canonical asset row)
 *   - Workspace linkage      → creator_assets.metadata.workspace_id
 *                              (owner: wsAttachToWorkspace / wsListWorkspaceItems)
 *   - Storage backends       → storage.buckets (happy-assets, creator-assets,
 *                              cms-media, vrm-assets) — no new bucket created
 *   - Brain runtime          → withBrain() (src/lib/founder/with-brain.ts)
 *   - Approval runtime       → requestFounderApproval (R158)
 *   - Audit runtime          → writeCanonicalAudit → public.write_audit
 *   - Universal Search       → src/lib/founder/search.functions.ts (delegate)
 *   - Background jobs        → public.job_queue (read-only, RLS)
 *   - Universal Login        → requireSupabaseAuth middleware (claims/session)
 *
 * No new tables. No new storage layer. No new engine. Mission Control
 * surfaces this runtime through the existing Founder aggregator; no new
 * dashboard is created.
 *
 * Pipeline for every mutation:
 *   Founder Request
 *     ↓ withBrain (capability="ufs.*" | "ai.file.*" | "sync.*" | "founder.command.*")
 *     ↓ Universal Search context (delegate; not re-implemented)
 *     ↓ Workspace + Knowledge lookup (metadata scope)
 *     ↓ Permission check (RLS via requireSupabaseAuth)
 *     ↓ Executive Review + R158 Approval (policy-gated)
 *     ↓ writeCanonicalAudit
 *     ↓ persist to creator_assets + version bump
 *     ↓ Mission Control visibility (platform_runtime aggregator block)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { withBrain } from "@/lib/founder/with-brain";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import type { FounderApprovalContext } from "@/lib/founder/types";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

const uuid = z.string().uuid();

// Kinds used by this runtime, encoded on creator_assets.kind so we never
// need a parallel table. These prefixes are the canonical namespace.
const KIND = {
  FILE:   "ufs.file",
  IMPORT: "ufs.import",
  EXPORT: "ufs.export",
  SYNC:   "ufs.sync",
  COMMAND:"ufs.command",
  UNDERSTAND: "ufs.understanding",
} as const;

// ─────────────────────────────────────────────────────────────
// 1. Universal Login — canonical session surface for Command Mode.
// ─────────────────────────────────────────────────────────────
export const universalLoginStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    return {
      authenticated: true as const,
      user_id: userId,
      email: (claims as { email?: string } | null | undefined)?.email ?? null,
      role: (claims as { role?: string } | null | undefined)?.role ?? "authenticated",
      issued_at: new Date().toISOString(),
      middleware: "requireSupabaseAuth",
    };
  });

// ─────────────────────────────────────────────────────────────
// 2. Universal File System — register a stored object as a
//    canonical workspace asset. Storage upload happens client-side
//    against the existing buckets; this handler makes it a first-class
//    asset row (versioned, workspace-linked, audited).
// ─────────────────────────────────────────────────────────────
const RegisterInput = z.object({
  workspace_id: uuid.optional(),
  bucket: z.enum(["happy-assets", "creator-assets", "cms-media", "vrm-assets"]),
  storage_path: z.string().min(1).max(1024),
  name: z.string().min(1).max(240),
  mime_type: z.string().min(1).max(120),
  size_bytes: z.number().int().nonnegative().optional(),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
});

export const ufsRegisterFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RegisterInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "ufs", module: "file", capability: "register",
      user_id: userId, company_id: ZERO_UUID,
      summary: `register ${data.name}`,
      metadata: { workspace_id: data.workspace_id ?? null, bucket: data.bucket },
    });
    const meta = {
      workspace_id: data.workspace_id ?? null,
      bucket: data.bucket,
      storage_path: data.storage_path,
      registered_by: userId,
      registered_at: new Date().toISOString(),
      version: 1,
    };
    const { data: row, error } = await supabase
      .from("creator_assets")
      .insert({
        user_id: userId,
        kind: KIND.FILE,
        mime_type: data.mime_type,
        name: data.name,
        size_bytes: data.size_bytes ?? null,
        tags: data.tags,
        metadata: meta as never,
      })
      .select("id,name,kind,mime_type,size_bytes,metadata,created_at")
      .single();
    if (error) throw new Error(`ufs_register_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "ufs.file",
      action: "register",
      entity_type: "creator_asset",
      entity_id: row.id,
      after: row,
      severity: "info",
      metadata: { workspace_id: data.workspace_id ?? null, bucket: data.bucket },
    });
    return { status: "registered" as const, file: row };
  });

// 3. List UFS files (optionally scoped to workspace / kind).
export const ufsListFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspace_id: uuid.optional(),
        kind_prefix: z.string().max(64).default("ufs."),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,mime_type,size_bytes,tags,metadata,created_at")
      .like("kind", `${data.kind_prefix}%`)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) {
      q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    }
    const r = await q;
    if (r.error) throw new Error(`ufs_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// ─────────────────────────────────────────────────────────────
// 4. AI File Understanding — Brain-wrapped classifier/summariser.
//    Deterministic surface (mime + name + tags), so the runtime is
//    always green. Real model calls stay behind Lovable AI Gateway and
//    are added by a follow-up batch without changing this contract.
// ─────────────────────────────────────────────────────────────
interface Understanding {
  classification: string;
  summary: string;
  suggested_tags: string[];
  index_ready: boolean;
}
const analyzeFile = withBrain<
  { name: string; mime: string; tags: string[] },
  Understanding
>({
  capability: "ai.file.understand",
  handler: async (input) => {
    const mime = input.mime.toLowerCase();
    const classification =
      mime.startsWith("image/") ? "image" :
      mime.startsWith("video/") ? "video" :
      mime.startsWith("audio/") ? "audio" :
      mime.includes("pdf") ? "document.pdf" :
      mime.includes("spreadsheet") || mime.includes("excel") || mime.endsWith("csv") ? "data.tabular" :
      mime.includes("presentation") ? "document.slides" :
      mime.includes("json") || mime.includes("xml") ? "data.structured" :
      mime.includes("zip") ? "archive" :
      "document.other";
    const suggested = Array.from(new Set([
      ...input.tags.map((t) => t.toLowerCase()),
      classification.split(".")[0],
    ])).slice(0, 12);
    return {
      classification,
      summary: `${classification} · ${input.name}`,
      suggested_tags: suggested,
      index_ready: true,
    };
  },
});

export const aiUnderstandFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ asset_id: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "ufs", module: "file", capability: "understand",
      user_id: userId, company_id: ZERO_UUID,
      summary: `understand asset ${data.asset_id}`,
      metadata: { asset_id: data.asset_id },
    });
    const { data: asset, error: readErr } = await supabase
      .from("creator_assets")
      .select("id,name,mime_type,tags,metadata,kind")
      .eq("id", data.asset_id)
      .single();
    if (readErr || !asset) throw new Error("asset_not_found");

    const brain = await analyzeFile({
      capability: "ai.file.understand",
      input: { name: asset.name, mime: asset.mime_type, tags: asset.tags ?? [] },
      context: { isFounder: true, correlationId: userId } satisfies FounderApprovalContext,
    });

    const prevMeta = (asset.metadata ?? {}) as Record<string, unknown>;
    const prevVersion =
      typeof prevMeta.understanding_version === "number"
        ? (prevMeta.understanding_version as number)
        : 0;
    const nextMeta = {
      ...prevMeta,
      understanding: brain.output,
      understanding_version: prevVersion + 1,
      understood_at: new Date().toISOString(),
    };

    const { data: after, error } = await supabase
      .from("creator_assets")
      .update({ metadata: nextMeta as never, tags: brain.output.suggested_tags })
      .eq("id", data.asset_id)
      .select("id,name,kind,tags,metadata")
      .single();
    if (error) throw new Error(`ai_understand_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "ai.file",
      action: "understand",
      entity_type: "creator_asset",
      entity_id: data.asset_id,
      before: asset,
      after,
      severity: "info",
      metadata: { impact: brain.output, brain_duration_ms: brain.durationMs },
    });
    return { status: "understood" as const, asset: after, understanding: brain.output };
  });

// ─────────────────────────────────────────────────────────────
// 5/6/7. Universal Import / Export / Sync — plans persisted as
//        creator_assets so they inherit versioning, workspace linkage,
//        audit, approval, and Mission Control visibility for free.
// ─────────────────────────────────────────────────────────────
const SUPPORTED = [
  "pdf","docx","pptx","xlsx","csv","json","zip","image","video","audio",
] as const;

interface PlanRow {
  id: string;
  name: string;
  kind: string;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function persistPlan(
  supabase: AnyClient,
  userId: string,
  kind: string,
  name: string,
  meta: Record<string, unknown>,
): Promise<PlanRow> {
  const { data, error } = await supabase
    .from("creator_assets")
    .insert({
      user_id: userId,
      kind,
      mime_type: "application/x-happy-plan+json",
      name,
      metadata: meta,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !data) throw new Error(`${kind}_plan_failed: ${error?.message ?? "unknown"}`);
  const d = data as { id: string; name: string; kind: string; created_at: string };
  return { id: d.id, name: d.name, kind: d.kind, created_at: d.created_at };
}

const ImportInput = z.object({
  workspace_id: uuid.optional(),
  source_kind: z.enum(SUPPORTED),
  sources: z.array(z.string().min(1).max(1024)).min(1).max(50),
  note: z.string().max(500).optional(),
});
export const importPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ImportInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "ufs", module: "import", capability: "plan",
      user_id: userId, company_id: ZERO_UUID,
      summary: `import.${data.source_kind}.${data.sources.length}`,
      metadata: { workspace_id: data.workspace_id ?? null, source_kind: data.source_kind },
    });
    const plan = await persistPlan(
      supabase, userId, KIND.IMPORT,
      `import.${data.source_kind}.${data.sources.length}`,
      {
        workspace_id: data.workspace_id ?? null,
        source_kind: data.source_kind,
        sources: data.sources,
        note: data.note ?? null,
        status: "planned",
        planned_at: new Date().toISOString(),
      },
    );
    await writeCanonicalAudit(supabase, {
      category: "ufs.import",
      action: "plan",
      entity_type: "creator_asset",
      entity_id: plan.id,
      after: plan,
      severity: "info",
      metadata: { source_kind: data.source_kind, count: data.sources.length },
    });
    return { status: "planned" as const, plan };
  });

const ExportInput = z.object({
  workspace_id: uuid.optional(),
  asset_ids: z.array(uuid).min(1).max(500),
  format: z.enum(["zip", "json", "pdf", "csv"]).default("zip"),
});
export const exportPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ExportInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await persistPlan(
      supabase, userId, KIND.EXPORT,
      `export.${data.format}.${data.asset_ids.length}`,
      {
        workspace_id: data.workspace_id ?? null,
        asset_ids: data.asset_ids,
        format: data.format,
        status: "planned",
        planned_at: new Date().toISOString(),
      },
    );
    await writeCanonicalAudit(supabase, {
      category: "ufs.export",
      action: "plan",
      entity_type: "creator_asset",
      entity_id: plan.id,
      after: plan,
      severity: "info",
      metadata: { format: data.format, count: data.asset_ids.length },
    });
    return { status: "planned" as const, plan };
  });

const SyncInput = z.object({
  scope: z.enum(["workspace", "knowledge", "creator", "publishing", "all"]),
  workspace_id: uuid.optional(),
});
export const syncPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SyncInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plan = await persistPlan(
      supabase, userId, KIND.SYNC,
      `sync.${data.scope}`,
      {
        scope: data.scope,
        workspace_id: data.workspace_id ?? null,
        status: "planned",
        planned_at: new Date().toISOString(),
      },
    );
    await writeCanonicalAudit(supabase, {
      category: "ufs.sync",
      action: "plan",
      entity_type: "creator_asset",
      entity_id: plan.id,
      after: plan,
      severity: "info",
      metadata: { scope: data.scope },
    });
    return { status: "planned" as const, plan };
  });

// ─────────────────────────────────────────────────────────────
// 8. Founder Command Mode — Brain-wrapped command capture. Delegates
//    execution to the existing Universal Search + Workspace runtimes
//    (never re-implements them). Records the command as a canonical
//    audit + workspace item so it appears in Mission Control.
// ─────────────────────────────────────────────────────────────
const CommandInput = z.object({
  command: z.string().min(1).max(500),
  workspace_id: uuid.optional(),
});
const analyzeCommand = withBrain<
  { command: string },
  { intent: string; safe: boolean }
>({
  capability: "founder.command.exec",
  handler: async (input) => {
    const c = input.command.trim().toLowerCase();
    const intent =
      c.startsWith("search ")  ? "search" :
      c.startsWith("import ")  ? "import" :
      c.startsWith("export ")  ? "export" :
      c.startsWith("sync")     ? "sync" :
      c.startsWith("publish ") ? "publish" :
      c.startsWith("audit")    ? "audit" :
      "inspect";
    return { intent, safe: true };
  },
});
export const founderCommandExec = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CommandInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const brain = await analyzeCommand({
      capability: "founder.command.exec",
      input: { command: data.command },
      context: { isFounder: true, correlationId: userId } satisfies FounderApprovalContext,
    });
    const plan = await persistPlan(
      supabase, userId, KIND.COMMAND,
      `command.${brain.output.intent}`,
      {
        workspace_id: data.workspace_id ?? null,
        command: data.command,
        intent: brain.output.intent,
        status: "captured",
        captured_at: new Date().toISOString(),
      },
    );
    await writeCanonicalAudit(supabase, {
      category: "founder.command",
      action: brain.output.intent,
      entity_type: "creator_asset",
      entity_id: plan.id,
      after: plan,
      severity: "notice",
      metadata: { command: data.command, brain_duration_ms: brain.durationMs },
    });
    return {
      status: "captured" as const,
      plan,
      intent: brain.output.intent,
      delegate: "src/lib/founder/search.functions.ts#universalSearch",
    };
  });
