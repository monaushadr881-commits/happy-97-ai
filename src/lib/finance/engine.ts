/**
 * HAPPY X — R25 Finance & Accounting Runtime engine.
 * Real GL / journal / AP / AR / bank / GST / reports logic.
 * Every posted journal is immutable (enforced by DB trigger).
 * Reuses chart_of_accounts, ledger_entries, invoices, payments, tax_rates,
 * write_audit and RBAC helpers.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type SB = SupabaseClient<any, "public", any>;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function writeAudit(sb: SB, a: {
  category: string; action: string; entity_type?: string; entity_id?: string;
  company_id?: string; before?: unknown; after?: unknown; severity?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await sb.rpc("write_audit", {
      _category: a.category, _action: a.action,
      _entity_type: a.entity_type ?? null, _entity_id: a.entity_id ?? null,
      _company_id: a.company_id ?? null, _before: a.before ?? null,
      _after: a.after ?? null, _severity: (a.severity as any) ?? "info",
      _metadata: (a.metadata ?? {}) as any,
    });
  } catch { /* best-effort */ }
}

async function nextNumber(sb: SB, table: string, companyId: string, prefix: string) {
  const { count } = await sb.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
  const seq = ((count ?? 0) + 1).toString().padStart(5, "0");
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

type AccountKind = "asset" | "liability" | "equity" | "income" | "expense" | "cogs" | "inventory" | "depreciation" | string;
type Line = { account_id: string; debit_cents?: number; credit_cents?: number; memo?: string; tax_rate_id?: string; contact_type?: string; contact_id?: string };

// =====================================================================
// Chart of Accounts
// =====================================================================
export const coa = {
  list: async (sb: SB, companyId: string) =>
    unwrap(await sb.from("chart_of_accounts").select("*").eq("company_id", companyId).eq("is_active", true).order("code")),
  create: async (sb: SB, d: { company_id: string; code: string; name: string; kind: AccountKind; parent_id?: string; currency?: string }) =>
    unwrap(await sb.from("chart_of_accounts").insert({ ...d, currency: d.currency ?? "INR" }).select("*").single()),
  update: async (sb: SB, id: string, patch: Record<string, unknown>) =>
    unwrap(await sb.from("chart_of_accounts").update(patch).eq("id", id).select("*").single()),
  seedIndianStandard: async (sb: SB, companyId: string) => {
    const std: Array<{ code: string; name: string; kind: AccountKind }> = [
      { code: "1000", name: "Cash on Hand", kind: "asset" },
      { code: "1100", name: "Bank", kind: "asset" },
      { code: "1200", name: "Accounts Receivable", kind: "asset" },
      { code: "1300", name: "Inventory", kind: "inventory" },
      { code: "1400", name: "Input GST", kind: "asset" },
      { code: "1500", name: "Fixed Assets", kind: "asset" },
      { code: "1510", name: "Accumulated Depreciation", kind: "depreciation" },
      { code: "2000", name: "Accounts Payable", kind: "liability" },
      { code: "2100", name: "Output GST", kind: "liability" },
      { code: "2200", name: "GST Payable", kind: "liability" },
      { code: "2300", name: "Loans Payable", kind: "liability" },
      { code: "3000", name: "Owner's Equity", kind: "equity" },
      { code: "3100", name: "Retained Earnings", kind: "equity" },
      { code: "4000", name: "Sales Revenue", kind: "income" },
      { code: "4100", name: "Service Revenue", kind: "income" },
      { code: "4200", name: "Other Income", kind: "income" },
      { code: "5000", name: "Cost of Goods Sold", kind: "cogs" },
      { code: "6000", name: "Salaries & Wages", kind: "expense" },
      { code: "6100", name: "Rent", kind: "expense" },
      { code: "6200", name: "Utilities", kind: "expense" },
      { code: "6300", name: "Marketing", kind: "expense" },
      { code: "6400", name: "Office Supplies", kind: "expense" },
      { code: "6500", name: "Depreciation Expense", kind: "expense" },
      { code: "6900", name: "Miscellaneous Expenses", kind: "expense" },
    ];
    const existing = unwrap(await sb.from("chart_of_accounts").select("code").eq("company_id", companyId)) as any[];
    const have = new Set(existing.map((r) => r.code));
    const missing = std.filter((r) => !have.has(r.code)).map((r) => ({ ...r, company_id: companyId, currency: "INR" }));
    if (missing.length === 0) return { created: 0, total: std.length };
    unwrap(await sb.from("chart_of_accounts").insert(missing).select("id"));
    return { created: missing.length, total: std.length };
  },
};

// =====================================================================
// Journal Engine
// =====================================================================
export const journal = {
  list: async (sb: SB, companyId: string, opts: { status?: string; from?: string; to?: string; ref_type?: string; ref_id?: string; limit?: number } = {}) => {
    let q = sb.from("journal_entries").select("*").eq("company_id", companyId).order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.status)   q = q.eq("status", opts.status as any);
    if (opts.from)     q = q.gte("entry_date", opts.from);
    if (opts.to)       q = q.lte("entry_date", opts.to);
    if (opts.ref_type) q = q.eq("reference_type", opts.ref_type);
    if (opts.ref_id)   q = q.eq("reference_id", opts.ref_id);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const e = unwrap(await sb.from("journal_entries").select("*").eq("id", id).single());
    const lines = unwrap(await sb.from("journal_lines").select("*, account:chart_of_accounts(id,code,name,kind)").eq("entry_id", id).order("sort_order"));
    return { ...(e as any), lines };
  },
  create: async (sb: SB, actorId: string, d: {
    company_id: string; entry_date?: string; memo?: string; currency?: string;
    reference_type?: string; reference_id?: string; reference_number?: string;
    lines: Line[];
  }) => {
    if (!d.lines?.length) throw new Error("Journal must have at least one line");
    const totalD = d.lines.reduce((a, l) => a + Math.max(0, l.debit_cents ?? 0), 0);
    const totalC = d.lines.reduce((a, l) => a + Math.max(0, l.credit_cents ?? 0), 0);
    if (totalD !== totalC || totalD === 0) throw new Error(`Journal must balance (debit=${totalD}, credit=${totalC})`);
    const number = await nextNumber(sb, "journal_entries", d.company_id, "JV");
    const entry = unwrap(await sb.from("journal_entries").insert({
      company_id: d.company_id, number,
      entry_date: d.entry_date ?? new Date().toISOString().slice(0, 10),
      memo: d.memo ?? null, currency: d.currency ?? "INR",
      reference_type: d.reference_type ?? null, reference_id: d.reference_id ?? null, reference_number: d.reference_number ?? null,
      total_debit_cents: totalD, total_credit_cents: totalC,
      status: "draft", created_by: actorId,
    }).select("*").single()) as any;
    for (let i = 0; i < d.lines.length; i++) {
      const l = d.lines[i];
      unwrap(await sb.from("journal_lines").insert({
        entry_id: entry.id, account_id: l.account_id,
        debit_cents: Math.max(0, l.debit_cents ?? 0),
        credit_cents: Math.max(0, l.credit_cents ?? 0),
        memo: l.memo ?? null, tax_rate_id: l.tax_rate_id ?? null,
        contact_type: l.contact_type ?? null, contact_id: l.contact_id ?? null,
        sort_order: i,
      }).select("id").single());
    }
    await writeAudit(sb, { category: "finance", action: "journal.created", entity_type: "journal_entry", entity_id: entry.id, company_id: d.company_id, metadata: { number, debit: totalD, credit: totalC } });
    return entry;
  },
  /** Posts a draft journal: copies lines into ledger_entries and locks the journal. */
  post: async (sb: SB, actorId: string, id: string) => {
    const e = unwrap(await sb.from("journal_entries").select("*").eq("id", id).single()) as any;
    if (e.status !== "draft") throw new Error(`Cannot post journal in status ${e.status}`);
    const lines = unwrap(await sb.from("journal_lines").select("*").eq("entry_id", id)) as any[];
    if (!lines.length) throw new Error("No lines to post");
    const totalD = lines.reduce((a, l) => a + Number(l.debit_cents ?? 0), 0);
    const totalC = lines.reduce((a, l) => a + Number(l.credit_cents ?? 0), 0);
    if (totalD !== totalC) throw new Error("Journal is unbalanced");
    for (const l of lines) {
      unwrap(await sb.from("ledger_entries").insert({
        company_id: e.company_id, account_id: l.account_id, entry_date: e.entry_date,
        reference_type: "journal_entry", reference_id: e.id,
        debit_cents: l.debit_cents, credit_cents: l.credit_cents,
        currency: e.currency, memo: l.memo ?? e.memo ?? null, created_by: actorId,
      }).select("id").single());
    }
    const updated = unwrap(await sb.from("journal_entries").update({ status: "posted", posted_at: new Date().toISOString(), posted_by: actorId }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "finance", action: "journal.posted", entity_type: "journal_entry", entity_id: id, company_id: e.company_id, severity: "notice", metadata: { number: e.number } });
    return updated;
  },
  /** Creates and posts a new reversing entry. Original stays as-is. */
  reverse: async (sb: SB, actorId: string, id: string, memo?: string) => {
    const e = unwrap(await sb.from("journal_entries").select("*").eq("id", id).single()) as any;
    if (e.status !== "posted") throw new Error("Only posted entries can be reversed");
    const lines = unwrap(await sb.from("journal_lines").select("*").eq("entry_id", id).order("sort_order")) as any[];
    const flipped = lines.map((l) => ({
      account_id: l.account_id,
      debit_cents: Number(l.credit_cents ?? 0),
      credit_cents: Number(l.debit_cents ?? 0),
      memo: l.memo, tax_rate_id: l.tax_rate_id, contact_type: l.contact_type, contact_id: l.contact_id,
    }));
    const rev = await journal.create(sb, actorId, {
      company_id: e.company_id,
      memo: memo ?? `Reversal of ${e.number}`,
      currency: e.currency,
      reference_type: "journal_reversal", reference_id: e.id, reference_number: e.number,
      lines: flipped,
    });
    unwrap(await sb.from("journal_entries").update({ reversal_of: e.id }).eq("id", (rev as any).id).select("id").single());
    const posted = await journal.post(sb, actorId, (rev as any).id);
    unwrap(await sb.from("journal_entries").update({ status: "reversed", reversed_by: (rev as any).id }).eq("id", id).select("id").single());
    await writeAudit(sb, { category: "finance", action: "journal.reversed", entity_type: "journal_entry", entity_id: id, company_id: e.company_id, severity: "notice", metadata: { number: e.number, reversal: (rev as any).number } });
    return posted;
  },
};

// =====================================================================
// Automatic postings from business documents
// =====================================================================
function accByCode(list: any[], code: string): string | null { return list.find((a) => a.code === code)?.id ?? null; }

export const autoPost = {
  /** Post a customer invoice: DR A/R, CR Sales Revenue, CR Output GST. */
  invoice: async (sb: SB, actorId: string, invoiceId: string) => {
    const inv = unwrap(await sb.from("invoices").select("*").eq("id", invoiceId).single()) as any;
    if (inv.status === "draft") throw new Error("Invoice must be issued before posting to ledger");
    const accts = unwrap(await sb.from("chart_of_accounts").select("id,code,kind").eq("company_id", inv.company_id)) as any[];
    const arId  = accByCode(accts, "1200");
    const revId = accByCode(accts, "4000");
    const gstId = accByCode(accts, "2100");
    if (!arId || !revId) throw new Error("Seed chart of accounts first (1200 A/R, 4000 Sales)");
    const lines: Line[] = [
      { account_id: arId, debit_cents: Number(inv.total_cents), memo: `Invoice ${inv.number}`, contact_type: "customer", contact_id: inv.customer_id },
      { account_id: revId, credit_cents: Number(inv.subtotal_cents), memo: `Invoice ${inv.number}` },
    ];
    if (Number(inv.tax_cents) > 0 && gstId) lines.push({ account_id: gstId, credit_cents: Number(inv.tax_cents), memo: `Output GST ${inv.number}` });
    const j = await journal.create(sb, actorId, {
      company_id: inv.company_id, memo: `Invoice ${inv.number}`, currency: inv.currency,
      reference_type: "invoice", reference_id: inv.id, reference_number: inv.number, lines,
    });
    return journal.post(sb, actorId, (j as any).id);
  },
  /** Post a vendor bill: DR Expense / Inventory / Input GST, CR A/P. */
  vendorBill: async (sb: SB, actorId: string, billId: string, defaultExpenseCode = "6900") => {
    const bill = unwrap(await sb.from("vendor_bills").select("*").eq("id", billId).single()) as any;
    const items = unwrap(await sb.from("vendor_bill_items").select("*").eq("bill_id", billId)) as any[];
    const accts = unwrap(await sb.from("chart_of_accounts").select("id,code,kind").eq("company_id", bill.company_id)) as any[];
    const apId = accByCode(accts, "2000");
    const inputGstId = accByCode(accts, "1400");
    if (!apId) throw new Error("Seed chart of accounts first (2000 A/P)");
    const lines: Line[] = [];
    for (const it of items) {
      const accId = it.account_id ?? accByCode(accts, defaultExpenseCode);
      if (!accId) throw new Error(`No account for bill item and no default '${defaultExpenseCode}'`);
      lines.push({ account_id: accId, debit_cents: Number(it.total_cents) - Number(it.tax_cents ?? 0), memo: it.description ?? `Bill ${bill.number}` });
      if (Number(it.tax_cents ?? 0) > 0 && inputGstId) lines.push({ account_id: inputGstId, debit_cents: Number(it.tax_cents), memo: `Input GST ${bill.number}` });
    }
    lines.push({ account_id: apId, credit_cents: Number(bill.total_cents), memo: `Bill ${bill.number}`, contact_type: "supplier", contact_id: bill.supplier_id });
    const j = await journal.create(sb, actorId, {
      company_id: bill.company_id, memo: `Vendor Bill ${bill.number}`, currency: bill.currency,
      reference_type: "vendor_bill", reference_id: bill.id, reference_number: bill.number, lines,
    });
    return journal.post(sb, actorId, (j as any).id);
  },
  /** Post a payment received: DR Bank/Cash, CR A/R. */
  paymentReceived: async (sb: SB, actorId: string, paymentId: string, bankCode = "1100") => {
    const p = unwrap(await sb.from("payments").select("*").eq("id", paymentId).single()) as any;
    if (p.status !== "succeeded" && p.status !== "captured" && p.status !== "paid") throw new Error("Only successful payments can post to ledger");
    const accts = unwrap(await sb.from("chart_of_accounts").select("id,code").eq("company_id", p.company_id)) as any[];
    const bankId = accByCode(accts, bankCode);
    const arId = accByCode(accts, "1200");
    if (!bankId || !arId) throw new Error("Seed chart of accounts first");
    const j = await journal.create(sb, actorId, {
      company_id: p.company_id, memo: `Payment ${p.provider_ref ?? p.id}`, currency: p.currency,
      reference_type: "payment", reference_id: p.id, lines: [
        { account_id: bankId, debit_cents: Number(p.amount_cents), memo: "Payment received" },
        { account_id: arId,   credit_cents: Number(p.amount_cents), memo: "Payment received", contact_type: "customer", contact_id: p.customer_id },
      ],
    });
    return journal.post(sb, actorId, (j as any).id);
  },
};

// =====================================================================
// Accounts Payable — Vendor Bills
// =====================================================================
export const vendorBills = {
  list: async (sb: SB, companyId: string, opts: { status?: string; supplier_id?: string; q?: string; limit?: number } = {}) => {
    let q = sb.from("vendor_bills").select("*, supplier:suppliers(id,name)").eq("company_id", companyId).order("bill_date", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.status)      q = q.eq("status", opts.status as any);
    if (opts.supplier_id) q = q.eq("supplier_id", opts.supplier_id);
    if (opts.q)           q = q.ilike("number", `%${opts.q}%`);
    return unwrap(await q);
  },
  get: async (sb: SB, id: string) => {
    const b = unwrap(await sb.from("vendor_bills").select("*, supplier:suppliers(id,name)").eq("id", id).single());
    const items = unwrap(await sb.from("vendor_bill_items").select("*").eq("bill_id", id));
    return { ...(b as any), items };
  },
  create: async (sb: SB, actorId: string, d: {
    company_id: string; supplier_id?: string; purchase_order_id?: string; supplier_ref?: string;
    currency?: string; bill_date?: string; due_date?: string; notes?: string;
    lines: Array<{ product_id?: string; account_id?: string; description?: string; quantity?: number; unit_price_cents: number; tax_rate_id?: string; tax_cents?: number }>;
  }) => {
    const number = await nextNumber(sb, "vendor_bills", d.company_id, "BILL");
    let sub = 0, tax = 0;
    const cleanItems = d.lines.map((l) => {
      const qty = l.quantity ?? 1;
      const line = qty * Number(l.unit_price_cents);
      const t = Number(l.tax_cents ?? 0);
      sub += line; tax += t;
      return { ...l, quantity: qty, total_cents: line + t, tax_cents: t };
    });
    const bill = unwrap(await sb.from("vendor_bills").insert({
      company_id: d.company_id, supplier_id: d.supplier_id ?? null, purchase_order_id: d.purchase_order_id ?? null,
      number, supplier_ref: d.supplier_ref ?? null, currency: d.currency ?? "INR",
      subtotal_cents: sub, tax_cents: tax, total_cents: sub + tax,
      bill_date: d.bill_date ?? new Date().toISOString().slice(0, 10), due_date: d.due_date ?? null,
      notes: d.notes ?? null, status: "pending", created_by: actorId,
    }).select("*").single()) as any;
    for (const it of cleanItems) {
      unwrap(await sb.from("vendor_bill_items").insert({
        bill_id: bill.id, product_id: it.product_id ?? null, account_id: it.account_id ?? null,
        description: it.description ?? null, quantity: it.quantity, unit_price_cents: it.unit_price_cents,
        tax_rate_id: it.tax_rate_id ?? null, tax_cents: it.tax_cents, total_cents: it.total_cents,
      }).select("id").single());
    }
    await writeAudit(sb, { category: "finance", action: "vendor_bill.created", entity_type: "vendor_bill", entity_id: bill.id, company_id: d.company_id, metadata: { number, total: sub + tax } });
    return bill;
  },
  approve: async (sb: SB, actorId: string, id: string) => {
    const b = unwrap(await sb.from("vendor_bills").update({ status: "approved" }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "finance", action: "vendor_bill.approved", entity_type: "vendor_bill", entity_id: id, company_id: b.company_id, metadata: { by: actorId } });
    return b;
  },
  markPaid: async (sb: SB, actorId: string, id: string, amount: number) => {
    const b = unwrap(await sb.from("vendor_bills").select("*").eq("id", id).single()) as any;
    const paid = Number(b.amount_paid_cents ?? 0) + amount;
    const status = paid >= Number(b.total_cents) ? "paid" : "partial";
    const updated = unwrap(await sb.from("vendor_bills").update({
      amount_paid_cents: paid, status, paid_at: status === "paid" ? new Date().toISOString() : b.paid_at,
    }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "finance", action: "vendor_bill.payment", entity_type: "vendor_bill", entity_id: id, company_id: b.company_id, metadata: { amount, status, by: actorId } });
    return updated;
  },
  outstanding: async (sb: SB, companyId: string) => {
    const rows = unwrap(await sb.from("vendor_bills").select("id,number,supplier_id,total_cents,amount_paid_cents,due_date,status,bill_date").eq("company_id", companyId).in("status", ["pending", "approved", "partial", "overdue"])) as any[];
    return rows.map((r) => ({ ...r, outstanding_cents: Number(r.total_cents) - Number(r.amount_paid_cents ?? 0) }))
      .filter((r) => r.outstanding_cents > 0)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  },
};

// =====================================================================
// Accounts Receivable — helpers over existing invoices
// =====================================================================
export const receivables = {
  outstanding: async (sb: SB, companyId: string) => {
    const rows = unwrap(await sb.from("invoices").select("id,number,customer_id,total_cents,amount_paid_cents,due_at,status,issued_at").eq("company_id", companyId).not("status", "in", "(paid,cancelled,draft)")) as any[];
    return rows.map((r) => ({ ...r, outstanding_cents: Number(r.total_cents) - Number(r.amount_paid_cents ?? 0) }))
      .filter((r) => r.outstanding_cents > 0)
      .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));
  },
  agingBuckets: async (sb: SB, companyId: string) => {
    const list = await receivables.outstanding(sb, companyId);
    const now = Date.now();
    const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 } as Record<string, number>;
    for (const r of list) {
      const due = r.due_at ? new Date(r.due_at).getTime() : now;
      const days = Math.max(0, Math.floor((now - due) / 86400000));
      const bucket = days === 0 ? "current" : days <= 30 ? "d1_30" : days <= 60 ? "d31_60" : days <= 90 ? "d61_90" : "d90_plus";
      buckets[bucket] += r.outstanding_cents;
    }
    return buckets;
  },
  customerStatement: async (sb: SB, companyId: string, customerId: string) => {
    const invs = unwrap(await sb.from("invoices").select("id,number,total_cents,amount_paid_cents,issued_at,due_at,status").eq("company_id", companyId).eq("customer_id", customerId).order("issued_at")) as any[];
    const pays = unwrap(await sb.from("payments").select("id,invoice_id,amount_cents,received_at,status").eq("company_id", companyId).eq("customer_id", customerId).order("received_at")) as any[];
    return { invoices: invs, payments: pays };
  },
};

// =====================================================================
// Credit / Debit Notes
// =====================================================================
export const notes = {
  list: async (sb: SB, companyId: string, kind?: "credit" | "debit") => {
    let q = sb.from("credit_debit_notes").select("*").eq("company_id", companyId).order("note_date", { ascending: false });
    if (kind) q = q.eq("kind", kind);
    return unwrap(await q);
  },
  create: async (sb: SB, actorId: string, d: { company_id: string; kind: "credit" | "debit"; invoice_id?: string; bill_id?: string; customer_id?: string; supplier_id?: string; amount_cents: number; tax_cents?: number; reason?: string; note_date?: string; currency?: string }) => {
    const prefix = d.kind === "credit" ? "CN" : "DN";
    const number = await nextNumber(sb, "credit_debit_notes", d.company_id, prefix);
    const n = unwrap(await sb.from("credit_debit_notes").insert({
      company_id: d.company_id, kind: d.kind, number,
      invoice_id: d.invoice_id ?? null, bill_id: d.bill_id ?? null,
      customer_id: d.customer_id ?? null, supplier_id: d.supplier_id ?? null,
      amount_cents: d.amount_cents, tax_cents: d.tax_cents ?? 0,
      reason: d.reason ?? null, currency: d.currency ?? "INR",
      note_date: d.note_date ?? new Date().toISOString().slice(0, 10),
      created_by: actorId,
    }).select("*").single()) as any;
    await writeAudit(sb, { category: "finance", action: `note.${d.kind}.created`, entity_type: "credit_debit_note", entity_id: n.id, company_id: d.company_id, metadata: { number, amount: d.amount_cents } });
    return n;
  },
};

// =====================================================================
// Banking + Reconciliation
// =====================================================================
export const bank = {
  listAccounts: async (sb: SB, companyId: string) =>
    unwrap(await sb.from("bank_accounts").select("*, account:chart_of_accounts(id,code,name)").eq("company_id", companyId).eq("is_active", true).order("name")),
  createAccount: async (sb: SB, d: { company_id: string; name: string; bank_name?: string; account_number?: string; ifsc?: string; currency?: string; account_id?: string; opening_balance_cents?: number }) =>
    unwrap(await sb.from("bank_accounts").insert({ ...d, currency: d.currency ?? "INR", current_balance_cents: d.opening_balance_cents ?? 0 }).select("*").single()),
  listTxns: async (sb: SB, bankAccountId: string, opts: { from?: string; to?: string; reconciled?: boolean; limit?: number } = {}) => {
    let q = sb.from("bank_transactions").select("*").eq("bank_account_id", bankAccountId).order("txn_date", { ascending: false }).limit(opts.limit ?? 100);
    if (opts.from) q = q.gte("txn_date", opts.from);
    if (opts.to)   q = q.lte("txn_date", opts.to);
    if (opts.reconciled != null) q = q.eq("reconciled", opts.reconciled);
    return unwrap(await q);
  },
  recordTxn: async (sb: SB, actorId: string, d: { company_id: string; bank_account_id: string; txn_type: string; amount_cents: number; txn_date?: string; description?: string; reference?: string; counterparty?: string }) => {
    const t = unwrap(await sb.from("bank_transactions").insert({
      company_id: d.company_id, bank_account_id: d.bank_account_id,
      txn_type: d.txn_type as any, amount_cents: d.amount_cents,
      txn_date: d.txn_date ?? new Date().toISOString().slice(0, 10),
      description: d.description ?? null, reference: d.reference ?? null, counterparty: d.counterparty ?? null,
      created_by: actorId,
    }).select("*").single()) as any;
    const sign = ["deposit", "transfer_in", "interest"].includes(d.txn_type) ? 1 : -1;
    const acct = unwrap(await sb.from("bank_accounts").select("current_balance_cents").eq("id", d.bank_account_id).single()) as any;
    const next = Number(acct.current_balance_cents ?? 0) + sign * Math.abs(d.amount_cents);
    unwrap(await sb.from("bank_accounts").update({ current_balance_cents: next }).eq("id", d.bank_account_id).select("id").single());
    return t;
  },
  reconcile: async (sb: SB, txnId: string, journalEntryId?: string) =>
    unwrap(await sb.from("bank_transactions").update({ reconciled: true, reconciled_at: new Date().toISOString(), journal_entry_id: journalEntryId ?? null }).eq("id", txnId).select("*").single()),
  startReconciliation: async (sb: SB, d: { company_id: string; bank_account_id: string; period_start: string; period_end: string; statement_balance_cents: number }) => {
    const acct = unwrap(await sb.from("bank_accounts").select("current_balance_cents").eq("id", d.bank_account_id).single()) as any;
    const book = Number(acct.current_balance_cents ?? 0);
    return unwrap(await sb.from("bank_reconciliations").insert({
      company_id: d.company_id, bank_account_id: d.bank_account_id,
      period_start: d.period_start, period_end: d.period_end,
      statement_balance_cents: d.statement_balance_cents,
      book_balance_cents: book, difference_cents: d.statement_balance_cents - book,
      status: "in_progress",
    }).select("*").single());
  },
  completeReconciliation: async (sb: SB, actorId: string, id: string) =>
    unwrap(await sb.from("bank_reconciliations").update({ status: "completed", completed_at: new Date().toISOString(), completed_by: actorId }).eq("id", id).select("*").single()),
};

// =====================================================================
// GST / Tax
// =====================================================================
export const gst = {
  listReturns: async (sb: SB, companyId: string, limit = 24) =>
    unwrap(await sb.from("gst_returns").select("*").eq("company_id", companyId).order("period_start", { ascending: false }).limit(limit)),
  /** Compute output/input GST from posted ledger for a period. */
  computePeriod: async (sb: SB, companyId: string, from: string, to: string) => {
    const accts = unwrap(await sb.from("chart_of_accounts").select("id,code").eq("company_id", companyId)) as any[];
    const outId = accByCode(accts, "2100");
    const inId  = accByCode(accts, "1400");
    const rows = unwrap(await sb.from("ledger_entries").select("account_id,debit_cents,credit_cents")
      .eq("company_id", companyId).gte("entry_date", from).lte("entry_date", to)) as any[];
    let output = 0, input = 0;
    for (const r of rows) {
      if (r.account_id === outId) output += Number(r.credit_cents ?? 0) - Number(r.debit_cents ?? 0);
      if (r.account_id === inId)  input  += Number(r.debit_cents ?? 0) - Number(r.credit_cents ?? 0);
    }
    return { output_tax_cents: Math.max(0, output), input_tax_cents: Math.max(0, input), net_payable_cents: Math.max(0, output - input) };
  },
  createReturn: async (sb: SB, actorId: string, d: { company_id: string; period_start: string; period_end: string }) => {
    const totals = await gst.computePeriod(sb, d.company_id, d.period_start, d.period_end);
    const r = unwrap(await sb.from("gst_returns").upsert({
      company_id: d.company_id, period_start: d.period_start, period_end: d.period_end,
      output_tax_cents: totals.output_tax_cents, input_tax_cents: totals.input_tax_cents,
      net_payable_cents: totals.net_payable_cents, status: "draft", created_by: actorId,
    }, { onConflict: "company_id,period_start,period_end" }).select("*").single()) as any;
    return r;
  },
  fileReturn: async (sb: SB, actorId: string, id: string, reference?: string) => {
    const r = unwrap(await sb.from("gst_returns").update({ status: "filed", filed_at: new Date().toISOString(), reference: reference ?? null }).eq("id", id).select("*").single()) as any;
    await writeAudit(sb, { category: "finance", action: "gst.filed", entity_type: "gst_return", entity_id: id, company_id: r.company_id, severity: "notice", metadata: { by: actorId, ref: reference } });
    return r;
  },
};

// =====================================================================
// Reports — computed from real ledger data
// =====================================================================
function normalizeKind(k: string): "asset" | "liability" | "equity" | "income" | "expense" {
  if (["asset", "inventory"].includes(k)) return "asset";
  if (["depreciation"].includes(k)) return "asset"; // contra
  if (["liability"].includes(k)) return "liability";
  if (["equity"].includes(k)) return "equity";
  if (["income"].includes(k)) return "income";
  return "expense"; // cogs + expense
}

async function accountBalances(sb: SB, companyId: string, from?: string, to?: string) {
  let q = sb.from("ledger_entries").select("account_id,debit_cents,credit_cents").eq("company_id", companyId);
  if (from) q = q.gte("entry_date", from);
  if (to)   q = q.lte("entry_date", to);
  const rows = unwrap(await q) as any[];
  const accts = unwrap(await sb.from("chart_of_accounts").select("id,code,name,kind").eq("company_id", companyId)) as any[];
  const byAcct = new Map<string, { debit: number; credit: number }>();
  for (const r of rows) {
    const cur = byAcct.get(r.account_id) ?? { debit: 0, credit: 0 };
    cur.debit += Number(r.debit_cents ?? 0); cur.credit += Number(r.credit_cents ?? 0);
    byAcct.set(r.account_id, cur);
  }
  return accts.map((a) => {
    const b = byAcct.get(a.id) ?? { debit: 0, credit: 0 };
    const normal = normalizeKind(a.kind);
    const balance = (normal === "asset" || normal === "expense") ? b.debit - b.credit : b.credit - b.debit;
    return { ...a, debit_cents: b.debit, credit_cents: b.credit, balance_cents: balance, normal };
  });
}

export const reports = {
  trialBalance: async (sb: SB, companyId: string, from?: string, to?: string) => {
    const bals = await accountBalances(sb, companyId, from, to);
    const totalDebit = bals.reduce((a, b) => a + b.debit_cents, 0);
    const totalCredit = bals.reduce((a, b) => a + b.credit_cents, 0);
    return { rows: bals.filter((b) => b.debit_cents !== 0 || b.credit_cents !== 0), total_debit_cents: totalDebit, total_credit_cents: totalCredit, is_balanced: totalDebit === totalCredit };
  },
  balanceSheet: async (sb: SB, companyId: string, asOf?: string) => {
    const bals = await accountBalances(sb, companyId, undefined, asOf);
    const assets = bals.filter((b) => b.normal === "asset");
    const liab   = bals.filter((b) => b.normal === "liability");
    const equity = bals.filter((b) => b.normal === "equity");
    const income = bals.filter((b) => b.normal === "income").reduce((a, b) => a + b.balance_cents, 0);
    const expense = bals.filter((b) => b.normal === "expense").reduce((a, b) => a + b.balance_cents, 0);
    const retained = income - expense;
    return {
      as_of: asOf ?? new Date().toISOString().slice(0, 10),
      assets: { lines: assets, total_cents: assets.reduce((a, b) => a + b.balance_cents, 0) },
      liabilities: { lines: liab, total_cents: liab.reduce((a, b) => a + b.balance_cents, 0) },
      equity: { lines: equity, total_cents: equity.reduce((a, b) => a + b.balance_cents, 0), retained_earnings_cents: retained },
    };
  },
  profitAndLoss: async (sb: SB, companyId: string, from: string, to: string) => {
    const bals = await accountBalances(sb, companyId, from, to);
    const income = bals.filter((b) => b.normal === "income");
    const expense = bals.filter((b) => b.normal === "expense");
    const totalIncome = income.reduce((a, b) => a + b.balance_cents, 0);
    const totalExpense = expense.reduce((a, b) => a + b.balance_cents, 0);
    return { period: { from, to }, income: { lines: income, total_cents: totalIncome }, expenses: { lines: expense, total_cents: totalExpense }, net_profit_cents: totalIncome - totalExpense };
  },
  cashFlow: async (sb: SB, companyId: string, from: string, to: string) => {
    const accts = unwrap(await sb.from("chart_of_accounts").select("id,code,kind").eq("company_id", companyId)) as any[];
    const cashIds = accts.filter((a) => ["1000", "1100"].includes(a.code)).map((a) => a.id);
    if (cashIds.length === 0) return { period: { from, to }, opening_cents: 0, closing_cents: 0, inflow_cents: 0, outflow_cents: 0, net_cents: 0 };
    const openingRows = unwrap(await sb.from("ledger_entries").select("debit_cents,credit_cents").eq("company_id", companyId).in("account_id", cashIds).lt("entry_date", from)) as any[];
    const periodRows  = unwrap(await sb.from("ledger_entries").select("debit_cents,credit_cents").eq("company_id", companyId).in("account_id", cashIds).gte("entry_date", from).lte("entry_date", to)) as any[];
    const opening = openingRows.reduce((a, r) => a + Number(r.debit_cents ?? 0) - Number(r.credit_cents ?? 0), 0);
    const inflow  = periodRows.reduce((a, r) => a + Number(r.debit_cents ?? 0), 0);
    const outflow = periodRows.reduce((a, r) => a + Number(r.credit_cents ?? 0), 0);
    return { period: { from, to }, opening_cents: opening, inflow_cents: inflow, outflow_cents: outflow, net_cents: inflow - outflow, closing_cents: opening + inflow - outflow };
  },
  accountLedger: async (sb: SB, companyId: string, accountId: string, from?: string, to?: string, limit = 500) => {
    let q = sb.from("ledger_entries").select("*").eq("company_id", companyId).eq("account_id", accountId).order("entry_date", { ascending: true }).limit(limit);
    if (from) q = q.gte("entry_date", from);
    if (to)   q = q.lte("entry_date", to);
    const rows = unwrap(await q) as any[];
    let running = 0;
    return rows.map((r) => { running += Number(r.debit_cents ?? 0) - Number(r.credit_cents ?? 0); return { ...r, running_balance_cents: running }; });
  },
};

// =====================================================================
// Founder Dashboard summary
// =====================================================================
export const financeDashboard = {
  overview: async (sb: SB, companyId: string) => {
    const today = new Date();
    const y = today.getFullYear();
    const monthStart = `${y}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const yearStart = `${y}-04-01`; // Indian FY
    const [pl, bs, cash, ar, ap, gstDraft] = await Promise.all([
      reports.profitAndLoss(sb, companyId, monthStart, today.toISOString().slice(0, 10)),
      reports.balanceSheet(sb, companyId),
      reports.cashFlow(sb, companyId, monthStart, today.toISOString().slice(0, 10)),
      receivables.outstanding(sb, companyId),
      vendorBills.outstanding(sb, companyId),
      gst.computePeriod(sb, companyId, yearStart, today.toISOString().slice(0, 10)),
    ]);
    return {
      month_revenue_cents: pl.income.total_cents,
      month_expenses_cents: pl.expenses.total_cents,
      month_profit_cents: pl.net_profit_cents,
      cash_position_cents: bs.assets.lines.filter((a) => ["1000", "1100"].includes(a.code)).reduce((s, a) => s + a.balance_cents, 0),
      cash_inflow_month_cents: cash.inflow_cents,
      cash_outflow_month_cents: cash.outflow_cents,
      receivables_cents: ar.reduce((s, r) => s + r.outstanding_cents, 0),
      receivables_count: ar.length,
      payables_cents: ap.reduce((s, r) => s + r.outstanding_cents, 0),
      payables_count: ap.length,
      gst_payable_cents_ytd: gstDraft.net_payable_cents,
    };
  },
};
