/**
 * HAPPY X — R23 Manufacturing Runtime server functions.
 * Auth-gated RPC surface, RLS enforced via context.supabase.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  productKinds, bom, machines, downtime, maintenance,
  production, batches, quality, mfgDashboard,
} from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

// Product kinds
export const mfgListProductKinds = auth()
  .inputValidator((d: { company_id: string; kind?: string }) => d)
  .handler(async ({ data, context }) => productKinds.list(context.supabase, data.company_id, data.kind));
export const mfgSetProductKind = auth()
  .inputValidator((d: Parameters<typeof productKinds.set>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgSetProductKind", source: "api", module: "mfg.core.mfgSetProductKind" });
    return productKinds.set(context.supabase, data);
  });
// BOM
export const mfgListBOMs = auth()
  .inputValidator((d: { company_id: string; product_id?: string; status?: string }) => d)
  .handler(async ({ data, context }) => bom.list(context.supabase, data.company_id, data));
export const mfgGetBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.get(context.supabase, data.id));
export const mfgCreateBOM = auth()
  .inputValidator((d: Parameters<typeof bom.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCreateBOM", source: "api", module: "mfg.core.mfgCreateBOM" });
    return bom.create(context.supabase, context.userId, data);
  });export const mfgRequestBOMApproval = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.requestApproval(context.supabase, data.id));
export const mfgApproveBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgApproveBOM", source: "api", module: "mfg.core.mfgApproveBOM" });
    return bom.approve(context.supabase, context.userId, data.id);
  });export const mfgArchiveBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgArchiveBOM", source: "api", module: "mfg.core.mfgArchiveBOM" });
    return bom.archive(context.supabase, data.id);
  });export const mfgDeleteBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgDeleteBOM", source: "api", module: "mfg.core.mfgDeleteBOM" });
    return bom.remove(context.supabase, data.id);
  });
// Machines
export const mfgListMachines = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => machines.list(context.supabase, data.company_id));
export const mfgCreateMachine = auth()
  .inputValidator((d: Parameters<typeof machines.create>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCreateMachine", source: "api", module: "mfg.core.mfgCreateMachine" });
    return machines.create(context.supabase, data);
  });export const mfgUpdateMachine = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgUpdateMachine", source: "api", module: "mfg.core.mfgUpdateMachine" });
    return machines.update(context.supabase, data.id, data.patch);
  });export const mfgSetMachineStatus = auth()
  .inputValidator((d: { id: string; status: "idle"|"running"|"maintenance"|"offline"|"decommissioned" }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgSetMachineStatus", source: "api", module: "mfg.core.mfgSetMachineStatus" });
    return machines.setStatus(context.supabase, data.id, data.status);
  });export const mfgDeleteMachine = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgDeleteMachine", source: "api", module: "mfg.core.mfgDeleteMachine" });
    return machines.remove(context.supabase, data.id);
  });export const mfgMachineUtilization = auth()
  .inputValidator((d: { machine_id: string; days?: number }) => d)
  .handler(async ({ data, context }) => machines.utilization(context.supabase, data.machine_id, data.days));

// Downtime
export const mfgListDowntime = auth()
  .inputValidator((d: { company_id: string; machine_id?: string }) => d)
  .handler(async ({ data, context }) => downtime.list(context.supabase, data.company_id, data.machine_id));
export const mfgStartDowntime = auth()
  .inputValidator((d: Parameters<typeof downtime.start>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgStartDowntime", source: "api", module: "mfg.core.mfgStartDowntime" });
    return downtime.start(context.supabase, context.userId, data);
  });export const mfgEndDowntime = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => downtime.end(context.supabase, data.id));

// Maintenance
export const mfgListMaintenance = auth()
  .inputValidator((d: { company_id: string; machine_id?: string; status?: string }) => d)
  .handler(async ({ data, context }) => maintenance.list(context.supabase, data.company_id, data));
export const mfgScheduleMaintenance = auth()
  .inputValidator((d: Parameters<typeof maintenance.schedule>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgScheduleMaintenance", source: "api", module: "mfg.core.mfgScheduleMaintenance" });
    return maintenance.schedule(context.supabase, data);
  });export const mfgStartMaintenance = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgStartMaintenance", source: "api", module: "mfg.core.mfgStartMaintenance" });
    return maintenance.start(context.supabase, data.id);
  });export const mfgCompleteMaintenance = auth()
  .inputValidator((d: { id: string; notes?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCompleteMaintenance", source: "api", module: "mfg.core.mfgCompleteMaintenance" });
    return maintenance.complete(context.supabase, context.userId, data.id, data.notes);
  });export const mfgCancelMaintenance = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCancelMaintenance", source: "api", module: "mfg.core.mfgCancelMaintenance" });
    return maintenance.cancel(context.supabase, data.id);
  });
// Production
export const mfgListProductionOrders = auth()
  .inputValidator((d: { company_id: string; status?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => production.list(context.supabase, data.company_id, data));
export const mfgGetProductionOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => production.get(context.supabase, data.id));
export const mfgCreateProductionOrder = auth()
  .inputValidator((d: Parameters<typeof production.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCreateProductionOrder", source: "api", module: "mfg.core.mfgCreateProductionOrder" });
    return production.create(context.supabase, context.userId, data);
  });export const mfgStartProductionOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgStartProductionOrder", source: "api", module: "mfg.core.mfgStartProductionOrder" });
    return production.start(context.supabase, context.userId, data.id);
  });export const mfgCompleteProductionOrder = auth()
  .inputValidator((d: { id: string; produced_quantity: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCompleteProductionOrder", source: "api", module: "mfg.core.mfgCompleteProductionOrder" });
    return production.complete(context.supabase, context.userId, data.id, data.produced_quantity);
  });export const mfgCancelProductionOrder = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCancelProductionOrder", source: "api", module: "mfg.core.mfgCancelProductionOrder" });
    return production.cancel(context.supabase, context.userId, data.id, data.reason);
  });
// Batches
export const mfgListBatches = auth()
  .inputValidator((d: { company_id: string; product_id?: string; quality_status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => batches.list(context.supabase, data.company_id, data));
export const mfgGetBatch = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => batches.get(context.supabase, data.id));
export const mfgCreateBatch = auth()
  .inputValidator((d: Parameters<typeof batches.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgCreateBatch", source: "api", module: "mfg.core.mfgCreateBatch" });
    return batches.create(context.supabase, context.userId, data);
  });export const mfgSetBatchQuality = auth()
  .inputValidator((d: { id: string; status: "pending"|"pass"|"fail"|"rework"|"quarantined" }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgSetBatchQuality", source: "api", module: "mfg.core.mfgSetBatchQuality" });
    return batches.setQuality(context.supabase, data.id, data.status);
  });export const mfgDeleteBatch = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "mfgDeleteBatch", source: "api", module: "mfg.core.mfgDeleteBatch" });
    return batches.remove(context.supabase, data.id);
  });
// Quality
export const mfgListInspections = auth()
  .inputValidator((d: { company_id: string; batch_id?: string; result?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => quality.list(context.supabase, data.company_id, data));
export const mfgInspect = auth()
  .inputValidator((d: Parameters<typeof quality.inspect>[2]) => d)
  .handler(async ({ data, context }) => quality.inspect(context.supabase, context.userId, data));
export const mfgQualityPassRate = auth()
  .inputValidator((d: { company_id: string; days?: number }) => d)
  .handler(async ({ data, context }) => quality.passRate(context.supabase, data.company_id, data.days));

// Dashboard
export const mfgCompanyDashboard = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => mfgDashboard.company(context.supabase, data.company_id));
