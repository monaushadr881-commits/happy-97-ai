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
  .handler(async ({ data, context }) => productKinds.set(context.supabase, data));

// BOM
export const mfgListBOMs = auth()
  .inputValidator((d: { company_id: string; product_id?: string; status?: string }) => d)
  .handler(async ({ data, context }) => bom.list(context.supabase, data.company_id, data));
export const mfgGetBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.get(context.supabase, data.id));
export const mfgCreateBOM = auth()
  .inputValidator((d: Parameters<typeof bom.create>[2]) => d)
  .handler(async ({ data, context }) => bom.create(context.supabase, context.userId, data));
export const mfgRequestBOMApproval = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.requestApproval(context.supabase, data.id));
export const mfgApproveBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.approve(context.supabase, context.userId, data.id));
export const mfgArchiveBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.archive(context.supabase, data.id));
export const mfgDeleteBOM = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bom.remove(context.supabase, data.id));

// Machines
export const mfgListMachines = auth()
  .inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => machines.list(context.supabase, data.company_id));
export const mfgCreateMachine = auth()
  .inputValidator((d: Parameters<typeof machines.create>[1]) => d)
  .handler(async ({ data, context }) => machines.create(context.supabase, data));
export const mfgUpdateMachine = auth()
  .inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => machines.update(context.supabase, data.id, data.patch));
export const mfgSetMachineStatus = auth()
  .inputValidator((d: { id: string; status: "idle"|"running"|"maintenance"|"offline"|"decommissioned" }) => d)
  .handler(async ({ data, context }) => machines.setStatus(context.supabase, data.id, data.status));
export const mfgDeleteMachine = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => machines.remove(context.supabase, data.id));
export const mfgMachineUtilization = auth()
  .inputValidator((d: { machine_id: string; days?: number }) => d)
  .handler(async ({ data, context }) => machines.utilization(context.supabase, data.machine_id, data.days));

// Downtime
export const mfgListDowntime = auth()
  .inputValidator((d: { company_id: string; machine_id?: string }) => d)
  .handler(async ({ data, context }) => downtime.list(context.supabase, data.company_id, data.machine_id));
export const mfgStartDowntime = auth()
  .inputValidator((d: Parameters<typeof downtime.start>[2]) => d)
  .handler(async ({ data, context }) => downtime.start(context.supabase, context.userId, data));
export const mfgEndDowntime = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => downtime.end(context.supabase, data.id));

// Maintenance
export const mfgListMaintenance = auth()
  .inputValidator((d: { company_id: string; machine_id?: string; status?: string }) => d)
  .handler(async ({ data, context }) => maintenance.list(context.supabase, data.company_id, data));
export const mfgScheduleMaintenance = auth()
  .inputValidator((d: Parameters<typeof maintenance.schedule>[1]) => d)
  .handler(async ({ data, context }) => maintenance.schedule(context.supabase, data));
export const mfgStartMaintenance = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => maintenance.start(context.supabase, data.id));
export const mfgCompleteMaintenance = auth()
  .inputValidator((d: { id: string; notes?: string }) => d)
  .handler(async ({ data, context }) => maintenance.complete(context.supabase, context.userId, data.id, data.notes));
export const mfgCancelMaintenance = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => maintenance.cancel(context.supabase, data.id));

// Production
export const mfgListProductionOrders = auth()
  .inputValidator((d: { company_id: string; status?: string; q?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => production.list(context.supabase, data.company_id, data));
export const mfgGetProductionOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => production.get(context.supabase, data.id));
export const mfgCreateProductionOrder = auth()
  .inputValidator((d: Parameters<typeof production.create>[2]) => d)
  .handler(async ({ data, context }) => production.create(context.supabase, context.userId, data));
export const mfgStartProductionOrder = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => production.start(context.supabase, context.userId, data.id));
export const mfgCompleteProductionOrder = auth()
  .inputValidator((d: { id: string; produced_quantity: number }) => d)
  .handler(async ({ data, context }) => production.complete(context.supabase, context.userId, data.id, data.produced_quantity));
export const mfgCancelProductionOrder = auth()
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => production.cancel(context.supabase, context.userId, data.id, data.reason));

// Batches
export const mfgListBatches = auth()
  .inputValidator((d: { company_id: string; product_id?: string; quality_status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => batches.list(context.supabase, data.company_id, data));
export const mfgGetBatch = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => batches.get(context.supabase, data.id));
export const mfgCreateBatch = auth()
  .inputValidator((d: Parameters<typeof batches.create>[2]) => d)
  .handler(async ({ data, context }) => batches.create(context.supabase, context.userId, data));
export const mfgSetBatchQuality = auth()
  .inputValidator((d: { id: string; status: "pending"|"pass"|"fail"|"rework"|"quarantined" }) => d)
  .handler(async ({ data, context }) => batches.setQuality(context.supabase, data.id, data.status));
export const mfgDeleteBatch = auth()
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => batches.remove(context.supabase, data.id));

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
