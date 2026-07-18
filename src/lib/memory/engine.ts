// R28 HAPPY Enterprise Memory Engine — real implementation
// Long-term memory layer: store, retrieve, search, timeline, retention, audit.
// Reuses existing runtimes (RLS + is_company_member + is_workspace_member).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

// R116 perf: mask long select strings from type-level parsing.
const sel = (s: string): string => s;

export type MemoryKind =
  | "conversation" | "workspace" | "project" | "company" | "customer"
  | "builder" | "marketplace" | "crm" | "erp" | "finance"
  | "manufacturing" | "warehouse" | "deployment" | "founder"
  | "personal" | "ai";

export type MemoryScope = "personal" | "workspace" | "company";
export type MemoryAction = "read" | "store" | "update" | "archive" | "forget" | "merge" | "expire" | "search";

export interface MemoryStoreInput {
  kind: MemoryKind;
  scope: MemoryScope;
  title: string;
  body?: string;
  summary?: string;
  tags?: string[];
  company_id?: string | null;
  workspace_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  source?: string | null;
  importance?: 1 | 2 | 3 | 4 | 5;
  sensitivity?: "public" | "normal" | "confidential" | "restricted";
  metadata?: Record<string, unknown>;
  expires_at?: string | null;
  pinned?: boolean;
}

export interface MemoryQuery {
  scope?: MemoryScope;
  kind?: MemoryKind | MemoryKind[];
  company_id?: string | null;
  workspace_id?: string | null;
  tags?: string[];
  entity_type?: string;
  entity_id?: string;
  q?: string;
  since?: string;
  until?: string;
  pinned?: boolean;
  include_archived?: boolean;
  limit?: number;
}

// ---------- audit ----------
async function audit(
  sb: SB,
  actor_id: string,
  action: MemoryAction,
  opts: { memory_id?: string; company_id?: string | null; runtime?: string; reason?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    await sb.from("memory_access_log").insert({
      memory_id: opts.memory_id ?? null,
      company_id: opts.company_id ?? null,
      actor_id,
      action,
      runtime: opts.runtime ?? "memory-engine",
      reason: opts.reason ?? null,
      metadata: (opts.metadata ?? {}) as never,
    } as never);
  } catch {
    /* audit best-effort; never blocks operation */
  }
}

// ---------- store ----------
export async function memoryStore(sb: SB, userId: string, input: MemoryStoreInput) {
  if (!input.title?.trim()) throw new Error("memory.store: title required");
  if (input.scope === "personal" && !userId) throw new Error("memory.store: personal scope requires user");
  if (input.scope === "workspace" && !input.workspace_id) throw new Error("memory.store: workspace_id required");
  if (input.scope === "company" && !input.company_id) throw new Error("memory.store: company_id required");

  const row = {
    user_id: input.scope === "personal" ? userId : (input.scope === "workspace" ? userId : null),
    company_id: input.company_id ?? null,
    workspace_id: input.workspace_id ?? null,
    kind: input.kind,
    scope: input.scope,
    title: input.title.trim().slice(0, 500),
    body: (input.body ?? "").slice(0, 20000),
    summary: input.summary?.slice(0, 2000) ?? null,
    tags: input.tags ?? [],
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    source: input.source ?? "app",
    importance: input.importance ?? 3,
    sensitivity: input.sensitivity ?? "normal",
    metadata: (input.metadata ?? {}) as never,
    expires_at: input.expires_at ?? null,
    pinned: !!input.pinned,
  };

  const { data, error } = await sb.from("memory_items").insert(row as never).select(sel("id, company_id, workspace_id, user_id, kind, scope, title, body, summary, tags, entity_type, entity_id, source, importance, sensitivity, metadata, embedding, pinned, archived, expires_at, last_accessed_at, access_count, created_at, updated_at")).single();
  if (error) throw error;
  await audit(sb, userId, "store", { memory_id: data.id, company_id: data.company_id, runtime: input.source ?? "app" });
  return data;
}

// ---------- retrieve ----------
export async function memoryGet(sb: SB, userId: string, id: string) {
  const { data, error } = await sb.from("memory_items").select(sel("id, company_id, workspace_id, user_id, kind, scope, title, body, summary, tags, entity_type, entity_id, source, importance, sensitivity, metadata, embedding, pinned, archived, expires_at, last_accessed_at, access_count, created_at, updated_at")).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  // touch stats (best effort; RLS may block update on non-owner rows)
  await sb.from("memory_items")
    .update({ last_accessed_at: new Date().toISOString(), access_count: (data.access_count ?? 0) + 1 } as never)
    .eq("id", id);
  await audit(sb, userId, "read", { memory_id: id, company_id: data.company_id });
  return data;
}

export async function memoryList(sb: SB, userId: string, q: MemoryQuery = {}) {
  let query = sb.from("memory_items").select(sel("id, company_id, workspace_id, user_id, kind, scope, title, body, summary, tags, entity_type, entity_id, source, importance, sensitivity, metadata, embedding, pinned, archived, expires_at, last_accessed_at, access_count, created_at, updated_at"));
  if (!q.include_archived) query = query.eq("archived", false);
  if (q.scope) query = query.eq("scope", q.scope);
  if (q.kind) query = Array.isArray(q.kind) ? query.in("kind", q.kind) : query.eq("kind", q.kind);
  if (q.company_id) query = query.eq("company_id", q.company_id);
  if (q.workspace_id) query = query.eq("workspace_id", q.workspace_id);
  if (q.entity_type) query = query.eq("entity_type", q.entity_type);
  if (q.entity_id) query = query.eq("entity_id", q.entity_id);
  if (q.pinned !== undefined) query = query.eq("pinned", q.pinned);
  if (q.tags && q.tags.length) query = query.contains("tags", q.tags);
  if (q.since) query = query.gte("created_at", q.since);
  if (q.until) query = query.lte("created_at", q.until);

  query = query.order("pinned", { ascending: false })
               .order("importance", { ascending: false })
               .order("created_at", { ascending: false })
               .limit(Math.min(q.limit ?? 50, 200));
  const { data, error } = await query;
  if (error) throw error;
  await audit(sb, userId, "read", { company_id: q.company_id ?? null, reason: "list", metadata: { count: data?.length ?? 0 } });
  return data ?? [];
}

// ---------- search ----------
export async function memorySearch(sb: SB, userId: string, q: MemoryQuery) {
  const term = (q.q ?? "").trim();
  if (!term) return memoryList(sb, userId, q);

  // Keyword search using full-text index (title/summary/body/tags)
  let query = sb.from("memory_items").select(sel("id, company_id, workspace_id, user_id, kind, scope, title, body, summary, tags, entity_type, entity_id, source, importance, sensitivity, metadata, embedding, pinned, archived, expires_at, last_accessed_at, access_count, created_at, updated_at")).textSearch("search_tsv", term, { type: "websearch" });
  if (!q.include_archived) query = query.eq("archived", false);
  if (q.scope) query = query.eq("scope", q.scope);
  if (q.kind) query = Array.isArray(q.kind) ? query.in("kind", q.kind) : query.eq("kind", q.kind);
  if (q.company_id) query = query.eq("company_id", q.company_id);
  if (q.workspace_id) query = query.eq("workspace_id", q.workspace_id);
  if (q.tags && q.tags.length) query = query.contains("tags", q.tags);
  query = query.order("importance", { ascending: false }).limit(Math.min(q.limit ?? 30, 100));
  const { data, error } = await query;
  if (error) throw error;

  // Rank locally: importance * recency * pinned
  const now = Date.now();
  const ranked = (data ?? []).slice().sort((a, b) => rank(b, now) - rank(a, now));
  await audit(sb, userId, "search", { company_id: q.company_id ?? null, reason: term, metadata: { hits: ranked.length } });
  return ranked;
}

function rank(m: { importance: number; pinned: boolean; created_at: string; last_accessed_at: string | null }, now: number) {
  const ageDays = Math.max(1, (now - new Date(m.created_at).getTime()) / 86_400_000);
  const recencyDays = m.last_accessed_at
    ? Math.max(1, (now - new Date(m.last_accessed_at).getTime()) / 86_400_000)
    : ageDays;
  const recencyScore = 1 / Math.log2(recencyDays + 2);
  return (m.pinned ? 100 : 0) + m.importance * 10 + recencyScore * 5;
}

// ---------- update / archive / forget / merge ----------
export async function memoryUpdate(sb: SB, userId: string, id: string, patch: Partial<MemoryStoreInput>) {
  const clean: Record<string, unknown> = {};
  const allowed = ["title", "body", "summary", "tags", "importance", "sensitivity", "pinned", "expires_at", "metadata"] as const;
  for (const k of allowed) if (patch[k] !== undefined) clean[k] = patch[k];
  const { data, error } = await sb.from("memory_items").update(clean as never).eq("id", id).select(sel("id, company_id, workspace_id, user_id, kind, scope, title, body, summary, tags, entity_type, entity_id, source, importance, sensitivity, metadata, embedding, pinned, archived, expires_at, last_accessed_at, access_count, created_at, updated_at")).single();
  if (error) throw error;
  await audit(sb, userId, "update", { memory_id: id, company_id: data.company_id });
  return data;
}

export async function memoryArchive(sb: SB, userId: string, id: string) {
  const { data, error } = await sb.from("memory_items")
    .update({ archived: true } as never).eq("id", id).select("id, company_id").single();
  if (error) throw error;
  await audit(sb, userId, "archive", { memory_id: id, company_id: data.company_id });
  return { ok: true };
}

export async function memoryForget(sb: SB, userId: string, id: string, reason?: string) {
  const { data: before } = await sb.from("memory_items").select("id, company_id").eq("id", id).maybeSingle();
  const { error } = await sb.from("memory_items").delete().eq("id", id);
  if (error) throw error;
  await audit(sb, userId, "forget", { memory_id: id, company_id: before?.company_id ?? null, reason: reason ?? "user_request" });
  return { ok: true };
}

export async function memoryMerge(sb: SB, userId: string, primaryId: string, duplicateIds: string[]) {
  if (!duplicateIds.length) return { ok: true, merged: 0 };
  // Link duplicates as duplicate_of primary, then archive them.
  for (const dup of duplicateIds) {
    await sb.from("memory_links").insert({
      from_memory_id: dup, to_memory_id: primaryId, link_kind: "duplicate_of", created_by: userId,
    } as never);
    await sb.from("memory_items").update({ archived: true } as never).eq("id", dup);
    await audit(sb, userId, "merge", { memory_id: dup, reason: `merged_into:${primaryId}` });
  }
  return { ok: true, merged: duplicateIds.length };
}

// ---------- timeline / events ----------
export interface EventInput {
  event_type: string;
  summary: string;
  scope?: "personal" | "workspace" | "company";
  category?: "business" | "user" | "system" | "ai";
  company_id?: string | null;
  workspace_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  severity?: "debug" | "info" | "notice" | "warn" | "critical";
  metadata?: Record<string, unknown>;
  occurred_at?: string;
}

export async function memoryLogEvent(sb: SB, userId: string, ev: EventInput) {
  const row = {
    company_id: ev.company_id ?? null,
    workspace_id: ev.workspace_id ?? null,
    user_id: userId,
    actor_id: userId,
    scope: ev.scope ?? (ev.company_id ? "company" : "personal"),
    event_type: ev.event_type,
    category: ev.category ?? "system",
    entity_type: ev.entity_type ?? null,
    entity_id: ev.entity_id ?? null,
    summary: ev.summary.slice(0, 1000),
    severity: ev.severity ?? "info",
    metadata: (ev.metadata ?? {}) as never,
    occurred_at: ev.occurred_at ?? new Date().toISOString(),
  };
  const { data, error } = await sb.from("memory_events").insert(row as never).select("*").single();
  if (error) throw error;
  return data;
}

export async function memoryTimeline(sb: SB, _userId: string, opts: {
  company_id?: string | null; user_id?: string | null; workspace_id?: string | null;
  event_type?: string; since?: string; until?: string; limit?: number;
}) {
  let q = sb.from("memory_events").select("*");
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  if (opts.workspace_id) q = q.eq("workspace_id", opts.workspace_id);
  if (opts.user_id) q = q.eq("user_id", opts.user_id);
  if (opts.event_type) q = q.eq("event_type", opts.event_type);
  if (opts.since) q = q.gte("occurred_at", opts.since);
  if (opts.until) q = q.lte("occurred_at", opts.until);
  q = q.order("occurred_at", { ascending: false }).limit(Math.min(opts.limit ?? 100, 500));
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ---------- retention ----------
export async function memoryRetentionApply(sb: SB, userId: string, company_id: string) {
  const { data: policies, error } = await sb.from("memory_retention_policies")
    .select("*").eq("company_id", company_id).eq("active", true);
  if (error) throw error;

  const now = new Date();
  const summary: Array<{ kind: string; scope: string; archived: number; deleted: number; expired: number }> = [];

  for (const p of policies ?? []) {
    let archived = 0, deleted = 0, expired = 0;

    // 1. hard delete by max_age
    if (p.max_age_days) {
      const cutoff = new Date(now.getTime() - p.max_age_days * 86_400_000).toISOString();
      if (p.hard_delete) {
        const { data: del } = await sb.from("memory_items").delete()
          .eq("company_id", company_id).eq("kind", p.kind).eq("scope", p.scope)
          .lt("created_at", cutoff).eq("pinned", false).select("id");
        deleted = del?.length ?? 0;
      } else {
        const { data: arc } = await sb.from("memory_items").update({ archived: true } as never)
          .eq("company_id", company_id).eq("kind", p.kind).eq("scope", p.scope)
          .lt("created_at", cutoff).eq("archived", false).eq("pinned", false).select("id");
        archived = arc?.length ?? 0;
      }
    }

    // 2. archive_after_days (soft)
    if (p.archive_after_days) {
      const cutoff = new Date(now.getTime() - p.archive_after_days * 86_400_000).toISOString();
      const { data: arc } = await sb.from("memory_items").update({ archived: true } as never)
        .eq("company_id", company_id).eq("kind", p.kind).eq("scope", p.scope)
        .lt("created_at", cutoff).eq("archived", false).eq("pinned", false).select("id");
      archived += arc?.length ?? 0;
    }

    // 3. expire_at
    const { data: exp } = await sb.from("memory_items").update({ archived: true } as never)
      .eq("company_id", company_id).eq("kind", p.kind)
      .not("expires_at", "is", null).lt("expires_at", now.toISOString())
      .eq("archived", false).select("id");
    expired = exp?.length ?? 0;

    summary.push({ kind: p.kind, scope: p.scope, archived, deleted, expired });
  }

  await audit(sb, userId, "expire", { company_id, reason: "retention_apply", metadata: { policies: summary.length } });
  return { ok: true, summary };
}

export async function memoryRetentionUpsert(sb: SB, _userId: string, input: {
  company_id: string; scope: "personal" | "workspace" | "company" | "platform"; kind: string;
  max_age_days?: number | null; max_items?: number | null; archive_after_days?: number | null;
  hard_delete?: boolean; active?: boolean;
}) {
  const { data, error } = await sb.from("memory_retention_policies").upsert({
    company_id: input.company_id, scope: input.scope, kind: input.kind,
    max_age_days: input.max_age_days ?? null,
    max_items: input.max_items ?? null,
    archive_after_days: input.archive_after_days ?? null,
    hard_delete: input.hard_delete ?? false,
    active: input.active ?? true,
  } as never, { onConflict: "company_id,scope,kind" }).select("*").single();
  if (error) throw error;
  return data;
}

// ---------- retrieval helpers for AI runtimes ----------
export async function memoryContext(sb: SB, userId: string, opts: {
  company_id?: string | null; workspace_id?: string | null;
  kinds?: MemoryKind[]; limit?: number;
}) {
  const kinds = opts.kinds ?? (["personal", "ai", "conversation", "founder", "workspace", "company"] as MemoryKind[]);
  const now = Date.now();
  const [personal, ws, company] = await Promise.all([
    memoryList(sb, userId, { scope: "personal", kind: kinds, limit: 20 }),
    opts.workspace_id ? memoryList(sb, userId, { scope: "workspace", workspace_id: opts.workspace_id, limit: 20 }) : Promise.resolve([]),
    opts.company_id ? memoryList(sb, userId, { scope: "company", company_id: opts.company_id, limit: 30 }) : Promise.resolve([]),
  ]);
  const merged = [...personal, ...ws, ...company]
    .sort((a, b) => rank(b, now) - rank(a, now))
    .slice(0, opts.limit ?? 40);
  return {
    facts: merged.map(m => ({
      id: m.id, kind: m.kind, scope: m.scope, title: m.title, summary: m.summary ?? m.body.slice(0, 240),
      importance: m.importance, pinned: m.pinned, source: m.source, created_at: m.created_at,
    })),
    count: merged.length,
    note: "retrieved_facts_only — do not mix with generated recommendations",
  };
}

// ---------- links ----------
export async function memoryLink(sb: SB, userId: string, from_id: string, to_id: string, kind: "related" | "supersedes" | "duplicate_of" | "derived_from" | "references" = "related") {
  const { data, error } = await sb.from("memory_links").insert({
    from_memory_id: from_id, to_memory_id: to_id, link_kind: kind, created_by: userId,
  } as never).select("*").single();
  if (error) throw error;
  return data;
}
