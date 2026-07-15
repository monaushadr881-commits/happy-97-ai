/**
 * HAPPY — Financial Foundation Service (v1)
 *
 * Real operations over plans / subscriptions / wallets / ledgers.
 * All reads are RLS-scoped to the caller. Ledger writes are append-only:
 * balances are always derived from `v_wallet_balances` / `v_credit_balances`,
 * never stored on wallet rows.
 */
import { defineService, V, validate, z, type ServiceContext } from "../core";

const ListPage = z.object({ limit: z.number().int().min(1).max(200).default(50) }).default({ limit: 50 });

const WalletKey = z.object({
  owner_type: z.enum(["user", "company"]),
  owner_id: V.uuid,
  currency: z.string().length(3).default("USD"),
});

const WalletMove = WalletKey.extend({
  amount_cents: z.number().int().positive(),
  entry_type: z.enum(["purchase","refund","reward","referral","adjustment","marketplace_earning","builder_earning","consume","payout","chargeback"]),
  direction: z.enum(["credit", "debit"]),
  description: z.string().max(500).optional(),
  reference_type: z.string().max(64).optional(),
  reference_id: V.uuid.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const CreditMove = z.object({
  owner_type: z.enum(["user", "company"]),
  owner_id: V.uuid,
  amount: z.number().int().positive(),
  direction: z.enum(["credit", "debit"]),
  entry_type: z.enum(["purchase","consume","refund","expire","transfer_in","transfer_out","bonus","referral","admin_grant","marketplace_usage","ai_usage","builder_usage","automation_usage"]),
  description: z.string().max(500).optional(),
  reference_type: z.string().max(64).optional(),
  reference_id: V.uuid.optional(),
  expires_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const financialService = defineService({ name: "financial", version: "v1" }, () => ({
  // ---------- PLANS -----------------------------------------------------
  async listPlans(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  // ---------- SUBSCRIPTIONS --------------------------------------------
  async listSubscriptions(ctx: ServiceContext, input: unknown = {}) {
    const { limit } = validate(ListPage, input ?? {});
    const { data, error } = await ctx.supabase
      .from("subscriptions")
      .select("id, company_id, plan_id, status, currency, seats, trial_ends_at, current_period_start, current_period_end, cancel_at, cancelled_at, auto_renew, provider, provider_ref, created_at, updated_at, plan:plans(id, code, name, tier, price_cents, currency, billing_interval)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async subscriptionOverview(ctx: ServiceContext) {
    const sb = ctx.supabase;
    const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const [all, active, trial, cancelled, renew30] = await Promise.all([
      sb.from("subscriptions").select("id", { count: "exact", head: true }),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trial"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["cancelled","expired"]),
      sb.from("subscriptions").select("id", { count: "exact", head: true })
        .eq("auto_renew", true).lte("current_period_end", in30).in("status", ["active","trial"]),
    ]);
    const ok = !all.error && !active.error;
    return {
      total: ok ? (all.count ?? 0) : null,
      active: ok ? (active.count ?? 0) : null,
      trial: ok ? (trial.count ?? 0) : null,
      cancelled: ok ? (cancelled.count ?? 0) : null,
      renewalsUpcoming30d: renew30.error ? null : (renew30.count ?? 0),
      generatedAt: new Date().toISOString(),
    };
  },

  async listSubscriptionEvents(ctx: ServiceContext, subscription_id: string) {
    const id = validate(V.uuid, subscription_id);
    const { data, error } = await ctx.supabase
      .from("subscription_events")
      .select("*")
      .eq("subscription_id", id)
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  },

  // ---------- WALLETS ---------------------------------------------------
  async listWallets(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase
      .from("v_wallet_balances")
      .select("*")
      .order("last_entry_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },

  async ensureWallet(ctx: ServiceContext, input: unknown) {
    const p = validate(WalletKey, input);
    const existing = await ctx.supabase
      .from("wallets")
      .select("id, owner_type, owner_id, currency, is_active")
      .eq("owner_type", p.owner_type)
      .eq("owner_id", p.owner_id)
      .eq("currency", p.currency)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data;
    const created = await ctx.supabase
      .from("wallets")
      .insert({ owner_type: p.owner_type, owner_id: p.owner_id, currency: p.currency })
      .select("id, owner_type, owner_id, currency, is_active")
      .single();
    if (created.error) throw created.error;
    return created.data;
  },

  async walletLedger(ctx: ServiceContext, wallet_id: string) {
    const id = validate(V.uuid, wallet_id);
    const { data, error } = await ctx.supabase
      .from("wallet_ledger_entries")
      .select("*")
      .eq("wallet_id", id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },

  async postWalletEntry(ctx: ServiceContext, input: unknown) {
    const p = validate(WalletMove, input);
    // Ensure wallet exists (RLS-scoped)
    const wallet = await this.ensureWallet(ctx, { owner_type: p.owner_type, owner_id: p.owner_id, currency: p.currency }) as { id: string };
    const { data, error } = await ctx.supabase
      .from("wallet_ledger_entries")
      .insert({
        wallet_id: wallet.id,
        direction: p.direction,
        amount_cents: p.amount_cents,
        currency: p.currency,
        entry_type: p.entry_type,
        reference_type: p.reference_type ?? null,
        reference_id: p.reference_id ?? null,
        description: p.description ?? null,
        metadata: (p.metadata ?? {}) as never,
        created_by: ctx.userId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },


  // ---------- CREDITS ---------------------------------------------------
  async creditBalance(ctx: ServiceContext, input: unknown) {
    const p = validate(WalletKey.pick({ owner_type: true, owner_id: true }), input);
    const { data, error } = await ctx.supabase
      .from("v_credit_balances")
      .select("*")
      .eq("owner_type", p.owner_type)
      .eq("owner_id", p.owner_id)
      .maybeSingle();
    if (error) throw error;
    return data ?? { owner_type: p.owner_type, owner_id: p.owner_id, balance: 0, entry_count: 0, last_entry_at: null };
  },

  async creditLedger(ctx: ServiceContext, input: unknown) {
    const p = validate(WalletKey.pick({ owner_type: true, owner_id: true }).extend({ limit: z.number().int().min(1).max(200).default(100) }), input);
    const { data, error } = await ctx.supabase
      .from("credit_ledger_entries")
      .select("*")
      .eq("owner_type", p.owner_type)
      .eq("owner_id", p.owner_id)
      .order("created_at", { ascending: false })
      .limit(p.limit);
    if (error) throw error;
    return data ?? [];
  },

  async postCreditEntry(ctx: ServiceContext, input: unknown) {
    const p = validate(CreditMove, input);
    const { data, error } = await ctx.supabase
      .from("credit_ledger_entries")
      .insert({
        owner_type: p.owner_type,
        owner_id: p.owner_id,
        direction: p.direction,
        amount: p.amount,
        entry_type: p.entry_type,
        reference_type: p.reference_type ?? null,
        reference_id: p.reference_id ?? null,
        description: p.description ?? null,
        expires_at: p.expires_at ?? null,
        metadata: p.metadata ?? {},
        created_by: ctx.userId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  // ---------- FOUNDER OVERVIEW -----------------------------------------
  async founderOverview(ctx: ServiceContext) {
    const sb = ctx.supabase;
    const [subs, wallets, credits] = await Promise.all([
      this.subscriptionOverview(ctx),
      sb.from("v_wallet_balances").select("balance_cents, currency"),
      sb.from("v_credit_balances").select("balance"),
    ]);
    const walletVolume = wallets.error ? null
      : (wallets.data ?? []).reduce((a, r) => a + Number((r as { balance_cents: number }).balance_cents || 0), 0);
    const creditsOutstanding = credits.error ? null
      : (credits.data ?? []).reduce((a, r) => a + Number((r as { balance: number }).balance || 0), 0);
    return {
      subscriptions: subs,
      walletVolumeCents: walletVolume,
      creditsOutstanding,
      generatedAt: new Date().toISOString(),
    };
  },
}));
