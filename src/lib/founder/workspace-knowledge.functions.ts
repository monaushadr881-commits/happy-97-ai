/**
 * R188 Batch B — Founder Workspace + Knowledge Runtime
 *
 * ONE canonical runtime that wires Workspace (public.workspaces +
 * public.creator_assets as workspace items) and Knowledge
 * (public.knowledge_articles + public.knowledge_references) into the
 * Founder pipeline:
 *
 *   Founder Request
 *      ↓ withBrain — capability="<workspace|knowledge>.<action>"
 *      ↓ Knowledge lookup / Workspace lookup
 *      ↓ Impact analysis
 *      ↓ requestFounderApproval (R158) when policy requires
 *      ↓ writeCanonicalAudit → public.audit_logs
 *      ↓ persist + version bump
 *      ↓ Mission Control visibility (Batch F aggregator)
 *
 * Canonical owners reused — no new tables, no new engines, no V2:
 *   - workspace store:   public.workspaces
 *   - workspace items:   public.creator_assets  (metadata.workspace_id)
 *   - knowledge store:   public.knowledge_articles, public.knowledge_references
 *   - brain:             withBrain (src/lib/founder/with-brain)
 *   - approvals:         public.approvals via request/decideFounderApproval
 *   - audit:             writeCanonicalAudit → public.write_audit
 *   - dashboard:         Founder Mission Control (extends existing panels)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { withBrain } from "@/lib/founder/with-brain";
import type { FounderApprovalContext } from "@/lib/founder/types";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const uuid = z.string().uuid();

// ─────────────────────────────────────────────────────────────
// WORKSPACE — attach creator_assets as workspace items, versioned.
// ─────────────────────────────────────────────────────────────

const AttachInput = z.object({
  workspace_id: uuid,
  asset_id: uuid,
  note: z.string().max(500).optional(),
});
type AttachInput = z.infer<typeof AttachInput>;

interface WorkspaceImpact {
  workspace_items_before: number;
  requires_founder_approval: boolean;
}

const analyzeWorkspaceAttach = withBrain<
  { workspace_id: string; existing_items: number },
  WorkspaceImpact
>({
  capability: "workspace.item.attach",
  handler: async (input) => ({
    workspace_items_before: input.existing_items,
    // Attaching an existing asset to a workspace is a low-impact
    // operation; policy does NOT gate it. Higher-risk workspace ops
    // (deletion, bulk export) will be routed through R158 in later
    // batches without duplicating this runtime.
    requires_founder_approval: false,
  }),
});

/** Attach an existing creator_asset to a workspace. Versions the
 *  workspace_item link inside creator_assets.metadata and audits. */
export const wsAttachToWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AttachInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [wsRes, assetRes, existingCount] = await Promise.all([
      supabase
        .from("workspaces")
        .select("id,company_id,name")
        .eq("id", data.workspace_id)
        .single(),
      supabase
        .from("creator_assets")
        .select("id,name,kind,metadata")
        .eq("id", data.asset_id)
        .single(),
      supabase
        .from("creator_assets")
        .select("id", { count: "exact", head: true })
        .contains("metadata", { workspace_id: data.workspace_id } as never),
    ]);
    if (wsRes.error || !wsRes.data) throw new Error("workspace_not_found");
    if (assetRes.error || !assetRes.data) throw new Error("asset_not_found");
    await adoptToCanonicalPipeline(supabase, { domain: "workspace", module: "item", capability: "attach", user_id: userId, company_id: wsRes.data.company_id, metadata: { workspace_id: data.workspace_id, asset_id: data.asset_id } });

    const brainCtx: FounderApprovalContext = {
      isFounder: true,
      correlationId: userId,
    };
    const brain = await analyzeWorkspaceAttach({
      capability: "workspace.item.attach",
      input: {
        workspace_id: data.workspace_id,
        existing_items: existingCount.count ?? 0,
      },
      context: brainCtx,
    });

    const prevMeta = (assetRes.data.metadata ?? {}) as Record<string, unknown>;
    const prevVersion =
      typeof prevMeta.workspace_link_version === "number"
        ? (prevMeta.workspace_link_version as number)
        : 0;
    const nextMeta = {
      ...prevMeta,
      workspace_id: data.workspace_id,
      workspace_attached_by: userId,
      workspace_attached_at: new Date().toISOString(),
      workspace_link_version: prevVersion + 1,
      workspace_note: data.note ?? prevMeta.workspace_note ?? null,
    };

    const { data: after, error } = await supabase
      .from("creator_assets")
      .update({ metadata: nextMeta as never })
      .eq("id", data.asset_id)
      .select("id,name,kind,metadata")
      .single();
    if (error) throw new Error(`workspace_attach_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "workspace.item",
      action: "attach",
      entity_type: "creator_asset",
      entity_id: data.asset_id,
      company_id: wsRes.data.company_id,
      before: assetRes.data,
      after,
      severity: "info",
      metadata: {
        workspace_id: data.workspace_id,
        workspace_link_version: prevVersion + 1,
        impact: brain.output,
        brain_duration_ms: brain.durationMs,
      },
    });

    return {
      status: "attached" as const,
      workspace_id: data.workspace_id,
      asset_id: data.asset_id,
      workspace_link_version: prevVersion + 1,
    };
  });

/** List workspace items (creator_assets whose metadata is scoped to
 *  the workspace). Read-only, RLS applies. */
export const wsListWorkspaceItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ workspace_id: uuid, limit: z.number().int().min(1).max(200).default(50) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const r = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,model,created_at,metadata")
      .contains("metadata", { workspace_id: data.workspace_id } as never)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (r.error) throw new Error(`workspace_items_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// ─────────────────────────────────────────────────────────────
// KNOWLEDGE — Brain-wrapped lookup, gated publish, versioned links.
// ─────────────────────────────────────────────────────────────

const LookupInput = z.object({
  q: z.string().min(1).max(200),
  scope: z.enum(["all", "public", "company"]).default("all"),
  company_id: uuid.optional(),
  limit: z.number().int().min(1).max(24).default(8),
});
type LookupInput = z.infer<typeof LookupInput>;

interface LookupImpact {
  matches: number;
  public_matches: number;
  company_matches: number;
}

const analyzeKnowledgeLookup = withBrain<LookupInput, LookupImpact>({
  capability: "knowledge.lookup",
  handler: async () => ({ matches: 0, public_matches: 0, company_matches: 0 }),
});

/** Brain-wrapped Knowledge lookup. Returns matched articles + impact. */
export const kbLookup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LookupInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const brainCtx: FounderApprovalContext = {
      isFounder: true,
      correlationId: userId,
    };
    await analyzeKnowledgeLookup({
      capability: "knowledge.lookup",
      input: data,
      context: brainCtx,
    });

    let q = supabase
      .from("knowledge_articles")
      .select("id,slug,title,summary,is_public,company_id,version,updated_at")
      .eq("status", "active")
      .or(`title.ilike.%${data.q}%,summary.ilike.%${data.q}%`)
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (data.scope === "public") q = q.eq("is_public", true);
    else if (data.scope === "company" && data.company_id)
      q = q.eq("company_id", data.company_id);

    const r = await q;
    if (r.error) throw new Error(`knowledge_lookup_failed: ${r.error.message}`);
    const rows = r.data ?? [];
    const publicMatches = rows.filter((x) => x.is_public).length;

    return {
      matches: rows,
      impact: {
        matches: rows.length,
        public_matches: publicMatches,
        company_matches: rows.length - publicMatches,
      } satisfies LookupImpact,
    };
  });

// Gated publish — making an article public requires Founder approval.
const PublishInput = z.object({
  article_id: uuid,
  is_public: z.boolean(),
  reason: z.string().max(2000).optional(),
});
type PublishInput = z.infer<typeof PublishInput>;

interface PublishImpact {
  is_public: boolean;
  currently_public: boolean;
  requires_founder_approval: boolean;
}

const analyzePublish = withBrain<
  { target: PublishInput; currently_public: boolean },
  PublishImpact
>({
  capability: "knowledge.article.publish",
  handler: async (input) => ({
    is_public: input.target.is_public,
    currently_public: input.currently_public,
    // Only going public (or unpublishing a currently-public article)
    // is gated. Company-only status changes go through directly.
    requires_founder_approval:
      input.target.is_public || input.currently_public,
  }),
});

export const kbPublishArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PublishInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: before, error: readErr } = await supabase
      .from("knowledge_articles")
      .select(
        "id,company_id,title,slug,status,is_public,version,updated_at",
      )
      .eq("id", data.article_id)
      .single();
    if (readErr || !before) throw new Error("article_not_found");
    await adoptToCanonicalPipeline(supabase, { domain: "publishing", module: "article", capability: "publish", user_id: userId, company_id: before.company_id ?? "00000000-0000-0000-0000-000000000000", metadata: { article_id: data.article_id, is_public: data.is_public } });

    const brainCtx: FounderApprovalContext = {
      isFounder: true,
      correlationId: userId,
    };
    const brain = await analyzePublish({
      capability: "knowledge.article.publish",
      input: { target: data, currently_public: !!before.is_public },
      context: brainCtx,
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: before.company_id ?? "00000000-0000-0000-0000-000000000000",
          entity_type: "knowledge.article",
          entity_id: before.id,
          title: `${data.is_public ? "Publish" : "Unpublish"} article "${before.title}"`,
          reason: data.reason,
          metadata: {
            source: "knowledge.article.publish",
            payload: data satisfies PublishInput,
            impact: brain.output,
            brain_duration_ms: brain.durationMs,
          },
        },
      });
      return {
        status: "pending_approval" as const,
        approval_id: approval.id,
        approval_status: approval.status,
      };
    }

    const nextVersion = (before.version ?? 1) + 1;
    const { data: after, error } = await supabase
      .from("knowledge_articles")
      .update({
        is_public: data.is_public,
        status: "active",
        version: nextVersion,
        updated_by: userId,
      })
      .eq("id", data.article_id)
      .select("id,company_id,title,slug,status,is_public,version,updated_at")
      .single();
    if (error) throw new Error(`article_publish_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "knowledge.article",
      action: data.is_public ? "publish.public" : "publish.company",
      entity_type: "knowledge_article",
      entity_id: before.id,
      company_id: before.company_id ?? undefined,
      before,
      after,
      severity: "notice",
      metadata: { approval_required: false, impact: brain.output },
    });

    return { status: "applied" as const, article: after };
  });

/** Add a reference link to a knowledge article. Bumps article version
 *  and writes an audit entry. Non-gated (low-impact addition). */
export const kbLinkArticleReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        article_id: uuid,
        label: z.string().min(1).max(240),
        url: z.string().url().optional(),
        position: z.number().int().min(0).default(0),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: art, error: readErr } = await supabase
      .from("knowledge_articles")
      .select("id,company_id,title,version")
      .eq("id", data.article_id)
      .single();
    if (readErr || !art) throw new Error("article_not_found");
    await adoptToCanonicalPipeline(supabase, { domain: "knowledge", module: "reference", capability: "link", user_id: userId, company_id: art.company_id ?? "00000000-0000-0000-0000-000000000000", metadata: { article_id: data.article_id } });

    const { data: ref, error } = await supabase
      .from("knowledge_references")
      .insert({
        article_id: data.article_id,
        label: data.label,
        url: data.url ?? null,
        position: data.position,
      })
      .select("*")
      .single();
    if (error) throw new Error(`reference_insert_failed: ${error.message}`);

    const nextVersion = (art.version ?? 1) + 1;
    await supabase
      .from("knowledge_articles")
      .update({ version: nextVersion, updated_by: userId })
      .eq("id", data.article_id);

    await writeCanonicalAudit(supabase, {
      category: "knowledge.article",
      action: "reference.add",
      entity_type: "knowledge_article",
      entity_id: data.article_id,
      company_id: art.company_id ?? undefined,
      after: ref,
      severity: "info",
      metadata: { reference_id: ref.id, article_version: nextVersion },
    });

    return { status: "linked" as const, reference: ref, article_version: nextVersion };
  });
