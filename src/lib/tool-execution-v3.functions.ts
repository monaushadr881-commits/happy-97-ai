/**
 * HAPPY X — Tool Execution Runtime v3 (Reserved). Phase 3.2.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { toolExecutionRuntimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiToolExecStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolExecutionRuntimeService.status(svc(context))));
export const apiToolExecLoad = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string })
  .handler(async ({ data, context }) => guard(() => toolExecutionRuntimeService.load(svc(context), data)));
export const apiToolExecValidate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => toolExecutionRuntimeService.validatePermissions(svc(context), data)));
export const apiToolExecRun = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => toolExecutionRuntimeService.execute(svc(context), data)));
export const apiToolExecQueue = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolExecutionRuntimeService.queue(svc(context))));
export const apiToolExecMetrics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolExecutionRuntimeService.metrics(svc(context))));
export const apiToolExecHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolExecutionRuntimeService.health(svc(context))));
export const apiToolExecRecover = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => toolExecutionRuntimeService.recover(svc(context), data)));
export const apiToolExecLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolExecutionRuntimeService.live(svc(context))));
export const apiToolExecHistory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolExecutionRuntimeService.history(svc(context))));
