/**
 * R189 Batch 13 — Universal AI Memory Vault™ (Canonical Owner)
 *
 * SINGLE canonical owner for Memory Timeline + Recall.
 * No new brain, runtime, search, workspace, memory engine, table, or dashboard.
 *
 * Reused canonical owners:
 *   • Brain            → withBrain / public.brain_sessions
 *   • Pipeline         → adoptToCanonicalPipeline (audit_logs pipeline.memory.*)
 *   • Approval R158    → requestFounderApproval / public.approvals
 *   • Audit            → writeCanonicalAudit → public.audit_logs
 *   • Workspace store  → public.creator_assets (kind: "memory.timeline" | "memory.recall")
 *   • Mission Control  → founderMissionControl (auto via pipeline.memory)
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

const analyze = withBrain<{ module: string; sensitive: boolean; scope: string }, Impact>({
  capability: "memory.impact",
  handler: ({ module, sensitive, scope }) => {
    if (sensitive) return { severity: "warning", requires_approval: true, reason: "sensitive_memory" };
    if (module === "recall" && scope === "cross-workspace") {
      return { severity: "notice", requires_approval: true, reason: "cross_workspace_recall" };
    }
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

interface Submit {
  module: "timeline" | "recall";
  reference: string;
  sensitive: boolean;
  scope: string;
  company_id?: string;
  workspace_id?: string;
  tags: string[];
  payload: Record<string, unknown>;
}

async function runMemoryPipeline(
  data: Submit,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
) {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "memory",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: data.company_id ?? ZERO_UUID,
    metadata: { sensitive: data.sensitive, scope: data.scope },
  });
  const brain = await analyze({
    capability: "memory.impact",
    input: { module: data.module, sensitive: data.sensitive, scope: data.scope },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `memory.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: kind,
        entity_id: crypto.randomUUID(),
        title: `Memory · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        currency: "INR",
        metadata: { source: "memory", module: data.module, payload: data.payload, impact: brain.output },
      },
    });
    return { status: "pending_approval" as const, impact: brain.output, approval_id: approval.id, approval_status: approval.status };
  }
  const meta = {
    domain: "memory", module: data.module, reference: data.reference,
    workspace_id: data.workspace_id ?? null, company_id: data.company_id ?? null,
    sensitive: data.sensitive, scope: data.scope,
    payload: data.payload, impact: brain.output,
    brain_duration_ms: brain.durationMs, version: 1, recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId, kind,
      mime_type: "application/x-happy-memory+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "memory", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`memory_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "memory",
    action: `${data.module}.record`,
    entity_type: "creator_asset",
    entity_id: record.id,
    company_id: data.company_id ?? undefined,
    after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, scope: data.scope, sensitive: data.sensitive },
  });
  return { status: "recorded" as const, record, impact: brain.output };
}

const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Append an event to the Memory Timeline. */
export const memoryTimelineAppend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      timeline_ref: z.string().min(1).max(160),
      summary: z.string().min(1).max(4000),
      subject: z.string().min(1).max(200),
      sensitive: z.boolean().default(false),
      occurred_at: z.string().datetime().optional(),
      links: z.array(z.string().min(1).max(400)).max(24).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runMemoryPipeline(
      {
        module: "timeline", reference: data.timeline_ref, sensitive: data.sensitive,
        scope: "workspace", company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { subject: data.subject, summary: data.summary, occurred_at: data.occurred_at ?? new Date().toISOString(), links: data.links },
      },
      context,
    ),
  );

/** Recall matching memory entries from the vault. */
export const memoryRecall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      recall_ref: z.string().min(1).max(160),
      query: z.string().min(1).max(1000),
      scope: z.enum(["workspace", "cross-workspace"]).default("workspace"),
      limit: z.number().int().min(1).max(50).default(10),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", "memory.timeline")
      .ilike("name", `%${data.query.slice(0, 80)}%`)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    const { data: hits } = await q;
    const result = await runMemoryPipeline(
      {
        module: "recall", reference: data.recall_ref, sensitive: false, scope: data.scope,
        company_id: data.company_id, workspace_id: data.workspace_id, tags: data.tags,
        payload: { query: data.query, hits: hits ?? [] },
      },
      context,
    );
    return { ...result, hits: hits ?? [] };
  });

/** List memory vault entries. */
export const memoryList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(["timeline", "recall"]).optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `memory.${data.module}` : "memory.%";
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(`memory_list_failed: ${error.message}`);
    return { items: rows ?? [] };
  });
