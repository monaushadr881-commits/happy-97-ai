/**
 * R189 Batch 10 — AI Revenue Intelligence · Partner Runtime (Canonical Owner)
 *
 * CANONICAL OWNER for Partner registration and Partner / Marketplace
 * revenue recording. Sits on top of existing Revenue OS
 * (src/lib/revenue/revenue.functions.ts) — NO wallet/credits/subs
 * duplication.
 *
 * Persistence: public.creator_assets (kind: "partner.<module>").
 * Pipeline: adoptToCanonicalPipeline → withBrain → R158 approval → audit.
 * NO new tables, NO new engine, NO new dashboard.
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

export const PARTNER_MODULES = ["registration", "revenue"] as const;
export type PartnerModule = typeof PARTNER_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: PartnerModule; amount_cents: number },
  Impact
>({
  capability: "partner.impact",
  handler: ({ module, amount_cents }) => {
    if (amount_cents >= APPROVAL_THRESHOLD_CENTS) {
      return { severity: "warning", requires_approval: true, reason: "amount_exceeds_founder_threshold" };
    }
    if (module === "registration") {
      return { severity: "notice", requires_approval: false, reason: "partner_registration" };
    }
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  currency: z.string().min(3).max(8).default("INR"),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

interface SubmitCommon {
  module: PartnerModule;
  reference: string;
  amount_cents: number;
  company_id?: string;
  workspace_id?: string;
  currency: string;
  tags: string[];
  payload: Record<string, unknown>;
}

interface SubmitResult {
  status: "recorded" | "pending_approval";
  record?: { id: string; name: string; kind: string; created_at: string };
  impact: Impact;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
}

async function runPartnerPipeline(
  data: SubmitCommon,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "partner",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: data.company_id ?? ZERO_UUID,
    metadata: { amount_cents: data.amount_cents, currency: data.currency },
  });
  const brain = await analyze({
    capability: "partner.impact",
    input: { module: data.module, amount_cents: data.amount_cents },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `partner.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `partner.${data.module}`,
        entity_id: crypto.randomUUID(),
        title: `Partner · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.amount_cents,
        currency: data.currency,
        metadata: {
          source: "partner", module: data.module,
          payload: data.payload, impact: brain.output,
          brain_duration_ms: brain.durationMs,
          threshold_cents: APPROVAL_THRESHOLD_CENTS,
        },
      },
    });
    return {
      status: "pending_approval", impact: brain.output,
      approval_id: approval.id, approval_status: approval.status,
    };
  }
  const meta = {
    domain: "partner", module: data.module, reference: data.reference,
    workspace_id: data.workspace_id ?? null, company_id: data.company_id ?? null,
    amount_cents: data.amount_cents, currency: data.currency,
    payload: data.payload, impact: brain.output,
    brain_duration_ms: brain.durationMs, version: 1,
    recorded_at: new Date().toISOString(),
  };
  const { data: row, error } = await context.supabase
    .from("creator_assets")
    .insert({
      user_id: context.userId, kind,
      mime_type: "application/x-happy-partner+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "partner", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`partner_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "partner",
    action: `${data.module}.record`,
    entity_type: "creator_asset",
    entity_id: record.id,
    company_id: data.company_id ?? undefined,
    after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, impact: brain.output },
  });
  return { status: "recorded", record, impact: brain.output };
}

/** Register a partner / affiliate / distributor. */
export const partnerRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      partner_ref: z.string().min(1).max(160),
      name: z.string().min(1).max(200),
      kind: z.enum(["affiliate", "reseller", "distributor", "franchise", "integration"]).default("affiliate"),
      contact: z.string().max(200).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runPartnerPipeline(
      {
        module: "registration",
        reference: data.partner_ref,
        amount_cents: 0,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: {
          name: data.name, kind: data.kind,
          contact: data.contact ?? null, notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

/** Record partner / marketplace revenue attribution. */
export const partnerRevenueRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      revenue_ref: z.string().min(1).max(160),
      partner_ref: z.string().min(1).max(160),
      amount_cents: z.number().int().nonnegative(),
      source: z.enum(["marketplace", "affiliate", "reseller", "integration", "direct"]).default("marketplace"),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runPartnerPipeline(
      {
        module: "revenue",
        reference: data.revenue_ref,
        amount_cents: data.amount_cents,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: {
          partner_ref: data.partner_ref, source: data.source,
          notes: data.notes ?? null,
        },
      },
      context,
    ),
  );

export const partnerList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(PARTNER_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `partner.${data.module}` : "partner.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`partner_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });
