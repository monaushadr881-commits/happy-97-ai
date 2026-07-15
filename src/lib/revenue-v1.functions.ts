/**
 * HAPPY X — Revenue Cloud server functions.
 *
 * Thin RPC wrappers over revenueService. Every fn requires an authenticated
 * Supabase session (RLS scopes rows to the caller's companies).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { revenueService } from "@/services";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const revOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => revenueService.overview(svc(context))));

export const revTimeseries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { days?: number })
  .handler(async ({ data, context }) =>
    guard(() => revenueService.revenueTimeseries(svc(context), data?.days ?? 30)));

export const revListInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i ?? {})
  .handler(async ({ data, context }) => guard(() => revenueService.listInvoices(svc(context), data)));

export const revInvoiceDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => guard(() => revenueService.invoiceDetail(svc(context), data.id)));

export const revListPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i ?? {})
  .handler(async ({ data, context }) => guard(() => revenueService.listPayments(svc(context), data)));
