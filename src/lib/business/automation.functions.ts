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
