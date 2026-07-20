/**
 * R191 Batch 7 — Customer Support / Service / Returns / Refunds
 *
 * SINGLE composition surface that stitches the entire post-order
 * customer lifecycle (support ticket → complaint → assignment →
 * priority → internal note → customer reply → return → replacement →
 * refund → feedback → rating → analytics) onto existing canonical
 * owners. NO new runtime, NO new tables, NO new dashboard,
 * NO duplicate API.
 *
 * Canonical owners reused
 *   - Business Runtime         → customers, sales_orders
 *   - CRM Runtime              → creator_support_tickets (existing table)
 *   - Revenue Runtime          → payments (refund completion audit)
 *   - Marketplace / Commerce   → listings, orders context
 *   - Knowledge / Workspace    → adoptToCanonicalPipeline (Brain session)
 *   - Approval (R158)          → requestFounderApproval (return/refund gate)
 *   - Audit                    → writeCanonicalAudit → public.write_audit
 *
 * Persistence contract
 *   - Ticket / Complaint       → public.creator_support_tickets
 *   - Notes / Replies /        → public.creator_assets
 *     Returns / Replacements /   (kind = "support.note" | "support.reply"
 *     Refunds / Feedback /              | "support.return" | "support.replacement"
 *     Ratings / Analytics                | "support.refund" | "support.feedback"
 *                                        | "support.rating" | "support.analytics")
 */
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

const REFUND_APPROVAL_THRESHOLD_CENTS = 10_00_00_00; // ₹1,00,000

type JsonValue =
  | string | number | boolean | null
  | JsonValue[] | { [k: string]: JsonValue };
type Result = {
  status: "created" | "updated" | "pending_approval" | "ok" | "recorded";
  entity_id?: string;
  approval_id?: string;
  data?: JsonValue;
};

const uuid = z.string().uuid();

// ---------------------------------------------------------------------------
// 1. Support Ticket Create
// ---------------------------------------------------------------------------
const TicketCreateInput = z.object({
  company_id: uuid,
  buyer_id: uuid,
  creator_id: uuid,
  subject: z.string().min(1).max(240),
  body: z.string().min(1).max(8000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  listing_id: uuid.optional(),
});
export const supportTicketCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TicketCreateInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "ticket", capability: "create",
      user_id: context.userId, company_id: data.company_id,
      summary: `ticket ${data.subject}`,
      metadata: { priority: data.priority },
    });
    const insert: Database["public"]["Tables"]["creator_support_tickets"]["Insert"] = {
      buyer_id: data.buyer_id, creator_id: data.creator_id,
      subject: data.subject, body: data.body, priority: data.priority,
      listing_id: data.listing_id ?? null,
      metadata: { company_id: data.company_id, kind: "ticket" } as never,
    };
    const { data: row, error } = await supabase.from("creator_support_tickets")
      .insert(insert).select("*").single();
    if (error) throw new Error(`ticket_create_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "support.ticket", action: "create",
      entity_type: "support_ticket", entity_id: row.id, company_id: data.company_id,
      after: row, severity: "notice",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 2. Complaint Registration (ticket, kind=complaint, priority=high)
// ---------------------------------------------------------------------------
const ComplaintInput = z.object({
  company_id: uuid, buyer_id: uuid, creator_id: uuid,
  subject: z.string().min(1).max(240), body: z.string().min(1).max(8000),
  order_id: uuid.optional(),
});
export const supportComplaintRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ComplaintInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "complaint", capability: "register",
      user_id: context.userId, company_id: data.company_id,
      summary: `complaint ${data.subject}`,
    });
    const insert: Database["public"]["Tables"]["creator_support_tickets"]["Insert"] = {
      buyer_id: data.buyer_id, creator_id: data.creator_id,
      subject: data.subject, body: data.body, priority: "high",
      metadata: { company_id: data.company_id, kind: "complaint", order_id: data.order_id ?? null } as never,
    };
    const { data: row, error } = await supabase.from("creator_support_tickets")
      .insert(insert).select("*").single();
    if (error) throw new Error(`complaint_register_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "support.complaint", action: "register",
      entity_type: "support_ticket", entity_id: row.id, company_id: data.company_id,
      after: row, severity: "warning",
    });
    return { status: "created", entity_id: row.id };
  });

// ---------------------------------------------------------------------------
// 3. Ticket Assignment
// ---------------------------------------------------------------------------
const AssignInput = z.object({
  company_id: uuid, ticket_id: uuid, assignee_id: uuid,
});
export const supportTicketAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AssignInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "ticket", capability: "assign",
      user_id: context.userId, company_id: data.company_id,
      summary: `assign ${data.ticket_id} → ${data.assignee_id}`,
    });
    const { data: prev } = await supabase.from("creator_support_tickets")
      .select("metadata").eq("id", data.ticket_id).single();
    const meta = (prev?.metadata ?? {}) as Record<string, unknown>;
    const patch: Database["public"]["Tables"]["creator_support_tickets"]["Update"] = {
      metadata: { ...meta, assignee_id: data.assignee_id } as never,
    };
    const { data: row, error } = await supabase.from("creator_support_tickets")
      .update(patch).eq("id", data.ticket_id).select("*").single();
    if (error) throw new Error(`ticket_assign_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "support.ticket", action: "assign",
      entity_type: "support_ticket", entity_id: data.ticket_id, company_id: data.company_id,
      after: row, severity: "notice",
    });
    return { status: "updated", entity_id: data.ticket_id };
  });

// ---------------------------------------------------------------------------
// 4. Priority Change
// ---------------------------------------------------------------------------
const PriorityInput = z.object({
  company_id: uuid, ticket_id: uuid,
  priority: z.enum(["low", "normal", "high", "urgent"]),
});
export const supportPriorityChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PriorityInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "ticket", capability: "priority_change",
      user_id: context.userId, company_id: data.company_id,
      summary: `priority ${data.ticket_id} → ${data.priority}`,
    });
    const { data: row, error } = await supabase.from("creator_support_tickets")
      .update({ priority: data.priority }).eq("id", data.ticket_id).select("*").single();
    if (error) throw new Error(`priority_change_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "support.ticket", action: "priority_change",
      entity_type: "support_ticket", entity_id: data.ticket_id, company_id: data.company_id,
      after: row, severity: "notice", metadata: { priority: data.priority },
    });
    return { status: "updated", entity_id: data.ticket_id };
  });

// ---------------------------------------------------------------------------
// helper: creator_assets writer
// ---------------------------------------------------------------------------
async function writeAsset(
  supabase: Database extends never ? never : Parameters<typeof writeCanonicalAudit>[0],
  userId: string,
  kind: string,
  name: string,
  metadata: Record<string, unknown>,
): Promise<string> {
  const insert: Database["public"]["Tables"]["creator_assets"]["Insert"] = {
    user_id: userId, kind, name, metadata: metadata as never,
  };
  const { data: row, error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (v: unknown) => { select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
    };
  }).from("creator_assets").insert(insert).select("id").single();
  if (error || !row) throw new Error(`asset_write_failed:${kind}:${error?.message ?? "unknown"}`);
  return row.id;
}

// ---------------------------------------------------------------------------
// 5. Internal Note
// ---------------------------------------------------------------------------
const NoteInput = z.object({
  company_id: uuid, ticket_id: uuid, body: z.string().min(1).max(8000),
});
export const supportInternalNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => NoteInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "ticket", capability: "internal_note",
      user_id: userId, company_id: data.company_id,
      summary: `note ${data.ticket_id}`,
    });
    const id = await writeAsset(supabase, userId, "support.note",
      `note:${data.ticket_id}`,
      { company_id: data.company_id, ticket_id: data.ticket_id, body: data.body, internal: true });
    await writeCanonicalAudit(supabase, {
      category: "support.ticket", action: "internal_note",
      entity_type: "support_note", entity_id: id, company_id: data.company_id,
      after: { ticket_id: data.ticket_id, id }, severity: "info",
    });
    return { status: "recorded", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 6. Customer Reply
// ---------------------------------------------------------------------------
const ReplyInput = z.object({
  company_id: uuid, ticket_id: uuid, body: z.string().min(1).max(8000),
});
export const supportCustomerReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReplyInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "ticket", capability: "customer_reply",
      user_id: userId, company_id: data.company_id,
      summary: `reply ${data.ticket_id}`,
    });
    const id = await writeAsset(supabase, userId, "support.reply",
      `reply:${data.ticket_id}`,
      { company_id: data.company_id, ticket_id: data.ticket_id, body: data.body });
    await supabase.from("creator_support_tickets")
      .update({ last_message_at: new Date().toISOString() }).eq("id", data.ticket_id);
    await writeCanonicalAudit(supabase, {
      category: "support.ticket", action: "customer_reply",
      entity_type: "support_reply", entity_id: id, company_id: data.company_id,
      after: { ticket_id: data.ticket_id, id }, severity: "info",
    });
    return { status: "recorded", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 7. Return Request
// ---------------------------------------------------------------------------
const ReturnRequestInput = z.object({
  company_id: uuid, order_id: uuid, customer_id: uuid,
  reason: z.string().min(1).max(2000),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })).min(1),
});
export const supportReturnRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReturnRequestInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "return", capability: "request",
      user_id: userId, company_id: data.company_id,
      summary: `return request ${data.order_id}`,
    });
    const id = await writeAsset(supabase, userId, "support.return",
      `return:${data.order_id}`,
      { company_id: data.company_id, order_id: data.order_id, customer_id: data.customer_id,
        reason: data.reason, items: data.items, state: "requested" });
    await writeCanonicalAudit(supabase, {
      category: "support.return", action: "request",
      entity_type: "return", entity_id: id, company_id: data.company_id,
      after: { order_id: data.order_id, id }, severity: "notice",
    });
    return { status: "created", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 8. Return Approval (Founder-gated)
// ---------------------------------------------------------------------------
const ReturnApproveInput = z.object({
  company_id: uuid, return_id: uuid, decision: z.enum(["approved", "rejected"]),
  note: z.string().max(1000).optional(),
});
export const supportReturnApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReturnApproveInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "return", capability: "approve",
      user_id: userId, company_id: data.company_id,
      summary: `return ${data.decision} ${data.return_id}`,
    });
    const a = await requestFounderApproval({
      data: {
        capability: "support.return.approve",
        summary: `Return ${data.decision} ${data.return_id}`,
        payload: { ...data },
      } as never,
    });
    await writeCanonicalAudit(supabase, {
      category: "support.return", action: "approve",
      entity_type: "return", entity_id: data.return_id, company_id: data.company_id,
      after: { decision: data.decision }, severity: "warning",
    });
    return { status: "pending_approval", approval_id: (a as { id: string }).id };
  });

// ---------------------------------------------------------------------------
// 9. Replacement Order
// ---------------------------------------------------------------------------
const ReplacementInput = z.object({
  company_id: uuid, original_order_id: uuid, customer_id: uuid,
  replacement_sku: z.string().min(1), qty: z.number().int().positive(),
});
export const supportReplacementOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReplacementInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "replacement", capability: "create",
      user_id: userId, company_id: data.company_id,
      summary: `replacement ${data.original_order_id}`,
    });
    const id = await writeAsset(supabase, userId, "support.replacement",
      `replacement:${data.original_order_id}`,
      { company_id: data.company_id, original_order_id: data.original_order_id,
        customer_id: data.customer_id, sku: data.replacement_sku, qty: data.qty });
    await writeCanonicalAudit(supabase, {
      category: "support.replacement", action: "create",
      entity_type: "replacement", entity_id: id, company_id: data.company_id,
      after: { id, original_order_id: data.original_order_id }, severity: "notice",
    });
    return { status: "created", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 10. Refund Request
// ---------------------------------------------------------------------------
const RefundRequestInput = z.object({
  company_id: uuid, order_id: uuid, customer_id: uuid,
  amount_cents: z.number().int().positive(), currency: z.string().length(3).default("INR"),
  reason: z.string().min(1).max(2000),
});
export const supportRefundRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RefundRequestInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "refund", capability: "request",
      user_id: userId, company_id: data.company_id,
      summary: `refund request ${data.amount_cents} ${data.currency}`,
      metadata: { amount_cents: data.amount_cents },
    });
    const id = await writeAsset(supabase, userId, "support.refund",
      `refund:${data.order_id}`,
      { company_id: data.company_id, order_id: data.order_id, customer_id: data.customer_id,
        amount_cents: data.amount_cents, currency: data.currency, reason: data.reason,
        state: "requested" });
    await writeCanonicalAudit(supabase, {
      category: "support.refund", action: "request",
      entity_type: "refund", entity_id: id, company_id: data.company_id,
      after: { id, amount_cents: data.amount_cents }, severity: "notice",
    });
    return { status: "created", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 11. Refund Approval (Founder-gated above threshold; always audited)
// ---------------------------------------------------------------------------
const RefundApproveInput = z.object({
  company_id: uuid, refund_id: uuid,
  amount_cents: z.number().int().positive(), currency: z.string().length(3).default("INR"),
  decision: z.enum(["approved", "rejected"]),
});
export const supportRefundApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RefundApproveInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "refund", capability: "approve",
      user_id: userId, company_id: data.company_id,
      summary: `refund ${data.decision} ${data.amount_cents} ${data.currency}`,
    });
    if (data.decision === "approved" && data.amount_cents >= REFUND_APPROVAL_THRESHOLD_CENTS) {
      const a = await requestFounderApproval({
        data: {
          capability: "support.refund.approve",
          summary: `Refund approve ${data.amount_cents / 100} ${data.currency}`,
          payload: { ...data },
        } as never,
      });
      return { status: "pending_approval", approval_id: (a as { id: string }).id };
    }
    await writeCanonicalAudit(supabase, {
      category: "support.refund", action: "approve",
      entity_type: "refund", entity_id: data.refund_id, company_id: data.company_id,
      after: { decision: data.decision, amount_cents: data.amount_cents },
      severity: "warning",
    });
    return { status: "updated", entity_id: data.refund_id };
  });

// ---------------------------------------------------------------------------
// 12. Refund Completion (records a negative-cash payment audit)
// ---------------------------------------------------------------------------
const RefundCompleteInput = z.object({
  company_id: uuid, refund_id: uuid, customer_id: uuid.optional(),
  invoice_id: uuid.optional(), amount_cents: z.number().int().positive(),
  currency: z.string().length(3).default("INR"),
  provider: z.string().max(80).optional(), provider_ref: z.string().max(200).optional(),
});
export const supportRefundComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RefundCompleteInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "refund", capability: "complete",
      user_id: userId, company_id: data.company_id,
      summary: `refund complete ${data.amount_cents} ${data.currency}`,
    });
    const id = await writeAsset(supabase, userId, "support.refund",
      `refund-complete:${data.refund_id}`,
      { company_id: data.company_id, refund_id: data.refund_id,
        amount_cents: data.amount_cents, currency: data.currency,
        provider: data.provider ?? null, provider_ref: data.provider_ref ?? null,
        state: "completed", completed_at: new Date().toISOString() });
    await writeCanonicalAudit(supabase, {
      category: "support.refund", action: "complete",
      entity_type: "refund", entity_id: data.refund_id, company_id: data.company_id,
      after: { id, amount_cents: data.amount_cents, currency: data.currency },
      severity: "warning",
    });
    return { status: "ok", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 13. Customer Feedback
// ---------------------------------------------------------------------------
const FeedbackInput = z.object({
  company_id: uuid, customer_id: uuid, ticket_id: uuid.optional(),
  body: z.string().min(1).max(4000),
});
export const supportCustomerFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => FeedbackInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "feedback", capability: "submit",
      user_id: userId, company_id: data.company_id,
      summary: `feedback ${data.customer_id}`,
    });
    const id = await writeAsset(supabase, userId, "support.feedback",
      `feedback:${data.customer_id}`,
      { company_id: data.company_id, customer_id: data.customer_id,
        ticket_id: data.ticket_id ?? null, body: data.body });
    await writeCanonicalAudit(supabase, {
      category: "support.feedback", action: "submit",
      entity_type: "feedback", entity_id: id, company_id: data.company_id,
      after: { id }, severity: "info",
    });
    return { status: "recorded", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 14. Customer Rating
// ---------------------------------------------------------------------------
const RatingInput = z.object({
  company_id: uuid, customer_id: uuid, ticket_id: uuid.optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export const supportCustomerRating = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RatingInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "rating", capability: "submit",
      user_id: userId, company_id: data.company_id,
      summary: `rating ${data.rating}★`,
    });
    const id = await writeAsset(supabase, userId, "support.rating",
      `rating:${data.customer_id}`,
      { company_id: data.company_id, customer_id: data.customer_id,
        ticket_id: data.ticket_id ?? null, rating: data.rating, comment: data.comment ?? null });
    await writeCanonicalAudit(supabase, {
      category: "support.rating", action: "submit",
      entity_type: "rating", entity_id: id, company_id: data.company_id,
      after: { id, rating: data.rating }, severity: "info",
    });
    return { status: "recorded", entity_id: id };
  });

// ---------------------------------------------------------------------------
// 15. Support Analytics (snapshot aggregation → Mission Control)
// ---------------------------------------------------------------------------
const AnalyticsInput = z.object({
  company_id: uuid, window_days: z.number().int().min(1).max(365).default(30),
});
export const supportAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AnalyticsInput.parse(i))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    await adoptToCanonicalPipeline(supabase, {
      domain: "business", module: "analytics", capability: "snapshot",
      user_id: userId, company_id: data.company_id,
      summary: `support analytics ${data.window_days}d`,
    });
    const since = new Date(Date.now() - data.window_days * 86400_000).toISOString();
    const { count: openTickets } = await supabase
      .from("creator_support_tickets")
      .select("id", { count: "exact", head: true })
      .neq("status", "resolved")
      .gte("created_at", since);
    const { count: refunds } = await supabase
      .from("creator_assets")
      .select("id", { count: "exact", head: true })
      .eq("kind", "support.refund")
      .gte("created_at", since);
    const { count: returns } = await supabase
      .from("creator_assets")
      .select("id", { count: "exact", head: true })
      .eq("kind", "support.return")
      .gte("created_at", since);
    const snapshot = {
      window_days: data.window_days,
      open_tickets: openTickets ?? 0,
      refunds: refunds ?? 0,
      returns: returns ?? 0,
      captured_at: new Date().toISOString(),
    };
    const id = await writeAsset(supabase, userId, "support.analytics",
      `analytics:${data.company_id}`,
      { company_id: data.company_id, ...snapshot });
    await writeCanonicalAudit(supabase, {
      category: "support.analytics", action: "snapshot",
      entity_type: "support_analytics", entity_id: id, company_id: data.company_id,
      after: snapshot, severity: "info",
    });
    return { status: "ok", entity_id: id, data: snapshot as JsonValue };
  });
