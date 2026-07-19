/**
 * R188 Batch E — Business OS Runtime Rollout
 *
 * Extends the R183 Batch D Expense canonical template across the
 * remaining Business OS modules. Every protected mutation runs through
 * the SAME canonical pipeline that Batch D established:
 *
 *   Founder / Admin request
 *      ↓
 *   Impact analysis (module-specific threshold)
 *      ↓ above threshold                        ↓ below threshold
 *   requestFounderApproval (R158)             insert into canonical table
 *      ↓ pending in public.approvals            ↓
 *   Founder decides via decideFounderApproval writeCanonicalAudit
 *      ↓ approved
 *   bizApplyApprovedBusinessAction
 *      ↓ insert into canonical table
 *      ↓ writeCanonicalAudit
 *
 * Canonical owners reused — no new tables, no new runtime, no V2:
 *   persistence:  public.customers, public.leads, public.deals,
 *                 public.sales_orders, public.purchase_orders,
 *                 public.suppliers, public.employees,
 *                 public.creator_support_tickets, public.meetings
 *   approvals:    public.approvals via requestFounderApproval / decideFounderApproval
 *   audit:        writeCanonicalAudit → public.write_audit
 *   auth/RLS:     requireSupabaseAuth + is_company_member / is_company_admin
 *
 * Modules covered by this batch:
 *   Customers · Leads · Deals · Sales · Purchase · Vendors ·
 *   Employees (HR) · Support · Projects (Meetings)
 *
 * Existing Expense (Batch D) and Invoice (Batch E of R183) remain the
 * canonical owners for those two modules — do NOT duplicate here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";

type SB = SupabaseClient<Database>;

// Founder-approval threshold (cents). Matches expense/invoice convention.
const FOUNDER_APPROVAL_THRESHOLD_CENTS = 10_00_00_00; // ₹1,00,000

type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

interface RuntimeResult {
  status: "created" | "pending_approval";
  entity_id?: string;
  entity_type?: string;
  approval_id?: string;
  approval_status?: ApprovalStatus;
  reason?: string;
}

// =================================================================
// Customers
// =================================================================
const CustomerInput = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  code: z.string().max(80).nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),
  tax_id: z.string().max(80).nullable().optional(),
});
export const bizCreateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CustomerInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "customer", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `create customer ${data.name}` });
    const { data: row, error } = await supabase
      .from("customers")
      .insert({
        company_id: data.company_id,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        code: data.code ?? null,
        brand_id: data.brand_id ?? null,
        tax_id: data.tax_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(`customer_insert_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.customer",
      action: "create",
      entity_type: "customer",
      entity_id: row.id,
      company_id: data.company_id,
      after: row,
      severity: "info",
      metadata: { module: "crm" },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Leads
// =================================================================
const LeadInput = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  source: z.string().max(80).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  score: z.number().int().min(0).max(100).optional(),
});
export const bizCreateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LeadInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "lead", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `create lead ${data.name}` });
    const { data: row, error } = await supabase
      .from("leads")
      .insert({
        company_id: data.company_id,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        source: data.source ?? null,
        notes: data.notes ?? null,
        score: data.score ?? 0,
      })
      .select("*")
      .single();
    if (error) throw new Error(`lead_insert_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.lead",
      action: "create",
      entity_type: "lead",
      entity_id: row.id,
      company_id: data.company_id,
      after: row,
      severity: "info",
      metadata: { module: "crm" },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Deals — approval when amount ≥ threshold
// =================================================================
const DealInput = z.object({
  company_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(8).default("INR"),
  customer_id: z.string().uuid().nullable().optional(),
  lead_id: z.string().uuid().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expected_close_at: z.string().nullable().optional(),
});
type DealPayload = z.infer<typeof DealInput>;

async function insertDeal(sb: SB, p: DealPayload) {
  const { data: row, error } = await sb.from("deals").insert({
    company_id: p.company_id,
    title: p.title,
    amount_cents: p.amount_cents,
    currency: p.currency,
    customer_id: p.customer_id ?? null,
    lead_id: p.lead_id ?? null,
    owner_id: p.owner_id ?? null,
    probability: p.probability ?? 0,
    expected_close_at: p.expected_close_at ?? null,
  }).select("*").single();
  if (error) throw new Error(`deal_insert_failed: ${error.message}`);
  return row;
}

export const bizCreateDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DealInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "deal", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `create deal ${data.title}`, metadata: { amount_cents: data.amount_cents, currency: data.currency } });
    if (data.amount_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "business.deal",
          entity_id: crypto.randomUUID(),
          title: `Deal: ${data.title} — ${(data.amount_cents / 100).toFixed(2)} ${data.currency}`,
          amount_cents: data.amount_cents,
          currency: data.currency,
          metadata: { source: "business_os.deal", payload: data, threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS },
        },
      });
      return { status: "pending_approval", approval_id: approval.id, approval_status: approval.status, reason: "amount_exceeds_founder_threshold" };
    }
    const row = await insertDeal(supabase, data);
    await writeCanonicalAudit(supabase, {
      category: "business.deal", action: "create", entity_type: "deal",
      entity_id: row.id, company_id: data.company_id, after: row,
      severity: "notice", metadata: { module: "crm", approval_required: false },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Sales Orders — approval when total ≥ threshold
// =================================================================
const SalesOrderInput = z.object({
  company_id: z.string().uuid(),
  number: z.string().min(1).max(80),
  customer_id: z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  subtotal_cents: z.number().int().nonnegative(),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().nonnegative(),
  notes: z.string().max(2000).nullable().optional(),
});
type SalesOrderPayload = z.infer<typeof SalesOrderInput>;

async function insertSalesOrder(sb: SB, p: SalesOrderPayload, approvalId?: string) {
  const { data: row, error } = await sb.from("sales_orders").insert({
    company_id: p.company_id,
    number: p.number,
    customer_id: p.customer_id ?? null,
    warehouse_id: p.warehouse_id ?? null,
    currency: p.currency,
    subtotal_cents: p.subtotal_cents,
    tax_cents: p.tax_cents,
    total_cents: p.total_cents,
    notes: p.notes ?? null,
    approval_status: approvalId ? "approved" : "not_required",
  }).select("*").single();
  if (error) throw new Error(`sales_order_insert_failed: ${error.message}`);
  return row;
}

export const bizCreateSalesOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SalesOrderInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "sales_order", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `sales order ${data.number}`, metadata: { total_cents: data.total_cents, currency: data.currency } });
    if (data.total_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "business.sales_order",
          entity_id: crypto.randomUUID(),
          title: `Sales Order ${data.number} — ${(data.total_cents / 100).toFixed(2)} ${data.currency}`,
          amount_cents: data.total_cents,
          currency: data.currency,
          metadata: { source: "business_os.sales_order", payload: data, threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS },
        },
      });
      return { status: "pending_approval", approval_id: approval.id, approval_status: approval.status, reason: "total_exceeds_founder_threshold" };
    }
    const row = await insertSalesOrder(supabase, data);
    await writeCanonicalAudit(supabase, {
      category: "business.sales_order", action: "create", entity_type: "sales_order",
      entity_id: row.id, company_id: data.company_id, after: row,
      severity: "notice", metadata: { module: "sales", approval_required: false },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Purchase Orders — approval when total ≥ threshold
// =================================================================
const PurchaseOrderInput = z.object({
  company_id: z.string().uuid(),
  number: z.string().min(1).max(80),
  supplier_id: z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  subtotal_cents: z.number().int().nonnegative(),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().nonnegative(),
  notes: z.string().max(2000).nullable().optional(),
});
type PurchaseOrderPayload = z.infer<typeof PurchaseOrderInput>;

async function insertPurchaseOrder(sb: SB, p: PurchaseOrderPayload, approvalId?: string) {
  const { data: row, error } = await sb.from("purchase_orders").insert({
    company_id: p.company_id,
    number: p.number,
    supplier_id: p.supplier_id ?? null,
    warehouse_id: p.warehouse_id ?? null,
    currency: p.currency,
    subtotal_cents: p.subtotal_cents,
    tax_cents: p.tax_cents,
    total_cents: p.total_cents,
    notes: p.notes ?? null,
    approval_status: approvalId ? "approved" : "not_required",
  }).select("*").single();
  if (error) throw new Error(`purchase_order_insert_failed: ${error.message}`);
  return row;
}

export const bizCreatePurchaseOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PurchaseOrderInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "purchase_order", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `purchase order ${data.number}`, metadata: { total_cents: data.total_cents, currency: data.currency } });
    if (data.total_cents >= FOUNDER_APPROVAL_THRESHOLD_CENTS) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: "business.purchase_order",
          entity_id: crypto.randomUUID(),
          title: `Purchase Order ${data.number} — ${(data.total_cents / 100).toFixed(2)} ${data.currency}`,
          amount_cents: data.total_cents,
          currency: data.currency,
          metadata: { source: "business_os.purchase_order", payload: data, threshold_cents: FOUNDER_APPROVAL_THRESHOLD_CENTS },
        },
      });
      return { status: "pending_approval", approval_id: approval.id, approval_status: approval.status, reason: "total_exceeds_founder_threshold" };
    }
    const row = await insertPurchaseOrder(supabase, data);
    await writeCanonicalAudit(supabase, {
      category: "business.purchase_order", action: "create", entity_type: "purchase_order",
      entity_id: row.id, company_id: data.company_id, after: row,
      severity: "notice", metadata: { module: "purchase", approval_required: false },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Vendors / Suppliers
// =================================================================
const SupplierInput = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  code: z.string().max(80).nullable().optional(),
  tax_id: z.string().max(80).nullable().optional(),
});
export const bizCreateSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SupplierInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "supplier", capability: "create", user_id: context.userId, company_id: data.company_id, summary: `create supplier ${data.name}` });
    const { data: row, error } = await supabase.from("suppliers").insert({
      company_id: data.company_id,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      code: data.code ?? null,
      tax_id: data.tax_id ?? null,
    }).select("*").single();
    if (error) throw new Error(`supplier_insert_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.supplier", action: "create", entity_type: "supplier",
      entity_id: row.id, company_id: data.company_id, after: row,
      severity: "info", metadata: { module: "vendors" },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Employees (HR) — always approval-gated
// =================================================================
const EmployeeInput = z.object({
  company_id: z.string().uuid(),
  user_id: z.string().uuid(),
  employee_code: z.string().max(80).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  office_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  hired_on: z.string().nullable().optional(),
});
type EmployeePayload = z.infer<typeof EmployeeInput>;

async function insertEmployee(sb: SB, p: EmployeePayload) {
  const { data: row, error } = await sb.from("employees").insert({
    company_id: p.company_id,
    user_id: p.user_id,
    employee_code: p.employee_code ?? null,
    title: p.title ?? null,
    department_id: p.department_id ?? null,
    team_id: p.team_id ?? null,
    office_id: p.office_id ?? null,
    manager_id: p.manager_id ?? null,
    hired_on: p.hired_on ?? null,
  }).select("*").single();
  if (error) throw new Error(`employee_insert_failed: ${error.message}`);
  return row;
}

export const bizCreateEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EmployeeInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    await adoptToCanonicalPipeline(context.supabase, { domain: "business", module: "employee", capability: "hire", user_id: context.userId, company_id: data.company_id, summary: `hire employee ${data.title ?? data.employee_code ?? data.user_id}` });
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: "business.employee",
        entity_id: crypto.randomUUID(),
        title: `HR: New employee — ${data.title ?? data.employee_code ?? data.user_id}`,
        metadata: { source: "business_os.employee", payload: data, policy: "hr_hire_always_founder_gated" },
      },
    });
    return { status: "pending_approval", approval_id: approval.id, approval_status: approval.status, reason: "hr_hire_policy" };
  });

// =================================================================
// Support Tickets
// =================================================================
const SupportTicketInput = z.object({
  creator_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  listing_id: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});
export const bizCreateSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SupportTicketInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("creator_support_tickets").insert({
      creator_id: data.creator_id,
      buyer_id: data.buyer_id,
      subject: data.subject,
      body: data.body,
      listing_id: data.listing_id ?? null,
      priority: data.priority,
      status: "open",
    }).select("*").single();
    if (error) throw new Error(`support_ticket_insert_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.support", action: "create", entity_type: "support_ticket",
      entity_id: row.id, after: row,
      severity: data.priority === "urgent" ? "notice" : "info",
      metadata: { module: "support", priority: data.priority },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Projects — Meetings
// =================================================================
const MeetingInput = z.object({
  company_id: z.string().uuid().nullable().optional(),
  workspace_id: z.string().uuid().nullable().optional(),
  host_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  scheduled_start: z.string(),
  scheduled_end: z.string(),
  meeting_type: z.string().max(40).default("standard"),
  location: z.string().max(200).nullable().optional(),
});
export const bizScheduleMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MeetingInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "meeting", capability: "schedule", user_id: context.userId, company_id: data.company_id ?? "00000000-0000-0000-0000-000000000000", summary: `meeting ${data.title}` });
    const { data: row, error } = await supabase.from("meetings").insert({
      company_id: data.company_id ?? null,
      workspace_id: data.workspace_id ?? null,
      host_id: data.host_id,
      title: data.title,
      description: data.description ?? null,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      meeting_type: data.meeting_type,
      location: data.location ?? null,
      status: "scheduled",
    }).select("*").single();
    if (error) throw new Error(`meeting_insert_failed: ${error.message}`);
    await writeCanonicalAudit(supabase, {
      category: "business.meeting", action: "schedule", entity_type: "meeting",
      entity_id: row.id, company_id: data.company_id ?? undefined, after: row,
      severity: "info", metadata: { module: "projects" },
    });
    return { status: "created", entity_id: row.id };
  });

// =================================================================
// Universal Apply-Approved dispatcher for Deal / Sales / Purchase / Employee
// (Expense keeps its own bizApplyApprovedExpense; Invoice keeps its own.)
// =================================================================
const ApplyInput = z.object({ approval_id: z.string().uuid() });

export const bizApplyApprovedBusinessAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApplyInput.parse(i))
  .handler(async ({ data, context }): Promise<RuntimeResult> => {
    const { supabase } = context;
    const { data: approval, error: readErr } = await supabase
      .from("approvals").select("*").eq("id", data.approval_id).single();
    if (readErr || !approval) throw new Error("approval_not_found");
    if (approval.status !== "approved") throw new Error(`approval_not_approved: ${approval.status}`);
    await adoptToCanonicalPipeline(supabase, { domain: "business", module: "apply_approved", capability: "execute", user_id: context.userId, company_id: (approval as { company_id?: string | null }).company_id ?? "00000000-0000-0000-0000-000000000000", summary: `apply approved ${approval.entity_type}`, metadata: { approval_id: data.approval_id } });

    const meta = (approval.metadata ?? {}) as {
      source?: string;
      payload?: unknown;
      executed_entity_id?: string;
      executed_entity_type?: string;
    };
    if (!meta.source || !meta.payload) throw new Error("approval_missing_payload");
    if (meta.executed_entity_id) {
      return { status: "created", reason: "already_executed", approval_id: data.approval_id };
    }

    let row: { id: string; company_id?: string | null } | null = null;
    let entityType = "";
    let category = "";

    if (meta.source === "business_os.deal") {
      const p = DealInput.parse(meta.payload);
      row = await insertDeal(supabase, p);
      entityType = "deal";
      category = "business.deal";
    } else if (meta.source === "business_os.sales_order") {
      const p = SalesOrderInput.parse(meta.payload);
      row = await insertSalesOrder(supabase, p, data.approval_id);
      entityType = "sales_order";
      category = "business.sales_order";
    } else if (meta.source === "business_os.purchase_order") {
      const p = PurchaseOrderInput.parse(meta.payload);
      row = await insertPurchaseOrder(supabase, p, data.approval_id);
      entityType = "purchase_order";
      category = "business.purchase_order";
    } else if (meta.source === "business_os.employee") {
      const p = EmployeeInput.parse(meta.payload);
      row = await insertEmployee(supabase, p);
      entityType = "employee";
      category = "business.employee";
    } else {
      throw new Error(`unsupported_business_source: ${meta.source}`);
    }

    await supabase.from("approvals").update({
      metadata: { ...meta, executed_entity_id: row!.id, executed_entity_type: entityType } as never,
    }).eq("id", data.approval_id);

    await writeCanonicalAudit(supabase, {
      category,
      action: "create",
      entity_type: entityType,
      entity_id: row!.id,
      company_id: row!.company_id ?? undefined,
      after: row,
      severity: "notice",
      metadata: { approval_required: true, approval_id: data.approval_id },
    });

    return { status: "created", entity_id: row!.id, entity_type: entityType, approval_id: data.approval_id };
  });
