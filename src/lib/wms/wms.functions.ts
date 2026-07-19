/**
 * HAPPY X — R24 Warehouse Management System server functions.
 * Auth-gated RPC surface, RLS enforced via context.supabase.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  zones, bins, lots, movements, receiving, dispatch, transfers,
  reservations, counts, thresholds, analytics,
} from "./engine";

const auth = () => createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]);

// Zones
export const wmsListZones = auth().inputValidator((d: { warehouse_id: string }) => d)
  .handler(async ({ data, context }) => zones.list(context.supabase, data.warehouse_id));
export const wmsCreateZone = auth().inputValidator((d: Parameters<typeof zones.create>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCreateZone", source: "api", module: "wms.wmsCreateZone" });
    return zones.create(context.supabase, data);
  });export const wmsUpdateZone = auth().inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsUpdateZone", source: "api", module: "wms.wmsUpdateZone" });
    return zones.update(context.supabase, data.id, data.patch);
  });export const wmsDeleteZone = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsDeleteZone", source: "api", module: "wms.wmsDeleteZone" });
    return zones.remove(context.supabase, data.id);
  });
// Bins
export const wmsListBins = auth().inputValidator((d: { warehouse_id: string; zone_id?: string }) => d)
  .handler(async ({ data, context }) => bins.list(context.supabase, data.warehouse_id, data.zone_id));
export const wmsCreateBin = auth().inputValidator((d: Parameters<typeof bins.create>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCreateBin", source: "api", module: "wms.wmsCreateBin" });
    return bins.create(context.supabase, data);
  });export const wmsUpdateBin = auth().inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsUpdateBin", source: "api", module: "wms.wmsUpdateBin" });
    return bins.update(context.supabase, data.id, data.patch);
  });export const wmsDeleteBin = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsDeleteBin", source: "api", module: "wms.wmsDeleteBin" });
    return bins.remove(context.supabase, data.id);
  });
// Lots
export const wmsListLots = auth().inputValidator((d: Parameters<typeof lots.list>[2] & { company_id: string }) => d)
  .handler(async ({ data, context }) => lots.list(context.supabase, data.company_id, data));
export const wmsCreateLot = auth().inputValidator((d: Parameters<typeof lots.create>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCreateLot", source: "api", module: "wms.wmsCreateLot" });
    return lots.create(context.supabase, data);
  });export const wmsSetLotStatus = auth().inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsSetLotStatus", source: "api", module: "wms.wmsSetLotStatus" });
    return lots.setStatus(context.supabase, data.id, data.status);
  });
// Movements (immutable ledger)
export const wmsListMovements = auth().inputValidator((d: { company_id: string; product_id?: string; warehouse_id?: string; txn_type?: string; limit?: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsListMovements", source: "api", module: "wms.wmsListMovements" });
    return movements.list(context.supabase, data.company_id, data);
  });export const wmsAdjustStock = auth().inputValidator((d: {
  company_id: string; product_id: string; warehouse_id: string; qty_delta: number;
  bin_id?: string; lot_id?: string; reason?: string; unit_cost?: number;
}) => d).handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsAdjustStock", source: "api", module: "wms.wmsAdjustStock" });
    return movements.record(context.supabase, context.userId, {
  company_id: data.company_id, txn_type: "adjustment",
  product_id: data.product_id, warehouse_id: data.warehouse_id,
  bin_id: data.bin_id, lot_id: data.lot_id, qty_delta: data.qty_delta,
  unit_cost: data.unit_cost, notes: data.reason, ref_type: "manual",
});
  });
// Receiving
export const wmsPostReceipt = auth().inputValidator((d: Parameters<typeof receiving.postReceipt>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsPostReceipt", source: "api", module: "wms.wmsPostReceipt" });
    return receiving.postReceipt(context.supabase, context.userId, data);
  });
// Dispatch
export const wmsPostDispatch = auth().inputValidator((d: Parameters<typeof dispatch.post>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsPostDispatch", source: "api", module: "wms.wmsPostDispatch" });
    return dispatch.post(context.supabase, context.userId, data);
  });
// Transfers
export const wmsListTransfers = auth().inputValidator((d: { company_id: string; status?: string; warehouse_id?: string; limit?: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsListTransfers", source: "api", module: "wms.wmsListTransfers" });
    return transfers.list(context.supabase, data.company_id, data);
  });export const wmsGetTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsGetTransfer", source: "api", module: "wms.wmsGetTransfer" });
    return transfers.get(context.supabase, data.id);
  });export const wmsCreateTransfer = auth().inputValidator((d: Parameters<typeof transfers.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCreateTransfer", source: "api", module: "wms.wmsCreateTransfer" });
    return transfers.create(context.supabase, context.userId, data);
  });export const wmsShipTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsShipTransfer", source: "api", module: "wms.wmsShipTransfer" });
    return transfers.ship(context.supabase, context.userId, data.id);
  });export const wmsReceiveTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsReceiveTransfer", source: "api", module: "wms.wmsReceiveTransfer" });
    return transfers.receive(context.supabase, context.userId, data.id);
  });export const wmsCancelTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCancelTransfer", source: "api", module: "wms.wmsCancelTransfer" });
    return transfers.cancel(context.supabase, context.userId, data.id);
  });
// Reservations
export const wmsListReservations = auth().inputValidator((d: Parameters<typeof reservations.list>[2] & { company_id: string }) => d)
  .handler(async ({ data, context }) => reservations.list(context.supabase, data.company_id, data));
export const wmsCreateReservation = auth().inputValidator((d: Parameters<typeof reservations.create>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCreateReservation", source: "api", module: "wms.wmsCreateReservation" });
    return reservations.create(context.supabase, context.userId, data);
  });export const wmsReleaseReservation = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsReleaseReservation", source: "api", module: "wms.wmsReleaseReservation" });
    return reservations.release(context.supabase, context.userId, data.id);
  });export const wmsFulfillReservation = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsFulfillReservation", source: "api", module: "wms.wmsFulfillReservation" });
    return reservations.fulfill(context.supabase, context.userId, data.id);
  });
// Cycle counts
export const wmsListCounts = auth().inputValidator((d: { company_id: string; warehouse_id?: string; status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => counts.list(context.supabase, data.company_id, data));
export const wmsGetCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => counts.get(context.supabase, data.id));
export const wmsScheduleCount = auth().inputValidator((d: Parameters<typeof counts.schedule>[2]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsScheduleCount", source: "api", module: "wms.wmsScheduleCount" });
    return counts.schedule(context.supabase, context.userId, data);
  });export const wmsStartCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsStartCount", source: "api", module: "wms.wmsStartCount" });
    return counts.start(context.supabase, data.id);
  });export const wmsRecordCountItem = auth().inputValidator((d: { item_id: string; counted_qty: number; reason?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsRecordCountItem", source: "api", module: "wms.wmsRecordCountItem" });
    return counts.recordCount(context.supabase, data.item_id, data.counted_qty, data.reason);
  });export const wmsCompleteCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsCompleteCount", source: "api", module: "wms.wmsCompleteCount" });
    return counts.complete(context.supabase, context.userId, data.id);
  });export const wmsApproveCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsApproveCount", source: "api", module: "wms.wmsApproveCount" });
    return counts.approve(context.supabase, context.userId, data.id);
  });
// Thresholds
export const wmsListThresholds = auth().inputValidator((d: { company_id: string; product_id?: string; warehouse_id?: string }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsListThresholds", source: "api", module: "wms.wmsListThresholds" });
    return thresholds.list(context.supabase, data.company_id, data);
  });export const wmsUpsertThreshold = auth().inputValidator((d: Parameters<typeof thresholds.upsert>[1]) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsUpsertThreshold", source: "api", module: "wms.wmsUpsertThreshold" });
    return thresholds.upsert(context.supabase, data);
  });
// Analytics / dashboard
export const wmsAnalyticsOverview = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => analytics.overview(context.supabase, data.company_id));
export const wmsMovementVelocity = auth().inputValidator((d: { company_id: string; days?: number }) => d)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "wmsMovementVelocity", source: "api", module: "wms.wmsMovementVelocity" });
    return analytics.movementVelocity(context.supabase, data.company_id, data.days ?? 30);
  });