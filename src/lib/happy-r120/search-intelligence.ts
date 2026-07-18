/**
 * R120 — HAPPY Universal Search Intelligence™
 *
 * Pure extension layer on top of the canonical Search Runtime
 * (`src/services/domain/search.service.ts`). No new runtime, no new
 * indexes, no new tables, no new APIs.
 *
 * Follows the R115-R119 pattern: deterministic helpers that:
 *  - classify queries (natural language / keyword / semantic / hybrid)
 *  - pick target scopes (17 universal domains)
 *  - rank / merge candidate results by permission, workspace, recency,
 *    relevance, memory affinity, relationship, pinned/favorite
 *  - shape instant-search suggestions
 *  - provide a Brain / Digital Human resolver hook
 *  - emit analytics snapshots
 *
 * Canonical owner (unchanged): `searchService` in
 * `src/services/domain/search.service.ts`. Everything here composes on
 * top of it — do NOT introduce a Search V2.
 */

// ---------- Domains (17 universal scopes) ----------
export const SEARCH_DOMAINS = [
  "users", "chats", "memory", "knowledge", "projects",
  "companies", "brands", "files", "folders", "calendar",
  "tasks", "automation", "builders", "agents", "marketplace",
  "courses", "analytics",
] as const;
export type SearchDomain = (typeof SEARCH_DOMAINS)[number];

// ---------- Query classification ----------
export type QueryMode = "keyword" | "semantic" | "natural" | "hybrid";

const NL_HINTS = /\b(show|find|open|list|get|search|display|give|latest|last|this|from|related|about)\b/i;
const QUESTION = /[?]|^(what|who|when|where|why|how|which)\b/i;

export function classifyQuery(q: string): QueryMode {
  const s = q.trim();
  if (!s) return "keyword";
  const words = s.split(/\s+/);
  if (QUESTION.test(s)) return "natural";
  if (words.length >= 6 || NL_HINTS.test(s)) return "hybrid";
  if (words.length >= 3) return "semantic";
  return "keyword";
}

// ---------- Intent → domains ----------
const DOMAIN_HINTS: Array<[RegExp, SearchDomain[]]> = [
  [/\b(invoices?|payments?|revenue|orders?|billing)\b/i, ["analytics", "files", "companies"]],
  [/\b(agents?|bots?|copilots?)\b/i, ["agents", "automation"]],
  [/\b(roadmaps?|milestones?|okr|goals?)\b/i, ["projects", "knowledge"]],
  [/\b(presentations?|decks?|slides?|pitch|investor)\b/i, ["files", "knowledge"]],
  [/\b(tasks?|todos?|tickets?|issues?)\b/i, ["tasks", "projects"]],
  [/\b(meetings?|calls?|events?|calendar)\b/i, ["calendar", "chats"]],
  [/\b(courses?|lessons?|training|learn)\b/i, ["courses", "knowledge"]],
  [/\b(builders?|templates?|components?|blocks?)\b/i, ["builders", "marketplace"]],
  [/\b(users?|members?|people|contacts?|customers?)\b/i, ["users", "companies"]],
  [/\b(chats?|conversations?|messages?|threads?)\b/i, ["chats", "memory"]],
  [/\b(files?|docs?|documents?|pdfs?|images?|videos?)\b/i, ["files", "folders"]],
  [/\b(brands?|logos?|identity)\b/i, ["brands", "companies"]],
  [/\b(memory|remember|recall)\b/i, ["memory"]],
  [/\b(compan(y|ies)|organizations?|orgs?)\b/i, ["companies", "brands"]],
];

export function pickDomains(q: string): SearchDomain[] {
  const hits = new Set<SearchDomain>();
  for (const [re, doms] of DOMAIN_HINTS) if (re.test(q)) doms.forEach((d) => hits.add(d));
  if (hits.size === 0) {
    // default global sweep — top 8 most useful
    return ["knowledge", "files", "chats", "memory", "projects", "tasks", "companies", "users"];
  }
  return Array.from(hits);
}

// ---------- Time window extraction ----------
export type TimeWindow = { since?: string; until?: string; label?: string };
export function extractTimeWindow(q: string, now = new Date()): TimeWindow | undefined {
  const t = q.toLowerCase();
  const iso = (d: Date) => d.toISOString();
  const day = 24 * 3600_000;
  if (/\btoday\b/.test(t)) return { since: iso(new Date(now.getTime() - day)), label: "today" };
  if (/\byesterday\b/.test(t)) return { since: iso(new Date(now.getTime() - 2 * day)), until: iso(new Date(now.getTime() - day)), label: "yesterday" };
  if (/\blast\s+week\b|\bthis\s+week\b/.test(t)) return { since: iso(new Date(now.getTime() - 7 * day)), label: "week" };
  if (/\blast\s+month\b|\bthis\s+month\b/.test(t)) return { since: iso(new Date(now.getTime() - 30 * day)), label: "month" };
  if (/\blast\s+year\b|\bthis\s+year\b/.test(t)) return { since: iso(new Date(now.getTime() - 365 * day)), label: "year" };
  return undefined;
}

// ---------- Candidate + ranking ----------
export type SearchCandidate = {
  id: string;
  domain: SearchDomain;
  title: string;
  snippet?: string;
  updatedAt?: string;
  score?: number;      // upstream relevance 0..1
  permission?: "own" | "shared" | "workspace" | "public" | "denied";
  workspaceId?: string;
  pinned?: boolean;
  favorite?: boolean;
  ocr?: boolean;
};

export type RankContext = {
  now?: Date;
  workspaceId?: string;
  memoryTopics?: string[];   // recent memory tags/keywords
  relationships?: string[];  // ids the user interacts with often
};

export function rankResults(cands: SearchCandidate[], ctx: RankContext = {}): SearchCandidate[] {
  const now = (ctx.now ?? new Date()).getTime();
  const scored = cands
    .filter((c) => c.permission !== "denied")
    .map((c) => {
      let s = (c.score ?? 0.4);
      // permission bias
      s += c.permission === "own" ? 0.15 : c.permission === "shared" ? 0.08 : c.permission === "workspace" ? 0.05 : 0;
      // workspace affinity
      if (ctx.workspaceId && c.workspaceId === ctx.workspaceId) s += 0.12;
      // recency (30-day half-life)
      if (c.updatedAt) {
        const age = Math.max(0, now - new Date(c.updatedAt).getTime());
        s += Math.max(0, 0.2 - age / (30 * 86_400_000) * 0.2);
      }
      // memory affinity
      if (ctx.memoryTopics?.some((k) => c.title.toLowerCase().includes(k.toLowerCase()))) s += 0.1;
      // relationship affinity (user/company ids in title/id)
      if (ctx.relationships?.some((r) => c.id.includes(r) || c.title.toLowerCase().includes(r.toLowerCase()))) s += 0.08;
      if (c.pinned) s += 0.25;
      if (c.favorite) s += 0.15;
      return { ...c, score: Math.min(1, s) };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return scored;
}

// ---------- Merge multi-domain results ----------
export function mergeDomainResults(perDomain: Record<string, SearchCandidate[]>, ctx: RankContext = {}): SearchCandidate[] {
  const all: SearchCandidate[] = [];
  for (const arr of Object.values(perDomain)) all.push(...arr);
  return rankResults(all, ctx);
}

// ---------- Instant search suggestions ----------
export type Suggestion = { text: string; kind: "recent" | "recommended" | "ai" | "domain" };

export function suggestFor(input: {
  q: string;
  recents?: string[];
  memoryTopics?: string[];
}): Suggestion[] {
  const q = input.q.trim().toLowerCase();
  const out: Suggestion[] = [];
  (input.recents ?? []).filter((r) => !q || r.toLowerCase().includes(q)).slice(0, 3)
    .forEach((r) => out.push({ text: r, kind: "recent" }));
  (input.memoryTopics ?? []).filter((r) => !q || r.toLowerCase().includes(q)).slice(0, 3)
    .forEach((r) => out.push({ text: r, kind: "recommended" }));
  if (q.length >= 2) {
    const doms = pickDomains(q);
    doms.slice(0, 3).forEach((d) => out.push({ text: `${q} in ${d}`, kind: "domain" }));
    out.push({ text: `Ask HAPPY: "${input.q}"`, kind: "ai" });
  }
  return out.slice(0, 8);
}

// ---------- OCR routing ----------
export function shouldSearchOcr(q: string, domains: SearchDomain[]): boolean {
  if (!domains.includes("files")) return false;
  return /\b(scan|scanned|receipt|invoice|whiteboard|slide|handwritten|image|photo|pdf|screenshot)\b/i.test(q);
}

// ---------- Voice pipeline shape ----------
export type VoiceSearchPlan = {
  transcript: string;
  mode: QueryMode;
  domains: SearchDomain[];
  time?: TimeWindow;
  digitalHumanExplain: boolean;
};
export function planVoiceSearch(transcript: string): VoiceSearchPlan {
  return {
    transcript,
    mode: classifyQuery(transcript),
    domains: pickDomains(transcript),
    time: extractTimeWindow(transcript),
    digitalHumanExplain: true,
  };
}

// ---------- Brain resolver hook ----------
export type BrainSearchHint = {
  q: string;
  mode: QueryMode;
  domains: SearchDomain[];
  time?: TimeWindow;
  ocr: boolean;
  workspaceId?: string;
};
export function resolveForBrain(q: string, ctx: RankContext & { workspaceId?: string } = {}): BrainSearchHint {
  const mode = classifyQuery(q);
  const domains = pickDomains(q);
  return {
    q,
    mode,
    domains,
    time: extractTimeWindow(q),
    ocr: shouldSearchOcr(q, domains),
    workspaceId: ctx.workspaceId,
  };
}

// ---------- Analytics snapshot ----------
export type SearchEvent = {
  q: string;
  domains: SearchDomain[];
  latencyMs: number;
  resultCount: number;
  clicked?: boolean;
  at: string;
};
export function analyticsSnapshot(events: SearchEvent[]) {
  const total = events.length;
  const success = events.filter((e) => e.resultCount > 0).length;
  const failure = total - success;
  const avgLatency = total ? Math.round(events.reduce((a, e) => a + e.latencyMs, 0) / total) : 0;
  const clickThrough = total ? events.filter((e) => e.clicked).length / total : 0;
  const topQueries = topN(events.map((e) => e.q.toLowerCase()), 5);
  const topDomains = topN(events.flatMap((e) => e.domains), 5);
  return { total, success, failure, avgLatency, clickThrough, topQueries, topDomains };
}
function topN(items: string[], n: number): Array<{ key: string; count: number }> {
  const h = new Map<string, number>();
  for (const i of items) h.set(i, (h.get(i) ?? 0) + 1);
  return Array.from(h.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
}
