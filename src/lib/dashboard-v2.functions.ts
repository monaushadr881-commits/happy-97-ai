/**
 * HAPPY X — Unified Intelligence Dashboard v2 (Reserved).
 * Phase 2.16. Executive overview, agent/memory/decision/workflow/plugin
 * health, developer metrics, enterprise KPIs, forecast + recommendation feeds.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { dashboardService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiDashOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.overview(svc(context))));
export const apiDashLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.live(svc(context))));
export const apiDashExecutive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.executive(svc(context))));
export const apiDashAgentActivity = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.agentActivity(svc(context))));
export const apiDashMemoryUsage = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.memoryUsage(svc(context))));
export const apiDashDecisionInsights = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.decisionInsights(svc(context))));
export const apiDashWorkflowHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.workflowHealth(svc(context))));
export const apiDashPluginHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.pluginHealth(svc(context))));
export const apiDashDeveloperMetrics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.developerMetrics(svc(context))));
export const apiDashEnterpriseKpis = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.enterpriseKpis(svc(context))));
export const apiDashForecastSummary = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.forecastSummary(svc(context))));
export const apiDashRecommendationFeed = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dashboardService.recommendationFeed(svc(context))));
