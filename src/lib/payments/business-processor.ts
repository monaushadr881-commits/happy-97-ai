/**
 * HAPPY — Payment Business Processor (R8)
 *
 * Transforms a verified, normalized webhook event into real business
 * mutations. Runs under service-role (audit + cross-company writes), but
 * every mutation is:
 *
 *   - Idempotent (safe to retry / re-deliver / reprocess)
 *   - Bounded (only touches columns we own for this event)
 *   - Audited (public.audit_logs entry per successful action)
 *   - Recoverable (failure → process_status='failed' with attempts/next_attempt_at)
 *
 * Wallet + Credits paths are honestly BLOCKED — no runtime yet; we do NOT
 * fake balances. When those runtimes ship, add a handler here.
 *
 * Mapping contract:
 *   Provider webhook payloads are expected to carry HAPPY-owned
 *   correlation ids inside `metadata`/`notes`/`custom_data`:
 *     - company_id       (uuid) — required for payment/refund/invoice paths
 *     - invoice_id       (uuid) — required for invoice.paid, optional otherwise
 *     - subscription_id  (uuid) — required for subscription.*
 *     - customer_id      (uuid) — optional; sets payments.customer_id
 *     - user_id          (uuid) — optional; drives notifications
 *
 * Missing correlation ids → event is marked `failed` with reason
 * `unmapped_<field>`. This is intentional: we never guess business owner.
 */
import type {
  CanonicalWebhookEvent,
  CanonicalEventType,
  ProviderCode,
} from "./types";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ProcessOutcome {
  status: "processed" | "ignored" | "failed" | "dead";
  reason?: string;
  details?: { [key: string]: JsonValue };
}

const MAX_ATTEMPTS = 5;
/** Retry backoff in seconds keyed by attempt count. */
const BACKOFF_SECONDS = [30, 120, 600, 1800, 7200];

// ---------------------------------------------------------------------------
// Metadata extraction — provider-shape aware
// ---------------------------------------------------------------------------

interface Correlation {
  company_id?: string;
  invoice_id?: string;
  subscription_id?: string;
  customer_id?: string;
  user_id?: string;
  plan_id?: string;
}

function pick(obj: unknown, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!obj || typeof obj !== "object") return out;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

function extractCorrelation(provider: ProviderCode, raw: unknown): Correlation {
  const wanted = ["company_id", "invoice_id", "subscription_id", "customer_id", "user_id", "plan_id"];
  const r = (raw ?? {}) as Record<string, unknown>;
  const candidates: unknown[] = [];
  // Common locations across providers
  const dataObj = ((r.data as Record<string, unknown> | undefined)?.object) as Record<string, unknown> | undefined;
  if (dataObj) {
    candidates.push(dataObj.metadata);
    candidates.push(dataObj.custom_data);
  }
  candidates.push((r.data as Record<string, unknown> | undefined)?.metadata);
  candidates.push((r.data as Record<string, unknown> | undefined)?.custom_data);
  candidates.push(r.metadata);
  candidates.push(r.custom_data);
  // Razorpay: payload.payment.entity.notes
  const payload = r.payload as Record<string, unknown> | undefined;
  if (payload) {
    for (const key of Object.keys(payload)) {
      const entity = (payload[key] as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined;
      if (entity) candidates.push(entity.notes);
    }
  }
  const merged: Record<string, string> = {};
  for (const c of candidates) Object.assign(merged, pick(c, wanted));
  return merged as Correlation;
}

// ---------------------------------------------------------------------------
// Handlers (return outcomes; DB access via provided admin client)
// ---------------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type Admin = any;

async function writeAudit(
  admin: Admin,
  category: string,
  action: string,
  entity_type: string | null,
  entity_id: string | null,
  company_id: string | null,
  after: Record<string, unknown>,
  severity: "info" | "notice" | "warning" | "critical" = "info",
) {
  try {
    await admin.rpc("write_audit", {
      _category: category,
      _action: action,
      _entity_type: entity_type,
      _entity_id: entity_id,
      _company_id: company_id,
      _before: null,
      _after: after,
      _severity: severity,
      _metadata: { source: "payment_webhook" },
    });
  } catch (e) {
    console.error("[processor] audit failed", e instanceof Error ? e.message : e);
  }
}

async function notify(
  admin: Admin,
  user_id: string | null,
  company_id: string | null,
  kind: string,
  title: string,
  body: string,
  payload: Record<string, unknown>,
) {
  if (!user_id) return; // no addressable user — skip cleanly
  try {
    await admin.from("notifications").insert({
      user_id, company_id, kind, title, body,
      channel: "in_app", payload,
    });
  } catch (e) {
    console.error("[processor] notify failed", e instanceof Error ? e.message : e);
  }
}

async function handlePaymentSucceeded(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation,
): Promise<ProcessOutcome> {
  if (!cor.company_id) return { status: "failed", reason: "unmapped_company_id" };
  if (!evt.providerEventId) return { status: "failed", reason: "missing_provider_ref" };

  const row = {
    company_id: cor.company_id,
    invoice_id: cor.invoice_id ?? null,
    customer_id: cor.customer_id ?? null,
    provider: evt.provider,
    provider_ref: evt.providerEventId,
    amount_cents: evt.amountMinor ?? 0,
    currency: (evt.currency ?? "USD").toUpperCase(),
    status: "succeeded" as const,
    received_at: evt.occurredAt,
    metadata: {
      canonical_type: evt.canonicalType,
      correlation: cor,
    },
  };

  // Idempotent upsert on (provider, provider_ref)
  const { data, error } = await admin
    .from("payments")
    .upsert(row, { onConflict: "provider,provider_ref" })
    .select("id")
    .single();
  if (error) return { status: "failed", reason: "db_upsert_failed", details: { error: error.message } };

  const paymentId = (data as { id: string }).id;

  // Optional invoice settlement
  if (cor.invoice_id && evt.amountMinor) {
    const { data: inv } = await admin
      .from("invoices")
      .select("id, total_cents, amount_paid_cents, company_id")
      .eq("id", cor.invoice_id)
      .eq("company_id", cor.company_id)
      .maybeSingle();
    if (inv) {
      const invRow = inv as { id: string; total_cents: number; amount_paid_cents: number };
      const newPaid = invRow.amount_paid_cents + (evt.amountMinor ?? 0);
      const paid = newPaid >= invRow.total_cents;
      await admin.from("invoices").update({
        amount_paid_cents: newPaid,
        status: paid ? "paid" : undefined,
        paid_at: paid ? evt.occurredAt : undefined,
      }).eq("id", invRow.id);
    }
  }

  await writeAudit(admin, "payment", "payment.succeeded", "payments", paymentId, cor.company_id, {
    provider: evt.provider, amount_minor: evt.amountMinor, currency: evt.currency,
  });
  await notify(admin, cor.user_id ?? null, cor.company_id, "payment_succeeded",
    "Payment received", `A payment of ${(evt.amountMinor ?? 0) / 100} ${evt.currency ?? ""} was received.`,
    { payment_id: paymentId, provider: evt.provider });

  return { status: "processed", details: { payment_id: paymentId } };
}

async function handlePaymentFailed(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation,
): Promise<ProcessOutcome> {
  if (!cor.company_id) return { status: "failed", reason: "unmapped_company_id" };
  if (!evt.providerEventId) return { status: "failed", reason: "missing_provider_ref" };

  const { data, error } = await admin
    .from("payments")
    .upsert({
      company_id: cor.company_id,
      invoice_id: cor.invoice_id ?? null,
      customer_id: cor.customer_id ?? null,
      provider: evt.provider,
      provider_ref: evt.providerEventId,
      amount_cents: evt.amountMinor ?? 0,
      currency: (evt.currency ?? "USD").toUpperCase(),
      status: "failed" as const,
      received_at: evt.occurredAt,
      metadata: { canonical_type: evt.canonicalType, correlation: cor },
    }, { onConflict: "provider,provider_ref" })
    .select("id").single();
  if (error) return { status: "failed", reason: "db_upsert_failed", details: { error: error.message } };

  const paymentId = (data as { id: string }).id;
  await writeAudit(admin, "payment", "payment.failed", "payments", paymentId, cor.company_id,
    { provider: evt.provider }, "warning");
  await notify(admin, cor.user_id ?? null, cor.company_id, "payment_failed",
    "Payment failed", `A payment attempt failed. Please review your billing details.`,
    { payment_id: paymentId, provider: evt.provider });
  return { status: "processed", details: { payment_id: paymentId } };
}

async function handleRefund(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation, completed: boolean,
): Promise<ProcessOutcome> {
  if (!cor.company_id) return { status: "failed", reason: "unmapped_company_id" };
  if (!evt.providerEventId) return { status: "failed", reason: "missing_provider_ref" };

  // Insert refund record as a separate payments row (negative amount) — idempotent on provider_ref.
  const refundRef = `refund:${evt.providerEventId}`;
  const { data, error } = await admin
    .from("payments")
    .upsert({
      company_id: cor.company_id,
      invoice_id: cor.invoice_id ?? null,
      customer_id: cor.customer_id ?? null,
      provider: evt.provider,
      provider_ref: refundRef,
      amount_cents: -(evt.amountMinor ?? 0),
      currency: (evt.currency ?? "USD").toUpperCase(),
      status: "refunded" as const,
      received_at: evt.occurredAt,
      metadata: { canonical_type: evt.canonicalType, correlation: cor, completed },
    }, { onConflict: "provider,provider_ref" })
    .select("id").single();
  if (error) return { status: "failed", reason: "db_upsert_failed", details: { error: error.message } };

  const refundId = (data as { id: string }).id;
  await writeAudit(admin, "payment", `refund.${completed ? "completed" : "created"}`,
    "payments", refundId, cor.company_id,
    { provider: evt.provider, amount_minor: evt.amountMinor }, "notice");
  await notify(admin, cor.user_id ?? null, cor.company_id, "refund",
    completed ? "Refund completed" : "Refund initiated",
    `A refund of ${(evt.amountMinor ?? 0) / 100} ${evt.currency ?? ""} has been ${completed ? "completed" : "initiated"}.`,
    { refund_id: refundId, provider: evt.provider });
  return { status: "processed", details: { refund_id: refundId } };
}

async function handleSubscriptionEvent(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation,
): Promise<ProcessOutcome> {
  if (!cor.subscription_id) return { status: "failed", reason: "unmapped_subscription_id" };

  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("id, company_id, status")
    .eq("id", cor.subscription_id)
    .maybeSingle();
  if (subErr) return { status: "failed", reason: "db_read_failed", details: { error: subErr.message } };
  if (!sub) return { status: "failed", reason: "subscription_not_found" };

  const subRow = sub as { id: string; company_id: string; status: string };
  const update: Record<string, unknown> = {
    provider: evt.provider,
    provider_ref: evt.providerEventId ?? undefined,
  };
  const raw = (evt.raw ?? {}) as Record<string, unknown>;
  const dataObj = (raw.data as Record<string, unknown> | undefined)?.object as Record<string, unknown> | undefined;
  const periodEnd = (dataObj?.current_period_end ?? dataObj?.next_billed_at) as number | string | undefined;
  const nextPeriodEndIso =
    typeof periodEnd === "number" ? new Date(periodEnd * 1000).toISOString() :
    typeof periodEnd === "string" ? periodEnd : undefined;

  let evtType: "created" | "renewed" | "cancelled" | "expired" = "created";
  switch (evt.canonicalType) {
    case "subscription.created":
      update.status = "active"; evtType = "created";
      if (nextPeriodEndIso) update.current_period_end = nextPeriodEndIso;
      break;
    case "subscription.renewed":
      update.status = "active"; evtType = "renewed";
      if (nextPeriodEndIso) update.current_period_end = nextPeriodEndIso;
      break;
    case "subscription.cancelled":
      update.status = "cancelled"; update.cancelled_at = evt.occurredAt; evtType = "cancelled";
      break;
    case "subscription.expired":
      update.status = "expired"; evtType = "expired";
      break;
    default:
      return { status: "ignored", reason: "non_subscription_event" };
  }

  const { error: updErr } = await admin.from("subscriptions").update(update).eq("id", subRow.id);
  if (updErr) return { status: "failed", reason: "db_update_failed", details: { error: updErr.message } };

  await admin.from("subscription_events").insert({
    subscription_id: subRow.id,
    event_type: evtType,
    metadata: { provider: evt.provider, provider_event_id: evt.providerEventId },
  });

  await writeAudit(admin, "subscription", `subscription.${evtType}`, "subscriptions", subRow.id, subRow.company_id,
    { provider: evt.provider, next_period_end: nextPeriodEndIso ?? null });

  await notify(admin, cor.user_id ?? null, subRow.company_id, `subscription_${evtType}`,
    `Subscription ${evtType}`, `Your subscription has been ${evtType}.`,
    { subscription_id: subRow.id, provider: evt.provider });

  return { status: "processed", details: { subscription_id: subRow.id, event: evtType } };
}

async function handleInvoicePaid(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation,
): Promise<ProcessOutcome> {
  if (!cor.company_id) return { status: "failed", reason: "unmapped_company_id" };
  if (!cor.invoice_id) return { status: "failed", reason: "unmapped_invoice_id" };

  const { data: inv, error } = await admin
    .from("invoices")
    .select("id, total_cents, amount_paid_cents, company_id")
    .eq("id", cor.invoice_id).eq("company_id", cor.company_id).maybeSingle();
  if (error) return { status: "failed", reason: "db_read_failed", details: { error: error.message } };
  if (!inv) return { status: "failed", reason: "invoice_not_found" };

  const invRow = inv as { id: string; total_cents: number; amount_paid_cents: number; company_id: string };
  const paid = (evt.amountMinor ?? invRow.total_cents) >= invRow.total_cents;
  await admin.from("invoices").update({
    amount_paid_cents: Math.max(invRow.amount_paid_cents, evt.amountMinor ?? invRow.total_cents),
    status: paid ? "paid" : undefined,
    paid_at: paid ? evt.occurredAt : undefined,
  }).eq("id", invRow.id);

  await writeAudit(admin, "billing", "invoice.paid", "invoices", invRow.id, invRow.company_id,
    { provider: evt.provider, amount_minor: evt.amountMinor });
  await notify(admin, cor.user_id ?? null, invRow.company_id, "invoice_paid",
    "Invoice paid", "An invoice has been marked paid.", { invoice_id: invRow.id });
  return { status: "processed", details: { invoice_id: invRow.id } };
}

async function handleInvoiceFailed(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation,
): Promise<ProcessOutcome> {
  if (!cor.company_id) return { status: "failed", reason: "unmapped_company_id" };
  if (!cor.invoice_id) return { status: "failed", reason: "unmapped_invoice_id" };
  await admin.from("invoices").update({ status: "overdue" }).eq("id", cor.invoice_id);
  await writeAudit(admin, "billing", "invoice.failed", "invoices", cor.invoice_id, cor.company_id,
    { provider: evt.provider }, "warning");
  await notify(admin, cor.user_id ?? null, cor.company_id, "invoice_failed",
    "Invoice payment failed", "An invoice payment failed. Please update your billing.",
    { invoice_id: cor.invoice_id });
  return { status: "processed", details: { invoice_id: cor.invoice_id } };
}

async function handleCustomerUpdated(
  admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation,
): Promise<ProcessOutcome> {
  if (!cor.customer_id) return { status: "ignored", reason: "no_local_customer" };
  await writeAudit(admin, "customer", "customer.updated", "customers", cor.customer_id, cor.company_id ?? null,
    { provider: evt.provider });
  return { status: "processed", details: { customer_id: cor.customer_id } };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const HANDLERS: Record<CanonicalEventType,
  (admin: Admin, evt: CanonicalWebhookEvent, cor: Correlation) => Promise<ProcessOutcome>> = {
  "payment.succeeded":     (a, e, c) => handlePaymentSucceeded(a, e, c),
  "payment.failed":        (a, e, c) => handlePaymentFailed(a, e, c),
  "refund.created":        (a, e, c) => handleRefund(a, e, c, false),
  "refund.completed":      (a, e, c) => handleRefund(a, e, c, true),
  "subscription.created":  (a, e, c) => handleSubscriptionEvent(a, e, c),
  "subscription.renewed":  (a, e, c) => handleSubscriptionEvent(a, e, c),
  "subscription.cancelled":(a, e, c) => handleSubscriptionEvent(a, e, c),
  "subscription.expired":  (a, e, c) => handleSubscriptionEvent(a, e, c),
  "invoice.paid":          (a, e, c) => handleInvoicePaid(a, e, c),
  "invoice.failed":        (a, e, c) => handleInvoiceFailed(a, e, c),
  "customer.updated":      (a, e, c) => handleCustomerUpdated(a, e, c),
  "unknown":               async () => ({ status: "ignored", reason: "unknown_event_type" }),
};

/**
 * Process a single event by audit-row id. Loads the event row, dispatches
 * to the correct handler, and updates process_status / attempts /
 * next_attempt_at / last_error / business_result atomically-per-attempt.
 *
 * Returns the final outcome. Safe to call repeatedly — the guard on
 * process_status='received'|'failed' prevents double-processing of
 * already-processed events.
 */
export async function processWebhookEvent(
  eventId: string,
  canonical: CanonicalWebhookEvent,
): Promise<ProcessOutcome> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as Admin;

  // Guard: only process events that are still in-flight (received or failed).
  const { data: existing, error: readErr } = await admin
    .from("payment_webhook_events")
    .select("id, process_status, attempts")
    .eq("id", eventId)
    .maybeSingle();
  if (readErr || !existing) {
    return { status: "failed", reason: "event_row_missing" };
  }
  const row = existing as { id: string; process_status: string; attempts: number };
  if (row.process_status === "processed" || row.process_status === "ignored" || row.process_status === "dead") {
    return { status: row.process_status as ProcessOutcome["status"], reason: "already_terminal" };
  }

  const cor = extractCorrelation(canonical.provider, canonical.raw);
  const handler = HANDLERS[canonical.canonicalType] ?? HANDLERS["unknown"];

  let outcome: ProcessOutcome;
  try {
    outcome = await handler(admin, canonical, cor);
  } catch (e) {
    outcome = { status: "failed", reason: "handler_exception", details: { error: e instanceof Error ? e.message : String(e) } };
  }

  const attempts = row.attempts + 1;
  let finalStatus = outcome.status;
  let nextAttemptAt: string | null = null;
  if (finalStatus === "failed" && attempts >= MAX_ATTEMPTS) {
    finalStatus = "dead"; // dead-letter
  } else if (finalStatus === "failed") {
    const backoff = BACKOFF_SECONDS[Math.min(attempts - 1, BACKOFF_SECONDS.length - 1)];
    nextAttemptAt = new Date(Date.now() + backoff * 1000).toISOString();
  }

  await admin.from("payment_webhook_events").update({
    process_status: finalStatus,
    attempts,
    last_error: outcome.status === "failed" ? (outcome.reason ?? "unknown") : null,
    next_attempt_at: nextAttemptAt,
    processed_at: finalStatus === "processed" || finalStatus === "ignored" ? new Date().toISOString() : null,
    business_result: { outcome, correlation: cor },
  }).eq("id", eventId);

  return { ...outcome, status: finalStatus };
}
