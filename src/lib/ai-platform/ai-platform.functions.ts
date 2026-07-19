/**
 * R189 Batch 11 — AI Platform Runtime (Canonical Owner)
 *
 * SINGLE canonical owner for the AI Platform surface:
 *   • AI Agent Orchestra™
 *   • AI Model Hub™
 *   • AI Skill Marketplace™
 *   • AI Prompt Studio™
 *   • Universal AI Router™
 *   • AI Research Laboratory™
 *   • AI Innovation Tracker™
 *   • AI Cost Optimizer™
 *
 * Canonical Scan (reused, NEVER duplicated):
 *   brain / runtime      → src/lib/founder/with-brain.ts + public.brain_sessions
 *   knowledge            → public.ai_knowledge_documents (via existing runtime)
 *   universal search     → src/lib/founder/search.functions.ts
 *   workspace / assets   → public.creator_assets (kind: "ai.<module>")
 *   approvals            → requestFounderApproval (R158 · public.approvals)
 *   audit                → writeCanonicalAudit → public.audit_logs
 *   pipeline adoption    → adoptToCanonicalPipeline (audit_logs pipeline.ai.*)
 *   mission control      → founderMissionControl (auto-aggregated by pipeline.ai)
 *
 * NO new tables. NO new engine. NO new dashboard. NO new AI Runtime.
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
const APPROVAL_THRESHOLD_CENTS = 1_00_00_000; // ₹1,00,000

export const AI_MODULES = [
  "orchestra",
  "model",
  "skill",
  "prompt",
  "router",
  "research",
  "innovation",
  "cost",
] as const;
export type AiModule = typeof AI_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: AiModule; cost_cents: number; critical: boolean },
  Impact
>({
  capability: "ai.impact",
  handler: ({ module, cost_cents, critical }) => {
    if (critical) {
      return { severity: "critical", requires_approval: true, reason: "critical_ai_action" };
    }
    if (cost_cents >= APPROVAL_THRESHOLD_CENTS) {
      return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    }
    if (module === "router" || module === "cost") {
      return { severity: "notice", requires_approval: false, reason: "governance_module" };
    }
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  currency: z.string().min(3).max(8).default("INR"),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

interface Submit {
  module: AiModule;
  reference: string;
  cost_cents: number;
  critical: boolean;
  company_id?: string;
  workspace_id?: string;
  currency: string;
  tags: string[];
  payload: Record<string, unknown>;
}

interface SubmitResult {
  status: "recorded" | "pending_approval";
  record?: { id: string; name: string; kind: string; created_at: string };
  impact: Impact;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
}

async function runAiPipeline(
  data: Submit,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "ai",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: data.company_id ?? ZERO_UUID,
    metadata: { cost_cents: data.cost_cents, currency: data.currency, critical: data.critical },
  });
  const brain = await analyze({
    capability: "ai.impact",
    input: { module: data.module, cost_cents: data.cost_cents, critical: data.critical },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `ai.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `ai.${data.module}`,
        entity_id: crypto.randomUUID(),
        title: `AI · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents || undefined,
        currency: data.currency,
        metadata: {
          source: "ai-platform", module: data.module,
          payload: data.payload, impact: brain.output,
          brain_duration_ms: brain.durationMs,
          threshold_cents: APPROVAL_THRESHOLD_CENTS,
        },
      },
    });
    return {
      status: "pending_approval", impact: brain.output,
      approval_id: approval.id, approval_status: approval.status,
    };
  }
  const meta = {
    domain: "ai", module: data.module, reference: data.reference,
    workspace_id: data.workspace_id ?? null, company_id: data.company_id ?? null,
    cost_cents: data.cost_cents, currency: data.currency,
    payload: data.payload, impact: brain.output,
    brain_duration_ms: brain.durationMs, version: 1,
    recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId, kind,
      mime_type: "application/x-happy-ai+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "ai", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`ai_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "ai",
    action: `${data.module}.record`,
    entity_type: "creator_asset",
    entity_id: record.id,
    company_id: data.company_id ?? undefined,
    after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, impact: brain.output },
  });
  return { status: "recorded", record, impact: brain.output };
}

/** AI Agent Orchestra™ — register/update an orchestrated agent lineup. */
export const aiOrchestraRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      orchestra_ref: z.string().min(1).max(160),
      title: z.string().min(1).max(200),
      agents: z.array(z.object({
        agent: z.string().min(1).max(160),
        role: z.string().min(1).max(120),
        model: z.string().min(1).max(160).optional(),
      })).min(1).max(50),
      cost_cents: z.number().int().nonnegative().default(0),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "orchestra", reference: data.orchestra_ref,
        cost_cents: data.cost_cents, critical: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: { title: data.title, agents: data.agents, notes: data.notes ?? null },
      },
      context,
    ),
  );

/** AI Model Hub™ — register a model entry in the hub. */
export const aiModelRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      model_ref: z.string().min(1).max(160),
      vendor: z.string().min(1).max(120),
      family: z.string().min(1).max(120),
      modalities: z.array(z.enum(["text","image","audio","video","embedding"])).min(1).max(8),
      status: z.enum(["preview","stable","deprecated","internal"]).default("stable"),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "model", reference: data.model_ref,
        cost_cents: 0, critical: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          vendor: data.vendor, family: data.family,
          modalities: data.modalities, status: data.status,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** AI Skill Marketplace™ — publish/update a canonical AI skill listing. */
export const aiSkillPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      skill_ref: z.string().min(1).max(160),
      title: z.string().min(1).max(200),
      version: z.string().min(1).max(40).default("1.0.0"),
      price_cents: z.number().int().nonnegative().default(0),
      capability: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "skill", reference: `${data.skill_ref}:${data.version}`,
        cost_cents: data.price_cents, critical: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          title: data.title, version: data.version,
          capability: data.capability, price_cents: data.price_cents,
          description: data.description ?? null,
        },
      },
      context,
    ),
  );

/** AI Prompt Studio™ — save a versioned prompt. */
export const aiPromptSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      prompt_ref: z.string().min(1).max(160),
      title: z.string().min(1).max(200),
      version: z.string().min(1).max(40).default("1.0.0"),
      body: z.string().min(1).max(20000),
      variables: z.array(z.string().min(1).max(80)).max(64).default([]),
      target_models: z.array(z.string().min(1).max(160)).max(24).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "prompt", reference: `${data.prompt_ref}:${data.version}`,
        cost_cents: 0, critical: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          title: data.title, version: data.version,
          body: data.body, variables: data.variables,
          target_models: data.target_models,
        },
      },
      context,
    ),
  );

/** Universal AI Router™ — record/update a routing rule. */
export const aiRouterConfigure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      rule_ref: z.string().min(1).max(160),
      match: z.object({
        capability: z.string().min(1).max(200),
        modality: z.enum(["text","image","audio","video","embedding"]).default("text"),
      }),
      route_to: z.string().min(1).max(160),
      fallback: z.array(z.string().min(1).max(160)).max(8).default([]),
      priority: z.number().int().min(0).max(1000).default(100),
      enabled: z.boolean().default(true),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "router", reference: data.rule_ref,
        cost_cents: 0, critical: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          match: data.match, route_to: data.route_to,
          fallback: data.fallback, priority: data.priority,
          enabled: data.enabled,
        },
      },
      context,
    ),
  );

/** AI Research Laboratory™ — log a research experiment / evaluation. */
export const aiResearchLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      experiment_ref: z.string().min(1).max(160),
      hypothesis: z.string().min(1).max(2000),
      method: z.string().min(1).max(2000),
      result: z.string().max(4000).optional(),
      status: z.enum(["planned","running","completed","failed","abandoned"]).default("planned"),
      cost_cents: z.number().int().nonnegative().default(0),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "research", reference: data.experiment_ref,
        cost_cents: data.cost_cents,
        critical: data.status === "failed",
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          hypothesis: data.hypothesis, method: data.method,
          result: data.result ?? null, status: data.status,
        },
      },
      context,
    ),
  );

/** AI Innovation Tracker™ — record an innovation candidate / bet. */
export const aiInnovationRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      innovation_ref: z.string().min(1).max(160),
      title: z.string().min(1).max(200),
      stage: z.enum(["idea","exploration","prototype","pilot","launched","paused"]).default("idea"),
      confidence: z.number().int().min(0).max(100).default(50),
      cost_cents: z.number().int().nonnegative().default(0),
      notes: z.string().max(4000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "innovation", reference: data.innovation_ref,
        cost_cents: data.cost_cents, critical: false,
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          title: data.title, stage: data.stage,
          confidence: data.confidence, notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** AI Cost Optimizer™ — record a cost snapshot / optimization action. */
export const aiCostRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      snapshot_ref: z.string().min(1).max(160),
      window: z.enum(["hour","day","week","month"]).default("day"),
      spend_cents: z.number().int().nonnegative(),
      savings_cents: z.number().int().nonnegative().default(0),
      action: z.enum(["observe","rebalance","downgrade","cache","batch","cutoff"]).default("observe"),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAiPipeline(
      {
        module: "cost", reference: `${data.snapshot_ref}:${data.window}`,
        cost_cents: data.spend_cents,
        critical: data.action === "cutoff",
        company_id: data.company_id, workspace_id: data.workspace_id,
        currency: data.currency, tags: data.tags,
        payload: {
          window: data.window, spend_cents: data.spend_cents,
          savings_cents: data.savings_cents, action: data.action,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** List AI Platform records (read-only surface for Mission Control panels). */
export const aiPlatformList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(AI_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `ai.${data.module}` : "ai.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`ai_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });
