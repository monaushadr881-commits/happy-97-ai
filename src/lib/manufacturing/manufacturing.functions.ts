/**
 * R189 Batch 8+9 — Manufacturing Runtime (Canonical Owner)
 *
 * CANONICAL OWNER for all future Manufacturing development.
 * No second implementation may ever be created.
 *
 * Canonical Scan (reused, NEVER duplicated):
 *   persistence  → public.creator_assets (kind: "manufacturing.<module>")
 *   workspace    → creator_assets.metadata.workspace_id
 *   approvals    → requestFounderApproval (R158)
 *   audit        → writeCanonicalAudit
 *   brain        → withBrain
 *   pipeline     → adoptToCanonicalPipeline
 *   auth/RLS     → requireSupabaseAuth
 *   mission ctl  → founderMissionControl (auto-aggregated by kind prefix)
 *
 * Foundation Modules (Batch 8): factory, production, machine, maintenance,
 *                     quality, inventory_link, supply_chain_link.
 * Batch 9 additions (extend, never duplicate): production_order,
 *   production_batch, machine_downtime, maintenance_order,
 *   quality_inspection, bom, goods_receipt, cycle_count.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { withBrain } from "@/lib/founder/with-brain";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import type { FounderApprovalContext } from "@/lib/founder/types";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const APPROVAL_THRESHOLD_CENTS = 1_00_00_000; // ₹1,00,000

export const MANUFACTURING_MODULES = [
  "factory", "production", "machine", "maintenance",
  "quality", "inventory_link", "supply_chain_link",
  // Batch 9 extensions
  "production_order", "production_batch", "machine_downtime",
  "maintenance_order", "quality_inspection", "bom",
  "goods_receipt", "cycle_count",
  // R191 Batch 4 extensions (production/quality/procurement completion)
  "bom_consumption", "raw_material_issue", "machine_assignment",
  "quality_approval", "finished_goods", "production_analytics",
] as const;
export type ManufacturingModule = typeof MANUFACTURING_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: ManufacturingModule; cost_cents: number | null; critical: boolean },
  Impact
>({
  capability: "manufacturing.impact",
  handler: ({ module, cost_cents, critical }) => {
    const highCost = typeof cost_cents === "number" && cost_cents >= APPROVAL_THRESHOLD_CENTS;
    const criticalModule =
      module === "maintenance" ||
      module === "quality" ||
      module === "maintenance_order" ||
      module === "quality_inspection" ||
      module === "quality_approval" ||
      module === "machine_downtime";
    if (critical || (criticalModule && highCost)) {
      return { severity: "critical", requires_approval: true, reason: "critical_operation" };
    }
    if (highCost) return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    if (criticalModule) return { severity: "warning", requires_approval: false, reason: "critical_module_low_cost" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const SubmitInput = z.object({
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  module: z.enum(MANUFACTURING_MODULES),
  reference: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()).default({}),
  cost_cents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  critical: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
});
type SubmitData = z.infer<typeof SubmitInput>;

interface SubmitResult {
  status: "recorded" | "pending_approval";
  record?: { id: string; name: string; kind: string; created_at: string };
  impact: Impact;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
}

// Shared canonical pipeline (used by every Batch 8 + Batch 9 handler).
async function runManufacturingPipeline(
  data: SubmitData,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "manufacturing",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: ZERO_UUID,
    metadata: { cost_cents: data.cost_cents ?? null, critical: data.critical },
  });
  const brain = await analyze({
    capability: "manufacturing.impact",
    input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `manufacturing.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `vertical.${kind}`,
        entity_id: crypto.randomUUID(),
        title: `Manufacturing · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents ?? undefined,
        currency: data.currency,
        metadata: {
          source: "manufacturing",
          module: data.module,
          payload: data.payload,
          impact: brain.output,
          brain_duration_ms: brain.durationMs,
          threshold_cents: APPROVAL_THRESHOLD_CENTS,
        },
      },
    });
    return {
      status: "pending_approval",
      impact: brain.output,
      approval_id: approval.id,
      approval_status: approval.status,
    };
  }
  const name = `${kind}:${data.reference}`;
  const meta = {
    vertical: "manufacturing",
    module: data.module,
    reference: data.reference,
    workspace_id: data.workspace_id ?? null,
    company_id: data.company_id ?? null,
    cost_cents: data.cost_cents ?? null,
    currency: data.currency,
    payload: data.payload,
    impact: brain.output,
    brain_duration_ms: brain.durationMs,
    version: 1,
    recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId,
      kind,
      mime_type: "application/x-happy-vertical+json",
      name,
      tags: Array.from(new Set([...data.tags, "manufacturing", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`manufacturing_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "vertical.manufacturing",
    action: `${data.module}.record`,
    entity_type: "creator_asset",
    entity_id: record.id,
    company_id: data.company_id ?? undefined,
    after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, impact: brain.output, approval_required: false },
  });
  return { status: "recorded", record, impact: brain.output };
}

export const manufacturingSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitInput.parse(i))
  .handler(async ({ data, context }): Promise<SubmitResult> => runManufacturingPipeline(data, context));

export const manufacturingList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(MANUFACTURING_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `manufacturing.${data.module}` : "manufacturing.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`manufacturing_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// -----------------------------------------------------------------------------
// Batch 9 — specific mutation handlers (extend, never duplicate).
// Each handler is a thin, typed wrapper over runManufacturingPipeline().
// -----------------------------------------------------------------------------

const BaseFields = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  cost_cents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  critical: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Production Order — create/schedule a production order. */
export const manufacturingProductionOrderCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      order_ref: z.string().min(1).max(120),
      product: z.string().min(1).max(200),
      quantity: z.number().nonnegative(),
      due_date: z.string().optional(),
      factory_ref: z.string().optional(),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "production_order",
        reference: data.order_ref,
        payload: {
          product: data.product, quantity: data.quantity,
          due_date: data.due_date ?? null, factory_ref: data.factory_ref ?? null,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Production Batch — log a produced batch. */
export const manufacturingProductionBatchRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      batch_ref: z.string().min(1).max(120),
      order_ref: z.string().optional(),
      quantity_produced: z.number().nonnegative(),
      quantity_scrap: z.number().nonnegative().default(0),
      shift: z.string().optional(),
      machine_ref: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "production_batch",
        reference: data.batch_ref,
        payload: {
          order_ref: data.order_ref ?? null,
          quantity_produced: data.quantity_produced,
          quantity_scrap: data.quantity_scrap,
          shift: data.shift ?? null,
          machine_ref: data.machine_ref ?? null,
        },
      },
      context,
    ),
  );

/** Machine Downtime — log downtime incident. */
export const manufacturingMachineDowntimeLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      machine_ref: z.string().min(1).max(120),
      reason_code: z.string().min(1).max(80),
      minutes: z.number().int().nonnegative(),
      description: z.string().max(2000).optional(),
      started_at: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "machine_downtime",
        reference: `${data.machine_ref}:${data.started_at ?? new Date().toISOString()}`,
        payload: {
          machine_ref: data.machine_ref, reason_code: data.reason_code,
          minutes: data.minutes, description: data.description ?? null,
          started_at: data.started_at ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );

/** Maintenance Order — schedule/complete maintenance. */
export const manufacturingMaintenanceOrderCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      order_ref: z.string().min(1).max(120),
      machine_ref: z.string().min(1).max(120),
      maintenance_type: z.enum(["preventive", "corrective", "predictive", "inspection"]),
      scheduled_for: z.string().optional(),
      technician: z.string().optional(),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "maintenance_order",
        reference: data.order_ref,
        payload: {
          machine_ref: data.machine_ref, maintenance_type: data.maintenance_type,
          scheduled_for: data.scheduled_for ?? null, technician: data.technician ?? null,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Quality Inspection — record inspection outcome. */
export const manufacturingQualityInspectionRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      inspection_ref: z.string().min(1).max(120),
      batch_ref: z.string().optional(),
      result: z.enum(["pass", "fail", "conditional"]),
      defect_count: z.number().int().nonnegative().default(0),
      inspector: z.string().optional(),
      notes: z.string().max(4000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "quality_inspection",
        reference: data.inspection_ref,
        critical: data.critical || data.result === "fail",
        payload: {
          batch_ref: data.batch_ref ?? null, result: data.result,
          defect_count: data.defect_count, inspector: data.inspector ?? null,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Bill of Materials — upsert a BOM definition. */
export const manufacturingBomUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      bom_ref: z.string().min(1).max(120),
      product: z.string().min(1).max(200),
      revision: z.string().max(40).default("v1"),
      components: z.array(z.object({
        sku: z.string(), quantity: z.number().nonnegative(), unit: z.string().optional(),
      })).min(1),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "bom",
        reference: `${data.bom_ref}:${data.revision}`,
        payload: { product: data.product, revision: data.revision, components: data.components },
      },
      context,
    ),
  );

/** Goods Receipt — record incoming stock from vendor. */
export const manufacturingGoodsReceiptRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      grn_ref: z.string().min(1).max(120),
      vendor_ref: z.string().min(1).max(120),
      po_ref: z.string().optional(),
      items: z.array(z.object({
        sku: z.string(), quantity_received: z.number().nonnegative(),
      })).min(1),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "goods_receipt",
        reference: data.grn_ref,
        payload: { vendor_ref: data.vendor_ref, po_ref: data.po_ref ?? null, items: data.items },
      },
      context,
    ),
  );

/** Cycle Count — record physical inventory count. */
export const manufacturingCycleCountRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      count_ref: z.string().min(1).max(120),
      location: z.string().min(1).max(120),
      items: z.array(z.object({
        sku: z.string(), counted: z.number().nonnegative(), expected: z.number().nonnegative(),
      })).min(1),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "cycle_count",
        reference: data.count_ref,
        payload: { location: data.location, items: data.items },
      },
      context,
    ),
  );
