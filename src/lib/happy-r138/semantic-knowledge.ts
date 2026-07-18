/**
 * R138 — Universal Semantic Knowledge Intelligence™
 *
 * PURE EXTENSION LAYER. No new runtime, no new tables, no new APIs, no
 * duplicate Search/Brain/Memory/Knowledge/Vector engines.
 *
 * Canonical owners (unchanged):
 *  - Search:     src/services/domain/search.service.ts (searchService)
 *  - Brain:      src/brain/kernel.ts (runBrain via src/lib/brain/engine)
 *  - Memory:     src/lib/memory/intelligence.ts + memory_items
 *  - Files:      src/lib/happy-r119/file-intelligence.ts
 *  - Workspace:  src/services/domain/workspace.service.ts
 *  - Knowledge:  knowledge_articles + services/domain (kb*)
 *
 * This module composes those owners with deterministic resolvers so the
 * Brain retrieval stage can produce a unified, permission-aware, hybrid
 * (keyword + semantic-ready) knowledge plan without any new backend.
 *
 * Vector search is architecture-ready (see planVectorSearch) but stays
 * disabled by default — keyword FTS remains the primary path.
 */

import {
  SEARCH_DOMAINS,
  classifyQuery,
  pickDomains,
  extractTimeWindow,
  type SearchDomain,
  type QueryMode,
  type TimeWindow,
} from "@/lib/happy-r120/search-intelligence";

// ---------- Types ----------

export type KnowledgeSource =
  | "memory"
  | "knowledge"
  | "files"
  | "workspace"
  | "conversation"
  | "entity"
  | "relationship";

export interface SemanticContext {
  workspaceId?: string;
  userId?: string;
  companyId?: string;
  conversationId?: string;
  now?: Date;
  /** if true, planners include vector recall alongside keyword FTS */
  enableVector?: boolean;
  /** current DH/Brain focus topics */
  focusTopics?: string[];
  /** files already in conversation scope */
  scopedFileIds?: string[];
}

export interface HybridSearchPlan {
  q: string;
  mode: QueryMode;
  domains: SearchDomain[];
  time?: { since: Date; label: string };
  keyword: { enabled: true; op: "websearch" | "ilike" };
  vector: { enabled: boolean; topK: number; minScore: number };
  fuse: { keywordWeight: number; vectorWeight: number };
  workspaceId?: string;
}

export interface ResolvedItem {
  source: KnowledgeSource;
  id: string;
  title: string;
  snippet?: string;
  score: number;
  updatedAt?: string;
  permission: "own" | "shared" | "workspace" | "public" | "denied";
  refs?: string[];
}

// ---------- Hybrid Search Planner ----------

const NON_FTS_DOMAINS: SearchDomain[] = ["users", "companies", "brands"];

export function planHybridSearch(q: string, ctx: SemanticContext = {}): HybridSearchPlan {
  const mode = classifyQuery(q);
  const domains = pickDomains(q);
  const time = extractTimeWindow(q, ctx.now);
  const primary = domains[0];
  const op: "websearch" | "ilike" =
    primary && NON_FTS_DOMAINS.includes(primary) ? "ilike" : "websearch";
  const vector = !!ctx.enableVector && (mode === "semantic" || mode === "natural" || mode === "hybrid");
  return {
    q: q.trim(),
    mode,
    domains,
    time,
    keyword: { enabled: true, op },
    vector: { enabled: vector, topK: vector ? 24 : 0, minScore: 0.72 },
    fuse: vector
      ? { keywordWeight: 0.55, vectorWeight: 0.45 }
      : { keywordWeight: 1, vectorWeight: 0 },
    workspaceId: ctx.workspaceId,
  };
}

// ---------- Vector Search (architecture-ready, no runtime) ----------

export interface VectorQueryPlan {
  table: "memory_items" | "knowledge_articles" | "cms_contents" | "kg_entities";
  column: "embedding";
  metric: "cosine";
  topK: number;
  filter: Record<string, unknown>;
  /** deferred until pgvector column + index exist (SEARCH_ARCHITECTURE.md R120) */
  ready: false;
}

export function planVectorSearch(
  domain: SearchDomain,
  ctx: SemanticContext = {},
): VectorQueryPlan | null {
  const map: Partial<Record<SearchDomain, VectorQueryPlan["table"]>> = {
    memory: "memory_items",
    knowledge: "knowledge_articles",
  };
  const table = map[domain];
  if (!table) return null;
  const filter: Record<string, unknown> = {};
  if (ctx.workspaceId) filter.workspace_id = ctx.workspaceId;
  if (ctx.companyId) filter.company_id = ctx.companyId;
  return { table, column: "embedding", metric: "cosine", topK: 24, filter, ready: false };
}

// ---------- Score fusion (Reciprocal Rank Fusion) ----------

export function fuseRanks<T extends { id: string }>(
  keyword: T[],
  vector: T[],
  k = 60,
): T[] {
  const scores = new Map<string, { item: T; score: number }>();
  const push = (list: T[]) => {
    list.forEach((item, i) => {
      const prev = scores.get(item.id);
      const add = 1 / (k + i + 1);
      if (prev) prev.score += add;
      else scores.set(item.id, { item, score: add });
    });
  };
  push(keyword);
  push(vector);
  return [...scores.values()].sort((a, b) => b.score - a.score).map((x) => x.item);
}

// ---------- Resolvers (compose canonical owners, no new runtime) ----------

export interface ResolverInput {
  q: string;
  ctx?: SemanticContext;
  limit?: number;
}

/** Semantic resolver — top-level entry that picks domains + fuses. */
export function resolveSemantic(input: ResolverInput): {
  plan: HybridSearchPlan;
  perDomain: Array<{ domain: SearchDomain; keyword: HybridSearchPlan["keyword"]; vector: VectorQueryPlan | null }>;
} {
  const plan = planHybridSearch(input.q, input.ctx);
  const perDomain = plan.domains.map((d) => ({
    domain: d,
    keyword: plan.keyword,
    vector: plan.vector.enabled ? planVectorSearch(d, input.ctx) : null,
  }));
  return { plan, perDomain };
}

export function resolveKnowledge(input: ResolverInput) {
  const plan = planHybridSearch(input.q, input.ctx);
  return {
    domain: "knowledge" as const,
    q: plan.q,
    mode: plan.mode,
    scope: input.ctx?.companyId ? "company" : "all",
    limit: input.limit ?? 20,
    vector: plan.vector.enabled ? planVectorSearch("knowledge", input.ctx) : null,
  };
}

export function resolveMemory(input: ResolverInput) {
  const plan = planHybridSearch(input.q, input.ctx);
  return {
    domain: "memory" as const,
    q: plan.q,
    time: plan.time,
    tags: input.ctx?.focusTopics ?? [],
    limit: input.limit ?? 25,
    vector: plan.vector.enabled ? planVectorSearch("memory", input.ctx) : null,
  };
}

export function resolveWorkspace(input: ResolverInput) {
  const plan = planHybridSearch(input.q, input.ctx);
  return {
    domain: "workspace" as const,
    q: plan.q,
    scope: { workspaceId: input.ctx?.workspaceId, companyId: input.ctx?.companyId },
    domains: plan.domains.filter((d) =>
      ["projects", "tasks", "files", "folders", "calendar"].includes(d),
    ),
    limit: input.limit ?? 20,
  };
}

export function resolveConversation(input: ResolverInput) {
  return {
    domain: "chats" as const,
    q: input.q.trim(),
    conversationId: input.ctx?.conversationId,
    limit: input.limit ?? 30,
    /** conversations use FTS on message body — no vector by default */
    vector: null,
  };
}

export function resolveFiles(input: ResolverInput) {
  const plan = planHybridSearch(input.q, input.ctx);
  return {
    domain: "files" as const,
    q: plan.q,
    scopedFileIds: input.ctx?.scopedFileIds ?? [],
    ocr: /\b(scan|receipt|slide|deck|pdf|screenshot|whiteboard)\b/i.test(input.q),
    limit: input.limit ?? 20,
    vector: plan.vector.enabled ? planVectorSearch("knowledge", input.ctx) : null,
  };
}

/** Entity resolver — extracts probable entity names to hydrate KG lookups. */
export function resolveEntities(q: string): { names: string[]; kinds: string[] } {
  const names = Array.from(
    q.matchAll(/\b([A-Z][a-zA-Z0-9]{2,})(?:\s+[A-Z][a-zA-Z0-9]+)*\b/g),
  ).map((m) => m[0]);
  const kinds: string[] = [];
  if (/\b(company|companies|org)\b/i.test(q)) kinds.push("company");
  if (/\b(person|people|user|employee)\b/i.test(q)) kinds.push("person");
  if (/\b(project|deal|invoice)\b/i.test(q)) kinds.push("record");
  return { names: Array.from(new Set(names)), kinds };
}

/** Relationship resolver — turns "X related to Y" into a KG edge query. */
export function resolveRelationships(q: string): { from?: string; to?: string; relation?: string } {
  const rel = /\b(related to|linked to|belongs to|owns|reports to|part of)\b/i.exec(q);
  if (!rel) return {};
  const [head, tail] = q.split(rel[0]);
  const grab = (s?: string) => s?.trim().replace(/^["']|["']$/g, "").split(/\s+/).slice(0, 4).join(" ");
  return { from: grab(head), to: grab(tail), relation: rel[1].toLowerCase() };
}

/** Context resolver — assembles the full context bundle for Brain Stage 6. */
export function resolveContext(input: ResolverInput) {
  const plan = planHybridSearch(input.q, input.ctx);
  return {
    plan,
    knowledge: resolveKnowledge(input),
    memory: resolveMemory(input),
    workspace: resolveWorkspace(input),
    conversation: resolveConversation(input),
    files: resolveFiles(input),
    entities: resolveEntities(input.q),
    relationships: resolveRelationships(input.q),
  };
}

// ---------- Brain integration hook ----------

export function resolveForBrain(q: string, ctx: SemanticContext = {}) {
  const bundle = resolveContext({ q, ctx });
  return {
    q: bundle.plan.q,
    mode: bundle.plan.mode,
    domains: bundle.plan.domains,
    hybrid: bundle.plan.vector.enabled,
    sources: {
      memory: true,
      knowledge: true,
      files: (ctx.scopedFileIds?.length ?? 0) > 0 || bundle.plan.domains.includes("files"),
      workspace: !!ctx.workspaceId,
      conversation: !!ctx.conversationId,
    },
    entities: bundle.entities,
    relationships: bundle.relationships,
    workspaceId: ctx.workspaceId,
  };
}

// ---------- Registry helpers ----------

export const R138_RESOLVERS: KnowledgeSource[] = [
  "memory", "knowledge", "files", "workspace", "conversation", "entity", "relationship",
];

export function isSingleOwner(): { ok: true; owners: Record<string, string> } {
  return {
    ok: true,
    owners: {
      search: "src/services/domain/search.service.ts",
      brain: "src/brain/kernel.ts",
      memory: "src/lib/memory/intelligence.ts",
      files: "src/lib/happy-r119/file-intelligence.ts",
      workspace: "src/services/domain/workspace.service.ts",
      knowledge: "knowledge_articles (services/domain)",
      r138: "src/lib/happy-r138/semantic-knowledge.ts",
    },
  };
}

export { SEARCH_DOMAINS };
