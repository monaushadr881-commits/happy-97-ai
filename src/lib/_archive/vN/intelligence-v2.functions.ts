/**
 * HAPPY X — Enterprise Intelligence v2 (Reserved). Phase 2.8.
 * Does not modify the v3.0 reserved intelligenceService in api-v2.functions.ts.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { intelligenceV2Service } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiIntelExecutive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.executive(svc(context))));
export const apiIntelForecast = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceV2Service.forecast(svc(context), data)));
export const apiIntelTrends = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.trends(svc(context))));
export const apiIntelRisks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.risks(svc(context))));
export const apiIntelOpportunities = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.opportunities(svc(context))));
export const apiIntelReports = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.reports(svc(context))));
export const apiIntelInsights = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.insights(svc(context))));
export const apiIntelSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceV2Service.settings(svc(context))));
export const apiIntelUpdateSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceV2Service.updateSettings(svc(context), data)));
