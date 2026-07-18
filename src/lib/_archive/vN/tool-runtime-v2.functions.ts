/**
 * HAPPY X — Enterprise Tool Runtime v2 (Reserved).
 * Phase 2.14. Discovery, execution, validation, permissions, analytics, health.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { toolRuntimeService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiTrList = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolRuntimeService.list(svc(context))));
export const apiTrDiscover = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { query?: string; category?: string })
  .handler(async ({ data, context }) => guard(() => toolRuntimeService.discover(svc(context), data)));
export const apiTrExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string; input?: unknown })
  .handler(async ({ data, context }) => guard(() => toolRuntimeService.execute(svc(context), data)));
export const apiTrValidate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string; input?: unknown })
  .handler(async ({ data, context }) => guard(() => toolRuntimeService.validate(svc(context), data)));
export const apiTrPermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string })
  .handler(async ({ data, context }) => guard(() => toolRuntimeService.permissions(svc(context), data)));
export const apiTrGrant = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { toolId: string; permissions: string[] })
  .handler(async ({ data, context }) => guard(() => toolRuntimeService.grant(svc(context), data)));
export const apiTrAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolRuntimeService.analytics(svc(context))));
export const apiTrHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolRuntimeService.health(svc(context))));
export const apiTrSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => toolRuntimeService.settings(svc(context))));
export const apiTrUpdateSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => toolRuntimeService.updateSettings(svc(context), data)));
