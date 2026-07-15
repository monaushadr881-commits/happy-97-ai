/**
 * Cashfree (PG v3) adapter — webhook verification + normalization.
 * Signature = base64( HMAC-SHA256(secret, `${x-webhook-timestamp}${rawBody}`) )
 * Headers: `x-webhook-signature`, `x-webhook-timestamp`.
 */
import { isReplay } from "@/lib/webhook-security";
import type {
  PaymentAdapter, RawWebhookRequest, WebhookVerifyOutcome,
  CanonicalWebhookEvent, CanonicalEventType,
} from "../types";

const TOLERANCE_SEC = 300;
const encoder = new TextEncoder();

async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  let bin = ""; const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function ctEqBase64(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const EVENT_MAP: Record<string, CanonicalEventType> = {
  "PAYMENT_SUCCESS_WEBHOOK":   "payment.succeeded",
  "PAYMENT_FAILED_WEBHOOK":    "payment.failed",
  "PAYMENT_USER_DROPPED_WEBHOOK": "payment.failed",
  "REFUND_STATUS_WEBHOOK":     "refund.completed",
  "SUBSCRIPTION_CREATED":      "subscription.created",
  "SUBSCRIPTION_ACTIVATED":    "subscription.created",
  "SUBSCRIPTION_PAYMENT_SUCCESS": "subscription.renewed",
  "SUBSCRIPTION_CANCELLED":    "subscription.cancelled",
  "SUBSCRIPTION_COMPLETED":    "subscription.expired",
};

export const cashfreeAdapter: PaymentAdapter = {
  code: "cashfree",
  capabilities: {
    webhooks: true, checkout: false, refunds: false,
    subscriptions: false, invoices: false, customers: false,
  },

  async verifyWebhook(req: RawWebhookRequest, secret: string): Promise<WebhookVerifyOutcome> {
    const sig = req.headers.get("x-webhook-signature");
    const tsHeader = req.headers.get("x-webhook-timestamp");
    if (!secret || !req.body || !sig || !tsHeader) {
      return { ok: false, reason: "missing", signaturePresent: !!sig, timestampPresent: !!tsHeader };
    }
    const tsSec = Math.floor(Number(tsHeader) / 1000);
    if (!Number.isFinite(tsSec)) return { ok: false, reason: "missing", signaturePresent: true, timestampPresent: true };
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - tsSec) > TOLERANCE_SEC) return { ok: false, reason: "expired", signaturePresent: true, timestampPresent: true };
    const expected = await hmacSha256Base64(secret, `${tsHeader}${req.body}`);
    if (!ctEqBase64(expected, sig)) return { ok: false, reason: "bad_signature", signaturePresent: true, timestampPresent: true };
    let providerEventId: string | null = null;
    try {
      const j = JSON.parse(req.body) as { data?: { payment?: { cf_payment_id?: string | number } } };
      const id = j?.data?.payment?.cf_payment_id;
      if (id !== undefined) providerEventId = String(id);
    } catch { /* noop */ }
    if (providerEventId && isReplay(`cashfree:${providerEventId}`, TOLERANCE_SEC)) {
      return { ok: false, reason: "replay", signaturePresent: true, timestampPresent: true };
    }
    return { ok: true, providerEventId, signaturePresent: true, timestampPresent: true };
  },

  normalizeEvent(req: RawWebhookRequest): CanonicalWebhookEvent {
    const raw = safeJson(req.body) as Record<string, unknown>;
    const providerEventType = str(raw, "type") ?? "unknown";
    const data = (raw?.data as Record<string, unknown> | undefined) ?? {};
    const payment = (data?.payment as Record<string, unknown> | undefined) ?? {};
    const order = (data?.order as Record<string, unknown> | undefined) ?? {};
    const amount = num(payment, "payment_amount") ?? num(order, "order_amount");
    const amountMinor = amount !== null ? Math.round(amount * 100) : undefined;
    const currency = (str(payment, "payment_currency") ?? str(order, "order_currency") ?? "INR").toUpperCase();
    return {
      provider: "cashfree",
      providerEventId: str(payment, "cf_payment_id") ?? null,
      providerEventType,
      canonicalType: EVENT_MAP[providerEventType] ?? "unknown",
      occurredAt: str(raw, "event_time") ?? new Date().toISOString(),
      currency,
      amountMinor,
      customerRef: str((data?.customer_details as Record<string, unknown> | undefined) ?? {}, "customer_id") ?? undefined,
      invoiceRef: str(order, "order_id") ?? undefined,
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
