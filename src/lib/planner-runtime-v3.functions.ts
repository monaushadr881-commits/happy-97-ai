/**
 * HAPPY X — Planner Runtime v3 (Phase 3.7).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { plannerEngineService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiPlannerPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Parameters<typeof plannerEngineService.plan>[1])
  .handler(async ({ data, context }) => guard(() => plannerEngineService.plan(svc(context), data)));
export const apiPlannerGoals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => plannerEngineService.goals(svc(context))));
export const apiPlannerDependencies = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => plannerEngineService.dependencies(svc(context), data)));
export const apiPlannerRisk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => plannerEngineService.assessRisk(svc(context), data)));
export const apiPlannerPrioritise = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => plannerEngineService.prioritise(svc(context), data)));
export const apiPlannerScenarios = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => plannerEngineService.scenarios(svc(context), data)));
export const apiPlannerMilestones = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => plannerEngineService.milestones(svc(context), data)));
export const apiPlannerTimeline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => plannerEngineService.timeline(svc(context), data)));
export const apiPlannerRisks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => plannerEngineService.risks(svc(context))));
export const apiPlannerAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => plannerEngineService.analytics(svc(context))));
