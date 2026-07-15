/**
 * R17 — CMS server functions (auth-gated).
 *
 * All calls run under the caller's Supabase session. RLS enforces
 * ownership + company scoping. Public reads (published + public
 * visibility) use a publishable-key server client so shareable URLs
 * work without a signed-in session.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  CONTENT_TYPES, MEDIA_KINDS, WORKFLOW_STATES,
  approve, archiveContent, archiveMedia, compareRevisions, createContent,
  createFolder, deleteContent, deleteMedia, founderOverview, getContent,
  getRevision, listContent, listFolders, listMedia, listRevisions,
  listTranslations, publish, reject, restoreContent, restoreRevision,
  schedule, search, submitForReview, tickScheduledPublish, unpublish,
  updateContent, uploadMedia, upsertTranslation,
  type ContentType, type CreateContentInput, type MediaInput,
  type MediaKind, type UpdateContentInput, type Visibility, type WorkflowState,
} from "./engine";

/* --------------------------- public client ------------------------------ */
function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* --------------------------- validators --------------------------------- */
const asString = (v: unknown, name: string): string => {
  if (typeof v !== "string" || v.length === 0) throw new Error(`cms.invalid.${name}`);
  return v;
};
const asOptString = (v: unknown): string | undefined =>
  v == null ? undefined : (typeof v === "string" ? v : String(v));
const asStrArr = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.map(String).filter(Boolean) : undefined;
const asContentType = (v: unknown): string => {
  const s = asString(v, "type");
  if (!(CONTENT_TYPES as readonly string[]).includes(s)) return s; // allow custom
  return s;
};
const asMediaKind = (v: unknown): MediaKind => {
  const s = asString(v, "kind");
  if (!(MEDIA_KINDS as readonly string[]).includes(s)) throw new Error("cms.invalid.kind");
  return s as MediaKind;
};
const asWorkflow = (v: unknown): WorkflowState | undefined => {
  if (v == null) return undefined;
  const s = String(v);
  if (!(WORKFLOW_STATES as readonly string[]).includes(s)) throw new Error("cms.invalid.status");
  return s as WorkflowState;
};

/* =========================== content CRUD =============================== */

export const cmsCreateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): CreateContentInput => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      type: asContentType(o.type) as ContentType,
      title: asString(o.title, "title"),
      slug: asOptString(o.slug),
      locale: asOptString(o.locale),
      company_id: (o.company_id as string | null | undefined) ?? null,
      excerpt: asOptString(o.excerpt),
      body: (o.body ?? undefined) as CreateContentInput["body"],
      cover_url: (o.cover_url as string | null | undefined) ?? null,
      visibility: (o.visibility as Visibility | undefined) ?? "private",
      categories: asStrArr(o.categories),
      tags: asStrArr(o.tags),
      seo: (o.seo ?? undefined) as CreateContentInput["seo"],
      metadata: (o.metadata ?? undefined) as CreateContentInput["metadata"],
      parent_id: (o.parent_id as string | null | undefined) ?? null,
    };
  })
  .handler(async ({ data, context }) => createContent(context.supabase, context.userId, data));

export const cmsUpdateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    const id = asString(o.id, "id");
    const patch: UpdateContentInput = {
      title: asOptString(o.title),
      slug: asOptString(o.slug),
      excerpt: o.excerpt === null ? null : asOptString(o.excerpt),
      body: (o.body ?? undefined) as UpdateContentInput["body"],
      cover_url: o.cover_url === null ? null : asOptString(o.cover_url),
      visibility: (o.visibility as Visibility | undefined),
      categories: asStrArr(o.categories),
      tags: asStrArr(o.tags),
      seo: (o.seo ?? undefined) as UpdateContentInput["seo"],
      metadata: (o.metadata ?? undefined) as UpdateContentInput["metadata"],
      note: asOptString(o.note),
    };
    return { id, patch };
  })
  .handler(async ({ data, context }) => updateContent(context.supabase, context.userId, data.id, data.patch));

export const cmsGetContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => getContent(context.supabase, data.id));

export const cmsListContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      company_id: (o.company_id as string | null | undefined),
      type: asOptString(o.type),
      status: asWorkflow(o.status),
      author_id: asOptString(o.author_id),
      q: asOptString(o.q),
      tag: asOptString(o.tag),
      category: asOptString(o.category),
      locale: asOptString(o.locale),
      limit: Number(o.limit ?? 20),
      offset: Number(o.offset ?? 0),
    };
  })
  .handler(async ({ data, context }) => listContent(context.supabase, data));

export const cmsSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return { q: asString(o.q, "q"), company_id: (o.company_id as string | null | undefined), limit: Number(o.limit ?? 20) };
  })
  .handler(async ({ data, context }) =>
    search(context.supabase, data.q, { company_id: data.company_id, limit: data.limit }));

export const cmsArchive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => archiveContent(context.supabase, context.userId, data.id));

export const cmsRestore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => restoreContent(context.supabase, context.userId, data.id));

export const cmsDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => deleteContent(context.supabase, context.userId, data.id));

/* =========================== workflow ================================== */

export const cmsSubmitForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return { id: asString(o.id, "id"), note: asOptString(o.note) };
  })
  .handler(async ({ data, context }) => submitForReview(context.supabase, context.userId, data.id, data.note));

export const cmsApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return { id: asString(o.id, "id"), note: asOptString(o.note) };
  })
  .handler(async ({ data, context }) => approve(context.supabase, context.userId, data.id, data.note));

export const cmsReject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return { id: asString(o.id, "id"), note: asString(o.note, "note") };
  })
  .handler(async ({ data, context }) => reject(context.supabase, context.userId, data.id, data.note));

export const cmsSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return { id: asString(o.id, "id"), when: asString(o.when, "when") };
  })
  .handler(async ({ data, context }) => schedule(context.supabase, context.userId, data.id, data.when));

export const cmsPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => publish(context.supabase, context.userId, data.id));

export const cmsUnpublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => unpublish(context.supabase, context.userId, data.id));

/* =========================== revisions ================================= */

export const cmsListRevisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({
    content_id: asString((i as { content_id?: unknown })?.content_id, "content_id"),
    limit: Number((i as { limit?: unknown })?.limit ?? 50),
  }))
  .handler(async ({ data, context }) => listRevisions(context.supabase, data.content_id, data.limit));

export const cmsGetRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({
    content_id: asString((i as { content_id?: unknown })?.content_id, "content_id"),
    version: Number((i as { version?: unknown })?.version),
  }))
  .handler(async ({ data, context }) => getRevision(context.supabase, data.content_id, data.version));

export const cmsCompareRevisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({
    content_id: asString((i as { content_id?: unknown })?.content_id, "content_id"),
    a: Number((i as { a?: unknown })?.a),
    b: Number((i as { b?: unknown })?.b),
  }))
  .handler(async ({ data, context }) => compareRevisions(context.supabase, data.content_id, data.a, data.b));

export const cmsRestoreRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({
    content_id: asString((i as { content_id?: unknown })?.content_id, "content_id"),
    version: Number((i as { version?: unknown })?.version),
  }))
  .handler(async ({ data, context }) => restoreRevision(context.supabase, context.userId, data.content_id, data.version));

/* =========================== media ===================================== */

export const cmsUploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): MediaInput => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      company_id: (o.company_id as string | null | undefined) ?? null,
      folder_id: (o.folder_id as string | null | undefined) ?? null,
      asset_id: (o.asset_id as string | null | undefined) ?? null,
      kind: asMediaKind(o.kind),
      name: asString(o.name, "name"),
      description: asOptString(o.description),
      url: asString(o.url, "url"),
      mime_type: asOptString(o.mime_type),
      size_bytes: o.size_bytes == null ? undefined : Number(o.size_bytes),
      width: o.width == null ? undefined : Number(o.width),
      height: o.height == null ? undefined : Number(o.height),
      duration_seconds: o.duration_seconds == null ? undefined : Number(o.duration_seconds),
      checksum: asOptString(o.checksum),
      tags: asStrArr(o.tags),
      metadata: (o.metadata ?? undefined) as MediaInput["metadata"],
    };
  })
  .handler(async ({ data, context }) => uploadMedia(context.supabase, context.userId, data));

export const cmsListMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      company_id: (o.company_id as string | null | undefined),
      folder_id: (o.folder_id as string | null | undefined),
      kind: o.kind ? asMediaKind(o.kind) : undefined,
      q: asOptString(o.q),
      limit: Number(o.limit ?? 40),
      offset: Number(o.offset ?? 0),
    };
  })
  .handler(async ({ data, context }) => listMedia(context.supabase, data));

export const cmsArchiveMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => archiveMedia(context.supabase, data.id));

export const cmsDeleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: asString((i as { id?: unknown })?.id, "id") }))
  .handler(async ({ data, context }) => deleteMedia(context.supabase, data.id));

/* =========================== folders =================================== */

export const cmsCreateFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      company_id: (o.company_id as string | null | undefined) ?? null,
      parent_id: (o.parent_id as string | null | undefined) ?? null,
      name: asString(o.name, "name"),
    };
  })
  .handler(async ({ data, context }) => createFolder(context.supabase, context.userId, data));

export const cmsListFolders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      company_id: (o.company_id as string | null | undefined),
      parent_id: (o.parent_id as string | null | undefined),
    };
  })
  .handler(async ({ data, context }) => listFolders(context.supabase, data));

/* =========================== translations ============================== */

export const cmsUpsertTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      content_id: asString(o.content_id, "content_id"),
      locale: asString(o.locale, "locale"),
      title: asString(o.title, "title"),
      excerpt: asOptString(o.excerpt),
      body: (o.body ?? undefined) as Parameters<typeof upsertTranslation>[2]["body"],
      status: (o.status as "draft" | "in_progress" | "translated" | "reviewed" | "published" | undefined),
    };
  })
  .handler(async ({ data, context }) => upsertTranslation(context.supabase, context.userId, data));

export const cmsListTranslations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({
    content_id: asString((i as { content_id?: unknown })?.content_id, "content_id"),
  }))
  .handler(async ({ data, context }) => listTranslations(context.supabase, data.content_id));

/* =========================== founder overview ========================== */

export const cmsFounderOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => founderOverview(context.supabase));

/* =========================== public read =============================== */

export const cmsPublicGet = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      type: asString(o.type, "type"),
      slug: asString(o.slug, "slug"),
      locale: asOptString(o.locale) ?? "en",
    };
  })
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb.from("cms_contents").select("*")
      .select("id, company_id, type, slug, locale, title, excerpt, body, cover_url, status, visibility, author_id, editor_id, reviewer_id, publisher_id, parent_id, categories, tags, seo, metadata, version, scheduled_at, published_at, archived_at, review_note, created_at, updated_at").eq("type", data.type).eq("slug", data.slug).eq("locale", data.locale)
      .eq("status", "published").eq("visibility", "public").maybeSingle();
    if (error) throw error;
    return row;
  });

export const cmsPublicList = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => {
    const o = (i ?? {}) as Record<string, unknown>;
    return {
      type: asOptString(o.type),
      tag: asOptString(o.tag),
      category: asOptString(o.category),
      locale: asOptString(o.locale) ?? "en",
      limit: Number(o.limit ?? 20),
      offset: Number(o.offset ?? 0),
    };
  })
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("cms_contents").select("id, type, slug, title, excerpt, cover_url, tags, categories, published_at, updated_at", { count: "exact" })
      .eq("status", "published").eq("visibility", "public").eq("locale", data.locale);
    if (data.type) q = q.eq("type", data.type);
    if (data.tag) q = q.contains("tags", [data.tag]);
    if (data.category) q = q.contains("categories", [data.category]);
    q = q.order("published_at", { ascending: false })
         .range(data.offset, data.offset + data.limit - 1);
    const { data: rows, error, count } = await q;
    if (error) throw error;
    return { rows: rows ?? [], total: count ?? 0 };
  });

/* =========================== scheduler tick ============================ */

export const cmsTickScheduled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => tickScheduledPublish(context.supabase));
