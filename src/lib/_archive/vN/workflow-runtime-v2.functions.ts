/**
 * HAPPY X — Workflow Runtime v2 (Reserved).
 * Phase 2.15. Execution / approval / retry / rollback / monitor / analytics.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { workflowRuntimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiWrStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeService.runtimeStatus(svc(context))));
export const apiWrMonitor = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeService.monitor(svc(context))));
export const apiWrExecutions = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeService.executions(svc(context))));
export const apiWrApprove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string; approved: boolean })
  .handler(async ({ data, context }) => guard(() => workflowRuntimeService.approve(svc(context), data)));
export const apiWrRetry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowRuntimeService.retry(svc(context), data)));
export const apiWrRollback = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowRuntimeService.rollback(svc(context), data)));
export const apiWrCancel = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowRuntimeService.cancel(svc(context), data)));
export const apiWrSchedule = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowRuntimeService.schedule(svc(context), data)));
export const apiWrNotify = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowRuntimeService.notify(svc(context), data)));
export const apiWrAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeService.analytics(svc(context))));
