/**
 * R38 — Founder Copilot Workspace server functions.
 * Orchestration-only. Every mutation requires auth and founder/company-admin
 * privileges (enforced inside the engine layer).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  actionCenter, approvalDecision, classifyIntent, commandHistory,
  dispatchCommand, executiveSearch, founderHealth, generateBriefing,
  getPrefs, listBriefings, listRecommendations, recordAiRecommendation,
  recordFactRecommendation, timeline, updateRecommendationStatus, upsertPrefs,
  type AiRecommendation, type BriefingPeriod, type CommandInput,
  type FactRecommendation, type WorkspacePrefs,
} from "./engine";

type Ctx = { supabase: unknown; userId: string };
type SB = SupabaseClient<Database>;
const sbOf = (c: Ctx) => c.supabase as SB;

/* ------------------------------ prefs ------------------------------ */

export const founderGetPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getPrefs(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId));

export const founderUpsertPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: WorkspacePrefs) => d)
  .handler(async ({ data, context }) =>
    upsertPrefs(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

/* ------------------------------ command router ---------------------- */

export const founderClassifyIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { command_text: string }) => d)
  .handler(async ({ data }) => classifyIntent(data.command_text));

export const founderDispatchCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CommandInput) => {
    if (!d?.command_text?.trim()) throw new Error("command_text required");
    return d;
  })
  .handler(async ({ data, context }) =>
    dispatchCommand(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

export const founderCommandHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { limit?: number }) => d ?? {})
  .handler(async ({ data, context }) =>
    commandHistory(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data.limit));

/* ------------------------------ timeline ---------------------------- */

export const founderTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string | null; category?: string; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) =>
    timeline(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

/* ------------------------------ action center ----------------------- */

export const founderActionCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string | null }) => d ?? {})
  .handler(async ({ data, context }) =>
    actionCenter(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data.company_id ?? null));

/* ------------------------------ approvals --------------------------- */

export const founderApprovalDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { approval_id: string; decision: "approve" | "reject"; note?: string }) => {
    if (!d.approval_id) throw new Error("approval_id required");
    if (d.decision !== "approve" && d.decision !== "reject") throw new Error("decision must be approve|reject");
    return d;
  })
  .handler(async ({ data, context }) =>
    approvalDecision(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

/* ------------------------------ briefings --------------------------- */

export const founderGenerateBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period: BriefingPeriod; company_id?: string | null }) => {
    if (!["daily","weekly","monthly","quarterly","annual"].includes(d.period))
      throw new Error("invalid period");
    return d;
  })
  .handler(async ({ data, context }) =>
    generateBriefing(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data.period, data.company_id ?? null));

export const founderListBriefings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { period?: BriefingPeriod; company_id?: string | null; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) =>
    listBriefings(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

/* ------------------------------ recommendations --------------------- */

export const founderRecordFactRec = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: FactRecommendation) => {
    if (!d.title || !d.category || !d.source_runtime) throw new Error("title, category, source_runtime required");
    return d;
  })
  .handler(async ({ data, context }) =>
    recordFactRecommendation(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

export const founderRecordAiRec = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AiRecommendation) => {
    if (!d.title || !d.category || !d.source_runtime) throw new Error("title, category, source_runtime required");
    if (typeof d.confidence !== "number") throw new Error("confidence required for ai recs");
    return d;
  })
  .handler(async ({ data, context }) =>
    recordAiRecommendation(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

export const founderListRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind?: "fact" | "ai"; company_id?: string | null; status?: string; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) =>
    listRecommendations(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

export const founderUpdateRecommendationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "acknowledged" | "dismissed" | "actioned" | "expired" }) => {
    if (!d.id) throw new Error("id required");
    if (!["acknowledged","dismissed","actioned","expired"].includes(d.status))
      throw new Error("invalid status");
    return d;
  })
  .handler(async ({ data, context }) =>
    updateRecommendationStatus(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data));

/* ------------------------------ health & search --------------------- */

export const founderHealthOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string | null }) => d ?? {})
  .handler(async ({ data, context }) =>
    founderHealth(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data.company_id ?? null));

export const founderExecutiveSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { query: string; limit?: number; company_id?: string | null }) => {
    if (!d?.query?.trim()) throw new Error("query required");
    return d;
  })
  .handler(async ({ data, context }) =>
    executiveSearch(sbOf(context as unknown as Ctx), (context as unknown as Ctx).userId, data.query, {
      limit: data.limit, company_id: data.company_id ?? null,
    }));
