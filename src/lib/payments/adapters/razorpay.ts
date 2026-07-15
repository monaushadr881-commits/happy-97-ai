/**
 * Razorpay adapter — webhook verification + normalization.
 * Signature = HMAC-SHA256(secret, raw_body) hex, in `x-razorpay-signature`.
 * Razorpay does not include a signed timestamp; replay window keys on event id.
 */
import { hmacSha256Hex, timingSafeEqual, isReplay } from "@/lib/webhook-security";
import type {
  PaymentAdapter, RawWebhookRequest, WebhookVerifyOutcome,
  CanonicalWebhookEvent, CanonicalEventType,
} from "../types";

const TOLERANCE_SEC = 300;

const EVENT_MAP: Record<string, CanonicalEventType> = {
  "payment.captured":       "payment.succeeded",
  "payment.authorized":     "payment.succeeded",
  "payment.failed":         "payment.failed",
  "refund.created":         "refund.created",
  "refund.processed":       "refund.completed",
  "subscription.activated": "subscription.created",
  "subscription.charged":   "subscription.renewed",
  "subscription.cancelled": "subscription.cancelled",
  "subscription.completed": "subscription.expired",
  "invoice.paid":           "invoice.paid",
  "invoice.expired":        "invoice.failed",
  "customer.updated":       "customer.updated",
};

export const razorpayAdapter: PaymentAdapter = {
  code: "razorpay",
  capabilities: {
    webhooks: true, checkout: false, refunds: false,
    subscriptions: false, invoices: false, customers: false,
  },

  async verifyWebhook(req: RawWebhookRequest, secret: string): Promise<WebhookVerifyOutcome> {
    const sig = req.headers.get("x-razorpay-signature");
    if (!secret || !req.body || !sig) return { ok: false, reason: "missing", signaturePresent: !!sig, timestampPresent: false };
    const expected = await hmacSha256Hex(secret, req.body);
    if (!timingSafeEqual(expected, sig.toLowerCase())) {
      return { ok: false, reason: "bad_signature", signaturePresent: true, timestampPresent: false };
    }
    let providerEventId: string | null = null;
    try { providerEventId = (JSON.parse(req.body) as { id?: string }).id ?? null; } catch { /* noop */ }
    if (providerEventId && isReplay(`razorpay:${providerEventId}`, TOLERANCE_SEC)) {
      return { ok: false, reason: "replay", signaturePresent: true, timestampPresent: false };
    }
    return { ok: true, providerEventId, signaturePresent: true, timestampPresent: false };
  },

  normalizeEvent(req: RawWebhookRequest): CanonicalWebhookEvent {
    const raw = safeJson(req.body) as Record<string, unknown>;
    const providerEventType = str(raw, "event") ?? "unknown";
    const payload = (raw?.payload as Record<string, { entity?: Record<string, unknown> }> | undefined) ?? {};
    const entity =
      payload.payment?.entity ??
      payload.refund?.entity ??
      payload.subscription?.entity ??
      payload.invoice?.entity ??
      {};
    const amountMinor = num(entity, "amount");
    const currency = (str(entity, "currency") ?? "INR").toUpperCase();
    const createdAt = num(raw, "created_at");
    return {
      provider: "razorpay",
      providerEventId: str(raw, "id") ?? null,
      providerEventType,
      canonicalType: EVENT_MAP[providerEventType] ?? "unknown",
      occurredAt: createdAt ? new Date(createdAt * 1000).toISOString() : new Date().toISOString(),
      currency,
      amountMinor: amountMinor ?? undefined,
      customerRef: str(entity, "customer_id") ?? undefined,
      subscriptionRef: str(entity, "subscription_id") ?? undefined,
      invoiceRef: str(entity, "invoice_id") ?? str(entity, "id") ?? undefined,
      raw,
    };
  },
};

function safeJson(s: string): unknown { try { return JSON.parse(s); } catch { return {}; } }
function str(o: unknown, k: string): string | null {
  const v = (o as Record<string, unknown>)?.[k]; return typeof v === "string" ? v : null;
}
function num(o: unknown, k: string): number | null {
  const v = (o as Record<string, unknown>)?.[k]; return typeof v === "number" ? v : null;
}
