// R116 — HAPPY Memory Intelligence (pure helpers, no DB, no new engine).
// Extends the canonical owner src/lib/memory/engine.ts. Do NOT duplicate.
//
// Every helper is a pure function operating on typed inputs / rows. Callers
// (runBrain, UI, agents) still write and read through the existing engine.

import type { MemoryStoreInput, MemoryKind, MemoryScope } from "./engine";

/* ─────────────────── Types ─────────────────── */

export type MemoryCategory =
  | "personal" | "conversation" | "workspace" | "company" | "brand"
  | "project" | "learning" | "founder" | "shared" | "temporary" | "archived";

export type MemoryConfidence =
  | "verified" | "user_confirmed" | "ai_inferred" | "expired" | "archived";

export type ClassifyInput = {
  text: string;
  hint?: {
    scope?: MemoryScope;
    kind?: MemoryKind;
    workspace_id?: string | null;
    company_id?: string | null;
    founder_mode?: boolean;
    source?: string | null;
    entity_type?: string | null;
  };
};

export type ClassifyResult = {
  kind: MemoryKind;
  scope: MemoryScope;
  category: MemoryCategory;
  tags: string[];
  importance: 1 | 2 | 3 | 4 | 5;
  sensitivity: "public" | "normal" | "confidential" | "restricted";
  summary: string;
  confidence: MemoryConfidence;
};

export type MemoryRowLike = {
  id: string;
  kind: MemoryKind;
  scope: MemoryScope;
  title: string;
  body?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  importance?: number | null;
  pinned?: boolean | null;
  archived?: boolean | null;
  expires_at?: string | null;
  created_at?: string;
  last_accessed_at?: string | null;
  metadata?: Record<string, unknown> | null;
  entity_type?: string | null;
  entity_id?: string | null;
};

/* ─────────────────── Phase 3 · Category mapping ─────────────────── */

export function toCategory(row: Pick<MemoryRowLike, "kind" | "scope" | "expires_at" | "archived" | "tags">): MemoryCategory {
  if (row.archived) return "archived";
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return "temporary";
  if (row.kind === "founder") return "founder";
  if (row.kind === "project") return "project";
  if (row.kind === "ai" && (row.tags ?? []).includes("learning")) return "learning";
  if ((row.tags ?? []).includes("brand")) return "brand";
  if (row.kind === "conversation") return "conversation";
  if (row.scope === "workspace") return "workspace";
  if (row.scope === "company") return "company";
  if ((row.tags ?? []).includes("shared")) return "shared";
  return "personal";
}

/* ─────────────────── Phase 4 · Intelligence ─────────────────── */

const KIND_RULES: Array<{ re: RegExp; kind: MemoryKind; tag?: string }> = [
  { re: /\b(invoice|payable|receivable|p&l|balance sheet|cash flow|gst)\b/i, kind: "finance", tag: "finance" },
  { re: /\b(deal|pipeline|lead|opportunity|customer)\b/i, kind: "crm", tag: "crm" },
  { re: /\b(production|batch|bom|quality|machine)\b/i, kind: "manufacturing", tag: "mfg" },
  { re: /\b(inventory|stock|warehouse|lot|expiry)\b/i, kind: "warehouse", tag: "wms" },
  { re: /\b(listing|marketplace|creator|purchase)\b/i, kind: "marketplace", tag: "marketplace" },
  { re: /\b(deploy|release|build|domain|rollback)\b/i, kind: "deployment", tag: "deployment" },
  { re: /\b(builder|generate site|generate app|website)\b/i, kind: "builder", tag: "builder" },
  { re: /\b(project|milestone|sprint|roadmap|task)\b/i, kind: "project", tag: "project" },
  { re: /\b(brand|voice|tone|logo|palette)\b/i, kind: "company", tag: "brand" },
  { re: /\b(founder|board|strategy|vision)\b/i, kind: "founder", tag: "founder" },
];

/** Classify a raw text + hint into a fully-populated MemoryStoreInput seed. */
export function classify(input: ClassifyInput): ClassifyResult {
  const text = (input.text ?? "").trim();
  const hint = input.hint ?? {};
  const matched = KIND_RULES.find((r) => r.re.test(text));

  const kind: MemoryKind =
    hint.kind
    ?? (hint.founder_mode ? "founder"
      : matched?.kind
      ?? (hint.workspace_id ? "workspace"
        : hint.company_id ? "company" : "personal"));

  const scope: MemoryScope =
    hint.scope
    ?? (hint.workspace_id ? "workspace"
      : hint.company_id ? "company"
      : "personal");

  const tags = autoTag(text, hint, matched?.tag);
  const importance = prioritize(text, kind, !!hint.founder_mode);
  const sensitivity =
    hint.founder_mode || kind === "founder" ? "confidential"
    : kind === "finance" || kind === "crm" ? "confidential"
    : "normal";
  const summary = summarize(text);
  const confidence: MemoryConfidence =
    hint.source === "user" ? "user_confirmed"
    : hint.source === "verified" ? "verified"
    : "ai_inferred";

  return { kind, scope, category: toCategory({ kind, scope, expires_at: null, archived: false, tags }), tags, importance, sensitivity, summary, confidence };
}

/** Deterministic tag extraction — nouns, matched-rule tag, hint markers. */
export function autoTag(text: string, hint: ClassifyInput["hint"] = {}, extra?: string): string[] {
  const set = new Set<string>();
  if (extra) set.add(extra);
  if (hint?.founder_mode) set.add("founder");
  if (hint?.workspace_id) set.add("workspace");
  if (hint?.company_id) set.add("company");
  if (hint?.entity_type) set.add(hint.entity_type);
  // heuristic: capitalized tokens length ≥ 3 → entity tag
  const caps = text.match(/\b[A-Z][a-zA-Z0-9]{2,}\b/g) ?? [];
  for (const c of caps.slice(0, 5)) set.add(c.toLowerCase());
  // #hashtags respected
  for (const h of text.match(/#([a-z0-9_\-]{2,})/gi) ?? []) set.add(h.replace(/^#/, "").toLowerCase());
  return [...set].slice(0, 12);
}

/** Importance 1..5. Founder / high-impact keywords bias upward. */
export function prioritize(text: string, kind: MemoryKind, founder: boolean): 1 | 2 | 3 | 4 | 5 {
  let score = 2;
  if (founder || kind === "founder") score += 2;
  if (/\b(critical|urgent|blocker|deadline|revenue|churn|outage)\b/i.test(text)) score += 2;
  if (text.length > 400) score += 1;
  if (text.length < 20) score -= 1;
  return Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;
}

/** Cheap extractive summary: first sentence, capped to 240 chars. */
export function summarize(text: string, max = 240): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const first = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return first.length <= max ? first : first.slice(0, max - 1) + "…";
}

/** Return existing rows likely to be duplicates of a candidate write. */
export function dedupeCandidates(candidate: { title: string; body?: string }, rows: MemoryRowLike[], threshold = 0.72): MemoryRowLike[] {
  const a = normalize(`${candidate.title} ${candidate.body ?? ""}`);
  if (!a) return [];
  return rows
    .map((r) => ({ r, sim: jaccard(a, normalize(`${r.title} ${r.body ?? r.summary ?? ""}`)) }))
    .filter((x) => x.sim >= threshold)
    .sort((x, y) => y.sim - x.sim)
    .map((x) => x.r);
}

/** Rows that contradict each other on the same entity. */
export function detectConflicts(rows: MemoryRowLike[]): Array<{ a: string; b: string; entity: string }> {
  const byEntity = new Map<string, MemoryRowLike[]>();
  for (const r of rows) {
    if (!r.entity_id || !r.entity_type) continue;
    const key = `${r.entity_type}:${r.entity_id}`;
    if (!byEntity.has(key)) byEntity.set(key, []);
    byEntity.get(key)!.push(r);
  }
  const conflicts: Array<{ a: string; b: string; entity: string }> = [];
  for (const [entity, list] of byEntity) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const sim = jaccard(normalize(list[i].title + " " + (list[i].body ?? "")), normalize(list[j].title + " " + (list[j].body ?? "")));
        // low similarity on the same entity → likely conflicting statements
        if (sim < 0.2) conflicts.push({ a: list[i].id, b: list[j].id, entity });
      }
    }
  }
  return conflicts;
}

/* ─────────────────── Phase 7 · Confidence Engine ─────────────────── */

export function confidenceScore(row: MemoryRowLike): { level: MemoryConfidence; score: number } {
  if (row.archived) return { level: "archived", score: 0.1 };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return { level: "expired", score: 0.2 };
  const src = String(row.metadata?.source ?? "");
  if (src === "verified") return { level: "verified", score: 0.99 };
  if (src === "user") return { level: "user_confirmed", score: 0.9 };
  // fall back to importance/pinned
  const imp = Number(row.importance ?? 3);
  const pinned = row.pinned ? 0.15 : 0;
  return { level: "ai_inferred", score: Math.min(0.88, 0.4 + imp * 0.1 + pinned) };
}

/* ─────────────────── Phase 8 · Permissions ─────────────────── */

export type PermissionActor = {
  userId: string;
  isFounder?: boolean;
  isCompanyMember?: boolean;
  isWorkspaceMember?: boolean;
};

/** Code-side assertion in ADDITION to RLS. Throws on violation; returns void on ok. */
export function assertMemoryPermission(actor: PermissionActor, action: "read" | "write" | "forget", target: {
  scope: MemoryScope; kind: MemoryKind; workspace_id?: string | null; company_id?: string | null;
}): void {
  // Forget guard applies to EVERYONE, including founders (never delete Founder knowledge).
  if (action === "forget" && target.kind === "founder") {
    throw new Error("memory.permission: founder knowledge cannot be forgotten");
  }
  if (actor.isFounder) return; // founders bypass other checks
  if (target.kind === "founder") {
    throw new Error("memory.permission: founder-scope requires platform founder role");
  }
  if (target.scope === "workspace" && !actor.isWorkspaceMember) {
    throw new Error("memory.permission: workspace-scope requires workspace membership");
  }
  if (target.scope === "company" && !actor.isCompanyMember) {
    throw new Error("memory.permission: company-scope requires company membership");
  }
}

/* ─────────────────── Phase 5 · Recall planning ─────────────────── */

export type RecallPlan = {
  scopes: MemoryScope[];
  kinds: MemoryKind[];
  limit: number;
  timeWindowDays?: number;
};

export function recallPlan(input: {
  intent?: string;
  persona?: "founder" | "admin" | "employee" | "customer" | "guest";
  workspace_id?: string | null;
  company_id?: string | null;
  founder_mode?: boolean;
}): RecallPlan {
  const scopes: MemoryScope[] = ["personal"];
  if (input.workspace_id) scopes.push("workspace");
  if (input.company_id) scopes.push("company");

  const kinds: MemoryKind[] = ["conversation", "personal", "ai"];
  if (input.workspace_id) kinds.push("workspace", "project");
  if (input.company_id) kinds.push("company", "crm", "finance");
  if (input.founder_mode || input.persona === "founder") kinds.push("founder");

  return { scopes, kinds: uniq(kinds), limit: 40, timeWindowDays: 90 };
}

/* ─────────────────── Phase 6 · Timeline grouping ─────────────────── */

export function groupTimeline(events: Array<{ occurred_at?: string; created_at?: string; event_type?: string; summary?: string; category?: string }>) {
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const t = e.occurred_at ?? e.created_at ?? new Date().toISOString();
    const day = t.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, items]) => ({ day, count: items.length, items }));
}

/* ─────────────────── Phase 10 · Analytics ─────────────────── */

export type MemoryAnalytics = {
  total: number;
  hits: number;
  misses: number;
  recall_accuracy: number;
  duplicate_rate: number;
  conflict_rate: number;
  growth_per_day: number;
  avg_latency_ms: number;
};

export function analyticsSnapshot(rows: MemoryRowLike[], events: Array<{ event_type?: string; metadata?: any; occurred_at?: string; created_at?: string }> = []): MemoryAnalytics {
  const total = rows.length;
  const hits = events.filter((e) => e.event_type === "memory.hit").length;
  const misses = events.filter((e) => e.event_type === "memory.miss").length;
  const dupes = dedupeStats(rows);
  const conflicts = detectConflicts(rows).length;
  const days = spanDays(rows);
  const growth = days ? total / days : total;
  const latencies = events
    .map((e) => Number(e?.metadata?.latency_ms ?? 0))
    .filter((n) => n > 0);
  const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  return {
    total, hits, misses,
    recall_accuracy: hits + misses ? hits / (hits + misses) : 0,
    duplicate_rate: total ? dupes / total : 0,
    conflict_rate: total ? conflicts / total : 0,
    growth_per_day: Number(growth.toFixed(2)),
    avg_latency_ms: Math.round(avgLatency),
  };
}

/* ─────────────────── Phase 11 · Digital Human influence ─────────────────── */

export type DHMemoryInfluence = {
  greeting: string;
  emotion: "neutral" | "warm" | "focused" | "concerned" | "celebratory";
  gestureHint: "idle" | "wave" | "nod" | "explain";
  roadmapSeed: string[];
  suggestions: string[];
};

export function influenceDigitalHuman(rows: MemoryRowLike[], persona: "founder" | "admin" | "employee" | "customer" | "guest" = "guest"): DHMemoryInfluence {
  if (!rows.length) {
    return {
      greeting: persona === "founder" ? "Welcome back, Founder." : "Hello — how can I help?",
      emotion: "warm",
      gestureHint: "wave",
      roadmapSeed: [],
      suggestions: [],
    };
  }
  const conv = rows.filter((r) => r.kind === "conversation").slice(0, 1)[0];
  const pinned = rows.filter((r) => r.pinned && (r.kind === "project" || r.kind === "founder")).slice(0, 5);
  const high = rows
    .filter((r) => (r.importance ?? 3) >= 4 && !r.archived)
    .slice(0, 5)
    .map((r) => r.title);

  const greeting =
    conv ? `Picking up where we left off: ${conv.title}`
    : persona === "founder" ? "Founder — ready when you are."
    : "Good to see you again.";

  const emotion: DHMemoryInfluence["emotion"] =
    high.some((t) => /outage|blocker|churn|urgent/i.test(t)) ? "concerned"
    : rows.some((r) => (r.tags ?? []).includes("celebrate")) ? "celebratory"
    : "warm";

  return {
    greeting,
    emotion,
    gestureHint: conv ? "nod" : "wave",
    roadmapSeed: pinned.map((p) => p.title),
    suggestions: high,
  };
}

/* ─────────────────── Phase 12 · Brain bridge (pure) ─────────────────── */

/** Build a MemoryStoreInput seed from a runBrain turn. Callers still invoke memoryStore(). */
export function seedFromBrainTurn(args: {
  text: string;
  reply: string;
  company_id?: string | null;
  workspace_id?: string | null;
  founder_mode?: boolean;
  persona?: "founder" | "admin" | "employee" | "customer" | "guest";
  session_id?: string | null;
  agents?: string[];
}): MemoryStoreInput {
  const c = classify({
    text: `${args.text}\n\n${args.reply}`,
    hint: {
      workspace_id: args.workspace_id ?? null,
      company_id: args.company_id ?? null,
      founder_mode: args.founder_mode,
      source: "conversation",
    },
  });
  return {
    kind: "conversation",
    scope: c.scope,
    title: `Brain: ${args.text.trim().slice(0, 120)}`,
    body: `${args.text}\n\n${args.reply}`,
    summary: c.summary,
    tags: uniq([...c.tags, "brain"]),
    company_id: args.company_id ?? null,
    workspace_id: args.workspace_id ?? null,
    importance: c.importance,
    sensitivity: c.sensitivity,
    metadata: { session_id: args.session_id ?? null, agents: args.agents ?? [], category: c.category },
  };
}

/* ─────────────────── internal utilities ─────────────────── */

function normalize(s: string): string {
  return (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function tokenize(s: string): Set<string> { return new Set(normalize(s).split(" ").filter((t) => t.length > 2)); }
function jaccard(a: string, b: string): number {
  const A = tokenize(a), B = tokenize(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}
function dedupeStats(rows: MemoryRowLike[]): number {
  let d = 0;
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (jaccard(normalize(rows[i].title + " " + (rows[i].body ?? "")), normalize(rows[j].title + " " + (rows[j].body ?? ""))) >= 0.72) d++;
    }
  }
  return d;
}
function spanDays(rows: MemoryRowLike[]): number {
  const times = rows.map((r) => r.created_at ? new Date(r.created_at).getTime() : 0).filter(Boolean);
  if (times.length < 2) return 0;
  return Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000));
}
function uniq<T>(a: T[]): T[] { return [...new Set(a)]; }
