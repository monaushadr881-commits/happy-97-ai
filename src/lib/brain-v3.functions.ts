/**
 * @deprecated R115.b Consolidation — this is a compatibility shim.
 * Canonical owner: src/lib/brain/brain.functions.ts (canonical Brain)
 * Do NOT add new logic here. All handlers already delegate through
 * services/domain/roadmap.service which is being routed to the canonical
 * engines. Kept solely to preserve public import paths (backward-compat).
 */
/** HAPPY X — Enterprise Brain v3.2 server functions (auth-guarded). */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { brainService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiBrainStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => brainService.status(svc(context))));
export const apiBrainProcess = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brainService.process(svc(context), data)));
export const apiBrainReason = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brainService.reason(svc(context), data)));
export const apiBrainPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brainService.plan(svc(context), data)));
export const apiBrainExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brainService.execute(svc(context), data)));
export const apiBrainValidate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brainService.validate(svc(context), data)));
export const apiBrainReflect = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brainService.reflect(svc(context), data)));
export const apiBrainAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => brainService.analytics(svc(context))));
export const apiBrainHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => brainService.health(svc(context))));
export const apiBrainMemory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => brainService.memory(svc(context))));
