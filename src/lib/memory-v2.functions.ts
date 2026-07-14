/**
 * HAPPY X — Memory Intelligence Engine v2 (Reserved Server Functions)
 * Phase 2.6. All handlers use requireSupabaseAuth and delegate to memoryService.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { memoryService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiMemoryList = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => memoryService.list(svc(context))));
export const apiMemoryRecall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { query: string; scope?: string })
  .handler(async ({ data, context }) => guard(() => memoryService.recall(svc(context), data)));
export const apiMemorySearch = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { query: string })
  .handler(async ({ data, context }) => guard(() => memoryService.search(svc(context), data)));
export const apiMemoryTimeline = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => memoryService.timeline(svc(context))));
export const apiMemoryCreate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => memoryService.createMemory(svc(context), data)));
export const apiMemoryUpdate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => memoryService.updateMemory(svc(context), data)));
export const apiMemoryDelete = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { memoryId: string })
  .handler(async ({ data, context }) => guard(() => memoryService.deleteMemory(svc(context), data)));
export const apiMemoryCompress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => memoryService.compress(svc(context))));
export const apiMemoryRank = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => memoryService.rank(svc(context), data)));
export const apiMemoryPreferences = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => memoryService.getPreferences(svc(context))));
export const apiMemoryUpdatePreferences = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => memoryService.updatePreferences(svc(context), data)));
export const apiMemoryAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => memoryService.analytics(svc(context))));
export const apiMemorySettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => memoryService.settings(svc(context))));
export const apiMemoryUpdateSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => memoryService.updateSettings(svc(context), data)));
