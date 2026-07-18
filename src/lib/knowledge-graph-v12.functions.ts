/**
 * @deprecated R115.b Consolidation — this is a compatibility shim.
 * Canonical owner: src/lib/kg/kg.functions.ts (canonical Knowledge Graph)
 * Do NOT add new logic here. All handlers already delegate through
 * services/domain/roadmap.service which is being routed to the canonical
 * engines. Kept solely to preserve public import paths (backward-compat).
 */
/** HAPPY v12.0 — knowledge-graph-v12 server functions. */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { knowledgeGraphService as svcRef } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiKnowledgeGraphV12Status = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.status(svc(context))));
export const apiKnowledgeGraphV12List = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.list(svc(context))));
export const apiKnowledgeGraphV12Analytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.analytics(svc(context))));
export const apiKnowledgeGraphV12Health = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.health(svc(context))));
export const apiKnowledgeGraphV12Live = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => guard(() => svcRef.live(svc(context))));
export const apiKnowledgeGraphV12Execute = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i: unknown) => i).handler(async ({ data, context }) => guard(() => svcRef.execute(svc(context), data)));
