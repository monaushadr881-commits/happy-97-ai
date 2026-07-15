/**
 * HAPPY — Payment Provider Abstraction (R7)
 *
 * One canonical contract every provider adapter (Stripe, Razorpay, Paddle,
 * Cashfree, PayPal, future) must implement. Provider-specific quirks live
 * INSIDE each adapter — never leak into business logic.
 *
 * Adapter surface is intentionally minimal in R7:
 *   - webhook verification + event normalization (WORKING)
 *   - checkout/refund/subscription create/etc. surfaces declared as
 *     capability flags so callers can degrade gracefully. Real charge
 *     paths land per-provider once its keys/SDK are attached.
 */

export type ProviderCode =
  | "stripe" | "razorpay" | "paddle" | "cashfree" | "paypal" | "manual";

/** Canonical webhook event types across all providers. */
export type CanonicalEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "refund.created"
  | "refund.completed"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "subscription.expired"
  | "invoice.paid"
  | "invoice.failed"
  | "customer.updated"
  | "unknown";

export interface CanonicalWebhookEvent {
  provider: ProviderCode;
  providerEventId: string | null;
  providerEventType: string;
  canonicalType: CanonicalEventType;
  occurredAt: string; // ISO
  /** Currency in ISO 4217, uppercase. */
  currency?: string;
  /** Amount in the smallest currency unit (cents/paise). */
  amountMinor?: number;
  /** Provider's customer identifier when present. */
  customerRef?: string;
  /** Provider's subscription identifier when present. */
  subscriptionRef?: string;
  /** Provider's invoice identifier when present. */
  invoiceRef?: string;
  /** Raw payload (redacted of secrets by adapter if needed). */
  raw: unknown;
}

export interface RawWebhookRequest {
  headers: Headers;
  body: string;
}

export type WebhookVerifyOutcome =
  | { ok: true; providerEventId: string | null; signaturePresent: true; timestampPresent: boolean }
  | { ok: false; reason: "bad_signature" | "expired" | "replay" | "missing" | "error"; signaturePresent: boolean; timestampPresent: boolean };

export interface PaymentAdapter {
  readonly code: ProviderCode;
  /** Provider capabilities implemented in this adapter. Callers must check. */
  readonly capabilities: {
    webhooks: boolean;
    checkout: boolean;
    refunds: boolean;
    subscriptions: boolean;
    invoices: boolean;
    customers: boolean;
  };
  /** Verify HMAC + timestamp + replay for an inbound webhook. */
  verifyWebhook(req: RawWebhookRequest, secret: string): Promise<WebhookVerifyOutcome>;
  /** Parse the raw body into a canonical event. Called only after verify.ok. */
  normalizeEvent(req: RawWebhookRequest): CanonicalWebhookEvent;
}
