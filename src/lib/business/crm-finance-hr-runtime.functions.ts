/**
 * R191 Batch 3 — CRM / Sales / Finance / HR Runtime Extension
 *
 * Extends the existing canonical Business / Revenue / Enterprise runtimes.
 * No new tables, no new runtime, no duplicate UI. Every mutation flows:
 *
 *   Founder → adoptToCanonicalPipeline → withBrain (implicit via audit) →
 *   Impact → (Approval if threshold) → Audit → Execution → Mission Control
 *
 * Canonical owners reused:
 *   persistence: public.leads, public.deals, public.customers, public.crm_notes,
 *                public.sales_orders, public.invoices, public.payments,
 *                public.journal_entries, public.journal_lines,
 *                public.ledger_entries, public.expenses, public.employees,
 *                public.approvals, public.activity_events, public.audit_logs
 *   approvals:   requestFounderApproval (R158)
 *   audit:       writeCanonicalAudit → public.write_audit
 *   auth/RLS:    requireSupabaseAuth + is_company_member
 */
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const FOUNDER_APPROVAL_THRESHOLD_CENTS = 10_00_00_00; // ₹1,00,000

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type Result = {
  status: "created" | "updated" | "pending_approval" | "ok" | "posted";
  entity_id?: string;
  approval_id?: string;
  reason?: string;
  data?: JsonValue;
};

const uuid = z.string().uuid();

// =================================================================
// CRM 1 — Lead Qualification
// =================================================================
const LeadQualifyInput = z.object({
  company_id: uuid,
  lead_id: uuid,
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(4000).nullable().optional(),
});
export const crmLeadQualify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LeadQualifyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "crm", capability: "lead_qualify", user_id: context.userId, company_id: data.company_id, summary: `qualify lead ${data.lead_id}` });
    const patch: Database["public"]["Tables"]["leads"]["Update"] = { updated_by: context.userId };
    if (data.stage) patch.stage = data.stage as Database["public"]["Enums"]["deal_stage"];
    if (data.score !== undefined) patch.score = data.score;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { data: row, error } = await supabase.from("leads").update(patch).eq("id", data.lead_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`lead_qualify_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.crm", action: "lead_qualify", entity_type: "lead", entity_id: data.lead_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "crm" } });
    return { status: "updated", entity_id: data.lead_id };
  });

// =================================================================
// CRM 2 — Lead Assignment
// =================================================================
const LeadAssignInput = z.object({ company_id: uuid, lead_id: uuid, owner_id: uuid });
export const crmLeadAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LeadAssignInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "crm", capability: "lead_assign", user_id: context.userId, company_id: data.company_id, summary: `assign lead ${data.lead_id} → ${data.owner_id}` });
    const { data: row, error } = await supabase.from("leads").update({ owner_id: data.owner_id, updated_by: context.userId }).eq("id", data.lead_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`lead_assign_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.crm", action: "lead_assign", entity_type: "lead", entity_id: data.lead_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "crm", owner_id: data.owner_id } });
    return { status: "updated", entity_id: data.lead_id };
  });

// =================================================================
// CRM 3 — Deal Pipeline Advance
// =================================================================
const DealAdvanceInput = z.object({
  company_id: uuid,
  deal_id: uuid,
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]),
  probability: z.number().int().min(0).max(100).optional(),
});
export const crmDealAdvance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DealAdvanceInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "crm", capability: "deal_advance", user_id: context.userId, company_id: data.company_id, summary: `deal ${data.deal_id} → ${data.stage}` });
    const patch: Database["public"]["Tables"]["deals"]["Update"] = { stage: data.stage as Database["public"]["Enums"]["deal_stage"], updated_by: context.userId };
    if (data.probability !== undefined) patch.probability = data.probability;
    if (data.stage === "won" || data.stage === "lost") patch.closed_at = new Date().toISOString();
    const { data: row, error } = await supabase.from("deals").update(patch).eq("id", data.deal_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`deal_advance_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.crm", action: "deal_advance", entity_type: "deal", entity_id: data.deal_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "crm", stage: data.stage } });
    return { status: "updated", entity_id: data.deal_id };
  });

// =================================================================
// CRM 4 — Customer Follow-up Note
// =================================================================
const FollowupInput = z.object({
  company_id: uuid,
  entity_type: z.enum(["customer", "lead", "deal"]),
  entity_id: uuid,
  body: z.string().min(1).max(4000),
  pinned: z.boolean().optional(),
});
export const crmCustomerFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FollowupInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "crm", capability: "customer_followup", user_id: context.userId, company_id: data.company_id, summary: `followup ${data.entity_type}/${data.entity_id}` });
    const { data: row, error } = await supabase.from("crm_notes").insert({ company_id: data.company_id, author_id: context.userId, entity_type: data.entity_type, entity_id: data.entity_id, body: data.body, pinned: data.pinned ?? false }).select("*").single();
    if (error) throw new Error(`crm_followup_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.crm", action: "customer_followup", entity_type: data.entity_type, entity_id: data.entity_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "crm" } });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// SALES 1 — Quotation Approve (SO approval_status → 'approved')
// =================================================================
const QuotationApproveInput = z.object({ company_id: uuid, sales_order_id: uuid });
export const bizSalesQuotationApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => QuotationApproveInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "sales", capability: "quotation_approve", user_id: context.userId, company_id: data.company_id, summary: `approve SO ${data.sales_order_id}` });
    const { data: so, error: soErr } = await supabase.from("sales_orders").select("total_cents,approval_status").eq("id", data.sales_order_id).eq("company_id", data.company_id).single();
    if (soErr || !so) throw new Error(`sales_order_not_found: ${soErr?.message ?? "missing"}`);
    if ((so.total_cents ?? 0) >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({ data: { company_id: data.company_id, entity_type: "business.sales_quotation", entity_id: data.sales_order_id, title: `Quotation approval · ₹${(so.total_cents / 100).toFixed(2)}`, amount_cents: so.total_cents, currency: "INR", metadata: { source: "business_os.quotation_approve", threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS } } });
      return { status: "pending_approval", approval_id: approval.id, reason: "value_exceeds_founder_threshold" };
    }
    const { data: row, error } = await supabase.from("sales_orders").update({ approval_status: "approved", updated_by: context.userId }).eq("id", data.sales_order_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`quotation_approve_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.sales", action: "quotation_approve", entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id, after: row, severity: "notice", metadata: { module: "sales" } });
    return { status: "updated", entity_id: data.sales_order_id };
  });

// =================================================================
// SALES 2 — Convert Sales Order → Invoice
// =================================================================
const ConvertInvoiceInput = z.object({ company_id: uuid, sales_order_id: uuid, due_at: z.string().optional(), number: z.string().min(1).max(64) });
export const bizSalesConvertToInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ConvertInvoiceInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "sales", capability: "convert_invoice", user_id: context.userId, company_id: data.company_id, summary: `invoice from SO ${data.sales_order_id}` });
    const { data: so, error: soErr } = await supabase.from("sales_orders").select("*").eq("id", data.sales_order_id).eq("company_id", data.company_id).single();
    if (soErr || !so) throw new Error(`sales_order_not_found: ${soErr?.message ?? "missing"}`);
    const { data: inv, error } = await supabase.from("invoices").insert({
      company_id: data.company_id, customer_id: so.customer_id, sales_order_id: so.id, number: data.number,
      currency: so.currency, subtotal_cents: so.subtotal_cents, tax_cents: so.tax_cents, total_cents: so.total_cents,
      issued_at: new Date().toISOString(), due_at: data.due_at ?? null, status: "sent" as Database["public"]["Enums"]["invoice_status"], created_by: context.userId,
    }).select("*").single();
    if (error) throw new Error(`invoice_create_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.sales", action: "convert_invoice", entity_type: "invoice", entity_id: inv.id, company_id: data.company_id, after: inv, severity: "notice", metadata: { module: "sales", sales_order_id: so.id } });
    return { status: "created", entity_id: inv.id };
  });

// =================================================================
// SALES 3 — Outstanding Receivables Report
// =================================================================
const OutstandingInput = z.object({ company_id: uuid });
export const bizSalesOutstandingReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OutstandingInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "sales", capability: "outstanding_report", user_id: context.userId, company_id: data.company_id, summary: "outstanding receivables" });
    const { data: invs, error } = await supabase.from("invoices").select("id,number,customer_id,total_cents,amount_paid_cents,due_at,status,issued_at").eq("company_id", data.company_id).in("status", ["sent", "overdue"] as Database["public"]["Enums"]["invoice_status"][]).order("due_at", { ascending: true }).limit(500);
    if (error) throw new Error(`outstanding_failed: ${error.message}`);
    const now = Date.now();
    const rows = (invs ?? []).map((i) => ({ ...i, outstanding_cents: (i.total_cents ?? 0) - (i.amount_paid_cents ?? 0), overdue_days: i.due_at ? Math.max(0, Math.floor((now - new Date(i.due_at).getTime()) / 86_400_000)) : 0 }));
    const total_outstanding = rows.reduce((a, r) => a + r.outstanding_cents, 0);
    await writeCanonicalAudit(supabase, { category: "business.sales", action: "outstanding_report", entity_type: "report", company_id: data.company_id, severity: "info", metadata: { module: "sales", count: rows.length, total_outstanding_cents: total_outstanding } });
    return { count: rows.length, total_outstanding_cents: total_outstanding, rows };
  });

// =================================================================
// FIN 1 — Ledger Journal Post (double-entry)
// =================================================================
const JournalLineIn = z.object({ account_id: uuid, debit_cents: z.number().int().min(0).default(0), credit_cents: z.number().int().min(0).default(0), memo: z.string().max(400).nullable().optional() });
const JournalPostInput = z.object({
  company_id: uuid,
  number: z.string().min(1).max(64),
  entry_date: z.string().optional(),
  currency: z.string().default("INR"),
  memo: z.string().max(400).nullable().optional(),
  reference_type: z.string().max(64).nullable().optional(),
  reference_id: uuid.nullable().optional(),
  lines: z.array(JournalLineIn).min(2),
});
export const finLedgerPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => JournalPostInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "finance", capability: "ledger_post", user_id: context.userId, company_id: data.company_id, summary: `journal ${data.number}` });
    const total_debit = data.lines.reduce((a, l) => a + (l.debit_cents ?? 0), 0);
    const total_credit = data.lines.reduce((a, l) => a + (l.credit_cents ?? 0), 0);
    if (total_debit !== total_credit) throw new Error(`journal_unbalanced: debit=${total_debit} credit=${total_credit}`);
    if (total_debit >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({ data: { company_id: data.company_id, entity_type: "business.journal_post", entity_id: crypto.randomUUID(), title: `Journal ${data.number} · ₹${(total_debit / 100).toFixed(2)}`, amount_cents: total_debit, currency: data.currency, metadata: { source: "business_os.ledger_post", payload: data, threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS } } });
      return { status: "pending_approval", approval_id: approval.id, reason: "value_exceeds_founder_threshold" };
    }
    const entry_date = data.entry_date ?? new Date().toISOString().slice(0, 10);
    const { data: entry, error: eErr } = await supabase.from("journal_entries").insert({
      company_id: data.company_id, number: data.number, entry_date, currency: data.currency, memo: data.memo ?? null,
      reference_type: data.reference_type ?? null, reference_id: data.reference_id ?? null,
      total_debit_cents: total_debit, total_credit_cents: total_credit,
      status: "posted" as Database["public"]["Enums"]["fin_journal_status"],
      posted_at: new Date().toISOString(), posted_by: context.userId, created_by: context.userId,
    }).select("*").single();
    if (eErr) throw new Error(`journal_entry_failed: ${eErr.message}`);
    const linesPayload = data.lines.map((l, idx) => ({ entry_id: entry.id, account_id: l.account_id, debit_cents: l.debit_cents ?? 0, credit_cents: l.credit_cents ?? 0, memo: l.memo ?? null, sort_order: idx }));
    const { error: lErr } = await supabase.from("journal_lines").insert(linesPayload);
    if (lErr) throw new Error(`journal_lines_failed: ${lErr.message}`);
    // Mirror to ledger_entries for the fast-read ledger.
    const ledgerRows = data.lines.map((l) => ({ company_id: data.company_id, account_id: l.account_id, entry_date, debit_cents: l.debit_cents ?? 0, credit_cents: l.credit_cents ?? 0, currency: data.currency, memo: l.memo ?? data.memo ?? null, reference_type: data.reference_type ?? "journal_entry", reference_id: entry.id, created_by: context.userId }));
    await supabase.from("ledger_entries").insert(ledgerRows);
    await writeCanonicalAudit(supabase, { category: "business.finance", action: "ledger_post", entity_type: "journal_entry", entity_id: entry.id, company_id: data.company_id, after: entry, severity: "notice", metadata: { module: "finance", total_debit_cents: total_debit } });
    return { status: "posted", entity_id: entry.id };
  });

// =================================================================
// FIN 2 — Expense Approve
// =================================================================
const ExpenseApproveInput = z.object({ company_id: uuid, expense_id: uuid, decision: z.enum(["approve", "reject"]) });
export const finExpenseApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ExpenseApproveInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "finance", capability: "expense_approve", user_id: context.userId, company_id: data.company_id, summary: `expense ${data.decision} ${data.expense_id}` });
    const { data: exp, error: eErr } = await supabase.from("expenses").select("amount_cents,currency,status").eq("id", data.expense_id).eq("company_id", data.company_id).single();
    if (eErr || !exp) throw new Error(`expense_not_found: ${eErr?.message ?? "missing"}`);
    if (data.decision === "approve" && (exp.amount_cents ?? 0) >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({ data: { company_id: data.company_id, entity_type: "business.expense_approve", entity_id: data.expense_id, title: `Expense approval · ₹${(exp.amount_cents / 100).toFixed(2)}`, amount_cents: exp.amount_cents, currency: exp.currency ?? "INR", metadata: { source: "business_os.expense_approve", threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS } } });
      return { status: "pending_approval", approval_id: approval.id, reason: "value_exceeds_founder_threshold" };
    }
    const status: Database["public"]["Enums"]["record_status"] = data.decision === "approve" ? "active" : "archived";
    const { data: row, error } = await supabase.from("expenses").update({ status, updated_by: context.userId }).eq("id", data.expense_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`expense_approve_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.finance", action: `expense_${data.decision}`, entity_type: "expense", entity_id: data.expense_id, company_id: data.company_id, after: row, severity: "notice", metadata: { module: "finance" } });
    return { status: "updated", entity_id: data.expense_id };
  });

// =================================================================
// FIN 3 — Payment Reconciliation (link payment ↔ invoice)
// =================================================================
const PaymentReconcileInput = z.object({ company_id: uuid, payment_id: uuid, invoice_id: uuid });
export const finPaymentReconcile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PaymentReconcileInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "finance", capability: "payment_reconcile", user_id: context.userId, company_id: data.company_id, summary: `reconcile ${data.payment_id} → ${data.invoice_id}` });
    const [{ data: pay, error: pErr }, { data: inv, error: iErr }] = await Promise.all([
      supabase.from("payments").select("amount_cents,currency,status").eq("id", data.payment_id).eq("company_id", data.company_id).single(),
      supabase.from("invoices").select("total_cents,amount_paid_cents,currency").eq("id", data.invoice_id).eq("company_id", data.company_id).single(),
    ]);
    if (pErr || !pay) throw new Error(`payment_not_found: ${pErr?.message ?? "missing"}`);
    if (iErr || !inv) throw new Error(`invoice_not_found: ${iErr?.message ?? "missing"}`);
    const { error: uPay } = await supabase.from("payments").update({ invoice_id: data.invoice_id, status: "succeeded" as Database["public"]["Enums"]["payment_status"] }).eq("id", data.payment_id).eq("company_id", data.company_id);
    if (uPay) throw new Error(`payment_link_failed: ${uPay.message}`);
    const newPaid = (inv.amount_paid_cents ?? 0) + (pay.amount_cents ?? 0);
    const fullyPaid = newPaid >= (inv.total_cents ?? 0);
    const nextStatus: Database["public"]["Enums"]["invoice_status"] = fullyPaid ? "paid" : "sent";
    const invPatch: Database["public"]["Tables"]["invoices"]["Update"] = { amount_paid_cents: newPaid, status: nextStatus, updated_by: context.userId };
    if (fullyPaid) invPatch.paid_at = new Date().toISOString();
    const { data: invRow, error: uInv } = await supabase.from("invoices").update(invPatch).eq("id", data.invoice_id).eq("company_id", data.company_id).select("*").single();
    if (uInv) throw new Error(`invoice_update_failed: ${uInv.message}`);
    await writeCanonicalAudit(supabase, { category: "business.finance", action: "payment_reconcile", entity_type: "invoice", entity_id: data.invoice_id, company_id: data.company_id, after: invRow, severity: "notice", metadata: { module: "finance", payment_id: data.payment_id, amount_cents: pay.amount_cents, fully_paid: fullyPaid } });
    return { status: "ok", entity_id: data.invoice_id, data: { fully_paid: fullyPaid, amount_paid_cents: newPaid } };
  });

// =================================================================
// FIN 4 — Cash Flow Snapshot
// =================================================================
const CashFlowInput = z.object({ company_id: uuid, days: z.number().int().min(1).max(365).default(30) });
export const finCashFlowSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CashFlowInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "finance", capability: "cashflow_snapshot", user_id: context.userId, company_id: data.company_id, summary: `cashflow ${data.days}d` });
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString().slice(0, 10);
    const { data: rows, error } = await supabase.from("ledger_entries").select("debit_cents,credit_cents,entry_date").eq("company_id", data.company_id).gte("entry_date", since).limit(10_000);
    if (error) throw new Error(`cashflow_failed: ${error.message}`);
    const inflow = (rows ?? []).reduce((a, r) => a + (r.credit_cents ?? 0), 0);
    const outflow = (rows ?? []).reduce((a, r) => a + (r.debit_cents ?? 0), 0);
    const net = inflow - outflow;
    await writeCanonicalAudit(supabase, { category: "business.finance", action: "cashflow_snapshot", entity_type: "report", company_id: data.company_id, severity: "info", metadata: { module: "finance", days: data.days, inflow_cents: inflow, outflow_cents: outflow, net_cents: net } });
    return { days: data.days, since, inflow_cents: inflow, outflow_cents: outflow, net_cents: net, count: rows?.length ?? 0 };
  });

// =================================================================
// FIN 5 — Financial Report (accounts trial-balance style)
// =================================================================
const FinReportInput = z.object({ company_id: uuid });
export const finReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FinReportInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "finance", capability: "reports", user_id: context.userId, company_id: data.company_id, summary: "financial report" });
    const [ledger, invSum, expSum] = await Promise.all([
      supabase.from("ledger_entries").select("account_id,debit_cents,credit_cents").eq("company_id", data.company_id).limit(20_000),
      supabase.from("invoices").select("total_cents,amount_paid_cents,status").eq("company_id", data.company_id).limit(10_000),
      supabase.from("expenses").select("amount_cents,status").eq("company_id", data.company_id).limit(10_000),
    ]);
    if (ledger.error) throw new Error(`ledger_read_failed: ${ledger.error.message}`);
    const byAccount = new Map<string, { debit: number; credit: number }>();
    for (const r of ledger.data ?? []) {
      const acc = byAccount.get(r.account_id) ?? { debit: 0, credit: 0 };
      acc.debit += r.debit_cents ?? 0; acc.credit += r.credit_cents ?? 0;
      byAccount.set(r.account_id, acc);
    }
    const trial_balance = Array.from(byAccount, ([account_id, v]) => ({ account_id, debit_cents: v.debit, credit_cents: v.credit, balance_cents: v.debit - v.credit }));
    const total_invoiced = (invSum.data ?? []).reduce((a, r) => a + (r.total_cents ?? 0), 0);
    const total_collected = (invSum.data ?? []).reduce((a, r) => a + (r.amount_paid_cents ?? 0), 0);
    const total_expenses = (expSum.data ?? []).filter((e) => e.status === "active").reduce((a, r) => a + (r.amount_cents ?? 0), 0);
    await writeCanonicalAudit(supabase, { category: "business.finance", action: "reports", entity_type: "report", company_id: data.company_id, severity: "info", metadata: { module: "finance", accounts: trial_balance.length, total_invoiced_cents: total_invoiced, total_collected_cents: total_collected, total_expenses_cents: total_expenses } });
    return { trial_balance, total_invoiced_cents: total_invoiced, total_collected_cents: total_collected, total_expenses_cents: total_expenses, gross_margin_cents: total_collected - total_expenses };
  });

// =================================================================
// HR 1 — Attendance Mark
// =================================================================
const AttendanceInput = z.object({
  company_id: uuid,
  employee_id: uuid,
  event: z.enum(["check_in", "check_out", "break_start", "break_end"]),
  at: z.string().optional(),
  location: z.string().max(200).nullable().optional(),
});
export const hrAttendanceMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AttendanceInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "hr", capability: "attendance", user_id: context.userId, company_id: data.company_id, summary: `attendance ${data.event} ${data.employee_id}` });
    const occurred_at = data.at ?? new Date().toISOString();
    const { data: row, error } = await supabase.from("activity_events").insert({ company_id: data.company_id, actor_id: context.userId, entity_type: "employee", entity_id: data.employee_id, action: `attendance.${data.event}`, source: "hr.attendance", occurred_at, metadata: { location: data.location ?? null } }).select("*").single();
    if (error) throw new Error(`attendance_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.hr", action: `attendance_${data.event}`, entity_type: "employee", entity_id: data.employee_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "hr", event: data.event, occurred_at } });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// HR 2 — Leave Request (via approvals)
// =================================================================
const LeaveRequestInput = z.object({
  company_id: uuid,
  employee_id: uuid,
  leave_type: z.enum(["casual", "sick", "earned", "unpaid", "maternity", "paternity"]),
  from_date: z.string(),
  to_date: z.string(),
  reason: z.string().max(1000).optional(),
});
export const hrLeaveRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LeaveRequestInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "hr", capability: "leave_request", user_id: context.userId, company_id: data.company_id, summary: `leave ${data.leave_type} ${data.from_date}→${data.to_date}` });
    const { data: row, error } = await supabase.from("approvals").insert({
      company_id: data.company_id, requested_by: context.userId, entity_type: "hr.leave_request", entity_id: data.employee_id,
      title: `Leave · ${data.leave_type} · ${data.from_date} → ${data.to_date}`, status: "pending",
      metadata: { source: "hr.leave_request", leave_type: data.leave_type, from_date: data.from_date, to_date: data.to_date, reason: data.reason ?? null, employee_id: data.employee_id },
    }).select("*").single();
    if (error) throw new Error(`leave_request_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.hr", action: "leave_request", entity_type: "approval", entity_id: row.id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "hr", employee_id: data.employee_id } });
    return { status: "created", entity_id: row.id, reason: "leave_pending_approval" };
  });

// =================================================================
// HR 3 — Leave Approve/Reject
// =================================================================
const LeaveApproveInput = z.object({ company_id: uuid, approval_id: uuid, decision: z.enum(["approve", "reject"]), note: z.string().max(400).optional() });
export const hrLeaveApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LeaveApproveInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "hr", capability: "leave_approve", user_id: context.userId, company_id: data.company_id, summary: `leave ${data.decision} ${data.approval_id}` });
    const { data: row, error } = await supabase.from("approvals").update({ status: data.decision === "approve" ? "approved" : "rejected", approver_id: context.userId, decided_at: new Date().toISOString(), reason: data.note ?? null }).eq("id", data.approval_id).eq("company_id", data.company_id).eq("entity_type", "hr.leave_request").select("*").single();
    if (error) throw new Error(`leave_approve_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.hr", action: `leave_${data.decision}`, entity_type: "approval", entity_id: data.approval_id, company_id: data.company_id, after: row, severity: "notice", metadata: { module: "hr" } });
    return { status: "updated", entity_id: data.approval_id };
  });

// =================================================================
// HR 4 — Payroll Run (creates per-employee expense entries)
// =================================================================
const PayrollLine = z.object({ employee_id: uuid, amount_cents: z.number().int().min(0), memo: z.string().max(200).optional() });
const PayrollRunInput = z.object({
  company_id: uuid,
  period: z.string().min(1).max(20),
  currency: z.string().default("INR"),
  lines: z.array(PayrollLine).min(1),
});
export const hrPayrollRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PayrollRunInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const total = data.lines.reduce((a, l) => a + l.amount_cents, 0);
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "hr", capability: "payroll_run", user_id: context.userId, company_id: data.company_id, summary: `payroll ${data.period} · ${data.lines.length} employees · ₹${(total / 100).toFixed(2)}` });
    if (total >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({ data: { company_id: data.company_id, entity_type: "business.payroll_run", entity_id: crypto.randomUUID(), title: `Payroll ${data.period} · ${data.lines.length} employees · ₹${(total / 100).toFixed(2)}`, amount_cents: total, currency: data.currency, metadata: { source: "hr.payroll_run", period: data.period, payload: data, threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS } } });
      return { status: "pending_approval", approval_id: approval.id, reason: "payroll_total_exceeds_founder_threshold" };
    }
    const spent_on = new Date().toISOString().slice(0, 10);
    const rows = data.lines.map((l) => ({ company_id: data.company_id, amount_cents: l.amount_cents, currency: data.currency, category: "payroll", vendor: `employee:${l.employee_id}`, memo: l.memo ?? `Payroll · ${data.period}`, spent_on, status: "active" as Database["public"]["Enums"]["record_status"], created_by: context.userId }));
    const { data: inserted, error } = await supabase.from("expenses").insert(rows).select("id");
    if (error) throw new Error(`payroll_run_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.hr", action: "payroll_run", entity_type: "payroll", company_id: data.company_id, severity: "notice", metadata: { module: "hr", period: data.period, employees: data.lines.length, total_cents: total, expense_ids: inserted?.map((r) => r.id) ?? [] } });
    return { status: "posted", data: { period: data.period, employees: data.lines.length, total_cents: total } };
  });

// =================================================================
// HR 5 — Performance Review (patched into employee.metadata.reviews[])
// =================================================================
const ReviewInput = z.object({
  company_id: uuid,
  employee_id: uuid,
  period: z.string().min(1).max(20),
  rating: z.number().min(1).max(5),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
});
export const hrPerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReviewInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "hr", capability: "performance_review", user_id: context.userId, company_id: data.company_id, summary: `review ${data.employee_id} ${data.period}` });
    const { data: emp, error: gErr } = await supabase.from("employees").select("metadata").eq("id", data.employee_id).eq("company_id", data.company_id).single();
    if (gErr || !emp) throw new Error(`employee_not_found: ${gErr?.message ?? "missing"}`);
    const meta = (emp.metadata as Record<string, unknown>) ?? {};
    const reviews = Array.isArray(meta.reviews) ? (meta.reviews as unknown[]) : [];
    const entry = { period: data.period, rating: data.rating, strengths: data.strengths ?? null, improvements: data.improvements ?? null, reviewer_id: context.userId, at: new Date().toISOString() };
    const nextMeta = { ...meta, reviews: [...reviews, entry] };
    const { data: row, error } = await supabase.from("employees").update({ metadata: nextMeta as never }).eq("id", data.employee_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`review_save_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.hr", action: "performance_review", entity_type: "employee", entity_id: data.employee_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "hr", period: data.period, rating: data.rating } });
    return { status: "updated", entity_id: data.employee_id };
  });

// =================================================================
// HR 6 — Employee Document (patched into employee.metadata.documents[])
// =================================================================
const EmployeeDocInput = z.object({
  company_id: uuid,
  employee_id: uuid,
  kind: z.enum(["id_proof", "address_proof", "contract", "offer_letter", "resignation", "certificate", "other"]),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  media_id: uuid.optional(),
});
export const hrEmployeeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EmployeeDocInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "hr", capability: "employee_document", user_id: context.userId, company_id: data.company_id, summary: `doc ${data.kind} ${data.employee_id}` });
    const { data: emp, error: gErr } = await supabase.from("employees").select("metadata").eq("id", data.employee_id).eq("company_id", data.company_id).single();
    if (gErr || !emp) throw new Error(`employee_not_found: ${gErr?.message ?? "missing"}`);
    const meta = (emp.metadata as Record<string, unknown>) ?? {};
    const docs = Array.isArray(meta.documents) ? (meta.documents as unknown[]) : [];
    const entry = { kind: data.kind, title: data.title, url: data.url, media_id: data.media_id ?? null, uploaded_by: context.userId, at: new Date().toISOString() };
    const nextMeta = { ...meta, documents: [...docs, entry] };
    const { data: row, error } = await supabase.from("employees").update({ metadata: nextMeta as never }).eq("id", data.employee_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`document_save_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.hr", action: "employee_document", entity_type: "employee", entity_id: data.employee_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "hr", kind: data.kind, title: data.title } });
    return { status: "updated", entity_id: data.employee_id };
  });
