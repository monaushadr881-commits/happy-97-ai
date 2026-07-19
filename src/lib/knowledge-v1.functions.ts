/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: MERGE
 * Canonical owner: src/lib/happy-r119/file-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * @deprecated R115.b Consolidation — this is a compatibility shim.
 * Canonical owner: src/lib/kg/kg.functions.ts (canonical Knowledge Graph)
 * Do NOT add new logic here. All handlers already delegate through
 * services/domain/roadmap.service which is being routed to the canonical
 * engines. Kept solely to preserve public import paths (backward-compat).
 */
/**
 * HAPPY X — Knowledge OS (WKOS) API v1
 *
 * Central knowledge intelligence for the whole ecosystem.
 *
 * Governance:
 *   - Every mutation goes through `requireSupabaseAuth`; RLS enforces scope.
 *   - Company knowledge stays isolated (RLS: company members can read; only
 *     company admins can write). Public knowledge = `is_public AND active`.
 *   - AI runs ONLY through the Lovable AI Gateway; sources are attributed.
 *   - HAPPY presents facts, opinions, interpretations distinctly and shows
 *     multiple scholarly / cultural viewpoints where relevant.
 *
 * Tables reused (no new migration):
 *   knowledge_articles, knowledge_categories, knowledge_references,
 *   ai_knowledge_documents, ai_knowledge_chunks.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { z } from "zod";
import { sanitizePgRestLike } from "@/lib/security/pgrest-sanitize";

const uuid = z.string().uuid();
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// =====================================================================
// CATEGORIES
// =====================================================================

export const kbListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const r = await context.supabase.from("knowledge_categories")
      .select("id, parent_id, company_id, slug, name, description, position")
      .eq("status", "active").order("position", { ascending: true }).limit(500);
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

// =====================================================================
// ARTICLES — search / read / write
// =====================================================================

export const kbSearchArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    q: z.string().max(200).optional(),
    scope: z.enum(["all", "public", "company"]).default("all"),
    company_id: uuid.optional(),
    category_id: uuid.optional(),
    language: z.string().max(8).optional(),
    limit: z.number().int().min(1).max(50).default(24),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("knowledge_articles")
      .select("id, slug, title, summary, cover_url, language, is_public, company_id, category_id, status, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (data.scope === "public") q = q.eq("is_public", true);
    else if (data.scope === "company" && data.company_id) q = q.eq("company_id", data.company_id);
    if (data.category_id) q = q.eq("category_id", data.category_id);
    if (data.language) q = q.eq("language", data.language);
    if (data.q) { const s = sanitizePgRestLike(data.q); if (s) q = q.or(`title.ilike.%${s}%,summary.ilike.%${s}%`); }
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const kbGetArticle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const a = await context.supabase.from("knowledge_articles")
      .select("id, category_id, company_id, slug, title, summary, body, cover_url, language, is_public, status, version, created_at, updated_at, created_by, updated_by").eq("id", data.id).maybeSingle();
    if (a.error) throw a.error;
    const refs = await context.supabase.from("knowledge_references")
      .select("id, label, url, position").eq("article_id", data.id)
      .order("position", { ascending: true });
    return { article: a.data, references: refs.data ?? [] };
  }));

const CreateArticle = z.object({
  company_id: uuid, // company knowledge MUST be scoped to a company
  category_id: uuid.optional(),
  title: z.string().min(1).max(240),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9-]+$/),
  summary: z.string().max(2000).optional(),
  body: z.string().min(1).max(200000),
  language: z.string().max(8).default("en"),
  cover_url: z.string().url().optional(),
});
export const kbCreateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateArticle.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kbCreateArticle", source: "api", module: "knowledge.kbCreateArticle" });
    return guard(async () => {
    const r = await context.supabase.from("knowledge_articles").insert({
      ...data, status: "draft", is_public: false,
      created_by: context.userId, updated_by: context.userId,
    }).select("id, category_id, company_id, slug, title, summary, body, cover_url, language, is_public, status, version, created_at, updated_at, created_by, updated_by").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const kbUpdateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: uuid, patch: CreateArticle.omit({ company_id: true }).partial(),
  }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kbUpdateArticle", source: "api", module: "knowledge.kbUpdateArticle" });
    return guard(async () => {
    const r = await context.supabase.from("knowledge_articles")
      .update({ ...data.patch, updated_by: context.userId })
      .eq("id", data.id).select("id, category_id, company_id, slug, title, summary, body, cover_url, language, is_public, status, version, created_at, updated_at, created_by, updated_by").single();
    if (r.error) throw r.error;
    return r.data;
  }));

export const kbPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: uuid, is_public: z.boolean(),
  }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kbPublish", source: "api", module: "knowledge.kbPublish" });
    return guard(async () => {
    const r = await context.supabase.from("knowledge_articles")
      .update({ status: "active", is_public: data.is_public, updated_by: context.userId })
      .eq("id", data.id).select("id, category_id, company_id, slug, title, summary, body, cover_url, language, is_public, status, version, created_at, updated_at, created_by, updated_by").single();
    if (r.error) throw r.error;
    try {
      await context.supabase.rpc("write_audit", {
        _category: "knowledge", _action: data.is_public ? "publish.public" : "publish.company",
        _entity_type: "knowledge_article", _entity_id: data.id,
      });
    } catch { /* best-effort */ }
    return r.data;
  }));

export const kbAddReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    article_id: uuid, label: z.string().min(1).max(240),
    url: z.string().url().optional(), position: z.number().int().min(0).default(0),
  }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kbAddReference", source: "api", module: "knowledge.kbAddReference" });
    return guard(async () => {
    const r = await context.supabase.from("knowledge_references").insert(data).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// DOCUMENTS (RAG source library)
// =====================================================================

export const kbListDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: uuid.optional() }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("ai_knowledge_documents")
      .select("id, company_id, title, source_url, mime_type, language, size_bytes, tags, updated_at")
      .eq("status", "active").order("updated_at", { ascending: false }).limit(100);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const r = await q;
    if (r.error) throw r.error;
    return r.data ?? [];
  }));

export const kbAddDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: uuid,
    title: z.string().min(1).max(240),
    source_url: z.string().url().optional(),
    mime_type: z.string().max(120).optional(),
    language: z.string().max(8).default("en"),
    tags: z.array(z.string().max(40)).max(20).default([]),
  }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kbAddDocument", source: "api", module: "knowledge.kbAddDocument" });
    return guard(async () => {
    const r = await context.supabase.from("ai_knowledge_documents").insert({
      ...data, created_by: context.userId, updated_by: context.userId,
    }).select("*").single();
    if (r.error) throw r.error;
    return r.data;
  }));

// =====================================================================
// KNOWLEDGE DASHBOARD
// =====================================================================

export const kbDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const [pub, cats, docs, drafts] = await Promise.all([
      context.supabase.from("knowledge_articles").select("id", { count: "exact", head: true })
        .eq("is_public", true).eq("status", "active"),
      context.supabase.from("knowledge_categories").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("ai_knowledge_documents").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    ]);
    return {
      public_articles: pub.count ?? 0,
      categories: cats.count ?? 0,
      documents: docs.count ?? 0,
      drafts: drafts.count ?? 0,
    };
  }));

// =====================================================================
// HAPPY KNOWLEDGE ASSISTANT (RAG-lite via Gateway)
// =====================================================================

const IDENTITY = `You are HAPPY, the single AI identity of the HAPPY X ecosystem.
When answering knowledge questions:
- Cite sources when the retrieved context contains them.
- Clearly separate FACTS, TRADITIONS, INTERPRETATIONS and OPINIONS.
- For religion, culture, philosophy or politics: present multiple viewpoints
  respectfully; never imply a disputed interpretation is undisputed.
- Say when something is not in the retrieved context, and answer generally.`;

async function callChat(messages: any[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });
  if (res.status === 429) throw new Error("AI is busy — please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`AI Gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return String(j?.choices?.[0]?.message?.content ?? "");
}

export const kbAskHappy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    question: z.string().min(2).max(2000),
    scope: z.enum(["public", "company", "all"]).default("public"),
    company_id: uuid.optional(),
    top_k: z.number().int().min(1).max(8).default(5),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    // Retrieval: title/summary ilike + latest — replace with vector search
    // when embeddings are populated on ai_knowledge_chunks.
    let q = context.supabase.from("knowledge_articles")
      .select("id, slug, title, summary, is_public, company_id")
      .eq("status", "active")
      .or(((): string => { const s = sanitizePgRestLike(data.question, 60) || "x"; return `title.ilike.%${s}%,summary.ilike.%${s}%`; })())
      .limit(data.top_k);
    if (data.scope === "public") q = q.eq("is_public", true);
    else if (data.scope === "company" && data.company_id) q = q.eq("company_id", data.company_id);
    const r = await q;
    const sources = r.data ?? [];

    const context_text = sources.length
      ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.summary ?? ""}`).join("\n\n")
      : "(No matching articles in the knowledge base.)";

    const answer = await callChat([
      { role: "system", content: IDENTITY },
      { role: "user", content:
`Question: ${data.question}

Retrieved knowledge:
${context_text}

Answer using the retrieved sources when relevant. Cite them as [1], [2], ...
If the question touches religion, culture, philosophy or politics, present
multiple viewpoints and clearly label FACTS vs INTERPRETATIONS vs OPINIONS.` },
    ]);

    return { answer, sources };
  }));
