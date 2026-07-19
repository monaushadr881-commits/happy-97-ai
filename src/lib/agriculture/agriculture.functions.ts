/**
 * R189 Batch 8+9 — Agriculture Runtime (Canonical Owner)
 *
 * CANONICAL OWNER for all future Agriculture development.
 * No second implementation may ever be created.
 *
 * Canonical Scan (reused, NEVER duplicated):
 *   persistence  → public.creator_assets (kind: "agriculture.<module>")
 *   approvals    → requestFounderApproval (R158)
 *   audit        → writeCanonicalAudit
 *   brain        → withBrain
 *   pipeline     → adoptToCanonicalPipeline
 *   auth/RLS     → requireSupabaseAuth
 *
 * Foundation Modules (Batch 8): farm, crop, livestock, equipment,
 *                     weather_link, market_link.
 * Batch 9 additions: irrigation, harvest, farm_analytics, rural_business.
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
const APPROVAL_THRESHOLD_CENTS = 1_00_00_000;

export const AGRICULTURE_MODULES = [
  "farm", "crop", "livestock", "equipment",
  "weather_link", "market_link",
  // Batch 9
  "irrigation", "harvest", "farm_analytics", "rural_business",
] as const;
export type AgricultureModule = typeof AGRICULTURE_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: AgricultureModule; cost_cents: number | null; critical: boolean },
  Impact
>({
  capability: "agriculture.impact",
  handler: ({ module, cost_cents, critical }) => {
    const highCost = typeof cost_cents === "number" && cost_cents >= APPROVAL_THRESHOLD_CENTS;
    const criticalModule =
      module === "livestock" || module === "equipment" ||
      module === "irrigation" || module === "harvest";
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
  module: z.enum(AGRICULTURE_MODULES),
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

async function runAgriculturePipeline(
  data: SubmitData,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "agriculture",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: ZERO_UUID,
    metadata: { cost_cents: data.cost_cents ?? null, critical: data.critical },
  });
  const brain = await analyze({
    capability: "agriculture.impact",
    input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `agriculture.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `vertical.${kind}`,
        entity_id: crypto.randomUUID(),
        title: `Agriculture · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents ?? undefined,
        currency: data.currency,
        metadata: {
          source: "agriculture",
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
    vertical: "agriculture",
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
      tags: Array.from(new Set([...data.tags, "agriculture", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`agriculture_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "vertical.agriculture",
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

export const agricultureSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitInput.parse(i))
  .handler(async ({ data, context }): Promise<SubmitResult> => runAgriculturePipeline(data, context));

export const agricultureList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(AGRICULTURE_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `agriculture.${data.module}` : "agriculture.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`agriculture_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// -----------------------------------------------------------------------------
// Batch 9 — specific agriculture handlers.
// -----------------------------------------------------------------------------

const BaseFields = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  cost_cents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  critical: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Crop — record a planting/sowing event. */
export const agricultureCropPlantingRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      planting_ref: z.string().min(1).max(120),
      farm_ref: z.string().min(1).max(120),
      crop: z.string().min(1).max(120),
      area_hectares: z.number().nonnegative(),
      variety: z.string().optional(),
      planted_on: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAgriculturePipeline(
      {
        ...data,
        module: "crop",
        reference: data.planting_ref,
        payload: {
          farm_ref: data.farm_ref, crop: data.crop,
          area_hectares: data.area_hectares, variety: data.variety ?? null,
          planted_on: data.planted_on ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );

/** Livestock — record a livestock event (birth, health, sale). */
export const agricultureLivestockRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      livestock_ref: z.string().min(1).max(120),
      farm_ref: z.string().min(1).max(120),
      species: z.string().min(1).max(80),
      event_type: z.enum(["birth", "vaccination", "health_check", "sale", "death"]),
      count: z.number().int().positive().default(1),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAgriculturePipeline(
      {
        ...data,
        module: "livestock",
        reference: data.livestock_ref,
        payload: {
          farm_ref: data.farm_ref, species: data.species, event_type: data.event_type,
          count: data.count, notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Irrigation — schedule an irrigation cycle. */
export const agricultureIrrigationSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      schedule_ref: z.string().min(1).max(120),
      farm_ref: z.string().min(1).max(120),
      method: z.enum(["drip", "sprinkler", "flood", "manual"]),
      duration_minutes: z.number().int().positive(),
      volume_liters: z.number().nonnegative().optional(),
      scheduled_for: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAgriculturePipeline(
      {
        ...data,
        module: "irrigation",
        reference: data.schedule_ref,
        payload: {
          farm_ref: data.farm_ref, method: data.method,
          duration_minutes: data.duration_minutes,
          volume_liters: data.volume_liters ?? null,
          scheduled_for: data.scheduled_for ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );

/** Harvest — record a harvest event. */
export const agricultureHarvestRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      harvest_ref: z.string().min(1).max(120),
      farm_ref: z.string().min(1).max(120),
      crop: z.string().min(1).max(120),
      quantity_kg: z.number().nonnegative(),
      quality_grade: z.string().optional(),
      harvested_on: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAgriculturePipeline(
      {
        ...data,
        module: "harvest",
        reference: data.harvest_ref,
        payload: {
          farm_ref: data.farm_ref, crop: data.crop,
          quantity_kg: data.quantity_kg,
          quality_grade: data.quality_grade ?? null,
          harvested_on: data.harvested_on ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );

/** Market Prices — capture a market price snapshot. */
export const agricultureMarketPriceCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      capture_ref: z.string().min(1).max(120),
      market: z.string().min(1).max(120),
      commodity: z.string().min(1).max(120),
      price_per_kg_cents: z.number().int().nonnegative(),
      observed_at: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAgriculturePipeline(
      {
        ...data,
        module: "market_link",
        reference: data.capture_ref,
        payload: {
          market: data.market, commodity: data.commodity,
          price_per_kg_cents: data.price_per_kg_cents,
          observed_at: data.observed_at ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );

/** Weather — capture a weather snapshot for a farm. */
export const agricultureWeatherSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      snapshot_ref: z.string().min(1).max(120),
      farm_ref: z.string().min(1).max(120),
      temperature_c: z.number(),
      humidity_pct: z.number().min(0).max(100).optional(),
      rainfall_mm: z.number().nonnegative().optional(),
      wind_kph: z.number().nonnegative().optional(),
      observed_at: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runAgriculturePipeline(
      {
        ...data,
        module: "weather_link",
        reference: data.snapshot_ref,
        payload: {
          farm_ref: data.farm_ref, temperature_c: data.temperature_c,
          humidity_pct: data.humidity_pct ?? null,
          rainfall_mm: data.rainfall_mm ?? null,
          wind_kph: data.wind_kph ?? null,
          observed_at: data.observed_at ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );
