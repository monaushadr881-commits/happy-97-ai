/**
 * HAPPY X — Multi-Capability Collaboration Engine v2 (Reserved).
 * Phase 2.13. HAPPY remains ONE Digital Human; these endpoints orchestrate
 * internal capabilities (business, education, knowledge, creator, research,
 * support, founder, automation, presentation, whiteboard).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { collaborationService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiCollabPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { request: string; context?: unknown })
  .handler(async ({ data, context }) => guard(() => collaborationService.plan(svc(context), data)));
export const apiCollabSelectCapabilities = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { intent: string })
  .handler(async ({ data, context }) => guard(() => collaborationService.selectCapabilities(svc(context), data)));
export const apiCollabDistribute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => collaborationService.distribute(svc(context), data)));
export const apiCollabNegotiate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => collaborationService.negotiate(svc(context), data)));
export const apiCollabExecute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => collaborationService.execute(svc(context), data)));
export const apiCollabSharedContext = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { sessionId: string })
  .handler(async ({ data, context }) => guard(() => collaborationService.sharedContext(svc(context), data)));
export const apiCollabSharedMemory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { sessionId: string })
  .handler(async ({ data, context }) => guard(() => collaborationService.sharedMemory(svc(context), data)));
export const apiCollabResolveConflict = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => collaborationService.resolveConflict(svc(context), data)));
export const apiCollabPrioritize = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => collaborationService.prioritize(svc(context), data)));
export const apiCollabConsensus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => collaborationService.consensus(svc(context), data)));
export const apiCollabCompose = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { planId: string })
  .handler(async ({ data, context }) => guard(() => collaborationService.compose(svc(context), data)));
export const apiCollabLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => collaborationService.live(svc(context))));
export const apiCollabHistory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => collaborationService.history(svc(context))));
export const apiCollabAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => collaborationService.analytics(svc(context))));
