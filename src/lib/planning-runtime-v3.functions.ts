/**
 * HAPPY X — Planning Runtime v3 (Reserved). Phase 3.1.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { planningRuntimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiPlanStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => planningRuntimeService.status(svc(context))));
export const apiPlanCreate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => planningRuntimeService.plan(svc(context), data)));
export const apiPlanAnalyzeGoal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => planningRuntimeService.analyzeGoal(svc(context), data)));
export const apiPlanResolveDeps = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => planningRuntimeService.resolveDependencies(svc(context), data)));
export const apiPlanAssessRisk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => planningRuntimeService.assessRisk(svc(context), data)));
export const apiPlanMilestones = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => planningRuntimeService.milestones(svc(context), data)));
export const apiPlanTimeline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => planningRuntimeService.timeline(svc(context), data)));
export const apiPlanGoals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => planningRuntimeService.goals(svc(context))));
export const apiPlanRisks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => planningRuntimeService.risks(svc(context))));
export const apiPlanAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => planningRuntimeService.analytics(svc(context))));
