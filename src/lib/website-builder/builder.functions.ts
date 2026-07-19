/**
 * R12 — Website Builder Server Functions
 *
 * All server fns are auth-gated. Ownership is enforced at the RLS layer
 * (creator_projects.user_id = auth.uid()) AND re-checked here before any
 * write for defense in depth.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { siteTreeSchema, type SiteTree, type WebsiteProjectKind, PROJECT_KINDS } from "./schema";
import {
  createProject,
  updateProjectTree,
  renameProject,
  duplicateProject,
  archiveProject,
  deleteProject,
  listProjects,
  getProject,
  listVersions,
  rollbackToVersion,
  publishProject,
  unpublishProject,
} from "./engine";
import { generateSiteTree } from "./ai-generator";

type Ctx = { supabase: unknown; userId: string };

async function assertOwns(ctx: Ctx, projectId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.from("creator_projects")
    .select("user_id").eq("id", projectId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("project_not_found");
  if ((data as { user_id: string }).user_id !== ctx.userId) {
    // deno-lint-ignore no-explicit-any
    const sb2: any = ctx.supabase;
    const { data: ops } = await sb2.rpc("is_ops_admin", { _user_id: ctx.userId });
    if (!ops) throw new Error("Forbidden: not project owner");
  }
}

async function assertOpsAdmin(ctx: Ctx) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

/* -------------------------------------------------------------------- */
/* Read                                                                  */
/* -------------------------------------------------------------------- */

export const listWebsiteProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { includeArchived?: boolean }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listProjects(supabaseAdmin, (context as Ctx).userId, { includeArchived: data.includeArchived });
  });

export const getWebsiteProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getProject(supabaseAdmin, data.projectId);
  });

/* -------------------------------------------------------------------- */
/* Mutations                                                             */
/* -------------------------------------------------------------------- */

export const createWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    name: string;
    kind: WebsiteProjectKind;
    description?: string;
    companyId?: string | null;
    initialTree?: SiteTree;
  }) => {
    if (!d?.name?.trim()) throw new Error("name_required");
    if (!PROJECT_KINDS.includes(d.kind)) throw new Error("invalid_kind");
    if (d.initialTree) siteTreeSchema.parse(d.initialTree);
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createWebsiteProject", source: "api", module: "website.createWebsiteProject" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return createProject(supabaseAdmin, {
      userId: (context as Ctx).userId,
      companyId: data.companyId ?? null,
      name: data.name.trim(),
      kind: data.kind,
      description: data.description,
      initialTree: data.initialTree,
      actorId: (context as Ctx).userId,
    });
  });

export const saveWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; tree: SiteTree; snapshotVersion?: boolean }) => {
    siteTreeSchema.parse(d.tree);
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "saveWebsiteProject", source: "api", module: "website.saveWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return updateProjectTree(supabaseAdmin, {
      projectId: data.projectId, tree: data.tree,
      actorId: (context as Ctx).userId, snapshotVersion: data.snapshotVersion,
    });
  });

export const renameWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; name: string; description?: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "renameWebsiteProject", source: "api", module: "website.renameWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return renameProject(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const duplicateWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "duplicateWebsiteProject", source: "api", module: "website.duplicateWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return duplicateProject(supabaseAdmin, { projectId: data.projectId, actorId: (context as Ctx).userId });
  });

export const archiveWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; archived: boolean }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "archiveWebsiteProject", source: "api", module: "website.archiveWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return archiveProject(supabaseAdmin, data.projectId, data.archived);
  });

export const deleteWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "deleteWebsiteProject", source: "api", module: "website.deleteWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return deleteProject(supabaseAdmin, data.projectId);
  });

/* -------------------------------------------------------------------- */
/* Version history                                                       */
/* -------------------------------------------------------------------- */

export const listWebsiteVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listVersions(supabaseAdmin, data.projectId, data.limit);
  });

export const rollbackWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; version: number }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "rollbackWebsiteProject", source: "api", module: "website.rollbackWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return rollbackToVersion(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

/* -------------------------------------------------------------------- */
/* AI generation                                                         */
/* -------------------------------------------------------------------- */

export const generateWebsiteWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    projectId?: string;               // optional — if omitted, creates a new project
    brief: string;
    kind: WebsiteProjectKind;
    projectName: string;
    brand?: { primary?: string; secondary?: string; accent?: string; headingFont?: string; bodyFont?: string; voice?: string };
    model?: string;
  }) => {
    if (!d?.brief?.trim()) throw new Error("brief_required");
    if (!PROJECT_KINDS.includes(d.kind)) throw new Error("invalid_kind");
    if (!d.projectName?.trim()) throw new Error("project_name_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "generateWebsiteWithAI", source: "api", module: "website.generateWebsiteWithAI" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.projectId) await assertOwns(context as Ctx, data.projectId);

    // Log the generation attempt upfront so failures are auditable.
    const { data: gen, error: genErr } = await supabaseAdmin.from("creator_generations").insert({
      user_id: (context as Ctx).userId,
      project_id: data.projectId ?? null,
      studio: "website_builder",
      operation: "generate_site_tree",
      status: "running",
      model: data.model ?? null,
      prompt: data.brief,
      input: { kind: data.kind, projectName: data.projectName, brand: data.brand ?? null } as never,
    }).select("id").single();
    if (genErr) throw new Error(`generation_log_failed: ${genErr.message}`);
    const generationId = gen.id as string;

    try {
      const result = await generateSiteTree({
        brief: data.brief, kind: data.kind, projectName: data.projectName,
        brand: data.brand, model: data.model,
      });

      let projectId = data.projectId;
      if (projectId) {
        await updateProjectTree(supabaseAdmin, {
          projectId, tree: result.tree,
          actorId: (context as Ctx).userId, snapshotVersion: true,
        });
      } else {
        const created = await createProject(supabaseAdmin, {
          userId: (context as Ctx).userId,
          name: data.projectName,
          kind: data.kind,
          initialTree: result.tree,
          actorId: (context as Ctx).userId,
        });
        projectId = created.id;
      }

      await supabaseAdmin.from("creator_generations").update({
        status: "succeeded",
        model: result.model,
        project_id: projectId,
        duration_ms: result.latencyMs,
      }).eq("id", generationId);

      return {
        ok: true as const, projectId, generationId,
        model: result.model, latencyMs: result.latencyMs, usage: result.usage,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown";
      await supabaseAdmin.from("creator_generations").update({
        status: "failed", error: message,
      }).eq("id", generationId);
      throw new Error(`ai_generation_failed: ${message}`);
    }
  });

/* -------------------------------------------------------------------- */
/* Publish / unpublish                                                   */
/* -------------------------------------------------------------------- */

export const publishWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; publishedUrl?: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "publishWebsiteProject", source: "api", module: "website.publishWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return publishProject(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const unpublishWebsiteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "unpublishWebsiteProject", source: "api", module: "website.unpublishWebsiteProject" });
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return unpublishProject(supabaseAdmin, data.projectId, (context as Ctx).userId);
  });

/* -------------------------------------------------------------------- */
/* Founder overview                                                      */
/* -------------------------------------------------------------------- */

export interface BuilderOverview {
  total_projects: number | null;
  by_kind: Array<{ kind: string; count: number }> | null;
  published: number | null;
  drafts: number | null;
  archived: number | null;
  ai_generations_24h: number | null;
  ai_generations_failed_24h: number | null;
  recent_projects: Array<{ id: string; name: string; kind: string; updated_at: string; published: boolean }> | null;
  generated_at: string;
}

export const getWebsiteBuilderOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BuilderOverview> => {
    await assertOpsAdmin(context as Ctx);
    // deno-lint-ignore no-explicit-any
    const sb: any = (context as Ctx).supabase;
    const since24 = new Date(Date.now() - 86_400_000).toISOString();

    const [total, projectRows, gens24, gensFail24, recent] = await Promise.all([
      sb.from("creator_projects").select("id", { count: "exact", head: true }).eq("kind", "website"),
      sb.from("creator_projects").select("kind, archived, metadata").eq("kind", "website"),
      sb.from("creator_generations").select("id", { count: "exact", head: true })
        .eq("studio", "website_builder").gte("created_at", since24),
      sb.from("creator_generations").select("id", { count: "exact", head: true })
        .eq("studio", "website_builder").eq("status", "failed").gte("created_at", since24),
      sb.from("creator_projects")
        .select("id, name, kind, updated_at, metadata")
        .eq("kind", "website").order("updated_at", { ascending: false }).limit(15),
    ]);

    const byKindMap: Record<string, number> = {};
    let published = 0, archived = 0, drafts = 0;
    for (const r of ((projectRows.data ?? []) as Array<{ archived: boolean; metadata: { projectKind?: string; published?: boolean } }>)) {
      const k = r.metadata?.projectKind ?? "custom";
      byKindMap[k] = (byKindMap[k] ?? 0) + 1;
      if (r.archived) archived++;
      else if (r.metadata?.published) published++;
      else drafts++;
    }

    const recentList = ((recent.data ?? []) as Array<{ id: string; name: string; updated_at: string; metadata: { projectKind?: string; published?: boolean } }>).map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.metadata?.projectKind ?? "custom",
      updated_at: r.updated_at,
      published: Boolean(r.metadata?.published),
    }));

    return {
      total_projects: total.error ? null : (total.count ?? 0),
      by_kind: Object.entries(byKindMap).map(([kind, count]) => ({ kind, count })),
      published, drafts, archived,
      ai_generations_24h: gens24.error ? null : (gens24.count ?? 0),
      ai_generations_failed_24h: gensFail24.error ? null : (gensFail24.count ?? 0),
      recent_projects: recent.error ? null : recentList,
      generated_at: new Date().toISOString(),
    };
  });
