/**
 * Payment provider registry. Central factory. No business logic here —
 * business logic lives in adapters (verify/normalize) or in the webhook
 * runtime (persist canonical event).
 */
import type { PaymentAdapter, ProviderCode } from "./types";
import { stripeAdapter } from "./adapters/stripe";
import { razorpayAdapter } from "./adapters/razorpay";
import { paddleAdapter } from "./adapters/paddle";
import { cashfreeAdapter } from "./adapters/cashfree";

const REGISTRY: Partial<Record<ProviderCode, PaymentAdapter>> = {
  stripe: stripeAdapter,
  razorpay: razorpayAdapter,
  paddle: paddleAdapter,
  cashfree: cashfreeAdapter,
  // paypal: reserved — adapter not implemented yet.
};

export function getAdapter(code: string): PaymentAdapter | null {
  if (!code) return null;
  return REGISTRY[code as ProviderCode] ?? null;
}

export function listProviders(): Array<{
  code: ProviderCode;
  capabilities: PaymentAdapter["capabilities"];
  hasSecret: boolean;
}> {
  const entries = Object.entries(REGISTRY) as Array<[ProviderCode, PaymentAdapter]>;
  return entries.map(([code, adapter]) => ({
    code,
    capabilities: adapter.capabilities,
    hasSecret: Boolean(getWebhookSecret(code)),
  }));
}

/** Per-provider webhook secret env-var lookup. Handler-only usage. */
export function getWebhookSecret(code: ProviderCode): string | undefined {
  switch (code) {
    case "stripe":   return process.env.STRIPE_WEBHOOK_SECRET;
    case "razorpay": return process.env.RAZORPAY_WEBHOOK_SECRET;
    case "paddle":   return process.env.PADDLE_WEBHOOK_SECRET;
    case "cashfree": return process.env.CASHFREE_WEBHOOK_SECRET;
    default:         return undefined;
  }
}
