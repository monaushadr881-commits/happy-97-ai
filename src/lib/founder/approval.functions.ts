/**
 * R183 Batch B — Canonical Founder Approval (R158) Runtime
 *
 * SINGLE canonical server-function surface for creating and deciding
 * Founder approval requests. All Business / Revenue / Creator /
 * Knowledge / Publishing runtimes MUST route Founder-gated actions
 * through these two functions — no other module may INSERT/UPDATE
 * `public.approvals`.
 *
 * Every mutation is mirrored to the canonical audit log via
 * `writeCanonicalAudit` (R183 Batch A → `public.write_audit`).
 *
 * No new tables. No new APIs. No V2. Extends existing owner:
 *   table  `public.approvals`
 *   audit  `writeCanonicalAudit`
 *   guard  `enforceFounderApproval`
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "./audit";
import { adoptToCanonicalPipeline } from "./pipeline";

type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
type Decision = "approved" | "rejected" | "cancelled";

interface RequestInput {
  company_id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  reason?: string;
  amount_cents?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

interface DecideInput {
  approval_id: string;
  decision: Decision;
  reason?: string;
}

function validateRequest(input: unknown): RequestInput {
  const v = input as Partial<RequestInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.company_id || typeof v.company_id !== "string") {
    throw new Error("company_id_required");
  }
  if (!v.entity_type || typeof v.entity_type !== "string") {
    throw new Error("entity_type_required");
  }
  if (!v.entity_id || typeof v.entity_id !== "string") {
    throw new Error("entity_id_required");
  }
  if (!v.title || typeof v.title !== "string") {
    throw new Error("title_required");
  }
  return {
    company_id: v.company_id,
    entity_type: v.entity_type,
    entity_id: v.entity_id,
    title: v.title,
    reason: typeof v.reason === "string" ? v.reason : undefined,
    amount_cents:
      typeof v.amount_cents === "number" ? v.amount_cents : undefined,
    currency: typeof v.currency === "string" ? v.currency : undefined,
    metadata:
      v.metadata && typeof v.metadata === "object"
        ? (v.metadata as Record<string, unknown>)
        : undefined,
  };
}

function validateDecide(input: unknown): DecideInput {
  const v = input as Partial<DecideInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.approval_id || typeof v.approval_id !== "string") {
    throw new Error("approval_id_required");
  }
  if (
    v.decision !== "approved" &&
    v.decision !== "rejected" &&
    v.decision !== "cancelled"
  ) {
    throw new Error("decision_invalid");
  }
  return {
    approval_id: v.approval_id,
    decision: v.decision,
    reason: typeof v.reason === "string" ? v.reason : undefined,
  };
}

/**
 * Create a pending Founder approval request. RLS on `public.approvals`
 * scopes visibility. Audit entry is written under category
 * `founder.approval` / action `request`.
 */
export const requestFounderApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateRequest)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("approvals")
      .insert({
        company_id: data.company_id,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        title: data.title,
        reason: data.reason ?? null,
        amount_cents: data.amount_cents ?? null,
        currency: data.currency ?? null,
        metadata: (data.metadata ?? {}) as never,
        requested_by: userId,
        status: "pending" satisfies ApprovalStatus,
      })
      .select("*")
      .single();

    if (error) throw new Error(`approval_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.approval",
      action: "request",
      entity_type: "approval",
      entity_id: row.id,
      company_id: data.company_id,
      after: row,
      severity: "notice",
      metadata: {
        target_entity_type: data.entity_type,
        target_entity_id: data.entity_id,
      },
    });

    return { id: row.id as string, status: row.status as ApprovalStatus };
  });

/**
 * Decide (approve / reject / cancel) a pending approval. Only the
 * approver identity is recorded here; role-level authorization is
 * enforced by RLS + `is_platform_founder` / `is_company_admin` policies
 * on `public.approvals`. Audit entry: `founder.approval` / <decision>.
 */
export const decideFounderApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateDecide)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: before, error: readErr } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", data.approval_id)
      .single();
    if (readErr || !before) throw new Error("approval_not_found");
    if (before.status !== "pending") throw new Error("approval_not_pending");

    const { data: after, error } = await supabase
      .from("approvals")
      .update({
        status: data.decision,
        approver_id: userId,
        decided_at: new Date().toISOString(),
        reason: data.reason ?? before.reason,
      })
      .eq("id", data.approval_id)
      .select("*")
      .single();
    if (error) throw new Error(`approval_update_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.approval",
      action: data.decision,
      entity_type: "approval",
      entity_id: data.approval_id,
      company_id: before.company_id,
      before,
      after,
      severity: data.decision === "rejected" ? "warning" : "notice",
    });

    return { id: after.id as string, status: after.status as ApprovalStatus };
  });
