/**
 * HAPPY X — Service Layer: Service Context
 *
 * Every application service receives a ServiceContext instead of raw args.
 * This carries the authenticated Supabase client (RLS as caller), user
 * identity, tenant scope, tracing metadata, and cache.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { memoryCache, type Cache } from "./cache";
import { newTraceId } from "./logger";

export type Sb = SupabaseClient<Database>;

export interface ServiceContext {
  supabase: Sb;
  userId: string;
  claims?: Record<string, unknown>;
  tenant?: {
    companyId?: string;
    workspaceId?: string;
    brandId?: string;
  };
  trace: {
    traceId: string;
    requestId?: string;
    correlationId?: string;
    startedAt: number;
  };
  cache: Cache;
}

export function makeServiceContext(input: {
  supabase: Sb;
  userId: string;
  claims?: Record<string, unknown>;
  tenant?: ServiceContext["tenant"];
  requestId?: string;
  correlationId?: string;
}): ServiceContext {
  return {
    supabase: input.supabase,
    userId: input.userId,
    claims: input.claims,
    tenant: input.tenant,
    trace: {
      traceId: newTraceId(),
      requestId: input.requestId,
      correlationId: input.correlationId,
      startedAt: Date.now(),
    },
    cache: memoryCache,
  };
}
