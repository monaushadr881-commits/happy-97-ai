/**
 * R189 Batch 10 — Cloud Platform Runtime (Canonical Owner)
 *
 * CANONICAL OWNER for Universal Backup, Recovery, Licensing, and
 * Storage planning. No second implementation may ever be created.
 *
 * Canonical Scan (reused, NEVER duplicated):
 *   persistence  → public.creator_assets (kind: "cloud.<module>")
 *   workspace    → creator_assets.metadata.workspace_id
 *   approvals    → requestFounderApproval (R158)
 *   audit        → writeCanonicalAudit
 *   brain        → withBrain
 *   pipeline     → adoptToCanonicalPipeline
 *   auth/RLS     → requireSupabaseAuth
 *   mission ctl  → founderMissionControl (auto-aggregated via pipeline.cloud)
 *
 * Modules: backup, recovery, license, storage_plan.
 * NO new tables, NO new engine, NO new dashboard, NO new API surface.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { withBrain } from "@/lib/founder/with-brain";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import { memoryCache } from "@/lib/founder/read-cache";
import type { FounderApprovalContext } from "@/lib/founder/types";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const APPROVAL_THRESHOLD_CENTS = 1_00_00_000; // ₹1,00,000

export const CLOUD_MODULES = ["backup", "recovery", "license", "storage_plan"] as const;
export type CloudModule = typeof CLOUD_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: CloudModule; cost_cents: number | null; critical: boolean },
  Impact
>({
  capability: "cloud.impact",
  handler: ({ module, cost_cents, critical }) => {
    const highCost = typeof cost_cents === "number" && cost_cents >= APPROVAL_THRESHOLD_CENTS;
    const criticalModule = module === "recovery" || module === "license";
    if (critical || (criticalModule && highCost)) {
      return { severity: "critical", requires_approval: true, reason: "critical_operation" };
    }
    if (highCost) return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    if (criticalModule) return { severity: "warning", requires_approval: false, reason: "critical_module_low_cost" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const BaseFields = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  cost_cents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(8).default("INR"),
  critical: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

const SubmitInput = z.object({
  ...BaseFields,
  module: z.enum(CLOUD_MODULES),
  reference: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()).default({}),
});
type SubmitData = z.infer<typeof SubmitInput>;

interface SubmitResult {
  status: "recorded" | "pending_approval";
  record?: { id: string; name: string; kind: string; created_at: string };
  impact: Impact;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
}

async function runCloudPipeline(
  data: SubmitData,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "cloud",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: data.company_id ?? ZERO_UUID,
    metadata: { cost_cents: data.cost_cents ?? null, critical: data.critical },
  });
  const brain = await analyze({
    capability: "cloud.impact",
    input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `cloud.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `cloud.${data.module}`,
        entity_id: crypto.randomUUID(),
        title: `Cloud · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents ?? undefined,
        currency: data.currency,
        metadata: {
          source: "cloud", module: data.module, payload: data.payload,
          impact: brain.output, brain_duration_ms: brain.durationMs,
          threshold_cents: APPROVAL_THRESHOLD_CENTS,
        },
      },
    });
    return {
      status: "pending_approval", impact: brain.output,
      approval_id: approval.id, approval_status: approval.status,
    };
  }
  const name = `${kind}:${data.reference}`;
  const meta = {
    domain: "cloud", module: data.module, reference: data.reference,
    workspace_id: data.workspace_id ?? null, company_id: data.company_id ?? null,
    cost_cents: data.cost_cents ?? null, currency: data.currency,
    payload: data.payload, impact: brain.output,
    brain_duration_ms: brain.durationMs, version: 1,
    recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId, kind,
      mime_type: "application/x-happy-cloud+json",
      name,
      tags: Array.from(new Set([...data.tags, "cloud", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`cloud_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "cloud",
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

/** Universal Backup — record a backup run/plan. */
export const cloudBackupSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      backup_ref: z.string().min(1).max(160),
      target: z.string().min(1).max(200),
      scope: z.enum(["full", "incremental", "snapshot", "config", "database"]).default("full"),
      size_bytes: z.number().int().nonnegative().nullable().optional(),
      retention_days: z.number().int().positive().max(3650).default(30),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runCloudPipeline(
      {
        ...data, module: "backup", reference: data.backup_ref,
        payload: {
          target: data.target, scope: data.scope,
          size_bytes: data.size_bytes ?? null,
          retention_days: data.retention_days,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Recovery — restore/DR request. */
export const cloudRecoverySubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      recovery_ref: z.string().min(1).max(160),
      backup_ref: z.string().min(1).max(160),
      target: z.string().min(1).max(200),
      reason: z.string().min(1).max(2000),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runCloudPipeline(
      {
        ...data,
        module: "recovery",
        reference: data.recovery_ref,
        critical: true,
        payload: {
          backup_ref: data.backup_ref, target: data.target, reason: data.reason,
        },
      },
      context,
    ),
  );

/** Licensing — issue/renew/revoke a platform license. */
export const cloudLicenseIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      license_ref: z.string().min(1).max(160),
      product: z.string().min(1).max(200),
      seats: z.number().int().positive().default(1),
      action: z.enum(["issue", "renew", "revoke", "upgrade"]).default("issue"),
      valid_until: z.string().optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runCloudPipeline(
      {
        ...data,
        module: "license",
        reference: `${data.license_ref}:${data.action}`,
        critical: data.action === "revoke",
        payload: {
          product: data.product, seats: data.seats,
          action: data.action, valid_until: data.valid_until ?? null,
        },
      },
      context,
    ),
  );

/** Storage Plan — capacity / tier planning. */
export const cloudStoragePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...BaseFields,
      plan_ref: z.string().min(1).max(160),
      tier: z.enum(["standard", "cold", "archive", "hot"]).default("standard"),
      quota_bytes: z.number().int().nonnegative(),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runCloudPipeline(
      {
        ...data, module: "storage_plan", reference: data.plan_ref,
        payload: { tier: data.tier, quota_bytes: data.quota_bytes, notes: data.notes ?? null },
      },
      context,
    ),
  );

export const cloudList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(CLOUD_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) =>
    memoryCache.wrap(
      `cloud:list:${context.userId}:${data.module ?? "all"}:${data.workspace_id ?? "*"}:${data.limit}`,
      60_000,
      async () => {
        const like = data.module ? `cloud.${data.module}` : "cloud.%";
        let q = context.supabase
          .from("creator_assets")
          .select("id,name,kind,tags,metadata,created_at")
          .like("kind", like)
          .order("created_at", { ascending: false })
          .limit(data.limit);
        if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
        const r = await q;
        if (r.error) throw new Error(`cloud_list_failed: ${r.error.message}`);
        return r.data ?? [];
      },
    ),
  );
