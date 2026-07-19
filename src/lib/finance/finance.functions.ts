/**
 * HAPPY X — R25 Finance & Accounting server functions.
 * Auth-gated RPC surface. Every mutation flows through immutable journals.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  coa, journal, autoPost, vendorBills, receivables, notes, bank, gst, reports, financeDashboard,
} from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

// Chart of accounts
export const finListAccounts = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => coa.list(context.supabase, data.company_id));
export const finCreateAccount = auth().inputValidator((d: Parameters<typeof coa.create>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCreateAccount", source: "api", module: "finance.core.finCreateAccount" });
    return coa.create(context.supabase, data);
  });export const finUpdateAccount = auth().inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finUpdateAccount", source: "api", module: "finance.core.finUpdateAccount" });
    return coa.update(context.supabase, data.id, data.patch);
  });export const finSeedChartOfAccounts = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => coa.seedIndianStandard(context.supabase, data.company_id));

// Journals
export const finListJournals = auth().inputValidator((d: Parameters<typeof journal.list>[2] & { company_id: string }) => d)
  .handler(async ({ data, context }) => journal.list(context.supabase, data.company_id, data));
export const finGetJournal = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => journal.get(context.supabase, data.id));
export const finCreateJournal = auth().inputValidator((d: Parameters<typeof journal.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCreateJournal", source: "api", module: "finance.core.finCreateJournal" });
    return journal.create(context.supabase, context.userId, data);
  });export const finPostJournal = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => journal.post(context.supabase, context.userId, data.id));
export const finReverseJournal = auth().inputValidator((d: { id: string; memo?: string }) => d)
  .handler(async ({ data, context }) => journal.reverse(context.supabase, context.userId, data.id, data.memo));

// Auto-postings
export const finPostInvoice = auth().inputValidator((d: { invoice_id: string }) => d)
  .handler(async ({ data, context }) => autoPost.invoice(context.supabase, context.userId, data.invoice_id));
export const finPostVendorBill = auth().inputValidator((d: { bill_id: string; default_expense_code?: string }) => d)
  .handler(async ({ data, context }) => autoPost.vendorBill(context.supabase, context.userId, data.bill_id, data.default_expense_code));
export const finPostPayment = auth().inputValidator((d: { payment_id: string; bank_code?: string }) => d)
  .handler(async ({ data, context }) => autoPost.paymentReceived(context.supabase, context.userId, data.payment_id, data.bank_code));

// Vendor bills (AP)
export const finListVendorBills = auth().inputValidator((d: Parameters<typeof vendorBills.list>[2] & { company_id: string }) => d)
  .handler(async ({ data, context }) => vendorBills.list(context.supabase, data.company_id, data));
export const finGetVendorBill = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => vendorBills.get(context.supabase, data.id));
export const finCreateVendorBill = auth().inputValidator((d: Parameters<typeof vendorBills.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCreateVendorBill", source: "api", module: "finance.core.finCreateVendorBill" });
    return vendorBills.create(context.supabase, context.userId, data);
  });export const finApproveVendorBill = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finApproveVendorBill", source: "api", module: "finance.core.finApproveVendorBill" });
    return vendorBills.approve(context.supabase, context.userId, data.id);
  });export const finMarkBillPaid = auth().inputValidator((d: { id: string; amount_cents: number }) => d)
  .handler(async ({ data, context }) => vendorBills.markPaid(context.supabase, context.userId, data.id, data.amount_cents));
export const finPayablesOutstanding = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => vendorBills.outstanding(context.supabase, data.company_id));

// AR helpers
export const finReceivablesOutstanding = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => receivables.outstanding(context.supabase, data.company_id));
export const finReceivablesAging = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => receivables.agingBuckets(context.supabase, data.company_id));
export const finCustomerStatement = auth().inputValidator((d: { company_id: string; customer_id: string }) => d)
  .handler(async ({ data, context }) => receivables.customerStatement(context.supabase, data.company_id, data.customer_id));

// Notes
export const finListNotes = auth().inputValidator((d: { company_id: string; kind?: "credit" | "debit" }) => d)
  .handler(async ({ data, context }) => notes.list(context.supabase, data.company_id, data.kind));
export const finCreateNote = auth().inputValidator((d: Parameters<typeof notes.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCreateNote", source: "api", module: "finance.core.finCreateNote" });
    return notes.create(context.supabase, context.userId, data);
  });
// Bank
export const finListBankAccounts = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finListBankAccounts", source: "api", module: "finance.core.finListBankAccounts" });
    return bank.listAccounts(context.supabase, data.company_id);
  });export const finCreateBankAccount = auth().inputValidator((d: Parameters<typeof bank.createAccount>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCreateBankAccount", source: "api", module: "finance.core.finCreateBankAccount" });
    return bank.createAccount(context.supabase, data);
  });export const finListBankTxns = auth().inputValidator((d: { bank_account_id: string; from?: string; to?: string; reconciled?: boolean; limit?: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finListBankTxns", source: "api", module: "finance.core.finListBankTxns" });
    return bank.listTxns(context.supabase, data.bank_account_id, data);
  });export const finRecordBankTxn = auth().inputValidator((d: Parameters<typeof bank.recordTxn>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finRecordBankTxn", source: "api", module: "finance.core.finRecordBankTxn" });
    return bank.recordTxn(context.supabase, context.userId, data);
  });export const finReconcileBankTxn = auth().inputValidator((d: { txn_id: string; journal_entry_id?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finReconcileBankTxn", source: "api", module: "finance.core.finReconcileBankTxn" });
    return bank.reconcile(context.supabase, data.txn_id, data.journal_entry_id);
  });export const finStartReconciliation = auth().inputValidator((d: Parameters<typeof bank.startReconciliation>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finStartReconciliation", source: "api", module: "finance.core.finStartReconciliation" });
    return bank.startReconciliation(context.supabase, data);
  });export const finCompleteReconciliation = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCompleteReconciliation", source: "api", module: "finance.core.finCompleteReconciliation" });
    return bank.completeReconciliation(context.supabase, context.userId, data.id);
  });
// GST
export const finListGSTReturns = auth().inputValidator((d: { company_id: string; limit?: number }) => d)
  .handler(async ({ data, context }) => gst.listReturns(context.supabase, data.company_id, data.limit));
export const finComputeGST = auth().inputValidator((d: { company_id: string; from: string; to: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finComputeGST", source: "api", module: "finance.core.finComputeGST" });
    return gst.computePeriod(context.supabase, data.company_id, data.from, data.to);
  });export const finCreateGSTReturn = auth().inputValidator((d: Parameters<typeof gst.createReturn>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "finCreateGSTReturn", source: "api", module: "finance.core.finCreateGSTReturn" });
    return gst.createReturn(context.supabase, context.userId, data);
  });export const finFileGSTReturn = auth().inputValidator((d: { id: string; reference?: string }) => d)
  .handler(async ({ data, context }) => gst.fileReturn(context.supabase, context.userId, data.id, data.reference));

// Reports
export const finTrialBalance = auth().inputValidator((d: { company_id: string; from?: string; to?: string }) => d)
  .handler(async ({ data, context }) => reports.trialBalance(context.supabase, data.company_id, data.from, data.to));
export const finBalanceSheet = auth().inputValidator((d: { company_id: string; as_of?: string }) => d)
  .handler(async ({ data, context }) => reports.balanceSheet(context.supabase, data.company_id, data.as_of));
export const finProfitLoss = auth().inputValidator((d: { company_id: string; from: string; to: string }) => d)
  .handler(async ({ data, context }) => reports.profitAndLoss(context.supabase, data.company_id, data.from, data.to));
export const finCashFlow = auth().inputValidator((d: { company_id: string; from: string; to: string }) => d)
  .handler(async ({ data, context }) => reports.cashFlow(context.supabase, data.company_id, data.from, data.to));
export const finAccountLedger = auth().inputValidator((d: { company_id: string; account_id: string; from?: string; to?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => reports.accountLedger(context.supabase, data.company_id, data.account_id, data.from, data.to, data.limit));

// Dashboard
export const finDashboard = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => financeDashboard.overview(context.supabase, data.company_id));
