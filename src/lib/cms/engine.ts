/**
 * R17 — Enterprise CMS Runtime (server-only helpers)
 *
 * Unified content platform reused by Website Builder, App Builder,
 * Marketplace, Digital Library, Razvi Academy, AAS PAAS, HP SHUDDH MASALE
 * and the Founder Dashboard.
 *
 * Reuses:
 *   - notifications        (in-app "cms.*" kinds)
 *   - audit_logs           (write_audit RPC on every state transition)
 *   - media_assets         (raw storage; cms_media.asset_id links back)
 *   - has_role / is_company_admin / is_platform_founder (RBAC)
 *
 * All queries run through the caller's authenticated Supabase client so
 * RLS is enforced end-to-end.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export const CONTENT_TYPES = [
  "page","post","article","product","category","tag","author",
  "media","document","faq","policy","announcement","news","event",
  "course","lesson","template","custom",
] as const;
export type ContentType = typeof CONTENT_TYPES[number];

export const WORKFLOW_STATES = [
  "draft","in_review","approved","scheduled","published","archived","rejected",
] as const;
export type WorkflowState = typeof WORKFLOW_STATES[number];

export const MEDIA_KINDS = [
  "image","video","audio","pdf","document","icon","font","logo","archive","other",
] as const;
export type MediaKind = typeof MEDIA_KINDS[number];

export type Visibility = "private" | "company" | "public";

type Json = Database["public"]["Tables"]["cms_contents"]["Row"]["metadata"];

/* ----------------------------- helpers --------------------------------- */

async function audit(sb: SB, action: string, entityId: string, meta: Record<string, unknown>) {
  try {
    await sb.rpc("write_audit", {
      _category: "cms",
      _action: action,
      _entity_type: "cms_contents",
      _entity_id: entityId,
      _metadata: meta as never,
    });
  } catch { /* best-effort */ }
}

async function notify(sb: SB, userId: string, kind: string, title: string, body: string, meta: Record<string, unknown>) {
  try {
    await sb.from("notifications").insert({
      user_id: userId, channel: "in_app", kind, title, body, payload: meta as never,
    });
  } catch { /* best-effort */ }
}

function slugify(input: string): string {
  return input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96) || `item-${Date.now().toString(36)}`;
}

async function loadContent(sb: SB, id: string) {
  const { data, error } = await sb.from("cms_contents").select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("cms.not_found");
  return data;
}

async function snapshot(sb: SB, contentId: string, note: string | null, userId: string) {
  const row = await loadContent(sb, contentId);
  const { error } = await sb.from("cms_revisions").insert({
    content_id: contentId,
    version: row.version,
    snapshot: row as unknown as Json,
    author_id: userId,
    note,
  });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

/* ----------------------------- content CRUD ---------------------------- */

export interface CreateContentInput {
  type: ContentType | string;
  title: string;
  slug?: string;
  locale?: string;
  company_id?: string | null;
  excerpt?: string;
  body?: Json;
  cover_url?: string | null;
  visibility?: Visibility;
  categories?: string[];
  tags?: string[];
  seo?: Json;
  metadata?: Json;
  parent_id?: string | null;
}

export async function createContent(sb: SB, userId: string, input: CreateContentInput) {
  const slug = slugify(input.slug ?? input.title);
  const { data, error } = await sb.from("cms_contents").insert({
    type: input.type,
    slug,
    locale: input.locale ?? "en",
    company_id: input.company_id ?? null,
    title: input.title,
    excerpt: input.excerpt ?? null,
    body: (input.body ?? {}) as never,
    cover_url: input.cover_url ?? null,
    visibility: input.visibility ?? "private",
    author_id: userId,
    editor_id: userId,
    categories: input.categories ?? [],
    tags: input.tags ?? [],
    seo: (input.seo ?? {}) as never,
    metadata: (input.metadata ?? {}) as never,
    parent_id: input.parent_id ?? null,
    status: "draft",
  }).select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").single();
  if (error) throw error;
  await snapshot(sb, data.id, "initial draft", userId);
  await audit(sb, "content.created", data.id, { type: data.type, slug: data.slug });
  await notify(sb, userId, "cms.draft_created", "Draft created", `${data.title} is saved as draft.`, { content_id: data.id });
  return data;
}

export interface UpdateContentInput {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  body?: Json;
  cover_url?: string | null;
  visibility?: Visibility;
  categories?: string[];
  tags?: string[];
  seo?: Json;
  metadata?: Json;
  note?: string | null;
}

export async function updateContent(sb: SB, userId: string, id: string, patch: UpdateContentInput) {
  const before = await loadContent(sb, id);
  await snapshot(sb, id, patch.note ?? "edit", userId);
  const nextVersion = before.version + 1;
  const upd: Record<string, unknown> = { version: nextVersion, editor_id: userId };
  if (patch.title !== undefined) upd.title = patch.title;
  if (patch.slug !== undefined) upd.slug = slugify(patch.slug);
  if (patch.excerpt !== undefined) upd.excerpt = patch.excerpt;
  if (patch.body !== undefined) upd.body = patch.body;
  if (patch.cover_url !== undefined) upd.cover_url = patch.cover_url;
  if (patch.visibility !== undefined) upd.visibility = patch.visibility;
  if (patch.categories !== undefined) upd.categories = patch.categories;
  if (patch.tags !== undefined) upd.tags = patch.tags;
  if (patch.seo !== undefined) upd.seo = patch.seo;
  if (patch.metadata !== undefined) upd.metadata = patch.metadata;
  const { data, error } = await sb.from("cms_contents").update(upd as never).eq("id", id).select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").single();
  if (error) throw error;
  await audit(sb, "content.updated", id, { version: nextVersion });
  await notify(sb, userId, "cms.content_updated", "Content updated", `${data.title} was edited (v${nextVersion}).`, { content_id: id, version: nextVersion });
  return data;
}

export async function getContent(sb: SB, id: string) {
  return loadContent(sb, id);
}

export async function listContent(sb: SB, params: {
  company_id?: string | null;
  type?: string;
  status?: WorkflowState;
  author_id?: string;
  q?: string;
  tag?: string;
  category?: string;
  locale?: string;
  limit?: number;
  offset?: number;
}) {
  let q = sb.from("cms_contents").select("*", { count: "exact" });
  if (params.company_id !== undefined) q = params.company_id === null ? q.is("company_id", null) : q.eq("company_id", params.company_id);
  if (params.type) q = q.eq("type", params.type);
  if (params.status) q = q.eq("status", params.status);
  if (params.author_id) q = q.eq("author_id", params.author_id);
  if (params.locale) q = q.eq("locale", params.locale);
  if (params.tag) q = q.contains("tags", [params.tag]);
  if (params.category) q = q.contains("categories", [params.category]);
  if (params.q && params.q.trim()) q = q.textSearch("search_tsv", params.q.trim(), { config: "simple", type: "websearch" });
  q = q.order("updated_at", { ascending: false })
       .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 20) - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function search(sb: SB, term: string, opts: { company_id?: string | null; limit?: number } = {}) {
  return listContent(sb, { q: term, company_id: opts.company_id, limit: opts.limit ?? 20 });
}

export async function archiveContent(sb: SB, userId: string, id: string) {
  await snapshot(sb, id, "archive", userId);
  const { data, error } = await sb.from("cms_contents")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id).select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").single();
  if (error) throw error;
  await audit(sb, "content.archived", id, {});
  return data;
}

export async function restoreContent(sb: SB, userId: string, id: string) {
  await snapshot(sb, id, "restore", userId);
  const { data, error } = await sb.from("cms_contents")
    .update({ status: "draft", archived_at: null })
    .eq("id", id).select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").single();
  if (error) throw error;
  await audit(sb, "content.restored", id, {});
  return data;
}

export async function deleteContent(sb: SB, userId: string, id: string) {
  const before = await loadContent(sb, id);
  const { error } = await sb.from("cms_contents").delete().eq("id", id);
  if (error) throw error;
  await audit(sb, "content.deleted", id, { type: before.type, slug: before.slug });
  return { deleted: true };
}

/* ----------------------------- workflow -------------------------------- */

async function transition(sb: SB, userId: string, id: string, next: WorkflowState, patch: Record<string, unknown> = {}, note?: string) {
  const before = await loadContent(sb, id);
  await snapshot(sb, id, `->${next}${note ? `: ${note}` : ""}`, userId);
  const { data, error } = await sb.from("cms_contents")
    .update({ status: next, ...patch })
    .eq("id", id).select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").single();
  if (error) throw error;
  await audit(sb, `content.${next}`, id, { from: before.status, to: next });
  return data;
}

export async function submitForReview(sb: SB, userId: string, id: string, note?: string) {
  const row = await transition(sb, userId, id, "in_review", { reviewer_id: null, review_note: note ?? null });
  await notify(sb, userId, "cms.review_requested", "Review requested", `${row.title} is awaiting review.`, { content_id: id });
  return row;
}

export async function approve(sb: SB, userId: string, id: string, note?: string) {
  const row = await transition(sb, userId, id, "approved", { reviewer_id: userId, review_note: note ?? null });
  await notify(sb, row.author_id, "cms.approved", "Content approved", `${row.title} was approved.`, { content_id: id });
  return row;
}

export async function reject(sb: SB, userId: string, id: string, note: string) {
  const row = await transition(sb, userId, id, "rejected", { reviewer_id: userId, review_note: note }, note);
  await notify(sb, row.author_id, "cms.rejected", "Content rejected", `${row.title} was rejected.`, { content_id: id, note });
  return row;
}

export async function schedule(sb: SB, userId: string, id: string, whenIso: string) {
  const t = new Date(whenIso);
  if (Number.isNaN(t.getTime())) throw new Error("cms.invalid_schedule");
  if (t.getTime() <= Date.now()) throw new Error("cms.schedule_in_past");
  const row = await transition(sb, userId, id, "scheduled", { scheduled_at: t.toISOString(), publisher_id: userId });
  await notify(sb, row.author_id, "cms.scheduled", "Publish scheduled", `${row.title} will publish at ${t.toISOString()}.`, { content_id: id, when: t.toISOString() });
  return row;
}

export async function publish(sb: SB, userId: string, id: string) {
  const now = new Date().toISOString();
  const row = await transition(sb, userId, id, "published", { published_at: now, publisher_id: userId, scheduled_at: null });
  await notify(sb, row.author_id, "cms.published", "Content published", `${row.title} is now live.`, { content_id: id });
  return row;
}

export async function unpublish(sb: SB, userId: string, id: string) {
  return transition(sb, userId, id, "draft", { published_at: null });
}

/* ----------------------------- revisions ------------------------------- */

export async function listRevisions(sb: SB, contentId: string, limit = 50) {
  const { data, error } = await sb.from("cms_revisions")
    .select("id, version, note, author_id, created_at")
    .eq("content_id", contentId).order("version", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getRevision(sb: SB, contentId: string, version: number) {
  const { data, error } = await sb.from("cms_revisions").select("*")
    .eq("content_id", contentId).eq("version", version).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("cms.revision_not_found");
  return data;
}

export async function compareRevisions(sb: SB, contentId: string, a: number, b: number) {
  const [ra, rb] = await Promise.all([getRevision(sb, contentId, a), getRevision(sb, contentId, b)]);
  return { a: ra, b: rb };
}

export async function restoreRevision(sb: SB, userId: string, contentId: string, version: number) {
  const rev = await getRevision(sb, contentId, version);
  const snap = rev.snapshot as unknown as Database["public"]["Tables"]["cms_contents"]["Row"];
  await snapshot(sb, contentId, `restore v${version}`, userId);
  const current = await loadContent(sb, contentId);
  const { data, error } = await sb.from("cms_contents").update({
    title: snap.title,
    excerpt: snap.excerpt,
    body: snap.body as never,
    cover_url: snap.cover_url,
    categories: snap.categories,
    tags: snap.tags,
    seo: snap.seo as never,
    metadata: snap.metadata as never,
    version: current.version + 1,
    editor_id: userId,
  }).eq("id", contentId).select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").single();
  if (error) throw error;
  await audit(sb, "content.restored_revision", contentId, { from_version: version });
  return data;
}

/* ----------------------------- media library --------------------------- */

export interface MediaInput {
  company_id?: string | null;
  folder_id?: string | null;
  asset_id?: string | null;
  kind: MediaKind;
  name: string;
  description?: string;
  url: string;
  mime_type?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
  checksum?: string;
  tags?: string[];
  metadata?: Json;
}

export async function uploadMedia(sb: SB, userId: string, input: MediaInput) {
  const { data, error } = await sb.from("cms_media").insert({
    company_id: input.company_id ?? null,
    folder_id: input.folder_id ?? null,
    asset_id: input.asset_id ?? null,
    kind: input.kind,
    name: input.name,
    description: input.description ?? null,
    url: input.url,
    mime_type: input.mime_type ?? null,
    size_bytes: input.size_bytes ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    duration_seconds: input.duration_seconds ?? null,
    checksum: input.checksum ?? null,
    tags: input.tags ?? [],
    metadata: (input.metadata ?? {}) as never,
    created_by: userId,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listMedia(sb: SB, params: {
  company_id?: string | null; folder_id?: string | null; kind?: MediaKind; q?: string;
  limit?: number; offset?: number;
}) {
  let q = sb.from("cms_media").select("*", { count: "exact" }).is("archived_at", null);
  if (params.company_id !== undefined) q = params.company_id === null ? q.is("company_id", null) : q.eq("company_id", params.company_id);
  if (params.folder_id !== undefined) q = params.folder_id === null ? q.is("folder_id", null) : q.eq("folder_id", params.folder_id);
  if (params.kind) q = q.eq("kind", params.kind);
  if (params.q && params.q.trim()) q = q.ilike("name", `%${params.q.trim()}%`);
  q = q.order("updated_at", { ascending: false })
       .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 40) - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function archiveMedia(sb: SB, id: string) {
  const { data, error } = await sb.from("cms_media")
    .update({ archived_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteMedia(sb: SB, id: string) {
  const { error } = await sb.from("cms_media").delete().eq("id", id);
  if (error) throw error;
  return { deleted: true };
}

/* ----------------------------- folders --------------------------------- */

export async function createFolder(sb: SB, userId: string, input: { company_id?: string | null; parent_id?: string | null; name: string }) {
  let parentPath = "";
  if (input.parent_id) {
    const { data: p, error: e } = await sb.from("cms_media_folders").select("path").eq("id", input.parent_id).maybeSingle();
    if (e) throw e;
    if (!p) throw new Error("cms.folder_parent_missing");
    parentPath = p.path;
  }
  const path = `${parentPath}/${slugify(input.name)}`.replace(/^\/+/, "/");
  const { data, error } = await sb.from("cms_media_folders").insert({
    company_id: input.company_id ?? null,
    parent_id: input.parent_id ?? null,
    name: input.name,
    path,
    created_by: userId,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listFolders(sb: SB, params: { company_id?: string | null; parent_id?: string | null }) {
  let q = sb.from("cms_media_folders").select("*");
  if (params.company_id !== undefined) q = params.company_id === null ? q.is("company_id", null) : q.eq("company_id", params.company_id);
  if (params.parent_id !== undefined) q = params.parent_id === null ? q.is("parent_id", null) : q.eq("parent_id", params.parent_id);
  const { data, error } = await q.order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/* ----------------------------- translations ---------------------------- */

export async function upsertTranslation(sb: SB, userId: string, input: {
  content_id: string; locale: string; title: string; excerpt?: string; body?: Json;
  status?: "draft" | "in_progress" | "translated" | "reviewed" | "published";
}) {
  const { data, error } = await sb.from("cms_translations").upsert({
    content_id: input.content_id,
    locale: input.locale,
    title: input.title,
    excerpt: input.excerpt ?? null,
    body: (input.body ?? {}) as never,
    status: input.status ?? "draft",
    translator_id: userId,
  }, { onConflict: "content_id,locale" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listTranslations(sb: SB, contentId: string) {
  const { data, error } = await sb.from("cms_translations").select("*").eq("content_id", contentId);
  if (error) throw error;
  return data ?? [];
}

/* ----------------------------- founder overview ------------------------ */

export async function founderOverview(sb: SB) {
  const one = (n: number | null) => n ?? 0;
  const [totalR, publishedR, draftsR, scheduledR, pendingR, mediaR, topR] = await Promise.all([
    sb.from("cms_contents").select("id", { count: "exact", head: true }),
    sb.from("cms_contents").select("id", { count: "exact", head: true }).eq("status", "published"),
    sb.from("cms_contents").select("id", { count: "exact", head: true }).eq("status", "draft"),
    sb.from("cms_contents").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    sb.from("cms_contents").select("id", { count: "exact", head: true }).eq("status", "in_review"),
    sb.from("cms_media").select("size_bytes", { count: "exact" }).is("archived_at", null).limit(1000),
    sb.from("cms_contents").select("author_id").limit(1000),
  ]);
  const storageBytes = (mediaR.data ?? []).reduce((n, r) => n + (Number(r.size_bytes) || 0), 0);
  const authorCount = new Map<string, number>();
  for (const r of topR.data ?? []) {
    const k = String(r.author_id);
    authorCount.set(k, (authorCount.get(k) ?? 0) + 1);
  }
  const topAuthors = Array.from(authorCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([author_id, count]) => ({ author_id, count }));
  return {
    total: one(totalR.count),
    published: one(publishedR.count),
    drafts: one(draftsR.count),
    scheduled: one(scheduledR.count),
    pending_review: one(pendingR.count),
    media_count: one(mediaR.count),
    storage_bytes: storageBytes,
    top_authors: topAuthors,
    health: totalR.error || mediaR.error ? "degraded" : "healthy",
  };
}

/* ----------------------------- scheduled publish tick ------------------ */

export async function tickScheduledPublish(sb: SB) {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb.from("cms_contents")
    .update({ status: "published", published_at: nowIso, scheduled_at: null })
    .eq("status", "scheduled").lte("scheduled_at", nowIso).select("id, author_id, title");
  if (error) throw error;
  for (const row of data ?? []) {
    await audit(sb, "content.published", row.id, { via: "scheduler" });
    await notify(sb, row.author_id, "cms.published", "Content published", `${row.title} is now live (scheduled).`, { content_id: row.id });
  }
  return { published: data?.length ?? 0 };
}
