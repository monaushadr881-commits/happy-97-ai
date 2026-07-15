// R28 HAPPY Memory Engine — server function surface
// Every call is authenticated via requireSupabaseAuth and executes through the engine (RLS-scoped).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  memoryStore, memoryGet, memoryList, memorySearch, memoryUpdate,
  memoryArchive, memoryForget, memoryMerge, memoryLogEvent, memoryTimeline,
  memoryRetentionApply, memoryRetentionUpsert, memoryContext, memoryLink,
  type MemoryStoreInput, type MemoryQuery, type EventInput, type MemoryKind,
} from "./engine";

export const memStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: MemoryStoreInput) => d)
  .handler(async ({ data, context }) => memoryStore(context.supabase, context.userId, data));

export const memGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => memoryGet(context.supabase, context.userId, data.id));

export const memList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: MemoryQuery) => d ?? {})
  .handler(async ({ data, context }) => memoryList(context.supabase, context.userId, data));

export const memSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: MemoryQuery) => d)
  .handler(async ({ data, context }) => memorySearch(context.supabase, context.userId, data));

export const memUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: Partial<MemoryStoreInput> }) => d)
  .handler(async ({ data, context }) => memoryUpdate(context.supabase, context.userId, data.id, data.patch));

export const memArchive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => memoryArchive(context.supabase, context.userId, data.id));

export const memForget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => memoryForget(context.supabase, context.userId, data.id, data.reason));

export const memMerge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { primaryId: string; duplicateIds: string[] }) => d)
  .handler(async ({ data, context }) => memoryMerge(context.supabase, context.userId, data.primaryId, data.duplicateIds));

export const memLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from_id: string; to_id: string; kind?: "related" | "supersedes" | "duplicate_of" | "derived_from" | "references" }) => d)
  .handler(async ({ data, context }) => memoryLink(context.supabase, context.userId, data.from_id, data.to_id, data.kind));

export const memLogEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EventInput) => d)
  .handler(async ({ data, context }) => memoryLogEvent(context.supabase, context.userId, data));

export const memTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string | null; user_id?: string | null; workspace_id?: string | null; event_type?: string; since?: string; until?: string; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) => memoryTimeline(context.supabase, context.userId, data));

export const memContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string | null; workspace_id?: string | null; kinds?: MemoryKind[]; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) => memoryContext(context.supabase, context.userId, data));

export const memRetentionUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    company_id: string; scope: "personal" | "workspace" | "company" | "platform"; kind: string;
    max_age_days?: number | null; max_items?: number | null; archive_after_days?: number | null;
    hard_delete?: boolean; active?: boolean;
  }) => d)
  .handler(async ({ data, context }) => memoryRetentionUpsert(context.supabase, context.userId, data));

export const memRetentionApply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => memoryRetentionApply(context.supabase, context.userId, data.company_id));
