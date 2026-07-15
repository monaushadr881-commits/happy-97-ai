/**
 * Founder / ops read surface for webhook health.
 * Reads real rows from `payment_webhook_events`. Returns typed summaries.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listProviders } from "./registry";
import type { ProviderCode } from "./types";

export interface WebhookHealthProvider {
  code: ProviderCode;
  hasSecret: boolean;
  capabilities: Record<string, boolean>;
  last24h: {
    total: number;
    verified: number;
    badSignature: number;
    replay: number;
    expired: number;
    missing: number;
    failed: number;
  };
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
}

export const getWebhookHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ providers: WebhookHealthProvider[] }> => {
    const providers = listProviders();
    const sb = context.supabase;
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const out: WebhookHealthProvider[] = [];
    for (const p of providers) {
      // Ops-admin RLS applies. Non-admins get empty rows — that's the correct
      // signal to render "Not available".
      const { data: rows } = await sb
        .from("payment_webhook_events")
        // typed schema may lag migration; cast the response
        .select("verify_result,error_reason,received_at,http_status")
        .eq("provider", p.code)
        .gte("received_at", since)
        .order("received_at", { ascending: false })
        .limit(500) as unknown as { data: Array<{
          verify_result: string;
          error_reason: string | null;
          received_at: string;
          http_status: number;
        }> | null };

      const list = rows ?? [];
      let verified = 0, bad = 0, replay = 0, expired = 0, missing = 0, failed = 0;
      let lastSuccessAt: string | null = null;
      let lastFailureAt: string | null = null;
      let lastFailureReason: string | null = null;
      for (const r of list) {
        switch (r.verify_result) {
          case "verified":     verified++; lastSuccessAt ??= r.received_at; break;
          case "bad_signature":bad++; break;
          case "replay":       replay++; break;
          case "expired":      expired++; break;
          case "missing":      missing++; break;
          default:             failed++; break;
        }
        if (r.verify_result !== "verified" && !lastFailureAt) {
          lastFailureAt = r.received_at;
          lastFailureReason = r.error_reason ?? r.verify_result;
        }
      }
      out.push({
        code: p.code,
        hasSecret: p.hasSecret,
        capabilities: p.capabilities as unknown as Record<string, boolean>,
        last24h: { total: list.length, verified, badSignature: bad, replay, expired, missing, failed },
        lastSuccessAt, lastFailureAt, lastFailureReason,
      });
    }
    return { providers: out };
  });
