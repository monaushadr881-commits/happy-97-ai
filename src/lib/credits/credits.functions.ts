/**
 * R11 — Credits Server Functions
 *
 * Auth-gated wrappers over the credits engine.
 *   - user-owned credits: caller must be the owner or ops-admin
 *   - company-owned credits: caller must be company admin or ops-admin
 *   - admin_grant / bonus / referral: additionally require ops-admin
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getBalance,
  grant,
  consume,
  refund,
  transfer,
  expireDueGrants,
  type CreditOwnerType,
} from "./engine";

type Ctx = { supabase: unknown; userId: string };

async function assertOwnership(context: Ctx, ownerType: CreditOwnerType, ownerId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  if (ownerType === "user") {
    if (ownerId !== context.userId) {
      const { data: ops } = await sb.rpc("is_ops_admin", { _user_id: context.userId });
      if (!ops) throw new Error("Forbidden: not credits owner");
    }
    return;
  }
  const { data, error } = await sb.rpc("is_company_admin",
    { _user_id: context.userId, _company_id: ownerId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: company admin required");
}

async function assertOpsAdmin(context: Ctx) {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  const { data, error } = await sb.rpc("is_ops_admin", { _user_id: context.userId });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: ops admin required");
}

/* -------------------------------------------------------------------------- */

export const getCreditBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ownerType: CreditOwnerType; ownerId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context as Ctx, data.ownerType, data.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getBalance(supabaseAdmin, data.ownerType, data.ownerId);
  });

export const listCreditHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ownerType: CreditOwnerType; ownerId: string; limit?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context as Ctx, data.ownerType, data.ownerId);
    // deno-lint-ignore no-explicit-any
    const sb: any = (context as Ctx).supabase;
    const { data: rows, error } = await sb
      .from("credit_ledger_entries")
      .select("id, direction, amount, entry_type, description, reference_type, reference_id, expires_at, metadata, created_at")
      .eq("owner_type", data.ownerType)
      .eq("owner_id", data.ownerId)
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 100, 500));
    if (error) throw new Error(`db_read_failed: ${error.message}`);
    return rows ?? [];
  });

export const grantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ownerType: CreditOwnerType;
    ownerId: string;
    amount: number;
    entryType: "purchase" | "bonus" | "referral" | "admin_grant" | "refund";
    referenceType?: string;
    referenceId?: string;
    description?: string;
    expiresAt?: string | null;
    metadata?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    if (data.entryType === "admin_grant" || data.entryType === "bonus" || data.entryType === "referral") {
      await assertOpsAdmin(context as Ctx);
    } else {
      await assertOwnership(context as Ctx, data.ownerType, data.ownerId);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return grant(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const consumeCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ownerType: CreditOwnerType;
    ownerId: string;
    amount: number;
    entryType: "consume" | "ai_usage" | "builder_usage" | "marketplace_usage" | "automation_usage";
    referenceType?: string;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context as Ctx, data.ownerType, data.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return consume(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const refundCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    ownerType: CreditOwnerType;
    ownerId: string;
    amount: number;
    referenceType: string;
    referenceId: string;
    description?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return refund(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

export const transferCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    fromOwnerType: CreditOwnerType;
    fromOwnerId: string;
    toOwnerType: CreditOwnerType;
    toOwnerId: string;
    amount: number;
    description?: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context as Ctx, data.fromOwnerType, data.fromOwnerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transfer(supabaseAdmin, { ...data, actorId: (context as Ctx).userId });
  });

/* -------------------------------------------------------------------------- */
/* Founder overview                                                            */
/* -------------------------------------------------------------------------- */

export interface CreditsOverview {
  active_owners: number | null;
  total_available: number | null;
  today_granted: number | null;
  today_consumed: number | null;
  lifetime_issued: number | null;
  lifetime_consumed: number | null;
  lifetime_expired: number | null;
  lifetime_refunded: number | null;
  usage_breakdown: Array<{ entry_type: string; amount: number }> | null;
  recent_entries: unknown[] | null;
  generated_at: string;
}

export const getCreditsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditsOverview> => {
    await assertOpsAdmin(context as Ctx);
    // deno-lint-ignore no-explicit-any
    const sb: any = (context as Ctx).supabase;
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const since24 = new Date(Date.now() - 86_400_000).toISOString();

    const [balances, totals, todayCredits, todayDebits, recent, usageRows] = await Promise.all([
      sb.from("v_credit_balances").select("balance, owner_id"),
      sb.from("v_credit_totals").select("issued, consumed, expired, refunded"),
      sb.from("credit_ledger_entries").select("amount")
        .eq("direction", "credit").gte("created_at", startOfDay),
      sb.from("credit_ledger_entries").select("amount")
        .eq("direction", "debit").gte("created_at", startOfDay),
      sb.from("credit_ledger_entries")
        .select("id, owner_type, owner_id, direction, entry_type, amount, description, created_at")
        .order("created_at", { ascending: false }).limit(20),
      sb.from("credit_ledger_entries").select("entry_type, amount")
        .eq("direction", "debit").gte("created_at", since24),
    ]);

    const sum = (rows: Array<{ amount: number | string }> | null | undefined) =>
      (rows ?? []).reduce((a, r) => a + Number(r.amount || 0), 0);
    const sumField = (rows: Array<Record<string, number | string>> | null | undefined, f: string) =>
      (rows ?? []).reduce((a, r) => a + Number(r[f] || 0), 0);

    const usageMap: Record<string, number> = {};
    for (const r of (usageRows.data ?? []) as Array<{ entry_type: string; amount: number }>) {
      usageMap[r.entry_type] = (usageMap[r.entry_type] ?? 0) + Number(r.amount || 0);
    }

    return {
      active_owners:      balances.error ? null : (balances.data ?? []).length,
      total_available:    balances.error ? null : sumField(balances.data as never, "balance"),
      today_granted:      todayCredits.error ? null : sum(todayCredits.data),
      today_consumed:     todayDebits.error ? null : sum(todayDebits.data),
      lifetime_issued:    totals.error ? null : sumField(totals.data as never, "issued"),
      lifetime_consumed:  totals.error ? null : sumField(totals.data as never, "consumed"),
      lifetime_expired:   totals.error ? null : sumField(totals.data as never, "expired"),
      lifetime_refunded:  totals.error ? null : sumField(totals.data as never, "refunded"),
      usage_breakdown:    Object.entries(usageMap).map(([entry_type, amount]) => ({ entry_type, amount })),
      recent_entries:     recent.error ? null : (recent.data ?? []),
      generated_at:       new Date().toISOString(),
    };
  });

export const sweepExpiredCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOpsAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return expireDueGrants(supabaseAdmin);
  });
