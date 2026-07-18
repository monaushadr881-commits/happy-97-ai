/**
 * HAPPY X — Plugin Marketplace extensions v2 (Reserved). Phase 2.10.
 * Reviews, billing, and security surfaces. Registry/lifecycle live in
 * plugin-v2.functions.ts (Phase 2.5) and remain unchanged.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { pluginMarketService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiPluginListReviews = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context }) => guard(() => pluginMarketService.listReviews(svc(context), data)));
export const apiPluginSubmitReview = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => pluginMarketService.submitReview(svc(context), data)));
export const apiPluginBilling = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => pluginMarketService.billing(svc(context))));
export const apiPluginPurchase = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context }) => guard(() => pluginMarketService.purchase(svc(context), data)));
export const apiPluginSecurityReport = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context }) => guard(() => pluginMarketService.securityReport(svc(context), data)));
export const apiPluginMarketManage = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => pluginMarketService.manage(svc(context))));
