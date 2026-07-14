/**
 * HAPPY X — Autonomous Capability Runtime v3 (Reserved).
 * Phase 3.0. RuntimeManager / Capability / Execution / Context / Memory /
 * Tool / Planner / Scheduler / Analytics / Health / Metrics for the single
 * Digital Human. All handlers currently return NOT_IMPLEMENTED via the
 * shared runtime service contract.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { runtimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiRtStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.status(svc(context))));
export const apiRtHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.health(svc(context))));
export const apiRtMetrics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.metrics(svc(context))));
export const apiRtCapabilities = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.capabilities(svc(context))));
export const apiRtDispatch = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => runtimeService.dispatch(svc(context), data)));
export const apiRtExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => runtimeService.execute(svc(context), data)));
export const apiRtLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.live(svc(context))));
export const apiRtExecutions = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.executions(svc(context))));
export const apiRtAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.analytics(svc(context))));
export const apiRtSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.settings(svc(context))));
export const apiRtUpdateSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => runtimeService.updateSettings(svc(context), data)));
export const apiRtContext = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => runtimeService.context(svc(context), data)));
export const apiRtMemory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeService.memory(svc(context))));
export const apiRtSchedule = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => runtimeService.schedule(svc(context), data)));
