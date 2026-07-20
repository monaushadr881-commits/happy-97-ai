/**
 * R191 Batch 13 — AI Knowledge / Universal Search / Document Intelligence / Workspace
 *
 * SINGLE composition surface. Reuses canonical owners only:
 *   - knowledge_articles / knowledge_categories / knowledge_references
 *   - ai_knowledge_documents  (RAG source library)
 *   - creator_assets          (workspace collections + share manifests)
 *   - Lovable AI Gateway      (single AI runtime; no new client)
 *   - adoptToCanonicalPipeline (Brain session, canonical audit)
 *   - requestFounderApproval  (R158)
 *   - writeCanonicalAudit
 *
 * NO new tables, NO new runtime, NO new search engine, NO new dashboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const uuid = z.string().uuid();
const PUBLIC_COMPANY = "00000000-0000-0000-0000-000000000000";
const WORKSPACE_SHARE_APPROVAL_THRESHOLD = 100;

type JsonValue =
  | string | number | boolean | null
  | JsonValue[] | { [k: string]: JsonValue };
type Result = {
  status:
    | "created" | "updated" | "published" | "shared" | "ok"
    | "pending_approval" | "classified" | "summarised" | "extracted"
    | "answered";
  entity_id?: string;
  approval_id?: string;
  data?: JsonValue;
};

// ---------------------------------------------------------------------------
// AI Gateway (reuses existing pattern from knowledge-v1)
// ---------------------------------------------------------------------------
async function aiChat(system: string, user: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("AI is busy — please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`AI Gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return String(j?.choices?.[0]?.message?.content ?? "");
}

// ---------------------------------------------------------------------------
// 1. Article — create (draft; delegates to canonical knowledge_articles)
// ---------------------------------------------------------------------------
export const knArticleCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid,
    category_id: uuid.optional(),
    title: z.string().min(1).max(240),
    slug: z.string().min(1).max(180).regex(/^[a-z0-9-]+$/),
    summary: z.string().max(2000).optional(),
    body: z.string().min(1).max(200000),
    language: z.string().max(8).default("en"),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "article", capability: "create",
      user_id: userId, company_id: data.company_id,
      summary: data.title,
    });
    const { data: row, error } = await supabase.from("knowledge_articles").insert({
      ...data, status: "draft", is_public: false, version: 1,
      created_by: userId, updated_by: userId,
    }).select("id").single();
    if (error) throw new Error(`article_create_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "knowledge.article", action: "create",
      entity_type: "knowledge_article", entity_id: row.id,
      company_id: data.company_id, severity: "notice",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 2. Article — version bump (patch body + version++)
// ---------------------------------------------------------------------------
export const knArticleVersionBump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, article_id: uuid,
    patch: z.object({
      title: z.string().min(1).max(240).optional(),
      summary: z.string().max(2000).optional(),
      body: z.string().min(1).max(200000).optional(),
    }),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "article", capability: "version_bump",
      user_id: userId, company_id: data.company_id,
    });
    const cur = await supabase.from("knowledge_articles")
      .select("version").eq("id", data.article_id).maybeSingle();
    if (cur.error || !cur.data) throw new Error("article_not_found");
    const nextVersion = (cur.data.version ?? 1) + 1;
    const { error } = await supabase.from("knowledge_articles")
      .update({ ...data.patch, version: nextVersion, updated_by: userId })
      .eq("id", data.article_id);
    if (error) throw new Error(`article_version_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "knowledge.article", action: "version_bump",
      entity_type: "knowledge_article", entity_id: data.article_id,
      company_id: data.company_id, severity: "info",
      after: { version: nextVersion },
    });
    return { status: "updated", entity_id: data.article_id, data: { version: nextVersion } };
  });

// ---------------------------------------------------------------------------
// 3. Article — publish (Founder approval for is_public=true)
// ---------------------------------------------------------------------------
export const knArticleApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, article_id: uuid, is_public: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "article", capability: "approve_publish",
      user_id: userId, company_id: data.company_id,
    });
    if (data.is_public) {
      const a = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "knowledge.article_public_publish",
          entity_id: data.article_id,
          title: "Publish knowledge article publicly",
          reason: "public_visibility",
          metadata: { article_id: data.article_id },
        } as never,
      });
      return { status: "pending_approval", approval_id: (a as { id: string }).id };
    }
    const { error } = await supabase.from("knowledge_articles")
      .update({ status: "active", is_public: false, updated_by: userId })
      .eq("id", data.article_id);
    if (error) throw new Error(`article_publish_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "knowledge.article", action: "publish.company",
      entity_type: "knowledge_article", entity_id: data.article_id,
      company_id: data.company_id, severity: "notice",
    });
    return { status: "published", entity_id: data.article_id };
  });

// ---------------------------------------------------------------------------
// 4. Category — upsert (reuses knowledge_categories)
// ---------------------------------------------------------------------------
export const knCategoryUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid.optional(),
    parent_id: uuid.optional(),
    slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(160),
    description: z.string().max(1000).optional(),
    position: z.number().int().min(0).default(0),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "category", capability: "upsert",
      user_id: userId, company_id: data.company_id ?? PUBLIC_COMPANY,
    });
    const { data: row, error } = await supabase.from("knowledge_categories")
      .insert({ ...data, status: "active" }).select("id").single();
    if (error) throw new Error(`category_upsert_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "knowledge.category", action: "upsert",
      entity_type: "knowledge_category", entity_id: row.id,
      company_id: data.company_id ?? PUBLIC_COMPANY, severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 5. Document — classify (AI, writes tags/metadata on ai_knowledge_documents)
// ---------------------------------------------------------------------------
export const knDocClassify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, document_id: uuid, sample_text: z.string().max(8000),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "document", capability: "classify",
      user_id: userId, company_id: data.company_id,
    });
    const raw = await aiChat(
      "You classify documents. Reply ONLY with a JSON object like {\"category\":\"...\",\"tags\":[\"...\"]}",
      `Classify this document:\n\n${data.sample_text}`,
    );
    let parsed: { category?: string; tags?: string[] } = {};
    try { parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/gim, "").trim()); } catch { /* ignore */ }
    const tags = (parsed.tags ?? []).slice(0, 20).map((t) => String(t).slice(0, 40));
    const { error } = await supabase.from("ai_knowledge_documents")
      .update({ tags }).eq("id", data.document_id);
    if (error) throw new Error(`doc_classify_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "knowledge.document", action: "classify",
      entity_type: "ai_knowledge_document", entity_id: data.document_id,
      company_id: data.company_id, severity: "info",
      metadata: { category: parsed.category ?? null, tags },
    });
    return {
      status: "classified", entity_id: data.document_id,
      data: { category: parsed.category ?? null, tags } as JsonValue,
    };
  });

// ---------------------------------------------------------------------------
// 6. Document — summarise (AI, returns summary; no persistence side-effect)
// ---------------------------------------------------------------------------
export const knDocSummarize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, document_id: uuid, text: z.string().min(1).max(20000),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "document", capability: "summarize",
      user_id: userId, company_id: data.company_id,
    });
    const summary = await aiChat(
      "You are HAPPY. Produce a concise, faithful executive summary in <=180 words.",
      data.text,
    );
    await writeCanonicalAudit(supabase, {
      category: "knowledge.document", action: "summarize",
      entity_type: "ai_knowledge_document", entity_id: data.document_id,
      company_id: data.company_id, severity: "info",
      metadata: { length: summary.length },
    });
    return { status: "summarised", entity_id: data.document_id, data: { summary } };
  });

// ---------------------------------------------------------------------------
// 7. Document — extract (AI, entities/keywords)
// ---------------------------------------------------------------------------
export const knDocExtract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, document_id: uuid, text: z.string().min(1).max(20000),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "document", capability: "extract",
      user_id: userId, company_id: data.company_id,
    });
    const raw = await aiChat(
      "Extract structured metadata. Reply ONLY as JSON: {\"entities\":[{\"name\":\"\",\"type\":\"person|org|place|topic\"}],\"keywords\":[\"\"]}",
      data.text,
    );
    let parsed: JsonValue = {};
    try { parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/gim, "").trim()); } catch { /* ignore */ }
    await writeCanonicalAudit(supabase, {
      category: "knowledge.document", action: "extract",
      entity_type: "ai_knowledge_document", entity_id: data.document_id,
      company_id: data.company_id, severity: "info",
    });
    return { status: "extracted", entity_id: data.document_id, data: parsed };
  });

// ---------------------------------------------------------------------------
// 8. AI Q&A — RAG-lite (retrieval over knowledge_articles + Gateway answer)
// ---------------------------------------------------------------------------
export const knQnA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid.optional(),
    question: z.string().min(2).max(2000),
    scope: z.enum(["public", "company", "all"]).default("all"),
    top_k: z.number().int().min(1).max(8).default(5),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "assistant", capability: "qna",
      user_id: userId, company_id: data.company_id ?? PUBLIC_COMPANY,
    });
    let q = supabase.from("knowledge_articles")
      .select("id, title, summary, is_public, company_id")
      .eq("status", "active")
      .or(`title.ilike.%${data.question.slice(0, 60)}%,summary.ilike.%${data.question.slice(0, 60)}%`)
      .limit(data.top_k);
    if (data.scope === "public") q = q.eq("is_public", true);
    else if (data.scope === "company" && data.company_id) q = q.eq("company_id", data.company_id);
    const r = await q;
    const sources = r.data ?? [];
    const ctx = sources.length
      ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.summary ?? ""}`).join("\n\n")
      : "(No retrieved sources.)";
    const answer = await aiChat(
      "You are HAPPY. Cite [1],[2] when using retrieved sources. Label FACTS vs INTERPRETATIONS.",
      `Question: ${data.question}\n\nRetrieved:\n${ctx}`,
    );
    return { status: "answered", data: { answer, sources: sources as unknown as JsonValue } };
  });

// ---------------------------------------------------------------------------
// 9. Workspace Collection — create (creator_assets kind=workspace.collection)
// ---------------------------------------------------------------------------
export const knWorkspaceCollectionCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, name: z.string().min(1).max(160),
    description: z.string().max(1000).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "workspace", module: "collection", capability: "create",
      user_id: userId, company_id: data.company_id,
    });
    const { data: row, error } = await supabase.from("creator_assets").insert({
      user_id: userId, kind: "workspace.collection", name: data.name,
      mime_type: "application/json",
      metadata: {
        company_id: data.company_id,
        description: data.description ?? null,
        items: [],
      } as never,
      tags: ["workspace", "collection"],
    }).select("id").single();
    if (error) throw new Error(`collection_create_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "workspace.collection", action: "create",
      entity_type: "creator_asset", entity_id: row.id,
      company_id: data.company_id, severity: "info",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 10. Workspace Collection — add item (append into metadata.items)
// ---------------------------------------------------------------------------
export const knWorkspaceCollectionAddItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, collection_id: uuid,
    item: z.object({
      kind: z.enum(["article", "document", "asset"]),
      ref_id: uuid, title: z.string().min(1).max(240),
    }),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "workspace", module: "collection", capability: "add_item",
      user_id: userId, company_id: data.company_id,
    });
    const cur = await supabase.from("creator_assets")
      .select("metadata").eq("id", data.collection_id).maybeSingle();
    if (cur.error || !cur.data) throw new Error("collection_not_found");
    const meta = (cur.data.metadata ?? {}) as { items?: unknown[] } & Record<string, unknown>;
    const items = Array.isArray(meta.items) ? meta.items : [];
    items.push({ ...data.item, added_at: new Date().toISOString(), added_by: userId });
    const { error } = await supabase.from("creator_assets")
      .update({ metadata: { ...meta, items } as never })
      .eq("id", data.collection_id);
    if (error) throw new Error(`collection_add_item_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "workspace.collection", action: "add_item",
      entity_type: "creator_asset", entity_id: data.collection_id,
      company_id: data.company_id, severity: "info",
      metadata: { item_kind: data.item.kind, ref_id: data.item.ref_id },
    });
    return { status: "updated", entity_id: data.collection_id, data: { count: items.length } };
  });

// ---------------------------------------------------------------------------
// 11. Workspace — share (Founder-gated for wide audience)
// ---------------------------------------------------------------------------
export const knWorkspaceShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid, collection_id: uuid,
    recipient_count: z.number().int().min(1).max(100000),
    audience: z.enum(["team", "company", "public"]),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "workspace", module: "share", capability: "grant",
      user_id: userId, company_id: data.company_id,
    });
    if (data.audience === "public" || data.recipient_count >= WORKSPACE_SHARE_APPROVAL_THRESHOLD) {
      const a = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "workspace.collection_share",
          entity_id: data.collection_id,
          title: `Share collection with ${data.recipient_count} (${data.audience})`,
          reason: "wide_share_threshold",
          metadata: {
            collection_id: data.collection_id,
            audience: data.audience,
            recipient_count: data.recipient_count,
          },
        } as never,
      });
      return { status: "pending_approval", approval_id: (a as { id: string }).id };
    }
    await writeCanonicalAudit(supabase, {
      category: "workspace.share", action: "grant",
      entity_type: "creator_asset", entity_id: data.collection_id,
      company_id: data.company_id, severity: "notice",
      metadata: { audience: data.audience, recipient_count: data.recipient_count },
    });
    return { status: "shared", entity_id: data.collection_id };
  });

// ---------------------------------------------------------------------------
// 12. Universal Search — cross-domain (articles + documents + assets)
// ---------------------------------------------------------------------------
export const knUniversalSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid.optional(),
    q: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).default(20),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "search", capability: "universal",
      user_id: userId, company_id: data.company_id ?? PUBLIC_COMPANY,
    });
    const like = `%${data.q}%`;
    const [articles, docs, assets] = await Promise.all([
      supabase.from("knowledge_articles")
        .select("id,title,summary,is_public,company_id,updated_at")
        .eq("status", "active")
        .or(`title.ilike.${like},summary.ilike.${like}`).limit(data.limit),
      supabase.from("ai_knowledge_documents")
        .select("id,title,company_id,mime_type,updated_at")
        .eq("status", "active").ilike("title", like).limit(data.limit),
      supabase.from("creator_assets")
        .select("id,name,kind,updated:created_at")
        .ilike("name", like).limit(data.limit),
    ]);
    // Simple ranking: exact-substring earlier + recency.
    const rank = (title: string, updated_at?: string) => {
      const pos = title.toLowerCase().indexOf(data.q.toLowerCase());
      const posScore = pos < 0 ? 0 : 100 - Math.min(pos, 100);
      const recency = updated_at ? Date.parse(updated_at) / 1e10 : 0;
      return posScore + recency;
    };
    const results = [
      ...(articles.data ?? []).map((a) => ({ kind: "article", id: a.id, title: a.title, updated_at: a.updated_at, score: rank(a.title, a.updated_at) })),
      ...(docs.data ?? []).map((d) => ({ kind: "document", id: d.id, title: d.title, updated_at: d.updated_at, score: rank(d.title, d.updated_at) })),
      ...(assets.data ?? []).map((c) => ({ kind: `asset:${c.kind}`, id: c.id, title: c.name, updated_at: c.updated, score: rank(c.name, c.updated) })),
    ].sort((a, b) => b.score - a.score).slice(0, data.limit);
    return { status: "ok", data: results as unknown as JsonValue };
  });

// ---------------------------------------------------------------------------
// 13. Recent Documents (per user + company)
// ---------------------------------------------------------------------------
export const knRecentDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid.optional(), limit: z.number().int().min(1).max(50).default(20),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "document", capability: "recent",
      user_id: userId, company_id: data.company_id ?? PUBLIC_COMPANY,
    });
    let q = supabase.from("ai_knowledge_documents")
      .select("id,title,mime_type,size_bytes,updated_at,tags,company_id")
      .eq("status", "active").order("updated_at", { ascending: false }).limit(data.limit);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const r = await q;
    if (r.error) throw new Error(`recent_documents_failed: ${r.error.message}`);
    return { status: "ok", data: (r.data ?? []) as unknown as JsonValue };
  });

// ---------------------------------------------------------------------------
// 14. Knowledge Analytics (aggregates over canonical tables)
// ---------------------------------------------------------------------------
export const knAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid.optional(),
  }).parse(i ?? {}))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "analytics", capability: "aggregate",
      user_id: userId, company_id: data.company_id ?? PUBLIC_COMPANY,
    });
    const [pubArticles, draftArticles, docs, categories, collections] = await Promise.all([
      supabase.from("knowledge_articles").select("id", { count: "exact", head: true })
        .eq("is_public", true).eq("status", "active"),
      supabase.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("ai_knowledge_documents").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("knowledge_categories").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("creator_assets").select("id", { count: "exact", head: true }).eq("kind", "workspace.collection"),
    ]);
    return {
      status: "ok",
      data: {
        public_articles: pubArticles.count ?? 0,
        draft_articles: draftArticles.count ?? 0,
        documents: docs.count ?? 0,
        categories: categories.count ?? 0,
        workspace_collections: collections.count ?? 0,
      } as JsonValue,
    };
  });

// ---------------------------------------------------------------------------
// 15. Health — Mission Control feed (Knowledge + Search + Workspace + Doc AI)
// ---------------------------------------------------------------------------
export const knHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "knowledge", module: "health", capability: "probe",
      user_id: userId, company_id: PUBLIC_COMPANY,
    });
    const [articles, docs, collections, aiEvents] = await Promise.all([
      supabase.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("ai_knowledge_documents").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("creator_assets").select("id", { count: "exact", head: true }).eq("kind", "workspace.collection"),
      supabase.from("audit_logs").select("id", { count: "exact", head: true }).eq("category", "knowledge.document"),
    ]);
    const status =
      (articles.count ?? 0) > 0 && (docs.count ?? 0) >= 0 ? "healthy" : "degraded";
    return {
      status: "ok",
      data: {
        overall: status,
        knowledge: { articles_active: articles.count ?? 0 },
        search: { indexable_articles: articles.count ?? 0 },
        workspace: { collections: collections.count ?? 0 },
        document_intelligence: { active_documents: docs.count ?? 0, ai_events: aiEvents.count ?? 0 },
        gateway: { key: process.env.LOVABLE_API_KEY ? "configured" : "missing" },
      } as JsonValue,
    };
  });
