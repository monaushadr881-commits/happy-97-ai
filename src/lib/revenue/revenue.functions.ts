/**
 * R183 Batch J — Revenue OS Runtime Completion (Wallet / Credits /
 * Subscriptions / Payments)
 *
 * FOUR canonical Revenue OS mutation flows, wired end-to-end through
 * the existing canonical runtime. No new tables, engines, dashboards,
 * or V2s. Every flow follows the invoice (Batch E) template:
 *
 *   Founder / Admin request
 *       ↓
 *   withBrain()  ── capability = "revenue.<flow>.execute"
 *       ↓  Impact / policy analysis
 *   above threshold  ─►  requestFounderApproval (R158)
 *       ↓                    ↓ pending  →  founder decides
 *   below threshold          ↓ approved →  rev*Apply* handler
 *       ↓                                       ↓
 *   canonical INSERT  ──►  writeCanonicalAudit
 *
 * Canonical owners reused (never duplicated):
 *   • persistence   public.wallets, public.wallet_ledger_entries,
 *                   public.credit_ledger_entries,
 *                   public.subscriptions, public.subscription_events,
 *                   public.payments
 *   • brain         withBrain / runBrain (src/lib/founder/with-brain)
 *   • approvals     public.approvals via request/decideFounderApproval
 *   • audit         writeCanonicalAudit → public.write_audit
 *   • policy        REVENUE_APPROVAL_THRESHOLDS from ./credit-policy
 *   • auth/RLS      requireSupabaseAuth
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { withBrain } from "@/lib/founder/with-brain";
import type { FounderApprovalContext } from "@/lib/founder/types";
import { REVENUE_APPROVAL_THRESHOLDS } from "./credit-policy";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

interface PendingResult {
  status: "pending_approval";
  approval_id: string;
  approval_status: ApprovalStatus;
  reason: string;
}

// ────────────────────────────────────────────────────────────────
// 1. WALLET — public.wallets + public.wallet_ledger_entries
// ────────────────────────────────────────────────────────────────

const WalletAdjustInput = z.object({
  wallet_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  direction: z.enum(["credit", "debit"]),
  entry_type: z.enum([
    "purchase",
    "refund",
    "reward",
    "referral",
    "adjustment",
    "marketplace_earning",
    "builder_earning",
    "consume",
    "payout",
    "chargeback",
  ]),
  currency: z.string().min(3).max(8).default("INR"),
  description: z.string().max(500).nullable().optional(),
  reference_type: z.string().max(64).nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
});
type WalletAdjustInput = z.infer<typeof WalletAdjustInput>;

const analyseWalletImpact = withBrain<
  WalletAdjustInput,
  { requires_founder_approval: boolean; threshold_cents: number }
>({
  capability: "revenue.wallet.adjust",
  handler: async (input) => ({
    requires_founder_approval:
      input.amount_cents >= REVENUE_APPROVAL_THRESHOLDS.WALLET_CENTS,
    threshold_cents: REVENUE_APPROVAL_THRESHOLDS.WALLET_CENTS,
  }),
});

export const revWalletAdjust = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => WalletAdjustInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "revenue", module: "wallet", capability: "adjust", user_id: context.userId, company_id: data.company_id ?? "00000000-0000-0000-0000-000000000000", summary: `wallet adjust ${data.delta_cents}`, metadata: { delta_cents: data.delta_cents, currency: data.currency } });
    const brainCtx: FounderApprovalContext = { isFounder: true, correlationId: userId };
    const brain = await analyseWalletImpact({
      capability: "revenue.wallet.adjust",
      input: data,
      context: brainCtx,
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id ?? "00000000-0000-0000-0000-000000000000",
          entity_type: "revenue.wallet.adjust",
          entity_id: data.wallet_id,
          title: `Wallet ${data.direction} ${(data.amount_cents / 100).toFixed(2)} ${data.currency}`,
          amount_cents: data.amount_cents,
          currency: data.currency,
          metadata: {
            source: "revenue_os.wallet",
            payload: data satisfies WalletAdjustInput,
            threshold_cents: brain.output.threshold_cents,
            brain_duration_ms: brain.durationMs,
          },
        },
      });
      return {
        status: "pending_approval",
        approval_id: approval.id,
        approval_status: approval.status,
        reason: "wallet_amount_exceeds_founder_threshold",
      } satisfies PendingResult;
    }

    const { data: row, error } = await supabase
      .from("wallet_ledger_entries")
      .insert({
        wallet_id: data.wallet_id,
        amount_cents: data.amount_cents,
        currency: data.currency,
        direction: data.direction,
        entry_type: data.entry_type,
        description: data.description ?? null,
        reference_type: data.reference_type ?? null,
        reference_id: data.reference_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`wallet_ledger_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "revenue.wallet",
      action: data.direction,
      entity_type: "wallet_ledger_entry",
      entity_id: row.id,
      company_id: data.company_id ?? undefined,
      after: row,
      severity: "notice",
      metadata: { approval_required: false },
    });

    return { status: "posted" as const, ledger_entry: row };
  });

export const revApplyApprovedWalletAdjust = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ approval_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: approval, error: readErr } = await supabase
      .from("approvals").select("*").eq("id", data.approval_id).single();
    if (readErr || !approval) throw new Error("approval_not_found");
    if (approval.status !== "approved") throw new Error(`approval_not_approved:${approval.status}`);
    const meta = (approval.metadata ?? {}) as {
      source?: string; payload?: WalletAdjustInput; executed_ledger_id?: string;
    };
    if (meta.source !== "revenue_os.wallet" || !meta.payload) {
      throw new Error("approval_not_wallet_source");
    }
    if (meta.executed_ledger_id) {
      return { status: "posted" as const, ledger_entry_id: meta.executed_ledger_id };
    }
    const payload = WalletAdjustInput.parse(meta.payload);
    const { data: row, error } = await supabase
      .from("wallet_ledger_entries")
      .insert({
        wallet_id: payload.wallet_id,
        amount_cents: payload.amount_cents,
        currency: payload.currency,
        direction: payload.direction,
        entry_type: payload.entry_type,
        description: payload.description ?? null,
        reference_type: payload.reference_type ?? null,
        reference_id: payload.reference_id ?? null,
      })
      .select("*").single();
    if (error) throw new Error(`wallet_ledger_insert_failed: ${error.message}`);

    await supabase.from("approvals")
      .update({ metadata: { ...meta, executed_ledger_id: row.id } as never })
      .eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category: "revenue.wallet",
      action: payload.direction,
      entity_type: "wallet_ledger_entry",
      entity_id: row.id,
      company_id: payload.company_id ?? undefined,
      after: row,
      severity: "notice",
      metadata: { approval_required: true, approval_id: data.approval_id },
    });
    return { status: "posted" as const, ledger_entry: row };
  });

// ────────────────────────────────────────────────────────────────
// 2. CREDITS — public.credit_ledger_entries
// Daily-free policy: see ./credit-policy. Consume flow must call
// resolveDeduction(); this handler covers grant/refund/expire only.
// ────────────────────────────────────────────────────────────────

const CreditGrantInput = z.object({
  owner_type: z.enum(["user", "company"]),
  owner_id: z.string().uuid(),
  amount: z.number().int().positive(),
  direction: z.enum(["credit", "debit"]).default("credit"),
  entry_type: z.enum([
    "purchase", "refund", "expire", "transfer_in", "transfer_out",
    "bonus", "referral", "admin_grant",
  ]),
  description: z.string().max(500).nullable().optional(),
  reference_type: z.string().max(64).nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
});
type CreditGrantInput = z.infer<typeof CreditGrantInput>;

const analyseCreditImpact = withBrain<
  CreditGrantInput,
  { requires_founder_approval: boolean; threshold: number }
>({
  capability: "revenue.credits.grant",
  handler: async (input) => ({
    requires_founder_approval:
      input.entry_type === "admin_grant" &&
      input.amount >= REVENUE_APPROVAL_THRESHOLDS.CREDIT_UNITS,
    threshold: REVENUE_APPROVAL_THRESHOLDS.CREDIT_UNITS,
  }),
});

export const revGrantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreditGrantInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "revenue", module: "credits", capability: "grant", user_id: context.userId, company_id: data.company_id ?? "00000000-0000-0000-0000-000000000000", summary: `grant credits ${data.credits}`, metadata: { credits: data.credits } });
    const brain = await analyseCreditImpact({
      capability: "revenue.credits.grant",
      input: data,
      context: { isFounder: true, correlationId: userId },
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id ?? "00000000-0000-0000-0000-000000000000",
          entity_type: "revenue.credits.grant",
          entity_id: data.owner_id,
          title: `Credit grant ${data.amount} · ${data.entry_type}`,
          metadata: {
            source: "revenue_os.credits",
            payload: data satisfies CreditGrantInput,
            threshold: brain.output.threshold,
            brain_duration_ms: brain.durationMs,
          },
        },
      });
      return {
        status: "pending_approval",
        approval_id: approval.id,
        approval_status: approval.status,
        reason: "admin_grant_exceeds_founder_threshold",
      } satisfies PendingResult;
    }

    const { data: row, error } = await supabase
      .from("credit_ledger_entries")
      .insert({
        owner_type: data.owner_type,
        owner_id: data.owner_id,
        amount: data.amount,
        direction: data.direction,
        entry_type: data.entry_type,
        description: data.description ?? null,
        reference_type: data.reference_type ?? null,
        reference_id: data.reference_id ?? null,
        expires_at: data.expires_at ?? null,
      })
      .select("*").single();
    if (error) throw new Error(`credit_ledger_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "revenue.credits",
      action: data.entry_type,
      entity_type: "credit_ledger_entry",
      entity_id: row.id,
      company_id: data.company_id ?? undefined,
      after: row,
      severity: "notice",
      metadata: { approval_required: false },
    });

    return { status: "posted" as const, ledger_entry: row };
  });

export const revApplyApprovedGrantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ approval_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: approval, error: readErr } = await supabase
      .from("approvals").select("*").eq("id", data.approval_id).single();
    if (readErr || !approval) throw new Error("approval_not_found");
    if (approval.status !== "approved") throw new Error(`approval_not_approved:${approval.status}`);
    const meta = (approval.metadata ?? {}) as {
      source?: string; payload?: CreditGrantInput; executed_ledger_id?: string;
    };
    if (meta.source !== "revenue_os.credits" || !meta.payload) {
      throw new Error("approval_not_credits_source");
    }
    if (meta.executed_ledger_id) {
      return { status: "posted" as const, ledger_entry_id: meta.executed_ledger_id };
    }
    const payload = CreditGrantInput.parse(meta.payload);
    const { data: row, error } = await supabase
      .from("credit_ledger_entries")
      .insert({
        owner_type: payload.owner_type,
        owner_id: payload.owner_id,
        amount: payload.amount,
        direction: payload.direction,
        entry_type: payload.entry_type,
        description: payload.description ?? null,
        reference_type: payload.reference_type ?? null,
        reference_id: payload.reference_id ?? null,
        expires_at: payload.expires_at ?? null,
      })
      .select("*").single();
    if (error) throw new Error(`credit_ledger_insert_failed: ${error.message}`);

    await supabase.from("approvals")
      .update({ metadata: { ...meta, executed_ledger_id: row.id } as never })
      .eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category: "revenue.credits",
      action: payload.entry_type,
      entity_type: "credit_ledger_entry",
      entity_id: row.id,
      company_id: payload.company_id ?? undefined,
      after: row,
      severity: "notice",
      metadata: { approval_required: true, approval_id: data.approval_id },
    });
    return { status: "posted" as const, ledger_entry: row };
  });

// ────────────────────────────────────────────────────────────────
// 3. SUBSCRIPTIONS — public.subscriptions + public.subscription_events
// ────────────────────────────────────────────────────────────────

const SubscriptionChangeInput = z.object({
  company_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  event_type: z.enum([
    "created", "trial_started", "activated", "renewed",
    "upgraded", "downgraded", "paused", "resumed", "cancelled",
    "expired", "payment_failed",
  ]),
  seats: z.number().int().positive().default(1),
  currency: z.string().min(3).max(8).default("INR"),
  auto_renew: z.boolean().default(true),
  current_period_start: z.string().optional(),
  current_period_end: z.string().nullable().optional(),
  trial_ends_at: z.string().nullable().optional(),
  provider: z.string().max(32).nullable().optional(),
  provider_ref: z.string().max(128).nullable().optional(),
});
type SubscriptionChangeInput = z.infer<typeof SubscriptionChangeInput>;

const analyseSubscriptionImpact = withBrain<
  SubscriptionChangeInput,
  { requires_founder_approval: boolean; reason: string }
>({
  capability: "revenue.subscription.change",
  handler: async (input) => {
    // Founder-gated transitions: cancellation, downgrade, upgrade to
    // an enterprise-priced plan (heuristic — seats ≥ 25).
    const gated =
      input.event_type === "cancelled" ||
      input.event_type === "downgraded" ||
      (input.event_type === "upgraded" && input.seats >= 25);
    return {
      requires_founder_approval: gated,
      reason: gated ? `subscription_${input.event_type}_gated` : "auto",
    };
  },
});

export const revChangeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubscriptionChangeInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "revenue", module: "subscription", capability: "change", user_id: context.userId, company_id: data.company_id, summary: `subscription change to ${data.plan_id}` });
    const brain = await analyseSubscriptionImpact({
      capability: "revenue.subscription.change",
      input: data,
      context: { isFounder: true, correlationId: userId },
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "revenue.subscription",
          entity_id: crypto.randomUUID(),
          title: `Subscription ${data.event_type} · seats ${data.seats}`,
          metadata: {
            source: "revenue_os.subscription",
            payload: data satisfies SubscriptionChangeInput,
            gate_reason: brain.output.reason,
            brain_duration_ms: brain.durationMs,
          },
        },
      });
      return {
        status: "pending_approval",
        approval_id: approval.id,
        approval_status: approval.status,
        reason: brain.output.reason,
      } satisfies PendingResult;
    }

    return applySubscriptionChange(supabase, data, null);
  });

export const revApplyApprovedChangeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ approval_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: approval, error: readErr } = await supabase
      .from("approvals").select("*").eq("id", data.approval_id).single();
    if (readErr || !approval) throw new Error("approval_not_found");
    if (approval.status !== "approved") throw new Error(`approval_not_approved:${approval.status}`);
    const meta = (approval.metadata ?? {}) as {
      source?: string; payload?: SubscriptionChangeInput; executed_subscription_id?: string;
    };
    if (meta.source !== "revenue_os.subscription" || !meta.payload) {
      throw new Error("approval_not_subscription_source");
    }
    if (meta.executed_subscription_id) {
      return { status: "posted" as const, subscription_id: meta.executed_subscription_id };
    }
    const payload = SubscriptionChangeInput.parse(meta.payload);
    const result = await applySubscriptionChange(supabase, payload, data.approval_id);
    await supabase.from("approvals")
      .update({ metadata: { ...meta, executed_subscription_id: result.subscription.id } as never })
      .eq("id", data.approval_id);
    return result;
  });

async function applySubscriptionChange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  payload: SubscriptionChangeInput,
  approvalId: string | null,
) {
  // Upsert subscription per (company_id, plan_id) — keep it deterministic.
  const now = new Date().toISOString();
  const status =
    payload.event_type === "cancelled" ? "cancelled" :
    payload.event_type === "expired" ? "expired" :
    payload.event_type === "paused" ? "paused" :
    payload.event_type === "trial_started" ? "trial" :
    payload.event_type === "payment_failed" ? "past_due" :
    "active";

  const { data: existing } = await sb
    .from("subscriptions")
    .select("*")
    .eq("company_id", payload.company_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const upsertRow = {
    company_id: payload.company_id,
    plan_id: payload.plan_id,
    seats: payload.seats,
    currency: payload.currency,
    auto_renew: payload.auto_renew,
    status,
    current_period_start: payload.current_period_start ?? now,
    current_period_end: payload.current_period_end ?? null,
    trial_ends_at: payload.trial_ends_at ?? null,
    provider: payload.provider ?? null,
    provider_ref: payload.provider_ref ?? null,
    cancelled_at: payload.event_type === "cancelled" ? now : null,
  };

  let subscription;
  if (existing) {
    const { data, error } = await sb.from("subscriptions")
      .update(upsertRow).eq("id", existing.id).select("*").single();
    if (error) throw new Error(`subscription_update_failed: ${error.message}`);
    subscription = data;
  } else {
    const { data, error } = await sb.from("subscriptions")
      .insert(upsertRow).select("*").single();
    if (error) throw new Error(`subscription_insert_failed: ${error.message}`);
    subscription = data;
  }

  const { error: evtErr } = await sb.from("subscription_events").insert({
    subscription_id: subscription.id,
    event_type: payload.event_type,
    from_plan_id: existing?.plan_id ?? null,
    to_plan_id: payload.plan_id,
    metadata: { approval_id: approvalId },
  });
  if (evtErr) throw new Error(`subscription_event_insert_failed: ${evtErr.message}`);

  await writeCanonicalAudit(sb, {
    category: "revenue.subscription",
    action: payload.event_type,
    entity_type: "subscription",
    entity_id: subscription.id,
    company_id: payload.company_id,
    before: existing ?? null,
    after: subscription,
    severity: payload.event_type === "cancelled" ? "warning" : "notice",
    metadata: { approval_required: approvalId !== null, approval_id: approvalId },
  });

  return { status: "posted" as const, subscription };
}

// ────────────────────────────────────────────────────────────────
// 4. PAYMENTS — public.payments
// ────────────────────────────────────────────────────────────────

const RecordPaymentInput = z.object({
  company_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  currency: z.string().min(3).max(8).default("INR"),
  status: z.enum(["pending", "succeeded", "failed", "refunded"]).default("succeeded"),
  invoice_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  provider: z.string().max(32).nullable().optional(),
  provider_ref: z.string().max(128).nullable().optional(),
  received_at: z.string().nullable().optional(),
});
type RecordPaymentInput = z.infer<typeof RecordPaymentInput>;

const analysePaymentImpact = withBrain<
  RecordPaymentInput,
  { requires_founder_approval: boolean; threshold_cents: number }
>({
  capability: "revenue.payment.record",
  handler: async (input) => ({
    requires_founder_approval:
      input.amount_cents >= REVENUE_APPROVAL_THRESHOLDS.PAYMENT_CENTS,
    threshold_cents: REVENUE_APPROVAL_THRESHOLDS.PAYMENT_CENTS,
  }),
});

export const revRecordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordPaymentInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "revenue", module: "payment", capability: "record", user_id: context.userId, company_id: data.company_id, summary: `record payment ${data.amount_cents}`, metadata: { amount_cents: data.amount_cents, currency: data.currency } });
    const brain = await analysePaymentImpact({
      capability: "revenue.payment.record",
      input: data,
      context: { isFounder: true, correlationId: userId },
    });

    if (brain.output.requires_founder_approval) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "revenue.payment",
          entity_id: data.invoice_id ?? crypto.randomUUID(),
          title: `Payment ${(data.amount_cents / 100).toFixed(2)} ${data.currency}`,
          amount_cents: data.amount_cents,
          currency: data.currency,
          metadata: {
            source: "revenue_os.payment",
            payload: data satisfies RecordPaymentInput,
            threshold_cents: brain.output.threshold_cents,
            brain_duration_ms: brain.durationMs,
          },
        },
      });
      return {
        status: "pending_approval",
        approval_id: approval.id,
        approval_status: approval.status,
        reason: "payment_amount_exceeds_founder_threshold",
      } satisfies PendingResult;
    }

    const { data: row, error } = await supabase
      .from("payments")
      .insert({
        company_id: data.company_id,
        amount_cents: data.amount_cents,
        currency: data.currency,
        status: data.status,
        invoice_id: data.invoice_id ?? null,
        customer_id: data.customer_id ?? null,
        provider: data.provider ?? null,
        provider_ref: data.provider_ref ?? null,
        received_at: data.received_at ?? new Date().toISOString(),
      })
      .select("*").single();
    if (error) throw new Error(`payment_insert_failed: ${error.message}`);

    await writeCanonicalAudit(supabase, {
      category: "revenue.payment",
      action: data.status,
      entity_type: "payment",
      entity_id: row.id,
      company_id: data.company_id,
      after: row,
      severity: data.status === "failed" ? "warning" : "notice",
      metadata: { approval_required: false },
    });

    return { status: "posted" as const, payment: row };
  });

export const revApplyApprovedRecordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ approval_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: approval, error: readErr } = await supabase
      .from("approvals").select("*").eq("id", data.approval_id).single();
    if (readErr || !approval) throw new Error("approval_not_found");
    if (approval.status !== "approved") throw new Error(`approval_not_approved:${approval.status}`);
    const meta = (approval.metadata ?? {}) as {
      source?: string; payload?: RecordPaymentInput; executed_payment_id?: string;
    };
    if (meta.source !== "revenue_os.payment" || !meta.payload) {
      throw new Error("approval_not_payment_source");
    }
    if (meta.executed_payment_id) {
      return { status: "posted" as const, payment_id: meta.executed_payment_id };
    }
    const payload = RecordPaymentInput.parse(meta.payload);
    const { data: row, error } = await supabase
      .from("payments")
      .insert({
        company_id: payload.company_id,
        amount_cents: payload.amount_cents,
        currency: payload.currency,
        status: payload.status,
        invoice_id: payload.invoice_id ?? null,
        customer_id: payload.customer_id ?? null,
        provider: payload.provider ?? null,
        provider_ref: payload.provider_ref ?? null,
        received_at: payload.received_at ?? new Date().toISOString(),
      })
      .select("*").single();
    if (error) throw new Error(`payment_insert_failed: ${error.message}`);

    await supabase.from("approvals")
      .update({ metadata: { ...meta, executed_payment_id: row.id } as never })
      .eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category: "revenue.payment",
      action: payload.status,
      entity_type: "payment",
      entity_id: row.id,
      company_id: payload.company_id,
      after: row,
      severity: "notice",
      metadata: { approval_required: true, approval_id: data.approval_id },
    });
    return { status: "posted" as const, payment: row };
  });
