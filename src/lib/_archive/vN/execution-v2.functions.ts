/**
 * HAPPY X — Autonomous Execution Engine v2 (Reserved).
 * Phase 2.15. Goals, plans, tasks, approvals, retry, rollback, schedule.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { executionService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiExecGoals = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executionService.listGoals(svc(context))));
export const apiExecCreateGoal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => executionService.createGoal(svc(context), data)));
export const apiExecPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { goalId: string })
  .handler(async ({ data, context }) => guard(() => executionService.plan(svc(context), data)));
export const apiExecTasks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executionService.listTasks(svc(context))));
export const apiExecEnqueue = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => executionService.enqueue(svc(context), data)));
export const apiExecDependencyGraph = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { goalId: string })
  .handler(async ({ data, context }) => guard(() => executionService.dependencyGraph(svc(context), data)));
export const apiExecApprove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { taskId: string; approved: boolean })
  .handler(async ({ data, context }) => guard(() => executionService.approve(svc(context), data)));
export const apiExecRetry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { taskId: string })
  .handler(async ({ data, context }) => guard(() => executionService.retry(svc(context), data)));
export const apiExecRollback = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { taskId: string })
  .handler(async ({ data, context }) => guard(() => executionService.rollback(svc(context), data)));
export const apiExecProgress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { goalId: string })
  .handler(async ({ data, context }) => guard(() => executionService.progress(svc(context), data)));
export const apiExecSchedule = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => executionService.schedule(svc(context), data)));
export const apiExecCancel = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { taskId: string })
  .handler(async ({ data, context }) => guard(() => executionService.cancel(svc(context), data)));
export const apiExecHistory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executionService.history(svc(context))));
export const apiExecAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => executionService.analytics(svc(context))));
