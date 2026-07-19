/**
 * R183 Batch H — Canonical Executive Board Runtime
 *
 * SINGLE canonical server-function surface that turns a Founder-issued
 * proposal into a real board review by running all ten members
 * (R171–R180) through their pure analysers, aggregating a unified
 * recommendation + council conflicts + top risks, and gating execution
 * behind the existing R158 approval + canonical audit primitives.
 *
 * REUSES ONLY existing owners (no new runtime, no new AI, no new
 * approval engine, no new audit engine, no new tables, no new APIs):
 *   Brain    → src/lib/founder/with-brain.ts       (withBrain)
 *   Approval → src/lib/founder/approval.functions.ts → public.approvals
 *   Audit    → src/lib/founder/audit.ts             → public.write_audit
 *   Mission Control → src/lib/founder/mission-control.functions.ts
 *
 * Flow (mirrors Batch G — publishing):
 *   Founder submits proposal
 *     → withBrain (capability: founder.executive.review)
 *     → 10 member analysers run + aggregateBoard()
 *     → INSERT public.approvals (entity_type=founder_executive_review,
 *         metadata = { proposal, review })
 *     → writeCanonicalAudit (category=founder.executive, action=request)
 *     → Founder decides via decideFounderApproval (existing owner)
 *     → recordBoardOutcome finalises the record & audits execution
 *
 * The Board **participates** in every founder-gated action: any other
 * runtime (Business OS, Revenue OS, Publishing, Creator, Knowledge)
 * can call `runExecutiveReview` before requesting R158 approval to have
 * the Board's unified recommendation attached to the approval metadata.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "../audit";
import { withBrain } from "../with-brain";
import {
  EXECUTIVE_MEMBERS,
  aggregateBoard,
  type BoardProposal,
  type BoardReview,
} from "./members";

const CAPABILITY = "founder.executive.review" as const;
const APPROVAL_ENTITY = "founder_executive_review" as const;

// ---------- Validation ----------

interface RequestInput {
  company_id: string;
  proposal: BoardProposal;
  reason?: string;
}

function validateRequest(input: unknown): RequestInput {
  const v = input as Partial<RequestInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.company_id || typeof v.company_id !== "string")
    throw new Error("company_id_required");
  const p = v.proposal as BoardProposal | undefined;
  if (!p || typeof p !== "object") throw new Error("proposal_required");
  if (!p.title || typeof p.title !== "string")
    throw new Error("proposal_title_required");
  return {
    company_id: v.company_id,
    proposal: {
      title: p.title,
      summary: typeof p.summary === "string" ? p.summary : undefined,
      kind: typeof p.kind === "string" ? p.kind : undefined,
      financial_cents:
        typeof p.financial_cents === "number" ? p.financial_cents : undefined,
      currency: typeof p.currency === "string" ? p.currency : undefined,
      tags: Array.isArray(p.tags)
        ? p.tags.filter((t): t is string => typeof t === "string")
        : undefined,
      signals:
        p.signals && typeof p.signals === "object"
          ? (p.signals as BoardProposal["signals"])
          : undefined,
    },
    reason: typeof v.reason === "string" ? v.reason : undefined,
  };
}

/** Pure fan-out: run every member analyser and aggregate. */
function performReview(proposal: BoardProposal): BoardReview {
  const analyses = EXECUTIVE_MEMBERS.map((m) => m.analyse(proposal));
  return aggregateBoard(analyses);
}

// ---------- Server callable (internal) ----------
// Other Founder runtimes may call `runExecutiveReview` before
// requesting an R158 approval, so the Board's unified recommendation
// travels with the approval.

interface InternalInput {
  proposal: BoardProposal;
}

function validateInternal(input: unknown): InternalInput {
  const v = input as Partial<InternalInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  const p = v.proposal as BoardProposal | undefined;
  if (!p || typeof p !== "object") throw new Error("proposal_required");
  if (!p.title || typeof p.title !== "string")
    throw new Error("proposal_title_required");
  return { proposal: p };
}

export const runExecutiveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateInternal)
  .handler(async ({ data }) => {
    const brain = withBrain<BoardProposal, BoardReview>({
      capability: CAPABILITY,
      handler: (proposal) => performReview(proposal),
    });
    const result = await brain({
      capability: CAPABILITY,
      input: data.proposal,
      context: { isFounder: true, approvalGranted: true },
    });
    return {
      review: result.output,
      duration_ms: result.durationMs,
    };
  });

// ---------- Founder request + persistence ----------

/**
 * Founder-initiated Executive Board review. Persists the full review
 * (unified recommendation, per-member analyses, conflicts, top risks)
 * on an R158 approval row, then hands off to the existing Founder
 * decision loop (`decideFounderApproval`).
 */
export const requestExecutiveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateRequest)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const brain = withBrain<BoardProposal, BoardReview>({
      capability: CAPABILITY,
      handler: (proposal) => performReview(proposal),
    });
    const brainResult = await brain({
      capability: CAPABILITY,
      input: data.proposal,
      context: { isFounder: true, approvalGranted: true },
    });
    const review = brainResult.output;

    const { data: row, error } = await supabase
      .from("approvals")
      .insert({
        company_id: data.company_id,
        entity_type: APPROVAL_ENTITY,
        entity_id: crypto.randomUUID(),
        title: `Executive Review · ${data.proposal.title}`,
        reason: data.reason ?? null,
        amount_cents: data.proposal.financial_cents ?? null,
        currency: data.proposal.currency ?? null,
        requested_by: userId,
        status: "pending",
        metadata: {
          capability: CAPABILITY,
          proposal: data.proposal,
          review,
          brain_duration_ms: brainResult.durationMs,
        } as never,
      })
      .select("id, status, entity_id")
      .single();
    if (error) throw new Error(`approval_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "founder.executive",
      action: "request",
      entity_type: APPROVAL_ENTITY,
      entity_id: row.entity_id as string,
      company_id: data.company_id,
      after: {
        approval_id: row.id,
        unified: review.unified,
        conflicts: review.conflicts.length,
        top_risks: review.top_risks.length,
      },
      severity:
        review.unified.recommendation === "no_go" ? "warning" : "notice",
      metadata: {
        capability: CAPABILITY,
        proposal_title: data.proposal.title,
        proposal_kind: data.proposal.kind ?? null,
        members: review.members.map((m) => ({
          member_id: m.member_id,
          recommendation: m.recommendation,
        })),
      },
    });

    return {
      approval_id: row.id as string,
      review_id: row.entity_id as string,
      status: row.status as string,
      review,
    };
  });

// ---------- Outcome audit ----------

interface OutcomeInput {
  approval_id: string;
  outcome: "executed" | "shelved";
  notes?: string;
}

function validateOutcome(input: unknown): OutcomeInput {
  const v = input as Partial<OutcomeInput> | null;
  if (!v || typeof v !== "object") throw new Error("invalid_input");
  if (!v.approval_id || typeof v.approval_id !== "string")
    throw new Error("approval_id_required");
  if (v.outcome !== "executed" && v.outcome !== "shelved")
    throw new Error("outcome_invalid");
  return {
    approval_id: v.approval_id,
    outcome: v.outcome,
    notes: typeof v.notes === "string" ? v.notes : undefined,
  };
}

/**
 * After `decideFounderApproval` has approved the review, downstream
 * runtimes call `recordBoardOutcome` to close the loop with an audit
 * entry that ties execution back to the Board's unified recommendation.
 * This makes participation *real* — the Board's decision is bound to
 * the audit trail of the executed action.
 */
export const recordBoardOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateOutcome)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: appr, error } = await supabase
      .from("approvals")
      .select("id, entity_type, entity_id, company_id, status, metadata")
      .eq("id", data.approval_id)
      .single();
    if (error || !appr) throw new Error("approval_not_found");
    if (appr.entity_type !== APPROVAL_ENTITY)
      throw new Error("approval_entity_mismatch");
    if (appr.status !== "approved") throw new Error("approval_not_approved");

    const meta = (appr.metadata ?? {}) as Record<string, unknown>;
    const review = meta.review as BoardReview | undefined;

    await writeCanonicalAudit(supabase, {
      category: "founder.executive",
      action: data.outcome,
      entity_type: APPROVAL_ENTITY,
      entity_id: appr.entity_id as string,
      company_id: (appr.company_id as string) ?? undefined,
      after: {
        approval_id: appr.id,
        outcome: data.outcome,
        unified: review?.unified ?? null,
        notes: data.notes ?? null,
      },
      severity: data.outcome === "shelved" ? "warning" : "notice",
      metadata: { capability: CAPABILITY },
    });

    return {
      approval_id: appr.id as string,
      review_id: appr.entity_id as string,
      outcome: data.outcome,
    };
  });
