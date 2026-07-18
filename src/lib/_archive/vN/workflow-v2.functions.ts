/**
 * HAPPY X — Autonomous Workflow Engine v2 (Reserved). Phase 2.11.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { workflowService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiWorkflowList = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowService.list(svc(context))));
export const apiWorkflowGet = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { workflowId: string })
  .handler(async ({ data, context }) => guard(() => workflowService.get(svc(context), data)));
export const apiWorkflowCreate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowService.create(svc(context), data)));
export const apiWorkflowUpdate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowService.update(svc(context), data)));
export const apiWorkflowDelete = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { workflowId: string })
  .handler(async ({ data, context }) => guard(() => workflowService.delete(svc(context), data)));
export const apiWorkflowRun = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { workflowId: string; input?: unknown })
  .handler(async ({ data, context }) => guard(() => workflowService.run(svc(context), data)));
export const apiWorkflowRetry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowService.retry(svc(context), data)));
export const apiWorkflowCancel = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowService.cancel(svc(context), data)));
export const apiWorkflowApprove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string; approved: boolean })
  .handler(async ({ data, context }) => guard(() => workflowService.approve(svc(context), data)));
export const apiWorkflowSchedule = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowService.schedule(svc(context), data)));
export const apiWorkflowHistory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowService.history(svc(context))));
export const apiWorkflowAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowService.analytics(svc(context))));
export const apiWorkflowDependencyGraph = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { workflowId: string })
  .handler(async ({ data, context }) => guard(() => workflowService.dependencyGraph(svc(context), data)));
