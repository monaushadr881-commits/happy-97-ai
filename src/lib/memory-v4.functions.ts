/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: SHIM (R145 reclass)
 * Canonical owner: src/lib/memory/intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * @deprecated R115.b Consolidation — this is a compatibility shim.
 * Canonical owner: src/lib/memory/memory.functions.ts (canonical Memory)
 * Do NOT add new logic here. All handlers already delegate through
 * services/domain/roadmap.service which is being routed to the canonical
 * engines. Kept solely to preserve public import paths (backward-compat).
 */
/** HAPPY v4.0 — memory-v4 server functions. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { memoryV4Service as svcRef } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiMemoryV4Status = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.status(svc(context))));
export const apiMemoryV4List = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.list(svc(context))));
export const apiMemoryV4Analytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.analytics(svc(context))));
export const apiMemoryV4Execute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => i).handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiMemoryV4Execute", source: "api", module: "memory.apiMemoryV4Execute" });
    return guard(() => svcRef.execute(svc(context), data));
  });
export const apiMemoryV4History = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.history(svc(context))));
