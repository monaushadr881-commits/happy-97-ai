/**
 * R189 Batch 13 — Digital Human™ Runtime Adoption (Canonical Extension)
 *
 * Extends the existing canonical Digital Human owner
 * (src/lib/digital-human-v1.functions.ts) with pipeline-adopted session
 * capabilities: Conversation, Voice, Avatar. No new brain, no new runtime,
 * no new tables, no new dashboard. Persistence lands in public.creator_assets
 * (kind: "digital_human.<module>") — dh_sessions/dh_preferences retained.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { withBrain } from "@/lib/founder/with-brain";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import type { FounderApprovalContext } from "@/lib/founder/types";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const uuid = z.string().uuid();

type DhModule = "conversation" | "voice" | "avatar";
interface Impact { severity: "info" | "notice" | "warning" | "critical"; requires_approval: boolean; reason: string; }

const analyze = withBrain<{ module: DhModule; duration_ms: number; sensitive: boolean }, Impact>({
  capability: "digital_human.impact",
  handler: ({ module, duration_ms, sensitive }) => {
    if (sensitive) return { severity: "warning", requires_approval: true, reason: "sensitive_session" };
    if (module === "voice" && duration_ms >= 60 * 60_000) {
      return { severity: "notice", requires_approval: false, reason: "long_voice_session" };
    }
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

interface Submit {
  module: DhModule;
  reference: string;
  duration_ms: number;
  sensitive: boolean;
  company_id?: string;
  workspace_id?: string;
  tags: string[];
  payload: Record<string, unknown>;
}

async function runDhPipeline(
  data: Submit,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
) {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "digital-human", module: data.module, capability: "submit",
    user_id: context.userId, company_id: data.company_id ?? ZERO_UUID,
    metadata: { duration_ms: data.duration_ms, sensitive: data.sensitive },
  });
  const brain = await analyze({
    capability: "digital_human.impact",
    input: { module: data.module, duration_ms: data.duration_ms, sensitive: data.sensitive },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `digital_human.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id, entity_type: kind, entity_id: crypto.randomUUID(),
        title: `Digital Human · ${data.module} · ${data.reference}`,
        reason: brain.output.reason, currency: "INR",
        metadata: { source: "digital-human", module: data.module, payload: data.payload, impact: brain.output },
      },
    });
    return { status: "pending_approval" as const, impact: brain.output, approval_id: approval.id, approval_status: approval.status };
  }
  const meta = {
    domain: "digital-human", module: data.module, reference: data.reference,
    workspace_id: data.workspace_id ?? null, company_id: data.company_id ?? null,
    duration_ms: data.duration_ms, sensitive: data.sensitive,
    payload: data.payload, impact: brain.output,
    brain_duration_ms: brain.durationMs, version: 1, recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId, kind,
      mime_type: "application/x-happy-digital-human+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "digital-human", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`dh_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "digital-human", action: `${data.module}.record`,
    entity_type: "creator_asset", entity_id: record.id,
    company_id: data.company_id ?? undefined, after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, duration_ms: data.duration_ms },
  });
  return { status: "recorded" as const, record, impact: brain.output };
}

const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Conversation Runtime™ — adopt a HAPPY conversation turn/session summary. */
export const dhConversationSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      conversation_ref: z.string().min(1).max(160),
      mode: z.string().min(1).max(80).default("assistant"),
      summary: z.string().min(1).max(4000),
      turns: z.number().int().min(0).max(10_000).default(0),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "conversation", reference: data.conversation_ref, duration_ms: 0, sensitive: data.sensitive,
        company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { mode: data.mode, summary: data.summary, turns: data.turns },
      },
      context,
    ),
  );

/** Voice Session™ — record a voice session envelope through the pipeline. */
export const dhVoiceSessionRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      voice_ref: z.string().min(1).max(160),
      duration_ms: z.number().int().min(0).max(24 * 3_600_000).default(0),
      transcript_summary: z.string().max(4000).optional(),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "voice", reference: data.voice_ref, duration_ms: data.duration_ms, sensitive: data.sensitive,
        company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { transcript_summary: data.transcript_summary ?? null },
      },
      context,
    ),
  );

/** Avatar Session™ — register an avatar surface envelope through the pipeline. */
export const dhAvatarSessionRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      avatar_ref: z.string().min(1).max(160),
      surface: z.enum(["classroom", "boardroom", "presentation", "whiteboard", "hall"]).default("presentation"),
      duration_ms: z.number().int().min(0).max(24 * 3_600_000).default(0),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "avatar", reference: data.avatar_ref, duration_ms: data.duration_ms, sensitive: data.sensitive,
        company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { surface: data.surface },
      },
      context,
    ),
  );

/** List Digital Human runtime envelopes (adopted through the pipeline). */
export const dhRuntimeList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(["conversation", "voice", "avatar"]).optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `digital_human.${data.module}` : "digital_human.%";
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(`dh_runtime_list_failed: ${error.message}`);
    return { items: rows ?? [] };
  });
