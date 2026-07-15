/**
 * Paddle Billing (v2) adapter — webhook verification + normalization.
 * Header `paddle-signature: ts=<unix>;h1=<hex>`.
 * Signed payload = `${ts}:${raw_body}`.
 */
import { hmacSha256Hex, timingSafeEqual, isReplay } from "@/lib/webhook-security";
import type {
  PaymentAdapter, RawWebhookRequest, WebhookVerifyOutcome,
  CanonicalWebhookEvent, CanonicalEventType,
} from "../types";

const TOLERANCE_SEC = 300;

function parsePaddleSig(h: string | null): { ts?: number; h1?: string } {
  if (!h) return {};
  const out: { ts?: number; h1?: string } = {};
  for (const part of h.split(";")) {
    const [k, v] = part.split("=", 2);
    if (k === "ts" && v) out.ts = Number(v);
    if (k === "h1" && v) out.h1 = v;
  }
  return out;
}

const EVENT_MAP: Record<string, CanonicalEventType> = {
  "transaction.completed":  "payment.succeeded",
  "transaction.payment_failed": "payment.failed",
  "adjustment.created":     "refund.created",
  "adjustment.updated":     "refund.completed",
  "subscription.created":   "subscription.created",
  "subscription.updated":   "subscription.renewed",
  "subscription.canceled":  "subscription.cancelled",
  "subscription.past_due":  "subscription.expired",
  "invoice.paid":           "invoice.paid",
  "invoice.past_due":       "invoice.failed",
  "customer.updated":       "customer.updated",
};

export const paddleAdapter: PaymentAdapter = {
  code: "paddle",
  capabilities: {
    webhooks: true, checkout: false, refunds: false,
    subscriptions: false, invoices: false, customers: false,
  },

  async verifyWebhook(req: RawWebhookRequest, secret: string): Promise<WebhookVerifyOutcome> {
    const header = req.headers.get("paddle-signature");
    const { ts, h1 } = parsePaddleSig(header);
    if (!secret || !req.body) return { ok: false, reason: "missing", signaturePresent: !!h1, timestampPresent: !!ts };
    if (!h1 || !ts)           return { ok: false, reason: "missing", signaturePresent: !!h1, timestampPresent: !!ts };
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > TOLERANCE_SEC) return { ok: false, reason: "expired", signaturePresent: true, timestampPresent: true };
    const expected = await hmacSha256Hex(secret, `${ts}:${req.body}`);
    if (!timingSafeEqual(expected, h1.toLowerCase())) {
      return { ok: false, reason: "bad_signature", signaturePresent: true, timestampPresent: true };
    }
    let providerEventId: string | null = null;
    try { providerEventId = (JSON.parse(req.body) as { event_id?: string }).event_id ?? null; } catch { /* noop */ }
    if (providerEventId && isReplay(`paddle:${providerEventId}`, TOLERANCE_SEC)) {
      return { ok: false, reason: "replay", signaturePresent: true, timestampPresent: true };
    }
    return { ok: true, providerEventId, signaturePresent: true, timestampPresent: true };
  },

  normalizeEvent(req: RawWebhookRequest): CanonicalWebhookEvent {
    const raw = safeJson(req.body) as Record<string, unknown>;
    const providerEventType = str(raw, "event_type") ?? "unknown";
    const data = (raw?.data as Record<string, unknown> | undefined) ?? {};
    const details = (data?.details as Record<string, unknown> | undefined) ?? {};
    const totals = (details?.totals as Record<string, unknown> | undefined) ?? {};
    const amountStr = str(totals, "total") ?? str(data, "total");
    const amountMinor = amountStr ? Number(amountStr) : num(data, "amount");
    const currency = (str(details, "currency_code") ?? str(data, "currency_code") ?? "USD").toUpperCase();
    return {
      provider: "paddle",
      providerEventId: str(raw, "event_id") ?? null,
      providerEventType,
      canonicalType: EVENT_MAP[providerEventType] ?? "unknown",
      occurredAt: str(raw, "occurred_at") ?? new Date().toISOString(),
      currency,
      amountMinor: Number.isFinite(amountMinor) ? (amountMinor as number) : undefined,
      customerRef: str(data, "customer_id") ?? undefined,
      subscriptionRef: str(data, "subscription_id") ?? str(data, "id") ?? undefined,
      invoiceRef: str(data, "invoice_id") ?? undefined,
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
