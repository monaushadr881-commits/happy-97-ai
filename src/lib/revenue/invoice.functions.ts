/**
 * R183 Batch E — Revenue OS Invoice Runtime (End-to-End)
 *
 * ONE fully wired Revenue OS mutation flow, chosen as the canonical
 * template that future Revenue batches will replicate across Wallet,
 * Credits, Subscriptions, Payments:
 *
 *   Founder / Admin request
 *      ↓
 *   withBrain() — capability="revenue.invoice.issue"
 *      ↓ Impact analysis (invoice total)
 *      ↓
 *   above threshold  ────────────►  requestFounderApproval (R158)
 *      ↓                                ↓ pending
 *   below threshold                   Founder decides
 *      ↓                                ↓ approved
 *   insert public.invoices           revApplyApprovedInvoice
 *      ↓                                ↓ insert public.invoices
 *   writeCanonicalAudit               ↓ writeCanonicalAudit
 *
 * Canonical owners reused — no new tables, no new runtime, no V2:
 *   - persistence:   public.invoices (canonical Revenue store)
 *   - brain:         withBrain / runBrain from src/lib/founder/with-brain
 *   - approvals:     public.approvals via request/decideFounderApproval
 *   - audit:         writeCanonicalAudit → public.write_audit
 *   - auth/RLS:      requireSupabaseAuth + company scoping
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { withBrain } from "@/lib/founder/with-brain";
import type { FounderApprovalContext } from "@/lib/founder/types";

/**
 * Founder-approval threshold for invoice issuance (in cents).
 * Any invoice total at or above this amount blocks and requires
 * Founder approval before it lands in public.invoices.
 */
const FOUNDER_APPROVAL_THRESHOLD_CENTS = 5_00_00_00; // 5,00,000 cents = 5 lakh

const IssueInvoiceInput = z.object({
  company_id: z.string().uuid(),
  number: z.string().min(1).max(64),
  customer_id: z.string().uuid().nullable().optional(),
  subtotal_cents: z.number().int().nonnegative().default(0),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().positive(),
  currency: z.string().min(3).max(8).default("INR"),
  issued_at: z.string().optional(),
  due_at: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  sales_order_id: z.string().uuid().nullable().optional(),
});

type IssueInvoiceInput = z.infer<typeof IssueInvoiceInput>;

interface InvoiceRow {
  id: string;
  company_id: string;
  number: string;
  customer_id: string | null;
  total_cents: number;
  currency: string;
  status: string;
  issued_at: string | null;
  due_at: string | null;
}

interface IssueInvoiceResult {
  status: "created" | "pending_approval";
  invoice?: InvoiceRow;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
}

interface ImpactAnalysis {
  requires_founder_approval: boolean;
  threshold_cents: number;
  total_cents: number;
}

/**
 * Brain handler — pure impact analysis, no I/O. Wrapped via withBrain
 * so the capability flows through the canonical Brain runtime.
 */
const analyzeInvoiceImpact = withBrain<IssueInvoiceInput, ImpactAnalysis>({
  capability: "revenue.invoice.issue",
  handler: async (input) => ({
    requires_founder_approval:
      input.total_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS,
    threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS,
    total_cents: input.total_cents,
  }),
});

/**
 * Canonical Revenue OS invoice issuance mutation.
 * Runs Brain impact analysis; routes through R158 when Founder approval
 * is required, otherwise inserts into public.invoices and audits.
 */
export const revIssueInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => IssueInvoiceInput.parse(i))
  .handler(async ({ data, context }): Promise<IssueInvoiceResult> => {
    const { supabase, userId } = context;

    const brainCtx: BrainContext = {
      actor: { userId, isFounder: true },
      companyId: data.company_id,
    };
    const brain = await analyzeInvoiceImpact({
      capability: "revenue.invoice.issue",
      input: data,
      context: brainCtx,
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "revenue.invoice",
          entity_id: crypto.randomUUID(),
          title: `Invoice ${data.number} — ${(data.total_cents / 100).toFixed(
            2,
          )} ${data.currency}`,
          reason: data.notes ?? undefined,
          amount_cents: data.total_cents,
          currency: data.currency,
          metadata: {
            source: "revenue_os.invoice",
            payload: data satisfies IssueInvoiceInput,
            threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS,
            brain_duration_ms: brain.durationMs,
          },
        },
      });

      return {
        status: "pending_approval",
        approval_id: approval.id,
        approval_status: approval.status,
        reason: "amount_exceeds_founder_threshold",
      };
    }

    const { data: row, error } = await supabase
      .from("invoices")
      .insert({
        company_id: data.company_id,
        number: data.number,
        customer_id: data.customer_id ?? null,
        subtotal_cents: data.subtotal_cents,
        tax_cents: data.tax_cents,
        total_cents: data.total_cents,
        currency: data.currency,
        issued_at: data.issued_at ?? new Date().toISOString(),
        due_at: data.due_at ?? null,
        notes: data.notes ?? null,
        sales_order_id: data.sales_order_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`invoice_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "revenue.invoice",
      action: "issue",
      entity_type: "invoice",
      entity_id: row.id,
      company_id: data.company_id,
      after: row,
      severity: "notice",
      metadata: { approval_required: false },
    });

    return { status: "created", invoice: row as InvoiceRow };
  });

const ApplyApprovedInvoiceInput = z.object({
  approval_id: z.string().uuid(),
});

/**
 * Executes a Founder-approved invoice request.
 * Reads the approval row (must be status='approved'), inserts the
 * invoice from the stored payload, and audits the final execution.
 * Idempotent via approvals.metadata.executed_invoice_id.
 */
export const revApplyApprovedInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApplyApprovedInvoiceInput.parse(i))
  .handler(async ({ data, context }): Promise<IssueInvoiceResult> => {
    const { supabase } = context;

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
      payload?: IssueInvoiceInput;
      executed_invoice_id?: string;
    };
    if (meta.source !== "revenue_os.invoice" || !meta.payload) {
      throw new Error("approval_not_invoice_source");
    }
    if (meta.executed_invoice_id) {
      const { data: existing } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", meta.executed_invoice_id)
        .maybeSingle();
      if (existing) {
        return { status: "created", invoice: existing as InvoiceRow };
      }
    }

    const payload = IssueInvoiceInput.parse(meta.payload);
    const { data: row, error } = await supabase
      .from("invoices")
      .insert({
        company_id: payload.company_id,
        number: payload.number,
        customer_id: payload.customer_id ?? null,
        subtotal_cents: payload.subtotal_cents,
        tax_cents: payload.tax_cents,
        total_cents: payload.total_cents,
        currency: payload.currency,
        issued_at: payload.issued_at ?? new Date().toISOString(),
        due_at: payload.due_at ?? null,
        notes: payload.notes ?? null,
        sales_order_id: payload.sales_order_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`invoice_insert_failed: ${error.message}`);

    await supabase
      .from("approvals")
      .update({
        metadata: { ...meta, executed_invoice_id: row.id } as never,
      })
      .eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category: "revenue.invoice",
      action: "issue",
      entity_type: "invoice",
      entity_id: row.id,
      company_id: payload.company_id,
      after: row,
      severity: "notice",
      metadata: {
        approval_required: true,
        approval_id: data.approval_id,
      },
    });

    return { status: "created", invoice: row as InvoiceRow };
  });
