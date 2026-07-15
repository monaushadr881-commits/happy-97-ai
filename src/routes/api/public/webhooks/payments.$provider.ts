/**
 * HAPPY — Public payment webhook route (R7)
 *
 * URL: /api/public/webhooks/payments/:provider
 *
 * Contract for every provider (dispatched via adapter registry):
 *   1. Read raw body (bytes-exact — never JSON.parse before verify).
 *   2. Adapter verifies HMAC + timestamp window + replay guard.
 *   3. On verify failure: record audit row + return 4xx. No processing.
 *   4. On verify success: normalize event, upsert audit row (unique on
 *      provider_event_id), respond 200 immediately (provider retries on
 *      non-2xx). Downstream processors read `payment_webhook_events`.
 *
 * NOTE: Business processing (activate subscription, credit wallet,
 * settle invoice) is P0.4/P1.5 and lands with the per-provider charge
 * SDKs. R7 delivers only the secure ingest + audit trail.
 */
import { createFileRoute } from "@tanstack/react-router";
import { getAdapter, getWebhookSecret } from "@/lib/payments/registry";
import type { PaymentAdapter } from "@/lib/payments/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Stripe-Signature, X-Razorpay-Signature, Paddle-Signature, X-Webhook-Signature, X-Webhook-Timestamp",
  "Access-Control-Max-Age": "86400",
} as const;

async function digestHex(body: string): Promise<string> {
  const enc = new TextEncoder().encode(body);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  let hex = ""; for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

interface AuditRow {
  provider: string;
  provider_event_id: string | null;
  event_type: string;
  canonical_type: string | null;
  verify_result: "verified" | "bad_signature" | "expired" | "replay" | "missing" | "error";
  process_status: "received" | "processed" | "ignored" | "failed";
  http_status: number;
  latency_ms: number;
  signature_present: boolean;
  timestamp_present: boolean;
  payload_digest: string | null;
  error_reason: string | null;
  metadata: Record<string, unknown>;
}

async function record(row: AuditRow): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payment_webhook_events")
      .insert(row as never)
      .select("id")
      .single();
    if (error) {
      if (!/duplicate key/i.test(error.message)) {
        console.error("[webhook] audit insert failed", error.message);
      }
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (e) {
    console.error("[webhook] audit exception", e instanceof Error ? e.message : e);
    return null;
  }
}

async function handle(provider: string, request: Request): Promise<Response> {
  const started = Date.now();
  const respond = (status: number, msg: string, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify({ ok: status < 400, message: msg }), {
      status, headers: { "Content-Type": "application/json", ...CORS, ...extra },
    });

  const adapter: PaymentAdapter | null = getAdapter(provider);
  if (!adapter) return respond(404, `unknown provider: ${provider}`);

  const secret = getWebhookSecret(adapter.code);
  const body = await request.text();
  const payloadDigest = body ? await digestHex(body) : null;

  if (!secret) {
    // No secret configured → we can't verify. Never accept in production.
    await record({
      provider: adapter.code, provider_event_id: null, event_type: "unknown",
      canonical_type: null, verify_result: "missing", process_status: "ignored",
      http_status: 503, latency_ms: Date.now() - started,
      signature_present: false, timestamp_present: false,
      payload_digest: payloadDigest, error_reason: "webhook_secret_not_configured",
      metadata: {},
    });
    return respond(503, "webhook secret not configured");
  }

  const verify = await adapter.verifyWebhook({ headers: request.headers, body }, secret);
  if (!verify.ok) {
    const httpStatus =
      verify.reason === "expired" ? 408 :
      verify.reason === "replay"  ? 409 :
      verify.reason === "missing" ? 400 : 401;
    await record({
      provider: adapter.code, provider_event_id: null, event_type: "unknown",
      canonical_type: null, verify_result: verify.reason, process_status: "failed",
      http_status: httpStatus, latency_ms: Date.now() - started,
      signature_present: verify.signaturePresent, timestamp_present: verify.timestampPresent,
      payload_digest: payloadDigest, error_reason: verify.reason,
      metadata: {},
    });
    return respond(httpStatus, `verification failed: ${verify.reason}`);
  }

  // Verified. Normalize + persist. Business processing is P0.4/P1.5.
  let evt: ReturnType<PaymentAdapter["normalizeEvent"]>;
  try {
    evt = adapter.normalizeEvent({ headers: request.headers, body });
  } catch (e) {
    await record({
      provider: adapter.code, provider_event_id: verify.providerEventId, event_type: "unknown",
      canonical_type: null, verify_result: "verified", process_status: "failed",
      http_status: 500, latency_ms: Date.now() - started,
      signature_present: true, timestamp_present: verify.timestampPresent,
      payload_digest: payloadDigest, error_reason: e instanceof Error ? e.message : "normalize_error",
      metadata: {},
    });
    return respond(500, "normalize failed");
  }

  const eventId = await record({
    provider: adapter.code,
    provider_event_id: evt.providerEventId,
    event_type: evt.providerEventType,
    canonical_type: evt.canonicalType,
    verify_result: "verified",
    process_status: evt.canonicalType === "unknown" ? "ignored" : "received",
    http_status: 200,
    latency_ms: Date.now() - started,
    signature_present: true,
    timestamp_present: verify.timestampPresent,
    payload_digest: payloadDigest,
    error_reason: null,
    metadata: {
      occurred_at: evt.occurredAt,
      currency: evt.currency ?? null,
      amount_minor: evt.amountMinor ?? null,
      customer_ref: evt.customerRef ?? null,
      subscription_ref: evt.subscriptionRef ?? null,
      invoice_ref: evt.invoiceRef ?? null,
      raw: evt.raw ?? null,
    },
  });

  // R8: dispatch business processing inline. Failures are captured in
  // process_status/last_error and re-tried by the retry endpoint — we
  // still ACK 200 to the provider so it doesn't re-send the same event.
  if (eventId && evt.canonicalType !== "unknown") {
    try {
      const { processWebhookEvent } = await import("@/lib/payments/business-processor");
      await processWebhookEvent(eventId, evt);
    } catch (e) {
      console.error("[webhook] processor exception", e instanceof Error ? e.message : e);
    }
  }

  return respond(200, "ok");
}

export const Route = createFileRoute("/api/public/webhooks/payments/$provider")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request, params }) => handle(String(params.provider), request),
    },
  },
});
