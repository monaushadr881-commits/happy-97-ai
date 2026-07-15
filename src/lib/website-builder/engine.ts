/**
 * R12 — Website Builder Engine (server-only)
 *
 * Persists site trees inside `creator_projects` (kind='website') using the
 * `metadata` jsonb column, and snapshots to `entity_versions` on every
 * meaningful mutation for history + rollback.
 *
 * Reuses:
 *   - creator_projects           project rows (RLS: user_id = auth.uid())
 *   - entity_versions            version history (append-only)
 *   - creator_generations        AI generation audit trail
 *   - notifications              in-app alerts
 *   - audit_logs (via write_audit RPC)  security audit
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  emptySiteTree,
  migrateSiteTree,
  siteTreeSchema,
  type SiteTree,
  type WebsiteProjectKind,
} from "./schema";

type SB = SupabaseClient<Database>;

export const WEBSITE_KIND = "website";

export interface WebsiteProject {
  id: string;
  userId: string;
  companyId: string | null;
  kind: WebsiteProjectKind;
  name: string;
  description: string | null;
  archived: boolean;
  tags: string[];
  tree: SiteTree;
  published: boolean;
  publishedAt: string | null;
  publishedUrl: string | null;
  autosavedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMetadata {
  tree?: unknown;
  projectKind?: WebsiteProjectKind;
  published?: boolean;
  publishedAt?: string | null;
  publishedUrl?: string | null;
  autosavedAt?: string | null;
  [k: string]: unknown;
}

function toProject(row: Record<string, unknown>): WebsiteProject {
  const meta = (row.metadata ?? {}) as ProjectMetadata;
  const kind = (meta.projectKind ?? "custom") as WebsiteProjectKind;
  const tree = meta.tree ? migrateSiteTree(meta.tree) : emptySiteTree(String(row.name ?? "Untitled"));
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
    autosavedAt: (meta.autosavedAt as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/* -------------------------------------------------------------------- */
/* Read                                                                  */
/* -------------------------------------------------------------------- */

export async function listProjects(sb: SB, userId: string, opts?: { includeArchived?: boolean }) {
  const q = sb.from("creator_projects")
    .select("*")
    .eq("kind", WEBSITE_KIND)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (!opts?.includeArchived) q.eq("archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => toProject(r as Record<string, unknown>));
}

export async function getProject(sb: SB, projectId: string) {
  const { data, error } = await sb.from("creator_projects")
    .select("*").eq("id", projectId).eq("kind", WEBSITE_KIND).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toProject(data as Record<string, unknown>);
}

/* -------------------------------------------------------------------- */
/* Snapshot / version helpers                                            */
/* -------------------------------------------------------------------- */

async function snapshot(sb: SB, project: WebsiteProject, actorId: string | null, reason: string) {
  // Determine next version number
  const { data: last } = await sb.from("entity_versions")
    .select("version")
    .eq("entity_type", "website_project")
    .eq("entity_id", project.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((last?.version as number | undefined) ?? 0) + 1;

  const { error } = await sb.from("entity_versions").insert({
    entity_type: "website_project",
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
      _category: "website_builder",
      _action: action,
      _entity_type: "creator_projects",
      _entity_id: projectId,
      _metadata: meta as never,
    });
  } catch { /* audit failures never break user actions */ }
}

async function notifyOwner(sb: SB, userId: string, event: string, payload: Record<string, unknown>) {
  try {
    await sb.from("notifications").insert({
      user_id: userId,
      kind: `website_builder.${event}`,
      title: `Website ${event.replace(/_/g, " ")}`,
      body: JSON.stringify(payload),
      channel: "in_app",
      payload: payload as never,
    });
  } catch { /* best-effort */ }
}

function buildMetadata(project: WebsiteProject, patch: Partial<ProjectMetadata> = {}): ProjectMetadata {
  return {
    projectKind: project.kind,
    tree: project.tree,
    published: project.published,
    publishedAt: project.publishedAt,
    publishedUrl: project.publishedUrl,
    autosavedAt: project.autosavedAt,
    ...patch,
  };
}

/* -------------------------------------------------------------------- */
/* Mutations                                                             */
/* -------------------------------------------------------------------- */

export async function createProject(
  sb: SB,
  input: {
    userId: string;
    companyId?: string | null;
    name: string;
    kind: WebsiteProjectKind;
    description?: string;
    initialTree?: SiteTree;
    actorId?: string | null;
  },
) {
  const tree = input.initialTree ? siteTreeSchema.parse(input.initialTree) : emptySiteTree(input.name);
  const metadata: ProjectMetadata = {
    projectKind: input.kind,
    tree,
    published: false,
    publishedAt: null,
    publishedUrl: null,
    autosavedAt: null,
  };
  const { data, error } = await sb.from("creator_projects").insert({
    user_id: input.userId,
    company_id: input.companyId ?? null,
    kind: WEBSITE_KIND,
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

export async function updateProjectTree(
  sb: SB,
  args: { projectId: string; tree: SiteTree; actorId?: string | null; snapshotVersion?: boolean },
) {
  const parsed = siteTreeSchema.parse(args.tree);
  const project = await getProject(sb, args.projectId);
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
  await audit(sb, "project.updated", args.projectId, { pages: parsed.pages.length });
  return { updatedAt: now };
}

export async function renameProject(
  sb: SB,
  args: { projectId: string; name: string; description?: string; actorId?: string | null },
) {
  const project = await getProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  const { error } = await sb.from("creator_projects")
    .update({ name: args.name, description: args.description ?? project.description })
    .eq("id", args.projectId);
  if (error) throw error;
  await audit(sb, "project.renamed", args.projectId, { from: project.name, to: args.name });
  return true;
}

export async function duplicateProject(
  sb: SB,
  args: { projectId: string; actorId?: string | null },
) {
  const project = await getProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  return createProject(sb, {
    userId: project.userId,
    companyId: project.companyId,
    name: `${project.name} (Copy)`,
    kind: project.kind,
    description: project.description ?? undefined,
    initialTree: project.tree,
    actorId: args.actorId ?? null,
  });
}

export async function archiveProject(sb: SB, projectId: string, archived: boolean) {
  const project = await getProject(sb, projectId);
  if (!project) throw new Error("project_not_found");
  const { error } = await sb.from("creator_projects")
    .update({ archived }).eq("id", projectId);
  if (error) throw error;
  await audit(sb, archived ? "project.archived" : "project.restored", projectId, {});
  return true;
}

export async function deleteProject(sb: SB, projectId: string) {
  const project = await getProject(sb, projectId);
  if (!project) throw new Error("project_not_found");
  // Hard delete — history is preserved in entity_versions.
  const { error } = await sb.from("creator_projects").delete().eq("id", projectId);
  if (error) throw error;
  await audit(sb, "project.deleted", projectId, { name: project.name });
  return true;
}

/* -------------------------------------------------------------------- */
/* Version history / rollback                                            */
/* -------------------------------------------------------------------- */

export async function listVersions(sb: SB, projectId: string, limit = 50) {
  const { data, error } = await sb.from("entity_versions")
    .select("version, actor_id, created_at, snapshot")
    .eq("entity_type", "website_project")
    .eq("entity_id", projectId)
    .order("version", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    version: Number((r as { version: number }).version),
    actorId: (r as { actor_id: string | null }).actor_id,
    createdAt: (r as { created_at: string }).created_at,
    reason: (((r as { snapshot: { reason?: string } }).snapshot?.reason) ?? "edit"),
    name: ((r as { snapshot: { name?: string } }).snapshot?.name) ?? null,
  }));
}

export async function rollbackToVersion(
  sb: SB,
  args: { projectId: string; version: number; actorId?: string | null },
) {
  const { data, error } = await sb.from("entity_versions")
    .select("snapshot")
    .eq("entity_type", "website_project")
    .eq("entity_id", args.projectId)
    .eq("version", args.version)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("version_not_found");
  const snap = (data as { snapshot: { tree?: unknown; name?: string; description?: string | null } }).snapshot;
  const tree = migrateSiteTree(snap.tree);
  await updateProjectTree(sb, {
    projectId: args.projectId, tree, actorId: args.actorId ?? null, snapshotVersion: true,
  });
  await audit(sb, "project.rolled_back", args.projectId, { to_version: args.version });
  return true;
}

/* -------------------------------------------------------------------- */
/* Publish / unpublish                                                   */
/* -------------------------------------------------------------------- */

export async function publishProject(
  sb: SB,
  args: { projectId: string; publishedUrl?: string; actorId?: string | null },
) {
  const project = await getProject(sb, args.projectId);
  if (!project) throw new Error("project_not_found");
  const now = new Date().toISOString();
  const updated = {
    ...project, published: true, publishedAt: now,
    publishedUrl: args.publishedUrl ?? project.publishedUrl,
  };
  const meta = buildMetadata(updated);
  const { error } = await sb.from("creator_projects")
    .update({ metadata: meta as never, updated_at: now }).eq("id", args.projectId);
  if (error) throw error;
  await snapshot(sb, updated, args.actorId ?? project.userId, "publish");
  await audit(sb, "project.published", args.projectId, { url: updated.publishedUrl });
  await notifyOwner(sb, project.userId, "deployment_success", {
    id: project.id, url: updated.publishedUrl,
  });
  return { publishedAt: now, publishedUrl: updated.publishedUrl };
}

export async function unpublishProject(sb: SB, projectId: string, actorId?: string | null) {
  const project = await getProject(sb, projectId);
  if (!project) throw new Error("project_not_found");
  const updated = { ...project, published: false, publishedAt: null };
  const meta = buildMetadata(updated);
  const { error } = await sb.from("creator_projects")
    .update({ metadata: meta as never }).eq("id", projectId);
  if (error) throw error;
  await audit(sb, "project.unpublished", projectId, {});
  return true;
}
