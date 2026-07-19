// R29 HAPPY Knowledge Graph — server function surface
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  entityUpsert, entityGet, entityResolve, entityList, entityArchive, entityDelete,
  relationUpsert, relationDelete, relationsList, neighborhood, entitySearch,
  naturalQuery, inferenceRecord, inferenceReview, inferencesList, inferenceRun,
  graphHealth,
  type EntityUpsertInput, type EntityKind, type RelationInput, type RelationKind, type InferenceInput,
} from "./engine";

export const kgEntityUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EntityUpsertInput) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgEntityUpsert", source: "api", module: "kg.kgEntityUpsert" });
    return entityUpsert(context.supabase, context.userId, data);
  });export const kgEntityGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => entityGet(context.supabase, context.userId, data.id));

export const kgEntityResolve = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; kind: EntityKind; ref_id?: string; slug?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgEntityResolve", source: "api", module: "kg.kgEntityResolve" });
    return entityResolve(context.supabase, context.userId, data);
  });export const kgEntityList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; kind?: EntityKind | EntityKind[]; tags?: string[]; status?: "active" | "archived" | "deleted"; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) => entityList(context.supabase, context.userId, data));

export const kgEntityArchive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgEntityArchive", source: "api", module: "kg.kgEntityArchive" });
    return entityArchive(context.supabase, context.userId, data.id);
  });export const kgEntityDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgEntityDelete", source: "api", module: "kg.kgEntityDelete" });
    return entityDelete(context.supabase, context.userId, data.id);
  });export const kgRelationUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RelationInput) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgRelationUpsert", source: "api", module: "kg.kgRelationUpsert" });
    return relationUpsert(context.supabase, context.userId, data);
  });export const kgRelationDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgRelationDelete", source: "api", module: "kg.kgRelationDelete" });
    return relationDelete(context.supabase, context.userId, data.id);
  });export const kgRelationsList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id?: string; entity_id?: string; direction?: "in" | "out" | "both"; relation?: RelationKind | RelationKind[]; verified_only?: boolean; limit?: number }) => d ?? {})
  .handler(async ({ data, context }) => relationsList(context.supabase, context.userId, data));

export const kgNeighborhood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity_id: string; depth?: number; verified_only?: boolean; relation?: RelationKind[] }) => d)
  .handler(async ({ data, context }) => neighborhood(context.supabase, context.userId, data));

export const kgSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; q: string; kind?: EntityKind | EntityKind[]; limit?: number }) => d)
  .handler(async ({ data, context }) => entitySearch(context.supabase, context.userId, data));

export const kgNaturalQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; q: string }) => d)
  .handler(async ({ data, context }) => naturalQuery(context.supabase, context.userId, data));

export const kgInferenceRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: InferenceInput) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "kgInferenceRecord", source: "api", module: "kg.kgInferenceRecord" });
    return inferenceRecord(context.supabase, context.userId, data);
  });export const kgInferenceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "accepted" | "rejected" }) => d)
  .handler(async ({ data, context }) => inferenceReview(context.supabase, context.userId, data.id, data.decision));

export const kgInferencesList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; status?: "pending" | "accepted" | "rejected" | "superseded"; limit?: number }) => d)
  .handler(async ({ data, context }) => inferencesList(context.supabase, context.userId, data));

export const kgInferenceRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; limit?: number }) => d)
  .handler(async ({ data, context }) => inferenceRun(context.supabase, context.userId, data));

export const kgGraphHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => graphHealth(context.supabase, context.userId, data.company_id));
