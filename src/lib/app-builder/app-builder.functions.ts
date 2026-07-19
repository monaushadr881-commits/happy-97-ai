/**
 * R13 — Universal App Builder Server Functions
 *
 * All functions are auth-gated via requireSupabaseAuth. Ownership is enforced
 * at the RLS layer (creator_projects.user_id = auth.uid()) and re-checked
 * here for defense in depth. Ops-admins can view/manage any project.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  appTreeSchema,
  APP_KINDS,
  BUILD_TARGETS,
  SUPPORTED_BUILD_TARGETS,
  type AppKind,
  type AppTree,
  type BuildTarget,
} from "./schema";
import {
  APP_KIND,
  createAppProject,
  updateAppTree,
  renameAppProject,
  duplicateAppProject,
  archiveAppProject,
  deleteAppProject,
  listAppProjects,
  getAppProject,
  listAppVersions,
  rollbackAppVersion,
  publishAppProject,
  unpublishAppProject,
  runBuild,
  listBuilds,
} from "./engine";
import { generateAppTree } from "./ai-generator";

type Ctx = { supabase: unknown; userId: string };

async function assertOwns(ctx: Ctx, projectId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = ctx.supabase;
  const { data, error } = await sb.from("creator_projects")
    .select("user_id, kind").eq("id", projectId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("project_not_found");
  if ((data as { kind: string }).kind !== APP_KIND) throw new Error("not_an_app_project");
  if ((data as { user_id: string }).user_id !== ctx.userId) {
    const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: ctx.userId });
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

export const listApps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { includeArchived?: boolean }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listAppProjects(supabaseAdmin, (context as Ctx).userId, { includeArchived: data.includeArchived });
  });

export const getApp = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getAppProject(supabaseAdmin, data.projectId);
  });

export const listAppVersionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listAppVersions(supabaseAdmin, data.projectId, data.limit);
  });

export const listAppBuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return listBuilds(supabaseAdmin, data.projectId);
  });

/* -------------------------------------------------------------------- */
/* Create / Edit                                                         */
/* -------------------------------------------------------------------- */

export const createApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    name: string;
    kind: AppKind;
    description?: string;
    companyId?: string | null;
    useStarter?: boolean;
    initialTree?: AppTree;
  }) => {
    if (!d?.name?.trim()) throw new Error("name_required");
    if (!APP_KINDS.includes(d.kind)) throw new Error("invalid_kind");
    if (d.initialTree) appTreeSchema.parse(d.initialTree);
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return createAppProject(supabaseAdmin, {
      userId: (context as Ctx).userId,
      companyId: data.companyId ?? null,
      name: data.name.trim(),
      kind: data.kind,
      description: data.description,
      initialTree: data.initialTree,
      useStarter: data.useStarter ?? true,
      actorId: (context as Ctx).userId,
    });
  });

export const saveApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; tree: AppTree; snapshotVersion?: boolean }) => {
    appTreeSchema.parse(d.tree);
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return updateAppTree(supabaseAdmin, {
      projectId: data.projectId, tree: data.tree,
      actorId: (context as Ctx).userId, snapshotVersion: data.snapshotVersion,
    });
  });

export const renameApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; name: string; description?: string }) => {
    if (!d?.name?.trim()) throw new Error("name_required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return renameAppProject(supabaseAdmin, data);
  });

export const duplicateApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return duplicateAppProject(supabaseAdmin, { projectId: data.projectId, actorId: (context as Ctx).userId });
  });

export const archiveApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; archived: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return archiveAppProject(supabaseAdmin, data.projectId, data.archived);
  });

export const deleteApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `deleteApp ${data.projectId}`, source: "api", module: "app-builder.delete" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return deleteAppProject(supabaseAdmin, data.projectId);
  });

export const rollbackApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; version: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { withBrain } = await import("@/lib/founder/enforce");
    await withBrain(
      { supabase: (context as Ctx).supabase as never, userId: (context as Ctx).userId, companyId: null },
      { input: `rollbackApp ${data.projectId} v${data.version}`, source: "api", module: "app-builder.rollback" },
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return rollbackAppVersion(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

/* -------------------------------------------------------------------- */
/* AI generation                                                         */
/* -------------------------------------------------------------------- */

export const generateAppFromBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    projectId?: string;
    name?: string;
    kind: AppKind;
    brief: string;
    brand?: {
      primary?: string; secondary?: string; accent?: string;
      headingFont?: string; bodyFont?: string; voice?: string;
    };
    targets?: BuildTarget[];
    model?: string;
    saveAs?: "replace" | "new";
  }) => {
    if (!d?.brief?.trim()) throw new Error("brief_required");
    if (!APP_KINDS.includes(d.kind)) throw new Error("invalid_kind");
    if (d.targets) {
      for (const t of d.targets) {
        if (!BUILD_TARGETS.includes(t)) throw new Error(`invalid_target:${t}`);
      }
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Log the generation attempt upfront so failures are auditable.
    const { data: gen, error: genErr } = await supabaseAdmin.from("creator_generations").insert({
      user_id: ctx.userId,
      project_id: data.projectId ?? null,
      studio: "app_builder",
      operation: "generate_app_tree",
      status: "running",
      model: data.model ?? null,
      prompt: data.brief,
      input: {
        appKind: data.kind, brand: data.brand ?? null,
        targets: data.targets ?? null, name: data.name ?? null,
      } as never,
    }).select("id").single();
    if (genErr) throw new Error(`generation_log_failed: ${genErr.message}`);
    const generationId = gen.id as string;

    try {
      const result = await generateAppTree({
        brief: data.brief,
        kind: data.kind,
        projectName: data.name ?? "Untitled App",
        brand: data.brand,
        targets: data.targets,
        model: data.model,
      });

      let projectId = data.projectId;
      if (data.saveAs === "replace" && projectId) {
        await assertOwns(ctx, projectId);
        await updateAppTree(supabaseAdmin, {
          projectId, tree: result.tree, actorId: ctx.userId, snapshotVersion: true,
        });
      } else {
        const project = await createAppProject(supabaseAdmin, {
          userId: ctx.userId,
          name: data.name ?? result.tree.displayName,
          kind: data.kind,
          initialTree: result.tree,
          actorId: ctx.userId,
        });
        projectId = project.id;
      }

      await supabaseAdmin.from("creator_generations").update({
        status: "succeeded",
        model: result.model,
        project_id: projectId,
        duration_ms: result.latencyMs,
      }).eq("id", generationId);

      return {
        ok: true as const, projectId, generationId, tree: result.tree,
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
/* Build & publish                                                       */
/* -------------------------------------------------------------------- */

export const buildApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; target: BuildTarget }) => {
    if (!BUILD_TARGETS.includes(d.target)) throw new Error(`invalid_target:${d.target}`);
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return runBuild(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const publishApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; publishedUrl?: string; version?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return publishAppProject(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const unpublishApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwns(context as Ctx, data.projectId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return unpublishAppProject(supabaseAdmin, data.projectId);
  });

/* -------------------------------------------------------------------- */
/* Founder dashboard overview                                            */
/* -------------------------------------------------------------------- */

export const getAppBuilderOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [projectsResp, generationsResp] = await Promise.all([
      supabaseAdmin.from("creator_projects")
        .select("id, name, kind, archived, metadata, updated_at, user_id")
        .eq("kind", APP_KIND)
        .order("updated_at", { ascending: false })
        .limit(200),
      supabaseAdmin.from("creator_generations")
        .select("id, status, model, duration_ms, created_at")
        .eq("studio", "app_builder")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const projects = (projectsResp.data ?? []) as Array<{
      id: string; name: string; kind: string; archived: boolean;
      metadata: Record<string, unknown> | null; updated_at: string; user_id: string;
    }>;
    const generations = (generationsResp.data ?? []) as Array<{
      status: string; model: string | null; duration_ms: number | null;
    }>;

    let published = 0, drafts = 0, buildReady = 0, buildFailed = 0;
    for (const p of projects) {
      const m = (p.metadata ?? {}) as Record<string, unknown>;
      if (m.published) published++; else drafts++;
      if (m.lastBuildStatus === "ready") buildReady++;
      if (m.lastBuildStatus === "failed") buildFailed++;
    }
    const genCount = generations.length;
    const genOk = generations.filter((g) => g.status === "succeeded").length;
    const genFail = generations.filter((g) => g.status === "failed").length;
    const latencies = generations.map((g) => g.duration_ms ?? 0).filter((n) => n > 0);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    return {
      totalProjects: projects.length,
      drafts,
      published,
      buildReady,
      buildFailed,
      generationCount: genCount,
      generationSuccess: genOk,
      generationFailed: genFail,
      generationAvgLatencyMs: avgLatency,
      supportedBuildTargets: SUPPORTED_BUILD_TARGETS,
      plannedBuildTargets: BUILD_TARGETS.filter((t) => !SUPPORTED_BUILD_TARGETS.includes(t)),
      recent: projects.slice(0, 20).map((p) => {
        const m = (p.metadata ?? {}) as Record<string, unknown>;
        return {
          id: p.id, name: p.name, kind: p.kind, updatedAt: p.updated_at,
          published: Boolean(m.published),
          buildStatus: (m.lastBuildStatus as string | null) ?? null,
        };
      }),
    };
  });
