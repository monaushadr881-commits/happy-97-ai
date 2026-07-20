/**
 * R191 Batch 14 — HAPPY™ Memory / Experience / Digital Human Continuum
 *
 * NO new runtime, NO new avatar, NO new tables, NO new dashboard.
 *
 * Canonical owners reused:
 *   • Memory Runtime       → src/lib/memory/memory.functions.ts
 *   • Experience Runtime   → src/lib/experience/experience.functions.ts
 *   • Digital Human RT     → src/lib/digital-human/digital-human-runtime.functions.ts
 *   • Canonical Avatar     → src/lib/digital-human/canonical-avatar.ts
 *   • Knowledge Runtime    → src/lib/knowledge/knowledge-runtime.functions.ts (knUniversalSearch)
 *   • Workspace store      → public.creator_assets (memory.* | experience.* | digital_human.*)
 *   • Pipeline / Brain     → adoptToCanonicalPipeline / withBrain
 *   • Audit / Approval     → writeCanonicalAudit / requestFounderApproval
 *   • Mission Control      → founderMissionControl (auto via pipeline.<domain>.*)
 *
 * This module composes existing canonical handlers into higher-order,
 * pipeline-adopted read/aggregation surfaces required by Batch 14:
 * Search, Conversation History, Session Continuation, Timelines, Summaries,
 * Emotion History, DH Conversation/Personalization/Workspace/Knowledge
 * Context, and Analytics/Health for all three domains.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import { HAPPY_CANONICAL_AVATAR } from "@/lib/digital-human/canonical-avatar";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const uuid = z.string().uuid();

type Domain = "memory" | "experience" | "digital-human";
const KIND_PREFIX: Record<Domain, string> = {
  memory: "memory.",
  experience: "experience.",
  "digital-human": "digital_human.",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonMeta = any;
interface AssetRow {
  id: string; name: string; kind: string; tags: string[] | null;
  metadata: JsonMeta; created_at: string;
}

async function readAssets(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  kindLike: string,
  limit: number,
  query?: string,
): Promise<AssetRow[]> {
  let q = supabase
    .from("creator_assets")
    .select("id,name,kind,tags,metadata,created_at")
    .eq("user_id", userId)
    .like("kind", kindLike)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (query) q = q.ilike("name", `%${query.slice(0, 80)}%`);
  const { data, error } = await q;
  if (error) throw new Error(`continuum_read_failed: ${error.message}`);
  return (data ?? []) as AssetRow[];
}

async function adopt(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  domain: Domain,
  module: string,
  capability: string,
  metadata: Record<string, unknown> = {},
) {
  await adoptToCanonicalPipeline(supabase, {
    domain, module, capability,
    user_id: userId, company_id: ZERO_UUID, metadata,
  });
}

const Base = { company_id: uuid.optional(), workspace_id: uuid.optional() };

/* ─────────────────────────────  MEMORY  ────────────────────────────── */

/** Memory Timeline — chronological memory feed via canonical vault. */
export const memoryTimelineView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "memory", "timeline", "view", { limit: data.limit });
    const items = await readAssets(context.supabase, context.userId, "memory.timeline", data.limit);
    return { items };
  });

/** Memory Search — canonical name/tag ilike across memory vault. */
export const memorySearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ query: z.string().min(1).max(200), limit: z.number().int().min(1).max(100).default(25) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "memory", "search", "query", { q: data.query });
    const items = await readAssets(context.supabase, context.userId, "memory.%", data.limit, data.query);
    return { items };
  });

/** Memory Analytics — counts, latest, module distribution. */
export const memoryAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "memory", "analytics", "compute");
    const items = await readAssets(context.supabase, context.userId, "memory.%", 500);
    const by_module: Record<string, number> = {};
    for (const r of items) by_module[r.kind] = (by_module[r.kind] ?? 0) + 1;
    return {
      total: items.length,
      by_module,
      latest: items[0]?.created_at ?? null,
      last_recall: items.find((i) => i.kind === "memory.recall")?.created_at ?? null,
    };
  });

/* ───────────────────────────  EXPERIENCE  ──────────────────────────── */

/** Experience Timeline — chronological experience feed. */
export const experienceTimelineView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "experience", "timeline", "view", { limit: data.limit });
    const items = await readAssets(context.supabase, context.userId, "experience.%", data.limit);
    return { items };
  });

/** Experience Summary — recap-first summary aggregation. */
export const experienceSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(10) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "experience", "recap", "summary");
    const recaps = await readAssets(context.supabase, context.userId, "experience.recap", data.limit);
    const highlights = recaps.flatMap((r) => {
      const p = (r.metadata?.payload ?? {}) as { highlights?: string[] };
      return Array.isArray(p.highlights) ? p.highlights : [];
    });
    return { recaps, highlights: highlights.slice(0, 50) };
  });

/** Emotion History — emotion-only feed with intensity trend. */
export const experienceEmotionHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "experience", "emotion", "history");
    const items = await readAssets(context.supabase, context.userId, "experience.emotion", data.limit);
    const intensities = items
      .map((r) => Number((r.metadata as { intensity?: number } | null)?.intensity ?? 0))
      .filter((n) => Number.isFinite(n));
    const avg = intensities.length ? Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length) : 0;
    return { items, average_intensity: avg, samples: intensities.length };
  });

/** Experience Analytics — module distribution + sensitivity ratio. */
export const experienceAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "experience", "analytics", "compute");
    const items = await readAssets(context.supabase, context.userId, "experience.%", 500);
    const by_module: Record<string, number> = {};
    let sensitive = 0;
    for (const r of items) {
      by_module[r.kind] = (by_module[r.kind] ?? 0) + 1;
      if ((r.metadata as { sensitive?: boolean } | null)?.sensitive) sensitive += 1;
    }
    return { total: items.length, by_module, sensitive, latest: items[0]?.created_at ?? null };
  });

/* ─────────────────────────  DIGITAL HUMAN  ─────────────────────────── */

/** Conversation History — DH conversation-kind sessions. */
export const dhConversationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "conversation", "history");
    const items = await readAssets(context.supabase, context.userId, "digital_human.conversation", data.limit);
    return { items };
  });

/** Session Continuation — resume most recent DH session with memory recall. */
export const dhSessionContinuation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "conversation", "continue");
    const [dh, mem, exp] = await Promise.all([
      readAssets(context.supabase, context.userId, "digital_human.%", 5),
      readAssets(context.supabase, context.userId, "memory.timeline", 5),
      readAssets(context.supabase, context.userId, "experience.recap", 3),
    ]);
    return {
      resume_from: dh[0] ?? null,
      recent_sessions: dh,
      recall: mem,
      last_recaps: exp,
      avatar: HAPPY_CANONICAL_AVATAR.identity,
    };
  });

/** DH Conversation Context — packaged context for the next turn. */
export const dhConversationContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ...Base }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "conversation", "context", {
      workspace_id: data.workspace_id ?? null,
    });
    const [dh, mem, exp] = await Promise.all([
      readAssets(context.supabase, context.userId, "digital_human.conversation", 10),
      readAssets(context.supabase, context.userId, "memory.timeline", 10),
      readAssets(context.supabase, context.userId, "experience.emotion", 10),
    ]);
    return {
      avatar: HAPPY_CANONICAL_AVATAR.identity,
      capabilities: HAPPY_CANONICAL_AVATAR.capabilities,
      recent_turns: dh,
      memory_recall: mem,
      recent_emotion: exp[0] ?? null,
    };
  });

/** DH Personalization — preferences derived from canonical vault. */
export const dhPersonalization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "avatar", "personalization");
    const emotions = await readAssets(context.supabase, context.userId, "experience.emotion", 25);
    const tally: Record<string, number> = {};
    for (const r of emotions) {
      const e = String(((r.metadata as { payload?: { emotion?: string } } | null)?.payload?.emotion) ?? "neutral");
      tally[e] = (tally[e] ?? 0) + 1;
    }
    const dominant = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";
    return {
      avatar_id: HAPPY_CANONICAL_AVATAR.id,
      preferred_voice: HAPPY_CANONICAL_AVATAR.voices[0]?.locale ?? "en-IN",
      preferred_mode: HAPPY_CANONICAL_AVATAR.capabilities[0] ?? "conversation",
      dominant_emotion: dominant,
      emotion_tally: tally,
    };
  });

/** DH Workspace Context — recent workspace assets around the DH. */
export const dhWorkspaceContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(100).default(25) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "avatar", "workspace_context");
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(`dh_workspace_context_failed: ${error.message}`);
    return { assets: rows ?? [] };
  });

/** DH Knowledge Context — pull latest knowledge articles for grounding. */
export const dhKnowledgeContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(10) }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "avatar", "knowledge_context");
    const { data: articles } = await context.supabase
      .from("knowledge_articles")
      .select("id,title,summary,updated_at")
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    return { articles: articles ?? [] };
  });

/** DH Analytics — session counts, avg duration, sensitive ratio. */
export const dhAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "digital-human", "analytics", "compute");
    const items = await readAssets(context.supabase, context.userId, "digital_human.%", 500);
    const by_module: Record<string, number> = {};
    let totalMs = 0, sensitive = 0;
    for (const r of items) {
      by_module[r.kind] = (by_module[r.kind] ?? 0) + 1;
      const m = r.metadata as { duration_ms?: number; sensitive?: boolean } | null;
      totalMs += Number(m?.duration_ms ?? 0);
      if (m?.sensitive) sensitive += 1;
    }
    return {
      total_sessions: items.length,
      by_module,
      average_duration_ms: items.length ? Math.round(totalMs / items.length) : 0,
      sensitive,
    };
  });

/** Continuum Health — Mission Control feed across Memory/Experience/DH. */
export const continuumHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [mem, exp, dh] = await Promise.all([
      readAssets(context.supabase, context.userId, "memory.%", 1),
      readAssets(context.supabase, context.userId, "experience.%", 1),
      readAssets(context.supabase, context.userId, "digital_human.%", 1),
    ]);
    await writeCanonicalAudit(context.supabase, {
      category: "mission_control",
      action: "continuum.health",
      entity_type: "continuum", entity_id: context.userId,
      severity: "info",
      metadata: { memory: !!mem[0], experience: !!exp[0], digital_human: !!dh[0] },
    });
    return {
      memory: { last: mem[0]?.created_at ?? null, healthy: true },
      experience: { last: exp[0]?.created_at ?? null, healthy: true },
      digital_human: { last: dh[0]?.created_at ?? null, healthy: true },
      avatar: HAPPY_CANONICAL_AVATAR.identity,
    };
  });
