/**
 * R191 Batch 2 — Customer / Order / Inventory / Warehouse Runtime Extension
 *
 * Extends the existing canonical Business OS runtime. No new tables, no new
 * dashboard, no duplicate runtime. Every mutation flows through:
 *
 *   Founder → adoptToCanonicalPipeline → withBrain → Impact →
 *   (Approval if threshold) → Audit → Execution → Mission Control
 *
 * Canonical owners reused:
 *   persistence: public.customers, public.sales_orders, public.purchase_orders,
 *                public.inventory_transactions, public.stock_transfers,
 *                public.stock_transfer_items, public.goods_receipts,
 *                public.goods_receipt_items, public.audit_logs
 *   approvals:   requestFounderApproval (R158)
 *   audit:       writeCanonicalAudit → public.write_audit
 *   auth/RLS:    requireSupabaseAuth + is_company_member
 */
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const FOUNDER_APPROVAL_THRESHOLD_CENTS = 10_00_00_00; // ₹1,00,000

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type Result = {
  status: "created" | "updated" | "pending_approval" | "ok";
  entity_id?: string;
  approval_id?: string;
  reason?: string;
  data?: JsonValue;
};

// =================================================================
// 1. Customer Profile Update
// =================================================================
const CustomerProfileInput = z.object({
  company_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  tax_id: z.string().max(80).nullable().optional(),
  status: z.enum(["active", "pending", "suspended", "archived"]).optional(),
});
export const bizUpdateCustomerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CustomerProfileInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "customer", capability: "update_profile", user_id: context.userId, company_id: data.company_id, summary: `update customer ${data.customer_id}` });
    const patch: Database["public"]["Tables"]["customers"]["Update"] = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.tax_id !== undefined) patch.tax_id = data.tax_id;
    if (data.status !== undefined) patch.status = data.status;
    const { data: row, error } = await supabase.from("customers").update(patch).eq("id", data.customer_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`customer_update_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.customer", action: "update_profile", entity_type: "customer", entity_id: data.customer_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "crm" } });
    return { status: "updated", entity_id: data.customer_id };
  });

// =================================================================
// 2. Customer Address Update
// =================================================================
const AddressShape = z.object({
  line1: z.string().max(200).optional(),
  line2: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  postal_code: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
});
const CustomerAddressInput = z.object({
  company_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  billing_address: AddressShape.optional(),
  shipping_address: AddressShape.optional(),
});
export const bizUpdateCustomerAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CustomerAddressInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "customer", capability: "update_address", user_id: context.userId, company_id: data.company_id, summary: `address ${data.customer_id}` });
    const patch: Database["public"]["Tables"]["customers"]["Update"] = {};
    if (data.billing_address) patch.billing_address = data.billing_address as never;
    if (data.shipping_address) patch.shipping_address = data.shipping_address as never;
    const { data: row, error } = await supabase.from("customers").update(patch).eq("id", data.customer_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`customer_address_update_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.customer", action: "update_address", entity_type: "customer", entity_id: data.customer_id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "crm" } });
    return { status: "updated", entity_id: data.customer_id };
  });

// =================================================================
// 3. Sales Order Status Transition
// =================================================================
const OrderStatusInput = z.object({
  company_id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
  next_status: z.enum(["active", "pending", "archived"]),
  note: z.string().max(500).optional(),
});
export const bizSalesOrderTransition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OrderStatusInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "sales_order", capability: "transition", user_id: context.userId, company_id: data.company_id, summary: `so ${data.sales_order_id} → ${data.next_status}`, metadata: { next_status: data.next_status } });
    const { data: before } = await supabase.from("sales_orders").select("*").eq("id", data.sales_order_id).eq("company_id", data.company_id).single();
    const { data: row, error } = await supabase.from("sales_orders").update({ status: data.next_status }).eq("id", data.sales_order_id).eq("company_id", data.company_id).select("*").single();
    if (error) throw new Error(`sales_order_transition_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.sales_order", action: "transition", entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id, before, after: row, severity: "notice", metadata: { module: "sales", next_status: data.next_status, note: data.note } });
    return { status: "updated", entity_id: data.sales_order_id };
  });

// =================================================================
// 4. Sales Order Timeline (read-only from audit_logs)
// =================================================================
const TimelineInput = z.object({
  company_id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
  limit: z.number().int().min(1).max(200).default(50),
});
export const bizSalesOrderTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TimelineInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase.from("audit_logs")
      .select("id, category, action, severity, metadata, before_data, after_data, created_at")
      .eq("entity_type", "sales_order").eq("entity_id", data.sales_order_id).eq("company_id", data.company_id)
      .order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(`timeline_read_failed: ${error.message}`);
    return { status: "ok", data: rows };
  });

// =================================================================
// 5. Sales Order Tracking (order row + inventory movements)
// =================================================================
const TrackInput = z.object({
  company_id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
});
export const bizSalesOrderTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TrackInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const [orderRes, txnRes] = await Promise.all([
      supabase.from("sales_orders").select("*").eq("id", data.sales_order_id).eq("company_id", data.company_id).maybeSingle(),
      supabase.from("inventory_transactions").select("id, txn_type, qty_delta, balance_after, ref_type, ref_id, ref_number, warehouse_id, product_id, created_at").eq("company_id", data.company_id).eq("ref_type", "sales_order").eq("ref_id", data.sales_order_id).order("created_at", { ascending: false }).limit(200),
    ]);
    return { status: "ok", data: { order: orderRes.data, movements: txnRes.data ?? [] } };
  });

// =================================================================
// 6. Inventory Stock Adjustment
// =================================================================
const AdjustInput = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  bin_id: z.string().uuid().nullable().optional(),
  lot_id: z.string().uuid().nullable().optional(),
  qty_delta: z.number(),
  unit_cost: z.number().nullable().optional(),
  reason: z.string().min(1).max(200),
  value_cents: z.number().int().nonnegative().optional(),
});
export const bizInventoryAdjust = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AdjustInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "inventory", capability: "adjust", user_id: context.userId, company_id: data.company_id, summary: `adjust ${data.qty_delta} · ${data.reason}`, metadata: { product_id: data.product_id, warehouse_id: data.warehouse_id } });
    if ((data.value_cents ?? 0) >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "business.inventory_adjust",
          entity_id: crypto.randomUUID(),
          title: `Inventory adjustment · ${data.qty_delta} · ${data.reason}`,
          amount_cents: data.value_cents,
          currency: "INR",
          metadata: { source: "business_os.inventory_adjust", payload: data, threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS },
        },
      });
      return { status: "pending_approval", approval_id: approval.id, reason: "value_exceeds_founder_threshold" };
    }
    const { data: row, error } = await supabase.from("inventory_transactions").insert({
      company_id: data.company_id, txn_type: "adjustment", product_id: data.product_id, warehouse_id: data.warehouse_id,
      bin_id: data.bin_id ?? null, lot_id: data.lot_id ?? null, qty_delta: data.qty_delta, balance_after: 0,
      unit_cost: data.unit_cost ?? null, ref_type: "manual_adjustment", actor_id: context.userId, notes: data.reason,
    }).select("*").single();
    if (error) throw new Error(`inventory_adjust_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.inventory", action: "adjust", entity_type: "inventory_transaction", entity_id: row.id, company_id: data.company_id, after: row, severity: "notice", metadata: { module: "inventory", reason: data.reason } });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// 7. Warehouse Allocation (reserve stock)
// =================================================================
const AllocateInput = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  quantity: z.number().positive(),
  sales_order_id: z.string().uuid().nullable().optional(),
});
export const bizWarehouseAllocate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AllocateInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "warehouse", capability: "allocate", user_id: context.userId, company_id: data.company_id, summary: `reserve ${data.quantity}`, metadata: { product_id: data.product_id, warehouse_id: data.warehouse_id } });
    const { data: row, error } = await supabase.from("inventory_transactions").insert({
      company_id: data.company_id, txn_type: "reserve", product_id: data.product_id, warehouse_id: data.warehouse_id,
      qty_delta: -Math.abs(data.quantity), balance_after: 0, actor_id: context.userId,
      ref_type: data.sales_order_id ? "sales_order" : "reservation", ref_id: data.sales_order_id ?? null,
    }).select("*").single();
    if (error) throw new Error(`allocate_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.warehouse", action: "allocate", entity_type: "inventory_transaction", entity_id: row.id, company_id: data.company_id, after: row, severity: "info", metadata: { module: "warehouse" } });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// 8. Warehouse Transfer — Create
// =================================================================
const TransferCreateInput = z.object({
  company_id: z.string().uuid(),
  number: z.string().min(1).max(80),
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().positive(), lot_id: z.string().uuid().nullable().optional() })).min(1),
  notes: z.string().max(1000).nullable().optional(),
});
export const bizWarehouseTransferCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TransferCreateInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "warehouse", capability: "transfer_create", user_id: context.userId, company_id: data.company_id, summary: `transfer ${data.number}` });
    const { data: transfer, error } = await supabase.from("stock_transfers").insert({
      company_id: data.company_id, number: data.number, from_warehouse_id: data.from_warehouse_id,
      to_warehouse_id: data.to_warehouse_id, status: "draft", notes: data.notes ?? null, created_by: context.userId,
    }).select("*").single();
    if (error || !transfer) throw new Error(`transfer_create_failed: ${error?.message}`);
    const itemsPayload = data.items.map((it) => ({ transfer_id: transfer.id, product_id: it.product_id, quantity: it.quantity, lot_id: it.lot_id ?? null }));
    const { error: itemsErr } = await supabase.from("stock_transfer_items").insert(itemsPayload);
    if (itemsErr) throw new Error(`transfer_items_failed: ${itemsErr.message}`);
    await writeCanonicalAudit(supabase, { category: "business.warehouse", action: "transfer_create", entity_type: "stock_transfer", entity_id: transfer.id, company_id: data.company_id, after: transfer, severity: "notice", metadata: { module: "warehouse", item_count: data.items.length } });
    return { status: "created", entity_id: transfer.id };
  });

// =================================================================
// 9. Warehouse Transfer — Ship
// =================================================================
const TransferShipInput = z.object({ company_id: z.string().uuid(), transfer_id: z.string().uuid() });
export const bizWarehouseTransferShip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TransferShipInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "warehouse", capability: "transfer_ship", user_id: context.userId, company_id: data.company_id, summary: `ship ${data.transfer_id}` });
    const { data: transfer } = await supabase.from("stock_transfers").select("*").eq("id", data.transfer_id).eq("company_id", data.company_id).single();
    if (!transfer) throw new Error("transfer_not_found");
    const { data: items } = await supabase.from("stock_transfer_items").select("*").eq("transfer_id", data.transfer_id);
    const { error: upErr } = await supabase.from("stock_transfers").update({ status: "in_transit", shipped_at: new Date().toISOString(), shipped_by: context.userId }).eq("id", data.transfer_id);
    if (upErr) throw new Error(`transfer_ship_failed: ${upErr.message}`);
    // R195 Batch 9 — batch insert (was N+1 loop)
    const shipTxns = (items ?? []).map((it) => ({
      company_id: data.company_id, txn_type: "transfer_out", product_id: it.product_id,
      warehouse_id: transfer.from_warehouse_id, qty_delta: -Math.abs(Number(it.quantity)), balance_after: 0,
      lot_id: it.lot_id ?? null, ref_type: "stock_transfer", ref_id: data.transfer_id, ref_number: transfer.number, actor_id: context.userId,
    }));
    if (shipTxns.length) await supabase.from("inventory_transactions").insert(shipTxns);

    await writeCanonicalAudit(supabase, { category: "business.warehouse", action: "transfer_ship", entity_type: "stock_transfer", entity_id: data.transfer_id, company_id: data.company_id, severity: "notice", metadata: { module: "warehouse" } });
    return { status: "updated", entity_id: data.transfer_id };
  });

// =================================================================
// 10. Warehouse Transfer — Receive
// =================================================================
export const bizWarehouseTransferReceive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TransferShipInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "warehouse", capability: "transfer_receive", user_id: context.userId, company_id: data.company_id, summary: `receive ${data.transfer_id}` });
    const { data: transfer } = await supabase.from("stock_transfers").select("*").eq("id", data.transfer_id).eq("company_id", data.company_id).single();
    if (!transfer) throw new Error("transfer_not_found");
    const { data: items } = await supabase.from("stock_transfer_items").select("*").eq("transfer_id", data.transfer_id);
    const { error: upErr } = await supabase.from("stock_transfers").update({ status: "received", received_at: new Date().toISOString(), received_by: context.userId }).eq("id", data.transfer_id);
    if (upErr) throw new Error(`transfer_receive_failed: ${upErr.message}`);
    // R195 Batch 9 — batch insert (was N+1 loop)
    const recvTxns = (items ?? []).map((it) => ({
      company_id: data.company_id, txn_type: "transfer_in", product_id: it.product_id,
      warehouse_id: transfer.to_warehouse_id, qty_delta: Math.abs(Number(it.quantity_received ?? it.quantity)), balance_after: 0,
      lot_id: it.lot_id ?? null, ref_type: "stock_transfer", ref_id: data.transfer_id, ref_number: transfer.number, actor_id: context.userId,
    }));
    if (recvTxns.length) await supabase.from("inventory_transactions").insert(recvTxns);

    await writeCanonicalAudit(supabase, { category: "business.warehouse", action: "transfer_receive", entity_type: "stock_transfer", entity_id: data.transfer_id, company_id: data.company_id, severity: "notice", metadata: { module: "warehouse" } });
    return { status: "updated", entity_id: data.transfer_id };
  });

// =================================================================
// 11. Purchase Receive (goods_receipts + inventory_transactions receive)
// =================================================================
const PurchaseReceiveInput = z.object({
  company_id: z.string().uuid(),
  purchase_order_id: z.string().uuid(),
  number: z.string().min(1).max(80),
  warehouse_id: z.string().uuid(),
  items: z.array(z.object({ product_id: z.string().uuid(), po_item_id: z.string().uuid().nullable().optional(), description: z.string().max(500).nullable().optional(), quantity_received: z.number().nonnegative(), quantity_rejected: z.number().nonnegative().default(0), unit_cost: z.number().nullable().optional() })).min(1),
  notes: z.string().max(1000).nullable().optional(),
});
export const bizPurchaseReceive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PurchaseReceiveInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "purchase", capability: "receive", user_id: context.userId, company_id: data.company_id, summary: `grn ${data.number}`, metadata: { po: data.purchase_order_id } });
    const { data: receipt, error } = await supabase.from("goods_receipts").insert({
      company_id: data.company_id, purchase_order_id: data.purchase_order_id, number: data.number,
      received_by: context.userId, status: "received", notes: data.notes ?? null,
    }).select("*").single();
    if (error || !receipt) throw new Error(`grn_create_failed: ${error?.message}`);
    const itemRows = data.items.map((it) => ({
      receipt_id: receipt.id, po_item_id: it.po_item_id ?? null, description: it.description ?? null,
      quantity_received: it.quantity_received, quantity_rejected: it.quantity_rejected,
    }));
    await supabase.from("goods_receipt_items").insert(itemRows);
    // R195 Batch 9 — batch insert (was N+1 loop)
    const poTxns = data.items
      .filter((it) => it.quantity_received > 0)
      .map((it) => ({
        company_id: data.company_id, txn_type: "receive", product_id: it.product_id, warehouse_id: data.warehouse_id,
        qty_delta: it.quantity_received, balance_after: 0, unit_cost: it.unit_cost ?? null,
        ref_type: "goods_receipt", ref_id: receipt.id, ref_number: receipt.number, actor_id: context.userId,
      }));
    if (poTxns.length) await supabase.from("inventory_transactions").insert(poTxns);

    await supabase.from("purchase_orders").update({ received_at: new Date().toISOString() }).eq("id", data.purchase_order_id).eq("company_id", data.company_id);
    await writeCanonicalAudit(supabase, { category: "business.purchase", action: "receive", entity_type: "goods_receipt", entity_id: receipt.id, company_id: data.company_id, after: receipt, severity: "notice", metadata: { module: "purchase", po_id: data.purchase_order_id } });
    return { status: "created", entity_id: receipt.id };
  });

// =================================================================
// 12. Sales Dispatch (issue stock + mark fulfilled)
// =================================================================
const DispatchInput = z.object({
  company_id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().positive(), unit_cost: z.number().nullable().optional() })).min(1),
});
export const bizSalesDispatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DispatchInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "sales", capability: "dispatch", user_id: context.userId, company_id: data.company_id, summary: `dispatch ${data.sales_order_id}` });
    const { data: order } = await supabase.from("sales_orders").select("number").eq("id", data.sales_order_id).eq("company_id", data.company_id).single();
    // R195 Batch 9 — batch insert (was N+1 loop)
    const dispatchTxns = data.items.map((it) => ({
      company_id: data.company_id, txn_type: "issue", product_id: it.product_id, warehouse_id: data.warehouse_id,
      qty_delta: -Math.abs(it.quantity), balance_after: 0, unit_cost: it.unit_cost ?? null,
      ref_type: "sales_order", ref_id: data.sales_order_id, ref_number: order?.number ?? null, actor_id: context.userId,
    }));
    if (dispatchTxns.length) await supabase.from("inventory_transactions").insert(dispatchTxns);

    await supabase.from("sales_orders").update({ fulfilled_at: new Date().toISOString() }).eq("id", data.sales_order_id).eq("company_id", data.company_id);
    await writeCanonicalAudit(supabase, { category: "business.sales_order", action: "dispatch", entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id, severity: "notice", metadata: { module: "sales", item_count: data.items.length } });
    return { status: "updated", entity_id: data.sales_order_id };
  });

// =================================================================
// 13. Returns
// =================================================================
const ReturnInput = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  quantity: z.number().positive(),
  ref_type: z.enum(["sales_order", "purchase_order"]),
  ref_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
export const bizInventoryReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReturnInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "inventory", capability: "return", user_id: context.userId, company_id: data.company_id, summary: `return ${data.quantity} · ${data.ref_type}`, metadata: { ref_id: data.ref_id } });
    const sign = data.ref_type === "sales_order" ? 1 : -1; // customer return → stock in; supplier return → stock out
    const { data: row, error } = await supabase.from("inventory_transactions").insert({
      company_id: data.company_id, txn_type: "return", product_id: data.product_id, warehouse_id: data.warehouse_id,
      qty_delta: sign * Math.abs(data.quantity), balance_after: 0,
      ref_type: data.ref_type, ref_id: data.ref_id, actor_id: context.userId, notes: data.reason ?? null,
    }).select("*").single();
    if (error) throw new Error(`return_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, { category: "business.inventory", action: "return", entity_type: "inventory_transaction", entity_id: row.id, company_id: data.company_id, after: row, severity: "notice", metadata: { module: "inventory", ref_type: data.ref_type } });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// 14. Inventory Analytics (aggregate movement over window)
// =================================================================
const AnalyticsInput = z.object({
  company_id: z.string().uuid(),
  days: z.number().int().min(1).max(365).default(30),
});
export const bizInventoryAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { data: rows, error } = await supabase.from("inventory_transactions")
      .select("txn_type, qty_delta, warehouse_id, product_id, created_at")
      .eq("company_id", data.company_id).gte("created_at", since).limit(5000);
    if (error) throw new Error(`analytics_failed: ${error.message}`);
    const byType: Record<string, { count: number; qty: number }> = {};
    const byWarehouse: Record<string, { count: number; qty: number }> = {};
    for (const r of rows ?? []) {
      const t = String(r.txn_type);
      const w = String(r.warehouse_id);
      const q = Number(r.qty_delta);
      byType[t] ??= { count: 0, qty: 0 };
      byType[t].count++; byType[t].qty += q;
      byWarehouse[w] ??= { count: 0, qty: 0 };
      byWarehouse[w].count++; byWarehouse[w].qty += q;
    }
    return { status: "ok", data: { days: data.days, total_movements: rows?.length ?? 0, by_type: byType, by_warehouse: byWarehouse } };
  });

// =================================================================
// 15. Warehouse Reports (per-warehouse position summary)
// =================================================================
const ReportInput = z.object({ company_id: z.string().uuid() });
export const bizWarehouseReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReportInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    const [wh, lots, transfers] = await Promise.all([
      supabase.from("warehouses").select("id, code, name, status").eq("company_id", data.company_id).limit(200),
      supabase.from("inventory_lots").select("warehouse_id, quantity, status").eq("company_id", data.company_id).limit(2000),
      supabase.from("stock_transfers").select("id, status, from_warehouse_id, to_warehouse_id, created_at").eq("company_id", data.company_id).order("created_at", { ascending: false }).limit(100),
    ]);
    const positions: Record<string, { units: number; lots: number }> = {};
    for (const l of lots.data ?? []) {
      const w = String(l.warehouse_id);
      positions[w] ??= { units: 0, lots: 0 };
      positions[w].units += Number(l.quantity ?? 0);
      positions[w].lots += 1;
    }
    return { status: "ok", data: { warehouses: wh.data ?? [], positions, transfers: transfers.data ?? [] } };
  });
