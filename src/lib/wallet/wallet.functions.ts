/**
 * HAPPY — Wallet Server Functions (R10)
 *
 * Every write path is:
 *   1. Auth-gated (requireSupabaseAuth)
 *   2. Ownership-gated (user owns wallet OR is_company_admin OR is_ops_admin)
 *   3. Adjustment paths additionally require is_ops_admin
 * All execution uses supabaseAdmin AFTER authorization succeeds.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ensureWallet,
  postLedgerEntry,
  postTransfer,
  setWalletStatus,
  type WalletEntryType,
  type WalletOwnerType,
  type WalletStatus,
} from "./engine";

async function assertOwnership(
  context: { supabase: unknown; userId: string },
  ownerType: WalletOwnerType, ownerId: string,
): Promise<void> {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  if (ownerType === "user") {
    if (ownerId !== context.userId) {
      const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: context.userId });
      if (!ops) throw new Error("Forbidden: not wallet owner");
    }
    return;
  }
  const { data, error } = await sb.rpc("is_company_admin",
    { _user_id: context.userId, _company_id: ownerId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: company admin required");
}

async function assertOpsAdmin(context: { supabase: unknown; userId: string }): Promise<void> {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: context.userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

async function loadWalletOwner(
  context: { supabase: unknown }, walletId: string,
): Promise<{ ownerType: WalletOwnerType; ownerId: string; currency: string }> {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  const { data, error } = await sb.from("wallets")
    .select("owner_type, owner_id, currency").eq("id", walletId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("wallet_not_found");
  const r = data as { owner_type: WalletOwnerType; owner_id: string; currency: string };
  return { ownerType: r.owner_type, ownerId: r.owner_id, currency: r.currency };
}

/* -------------------------------------------------------------------------- */
/* Create / freeze / unfreeze / close                                          */
/* -------------------------------------------------------------------------- */

export const createWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ownerType: WalletOwnerType; ownerId: string; currency?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context, data.ownerType, data.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return ensureWallet(supabaseAdmin, {
      ownerType: data.ownerType, ownerId: data.ownerId, currency: data.currency,
    });
  });

export const setWalletStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { walletId: string; status: WalletStatus }) => d)
  .handler(async ({ data, context }) => {
    // Freezing/closing requires ops-admin — a company admin cannot lock its own wallet
    // out of billing.
    await assertOpsAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return setWalletStatus(supabaseAdmin, data.walletId, data.status, context.userId);
  });

/* -------------------------------------------------------------------------- */
/* Credit / debit / adjustment                                                 */
/* -------------------------------------------------------------------------- */

const NON_ADMIN_ENTRY_TYPES: WalletEntryType[] = [
  "purchase", "refund", "reward", "referral",
  "marketplace_earning", "builder_earning", "consume", "payout", "chargeback",
];

export const creditWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    walletId: string; amountCents: number;
    entryType: WalletEntryType; description?: string;
    referenceType?: string; referenceId?: string;
    metadata?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    if (data.entryType === "adjustment") await assertOpsAdmin(context);
    else if (!NON_ADMIN_ENTRY_TYPES.includes(data.entryType)) {
      throw new Error(`invalid_entry_type: ${data.entryType}`);
    }
    const owner = await loadWalletOwner(context, data.walletId);
    await assertOwnership(context, owner.ownerType, owner.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return postLedgerEntry(supabaseAdmin, {
      wallet: { ownerType: owner.ownerType, ownerId: owner.ownerId, currency: owner.currency },
      direction: "credit", amountCents: data.amountCents, entryType: data.entryType,
      description: data.description, referenceType: data.referenceType, referenceId: data.referenceId,
      metadata: data.metadata, actorId: context.userId,
    });
  });

export const debitWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    walletId: string; amountCents: number;
    entryType: WalletEntryType; description?: string;
    referenceType?: string; referenceId?: string;
    metadata?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    if (data.entryType === "adjustment") await assertOpsAdmin(context);
    else if (!NON_ADMIN_ENTRY_TYPES.includes(data.entryType)) {
      throw new Error(`invalid_entry_type: ${data.entryType}`);
    }
    const owner = await loadWalletOwner(context, data.walletId);
    await assertOwnership(context, owner.ownerType, owner.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return postLedgerEntry(supabaseAdmin, {
      wallet: { ownerType: owner.ownerType, ownerId: owner.ownerId, currency: owner.currency },
      direction: "debit", amountCents: data.amountCents, entryType: data.entryType,
      description: data.description, referenceType: data.referenceType, referenceId: data.referenceId,
      metadata: data.metadata, actorId: context.userId,
    });
  });

export const transferWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    fromWalletId: string; toWalletId: string;
    amountCents: number; description?: string;
    referenceType?: string; referenceId?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const from = await loadWalletOwner(context, data.fromWalletId);
    const to = await loadWalletOwner(context, data.toWalletId);
    // Sender must be authorized on the source wallet. Receiver is always
    // allowed to receive (analogous to "anyone can pay you").
    await assertOwnership(context, from.ownerType, from.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return postTransfer(supabaseAdmin, {
      from: { ownerType: from.ownerType, ownerId: from.ownerId, currency: from.currency },
      to: { ownerType: to.ownerType, ownerId: to.ownerId, currency: to.currency },
      amountCents: data.amountCents, description: data.description,
      referenceType: data.referenceType, referenceId: data.referenceId,
      actorId: context.userId,
    });
  });

/* -------------------------------------------------------------------------- */
/* Founder / ops overview                                                     */
/* -------------------------------------------------------------------------- */

export interface WalletOverview {
  wallet_count: number | null;
  total_balance_cents_by_currency: Array<{ currency: string; balance_cents: number }> | null;
  today_credits_cents: number | null;
  today_debits_cents: number | null;
  entries_last_24h: number | null;
  frozen_count: number | null;
  closed_count: number | null;
  largest_recent: Array<{ id: string; wallet_id: string; direction: string; entry_type: string; amount_cents: number; currency: string; created_at: string }> | null;
  recent_transactions: Array<{ id: string; wallet_id: string; direction: string; entry_type: string; amount_cents: number; currency: string; created_at: string }> | null;
  generated_at: string;
}

export const getWalletOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WalletOverview> => {
    // deno-lint-ignore no-explicit-any
    const sb: any = context.supabase;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const since24 = new Date(Date.now() - 86_400_000).toISOString();

    const [wallets, balances, frozen, closed, credits, debits, entries24, largest, recent] = await Promise.all([
      sb.from("wallets").select("id", { count: "exact", head: true }),
      sb.from("v_wallet_balances").select("currency, balance_cents"),
      sb.from("wallets").select("id", { count: "exact", head: true }).eq("status", "frozen"),
      sb.from("wallets").select("id", { count: "exact", head: true }).eq("status", "closed"),
      sb.from("wallet_ledger_entries").select("amount_cents")
        .eq("direction", "credit").gte("created_at", startOfDay),
      sb.from("wallet_ledger_entries").select("amount_cents")
        .eq("direction", "debit").gte("created_at", startOfDay),
      sb.from("wallet_ledger_entries").select("id", { count: "exact", head: true }).gte("created_at", since24),
      sb.from("wallet_ledger_entries")
        .select("id, wallet_id, direction, entry_type, amount_cents, currency, created_at")
        .gte("created_at", since24).order("amount_cents", { ascending: false }).limit(10),
      sb.from("wallet_ledger_entries")
        .select("id, wallet_id, direction, entry_type, amount_cents, currency, created_at")
        .order("created_at", { ascending: false }).limit(20),
    ]);

    const sumCents = (rows: Array<{ amount_cents: number }> | null | undefined) =>
      (rows ?? []).reduce((a, r) => a + Number(r.amount_cents || 0), 0);

    const byCurrency: Record<string, number> = {};
    for (const r of ((balances.data ?? []) as Array<{ currency: string; balance_cents: number }>)) {
      const cur = (r.currency ?? "USD").toUpperCase();
      byCurrency[cur] = (byCurrency[cur] ?? 0) + Number(r.balance_cents || 0);
    }

    return {
      wallet_count:                     wallets.error ? null : (wallets.count ?? 0),
      total_balance_cents_by_currency:  balances.error ? null :
        Object.entries(byCurrency).map(([currency, balance_cents]) => ({ currency, balance_cents })),
      today_credits_cents:              credits.error ? null : sumCents(credits.data),
      today_debits_cents:               debits.error ? null : sumCents(debits.data),
      entries_last_24h:                 entries24.error ? null : (entries24.count ?? 0),
      frozen_count:                     frozen.error ? null : (frozen.count ?? 0),
      closed_count:                     closed.error ? null : (closed.count ?? 0),
      largest_recent:                   largest.error ? null : (largest.data ?? []),
      recent_transactions:              recent.error ? null : (recent.data ?? []),
      generated_at:                     new Date().toISOString(),
    };
  });
