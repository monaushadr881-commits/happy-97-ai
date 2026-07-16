/**
 * Payment provider adapters. These do NOT create a second wallet or ledger —
 * they translate provider events into the existing HAPPY wallet/credits/pricing
 * runtime (billing-v4/v5, banking-v7). Handlers should call the existing
 * server functions rather than writing directly.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError } from "../types";

export interface PaymentIntentRequest { amountMinor: number; currency: string; userId: string; metadata?: Record<string, string>; }
export interface PaymentIntentResponse { providerRef: string; clientSecret?: string; redirectUrl?: string; }

export interface PaymentAdapter {
  id: string;
  isConfigured(): boolean;
  createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResponse>;
  verifyWebhook(rawBody: string, headers: Record<string, string>): Promise<{ event: string; providerRef: string; status: "succeeded" | "failed" | "pending"; }>;
}

function make(id: string, envs: string[]): PaymentAdapter {
  return {
    id,
    isConfigured: () => checkEnv(envs).configured,
    async createIntent() {
      const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
      throw new Error(`${id}: provider SDK/API call not wired; add via server function`);
    },
    async verifyWebhook() {
      const c = checkEnv(envs); if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
      throw new Error(`${id}: signature verification requires provider secret + raw body`);
    },
  };
}

export const razorpay = make("payments.razorpay", ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]);
export const stripe = make("payments.stripe", ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
export const phonepe = make("payments.phonepe", ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX"]);
export const paytm = make("payments.paytm", ["PAYTM_MERCHANT_ID", "PAYTM_MERCHANT_KEY"]);
export const googlePay = make("payments.google_pay", ["GOOGLE_PAY_MERCHANT_ID"]);
export const upi = make("payments.upi", ["UPI_VPA", "UPI_MERCHANT_NAME"]);

export const registry: Record<string, PaymentAdapter> = { razorpay, stripe, phonepe, paytm, googlePay, upi };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "payments.razorpay": ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"],
    "payments.stripe": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    "payments.phonepe": ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX"],
    "payments.paytm": ["PAYTM_MERCHANT_ID", "PAYTM_MERCHANT_KEY"],
    "payments.google_pay": ["GOOGLE_PAY_MERCHANT_ID"],
    "payments.upi": ["UPI_VPA", "UPI_MERCHANT_NAME"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
