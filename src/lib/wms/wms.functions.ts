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
  .handler(async ({ data, context }) => zones.create(context.supabase, data));
export const wmsUpdateZone = auth().inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => zones.update(context.supabase, data.id, data.patch));
export const wmsDeleteZone = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => zones.remove(context.supabase, data.id));

// Bins
export const wmsListBins = auth().inputValidator((d: { warehouse_id: string; zone_id?: string }) => d)
  .handler(async ({ data, context }) => bins.list(context.supabase, data.warehouse_id, data.zone_id));
export const wmsCreateBin = auth().inputValidator((d: Parameters<typeof bins.create>[1]) => d)
  .handler(async ({ data, context }) => bins.create(context.supabase, data));
export const wmsUpdateBin = auth().inputValidator((d: { id: string; patch: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => bins.update(context.supabase, data.id, data.patch));
export const wmsDeleteBin = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => bins.remove(context.supabase, data.id));

// Lots
export const wmsListLots = auth().inputValidator((d: Parameters<typeof lots.list>[2] & { company_id: string }) => d)
  .handler(async ({ data, context }) => lots.list(context.supabase, data.company_id, data));
export const wmsCreateLot = auth().inputValidator((d: Parameters<typeof lots.create>[1]) => d)
  .handler(async ({ data, context }) => lots.create(context.supabase, data));
export const wmsSetLotStatus = auth().inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => lots.setStatus(context.supabase, data.id, data.status));

// Movements (immutable ledger)
export const wmsListMovements = auth().inputValidator((d: { company_id: string; product_id?: string; warehouse_id?: string; txn_type?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => movements.list(context.supabase, data.company_id, data));
export const wmsAdjustStock = auth().inputValidator((d: {
  company_id: string; product_id: string; warehouse_id: string; qty_delta: number;
  bin_id?: string; lot_id?: string; reason?: string; unit_cost?: number;
}) => d).handler(async ({ data, context }) => movements.record(context.supabase, context.userId, {
  company_id: data.company_id, txn_type: "adjustment",
  product_id: data.product_id, warehouse_id: data.warehouse_id,
  bin_id: data.bin_id, lot_id: data.lot_id, qty_delta: data.qty_delta,
  unit_cost: data.unit_cost, notes: data.reason, ref_type: "manual",
}));

// Receiving
export const wmsPostReceipt = auth().inputValidator((d: Parameters<typeof receiving.postReceipt>[2]) => d)
  .handler(async ({ data, context }) => receiving.postReceipt(context.supabase, context.userId, data));

// Dispatch
export const wmsPostDispatch = auth().inputValidator((d: Parameters<typeof dispatch.post>[2]) => d)
  .handler(async ({ data, context }) => dispatch.post(context.supabase, context.userId, data));

// Transfers
export const wmsListTransfers = auth().inputValidator((d: { company_id: string; status?: string; warehouse_id?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => transfers.list(context.supabase, data.company_id, data));
export const wmsGetTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => transfers.get(context.supabase, data.id));
export const wmsCreateTransfer = auth().inputValidator((d: Parameters<typeof transfers.create>[2]) => d)
  .handler(async ({ data, context }) => transfers.create(context.supabase, context.userId, data));
export const wmsShipTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => transfers.ship(context.supabase, context.userId, data.id));
export const wmsReceiveTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => transfers.receive(context.supabase, context.userId, data.id));
export const wmsCancelTransfer = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => transfers.cancel(context.supabase, context.userId, data.id));

// Reservations
export const wmsListReservations = auth().inputValidator((d: Parameters<typeof reservations.list>[2] & { company_id: string }) => d)
  .handler(async ({ data, context }) => reservations.list(context.supabase, data.company_id, data));
export const wmsCreateReservation = auth().inputValidator((d: Parameters<typeof reservations.create>[2]) => d)
  .handler(async ({ data, context }) => reservations.create(context.supabase, context.userId, data));
export const wmsReleaseReservation = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => reservations.release(context.supabase, context.userId, data.id));
export const wmsFulfillReservation = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => reservations.fulfill(context.supabase, context.userId, data.id));

// Cycle counts
export const wmsListCounts = auth().inputValidator((d: { company_id: string; warehouse_id?: string; status?: string; limit?: number }) => d)
  .handler(async ({ data, context }) => counts.list(context.supabase, data.company_id, data));
export const wmsGetCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => counts.get(context.supabase, data.id));
export const wmsScheduleCount = auth().inputValidator((d: Parameters<typeof counts.schedule>[2]) => d)
  .handler(async ({ data, context }) => counts.schedule(context.supabase, context.userId, data));
export const wmsStartCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => counts.start(context.supabase, data.id));
export const wmsRecordCountItem = auth().inputValidator((d: { item_id: string; counted_qty: number; reason?: string }) => d)
  .handler(async ({ data, context }) => counts.recordCount(context.supabase, data.item_id, data.counted_qty, data.reason));
export const wmsCompleteCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => counts.complete(context.supabase, context.userId, data.id));
export const wmsApproveCount = auth().inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => counts.approve(context.supabase, context.userId, data.id));

// Thresholds
export const wmsListThresholds = auth().inputValidator((d: { company_id: string; product_id?: string; warehouse_id?: string }) => d)
  .handler(async ({ data, context }) => thresholds.list(context.supabase, data.company_id, data));
export const wmsUpsertThreshold = auth().inputValidator((d: Parameters<typeof thresholds.upsert>[1]) => d)
  .handler(async ({ data, context }) => thresholds.upsert(context.supabase, data));

// Analytics / dashboard
export const wmsAnalyticsOverview = auth().inputValidator((d: { company_id: string }) => d)
  .handler(async ({ data, context }) => analytics.overview(context.supabase, data.company_id));
export const wmsMovementVelocity = auth().inputValidator((d: { company_id: string; days?: number }) => d)
  .handler(async ({ data, context }) => analytics.movementVelocity(context.supabase, data.company_id, data.days ?? 30));
