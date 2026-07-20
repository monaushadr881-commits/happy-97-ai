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
import { memoryCache } from "@/lib/founder/read-cache";
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

/**
 * R190 Batch 1 — HAPPY™ Canonical Avatar exposure.
 * Read-only server function returning the frozen canonical avatar profile.
 * Reuses this Digital Human runtime; no new module, table, or dashboard.
 */
import {
  HAPPY_CANONICAL_AVATAR,
  HAPPY_CONVERSATION_MODES,
  HAPPY_VOICE_MODES,
  HAPPY_EXPRESSION_LIBRARY,
  HAPPY_PRESENTATION_MODES,
} from "@/lib/digital-human/canonical-avatar";

export const dhCanonicalAvatar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ avatar: HAPPY_CANONICAL_AVATAR }));

/**
 * R190 Batch 2 — Canonical mode libraries.
 * Read-only aggregation reusing the same runtime. Mission Control consumes
 * these via the existing Digital Human runtime — no new dashboard/module.
 */
export const dhCanonicalModes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    avatar_id: HAPPY_CANONICAL_AVATAR.id,
    conversation_modes: HAPPY_CONVERSATION_MODES,
    voice_modes: HAPPY_VOICE_MODES,
    expressions: HAPPY_EXPRESSION_LIBRARY,
    presentation_modes: HAPPY_PRESENTATION_MODES,
  }));

/**
 * R190 Batch 3 — Production Experience™
 *
 * Extends the SINGLE HAPPY™ Canonical Avatar with production experience
 * handlers: Founder Welcome, Context Greeting, Session Resume, Multi-step
 * Conversation, Presentation Narration, Knowledge Explanation, Workspace &
 * Mission Control Walkthroughs, Domain Consultations, Voice Mode Switch,
 * and Runtime Health. All routes through `runDhPipeline` → withBrain →
 * Approval (if required) → Audit → Execution. No new avatar/runtime/table.
 */

const ExpBase = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
  voice_mode: z.enum(["professional", "friendly", "motivational", "executive", "educational"]).default("professional"),
  expression: z.string().min(1).max(40).default("greeting"),
};

type ConsultDomain =
  | "business" | "revenue" | "education" | "healthcare"
  | "manufacturing" | "agriculture" | "marketplace";

/** Founder Welcome™ — canonical greeting for the Founder. */
export const dhFounderWelcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ ...ExpBase, surface: z.string().min(1).max(80).default("mission-control") }).parse(i ?? {}),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "conversation", reference: `founder-welcome:${data.surface}`, duration_ms: 0, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "founder-welcome"],
        payload: { experience: "founder-welcome", surface: data.surface, voice_mode: data.voice_mode, expression: data.expression, mode: "founder-mode" },
      },
      context,
    ),
  );

/** Context-aware Greeting™ — surface/time/role-aware. */
export const dhContextGreeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      surface: z.string().min(1).max(80),
      hour_of_day: z.number().int().min(0).max(23).optional(),
      role: z.string().min(1).max(80).default("founder"),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "conversation", reference: `context-greeting:${data.surface}`, duration_ms: 0, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "context-greeting"],
        payload: { experience: "context-greeting", surface: data.surface, hour_of_day: data.hour_of_day ?? null, role: data.role, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    ),
  );

/** Session Resume™ — reader: latest experience envelopes to resume. */
export const dhSessionResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      limit: z.number().int().min(1).max(50).default(10),
      module: z.enum(["conversation", "voice", "avatar"]).optional(),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `digital_human.${data.module}` : "digital_human.%";
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(`dh_session_resume_failed: ${error.message}`);
    return { avatar_id: HAPPY_CANONICAL_AVATAR.id, sessions: rows ?? [] };
  });

/** Multi-step Conversation™ — record a multi-turn segment. */
export const dhMultiStepConverse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      conversation_ref: z.string().min(1).max(160),
      step: z.number().int().min(0).max(10_000),
      total_steps: z.number().int().min(1).max(10_000),
      summary: z.string().min(1).max(4000),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "conversation", reference: `multistep:${data.conversation_ref}:${data.step}`, duration_ms: 0, sensitive: data.sensitive,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "multistep"],
        payload: { experience: "multistep", step: data.step, total_steps: data.total_steps, summary: data.summary, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    ),
  );

/** Presentation Narration™ — narrate a presentation as canonical avatar. */
export const dhPresentationNarrate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      presentation_ref: z.string().min(1).max(160),
      mode: z.enum(["meeting", "training", "business-pitch", "product-demo", "dashboard-review", "founder-briefing"]).default("business-pitch"),
      slide_count: z.number().int().min(1).max(1000).default(1),
      duration_ms: z.number().int().min(0).max(24 * 3_600_000).default(0),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "avatar", reference: `narration:${data.presentation_ref}`, duration_ms: data.duration_ms, sensitive: data.sensitive,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "narration", data.mode],
        payload: { experience: "presentation-narration", surface: "presentation", mode: data.mode, slide_count: data.slide_count, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    ),
  );

/** Knowledge Explanation™ — explain a Knowledge entry through the avatar. */
export const dhKnowledgeExplain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      knowledge_ref: z.string().min(1).max(160),
      summary: z.string().min(1).max(4000),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "conversation", reference: `knowledge:${data.knowledge_ref}`, duration_ms: 0, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "knowledge"],
        payload: { experience: "knowledge-explain", knowledge_ref: data.knowledge_ref, summary: data.summary, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    ),
  );

/** Workspace Walkthrough™ — canonical avatar guides a workspace tour. */
export const dhWorkspaceWalkthrough = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      workspace_ref: z.string().min(1).max(160),
      steps: z.number().int().min(1).max(200).default(1),
      duration_ms: z.number().int().min(0).max(24 * 3_600_000).default(0),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "avatar", reference: `workspace-walkthrough:${data.workspace_ref}`, duration_ms: data.duration_ms, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "workspace-walkthrough"],
        payload: { experience: "workspace-walkthrough", surface: "boardroom", steps: data.steps, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    ),
  );

/** Mission Control Walkthrough™ — canonical avatar guides Mission Control. */
export const dhMissionControlWalkthrough = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      focus: z.string().min(1).max(160).default("overview"),
      steps: z.number().int().min(1).max(200).default(1),
      duration_ms: z.number().int().min(0).max(24 * 3_600_000).default(0),
    }).parse(i ?? {}),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "avatar", reference: `mission-control:${data.focus}`, duration_ms: data.duration_ms, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "mission-control-walkthrough"],
        payload: { experience: "mission-control-walkthrough", surface: "hall", focus: data.focus, steps: data.steps, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    ),
  );

/** Consultation™ — single handler covering Business / Revenue / Education / Healthcare / Manufacturing / Agriculture / Marketplace. */
export const dhConsult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      domain: z.enum(["business", "revenue", "education", "healthcare", "manufacturing", "agriculture", "marketplace"]),
      topic: z.string().min(1).max(200),
      summary: z.string().min(1).max(4000),
      sensitive: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) => {
    const domain: ConsultDomain = data.domain;
    return runDhPipeline(
      {
        module: "conversation", reference: `consult:${domain}:${data.topic.slice(0, 80)}`, duration_ms: 0, sensitive: data.sensitive,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "consultation", domain],
        payload: { experience: "consultation", domain, topic: data.topic, summary: data.summary, voice_mode: data.voice_mode, expression: data.expression },
      },
      context,
    );
  });

/** Voice Mode Switch™ — runtime switch of the canonical avatar voice mode. */
export const dhVoiceModeSwitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ExpBase,
      from_mode: z.enum(["professional", "friendly", "motivational", "executive", "educational"]),
      to_mode: z.enum(["professional", "friendly", "motivational", "executive", "educational"]),
      reason: z.string().min(1).max(240).default("runtime-switch"),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runDhPipeline(
      {
        module: "voice", reference: `voice-mode-switch:${data.from_mode}->${data.to_mode}`, duration_ms: 0, sensitive: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        tags: [...data.tags, "experience", "voice-mode-switch"],
        payload: { experience: "voice-mode-switch", from_mode: data.from_mode, to_mode: data.to_mode, reason: data.reason, expression: data.expression },
      },
      context,
    ),
  );

/** Runtime Health™ — Mission Control aggregation over existing runtime rows. */
export const dhRuntimeHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("kind,created_at")
      .like("kind", "digital_human.%")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(`dh_runtime_health_failed: ${error.message}`);
    const items = (rows ?? []) as Array<{ kind: string; created_at: string }>;
    const counts = { conversation: 0, voice: 0, avatar: 0 };
    let latest: string | null = null;
    for (const r of items) {
      const m = r.kind.split(".")[1] as keyof typeof counts | undefined;
      if (m && m in counts) counts[m] += 1;
      if (!latest || r.created_at > latest) latest = r.created_at;
    }
    return {
      avatar_id: HAPPY_CANONICAL_AVATAR.id,
      status: "operational" as const,
      total_sessions: items.length,
      conversation_sessions: counts.conversation,
      voice_sessions: counts.voice,
      presentation_sessions: counts.avatar,
      latest_session_at: latest,
    };
  });
