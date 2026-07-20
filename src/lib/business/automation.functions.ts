/**
 * R188 Batch A — Business OS Automation Runtime (Publish/Deactivate)
 *
 * ONE canonical runtime for activating and deactivating existing
 * `public.workflows` rows through the Founder pipeline:
 *
 *   Founder / Admin request
 *      ↓ withBrain — capability="business.automation.publish"
 *      ↓ Impact analysis (step count, destructive triggers)
 *      ↓
 *   above threshold ──► requestFounderApproval (R158)
 *      ↓                      ↓ pending → Founder decides → approved
 *   below threshold           bizApplyApprovedAutomationPublish
 *      ↓                          ↓
 *   UPDATE public.workflows SET is_active, version = version + 1
 *      ↓ writeCanonicalAudit → public.audit_logs
 *
 * Canonical owners reused — no new tables, no new dashboard, no V2:
 *   - persistence:   public.workflows / public.workflow_runs
 *   - brain:         withBrain (src/lib/founder/with-brain)
 *   - approvals:     public.approvals via request/decideFounderApproval
 *   - audit:         writeCanonicalAudit → public.write_audit
 *   - dashboard:     extends Founder Mission Control (Batch F)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { withBrain } from "@/lib/founder/with-brain";
import type { FounderApprovalContext } from "@/lib/founder/types";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

/** Steps ≥ this or any destructive trigger requires Founder approval. */
const STEP_APPROVAL_THRESHOLD = 10;
const DESTRUCTIVE_TRIGGER_TYPES = new Set([
  "delete",
  "purge",
  "wipe",
  "cascade_delete",
  "mass_update",
  "mass_email",
  "external_webhook",
]);

const PublishInput = z.object({
  workflow_id: z.string().uuid(),
  activate: z.boolean().default(true),
  reason: z.string().max(2000).optional(),
});
type PublishInput = z.infer<typeof PublishInput>;

interface AutomationImpact {
  step_count: number;
  destructive: boolean;
  requires_founder_approval: boolean;
  threshold: number;
}

interface PublishResult {
  status: "applied" | "pending_approval";
  workflow_id: string;
  is_active?: boolean;
  version?: number;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
}

const analyzeImpact = withBrain<
  { steps: unknown; trigger: unknown; activate: boolean },
  AutomationImpact
>({
  capability: "business.automation.publish",
  handler: async (input) => {
    const stepCount = Array.isArray(input.steps) ? input.steps.length : 0;
    const trig = (input.trigger ?? {}) as Record<string, unknown>;
    const trigType = typeof trig.type === "string" ? trig.type : "";
    const destructive = DESTRUCTIVE_TRIGGER_TYPES.has(trigType);
    return {
      step_count: stepCount,
      destructive,
      requires_founder_approval:
        input.activate &&
        (stepCount >= STEP_APPROVAL_THRESHOLD || destructive),
      threshold: STEP_APPROVAL_THRESHOLD,
    };
  },
});

/**
 * Publish (activate) or deactivate an existing workflow. Deactivation
 * never requires approval; activation of large or destructive workflows
 * routes through R158.
 */
export const bizPublishWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PublishInput.parse(i))
  .handler(async ({ data, context }): Promise<PublishResult> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "automation", module: "workflow", capability: "publish", user_id: context.userId, company_id: "00000000-0000-0000-0000-000000000000", summary: `publish workflow ${data.workflow_id}` });

    const { data: wf, error: readErr } = await supabase
      .from("workflows")
      .select("id,company_id,name,steps,trigger,is_active,version")
      .eq("id", data.workflow_id)
      .single();
    if (readErr || !wf) throw new Error("workflow_not_found");

    const brainCtx: FounderApprovalContext = {
      isFounder: true,
      correlationId: userId,
    };
    const brain = await analyzeImpact({
      capability: "business.automation.publish",
      input: {
        steps: wf.steps,
        trigger: wf.trigger,
        activate: data.activate,
      },
      context: brainCtx,
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: wf.company_id,
          entity_type: "business.automation",
          entity_id: wf.id,
          title: `Publish workflow "${wf.name}" (${brain.output.step_count} steps${brain.output.destructive ? ", destructive" : ""})`,
          reason: data.reason,
          metadata: {
            source: "business_os.automation.publish",
            payload: data satisfies PublishInput,
            impact: brain.output,
            brain_duration_ms: brain.durationMs,
          },
        },
      });
      return {
        status: "pending_approval",
        workflow_id: wf.id,
        approval_id: approval.id,
        approval_status: approval.status,
        reason: brain.output.destructive
          ? "destructive_trigger_requires_founder"
          : "step_count_exceeds_founder_threshold",
      };
    }

    const nextVersion = (wf.version ?? 1) + (data.activate ? 1 : 0);
    const { data: after, error } = await supabase
      .from("workflows")
      .update({
        is_active: data.activate,
        version: nextVersion,
        updated_by: userId,
      })
      .eq("id", wf.id)
      .select("id,is_active,version,company_id,name")
      .single();
    if (error) throw new Error(`workflow_update_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "business.automation",
      action: data.activate ? "publish" : "deactivate",
      entity_type: "workflow",
      entity_id: wf.id,
      company_id: wf.company_id,
      before: wf,
      after,
      severity: "notice",
      metadata: { approval_required: false, impact: brain.output },
    });

    return {
      status: "applied",
      workflow_id: after.id,
      is_active: after.is_active,
      version: after.version,
    };
  });

const ApplyInput = z.object({ approval_id: z.string().uuid() });

/**
 * Apply a Founder-approved workflow publish. Idempotent via
 * approvals.metadata.executed_at.
 */
export const bizApplyApprovedAutomationPublish = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApplyInput.parse(i))
  .handler(async ({ data, context }): Promise<PublishResult> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "automation", module: "workflow", capability: "apply_approved", user_id: context.userId, company_id: "00000000-0000-0000-0000-000000000000", summary: `apply approved workflow publish`, metadata: { approval_id: data.approval_id } });

    const { data: approval, error: readErr } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", data.approval_id)
      .single();
    if (readErr || !approval) throw new Error("approval_not_found");
    if (approval.status !== "approved") {
      throw new Error(`approval_not_approved: ${approval.status}`);
    }

    const meta = (approval.metadata ?? {}) as {
      source?: string;
      payload?: PublishInput;
      executed_at?: string;
      impact?: AutomationImpact;
    };
    if (meta.source !== "business_os.automation.publish" || !meta.payload) {
      throw new Error("approval_not_automation_source");
    }

    const payload = PublishInput.parse(meta.payload);

    const { data: wf, error: wfErr } = await supabase
      .from("workflows")
      .select("id,company_id,name,is_active,version")
      .eq("id", payload.workflow_id)
      .single();
    if (wfErr || !wf) throw new Error("workflow_not_found");

    if (meta.executed_at) {
      return {
        status: "applied",
        workflow_id: wf.id,
        is_active: wf.is_active,
        version: wf.version,
      };
    }

    const nextVersion = (wf.version ?? 1) + (payload.activate ? 1 : 0);
    const { data: after, error } = await supabase
      .from("workflows")
      .update({
        is_active: payload.activate,
        version: nextVersion,
        updated_by: userId,
      })
      .eq("id", wf.id)
      .select("id,is_active,version,company_id,name")
      .single();
    if (error) throw new Error(`workflow_update_failed: ${error.message}`);

    await supabase
      .from("approvals")
      .update({
        metadata: {
          ...meta,
          executed_at: new Date().toISOString(),
        } as never,
      })
      .eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category: "business.automation",
      action: payload.activate ? "publish" : "deactivate",
      entity_type: "workflow",
      entity_id: wf.id,
      company_id: wf.company_id,
      before: wf,
      after,
      severity: "notice",
      metadata: {
        approval_required: true,
        approval_id: data.approval_id,
        impact: meta.impact,
      },
    });

    return {
      status: "applied",
      workflow_id: after.id,
      is_active: after.is_active,
      version: after.version,
    };
  });

// ============================================================================
// R191 Batch 10 — Workflow Intelligence / Automation / Enterprise Operations
//
// SINGLE canonical composition surface for workflow execution lifecycle,
// scheduled + domain-triggered automations, and Mission Control health.
//
// NO new engine, NO new queue, NO new dashboard, NO new tables.
// Reuses:
//   - public.workflows / public.workflow_runs (canonical persistence)
//   - public.creator_assets (kind: "automation.pause" | "automation.schedule")
//   - adoptToCanonicalPipeline / withBrain / requestFounderApproval / audit
//   - Founder Mission Control (extends, does not replace)
// ============================================================================
type Json10 = string | number | boolean | null | Json10[] | { [k: string]: Json10 };
type Ok<T extends Json10 = Json10> = { status: "ok"; data: T };
type Pending = { status: "pending_approval"; approval_id: string; reason: string };

const CANCEL_APPROVAL_STEP_THRESHOLD = 10;

async function loadWorkflow(sb: Parameters<typeof adoptToCanonicalPipeline>[0], workflow_id: string) {
  const { data, error } = await sb.from("workflows")
    .select("id,company_id,name,steps,trigger,is_active,version").eq("id", workflow_id).single();
  if (error || !data) throw new Error("workflow_not_found");
  return data;
}

async function adoptAutomation(
  sb: Parameters<typeof adoptToCanonicalPipeline>[0],
  ctx: { userId: string | null; company_id: string },
  module: string, capability: string, summary: string,
) {
  await adoptToCanonicalPipeline(sb, {
    domain: "automation", module, capability,
    user_id: ctx.userId, company_id: ctx.company_id, summary,
  });
}

// 1) Manual workflow execution (creates a run row) ---------------------------
export const wfExecute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    workflow_id: z.string().uuid(),
    input: z.record(z.string(), z.unknown()).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ run_id: string; workflow_id: string; status: string }>> => {
    const { supabase, userId } = context;
    const wf = await loadWorkflow(supabase, data.workflow_id);
    await adoptAutomation(supabase, { userId, company_id: wf.company_id }, "workflow", "execute", `execute ${wf.name}`);
    const { data: run, error } = await supabase.from("workflow_runs").insert({
      workflow_id: wf.id, status: "queued", input: (data.input ?? {}) as never,
    }).select("id,status,workflow_id").single();
    if (error || !run) throw new Error(`workflow_run_insert_failed: ${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "execute", entity_type: "workflow_run",
      entity_id: run.id, company_id: wf.company_id, severity: "info",
      metadata: { workflow_id: wf.id, input: data.input ?? {} },
    });
    return { status: "ok", data: { run_id: run.id, workflow_id: wf.id, status: run.status } };
  });

// 2) Retry a failed run ------------------------------------------------------
export const wfRetryRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ run_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ run_id: string; new_run_id: string }>> => {
    const { supabase, userId } = context;
    const { data: prev, error: rErr } = await supabase.from("workflow_runs")
      .select("id,workflow_id,status,input,workflows(company_id,name)").eq("id", data.run_id).single();
    if (rErr || !prev) throw new Error("run_not_found");
    if (prev.status !== "failed") throw new Error(`retry_requires_failed_status:${prev.status}`);
    const company_id = (prev.workflows as { company_id: string } | null)?.company_id ?? "";
    await adoptAutomation(supabase, { userId, company_id }, "workflow", "retry", `retry ${prev.workflow_id}`);
    const { data: next, error } = await supabase.from("workflow_runs").insert({
      workflow_id: prev.workflow_id, status: "queued", input: prev.input ?? ({} as never),
    }).select("id").single();
    if (error || !next) throw new Error(`retry_insert_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "retry", entity_type: "workflow_run",
      entity_id: next.id, company_id, severity: "notice",
      metadata: { retried_from: prev.id, workflow_id: prev.workflow_id },
    });
    return { status: "ok", data: { run_id: prev.id, new_run_id: next.id } };
  });

// 3) Pause a running run (creator_assets marker) -----------------------------
export const wfPauseRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ run_id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ run_id: string; paused: true; marker_id: string }>> => {
    const { supabase, userId } = context;
    if (!userId) throw new Error("unauthenticated");
    const { data: run } = await supabase.from("workflow_runs")
      .select("workflow_id,status,workflows(company_id)").eq("id", data.run_id).single();
    const company_id = (run?.workflows as { company_id: string } | null)?.company_id ?? "";
    await adoptAutomation(supabase, { userId, company_id }, "workflow", "pause", `pause ${data.run_id}`);
    const { data: marker, error } = await supabase.from("creator_assets").insert({
      user_id: userId, kind: "automation.pause", name: `pause:${data.run_id}`, mime_type: "application/json",
      metadata: { run_id: data.run_id, reason: data.reason ?? null, paused_at: new Date().toISOString() } as never,
    }).select("id").single();
    if (error || !marker) throw new Error(`pause_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "pause", entity_type: "workflow_run",
      entity_id: data.run_id, company_id, severity: "notice", metadata: { marker_id: marker.id },
    });
    return { status: "ok", data: { run_id: data.run_id, paused: true, marker_id: marker.id } };
  });

// 4) Resume a paused run -----------------------------------------------------
export const wfResumeRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ run_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ run_id: string; resumed: true }>> => {
    const { supabase, userId } = context;
    const { data: run } = await supabase.from("workflow_runs")
      .select("workflows(company_id)").eq("id", data.run_id).single();
    const company_id = (run?.workflows as { company_id: string } | null)?.company_id ?? "";
    await adoptAutomation(supabase, { userId, company_id }, "workflow", "resume", `resume ${data.run_id}`);
    await supabase.from("creator_assets").delete()
      .eq("kind", "automation.pause").eq("name", `pause:${data.run_id}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "resume", entity_type: "workflow_run",
      entity_id: data.run_id, company_id, severity: "info",
    });
    return { status: "ok", data: { run_id: data.run_id, resumed: true } };
  });

// 5) Cancel a run (approval-gated for large workflows) -----------------------
export const wfCancelRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ run_id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ run_id: string; status: string }> | Pending> => {
    const { supabase, userId } = context;
    const { data: run } = await supabase.from("workflow_runs")
      .select("id,status,workflow_id,workflows(company_id,name,steps)").eq("id", data.run_id).single();
    if (!run) throw new Error("run_not_found");
    const wf = run.workflows as { company_id: string; name: string; steps: unknown } | null;
    const company_id = wf?.company_id ?? "";
    const stepCount = Array.isArray(wf?.steps) ? (wf!.steps as unknown[]).length : 0;
    await adoptAutomation(supabase, { userId, company_id }, "workflow", "cancel", `cancel ${data.run_id}`);
    if (run.status === "running" && stepCount >= CANCEL_APPROVAL_STEP_THRESHOLD) {
      const appr = await requestFounderApproval({
        data: {
          company_id, entity_type: "business.automation.cancel", entity_id: run.id,
          title: `Cancel active run of "${wf?.name ?? run.workflow_id}" (${stepCount} steps)`,
          reason: data.reason,
          metadata: { source: "business_os.automation.cancel", run_id: run.id, workflow_id: run.workflow_id } as never,
        },
      });
      return { status: "pending_approval", approval_id: appr.id, reason: "large_active_run_requires_founder" };
    }
    const { data: after, error } = await supabase.from("workflow_runs")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", run.id).select("id,status").single();
    if (error || !after) throw new Error(`cancel_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "cancel", entity_type: "workflow_run",
      entity_id: after.id, company_id, severity: "notice", metadata: { reason: data.reason ?? null },
    });
    return { status: "ok", data: { run_id: after.id, status: after.status } };
  });

// 6) List run history --------------------------------------------------------
export const wfListHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    workflow_id: z.string().uuid(), limit: z.number().int().min(1).max(200).default(50),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const wf = await loadWorkflow(supabase, data.workflow_id);
    await adoptAutomation(supabase, { userId, company_id: wf.company_id }, "workflow", "history", `history ${wf.name}`);
    const { data: rows } = await supabase.from("workflow_runs")
      .select("id,status,started_at,completed_at,error,created_at")
      .eq("workflow_id", data.workflow_id).order("created_at", { ascending: false }).limit(data.limit);
    return { status: "ok" as const, data: { workflow_id: data.workflow_id, runs: rows ?? [] } };
  });

// 7) Create workflow template (destructive triggers → approval) --------------
const TemplateInput = z.object({
  company_id: z.string().uuid(), name: z.string().min(1).max(200),
  steps: z.array(z.record(z.string(), z.unknown())).default([]),
  trigger: z.record(z.string(), z.unknown()).default({}),
});
export const wfCreateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TemplateInput.parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ workflow_id: string; version: number }> | Pending> => {
    const { supabase, userId } = context;
    await adoptAutomation(supabase, { userId, company_id: data.company_id }, "template", "create", `create template ${data.name}`);
    const trigType = typeof (data.trigger as { type?: string }).type === "string" ? (data.trigger as { type: string }).type : "";
    const destructive = DESTRUCTIVE_TRIGGER_TYPES.has(trigType);
    if (destructive || data.steps.length >= STEP_APPROVAL_THRESHOLD) {
      const appr = await requestFounderApproval({
        data: {
          company_id: data.company_id, entity_type: "business.automation.template",
          entity_id: data.company_id,
          title: `Create workflow template "${data.name}" (${data.steps.length} steps${destructive ? ", destructive" : ""})`,
          metadata: { source: "business_os.automation.template.create", payload: data as unknown as Json10 } as never,
        },
      });
      return { status: "pending_approval", approval_id: appr.id, reason: destructive ? "destructive_trigger" : "large_template" };
    }
    const { data: wf, error } = await supabase.from("workflows").insert({
      company_id: data.company_id, name: data.name, steps: data.steps as never,
      trigger: data.trigger as never, is_active: false, version: 1, created_by: userId,
    }).select("id,version").single();
    if (error || !wf) throw new Error(`template_insert_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "template.create", entity_type: "workflow",
      entity_id: wf.id, company_id: data.company_id, severity: "notice",
      metadata: { step_count: data.steps.length, destructive },
    });
    return { status: "ok", data: { workflow_id: wf.id, version: wf.version } };
  });

// 8) Bump workflow version (edit steps/trigger) ------------------------------
export const wfBumpVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    workflow_id: z.string().uuid(),
    steps: z.array(z.record(z.string(), z.unknown())).optional(),
    trigger: z.record(z.string(), z.unknown()).optional(),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ workflow_id: string; version: number }>> => {
    const { supabase, userId } = context;
    const wf = await loadWorkflow(supabase, data.workflow_id);
    await adoptAutomation(supabase, { userId, company_id: wf.company_id }, "workflow", "version", `bump ${wf.name}`);
    const patch: Record<string, unknown> = {
      version: (wf.version ?? 1) + 1, updated_by: userId,
    };
    if (data.steps) patch.steps = data.steps as never;
    if (data.trigger) patch.trigger = data.trigger as never;
    const { data: after, error } = await supabase.from("workflows")
      .update(patch as never).eq("id", wf.id).select("id,version").single();
    if (error || !after) throw new Error(`version_bump_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "version.bump", entity_type: "workflow",
      entity_id: wf.id, company_id: wf.company_id, before: wf, after, severity: "info",
    });
    return { status: "ok", data: { workflow_id: after.id, version: after.version } };
  });

// 9) List workflow versions (from audit_logs pipeline entries) ---------------
export const wfListVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ workflow_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const wf = await loadWorkflow(supabase, data.workflow_id);
    await adoptAutomation(supabase, { userId, company_id: wf.company_id }, "workflow", "versions", `versions ${wf.name}`);
    const { data: rows } = await supabase.from("audit_logs")
      .select("id,action,created_at,metadata,before_data,after_data")
      .eq("category", "business.automation").eq("entity_id", data.workflow_id)
      .order("created_at", { ascending: false }).limit(100);
    return { status: "ok" as const, data: { workflow_id: data.workflow_id, current_version: wf.version, entries: rows ?? [] } };
  });

// 10) Schedule automation (creator_assets kind: automation.schedule) ---------
export const wfScheduleAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    workflow_id: z.string().uuid(),
    cron: z.string().min(1).max(100),
    timezone: z.string().default("Asia/Kolkata"),
    enabled: z.boolean().default(true),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ schedule_id: string }>> => {
    const { supabase, userId } = context;
    if (!userId) throw new Error("unauthenticated");
    const wf = await loadWorkflow(supabase, data.workflow_id);
    await adoptAutomation(supabase, { userId, company_id: wf.company_id }, "schedule", "create", `schedule ${wf.name}`);
    const { data: row, error } = await supabase.from("creator_assets").insert({
      user_id: userId, kind: "automation.schedule",
      name: `schedule:${wf.id}`, mime_type: "application/json",
      metadata: { workflow_id: wf.id, company_id: wf.company_id, cron: data.cron, timezone: data.timezone, enabled: data.enabled } as never,
    }).select("id").single();
    if (error || !row) throw new Error(`schedule_insert_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "schedule", entity_type: "workflow",
      entity_id: wf.id, company_id: wf.company_id, severity: "notice",
      metadata: { schedule_id: row.id, cron: data.cron, timezone: data.timezone, enabled: data.enabled },
    });
    return { status: "ok", data: { schedule_id: row.id } };
  });

// 11) Automation analytics ---------------------------------------------------
export const wfAutomationAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: z.string().uuid(), days: z.number().int().min(1).max(365).default(30),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptAutomation(supabase, { userId, company_id: data.company_id }, "analytics", "summary", `analytics ${data.days}d`);
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: wfs } = await supabase.from("workflows").select("id,is_active").eq("company_id", data.company_id);
    const ids = (wfs ?? []).map((w) => w.id);
    const active = (wfs ?? []).filter((w) => w.is_active).length;
    let runs: { status: string; started_at: string | null; completed_at: string | null }[] = [];
    if (ids.length) {
      const { data: r } = await supabase.from("workflow_runs")
        .select("status,started_at,completed_at").in("workflow_id", ids).gte("created_at", since);
      runs = r ?? [];
    }
    const counts = runs.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
    const total = runs.length;
    const succeeded = counts.succeeded ?? 0;
    const failed = counts.failed ?? 0;
    return {
      status: "ok" as const,
      data: {
        window_days: data.days,
        workflows_total: wfs?.length ?? 0,
        workflows_active: active,
        runs_total: total,
        by_status: counts,
        success_rate: total ? +(succeeded / total).toFixed(4) : 0,
        failure_rate: total ? +(failed / total).toFixed(4) : 0,
      },
    };
  });

// 12–15) Domain-triggered automations (business/revenue/mfg/support) ---------
function makeDomainTrigger(module: string) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((i: unknown) => z.object({
      workflow_id: z.string().uuid(),
      event: z.string().min(1).max(100),
      payload: z.record(z.string(), z.unknown()).default({}),
    }).parse(i))
    .handler(async ({ data, context }): Promise<Ok<{ run_id: string }>> => {
      const { supabase, userId } = context;
      const wf = await loadWorkflow(supabase, data.workflow_id);
      if (!wf.is_active) throw new Error("workflow_inactive");
      await adoptAutomation(supabase, { userId, company_id: wf.company_id }, module, "trigger", `${module}:${data.event}`);
      const { data: run, error } = await supabase.from("workflow_runs").insert({
        workflow_id: wf.id, status: "queued",
        input: { source: module, event: data.event, payload: data.payload } as never,
      }).select("id").single();
      if (error || !run) throw new Error(`trigger_insert_failed:${error?.message}`);
      await writeCanonicalAudit(supabase, {
        category: "business.automation", action: `${module}.trigger`, entity_type: "workflow_run",
        entity_id: run.id, company_id: wf.company_id, severity: "info",
        metadata: { event: data.event, module },
      });
      return { status: "ok", data: { run_id: run.id } };
    });
}
export const wfBusinessAutomationTrigger = makeDomainTrigger("business");
export const wfRevenueAutomationTrigger = makeDomainTrigger("revenue");
export const wfManufacturingAutomationTrigger = makeDomainTrigger("manufacturing");
export const wfSupportAutomationTrigger = makeDomainTrigger("support");

// 16) Notification automation broadcast --------------------------------------
export const wfNotificationAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    company_id: z.string().uuid(),
    workflow_id: z.string().uuid(),
    channel: z.enum(["email", "sms", "push", "in_app"]).default("in_app"),
    audience: z.enum(["all", "dealers", "customers", "employees"]).default("all"),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(4000),
  }).parse(i))
  .handler(async ({ data, context }): Promise<Ok<{ run_id: string }>> => {
    const { supabase, userId } = context;
    const wf = await loadWorkflow(supabase, data.workflow_id);
    await adoptAutomation(supabase, { userId, company_id: data.company_id }, "notification", "broadcast", data.subject);
    const { data: run, error } = await supabase.from("workflow_runs").insert({
      workflow_id: wf.id, status: "queued",
      input: { source: "notification", channel: data.channel, audience: data.audience, subject: data.subject, body: data.body } as never,
    }).select("id").single();
    if (error || !run) throw new Error(`notification_run_failed:${error?.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.automation", action: "notification.broadcast", entity_type: "workflow_run",
      entity_id: run.id, company_id: data.company_id, severity: "notice",
      metadata: { channel: data.channel, audience: data.audience, subject: data.subject },
    });
    return { status: "ok", data: { run_id: run.id } };
  });

// 17) Mission Control health snapshot ----------------------------------------
export const wfHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptAutomation(supabase, { userId, company_id: data.company_id }, "health", "snapshot", "mission-control");
    const { data: wfs } = await supabase.from("workflows").select("id,is_active").eq("company_id", data.company_id);
    const ids = (wfs ?? []).map((w) => w.id);
    const summary = { queued: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0 };
    let recentFailures: { id: string; workflow_id: string; error: string | null; created_at: string }[] = [];
    let paused = 0;
    let schedules = 0;
    if (ids.length) {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: rr } = await supabase.from("workflow_runs")
        .select("id,workflow_id,status,error,created_at").in("workflow_id", ids).gte("created_at", since);
      for (const r of rr ?? []) {
        if (r.status in summary) summary[r.status as keyof typeof summary]++;
      }
      recentFailures = (rr ?? []).filter((r) => r.status === "failed")
        .map((r) => ({ id: r.id, workflow_id: r.workflow_id, error: r.error, created_at: r.created_at }))
        .slice(0, 20);
    }
    const { count: pauseCount } = await supabase.from("creator_assets")
      .select("id", { count: "exact", head: true }).eq("kind", "automation.pause");
    paused = pauseCount ?? 0;
    const { count: schedCount } = await supabase.from("creator_assets")
      .select("id", { count: "exact", head: true }).eq("kind", "automation.schedule");
    schedules = schedCount ?? 0;
    return {
      status: "ok" as const,
      data: {
        workflows_total: wfs?.length ?? 0,
        workflows_active: (wfs ?? []).filter((w) => w.is_active).length,
        queue_24h: summary,
        paused_markers: paused,
        scheduled_jobs: schedules,
        recent_failures: recentFailures,
      },
    };
  });
