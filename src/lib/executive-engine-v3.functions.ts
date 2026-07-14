/**
 * HAPPY X — Executive Engine v3 (Phase 3.10).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { executiveEngineService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiExecEngineAdvisor = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Parameters<typeof executiveEngineService.advisor>[1])
  .handler(async ({ data, context }) => guard(() => executiveEngineService.advisor(svc(context), data)));
export const apiExecEngineForecast = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { metric?: string; horizonDays?: number })
  .handler(async ({ data, context }) => guard(() => executiveEngineService.forecast(svc(context), data)));
export const apiExecEngineOpportunities = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executiveEngineService.opportunities(svc(context))));
export const apiExecEngineRisks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executiveEngineService.risks(svc(context))));
export const apiExecEngineDecide = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Parameters<typeof executiveEngineService.decide>[1])
  .handler(async ({ data, context }) => guard(() => executiveEngineService.decide(svc(context), data)));
export const apiExecEngineRecommend = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executiveEngineService.recommend(svc(context))));
export const apiExecEngineAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executiveEngineService.analytics(svc(context))));
