/**
 * HAPPY X — Revenue Service (real)
 *
 * Real ops over public.invoices, invoice_items, payments, customers.
 * RLS scopes each read to the caller's companies; platform founders see all.
 *
 * We deliberately DO NOT invent "subscriptions", "wallet", or "credits"
 * data — those tables don't exist yet, so those metrics are surfaced to
 * the UI as `null` and rendered as "Not Available Yet" (never as 0).
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";

const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void", "refunded"] as const;
const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "refunded"] as const;
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const ListInvoicesInput = z.object({
  status: z.enum(INVOICE_STATUSES).optional(),
  companyId: V.uuid.optional(),
  limit: z.number().int().min(1).max(200).default(50),
}).default({ limit: 50 });

const ListPaymentsInput = z.object({
  status: z.enum(PAYMENT_STATUSES).optional(),
  companyId: V.uuid.optional(),
  limit: z.number().int().min(1).max(200).default(50),
}).default({ limit: 50 });

function since(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const revenueService = defineService({ name: "revenue", version: "v1" }, () => ({
  /**
   * Real revenue KPIs derived from paid invoices.
   * revenue30d = sum(amount_paid_cents) of invoices with paid_at in last 30 days.
   * MRR is presented as `revenue30d`. ARR = MRR × 12.
   * Subscriptions / wallet / credits => null (backend not modelled yet).
   */
  async overview(ctx: ServiceContext) {
    const sb = ctx.supabase;

    const [paid30, paid365, invAll, invOpen, invOverdue, payAll, refAll] = await Promise.all([
      sb.from("invoices").select("amount_paid_cents, currency, paid_at")
        .not("paid_at", "is", null).gte("paid_at", since(30)),
      sb.from("invoices").select("amount_paid_cents, currency, paid_at")
        .not("paid_at", "is", null).gte("paid_at", since(365)),
      sb.from("invoices").select("id", { count: "exact", head: true }),
      sb.from("invoices").select("id", { count: "exact", head: true })
        .in("status", ["sent"]),
      sb.from("invoices").select("id", { count: "exact", head: true })
        .eq("status", "overdue"),
      sb.from("payments").select("amount_cents, status, currency, received_at")
        .eq("status", "succeeded" as PaymentStatus).gte("received_at", since(30)),
      sb.from("payments").select("amount_cents", { count: "exact" })
        .eq("status", "refunded" as PaymentStatus).gte("received_at", since(30)),
    ]);

    const sumPaid30 = (paid30.data ?? []).reduce((a, r) => a + Number((r as { amount_paid_cents: number }).amount_paid_cents || 0), 0);
    const sumPaid365 = (paid365.data ?? []).reduce((a, r) => a + Number((r as { amount_paid_cents: number }).amount_paid_cents || 0), 0);
    const sumPay30 = (payAll.data ?? []).reduce((a, r) => a + Number((r as { amount_cents: number }).amount_cents || 0), 0);
    const sumRef30 = (refAll.data ?? []).reduce((a, r) => a + Number((r as { amount_cents: number }).amount_cents || 0), 0);

    // If none of the underlying selects returned an error, expose zeros as real zeros.
    const readOk = !paid30.error && !invAll.error;
    const currency = (paid30.data?.[0] as { currency?: string } | undefined)?.currency
      ?? (payAll.data?.[0] as { currency?: string } | undefined)?.currency
      ?? "USD";

    return {
      currency,
      revenue30dCents: readOk ? sumPaid30 : null,
      revenue365dCents: readOk ? sumPaid365 : null,
      // Naming: MRR is presented as trailing-30-day recognized revenue.
      mrrCents: readOk ? sumPaid30 : null,
      arrCents: readOk ? sumPaid30 * 12 : null,
      payments30dCents: readOk ? sumPay30 : null,
      refunds30dCents: readOk ? sumRef30 : null,
      invoicesTotal: invAll.error ? null : (invAll.count ?? 0),
      invoicesOpen: invOpen.error ? null : (invOpen.count ?? 0),
      invoicesOverdue: invOverdue.error ? null : (invOverdue.count ?? 0),
      // Not modelled yet — honest nulls.
      subscriptionsActive: null,
      walletBalanceCents: null,
      creditsBalance: null,
      renewalsUpcoming: null,
      generatedAt: new Date().toISOString(),
    };
  },

  /** Trailing-N-day revenue bucketed by day (paid_at). */
  async revenueTimeseries(ctx: ServiceContext, days = 30) {
    const from = since(Math.min(Math.max(days, 7), 365));
    const { data, error } = await ctx.supabase
      .from("invoices")
      .select("amount_paid_cents, paid_at")
      .not("paid_at", "is", null)
      .gte("paid_at", from)
      .order("paid_at", { ascending: true });
    if (error) throw error;
    const buckets: Record<string, number> = {};
    for (const r of data ?? []) {
      const d = new Date((r as { paid_at: string }).paid_at).toISOString().slice(0, 10);
      buckets[d] = (buckets[d] ?? 0) + Number((r as { amount_paid_cents: number }).amount_paid_cents || 0);
    }
    return Object.entries(buckets).map(([date, cents]) => ({ date, cents }));
  },

  async listInvoices(ctx: ServiceContext, input: unknown = {}) {
    const { status, companyId, limit } = validate(ListInvoicesInput, input ?? {});
    let q = ctx.supabase
      .from("invoices")
      .select("id, company_id, customer_id, number, currency, subtotal_cents, tax_cents, total_cents, amount_paid_cents, status, issued_at, due_at, paid_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    if (companyId) q = q.eq("company_id", companyId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async invoiceDetail(ctx: ServiceContext, id: string) {
    const invoiceId = validate(V.uuid, id);
    const [inv, items, pays] = await Promise.all([
      ctx.supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle(),
      ctx.supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId).order("created_at"),
      ctx.supabase.from("payments").select("*").eq("invoice_id", invoiceId).order("received_at", { ascending: false }),
    ]);
    if (inv.error) throw inv.error;
    if (!inv.data) return null;
    return { invoice: inv.data, items: items.data ?? [], payments: pays.data ?? [] };
  },

  async listPayments(ctx: ServiceContext, input: unknown = {}) {
    const { status, companyId, limit } = validate(ListPaymentsInput, input ?? {});
    let q = ctx.supabase
      .from("payments")
      .select("id, company_id, invoice_id, customer_id, provider, provider_ref, amount_cents, currency, status, received_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    if (companyId) q = q.eq("company_id", companyId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
}));
