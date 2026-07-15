/**
 * HAPPY — Subscription Lifecycle Server Functions (R9)
 *
 * Every mutation is gated by:
 *   1. requireSupabaseAuth (valid Supabase session)
 *   2. is_company_admin(auth.uid(), company_id) — RLS-enforced
 * Server-side execution uses supabaseAdmin ONLY after the caller is
 * authorized. Read endpoints go through the RLS-scoped user client.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createSubscription,
  transitionSubscription,
  type SubAction,
} from "./lifecycle";

async function assertCompanyAdmin(context: { supabase: unknown; userId: string }, companyId: string) {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  const { data, error } = await sb.rpc("is_company_admin", {
    _user_id: context.userId,
    _company_id: companyId,
  });
  if (error) throw new Error(`authz_check_failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: company admin required");
}

async function loadSubscriptionCompany(context: { supabase: unknown }, subId: string): Promise<string> {
  // deno-lint-ignore no-explicit-any
  const sb: any = context.supabase;
  const { data, error } = await sb.from("subscriptions").select("company_id").eq("id", subId).maybeSingle();
  if (error) throw new Error(`db_read_failed: ${error.message}`);
  if (!data) throw new Error("subscription_not_found");
  return (data as { company_id: string }).company_id;
}

// ---------- Create ----------------------------------------------------------

export const createCompanySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    companyId: string; planId: string;
    seats?: number; currency?: string; trialDays?: number; autoRenew?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertCompanyAdmin(context, data.companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return createSubscription(supabaseAdmin, {
      companyId: data.companyId,
      planId: data.planId,
      seats: data.seats,
      currency: data.currency,
      trialDays: data.trialDays,
      autoRenew: data.autoRenew,
      actorId: context.userId,
      notifyUserId: context.userId,
    });
  });

// ---------- Generic transition ---------------------------------------------

export const applySubscriptionTransition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    subscriptionId: string;
    action: SubAction;
    nextPeriodEnd?: string | null;
    toPlanId?: string;
    cancelAt?: string;
    metadata?: Record<string, unknown>;
  }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await loadSubscriptionCompany(context, data.subscriptionId);
    await assertCompanyAdmin(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transitionSubscription(supabaseAdmin, {
      subscriptionId: data.subscriptionId,
      action: data.action,
      nextPeriodEnd: data.nextPeriodEnd,
      toPlanId: data.toPlanId,
      cancelAt: data.cancelAt,
      metadata: data.metadata,
      actorId: context.userId,
      notifyUserId: context.userId,
    });
  });

// ---------- Convenience wrappers -------------------------------------------

export const renewSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId: string; nextPeriodEnd: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await loadSubscriptionCompany(context, data.subscriptionId);
    await assertCompanyAdmin(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transitionSubscription(supabaseAdmin, {
      subscriptionId: data.subscriptionId, action: "renew",
      nextPeriodEnd: data.nextPeriodEnd, actorId: context.userId, notifyUserId: context.userId,
    });
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId: string; atPeriodEnd?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await loadSubscriptionCompany(context, data.subscriptionId);
    await assertCompanyAdmin(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transitionSubscription(supabaseAdmin, {
      subscriptionId: data.subscriptionId,
      action: data.atPeriodEnd ? "cancel_at_period_end" : "cancel",
      actorId: context.userId, notifyUserId: context.userId,
    });
  });

export const pauseSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await loadSubscriptionCompany(context, data.subscriptionId);
    await assertCompanyAdmin(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transitionSubscription(supabaseAdmin, {
      subscriptionId: data.subscriptionId, action: "pause",
      actorId: context.userId, notifyUserId: context.userId,
    });
  });

export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await loadSubscriptionCompany(context, data.subscriptionId);
    await assertCompanyAdmin(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transitionSubscription(supabaseAdmin, {
      subscriptionId: data.subscriptionId, action: "resume",
      actorId: context.userId, notifyUserId: context.userId,
    });
  });

export const changeSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId: string; toPlanId: string; nextPeriodEnd?: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await loadSubscriptionCompany(context, data.subscriptionId);
    await assertCompanyAdmin(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return transitionSubscription(supabaseAdmin, {
      subscriptionId: data.subscriptionId, action: "change_plan",
      toPlanId: data.toPlanId, nextPeriodEnd: data.nextPeriodEnd,
      actorId: context.userId, notifyUserId: context.userId,
    });
  });

// ---------- Read: KPI overview for founder dashboard -----------------------

export interface LifecycleOverview {
  active: number | null;
  trial: number | null;
  past_due: number | null;
  paused: number | null;
  cancelled: number | null;
  expired: number | null;
  renewals_today: number | null;
  renewals_this_month: number | null;
  payment_failures_30d: number | null;
  mrr_cents: number | null;
  arr_cents: number | null;
  generated_at: string;
}

export const getLifecycleOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LifecycleOverview> => {
    // deno-lint-ignore no-explicit-any
    const sb: any = context.supabase;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const counts = await Promise.all([
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trial"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "past_due"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "paused"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired"),
      sb.from("subscription_events").select("id", { count: "exact", head: true })
        .eq("event_type", "renewed").gte("occurred_at", startOfDay).lt("occurred_at", endOfDay),
      sb.from("subscription_events").select("id", { count: "exact", head: true })
        .eq("event_type", "renewed").gte("occurred_at", startOfMonth).lt("occurred_at", endOfMonth),
      sb.from("subscription_events").select("id", { count: "exact", head: true })
        .eq("event_type", "payment_failed").gte("occurred_at", since30),
    ]);

    const [active, trial, pastDue, paused, cancelled, expired, rToday, rMonth, pf30] = counts;

    // MRR from active + trial subscriptions × plan monthly price. If there are
    // no active subs, expose real 0. If reads fail, null (not zero).
    const { data: mrrRows, error: mrrErr } = await sb
      .from("subscriptions")
      .select("plan:plans(price_cents, billing_interval)")
      .in("status", ["active", "trial"]);
    let mrrCents: number | null = null;
    if (!mrrErr) {
      mrrCents = 0;
      for (const r of (mrrRows ?? []) as Array<{ plan: { price_cents: number; billing_interval: string } | null }>) {
        const p = r.plan;
        if (!p) continue;
        const divisor =
          p.billing_interval === "year" ? 12 :
          p.billing_interval === "quarter" ? 3 :
          p.billing_interval === "half_year" ? 6 :
          p.billing_interval === "three_year" ? 36 :
          p.billing_interval === "five_year" ? 60 : 1;
        mrrCents += Math.round(Number(p.price_cents || 0) / divisor);
      }
    }

    return {
      active:               active.error   ? null : (active.count   ?? 0),
      trial:                trial.error    ? null : (trial.count    ?? 0),
      past_due:             pastDue.error  ? null : (pastDue.count  ?? 0),
      paused:               paused.error   ? null : (paused.count   ?? 0),
      cancelled:            cancelled.error? null : (cancelled.count?? 0),
      expired:              expired.error  ? null : (expired.count  ?? 0),
      renewals_today:       rToday.error   ? null : (rToday.count   ?? 0),
      renewals_this_month:  rMonth.error   ? null : (rMonth.count   ?? 0),
      payment_failures_30d: pf30.error     ? null : (pf30.count     ?? 0),
      mrr_cents:            mrrCents,
      arr_cents:            mrrCents == null ? null : mrrCents * 12,
      generated_at:         new Date().toISOString(),
    };
  });
