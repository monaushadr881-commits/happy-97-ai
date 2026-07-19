/**
 * R189 Batch 8+9 — Healthcare Runtime (Canonical Owner)
 *
 * CANONICAL OWNER for all future Healthcare development.
 * No second implementation may ever be created.
 *
 * Canonical Scan (reused, NEVER duplicated):
 *   persistence  → public.creator_assets (kind: "healthcare.<module>")
 *   approvals    → requestFounderApproval (R158)
 *   audit        → writeCanonicalAudit
 *   brain        → withBrain
 *   pipeline     → adoptToCanonicalPipeline
 *   auth/RLS     → requireSupabaseAuth
 *
 * Foundation Modules (Batch 8): patient, appointment, medical_record,
 *                     prescription, telemedicine, health_knowledge.
 * Batch 9 additions: health_analytics, emergency_case, fitness_record,
 *                    wellness_record, medicine_schedule.
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

export const HEALTHCARE_MODULES = [
  "patient", "appointment", "medical_record",
  "prescription", "telemedicine", "health_knowledge",
  // Batch 9
  "health_analytics", "emergency_case",
  "fitness_record", "wellness_record", "medicine_schedule",
] as const;
export type HealthcareModule = typeof HEALTHCARE_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: HealthcareModule; cost_cents: number | null; critical: boolean },
  Impact
>({
  capability: "healthcare.impact",
  handler: ({ module, cost_cents, critical }) => {
    const highCost = typeof cost_cents === "number" && cost_cents >= APPROVAL_THRESHOLD_CENTS;
    const criticalModule =
      module === "prescription" || module === "medical_record" ||
      module === "emergency_case" || module === "medicine_schedule";
    if (critical || (criticalModule && highCost) || module === "emergency_case") {
      return { severity: "critical", requires_approval: true, reason: "clinical_critical_operation" };
    }
    if (highCost) return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    if (criticalModule) return { severity: "warning", requires_approval: false, reason: "phi_sensitive_module" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const SubmitInput = z.object({
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  module: z.enum(HEALTHCARE_MODULES),
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

async function runHealthcarePipeline(
  data: SubmitData,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "healthcare",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: ZERO_UUID,
    metadata: { cost_cents: data.cost_cents ?? null, critical: data.critical },
  });
  const brain = await analyze({
    capability: "healthcare.impact",
    input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `healthcare.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `vertical.${kind}`,
        entity_id: crypto.randomUUID(),
        title: `Healthcare · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents ?? undefined,
        currency: data.currency,
        metadata: {
          source: "healthcare",
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
    vertical: "healthcare",
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
      tags: Array.from(new Set([...data.tags, "healthcare", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`healthcare_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "vertical.healthcare",
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

export const healthcareSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitInput.parse(i))
  .handler(async ({ data, context }): Promise<SubmitResult> => runHealthcarePipeline(data, context));

export const healthcareList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(HEALTHCARE_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `healthcare.${data.module}` : "healthcare.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`healthcare_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// -----------------------------------------------------------------------------
// Batch 9 — specific healthcare handlers.
// -----------------------------------------------------------------------------

const BaseFields = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  cost_cents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  critical: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Patient — register a patient record. */
export const healthcarePatientRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      patient_ref: z.string().min(1).max(120),
      full_name: z.string().min(1).max(200),
      dob: z.string().optional(),
      gender: z.string().optional(),
      contact: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "patient",
        reference: data.patient_ref,
        payload: {
          full_name: data.full_name, dob: data.dob ?? null,
          gender: data.gender ?? null, contact: data.contact ?? null,
        },
      },
      context,
    ),
  );

/** Appointment — schedule a clinical appointment. */
export const healthcareAppointmentSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      appointment_ref: z.string().min(1).max(120),
      patient_ref: z.string().min(1).max(120),
      provider: z.string().min(1).max(200),
      scheduled_for: z.string(),
      reason: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "appointment",
        reference: data.appointment_ref,
        payload: {
          patient_ref: data.patient_ref, provider: data.provider,
          scheduled_for: data.scheduled_for, reason: data.reason ?? null,
        },
      },
      context,
    ),
  );

/** Medical Record — append an EHR entry. */
export const healthcareMedicalRecordAppend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      record_ref: z.string().min(1).max(120),
      patient_ref: z.string().min(1).max(120),
      encounter_type: z.string().min(1).max(80),
      diagnosis: z.string().max(4000).optional(),
      vitals: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
      notes: z.string().max(8000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "medical_record",
        reference: data.record_ref,
        payload: {
          patient_ref: data.patient_ref, encounter_type: data.encounter_type,
          diagnosis: data.diagnosis ?? null, vitals: data.vitals ?? {},
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Prescription — issue a prescription. */
export const healthcarePrescriptionIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      prescription_ref: z.string().min(1).max(120),
      patient_ref: z.string().min(1).max(120),
      prescriber: z.string().min(1).max(200),
      items: z.array(z.object({
        drug: z.string(), dose: z.string(), frequency: z.string(), duration_days: z.number().int().positive(),
      })).min(1),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "prescription",
        reference: data.prescription_ref,
        critical: true,
        payload: {
          patient_ref: data.patient_ref, prescriber: data.prescriber, items: data.items,
        },
      },
      context,
    ),
  );

/** Telemedicine — start/log a telemedicine session. */
export const healthcareTelemedicineStart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      session_ref: z.string().min(1).max(120),
      patient_ref: z.string().min(1).max(120),
      provider: z.string().min(1).max(200),
      channel: z.enum(["video", "audio", "chat"]),
      started_at: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "telemedicine",
        reference: data.session_ref,
        payload: {
          patient_ref: data.patient_ref, provider: data.provider, channel: data.channel,
          started_at: data.started_at ?? new Date().toISOString(),
        },
      },
      context,
    ),
  );

/** Emergency Case — open an emergency incident. Always critical. */
export const healthcareEmergencyCaseOpen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      case_ref: z.string().min(1).max(120),
      patient_ref: z.string().optional(),
      severity_level: z.enum(["red", "orange", "yellow", "green"]),
      location: z.string().min(1).max(200),
      description: z.string().max(4000),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "emergency_case",
        reference: data.case_ref,
        critical: true,
        payload: {
          patient_ref: data.patient_ref ?? null, severity_level: data.severity_level,
          location: data.location, description: data.description,
        },
      },
      context,
    ),
  );

/** Medicine Schedule — set a patient's medicine schedule. */
export const healthcareMedicineScheduleSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      schedule_ref: z.string().min(1).max(120),
      patient_ref: z.string().min(1).max(120),
      medicines: z.array(z.object({
        drug: z.string(), dose: z.string(), times: z.array(z.string()).min(1),
      })).min(1),
      valid_until: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runHealthcarePipeline(
      {
        ...data,
        module: "medicine_schedule",
        reference: data.schedule_ref,
        payload: {
          patient_ref: data.patient_ref, medicines: data.medicines,
          valid_until: data.valid_until ?? null,
        },
      },
      context,
    ),
  );
