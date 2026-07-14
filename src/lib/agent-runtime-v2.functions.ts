/**
 * HAPPY X — Agent Runtime v2 (Reserved).
 * Phase 2.13. Internal capability runtime (business, education, knowledge,
 * creator, research, support, founder, automation) — HAPPY remains ONE.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { agentRuntimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiArStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentRuntimeService.runtimeStatus(svc(context))));
export const apiArCapabilities = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentRuntimeService.listCapabilities(svc(context))));
export const apiArSchedule = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => agentRuntimeService.schedule(svc(context), data)));
export const apiArDispatch = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { capability: string; input?: unknown })
  .handler(async ({ data, context }) => guard(() => agentRuntimeService.dispatch(svc(context), data)));
export const apiArExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { taskId: string })
  .handler(async ({ data, context }) => guard(() => agentRuntimeService.execute(svc(context), data)));
export const apiArQueue = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentRuntimeService.queue(svc(context))));
export const apiArContext = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { sessionId: string })
  .handler(async ({ data, context }) => guard(() => agentRuntimeService.context(svc(context), data)));
export const apiArMetrics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => agentRuntimeService.metrics(svc(context))));
export const apiArCancel = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { taskId: string })
  .handler(async ({ data, context }) => guard(() => agentRuntimeService.cancel(svc(context), data)));
