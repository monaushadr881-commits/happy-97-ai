/**
 * R189 Batch 13 — AI Experience Engine™ (Canonical Owner)
 *
 * SINGLE canonical owner for Emotion Context, Interaction History, Recap.
 * Reuses withBrain, adoptToCanonicalPipeline, R158 approval, writeCanonicalAudit,
 * public.creator_assets (kind: "experience.*"), founderMissionControl (auto).
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

interface Impact { severity: "info" | "notice" | "warning" | "critical"; requires_approval: boolean; reason: string; }
type ExpModule = "emotion" | "interaction" | "recap";

const analyze = withBrain<{ module: ExpModule; intensity: number; sensitive: boolean }, Impact>({
  capability: "experience.impact",
  handler: ({ module, intensity, sensitive }) => {
    if (sensitive) return { severity: "warning", requires_approval: true, reason: "sensitive_experience" };
    if (module === "emotion" && intensity >= 90) return { severity: "warning", requires_approval: false, reason: "high_intensity" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

interface Submit {
  module: ExpModule;
  reference: string;
  intensity: number;
  sensitive: boolean;
  company_id?: string;
  workspace_id?: string;
  tags: string[];
  payload: Record<string, unknown>;
}

async function runExpPipeline(
  data: Submit,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
) {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "experience", module: data.module, capability: "submit",
    user_id: context.userId, company_id: data.company_id ?? ZERO_UUID,
    metadata: { intensity: data.intensity, sensitive: data.sensitive },
  });
  const brain = await analyze({
    capability: "experience.impact",
    input: { module: data.module, intensity: data.intensity, sensitive: data.sensitive },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `experience.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id, entity_type: kind, entity_id: crypto.randomUUID(),
        title: `Experience · ${data.module} · ${data.reference}`,
        reason: brain.output.reason, currency: "INR",
        metadata: { source: "experience", module: data.module, payload: data.payload, impact: brain.output },
      },
    });
    return { status: "pending_approval" as const, impact: brain.output, approval_id: approval.id, approval_status: approval.status };
  }
  const meta = {
    domain: "experience", module: data.module, reference: data.reference,
    workspace_id: data.workspace_id ?? null, company_id: data.company_id ?? null,
    intensity: data.intensity, sensitive: data.sensitive,
    payload: data.payload, impact: brain.output,
    brain_duration_ms: brain.durationMs, version: 1, recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId, kind,
      mime_type: "application/x-happy-experience+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "experience", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`experience_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "experience", action: `${data.module}.record`,
    entity_type: "creator_asset", entity_id: record.id,
    company_id: data.company_id ?? undefined, after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, intensity: data.intensity },
  });
  return { status: "recorded" as const, record, impact: brain.output };
}

const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Emotion Context — opt-in emotion signal recorded through the pipeline. */
export const experienceEmotionRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      emotion_ref: z.string().min(1).max(160),
      subject: z.string().min(1).max(200),
      emotion: z.string().min(1).max(80),
      intensity: z.number().int().min(0).max(100).default(50),
      sensitive: z.boolean().default(false),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runExpPipeline(
      {
        module: "emotion", reference: data.emotion_ref, intensity: data.intensity,
        sensitive: data.sensitive, company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { subject: data.subject, emotion: data.emotion, notes: data.notes ?? null },
      },
      context,
    ),
  );

/** Interaction History — append a Digital Human interaction summary. */
export const experienceInteractionAppend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      interaction_ref: z.string().min(1).max(160),
      channel: z.enum(["chat", "voice", "avatar", "presentation", "classroom", "boardroom"]).default("chat"),
      summary: z.string().min(1).max(4000),
      duration_ms: z.number().int().min(0).max(24 * 3_600_000).default(0),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runExpPipeline(
      {
        module: "interaction", reference: data.interaction_ref, intensity: 0,
        sensitive: data.sensitive, company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { channel: data.channel, summary: data.summary, duration_ms: data.duration_ms },
      },
      context,
    ),
  );

/** Recap — persist a session/day recap through the pipeline. */
export const experienceRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      recap_ref: z.string().min(1).max(160),
      period: z.enum(["session", "day", "week"]).default("session"),
      highlights: z.array(z.string().min(1).max(500)).min(1).max(30),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runExpPipeline(
      {
        module: "recap", reference: data.recap_ref, intensity: 0, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { period: data.period, highlights: data.highlights },
      },
      context,
    ),
  );

/** List experience entries. */
export const experienceList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(["emotion", "interaction", "recap"]).optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `experience.${data.module}` : "experience.%";
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(`experience_list_failed: ${error.message}`);
    return { items: rows ?? [] };
  });
