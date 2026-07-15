// R29 HAPPY Knowledge Graph — real implementation
// Entities + typed relationships across every module. Verified vs AI-inferred are kept separate.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

export type EntityKind =
  | "company" | "user" | "employee" | "customer" | "lead" | "vendor"
  | "department" | "branch" | "product" | "inventory" | "batch" | "warehouse"
  | "purchase_order" | "sales_order" | "invoice" | "payment" | "wallet" | "credits"
  | "listing" | "website_project" | "app_project" | "deployment" | "notification"
  | "ai_agent" | "digital_human" | "knowledge_article" | "document" | "course" | "library_item";

export type RelationKind =
  | "works_at" | "reports_to" | "owns" | "created_by" | "assigned_to"
  | "belongs_to" | "depends_on" | "purchased" | "sold" | "produces"
  | "consumes" | "references" | "related_to" | "managed_by" | "connected_to";

const ENTITY_COLS =
  "id, company_id, kind, ref_table, ref_id, label, slug, description, tags, attributes, owner_user_id, status, created_at, updated_at";

// ---------- entities ----------
export interface EntityUpsertInput {
  company_id: string;
  kind: EntityKind;
  label: string;
  ref_table?: string | null;
  ref_id?: string | null;
  slug?: string | null;
  description?: string | null;
  tags?: string[];
  attributes?: Record<string, unknown>;
  owner_user_id?: string | null;
  status?: "active" | "archived" | "deleted";
}

export async function entityUpsert(sb: SB, _userId: string, input: EntityUpsertInput) {
  if (!input.label?.trim()) throw new Error("kg.entity: label required");
  const row = {
    company_id: input.company_id,
    kind: input.kind,
    ref_table: input.ref_table ?? null,
    ref_id: input.ref_id ?? null,
    label: input.label.trim().slice(0, 500),
    slug: input.slug ?? null,
    description: input.description ?? null,
    tags: input.tags ?? [],
    attributes: (input.attributes ?? {}) as never,
    owner_user_id: input.owner_user_id ?? null,
    status: input.status ?? "active",
  };
  // If ref_id present, use upsert on (company_id, kind, ref_id) unique key.
  if (input.ref_id) {
    const { data, error } = await sb.from("kg_entities")
      .upsert(row as never, { onConflict: "company_id,kind,ref_id" })
      .select(ENTITY_COLS).single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await sb.from("kg_entities").insert(row as never).select(ENTITY_COLS).single();
  if (error) throw error;
  return data;
}

export async function entityGet(sb: SB, _userId: string, id: string) {
  const { data, error } = await sb.from("kg_entities").select(ENTITY_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function entityResolve(sb: SB, _userId: string, opts: {
  company_id: string; kind: EntityKind; ref_id?: string; slug?: string;
}) {
  let q = sb.from("kg_entities").select(ENTITY_COLS).eq("company_id", opts.company_id).eq("kind", opts.kind);
  if (opts.ref_id) q = q.eq("ref_id", opts.ref_id);
  if (opts.slug) q = q.eq("slug", opts.slug);
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function entityList(sb: SB, _userId: string, opts: {
  company_id?: string; kind?: EntityKind | EntityKind[]; tags?: string[];
  status?: "active" | "archived" | "deleted"; limit?: number;
}) {
  let q = sb.from("kg_entities").select(ENTITY_COLS);
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  if (opts.status) q = q.eq("status", opts.status); else q = q.eq("status", "active");
  if (opts.kind) q = Array.isArray(opts.kind) ? q.in("kind", opts.kind) : q.eq("kind", opts.kind);
  if (opts.tags?.length) q = q.contains("tags", opts.tags);
  q = q.order("created_at", { ascending: false }).limit(Math.min(opts.limit ?? 100, 500));
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function entityArchive(sb: SB, _userId: string, id: string) {
  const { error } = await sb.from("kg_entities").update({ status: "archived" } as never).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function entityDelete(sb: SB, _userId: string, id: string) {
  const { error } = await sb.from("kg_entities").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

// ---------- relations ----------
export interface RelationInput {
  company_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relation: RelationKind;
  verified?: boolean;
  confidence?: number;
  source?: string;
  evidence?: Record<string, unknown>;
  weight?: number;
  valid_from?: string;
  valid_to?: string;
}

export async function relationUpsert(sb: SB, userId: string, input: RelationInput) {
  if (input.from_entity_id === input.to_entity_id) throw new Error("kg.relation: self-loops disallowed");
  const row = {
    company_id: input.company_id,
    from_entity_id: input.from_entity_id,
    to_entity_id: input.to_entity_id,
    relation: input.relation,
    verified: input.verified ?? true,
    confidence: input.confidence ?? (input.verified === false ? 0.6 : 1.0),
    source: input.source ?? "manual",
    evidence: (input.evidence ?? {}) as never,
    weight: input.weight ?? 1.0,
    valid_from: input.valid_from ?? null,
    valid_to: input.valid_to ?? null,
    created_by: userId,
  };
  const { data, error } = await sb.from("kg_relations")
    .upsert(row as never, { onConflict: "from_entity_id,to_entity_id,relation" })
    .select("*").single();
  if (error) throw error;
  return data;
}

export async function relationDelete(sb: SB, _userId: string, id: string) {
  const { error } = await sb.from("kg_relations").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function relationsList(sb: SB, _userId: string, opts: {
  company_id?: string; entity_id?: string; direction?: "in" | "out" | "both";
  relation?: RelationKind | RelationKind[]; verified_only?: boolean; limit?: number;
}) {
  let q = sb.from("kg_relations").select("*");
  if (opts.company_id) q = q.eq("company_id", opts.company_id);
  if (opts.relation) q = Array.isArray(opts.relation) ? q.in("relation", opts.relation) : q.eq("relation", opts.relation);
  if (opts.verified_only) q = q.eq("verified", true);
  if (opts.entity_id) {
    const dir = opts.direction ?? "both";
    if (dir === "out") q = q.eq("from_entity_id", opts.entity_id);
    else if (dir === "in") q = q.eq("to_entity_id", opts.entity_id);
    else q = q.or(`from_entity_id.eq.${opts.entity_id},to_entity_id.eq.${opts.entity_id}`);
  }
  q = q.order("weight", { ascending: false }).order("created_at", { ascending: false }).limit(Math.min(opts.limit ?? 200, 1000));
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ---------- neighborhood / traversal ----------
export async function neighborhood(sb: SB, userId: string, opts: {
  entity_id: string; depth?: number; verified_only?: boolean; relation?: RelationKind[];
}) {
  const depth = Math.min(Math.max(opts.depth ?? 1, 1), 3);
  const visited = new Set<string>([opts.entity_id]);
  const nodes: any[] = [];
  const edges: any[] = [];
  const rootEnt = await entityGet(sb, userId, opts.entity_id);
  if (rootEnt) nodes.push(rootEnt);
  let frontier = [opts.entity_id];

  for (let d = 0; d < depth; d++) {
    const nextFrontier: string[] = [];
    for (const id of frontier) {
      const rels = await relationsList(sb, userId, {
        entity_id: id, direction: "both", verified_only: opts.verified_only, relation: opts.relation, limit: 100,
      });
      for (const r of rels) {
        edges.push(r);
        const other = r.from_entity_id === id ? r.to_entity_id : r.from_entity_id;
        if (!visited.has(other)) {
          visited.add(other);
          nextFrontier.push(other);
          const e = await entityGet(sb, userId, other);
          if (e) nodes.push(e);
        }
      }
    }
    frontier = nextFrontier;
    if (!frontier.length) break;
  }
  return { nodes, edges, depth };
}

// ---------- search ----------
export async function entitySearch(sb: SB, _userId: string, opts: {
  company_id: string; q: string; kind?: EntityKind | EntityKind[]; limit?: number;
}) {
  const term = opts.q.trim();
  if (!term) return [];
  let query = sb.from("kg_entities").select(ENTITY_COLS).eq("company_id", opts.company_id).eq("status", "active");
  query = query.textSearch("search_tsv", term, { type: "websearch" });
  if (opts.kind) query = Array.isArray(opts.kind) ? query.in("kind", opts.kind) : query.eq("kind", opts.kind);
  query = query.limit(Math.min(opts.limit ?? 30, 100));
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface NLQueryResult {
  intent: string;
  entities: any[];
  relations: any[];
  answer_summary: string;
  facts: any[];
  inferences: any[];
}

// Deterministic natural-language query router (facts only).
export async function naturalQuery(sb: SB, userId: string, opts: { company_id: string; q: string }): Promise<NLQueryResult> {
  const q = opts.q.toLowerCase().trim();
  const relMap: Array<[RegExp, RelationKind, string]> = [
    [/who (owns|owner)/, "owns", "ownership"],
    [/who created/, "created_by", "creation"],
    [/reports to|manager of/, "reports_to", "hierarchy"],
    [/works at|employees? of/, "works_at", "employment"],
    [/purchased|bought/, "purchased", "purchase"],
    [/sold to|customers? of/, "sold", "sales"],
    [/produces|manufactures/, "produces", "production"],
    [/consumes|uses/, "consumes", "consumption"],
    [/assigned to/, "assigned_to", "assignment"],
    [/depends on|dependency/, "depends_on", "dependency"],
    [/managed by/, "managed_by", "management"],
    [/connected to|connections?/, "connected_to", "connection"],
    [/related to|related/, "related_to", "association"],
  ];
  const chosen = relMap.find(([re]) => re.test(q));
  const candidates = await entitySearch(sb, userId, { company_id: opts.company_id, q, limit: 8 });

  let relations: any[] = [];
  if (candidates.length && chosen) {
    relations = await relationsList(sb, userId, {
      company_id: opts.company_id, entity_id: candidates[0].id, direction: "both",
      relation: chosen[1], verified_only: true, limit: 50,
    });
  }
  return {
    intent: chosen?.[2] ?? "search",
    entities: candidates,
    relations,
    answer_summary: chosen
      ? `Found ${candidates.length} matching entities and ${relations.length} verified '${chosen[1]}' relations.`
      : `Found ${candidates.length} matching entities.`,
    facts: [...candidates, ...relations],
    inferences: [], // strict separation: naturalQuery returns only verified data
  };
}

// ---------- inference engine ----------
export interface InferenceInput {
  company_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relation: RelationKind;
  confidence: number;
  rationale: string;
  evidence?: Record<string, unknown>;
}

export async function inferenceRecord(sb: SB, userId: string, input: InferenceInput) {
  const { data, error } = await sb.from("kg_inferences").insert({
    company_id: input.company_id,
    from_entity_id: input.from_entity_id,
    to_entity_id: input.to_entity_id,
    relation: input.relation,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    rationale: input.rationale.slice(0, 2000),
    evidence: (input.evidence ?? {}) as never,
    created_by: userId,
  } as never).select("*").single();
  if (error) throw error;
  return data;
}

export async function inferenceReview(sb: SB, userId: string, id: string, decision: "accepted" | "rejected") {
  const { data: inf, error: fetchErr } = await sb.from("kg_inferences").select("*").eq("id", id).single();
  if (fetchErr) throw fetchErr;
  const { data, error } = await sb.from("kg_inferences").update({
    status: decision, reviewed_by: userId, reviewed_at: new Date().toISOString(),
  } as never).eq("id", id).select("*").single();
  if (error) throw error;
  if (decision === "accepted" && inf.from_entity_id && inf.to_entity_id) {
    await relationUpsert(sb, userId, {
      company_id: inf.company_id!, from_entity_id: inf.from_entity_id, to_entity_id: inf.to_entity_id,
      relation: inf.relation as RelationKind, verified: true, confidence: Number(inf.confidence),
      source: "inference_accepted", evidence: { inference_id: id, rationale: inf.rationale },
    });
  }
  return data;
}

export async function inferencesList(sb: SB, _userId: string, opts: {
  company_id: string; status?: "pending" | "accepted" | "rejected" | "superseded"; limit?: number;
}) {
  let q = sb.from("kg_inferences").select("*").eq("company_id", opts.company_id);
  if (opts.status) q = q.eq("status", opts.status);
  q = q.order("created_at", { ascending: false }).limit(Math.min(opts.limit ?? 100, 500));
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// Rule-based inference: derive candidate relations from existing verified edges.
// Rules kept conservative — this NEVER creates entities and only proposes edges.
export async function inferenceRun(sb: SB, userId: string, opts: { company_id: string; limit?: number }) {
  const proposed: InferenceInput[] = [];
  const rels = await relationsList(sb, userId, {
    company_id: opts.company_id, verified_only: true, limit: opts.limit ?? 500,
  });

  const byFrom = new Map<string, typeof rels>();
  for (const r of rels) {
    const arr = byFrom.get(r.from_entity_id) ?? [];
    arr.push(r); byFrom.set(r.from_entity_id, arr);
  }

  // Rule 1: (a owns b) ∧ (b depends_on c) → (a related_to c)
  for (const [from, list] of byFrom) {
    for (const r1 of list.filter(x => x.relation === "owns")) {
      for (const r2 of (byFrom.get(r1.to_entity_id) ?? []).filter(x => x.relation === "depends_on")) {
        proposed.push({
          company_id: opts.company_id, from_entity_id: from, to_entity_id: r2.to_entity_id,
          relation: "related_to", confidence: 0.7,
          rationale: `Owner ${from} → owns ${r1.to_entity_id} which depends_on ${r2.to_entity_id}`,
          evidence: { rule: "owns+depends_on", via: r1.to_entity_id },
        });
      }
    }
    // Rule 2: (a purchased b) ∧ (b produces c) → (a related_to c)
    for (const r1 of list.filter(x => x.relation === "purchased")) {
      for (const r2 of (byFrom.get(r1.to_entity_id) ?? []).filter(x => x.relation === "produces")) {
        proposed.push({
          company_id: opts.company_id, from_entity_id: from, to_entity_id: r2.to_entity_id,
          relation: "related_to", confidence: 0.6,
          rationale: `Buyer purchased product which produces output`,
          evidence: { rule: "purchased+produces", via: r1.to_entity_id },
        });
      }
    }
    // Rule 3: (a reports_to b) ∧ (b reports_to c) → (a reports_to c) [transitive]
    for (const r1 of list.filter(x => x.relation === "reports_to")) {
      for (const r2 of (byFrom.get(r1.to_entity_id) ?? []).filter(x => x.relation === "reports_to")) {
        proposed.push({
          company_id: opts.company_id, from_entity_id: from, to_entity_id: r2.to_entity_id,
          relation: "reports_to", confidence: 0.85,
          rationale: `Transitive reporting chain`,
          evidence: { rule: "reports_to_transitive", via: r1.to_entity_id },
        });
      }
    }
  }

  // dedupe against existing relations
  const existing = new Set(rels.map(r => `${r.from_entity_id}|${r.to_entity_id}|${r.relation}`));
  const fresh = proposed.filter(p => !existing.has(`${p.from_entity_id}|${p.to_entity_id}|${p.relation}`));

  const recorded = [];
  for (const p of fresh.slice(0, 100)) {
    try { recorded.push(await inferenceRecord(sb, userId, p)); } catch { /* skip dup */ }
  }
  return { proposed: fresh.length, recorded: recorded.length, sample: recorded.slice(0, 10) };
}

// ---------- dashboard health ----------
export async function graphHealth(sb: SB, _userId: string, company_id: string) {
  const [{ count: entityCount }, { count: relationCount }, { count: verifiedCount }, { count: inferredPending }, kinds] = await Promise.all([
    sb.from("kg_entities").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("status", "active"),
    sb.from("kg_relations").select("id", { count: "exact", head: true }).eq("company_id", company_id),
    sb.from("kg_relations").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("verified", true),
    sb.from("kg_inferences").select("id", { count: "exact", head: true }).eq("company_id", company_id).eq("status", "pending"),
    sb.from("kg_entities").select("kind").eq("company_id", company_id).eq("status", "active"),
  ]);

  const byKind: Record<string, number> = {};
  for (const row of (kinds.data ?? [])) byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
  const verificationRate = relationCount ? Math.round(((verifiedCount ?? 0) / relationCount) * 100) : 100;

  return {
    entity_count: entityCount ?? 0,
    relation_count: relationCount ?? 0,
    verified_relation_count: verifiedCount ?? 0,
    inferred_pending: inferredPending ?? 0,
    verification_rate_pct: verificationRate,
    kind_distribution: byKind,
    cross_module_connections: Object.keys(byKind).length,
    computed_at: new Date().toISOString(),
    note: "verified_relations_only — inferences require human review",
  };
}
