/**
 * HAPPY X — Tool Engine v3 (Phase 3.8).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { toolEngineService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiToolEngineDiscover = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { query?: string; capability?: string })
  .handler(async ({ data, context }) => guard(() => toolEngineService.discover(svc(context), data)));
export const apiToolEnginePermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string })
  .handler(async ({ data, context }) => guard(() => toolEngineService.permissions(svc(context), data)));
export const apiToolEngineValidate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string; granted?: string[] })
  .handler(async ({ data, context }) => guard(() => toolEngineService.validate(svc(context), data)));
export const apiToolEngineExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Parameters<typeof toolEngineService.execute>[1])
  .handler(async ({ data, context }) => guard(() => toolEngineService.execute(svc(context), data)));
export const apiToolEngineQueue = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolEngineService.queue(svc(context))));
export const apiToolEngineLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolEngineService.live(svc(context))));
export const apiToolEngineHistory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { limit?: number })
  .handler(async ({ data, context }) => guard(() => toolEngineService.history(svc(context), data)));
export const apiToolEngineMetrics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolEngineService.metrics(svc(context))));
export const apiToolEngineHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolEngineService.health(svc(context))));
export const apiToolEngineAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolEngineService.analytics(svc(context))));
