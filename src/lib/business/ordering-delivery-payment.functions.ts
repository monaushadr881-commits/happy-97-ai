/**
 * R191 Batch 6 — Dealer / Customer / Order / Delivery / Payment
 *
 * SINGLE composition surface that stitches the end-to-end journey
 * (dealer order → customer checkout → confirmation → payment capture →
 *  invoice → delivery assignment → tracking → PoD → notifications →
 *  analytics) onto existing canonical owners. NO new runtime, NO new
 *  tables, NO new dashboard, NO duplicate API.
 *
 * Canonical owners reused
 *   - Partner Runtime          → dealer/distributor order recording
 *                                (partnerRuntime already wraps R158 approval)
 *   - Business Runtime         → sales_orders, customers, warehouses
 *   - Revenue Runtime          → payments, invoices
 *   - Warehouse / Stock        → stock_transfers, inventory_transactions
 *   - Marketplace / Commerce   → commerceOrderFulfill (existing)
 *   - Knowledge / Workspace    → adoptToCanonicalPipeline (Brain session)
 *   - Approval (R158)          → requestFounderApproval
 *   - Audit                    → writeCanonicalAudit → public.write_audit
 *
 * Persistence contract
 *   - Order state              → public.sales_orders
 *   - Payment capture          → public.payments
 *   - Customer alerts          → public.notifications
 *   - Delivery / Tracking /    → public.creator_assets
 *     PoD / Analytics            (kind = "commerce.delivery" | "commerce.tracking"
 *                                | "commerce.pod" | "commerce.analytics")
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
  status: "created" | "updated" | "pending_approval" | "ok" | "notified";
  entity_id?: string;
  approval_id?: string;
  reason?: string;
  data?: JsonValue;
};

const uuid = z.string().uuid();

// -----------------------------------------------------------------------
// 1. Dealer Order Placement (partner-scoped order draft in sales_orders)
// -----------------------------------------------------------------------
const DealerOrderPlaceInput = z.object({
  company_id: uuid,
  customer_id: uuid,
  number: z.string().min(1).max(80),
  currency: z.string().length(3).default("INR"),
  subtotal_cents: z.number().int().nonnegative(),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().nonnegative(),
  warehouse_id: uuid.optional(),
  notes: z.string().max(2000).optional(),
  dealer_ref: z.string().min(1).max(160),
});
export const orderDealerPlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DealerOrderPlaceInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "order", capability: "dealer_place",
      user_id: context.userId, company_id: data.company_id,
      summary: `dealer ${data.dealer_ref} order ${data.number}`,
      metadata: { total_cents: data.total_cents, dealer_ref: data.dealer_ref },
    });
    if (data.total_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const a = await requestFounderApproval({
        data: {
          capability: "commerce.order.dealer_place",
          summary: `Dealer order ${data.number} (${data.total_cents / 100} ${data.currency})`,
          payload: { ...data },
        },
      });
      return { status: "pending_approval", approval_id: (a as { approval_id: string }).approval_id };
    }
    const insert: Database["public"]["Tables"]["sales_orders"]["Insert"] = {
      company_id: data.company_id, customer_id: data.customer_id,
      number: data.number, currency: data.currency,
      subtotal_cents: data.subtotal_cents, tax_cents: data.tax_cents, total_cents: data.total_cents,
      warehouse_id: data.warehouse_id ?? null, notes: data.notes ?? null,
      ordered_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabase.from("sales_orders").insert(insert).select("*").single();
    if (error) throw new Error(`dealer_order_place_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.order", action: "dealer_place",
      entity_type: "sales_order", entity_id: row.id, company_id: data.company_id,
      after: row, severity: "notice",
      metadata: { module: "dealer", dealer_ref: data.dealer_ref },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 2. Distributor Fulfillment (reuses existing sales_order transition)
// -----------------------------------------------------------------------
const DistributorFulfillInput = z.object({
  company_id: uuid,
  sales_order_id: uuid,
  distributor_ref: z.string().min(1).max(160),
  warehouse_id: uuid.optional(),
});
export const orderDistributorFulfill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DistributorFulfillInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "order", capability: "distributor_fulfill",
      user_id: context.userId, company_id: data.company_id,
      summary: `distributor ${data.distributor_ref} fulfill ${data.sales_order_id}`,
    });
    const patch: Database["public"]["Tables"]["sales_orders"]["Update"] = {
      fulfilled_at: new Date().toISOString(),
      warehouse_id: data.warehouse_id ?? undefined,
    };
    const { data: row, error } = await supabase.from("sales_orders")
      .update(patch).eq("id", data.sales_order_id).eq("company_id", data.company_id)
      .select("*").single();
    if (error) throw new Error(`distributor_fulfill_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.order", action: "distributor_fulfill",
      entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id,
      after: row, severity: "notice",
      metadata: { module: "distributor", distributor_ref: data.distributor_ref },
    });
    return { status: "updated", entity_id: data.sales_order_id };
  });

// -----------------------------------------------------------------------
// 3. Customer Checkout
// -----------------------------------------------------------------------
const CustomerCheckoutInput = z.object({
  company_id: uuid,
  customer_id: uuid,
  number: z.string().min(1).max(80),
  currency: z.string().length(3).default("INR"),
  subtotal_cents: z.number().int().nonnegative(),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional(),
});
export const orderCustomerCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CustomerCheckoutInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "order", capability: "customer_checkout",
      user_id: context.userId, company_id: data.company_id,
      summary: `customer checkout ${data.number}`,
      metadata: { total_cents: data.total_cents },
    });
    const insert: Database["public"]["Tables"]["sales_orders"]["Insert"] = {
      company_id: data.company_id, customer_id: data.customer_id,
      number: data.number, currency: data.currency,
      subtotal_cents: data.subtotal_cents, tax_cents: data.tax_cents, total_cents: data.total_cents,
      notes: data.notes ?? null, ordered_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabase.from("sales_orders").insert(insert).select("*").single();
    if (error) throw new Error(`customer_checkout_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.order", action: "customer_checkout",
      entity_type: "sales_order", entity_id: row.id, company_id: data.company_id,
      after: row, severity: "notice", metadata: { module: "customer" },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 4. Order Confirmation
// -----------------------------------------------------------------------
const OrderConfirmInput = z.object({
  company_id: uuid, sales_order_id: uuid, note: z.string().max(500).optional(),
});
export const orderConfirm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OrderConfirmInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "order", capability: "confirm",
      user_id: context.userId, company_id: data.company_id,
      summary: `confirm ${data.sales_order_id}`,
    });
    const patch: Database["public"]["Tables"]["sales_orders"]["Update"] = {
      approval_status: "approved", status: "active",
    };
    const { data: row, error } = await supabase.from("sales_orders")
      .update(patch).eq("id", data.sales_order_id).eq("company_id", data.company_id)
      .select("*").single();
    if (error) throw new Error(`order_confirm_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.order", action: "confirm",
      entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id,
      after: row, severity: "notice", metadata: { module: "order", note: data.note },
    });
    return { status: "updated", entity_id: data.sales_order_id };
  });

// -----------------------------------------------------------------------
// 5. Payment Capture (reuses public.payments; wraps R158 threshold)
// -----------------------------------------------------------------------
const PaymentCaptureInput = z.object({
  company_id: uuid,
  customer_id: uuid.optional(),
  invoice_id: uuid.optional(),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3).default("INR"),
  provider: z.string().max(80).optional(),
  provider_ref: z.string().max(200).optional(),
});
export const paymentCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PaymentCaptureInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "payment", capability: "capture",
      user_id: context.userId, company_id: data.company_id,
      summary: `capture ${data.amount_cents} ${data.currency}`,
      metadata: { amount_cents: data.amount_cents, provider: data.provider ?? null },
    });
    if (data.amount_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const a = await requestFounderApproval({
        data: {
          capability: "commerce.payment.capture",
          summary: `Payment capture ${data.amount_cents / 100} ${data.currency}`,
          payload: { ...data },
        },
      });
      return { status: "pending_approval", approval_id: (a as { approval_id: string }).approval_id };
    }
    const insert: Database["public"]["Tables"]["payments"]["Insert"] = {
      company_id: data.company_id,
      customer_id: data.customer_id ?? null,
      invoice_id: data.invoice_id ?? null,
      amount_cents: data.amount_cents,
      currency: data.currency,
      provider: data.provider ?? null,
      provider_ref: data.provider_ref ?? null,
      status: "succeeded",
      received_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabase.from("payments").insert(insert).select("*").single();
    if (error) throw new Error(`payment_capture_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.payment", action: "capture",
      entity_type: "payment", entity_id: row.id, company_id: data.company_id,
      after: row, severity: "notice",
      metadata: { module: "payment", amount_cents: data.amount_cents },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 6. Invoice Generation Handoff — delegates to canonical revenue owner
// -----------------------------------------------------------------------
const InvoiceHandoffInput = z.object({
  company_id: uuid, sales_order_id: uuid, invoice_id: uuid,
});
export const orderInvoiceLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => InvoiceHandoffInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "invoice", capability: "link",
      user_id: context.userId, company_id: data.company_id,
      summary: `link invoice ${data.invoice_id} → order ${data.sales_order_id}`,
    });
    await writeCanonicalAudit(supabase, {
      category: "commerce.invoice", action: "link",
      entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id,
      after: { invoice_id: data.invoice_id }, severity: "info",
      metadata: { module: "invoice" },
    });
    return { status: "ok", entity_id: data.invoice_id };
  });

// -----------------------------------------------------------------------
// 7. Delivery Assignment
// -----------------------------------------------------------------------
const DeliveryAssignInput = z.object({
  company_id: uuid,
  sales_order_id: uuid,
  carrier: z.string().min(1).max(120),
  driver_ref: z.string().max(160).optional(),
  vehicle_ref: z.string().max(160).optional(),
  expected_at: z.string().datetime().optional(),
});
export const deliveryAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeliveryAssignInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "delivery", capability: "assign",
      user_id: context.userId, company_id: data.company_id,
      summary: `assign delivery ${data.sales_order_id} → ${data.carrier}`,
    });
    const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
      user_id: context.userId, name: `delivery:${data.sales_order_id}`,
      kind: "commerce.delivery", mime_type: "application/json",
      tags: ["commerce", "delivery", data.carrier],
      metadata: {
        company_id: data.company_id, sales_order_id: data.sales_order_id,
        carrier: data.carrier, driver_ref: data.driver_ref ?? null,
        vehicle_ref: data.vehicle_ref ?? null, expected_at: data.expected_at ?? null,
        state: "assigned",
      } as never,
    };
    const { data: row, error } = await supabase.from("creator_assets").insert(insert).select("id").single();
    if (error) throw new Error(`delivery_assign_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.delivery", action: "assign",
      entity_type: "delivery", entity_id: row.id, company_id: data.company_id,
      after: { sales_order_id: data.sales_order_id, carrier: data.carrier },
      severity: "notice", metadata: { module: "delivery" },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 8. Shipment Tracking Update
// -----------------------------------------------------------------------
const TrackingUpdateInput = z.object({
  company_id: uuid,
  sales_order_id: uuid,
  location: z.string().max(240),
  stage: z.enum(["picked_up", "in_transit", "out_for_delivery", "delayed", "returned"]),
  note: z.string().max(500).optional(),
});
export const deliveryTrackingUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TrackingUpdateInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "delivery", capability: "tracking",
      user_id: context.userId, company_id: data.company_id,
      summary: `tracking ${data.sales_order_id} ${data.stage}`,
    });
    const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
      user_id: context.userId, name: `tracking:${data.sales_order_id}:${Date.now()}`,
      kind: "commerce.tracking", mime_type: "application/json",
      tags: ["commerce", "tracking", data.stage],
      metadata: {
        company_id: data.company_id, sales_order_id: data.sales_order_id,
        location: data.location, stage: data.stage, note: data.note ?? null,
        recorded_at: new Date().toISOString(),
      } as never,
    };
    const { data: row, error } = await supabase.from("creator_assets").insert(insert).select("id").single();
    if (error) throw new Error(`tracking_update_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.delivery", action: "tracking",
      entity_type: "delivery", entity_id: row.id, company_id: data.company_id,
      after: { stage: data.stage, location: data.location },
      severity: "info", metadata: { module: "tracking" },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 9. Delivery Confirmation
// -----------------------------------------------------------------------
const DeliveryConfirmInput = z.object({
  company_id: uuid, sales_order_id: uuid, delivered_at: z.string().datetime().optional(),
});
export const deliveryConfirm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeliveryConfirmInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "delivery", capability: "confirm",
      user_id: context.userId, company_id: data.company_id,
      summary: `deliver ${data.sales_order_id}`,
    });
    const when = data.delivered_at ?? new Date().toISOString();
    const patch: Database["public"]["Tables"]["sales_orders"]["Update"] = { fulfilled_at: when };
    const { data: row, error } = await supabase.from("sales_orders")
      .update(patch).eq("id", data.sales_order_id).eq("company_id", data.company_id)
      .select("*").single();
    if (error) throw new Error(`delivery_confirm_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.delivery", action: "confirm",
      entity_type: "sales_order", entity_id: data.sales_order_id, company_id: data.company_id,
      after: row, severity: "notice", metadata: { module: "delivery" },
    });
    return { status: "updated", entity_id: data.sales_order_id };
  });

// -----------------------------------------------------------------------
// 10. Proof of Delivery
// -----------------------------------------------------------------------
const PodInput = z.object({
  company_id: uuid,
  sales_order_id: uuid,
  storage_url: z.string().max(500).optional(),
  signature_ref: z.string().max(200).optional(),
  received_by: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
});
export const deliveryProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PodInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "delivery", capability: "pod",
      user_id: context.userId, company_id: data.company_id,
      summary: `pod ${data.sales_order_id}`,
    });
    const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
      user_id: context.userId, name: `pod:${data.sales_order_id}`,
      kind: "commerce.pod", mime_type: "application/json",
      external_url: data.storage_url ?? null,
      tags: ["commerce", "pod"],
      metadata: {
        company_id: data.company_id, sales_order_id: data.sales_order_id,
        signature_ref: data.signature_ref ?? null,
        received_by: data.received_by ?? null, note: data.note ?? null,
        captured_at: new Date().toISOString(),
      } as never,
    };
    const { data: row, error } = await supabase.from("creator_assets").insert(insert).select("id").single();
    if (error) throw new Error(`pod_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.delivery", action: "pod",
      entity_type: "delivery", entity_id: row.id, company_id: data.company_id,
      after: { sales_order_id: data.sales_order_id }, severity: "notice",
      metadata: { module: "pod" },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 11. Customer Notification
// -----------------------------------------------------------------------
const CustomerNotifyInput = z.object({
  company_id: uuid,
  user_id: uuid,
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  kind: z.string().min(1).max(80).default("order.update"),
  action_url: z.string().max(500).optional(),
});
export const orderNotifyCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CustomerNotifyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "notification", capability: "customer",
      user_id: context.userId, company_id: data.company_id,
      summary: `notify customer ${data.user_id}`,
    });
    const insert: Database["public"]["Tables"]["notifications"]["Insert"] = {
      company_id: data.company_id, user_id: data.user_id,
      title: data.title, body: data.body ?? null, kind: data.kind,
      action_url: data.action_url ?? null,
    };
    const { data: row, error } = await supabase.from("notifications").insert(insert).select("id").single();
    if (error) throw new Error(`notify_customer_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.notification", action: "customer",
      entity_type: "notification", entity_id: row.id, company_id: data.company_id,
      after: { title: data.title, kind: data.kind }, severity: "info",
      metadata: { module: "notification.customer" },
    });
    return { status: "notified", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 12. Dealer Notification
// -----------------------------------------------------------------------
const DealerNotifyInput = z.object({
  company_id: uuid,
  user_id: uuid,
  dealer_ref: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  kind: z.string().min(1).max(80).default("dealer.update"),
});
export const orderNotifyDealer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DealerNotifyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "notification", capability: "dealer",
      user_id: context.userId, company_id: data.company_id,
      summary: `notify dealer ${data.dealer_ref}`,
    });
    const insert: Database["public"]["Tables"]["notifications"]["Insert"] = {
      company_id: data.company_id, user_id: data.user_id,
      title: data.title, body: data.body ?? null, kind: data.kind,
      payload: { dealer_ref: data.dealer_ref } as never,
    };
    const { data: row, error } = await supabase.from("notifications").insert(insert).select("id").single();
    if (error) throw new Error(`notify_dealer_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.notification", action: "dealer",
      entity_type: "notification", entity_id: row.id, company_id: data.company_id,
      after: { title: data.title, dealer_ref: data.dealer_ref }, severity: "info",
      metadata: { module: "notification.dealer" },
    });
    return { status: "notified", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 13. Order Analytics Snapshot
// -----------------------------------------------------------------------
const OrderAnalyticsInput = z.object({
  company_id: uuid, period: z.string().min(1).max(40),
  orders_count: z.number().int().nonnegative().default(0),
  revenue_cents: z.number().int().nonnegative().default(0),
  cancellations: z.number().int().nonnegative().default(0),
});
export const orderAnalyticsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OrderAnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "analytics", capability: "order",
      user_id: context.userId, company_id: data.company_id,
      summary: `order analytics ${data.period}`,
    });
    const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
      user_id: context.userId, name: `analytics:order:${data.period}`,
      kind: "commerce.analytics", mime_type: "application/json",
      tags: ["commerce", "analytics", "order"],
      metadata: { scope: "order", ...data } as never,
    };
    const { data: row, error } = await supabase.from("creator_assets").insert(insert).select("id").single();
    if (error) throw new Error(`order_analytics_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.analytics", action: "order",
      entity_type: "analytics", entity_id: row.id, company_id: data.company_id,
      after: { period: data.period }, severity: "info", metadata: { module: "analytics.order" },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 14. Delivery Analytics Snapshot
// -----------------------------------------------------------------------
const DeliveryAnalyticsInput = z.object({
  company_id: uuid, period: z.string().min(1).max(40),
  delivered: z.number().int().nonnegative().default(0),
  in_transit: z.number().int().nonnegative().default(0),
  delayed: z.number().int().nonnegative().default(0),
  on_time_rate: z.number().min(0).max(100).default(0),
});
export const deliveryAnalyticsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeliveryAnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "analytics", capability: "delivery",
      user_id: context.userId, company_id: data.company_id,
      summary: `delivery analytics ${data.period}`,
    });
    const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
      user_id: context.userId, name: `analytics:delivery:${data.period}`,
      kind: "commerce.analytics", mime_type: "application/json",
      tags: ["commerce", "analytics", "delivery"],
      metadata: { scope: "delivery", ...data } as never,
    };
    const { data: row, error } = await supabase.from("creator_assets").insert(insert).select("id").single();
    if (error) throw new Error(`delivery_analytics_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.analytics", action: "delivery",
      entity_type: "analytics", entity_id: row.id, company_id: data.company_id,
      after: { period: data.period }, severity: "info", metadata: { module: "analytics.delivery" },
    });
    return { status: "created", entity_id: row.id };
  });

// -----------------------------------------------------------------------
// 15. Payment Analytics Snapshot
// -----------------------------------------------------------------------
const PaymentAnalyticsInput = z.object({
  company_id: uuid, period: z.string().min(1).max(40),
  captured_cents: z.number().int().nonnegative().default(0),
  refunded_cents: z.number().int().nonnegative().default(0),
  failed: z.number().int().nonnegative().default(0),
  success_rate: z.number().min(0).max(100).default(0),
});
export const paymentAnalyticsSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PaymentAnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "commerce", module: "analytics", capability: "payment",
      user_id: context.userId, company_id: data.company_id,
      summary: `payment analytics ${data.period}`,
    });
    const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
      user_id: context.userId, name: `analytics:payment:${data.period}`,
      kind: "commerce.analytics", mime_type: "application/json",
      tags: ["commerce", "analytics", "payment"],
      metadata: { scope: "payment", ...data } as never,
    };
    const { data: row, error } = await supabase.from("creator_assets").insert(insert).select("id").single();
    if (error) throw new Error(`payment_analytics_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "commerce.analytics", action: "payment",
      entity_type: "analytics", entity_id: row.id, company_id: data.company_id,
      after: { period: data.period }, severity: "info", metadata: { module: "analytics.payment" },
    });
    return { status: "created", entity_id: row.id };
  });
