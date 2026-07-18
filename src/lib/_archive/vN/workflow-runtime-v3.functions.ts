/**
 * HAPPY X — Autonomous Workflow Runtime v3 (Reserved). Phase 3.3.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { workflowRuntimeV3Service } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiWr3Status = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeV3Service.status(svc(context))));
export const apiWr3Monitor = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeV3Service.monitor(svc(context))));
export const apiWr3Live = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeV3Service.live(svc(context))));
export const apiWr3History = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeV3Service.history(svc(context))));
export const apiWr3Approve = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowRuntimeV3Service.approve(svc(context), data)));
export const apiWr3Retry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowRuntimeV3Service.retry(svc(context), data)));
export const apiWr3Rollback = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workflowRuntimeV3Service.rollback(svc(context), data)));
export const apiWr3Timeline = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeV3Service.timeline(svc(context))));
export const apiWr3Analytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowRuntimeV3Service.analytics(svc(context))));
