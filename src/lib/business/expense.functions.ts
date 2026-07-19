/**
 * R183 Batch D — Business OS Expense Runtime (End-to-End)
 *
 * ONE fully wired Business OS mutation flow, chosen as the canonical
 * template that Batches E+ will replicate across CRM / Sales / Purchase
 * / Inventory / HR / Finance:
 *
 *   Founder / Admin request
 *      ↓
 *   Impact analysis (amount threshold)
 *      ↓  above threshold                     ↓  below threshold
 *   requestFounderApproval (R158)          insert public.expenses
 *      ↓ pending in public.approvals          ↓
 *   Founder decides via decideFounderApp.  writeCanonicalAudit
 *      ↓ approved
 *   bizApplyApprovedExpense
 *      ↓ insert public.expenses
 *      ↓ writeCanonicalAudit
 *
 * Canonical owners reused — no new tables, no new runtime, no V2:
 *   - persistence:   public.expenses
 *   - approvals:     public.approvals via requestFounderApproval / decideFounderApproval
 *   - audit:         writeCanonicalAudit → public.write_audit
 *   - auth/RLS:      requireSupabaseAuth + is_company_member / is_company_admin
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

/**
 * Founder-approval threshold for expenses (in cents).
 * Anything >= this amount blocks and requires Founder approval.
 */
const FOUNDER_APPROVAL_THRESHOLD_CENTS = 10_00_00_00; // 10,00,000 = 10 lakh cents

const CreateExpenseInput = z.object({
  company_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  currency: z.string().min(3).max(8).default("INR"),
  vendor: z.string().max(200).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
  spent_on: z.string().optional(), // ISO date; DB default = today
  attachment_url: z.string().url().nullable().optional(),
});

type CreateExpenseInput = z.infer<typeof CreateExpenseInput>;

interface ExpenseRow {
  id: string;
  company_id: string;
  amount_cents: number;
  currency: string;
  vendor: string | null;
  category: string | null;
  memo: string | null;
  spent_on: string;
  status: string;
}

interface CreateExpenseResult {
  status: "created" | "pending_approval";
  expense?: ExpenseRow;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
}

/**
 * Canonical Business OS expense mutation.
 * Runs impact analysis; routes through R158 when Founder approval is
 * required, otherwise inserts and audits directly.
 */
export const bizCreateExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateExpenseInput.parse(i))
  .handler(async ({ data, context }): Promise<CreateExpenseResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "expense", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `expense ${data.description ?? data.category ?? ""}`, metadata: { amount_cents: data.amount_cents, currency: data.currency } });
    const requiresApproval =
      data.amount_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS;

    if (requiresApproval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "business.expense",
          entity_id: crypto.randomUUID(),
          title: `Expense: ${data.vendor ?? "unspecified vendor"} — ${(
            data.amount_cents / 100
          ).toFixed(2)} ${data.currency}`,
          reason: data.memo ?? undefined,
          amount_cents: data.amount_cents,
          currency: data.currency,
          metadata: {
            source: "business_os.expense",
            payload: data satisfies CreateExpenseInput,
            threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS,
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
      .from("expenses")
      .insert({
        company_id: data.company_id,
        amount_cents: data.amount_cents,
        currency: data.currency,
        vendor: data.vendor ?? null,
        category: data.category ?? null,
        memo: data.memo ?? null,
        spent_on: data.spent_on ?? new Date().toISOString().slice(0, 10),
        attachment_url: data.attachment_url ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`expense_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "business.expense",
      action: "create",
      entity_type: "expense",
      entity_id: row.id,
      company_id: data.company_id,
      after: row,
      severity: "notice",
      metadata: { approval_required: false },
    });

    return {
      status: "created",
      expense: row as ExpenseRow,
    };
  });

const ApplyApprovedExpenseInput = z.object({
  approval_id: z.string().uuid(),
});

/**
 * Executes a previously Founder-approved expense request.
 * Reads the approval row (must be status='approved'), inserts the
 * expense from the stored payload, and audits the final execution.
 * Idempotent via approvals.metadata.executed_expense_id.
 */
export const bizApplyApprovedExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApplyApprovedExpenseInput.parse(i))
  .handler(async ({ data, context }): Promise<CreateExpenseResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "expense", capability: "apply_approved", user_id: context.userId, company_id: "00000000-0000-0000-0000-000000000000", summary: `apply approved expense`, metadata: { approval_id: data.approval_id } });

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
      payload?: CreateExpenseInput;
      executed_expense_id?: string;
    };
    if (meta.source !== "business_os.expense" || !meta.payload) {
      throw new Error("approval_not_expense_source");
    }
    if (meta.executed_expense_id) {
      const { data: existing } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", meta.executed_expense_id)
        .maybeSingle();
      if (existing) {
        return { status: "created", expense: existing as ExpenseRow };
      }
    }

    const payload = CreateExpenseInput.parse(meta.payload);
    const { data: row, error } = await supabase
      .from("expenses")
      .insert({
        company_id: payload.company_id,
        amount_cents: payload.amount_cents,
        currency: payload.currency,
        vendor: payload.vendor ?? null,
        category: payload.category ?? null,
        memo: payload.memo ?? null,
        spent_on: payload.spent_on ?? new Date().toISOString().slice(0, 10),
        attachment_url: payload.attachment_url ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`expense_insert_failed: ${error.message}`);

    await supabase
      .from("approvals")
      .update({
        metadata: { ...meta, executed_expense_id: row.id } as never,
      })
      .eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category: "business.expense",
      action: "create",
      entity_type: "expense",
      entity_id: row.id,
      company_id: payload.company_id,
      after: row,
      severity: "notice",
      metadata: {
        approval_required: true,
        approval_id: data.approval_id,
      },
    });

    return { status: "created", expense: row as ExpenseRow };
  });
