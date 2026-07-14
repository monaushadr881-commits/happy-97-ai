/**
 * HAPPY X — Enterprise Intelligence Runtime v2 (Reserved).
 * Phase 2.12. Decision / recommendation / forecast / risk / opportunity
 * / executive summary runtime for the single Digital Human.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { intelligenceRuntimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiIrStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceRuntimeService.runtimeStatus(svc(context))));
export const apiIrDecide = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceRuntimeService.decide(svc(context), data)));
export const apiIrRecommend = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceRuntimeService.recommend(svc(context), data)));
export const apiIrForecast = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceRuntimeService.forecast(svc(context), data)));
export const apiIrAnalyzeRisk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceRuntimeService.analyzeRisk(svc(context), data)));
export const apiIrOpportunities = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceRuntimeService.opportunities(svc(context))));
export const apiIrExecutiveSummary = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceRuntimeService.executiveSummary(svc(context))));
export const apiIrInsights = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceRuntimeService.insights(svc(context))));
export const apiIrOptimize = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceRuntimeService.optimize(svc(context), data)));
export const apiIrTrends = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceRuntimeService.trends(svc(context))));
export const apiIrPriority = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => intelligenceRuntimeService.priority(svc(context), data)));
export const apiIrAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => intelligenceRuntimeService.analytics(svc(context))));
