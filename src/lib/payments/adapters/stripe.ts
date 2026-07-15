/**
 * Stripe adapter — webhook verification + event normalization.
 * Charge/refund/subscription SDK calls are not implemented in R7
 * (BLOCKED on Stripe secret key + SDK selection).
 */
import { hmacSha256Hex, timingSafeEqual, isReplay } from "@/lib/webhook-security";
import type {
  PaymentAdapter, RawWebhookRequest, WebhookVerifyOutcome,
  CanonicalWebhookEvent, CanonicalEventType,
} from "../types";

const TOLERANCE_SEC = 300;

// Stripe header: `t=<unix>,v1=<hex>,v0=<hex>`
function parseStripeSignature(header: string | null): { t?: number; v1?: string } {
  if (!header) return {};
  const out: { t?: number; v1?: string } = {};
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t" && v) out.t = Number(v);
    if (k === "v1" && v) out.v1 = v;
  }
  return out;
}

const EVENT_MAP: Record<string, CanonicalEventType> = {
  "payment_intent.succeeded": "payment.succeeded",
  "charge.succeeded":          "payment.succeeded",
  "payment_intent.payment_failed": "payment.failed",
  "charge.failed":             "payment.failed",
  "charge.refunded":           "refund.completed",
  "refund.created":            "refund.created",
  "refund.updated":            "refund.completed",
  "customer.subscription.created": "subscription.created",
  "customer.subscription.updated": "subscription.renewed",
  "customer.subscription.deleted": "subscription.cancelled",
  "invoice.paid":              "invoice.paid",
  "invoice.payment_failed":    "invoice.failed",
  "customer.updated":          "customer.updated",
};

export const stripeAdapter: PaymentAdapter = {
  code: "stripe",
  capabilities: {
    webhooks: true, checkout: false, refunds: false,
    subscriptions: false, invoices: false, customers: false,
  },

  async verifyWebhook(req: RawWebhookRequest, secret: string): Promise<WebhookVerifyOutcome> {
    const header = req.headers.get("stripe-signature");
    const { t, v1 } = parseStripeSignature(header);
    if (!secret || !req.body) return { ok: false, reason: "missing", signaturePresent: !!v1, timestampPresent: !!t };
    if (!v1)                  return { ok: false, reason: "missing", signaturePresent: false,  timestampPresent: !!t };
    if (t !== undefined) {
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - t) > TOLERANCE_SEC) return { ok: false, reason: "expired", signaturePresent: true, timestampPresent: true };
    }
    const signed = t !== undefined ? `${t}.${req.body}` : req.body;
    const expected = await hmacSha256Hex(secret, signed);
    if (!timingSafeEqual(expected, v1.toLowerCase())) {
      return { ok: false, reason: "bad_signature", signaturePresent: true, timestampPresent: !!t };
    }
    let providerEventId: string | null = null;
    try { providerEventId = (JSON.parse(req.body) as { id?: string }).id ?? null; } catch { /* noop */ }
    if (providerEventId && isReplay(`stripe:${providerEventId}`, TOLERANCE_SEC)) {
      return { ok: false, reason: "replay", signaturePresent: true, timestampPresent: !!t };
    }
    return { ok: true, providerEventId, signaturePresent: true, timestampPresent: !!t };
  },

  normalizeEvent(req: RawWebhookRequest): CanonicalWebhookEvent {
    const raw = safeJson(req.body);
    const providerEventType = str(raw, "type") ?? "unknown";
    const data = (raw as { data?: { object?: Record<string, unknown> } })?.data?.object ?? {};
    const amountMinor = num(data, "amount") ?? num(data, "amount_paid");
    const currency = (str(data, "currency") ?? "usd").toUpperCase();
    const occurredAt = num(raw, "created")
      ? new Date(num(raw, "created")! * 1000).toISOString()
      : new Date().toISOString();
    return {
      provider: "stripe",
      providerEventId: str(raw, "id") ?? null,
      providerEventType,
      canonicalType: EVENT_MAP[providerEventType] ?? "unknown",
      occurredAt,
      currency,
      amountMinor: amountMinor ?? undefined,
      customerRef: str(data, "customer") ?? undefined,
      subscriptionRef: str(data, "subscription") ?? undefined,
      invoiceRef: str(data, "invoice") ?? str(data, "id") ?? undefined,
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
