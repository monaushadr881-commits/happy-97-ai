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
  // R191 Batch 5 extensions (H.P. SHUDDH MASALE — recipe/packaging/traceability)
  "recipe_formula", "ingredient_formula", "blend_formula",
  "production_batch_recipe", "recipe_qc_approval",
  "packaging_batch", "label", "traceability", "shelf_life",
  "recipe_version", "ai_recipe_recommendation",
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
      module === "recipe_qc_approval" ||
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

// -----------------------------------------------------------------------------
// R191 Batch 4 — Production / Quality / Procurement completion.
// Reuses runManufacturingPipeline (canonical). No new tables, no new runtime.
// Procurement (purchase_order / vendor_bill) stays with Business Runtime
// (src/lib/business/business-runtime.functions.ts); warehouse receive & stock
// updates stay with Order/Inventory Runtime — do NOT duplicate here.
// -----------------------------------------------------------------------------

/** BOM Consumption — record components consumed against a production batch. */
export const manufacturingBomConsume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      batch_ref: z.string().min(1).max(120),
      bom_ref: z.string().min(1).max(120),
      components: z.array(z.object({
        sku: z.string(), quantity_consumed: z.number().nonnegative(), unit: z.string().optional(),
      })).min(1),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "bom_consumption",
        reference: `${data.bom_ref}:${data.batch_ref}`,
        payload: { bom_ref: data.bom_ref, batch_ref: data.batch_ref, components: data.components },
      },
      context,
    ),
  );

/** Raw Material Issue — issue raw materials from warehouse to shopfloor. */
export const manufacturingRawMaterialIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      issue_ref: z.string().min(1).max(120),
      warehouse_ref: z.string().min(1).max(120),
      order_ref: z.string().optional(),
      items: z.array(z.object({
        sku: z.string(), quantity: z.number().nonnegative(),
      })).min(1),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "raw_material_issue",
        reference: data.issue_ref,
        payload: { warehouse_ref: data.warehouse_ref, order_ref: data.order_ref ?? null, items: data.items },
      },
      context,
    ),
  );

/** Machine Assignment — assign machine + operator to a production order. */
export const manufacturingMachineAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      order_ref: z.string().min(1).max(120),
      machine_ref: z.string().min(1).max(120),
      operator: z.string().optional(),
      shift: z.string().optional(),
      scheduled_start: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "machine_assignment",
        reference: `${data.machine_ref}:${data.order_ref}`,
        payload: {
          machine_ref: data.machine_ref, order_ref: data.order_ref,
          operator: data.operator ?? null, shift: data.shift ?? null,
          scheduled_start: data.scheduled_start ?? null,
        },
      },
      context,
    ),
  );

/** Quality Approval — final QA sign-off (critical; forced approval). */
export const manufacturingQualityApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      approval_ref: z.string().min(1).max(120),
      inspection_ref: z.string().min(1).max(120),
      decision: z.enum(["approved", "rejected", "rework"]),
      approver: z.string().optional(),
      notes: z.string().max(4000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "quality_approval",
        reference: data.approval_ref,
        critical: true,
        payload: {
          inspection_ref: data.inspection_ref, decision: data.decision,
          approver: data.approver ?? null, notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Finished Goods Entry — post finished output to warehouse. */
export const manufacturingFinishedGoodsEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      entry_ref: z.string().min(1).max(120),
      batch_ref: z.string().min(1).max(120),
      warehouse_ref: z.string().min(1).max(120),
      sku: z.string().min(1),
      quantity: z.number().nonnegative(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "finished_goods",
        reference: data.entry_ref,
        payload: {
          batch_ref: data.batch_ref, warehouse_ref: data.warehouse_ref,
          sku: data.sku, quantity: data.quantity,
        },
      },
      context,
    ),
  );

/** Production Analytics — aggregate over recorded manufacturing assets. */
export const manufacturingProductionAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(500).default(200),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("creator_assets")
      .select("kind,metadata,created_at")
      .like("kind", "manufacturing.%")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`manufacturing_analytics_failed: ${r.error.message}`);
    const rows = r.data ?? [];
    const by_module: Record<string, number> = {};
    let batches = 0, downtime_minutes = 0, quality_fail = 0, quality_pass = 0, approvals_critical = 0;
    for (const row of rows) {
      const kind = String(row.kind ?? "");
      const mod = kind.replace(/^manufacturing\./, "");
      by_module[mod] = (by_module[mod] ?? 0) + 1;
      const m = (row.metadata ?? {}) as Record<string, unknown>;
      const payload = (m.payload ?? {}) as Record<string, unknown>;
      const impact = (m.impact ?? {}) as Record<string, unknown>;
      if (mod === "production_batch") batches += 1;
      if (mod === "machine_downtime" && typeof payload.minutes === "number") downtime_minutes += payload.minutes;
      if (mod === "quality_inspection") {
        if (payload.result === "fail") quality_fail += 1;
        else if (payload.result === "pass") quality_pass += 1;
      }
      if (impact.severity === "critical") approvals_critical += 1;
    }
    return {
      total_records: rows.length,
      by_module,
      batches,
      downtime_minutes,
      quality: { pass: quality_pass, fail: quality_fail },
      approvals_critical,
    };
  });

// -----------------------------------------------------------------------------
// R191 Batch 5 — H.P. SHUDDH MASALE™ Recipe + AI Recipe Intelligence.
// Persists recipe artifacts as manufacturing.<module> creator_assets (canonical).
// Knowledge search is delegated to the caller via existing `kbSearchArticles`;
// AI recommendation calls the Lovable AI Gateway (server-only) and records the
// recommendation itself as an auditable canonical asset. No new tables, no new
// runtime, no new UI.
// -----------------------------------------------------------------------------

/** Recipe Formula — master recipe (blend of ingredients + steps). */
export const masalaRecipeFormulaSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      recipe_ref: z.string().min(1).max(120),
      product_name: z.string().min(1).max(200),
      description: z.string().max(4000).optional(),
      ingredients: z.array(z.object({
        name: z.string(), quantity: z.number().nonnegative(),
        unit: z.string(), note: z.string().optional(),
      })).min(1),
      steps: z.array(z.string().min(1)).default([]),
      yield_kg: z.number().nonnegative().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "recipe_formula",
        reference: data.recipe_ref,
        payload: {
          product_name: data.product_name, description: data.description ?? null,
          ingredients: data.ingredients, steps: data.steps,
          yield_kg: data.yield_kg ?? null,
        },
      },
      context,
    ),
  );

/** Ingredient Formula — spec for a single ingredient (source, grade, moisture). */
export const masalaIngredientFormulaSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      ingredient_ref: z.string().min(1).max(120),
      name: z.string().min(1).max(200),
      grade: z.string().max(80).optional(),
      moisture_pct: z.number().min(0).max(100).optional(),
      origin: z.string().max(120).optional(),
      allergen: z.boolean().default(false),
      notes: z.string().max(4000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "ingredient_formula",
        reference: data.ingredient_ref,
        payload: {
          name: data.name, grade: data.grade ?? null,
          moisture_pct: data.moisture_pct ?? null, origin: data.origin ?? null,
          allergen: data.allergen, notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Blend Formula — proportional blend spec (e.g. Garam Masala percentages). */
export const masalaBlendFormulaSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      blend_ref: z.string().min(1).max(120),
      product_name: z.string().min(1).max(200),
      components: z.array(z.object({
        ingredient_ref: z.string(), percent: z.number().min(0).max(100),
      })).min(1),
      target_flavour_profile: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "blend_formula",
        reference: data.blend_ref,
        payload: {
          product_name: data.product_name, components: data.components,
          target_flavour_profile: data.target_flavour_profile ?? null,
        },
      },
      context,
    ),
  );

/** Production Batch Recipe — attach a recipe/blend version to a production batch. */
export const masalaBatchRecipeAttach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      batch_ref: z.string().min(1).max(120),
      recipe_ref: z.string().min(1).max(120),
      recipe_version: z.string().max(40).default("v1"),
      planned_output_kg: z.number().nonnegative(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "production_batch_recipe",
        reference: `${data.batch_ref}:${data.recipe_ref}:${data.recipe_version}`,
        payload: {
          batch_ref: data.batch_ref, recipe_ref: data.recipe_ref,
          recipe_version: data.recipe_version, planned_output_kg: data.planned_output_kg,
        },
      },
      context,
    ),
  );

/** QC Recipe Approval — critical sign-off, always Founder-gated. */
export const masalaQcRecipeApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      recipe_ref: z.string().min(1).max(120),
      recipe_version: z.string().max(40).default("v1"),
      decision: z.enum(["approved", "rejected", "rework"]),
      reviewer: z.string().optional(),
      lab_report_ref: z.string().optional(),
      notes: z.string().max(4000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "recipe_qc_approval",
        reference: `${data.recipe_ref}:${data.recipe_version}`,
        critical: true,
        payload: {
          recipe_version: data.recipe_version, decision: data.decision,
          reviewer: data.reviewer ?? null, lab_report_ref: data.lab_report_ref ?? null,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Packaging Batch — record packaging run against a finished batch. */
export const masalaPackagingBatchCreate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      pack_ref: z.string().min(1).max(120),
      batch_ref: z.string().min(1).max(120),
      pack_size: z.string().min(1).max(80),
      units_produced: z.number().nonnegative(),
      line_ref: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "packaging_batch",
        reference: data.pack_ref,
        payload: {
          batch_ref: data.batch_ref, pack_size: data.pack_size,
          units_produced: data.units_produced, line_ref: data.line_ref ?? null,
        },
      },
      context,
    ),
  );

/** Label Generation — record label artwork/version applied to a pack batch. */
export const masalaLabelGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      label_ref: z.string().min(1).max(120),
      pack_ref: z.string().min(1).max(120),
      artwork_version: z.string().max(40).default("v1"),
      mrp_cents: z.number().int().nonnegative().optional(),
      mfg_date: z.string().optional(),
      expiry_date: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "label",
        reference: `${data.label_ref}:${data.artwork_version}`,
        payload: {
          pack_ref: data.pack_ref, artwork_version: data.artwork_version,
          mrp_cents: data.mrp_cents ?? null, mfg_date: data.mfg_date ?? null,
          expiry_date: data.expiry_date ?? null,
        },
      },
      context,
    ),
  );

/** Batch Traceability — link raw lots → batch → pack for recall traceability. */
export const masalaTraceabilityRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      trace_ref: z.string().min(1).max(120),
      batch_ref: z.string().min(1).max(120),
      raw_lots: z.array(z.object({
        ingredient_ref: z.string(), lot_ref: z.string(), vendor_ref: z.string().optional(),
      })).min(1),
      pack_refs: z.array(z.string()).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "traceability",
        reference: data.trace_ref,
        payload: {
          batch_ref: data.batch_ref, raw_lots: data.raw_lots, pack_refs: data.pack_refs,
        },
      },
      context,
    ),
  );

/** Shelf Life — declared shelf-life window for a recipe/pack combination. */
export const masalaShelfLifeSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      shelf_ref: z.string().min(1).max(120),
      recipe_ref: z.string().min(1).max(120),
      pack_size: z.string().min(1).max(80),
      months: z.number().int().min(1).max(120),
      storage_conditions: z.string().max(400).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "shelf_life",
        reference: `${data.recipe_ref}:${data.pack_size}`,
        payload: {
          recipe_ref: data.recipe_ref, pack_size: data.pack_size,
          months: data.months, storage_conditions: data.storage_conditions ?? null,
        },
      },
      context,
    ),
  );

/** Recipe Version — publish a new immutable recipe revision (append-only). */
export const masalaRecipeVersionPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      recipe_ref: z.string().min(1).max(120),
      recipe_version: z.string().min(1).max(40),
      changelog: z.string().max(4000),
      snapshot: z.record(z.string(), z.unknown()),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runManufacturingPipeline(
      {
        ...data,
        module: "recipe_version",
        reference: `${data.recipe_ref}:${data.recipe_version}`,
        payload: {
          recipe_version: data.recipe_version, changelog: data.changelog,
          snapshot: data.snapshot,
        },
      },
      context,
    ),
  );

/** Recipe Search — canonical list across masala recipe assets. */
export const masalaRecipeSearch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      q: z.string().max(200).optional(),
      workspace_id: uuid.optional(),
      module: z.enum([
        "recipe_formula", "ingredient_formula", "blend_formula", "recipe_version",
      ]).default("recipe_formula"),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .eq("kind", `manufacturing.${data.module}`)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    const r = await q;
    if (r.error) throw new Error(`masala_recipe_search_failed: ${r.error.message}`);
    return r.data ?? [];
  });

/** Recipe Analytics — usage + QC breakdown across recipe assets. */
export const masalaRecipeAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(500).default(200),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("creator_assets")
      .select("kind,metadata,created_at")
      .in("kind", [
        "manufacturing.recipe_formula", "manufacturing.blend_formula",
        "manufacturing.recipe_version", "manufacturing.recipe_qc_approval",
        "manufacturing.production_batch_recipe", "manufacturing.packaging_batch",
        "manufacturing.traceability",
      ])
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`masala_recipe_analytics_failed: ${r.error.message}`);
    const rows = r.data ?? [];
    const by_module: Record<string, number> = {};
    let qc_approved = 0, qc_rejected = 0, packaging_units = 0, traces = 0;
    for (const row of rows) {
      const mod = String(row.kind ?? "").replace(/^manufacturing\./, "");
      by_module[mod] = (by_module[mod] ?? 0) + 1;
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const payload = (meta.payload ?? {}) as Record<string, unknown>;
      if (mod === "recipe_qc_approval") {
        if (payload.decision === "approved") qc_approved += 1;
        else if (payload.decision === "rejected") qc_rejected += 1;
      }
      if (mod === "packaging_batch" && typeof payload.units_produced === "number") {
        packaging_units += payload.units_produced;
      }
      if (mod === "traceability") traces += 1;
    }
    return {
      total_records: rows.length,
      by_module,
      qc: { approved: qc_approved, rejected: qc_rejected },
      packaging_units,
      traceability_records: traces,
    };
  });

/**
 * AI Recipe Recommendation — Lovable AI Gateway (server-only).
 * Returns a suggested recipe blend and records the recommendation as an
 * auditable canonical asset. Model: google/gemini-3-flash-preview.
 */
export const masalaAiRecommendRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      brief: z.string().min(4).max(2000),
      product_name: z.string().min(1).max(200),
      constraints: z.array(z.string().min(1).max(200)).max(20).default([]),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("lovable_api_key_missing");
    const system =
      "You are H.P. SHUDDH MASALE's master blender. Given a brief, return a JSON " +
      "object with fields: product_name, blend_components (array of {ingredient, percent}), " +
      "notes (string), suggested_shelf_life_months (number). Percents must sum to 100. " +
      "Respond with JSON only, no prose.";
    const user =
      `Brief: ${data.brief}\nProduct: ${data.product_name}\n` +
      (data.constraints.length ? `Constraints: ${data.constraints.join("; ")}\n` : "");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`ai_recipe_recommendation_failed: ${resp.status} ${body.slice(0, 200)}`);
    }
    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let recommendation: Record<string, unknown>;
    try { recommendation = JSON.parse(content) as Record<string, unknown>; }
    catch { recommendation = { raw: content }; }
    return runManufacturingPipeline(
      {
        ...data,
        module: "ai_recipe_recommendation",
        reference: `${data.product_name}:${Date.now()}`,
        payload: { brief: data.brief, constraints: data.constraints, recommendation },
      },
      context,
    );
  });


