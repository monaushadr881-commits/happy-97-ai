/**
 * HAPPY X — Enterprise Intelligence 2.0 (Reserved).
 * Phase 2.16. Executive advisor, forecasts, revenue/market/customer/ops/
 * manufacturing/learning intelligence, AI insights, recommendations.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { enterpriseIntelligenceV2Service } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiEiAdvisor = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => enterpriseIntelligenceV2Service.advisor(svc(context), data)));
export const apiEiForecast = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => enterpriseIntelligenceV2Service.forecast(svc(context), data)));
export const apiEiRevenue = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.revenue(svc(context))));
export const apiEiMarket = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.market(svc(context))));
export const apiEiCustomer = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.customer(svc(context))));
export const apiEiOperations = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.operations(svc(context))));
export const apiEiManufacturing = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.manufacturing(svc(context))));
export const apiEiLearning = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.learning(svc(context))));
export const apiEiInsights = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => enterpriseIntelligenceV2Service.insights(svc(context))));
export const apiEiRecommend = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => enterpriseIntelligenceV2Service.recommend(svc(context), data)));
