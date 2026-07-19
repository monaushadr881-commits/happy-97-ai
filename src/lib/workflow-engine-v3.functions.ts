/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: SHIM (R145 reclass)
 * Canonical owner: src/lib/happy-r121/builder-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — Workflow Engine v3 (Phase 3.9).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { workflowEngineService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiWfCreate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Parameters<typeof workflowEngineService.create>[1])
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiWfCreate", source: "api", module: "workflow.apiWfCreate" });
    return guard(() => workflowEngineService.create(svc(context), data));
  });export const apiWfList = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { limit?: number })
  .handler(async ({ data, context }) => guard(() => workflowEngineService.list(svc(context), data)));
export const apiWfLive = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowEngineService.live(svc(context))));
export const apiWfGet = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowEngineService.get(svc(context), data)));
export const apiWfApprove = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string; approved: boolean })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiWfApprove", source: "api", module: "workflow.apiWfApprove" });
    return guard(() => workflowEngineService.approve(svc(context), data));
  });export const apiWfRetry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context }) => guard(() => workflowEngineService.retry(svc(context), data)));
export const apiWfRollback = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiWfRollback", source: "api", module: "workflow.apiWfRollback" });
    return guard(() => workflowEngineService.rollback(svc(context), data));
  });export const apiWfCancel = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { runId: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiWfCancel", source: "api", module: "workflow.apiWfCancel" });
    return guard(() => workflowEngineService.cancel(svc(context), data));
  });
export const apiWfHealth = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowEngineService.health(svc(context))));
export const apiWfTimeline = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowEngineService.timeline(svc(context))));
export const apiWfAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workflowEngineService.analytics(svc(context))));
