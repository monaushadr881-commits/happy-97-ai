/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: SHIM
 * Canonical owner: src/lib/happy-r127/communication-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/** HAPPY v16.0 — communications-v16 server functions. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { communicationPlatformService as svcRef } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiCommunicationsV16Status = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.status(svc(context))));
export const apiCommunicationsV16List = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.list(svc(context))));
export const apiCommunicationsV16Analytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.analytics(svc(context))));
export const apiCommunicationsV16Health = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.health(svc(context))));
export const apiCommunicationsV16Live = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.live(svc(context))));
export const apiCommunicationsV16Execute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => i).handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiCommunicationsV16Execute", source: "api", module: "comms.apiCommunicationsV16Execute" });
    return guard(() => svcRef.execute(svc(context), data));
  });