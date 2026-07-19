/**
 * R188 Batch C — Universal Search Runtime
 *
 * ONE canonical aggregator over the existing HAPPY runtime — no new
 * engine, no new index, no new storage, no new dashboard. Everything
 * below reads from tables that already own the data:
 *
 *   workspace   → public.workspaces
 *   workspace-items / creator-assets / publishing → public.creator_assets
 *   knowledge   → public.knowledge_articles, public.knowledge_references
 *   business    → public.workflows (automation)
 *   revenue     → public.invoices, public.wallets
 *   approvals   → public.approvals
 *   audit       → public.audit_logs
 *
 * Pipeline:
 *   Founder Request
 *     ↓ withBrain — capability="search.universal"
 *     ↓ per-domain parallel lookups (RLS applies)
 *     ↓ merge + rank
 *     ↓ context builder (source, category, owner, workspace, version,
 *       permission scope, last updated, linked knowledge/assets)
 *     ↓ writeCanonicalAudit (only when the query is Founder-scoped
 *       and returns >0 rows — read-audit trail for Mission Control)
 *     ↓ Mission Control (Batch F aggregator adds search coverage panel)
 *
 * Read-only. Never mutates the source-of-truth tables.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { withBrain } from "@/lib/founder/with-brain";
import type { FounderApprovalContext } from "@/lib/founder/types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SearchSource =
  | "workspace"
  | "workspace_item"
  | "creator_asset"
  | "publishing"
  | "knowledge_article"
  | "knowledge_reference"
  | "business_workflow"
  | "revenue_invoice"
  | "revenue_wallet"
  | "approval"
  | "audit_log";

export interface UniversalSearchResult {
  id: string;
  source: SearchSource;
  category: string;
  title: string;
  snippet: string;
  owner: string | null;
  workspace_id: string | null;
  company_id: string | null;
  version: number | null;
  permission_scope: "public" | "company" | "founder" | "private";
  last_updated: string | null;
  linked_knowledge: string[];
  linked_assets: string[];
  href: string | null;
  score: number;
}

const SearchInput = z.object({
  q: z.string().min(1).max(200),
  sources: z.array(z.string()).default([]),
  limit_per_source: z.number().int().min(1).max(24).default(6),
  audit: z.boolean().default(false),
});
type SearchInputT = z.infer<typeof SearchInput>;

interface SearchImpact {
  query_length: number;
  domains_queried: number;
  requires_founder_approval: boolean;
}

const analyzeSearch = withBrain<SearchInputT, SearchImpact>({
  capability: "search.universal",
  handler: async (input) => ({
    query_length: input.q.length,
    domains_queried: input.sources.length || 11,
    // Read-only pipeline — never gated.
    requires_founder_approval: false,
  }),
});

// ─────────────────────────────────────────────────────────────
// Ranking — deterministic, no external index.
// ─────────────────────────────────────────────────────────────

function scoreRow(q: string, title: string, snippet: string, boost = 0): number {
  const needle = q.toLowerCase();
  const t = (title ?? "").toLowerCase();
  const s = (snippet ?? "").toLowerCase();
  let score = 0;
  if (t === needle) score += 100;
  else if (t.startsWith(needle)) score += 60;
  else if (t.includes(needle)) score += 40;
  if (s.includes(needle)) score += 15;
  return score + boost;
}

function truncate(v: string | null | undefined, n = 160): string {
  if (!v) return "";
  return v.length > n ? `${v.slice(0, n - 1)}…` : v;
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

export const universalSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SearchInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase: sb, userId } = context;
    const like = `%${data.q.replace(/[%_]/g, "")}%`;
    const perSrc = data.limit_per_source;
    const wants = (s: SearchSource) =>
      data.sources.length === 0 || data.sources.includes(s);

    const brainCtx: FounderApprovalContext = {
      isFounder: true,
      correlationId: userId,
    };
    const brain = await analyzeSearch({
      capability: "search.universal",
      input: data,
      context: brainCtx,
    });

    // Parallel lookups. Each query is best-effort; a domain-level
    // failure yields zero rows for that source but never breaks the
    // aggregator.
    const [
      wsRes, wiRes, caRes, pubRes,
      kaRes, krRes,
      wfRes, invRes, walRes,
      apprRes, audRes,
    ] = await Promise.all([
      wants("workspace")
        ? sb.from("workspaces")
            .select("id,name,slug,status,company_id,updated_at,metadata")
            .or(`name.ilike.${like},slug.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("workspace_item")
        ? sb.from("creator_assets")
            .select("id,name,kind,created_at,user_id,metadata")
            .not("metadata->>workspace_id", "is", null)
            .or(`name.ilike.${like},prompt.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("creator_asset")
        ? sb.from("creator_assets")
            .select("id,name,kind,model,prompt,tags,created_at,user_id,metadata")
            .or(`name.ilike.${like},prompt.ilike.${like}`)
            .order("created_at", { ascending: false })
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("publishing")
        ? sb.from("creator_assets")
            .select("id,name,kind,created_at,user_id,metadata")
            .contains("metadata", { source: "founder.publishing.finalize" } as never)
            .or(`name.ilike.${like},prompt.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("knowledge_article")
        ? sb.from("knowledge_articles")
            .select("id,title,slug,summary,is_public,company_id,version,status,updated_at,updated_by")
            .or(`title.ilike.${like},summary.ilike.${like},slug.ilike.${like}`)
            .order("updated_at", { ascending: false })
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("knowledge_reference")
        ? sb.from("knowledge_references")
            .select("id,label,url,article_id,created_at")
            .or(`label.ilike.${like},url.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("business_workflow")
        ? sb.from("workflows")
            .select("id,name,description,status,updated_at,company_id")
            .or(`name.ilike.${like},description.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("revenue_invoice")
        ? sb.from("invoices")
            .select("id,invoice_number,status,total_cents,currency,company_id,updated_at,customer_id")
            .or(`invoice_number.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("revenue_wallet")
        ? sb.from("wallets")
            .select("id,owner_type,owner_id,currency,status,updated_at")
            .or(`owner_id.ilike.${like},currency.ilike.${like}`)
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("approval")
        ? sb.from("approvals")
            .select("id,title,status,entity_type,entity_id,company_id,created_at,requested_by")
            .ilike("title", like)
            .order("created_at", { ascending: false })
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
      wants("audit_log")
        ? sb.from("audit_logs")
            .select("id,category,action,entity_type,entity_id,company_id,actor_id,occurred_at")
            .or(`category.ilike.${like},action.ilike.${like},entity_type.ilike.${like}`)
            .order("occurred_at", { ascending: false })
            .limit(perSrc)
        : Promise.resolve({ data: [], error: null } as never),
    ]);

    const results: UniversalSearchResult[] = [];
    const errors: Record<string, string> = {};
    const rowsBySource: Record<string, number> = {};
    const push = (src: SearchSource, arr: UniversalSearchResult[]) => {
      rowsBySource[src] = arr.length;
      results.push(...arr);
    };
    const errOf = (r: { error: unknown }): string | undefined => {
      const e = r.error as { message?: string } | null;
      return e?.message;
    };

    if (wsRes.error) errors.workspace = errOf(wsRes)!;
    push("workspace", ((wsRes.data ?? []) as Array<{
      id: string; name: string; slug: string; status: string;
      company_id: string | null; updated_at: string; metadata: Record<string, unknown> | null;
    }>).map((r) => ({
      id: r.id, source: "workspace", category: "Workspace",
      title: r.name, snippet: `slug: ${r.slug} · ${r.status}`,
      owner: null, workspace_id: r.id, company_id: r.company_id,
      version: null, permission_scope: "company",
      last_updated: r.updated_at, linked_knowledge: [], linked_assets: [],
      href: `/founder/workspaces/${r.id}`,
      score: scoreRow(data.q, r.name, r.slug, 10),
    })));

    if (wiRes.error) errors.workspace_item = errOf(wiRes)!;
    push("workspace_item", ((wiRes.data ?? []) as Array<{
      id: string; name: string; kind: string; created_at: string;
      user_id: string; metadata: Record<string, unknown> | null;
    }>).map((r) => {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      const wsId = (m.workspace_id as string) ?? null;
      const v = typeof m.workspace_link_version === "number" ? (m.workspace_link_version as number) : 1;
      return {
        id: r.id, source: "workspace_item", category: `Workspace · ${r.kind}`,
        title: r.name, snippet: `linked · v${v}`,
        owner: r.user_id, workspace_id: wsId, company_id: null,
        version: v, permission_scope: "company",
        last_updated: r.created_at, linked_knowledge: [], linked_assets: [r.id],
        href: wsId ? `/founder/workspaces/${wsId}` : null,
        score: scoreRow(data.q, r.name, r.kind, 5),
      };
    }));

    if (caRes.error) errors.creator_asset = errOf(caRes)!;
    push("creator_asset", ((caRes.data ?? []) as Array<{
      id: string; name: string; kind: string; model: string | null;
      prompt: string | null; tags: string[] | null; created_at: string;
      user_id: string; metadata: Record<string, unknown> | null;
    }>).map((r) => {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      const src = (m.source as string) ?? "";
      const scope: UniversalSearchResult["permission_scope"] =
        src.startsWith("founder.") ? "founder" : "company";
      return {
        id: r.id, source: "creator_asset",
        category: `Creator · ${r.kind}`,
        title: r.name,
        snippet: truncate(r.prompt ?? r.model ?? (r.tags ?? []).join(", ")),
        owner: r.user_id,
        workspace_id: (m.workspace_id as string) ?? null,
        company_id: null, version: null,
        permission_scope: scope,
        last_updated: r.created_at, linked_knowledge: [], linked_assets: [r.id],
        href: null,
        score: scoreRow(data.q, r.name, r.prompt ?? "", 0),
      };
    }));

    if (pubRes.error) errors.publishing = errOf(pubRes)!;
    push("publishing", ((pubRes.data ?? []) as Array<{
      id: string; name: string; kind: string; created_at: string;
      user_id: string; metadata: Record<string, unknown> | null;
    }>).map((r) => ({
      id: r.id, source: "publishing", category: "Publishing package",
      title: r.name, snippet: `${r.kind}`,
      owner: r.user_id, workspace_id: null, company_id: null,
      version: null, permission_scope: "founder",
      last_updated: r.created_at, linked_knowledge: [], linked_assets: [r.id],
      href: null, score: scoreRow(data.q, r.name, r.kind, 8),
    })));

    if (kaRes.error) errors.knowledge_article = errOf(kaRes)!;
    push("knowledge_article", ((kaRes.data ?? []) as Array<{
      id: string; title: string; slug: string; summary: string | null;
      is_public: boolean; company_id: string | null; version: number;
      status: string; updated_at: string; updated_by: string | null;
    }>).map((r) => ({
      id: r.id, source: "knowledge_article", category: "Knowledge · article",
      title: r.title, snippet: truncate(r.summary),
      owner: r.updated_by, workspace_id: null, company_id: r.company_id,
      version: r.version ?? 1,
      permission_scope: r.is_public ? "public" : "company",
      last_updated: r.updated_at,
      linked_knowledge: [r.id], linked_assets: [],
      href: `/knowledge/${r.slug}`,
      score: scoreRow(data.q, r.title, r.summary ?? "", 12),
    })));

    if (krRes.error) errors.knowledge_reference = errOf(krRes)!;
    push("knowledge_reference", ((krRes.data ?? []) as Array<{
      id: string; label: string; url: string | null;
      article_id: string; created_at: string;
    }>).map((r) => ({
      id: r.id, source: "knowledge_reference", category: "Knowledge · reference",
      title: r.label, snippet: r.url ?? "",
      owner: null, workspace_id: null, company_id: null,
      version: null, permission_scope: "company",
      last_updated: r.created_at, linked_knowledge: [r.article_id], linked_assets: [],
      href: null, score: scoreRow(data.q, r.label, r.url ?? "", 2),
    })));

    if (wfRes.error) errors.business_workflow = errOf(wfRes)!;
    push("business_workflow", ((wfRes.data ?? []) as Array<{
      id: string; name: string; description: string | null;
      status: string; updated_at: string; company_id: string | null;
    }>).map((r) => ({
      id: r.id, source: "business_workflow",
      category: "Business · automation",
      title: r.name, snippet: truncate(r.description ?? r.status),
      owner: null, workspace_id: null, company_id: r.company_id,
      version: null, permission_scope: "company",
      last_updated: r.updated_at, linked_knowledge: [], linked_assets: [],
      href: `/founder`, score: scoreRow(data.q, r.name, r.description ?? "", 4),
    })));

    if (invRes.error) errors.revenue_invoice = errOf(invRes)!;
    push("revenue_invoice", ((invRes.data ?? []) as Array<{
      id: string; invoice_number: string; status: string;
      total_cents: number | null; currency: string | null;
      company_id: string | null; updated_at: string; customer_id: string | null;
    }>).map((r) => ({
      id: r.id, source: "revenue_invoice",
      category: "Revenue · invoice",
      title: r.invoice_number,
      snippet: `${r.status} · ${(r.total_cents ?? 0) / 100} ${r.currency ?? ""}`,
      owner: r.customer_id, workspace_id: null, company_id: r.company_id,
      version: null, permission_scope: "company",
      last_updated: r.updated_at, linked_knowledge: [], linked_assets: [],
      href: null, score: scoreRow(data.q, r.invoice_number, r.status, 6),
    })));

    if (walRes.error) errors.revenue_wallet = errOf(walRes)!;
    push("revenue_wallet", ((walRes.data ?? []) as Array<{
      id: string; owner_type: string; owner_id: string;
      currency: string; status: string; updated_at: string;
    }>).map((r) => ({
      id: r.id, source: "revenue_wallet",
      category: "Revenue · wallet",
      title: `${r.owner_type}:${r.owner_id.slice(0, 8)}`,
      snippet: `${r.currency} · ${r.status}`,
      owner: r.owner_id, workspace_id: null, company_id: null,
      version: null, permission_scope: "company",
      last_updated: r.updated_at, linked_knowledge: [], linked_assets: [],
      href: null, score: scoreRow(data.q, r.owner_id, r.currency, 1),
    })));

    if (apprRes.error) errors.approval = errOf(apprRes)!;
    push("approval", ((apprRes.data ?? []) as Array<{
      id: string; title: string; status: string;
      entity_type: string; entity_id: string | null;
      company_id: string | null; created_at: string; requested_by: string | null;
    }>).map((r) => ({
      id: r.id, source: "approval",
      category: `Approval · ${r.entity_type}`,
      title: r.title, snippet: r.status,
      owner: r.requested_by, workspace_id: null, company_id: r.company_id,
      version: null,
      permission_scope: r.status === "pending" ? "founder" : "company",
      last_updated: r.created_at, linked_knowledge: [],
      linked_assets: r.entity_id ? [r.entity_id] : [],
      href: `/founder`,
      score: scoreRow(data.q, r.title, r.status, 6),
    })));

    if (audRes.error) errors.audit_log = errOf(audRes)!;
    push("audit_log", ((audRes.data ?? []) as Array<{
      id: string; category: string; action: string;
      entity_type: string; entity_id: string | null;
      company_id: string | null; actor_id: string | null; occurred_at: string;
    }>).map((r) => ({
      id: r.id, source: "audit_log",
      category: `Audit · ${r.category}`,
      title: `${r.category}.${r.action}`,
      snippet: `${r.entity_type}${r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}`,
      owner: r.actor_id, workspace_id: null, company_id: r.company_id,
      version: null, permission_scope: "founder",
      last_updated: r.occurred_at, linked_knowledge: [],
      linked_assets: r.entity_id ? [r.entity_id] : [],
      href: `/founder`,
      score: scoreRow(data.q, `${r.category}.${r.action}`, r.entity_type, 2),
    })));

    // Rank
    results.sort((a, b) =>
      b.score - a.score ||
      (b.last_updated ?? "").localeCompare(a.last_updated ?? ""),
    );

    // Read-audit (opt-in) — only when caller requests a durable trail.
    if (data.audit && results.length > 0) {
      await writeCanonicalAudit(sb, {
        category: "search.universal",
        action: "query",
        entity_type: "search",
        severity: "info",
        metadata: {
          q: data.q,
          sources_requested: data.sources,
          results_total: results.length,
          rows_by_source: rowsBySource,
          brain_duration_ms: brain.durationMs,
        },
      });
    }

    return {
      query: data.q,
      total: results.length,
      results,
      rows_by_source: rowsBySource,
      errors,
      impact: brain.output,
    };
  });
