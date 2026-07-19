/**
 * R8 — Server functions for founder/ops visibility & manual recovery.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdapter } from "./registry";
import { processWebhookEvent } from "./business-processor";
import type { CanonicalWebhookEvent, ProviderCode } from "./types";

export interface ProcessorStats {
  total: number;
  received: number;
  processed: number;
  ignored: number;
  failed: number;
  dead: number;
  last_error: string | null;
  last_error_at: string | null;
}

export const getProcessorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProcessorStats> => {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data } = await context.supabase
      .from("payment_webhook_events")
      .select("process_status, last_error, received_at")
      .gte("received_at", since)
      .order("received_at", { ascending: false })
      .limit(1000) as unknown as {
        data: Array<{ process_status: string; last_error: string | null; received_at: string }> | null;
      };
    const rows = data ?? [];
    const stats: ProcessorStats = {
      total: rows.length, received: 0, processed: 0, ignored: 0, failed: 0, dead: 0,
      last_error: null, last_error_at: null,
    };
    for (const r of rows) {
      const key = r.process_status as keyof ProcessorStats;
      if (key in stats && typeof stats[key] === "number") {
        (stats as unknown as Record<string, number>)[key]++;
      }
      if ((r.process_status === "failed" || r.process_status === "dead") && !stats.last_error) {
        stats.last_error = r.last_error;
        stats.last_error_at = r.received_at;
      }
    }
    return stats);

export const reprocessWebhookEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { eventId: string }) => d)
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "reprocessWebhookEvent", source: "api", module: "payments.reprocessWebhookEvent" });
    // Ops-admin gate
    const { data: isOps } = await context.supabase.rpc("is_ops_admin", { _user_id: context.userId });
    if (!isOps) throw new Error("Forbidden: ops admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_webhook_events")
      // metadata carries the raw provider payload digest but not the body;
      // for reprocess we synthesize a canonical event from stored fields.
      .select("*")
      .eq("id", data.eventId)
      .maybeSingle() as unknown as { data: Record<string, unknown> | null; error: { message: string } | null };
    if (error) throw new Error(error.message);
    if (!row) throw new Error("event not found");

    const provider = row.provider as ProviderCode;
    const adapter = getAdapter(provider);
    if (!adapter) throw new Error(`unknown provider: ${provider}`);

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

    return processWebhookEvent(data.eventId, canonical);
  });
