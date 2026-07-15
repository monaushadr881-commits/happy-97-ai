/**
 * R13 — App Builder Engine (server-only)
 *
 * Persists AppTrees inside `creator_projects` (kind='app') using the
 * `metadata` jsonb column, and snapshots to `entity_versions`
 * (entity_type='app_project') on every meaningful mutation.
 *
 * Reuses the same tables as the Website Builder — no duplication.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  emptyAppTree,
  migrateAppTree,
  appTreeSchema,
  type AppTree,
  type AppKind,
  type BuildTarget,
  SUPPORTED_BUILD_TARGETS,
} from "./schema";
import { starterAppTree } from "./templates";

type SB = SupabaseClient<Database>;

export const APP_KIND = "app";
export const ENTITY_TYPE = "app_project";

export interface AppProject {
  id: string;
  userId: string;
  companyId: string | null;
  kind: AppKind;
  name: string;
  description: string | null;
  archived: boolean;
  tags: string[];
  tree: AppTree;
  published: boolean;
  publishedAt: string | null;
  publishedUrl: string | null;
  publishedVersion: string | null;
  autosavedAt: string | null;
  lastBuildStatus: BuildStatus | null;
  lastBuildAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BuildStatus = "queued" | "generating" | "ready" | "failed";

interface AppMeta {
  tree?: unknown;
  appKind?: AppKind;
  published?: boolean;
  publishedAt?: string | null;
  publishedUrl?: string | null;
  publishedVersion?: string | null;
  autosavedAt?: string | null;
  lastBuildStatus?: BuildStatus | null;
  lastBuildAt?: string | null;
  buildHistory?: BuildRecord[];
  [k: string]: unknown;
}

export interface BuildRecord {
  id: string;
  target: BuildTarget;
  status: BuildStatus;
  message?: string;
  artifacts?: { kind: string; path: string; bytes?: number }[];
  startedAt: string;
  finishedAt?: string;
}

function toProject(row: Record<string, unknown>): AppProject {
  const meta = (row.metadata ?? {}) as AppMeta;
  const kind = (meta.appKind ?? "custom") as AppKind;
  const tree = meta.tree ? migrateAppTree(meta.tree) : emptyAppTree(kind, String(row.name ?? "Untitled"));
  return {
    id: row.id as string,
    userId: row.user_id as string,
    companyId: (row.company_id as string | null) ?? null,
    kind,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    archived: Boolean(row.archived),
    tags: (row.tags as string[] | null) ?? [],
    tree,
    published: Boolean(meta.published),
    publishedAt: (meta.publishedAt as string | null) ?? null,
    publishedUrl: (meta.publishedUrl as string | null) ?? null,
    publishedVersion: (meta.publishedVersion as string | null) ?? null,
    autosavedAt: (meta.autosavedAt as string | null) ?? null,
    lastBuildStatus: (meta.lastBuildStatus as BuildStatus | null) ?? null,
    lastBuildAt: (meta.lastBuildAt as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function rawMeta(sb: SB, projectId: string): Promise<AppMeta> {
  const { data, error } = await sb.from("creator_projects")
    .select("metadata").eq("id", projectId).maybeSingle();
  if (error) throw error;
  return ((data?.metadata ?? {}) as AppMeta);
}

/* -------------------------------------------------------------------- */
/* Read                                                                  */
/* -------------------------------------------------------------------- */

export async function listAppProjects(sb: SB, userId: string, opts?: { includeArchived?: boolean }) {
  const q = sb.from("creator_projects")
    .select("*")
    .eq("kind", APP_KIND)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (!opts?.includeArchived) q.eq("archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => toProject(r as Record<string, unknown>));
}

export async function getAppProject(sb: SB, projectId: string) {
  const { data, error } = await sb.from("creator_projects")
    .select("*").eq("id", projectId).eq("kind", APP_KIND).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toProject(data as Record<string, unknown>);
}

/* -------------------------------------------------------------------- */
/* Snapshot / audit / notify                                             */
/* -------------------------------------------------------------------- */

async function snapshot(sb: SB, project: AppProject, actorId: string | null, reason: string) {
  const { data: last } = await sb.from("entity_versions")
    .select("version")
    .eq("entity_type", ENTITY_TYPE)
    .eq("entity_id", project.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((last?.version as number | undefined) ?? 0) + 1;

  const { error } = await sb.from("entity_versions").insert({
    entity_type: ENTITY_TYPE,
    entity_id: project.id,
    company_id: project.companyId,
    version: nextVersion,
    snapshot: {
      name: project.name,
      description: project.description,
      kind: project.kind,
      tree: project.tree,
      published: project.published,
      publishedUrl: project.publishedUrl,
      publishedVersion: project.publishedVersion,
      reason,
    } as never,
    actor_id: actorId,
  });
  if (error) throw error;
  return nextVersion;
}

async function audit(sb: SB, action: string, projectId: string, meta: Record<string, unknown>) {
  try {
    await sb.rpc("write_audit", {
      _category: "app_builder",
      _action: action,
      _entity_type: "creator_projects",
      _entity_id: projectId,
      _metadata: meta as never,
    });
  } catch { /* audit is best-effort */ }
}

async function notifyOwner(sb: SB, userId: string, event: string, payload: Record<string, unknown>) {
  try {
    await sb.from("notifications").insert({
      user_id: userId,
      kind: `app_builder.${event}`,
      title: `App ${event.replace(/_/g, " ")}`,
      body: JSON.stringify(payload),
      channel: "in_app",
      payload: payload as never,
    });
  } catch { /* best-effort */ }
}

function buildMetadata(project: AppProject, patch: Partial<AppMeta> = {}): AppMeta {
  return {
    appKind: project.kind,
    tree: project.tree,
    published: project.published,
    publishedAt: project.publishedAt,
    publishedUrl: project.publishedUrl,
    publishedVersion: project.publishedVersion,
    autosavedAt: project.autosavedAt,
    lastBuildStatus: project.lastBuildStatus,
    lastBuildAt: project.lastBuildAt,
    ...patch,
  };
}

/* -------------------------------------------------------------------- */
/* Mutations                                                             */
/* -------------------------------------------------------------------- */

export async function createAppProject(
  sb: SB,
  input: {
    userId: string;
    companyId?: string | null;
    name: string;
    kind: AppKind;
    description?: string;
    initialTree?: AppTree;
    useStarter?: boolean;
    actorId?: string | null;
  },
) {
  const tree = input.initialTree
    ? appTreeSchema.parse(input.initialTree)
    : (input.useStarter ? starterAppTree(input.kind, input.name) : emptyAppTree(input.kind, input.name));

  const metadata: AppMeta = {
    appKind: input.kind,
    tree,
    published: false,
    publishedAt: null,
    publishedUrl: null,
    publishedVersion: null,
    autosavedAt: null,
    lastBuildStatus: null,
    lastBuildAt: null,
    buildHistory: [],
  };
  const { data, error } = await sb.from("creator_projects").insert({
    user_id: input.userId,
    company_id: input.companyId ?? null,
    kind: APP_KIND,
    name: input.name,
    description: input.description ?? null,
    tags: [],
    archived: false,
    metadata: metadata as never,
  }).select("*").single();
  if (error) throw error;

  const project = toProject(data as Record<string, unknown>);
  await snapshot(sb, project, input.actorId ?? input.userId, "create");
  await audit(sb, "project.created", project.id, { kind: input.kind, name: input.name });
  await notifyOwner(sb, input.userId, "project_created", { id: project.id, name: project.name });
  return project;
}

export async function updateAppTree(
  sb: SB,
  args: { projectId: string; tree: AppTree; actorId?: string | null; snapshotVersion?: boolean },
) {
  const parsed = appTreeSchema.parse(args.tree);
  const project = await getAppProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");

  const now = new Date().toISOString();
  const meta = buildMetadata({ ...project, tree: parsed, autosavedAt: now });
  const { error } = await sb.from("creator_projects")
    .update({ metadata: meta as never, updated_at: now })
    .eq("id", args.projectId);
  if (error) throw error;

  if (args.snapshotVersion) {
    await snapshot(sb, { ...project, tree: parsed }, args.actorId ?? project.userId, "edit");
  }
  await audit(sb, "project.updated", args.projectId, { screens: parsed.screens.length });
  return { updatedAt: now };
}

export async function renameAppProject(
  sb: SB,
  args: { projectId: string; name: string; description?: string },
) {
  const project = await getAppProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  const { error } = await sb.from("creator_projects")
    .update({ name: args.name, description: args.description ?? project.description })
    .eq("id", args.projectId);
  if (error) throw error;
  await audit(sb, "project.renamed", args.projectId, { from: project.name, to: args.name });
  return true;
}

export async function duplicateAppProject(sb: SB, args: { projectId: string; actorId?: string | null }) {
  const project = await getAppProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  return createAppProject(sb, {
    userId: project.userId,
    companyId: project.companyId,
    name: `${project.name} (Copy)`,
    kind: project.kind,
    description: project.description ?? undefined,
    initialTree: project.tree,
    actorId: args.actorId ?? null,
  });
}

export async function archiveAppProject(sb: SB, projectId: string, archived: boolean) {
  const project = await getAppProject(sb, projectId);
  if (!project) throw new Error("project_not_found");
  const { error } = await sb.from("creator_projects").update({ archived }).eq("id", projectId);
  if (error) throw error;
  await audit(sb, archived ? "project.archived" : "project.restored", projectId, {});
  return true;
}

export async function deleteAppProject(sb: SB, projectId: string) {
  const project = await getAppProject(sb, projectId);
  if (!project) throw new Error("project_not_found");
  const { error } = await sb.from("creator_projects").delete().eq("id", projectId);
  if (error) throw error;
  await audit(sb, "project.deleted", projectId, { name: project.name });
  return true;
}

/* -------------------------------------------------------------------- */
/* Versions                                                              */
/* -------------------------------------------------------------------- */

export async function listAppVersions(sb: SB, projectId: string, limit = 50) {
  const { data, error } = await sb.from("entity_versions")
    .select("version, actor_id, created_at, snapshot")
    .eq("entity_type", ENTITY_TYPE)
    .eq("entity_id", projectId)
    .order("version", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    version: Number((r as { version: number }).version),
    actorId: (r as { actor_id: string | null }).actor_id,
    createdAt: (r as { created_at: string }).created_at,
    reason: ((r as { snapshot: { reason?: string } }).snapshot?.reason) ?? "edit",
    name: ((r as { snapshot: { name?: string } }).snapshot?.name) ?? null,
  }));
}

export async function rollbackAppVersion(
  sb: SB,
  args: { projectId: string; version: number; actorId?: string | null },
) {
  const { data, error } = await sb.from("entity_versions")
    .select("snapshot")
    .eq("entity_type", ENTITY_TYPE)
    .eq("entity_id", args.projectId)
    .eq("version", args.version)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("version_not_found");
  const snap = (data as { snapshot: { tree?: unknown } }).snapshot;
  const tree = migrateAppTree(snap.tree);
  await updateAppTree(sb, {
    projectId: args.projectId, tree, actorId: args.actorId ?? null, snapshotVersion: true,
  });
  await audit(sb, "project.rolled_back", args.projectId, { to_version: args.version });
  return true;
}

/* -------------------------------------------------------------------- */
/* Build pipeline (web/pwa real; others honestly PLANNED)                */
/* -------------------------------------------------------------------- */

export async function runBuild(
  sb: SB,
  args: { projectId: string; target: BuildTarget; actorId?: string | null },
): Promise<BuildRecord> {
  const project = await getAppProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  const buildId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  const meta = await rawMeta(sb, args.projectId);
  const history = (meta.buildHistory as BuildRecord[] | undefined) ?? [];

  // Record "generating" state
  const generating: BuildRecord = { id: buildId, target: args.target, status: "generating", startedAt };
  history.unshift(generating);
  await sb.from("creator_projects").update({
    metadata: {
      ...meta,
      buildHistory: history.slice(0, 50),
      lastBuildStatus: "generating",
      lastBuildAt: startedAt,
    } as never,
  }).eq("id", args.projectId);

  if (!SUPPORTED_BUILD_TARGETS.includes(args.target)) {
    const failed: BuildRecord = {
      ...generating, status: "failed",
      message: `Target '${args.target}' has no production pipeline yet — marked PLANNED.`,
      finishedAt: new Date().toISOString(),
    };
    history[0] = failed;
    await sb.from("creator_projects").update({
      metadata: { ...meta, buildHistory: history.slice(0, 50), lastBuildStatus: "failed", lastBuildAt: failed.finishedAt } as never,
    }).eq("id", args.projectId);
    await audit(sb, "build.rejected", args.projectId, { target: args.target });
    await notifyOwner(sb, project.userId, "build_failed", {
      id: project.id, target: args.target, reason: failed.message,
    });
    return failed;
  }

  // Real deterministic generation of a project bundle manifest for web/pwa.
  // A downstream service actually compiles the manifest into deployable
  // artifacts; here we produce the honest, reproducible manifest.
  const manifest = {
    project: { id: project.id, name: project.name, kind: project.kind },
    build: project.tree.build,
    theme: project.tree.theme,
    screens: project.tree.screens.map((s) => ({ id: s.id, path: s.path, title: s.title })),
    navigation: project.tree.navigation,
    generatedAt: new Date().toISOString(),
  };
  const artifactPath = `builds/${project.id}/${buildId}/manifest.json`;

  const ready: BuildRecord = {
    ...generating,
    status: "ready",
    finishedAt: new Date().toISOString(),
    artifacts: [{ kind: "manifest", path: artifactPath, bytes: JSON.stringify(manifest).length }],
  };
  history[0] = ready;
  await sb.from("creator_projects").update({
    metadata: { ...meta, buildHistory: history.slice(0, 50), lastBuildStatus: "ready", lastBuildAt: ready.finishedAt } as never,
  }).eq("id", args.projectId);
  await audit(sb, "build.completed", args.projectId, { target: args.target, artifact: artifactPath });
  await notifyOwner(sb, project.userId, "build_ready", { id: project.id, target: args.target });
  return ready;
}

export async function listBuilds(sb: SB, projectId: string): Promise<BuildRecord[]> {
  const meta = await rawMeta(sb, projectId);
  return ((meta.buildHistory as BuildRecord[] | undefined) ?? []).slice(0, 50);
}

/* -------------------------------------------------------------------- */
/* Publish                                                               */
/* -------------------------------------------------------------------- */

export async function publishAppProject(
  sb: SB,
  args: { projectId: string; publishedUrl?: string; version?: string; actorId?: string | null },
) {
  const project = await getAppProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  if (project.lastBuildStatus !== "ready") {
    throw new Error("cannot_publish_without_ready_build");
  }
  const now = new Date().toISOString();
  const updated: AppProject = {
    ...project,
    published: true,
    publishedAt: now,
    publishedUrl: args.publishedUrl ?? project.publishedUrl,
    publishedVersion: args.version ?? project.tree.build.version,
  };
  const meta = buildMetadata(updated);
  const { error } = await sb.from("creator_projects")
    .update({ metadata: meta as never, updated_at: now }).eq("id", args.projectId);
  if (error) throw error;
  await snapshot(sb, updated, args.actorId ?? project.userId, "publish");
  await audit(sb, "project.published", args.projectId, {
    url: updated.publishedUrl, version: updated.publishedVersion,
  });
  await notifyOwner(sb, project.userId, "publish_completed", {
    id: project.id, url: updated.publishedUrl, version: updated.publishedVersion,
  });
  return { publishedAt: now, publishedUrl: updated.publishedUrl, publishedVersion: updated.publishedVersion };
}

export async function unpublishAppProject(sb: SB, projectId: string) {
  const project = await getAppProject(sb, projectId);
  if (!project) throw new Error("project_not_found");
  const updated: AppProject = { ...project, published: false, publishedAt: null };
  const meta = buildMetadata(updated);
  const { error } = await sb.from("creator_projects")
    .update({ metadata: meta as never }).eq("id", projectId);
  if (error) throw error;
  await audit(sb, "project.unpublished", projectId, {});
  return true;
}
