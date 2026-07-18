/**
 * HAPPY X — Runtime Engine v3 (Phase 3.6). Real autonomous execution runtime.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { runtimeEngineService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiEngineStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.status(svc(context))));
export const apiEngineHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.health(svc(context))));
export const apiEngineMetrics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.metrics(svc(context))));
export const apiEngineAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.analytics(svc(context))));
export const apiEngineCapabilities = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.capabilities(svc(context))));
export const apiEngineLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.live(svc(context))));
export const apiEngineHistory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.history(svc(context))));
export const apiEngineExecutions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { limit?: number })
  .handler(async ({ data, context }) => guard(() => runtimeEngineService.executions(svc(context), data)));
export const apiEngineExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as Parameters<typeof runtimeEngineService.execute>[1])
  .handler(async ({ data, context }) => guard(() => runtimeEngineService.execute(svc(context), data)));
export const apiEngineDispatch = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as Parameters<typeof runtimeEngineService.dispatch>[1])
  .handler(async ({ data, context }) => guard(() => runtimeEngineService.dispatch(svc(context), data)));
export const apiEngineSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => runtimeEngineService.settings(svc(context))));
export const apiEngineUpdateSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as Parameters<typeof runtimeEngineService.updateSettings>[1])
  .handler(async ({ data, context }) => guard(() => runtimeEngineService.updateSettings(svc(context), data)));
