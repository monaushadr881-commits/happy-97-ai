/**
 * HAPPY — Payment Retry Poller (R8)
 *
 * URL: POST /api/public/cron/payments-retry
 * Auth: Supabase anon apikey header (matches schedule-jobs pattern).
 *
 * Picks up to 25 `payment_webhook_events` rows whose:
 *   - process_status = 'failed'
 *   - next_attempt_at <= now()
 * and re-dispatches them through the business processor. Terminal
 * outcomes (processed/ignored/dead) short-circuit inside the processor,
 * so this endpoint is safe to invoke on any schedule.
 *
 * Wire from pg_cron with:
 *   SELECT cron.schedule('happy-payment-retry','* * * * *',$$
 *     SELECT net.http_post(
 *       url:='https://<host>/api/public/cron/payments-retry',
 *       headers:='{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
 *       body:='{}'::jsonb);
 *   $$);
 */
import { createFileRoute } from "@tanstack/react-router";
import { processWebhookEvent } from "@/lib/payments/business-processor";
import { getAdapter } from "@/lib/payments/registry";
import type { CanonicalWebhookEvent, ProviderCode } from "@/lib/payments/types";

const BATCH = 25;

async function pollAndReprocess(): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payment_webhook_events")
    .select("*")
    .eq("process_status", "failed")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(BATCH) as unknown as { data: Record<string, unknown>[] | null; error: { message: string } | null };
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
  const rows = data ?? [];
  const results: Array<{ id: string; status: string; reason?: string }> = [];
  for (const row of rows) {
    const provider = row.provider as ProviderCode;
    if (!getAdapter(provider)) { results.push({ id: row.id as string, status: "skipped", reason: "no_adapter" }); continue; }
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const canonical: CanonicalWebhookEvent = {
      provider,
      providerEventId: (row.provider_event_id as string | null) ?? null,
      providerEventType: row.event_type as string,
      canonicalType: (row.canonical_type as CanonicalWebhookEvent["canonicalType"]) ?? "unknown",
      occurredAt: (meta.occurred_at as string) ?? new Date().toISOString(),
      currency: (meta.currency as string | undefined) ?? undefined,
      amountMinor: (meta.amount_minor as number | undefined) ?? undefined,
      customerRef: (meta.customer_ref as string | undefined) ?? undefined,
      subscriptionRef: (meta.subscription_ref as string | undefined) ?? undefined,
      invoiceRef: (meta.invoice_ref as string | undefined) ?? undefined,
      raw: meta.raw ?? {},
    };
    try {
      const out = await processWebhookEvent(row.id as string, canonical);
      results.push({ id: row.id as string, status: out.status, reason: out.reason });
    } catch (e) {
      results.push({ id: row.id as string, status: "error", reason: e instanceof Error ? e.message : "unknown" });
    }
  }
  return new Response(JSON.stringify({ ok: true, picked: rows.length, results }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/cron/payments-retry")({
  server: {
    handlers: {
      GET: async () => pollAndReprocess(),
      POST: async () => pollAndReprocess(),
    },
  },
});
