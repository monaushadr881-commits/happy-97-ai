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

export const PARTNER_MODULES = ["registration", "revenue", "dealer", "distributor"] as const;
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
  force_approval?: boolean;
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
  if ((brain.output.requires_approval || data.force_approval) && data.company_id) {
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

/**
 * R191 Batch 1 — Dealer + Distributor + Sales Network™
 *
 * Extends the SINGLE canonical Partner runtime with the full Dealer and
 * Distributor workflow. Every mutation flows through `runPartnerPipeline`
 * (adoptToCanonicalPipeline → withBrain → R158 approval → audit → execution).
 * No new runtime, no new tables, no new dashboard. Persistence lands in
 * `public.creator_assets` (kind: "partner.dealer" | "partner.distributor")
 * with `payload.action` distinguishing registration / order / ledger / kyc /
 * document / territory / performance / notification / report.
 */

type DealerAction =
  | "registration" | "approval" | "order" | "ledger" | "kyc"
  | "document" | "territory" | "performance" | "notification" | "report";

const DealerBase = {
  ...Base,
  dealer_ref: z.string().min(1).max(160),
  company_id: uuid, // dealer flows require a company for approval routing
};

const DistributorBase = {
  ...Base,
  distributor_ref: z.string().min(1).max(160),
  company_id: uuid,
};

async function runDealer(
  ctx: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
  args: {
    kind: "dealer" | "distributor";
    ref: string;
    action: DealerAction;
    company_id: string;
    workspace_id?: string;
    currency: string;
    tags: string[];
    amount_cents: number;
    force_approval: boolean;
    payload: Record<string, unknown>;
  },
) {
  return runPartnerPipeline(
    {
      module: args.kind,
      reference: `${args.action}:${args.ref}`,
      amount_cents: args.amount_cents,
      company_id: args.company_id,
      workspace_id: args.workspace_id,
      currency: args.currency,
      tags: [...args.tags, args.kind, args.action],
      payload: { action: args.action, ...args.payload },
      force_approval: args.force_approval,
    },
    ctx,
  );
}

/* ── Dealer ───────────────────────────────────────────────────────────── */

export const dealerRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    name: z.string().min(1).max(200),
    contact: z.string().max(200).optional(),
    territory: z.string().max(120).optional(),
    notes: z.string().max(2000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "registration",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: true,
    payload: { name: data.name, contact: data.contact ?? null, territory: data.territory ?? null, notes: data.notes ?? null, status: "pending" },
  }));

export const dealerKycSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    pan: z.string().max(20).optional(),
    gstin: z.string().max(20).optional(),
    documents_ref: z.array(z.string().max(160)).max(20).default([]),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "kyc",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: true,
    payload: { pan: data.pan ?? null, gstin: data.gstin ?? null, documents_ref: data.documents_ref },
  }));

export const dealerDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    document_ref: z.string().min(1).max(160),
    doc_type: z.enum(["agreement", "kyc", "invoice", "policy", "other"]).default("other"),
    storage_url: z.string().max(500).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "document",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: false,
    payload: { document_ref: data.document_ref, doc_type: data.doc_type, storage_url: data.storage_url ?? null },
  }));

export const dealerTerritoryAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    territory: z.string().min(1).max(200),
    region: z.string().max(120).optional(),
    exclusive: z.boolean().default(false),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "territory",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: data.exclusive,
    payload: { territory: data.territory, region: data.region ?? null, exclusive: data.exclusive },
  }));

export const dealerOrderRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    order_ref: z.string().min(1).max(160),
    amount_cents: z.number().int().nonnegative(),
    items: z.number().int().min(0).max(10_000).default(0),
    notes: z.string().max(2000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "order",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: data.amount_cents, force_approval: false,
    payload: { order_ref: data.order_ref, items: data.items, notes: data.notes ?? null },
  }));

export const dealerLedgerEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    entry_ref: z.string().min(1).max(160),
    entry_type: z.enum(["invoice", "payment", "credit_note", "debit_note", "adjustment"]),
    amount_cents: z.number().int(),
    notes: z.string().max(2000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "ledger",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: Math.abs(data.amount_cents), force_approval: false,
    payload: { entry_ref: data.entry_ref, entry_type: data.entry_type, amount_cents: data.amount_cents, notes: data.notes ?? null },
  }));

export const dealerPerformanceRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    period: z.string().min(1).max(40),
    target_cents: z.number().int().nonnegative().default(0),
    achieved_cents: z.number().int().nonnegative().default(0),
    score: z.number().min(0).max(100).default(0),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "performance",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: data.achieved_cents, force_approval: false,
    payload: { period: data.period, target_cents: data.target_cents, achieved_cents: data.achieved_cents, score: data.score },
  }));

export const dealerNotificationSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    channel: z.enum(["email", "sms", "in_app", "whatsapp"]).default("in_app"),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(4000),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "notification",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: false,
    payload: { channel: data.channel, subject: data.subject, body: data.body },
  }));

export const dealerReportGenerate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DealerBase,
    report_type: z.enum(["sales", "ledger", "performance", "kyc", "compliance"]),
    period: z.string().min(1).max(40),
    summary: z.string().max(4000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "dealer", ref: data.dealer_ref, action: "report",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: false,
    payload: { report_type: data.report_type, period: data.period, summary: data.summary ?? null },
  }));

/* ── Distributor ──────────────────────────────────────────────────────── */

export const distributorRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DistributorBase,
    name: z.string().min(1).max(200),
    contact: z.string().max(200).optional(),
    region: z.string().max(200).optional(),
    coverage_area: z.string().max(400).optional(),
    notes: z.string().max(2000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "distributor", ref: data.distributor_ref, action: "registration",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: true,
    payload: { name: data.name, contact: data.contact ?? null, region: data.region ?? null, coverage_area: data.coverage_area ?? null, notes: data.notes ?? null, status: "pending" },
  }));

export const distributorTerritoryAssign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DistributorBase,
    region: z.string().min(1).max(200),
    states: z.array(z.string().max(80)).max(50).default([]),
    exclusive: z.boolean().default(false),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "distributor", ref: data.distributor_ref, action: "territory",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: data.exclusive,
    payload: { region: data.region, states: data.states, exclusive: data.exclusive },
  }));

export const distributorOrderRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DistributorBase,
    order_ref: z.string().min(1).max(160),
    amount_cents: z.number().int().nonnegative(),
    items: z.number().int().min(0).max(100_000).default(0),
    notes: z.string().max(2000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "distributor", ref: data.distributor_ref, action: "order",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: data.amount_cents, force_approval: false,
    payload: { order_ref: data.order_ref, items: data.items, notes: data.notes ?? null },
  }));

export const distributorLedgerEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DistributorBase,
    entry_ref: z.string().min(1).max(160),
    entry_type: z.enum(["invoice", "payment", "credit_note", "debit_note", "adjustment"]),
    amount_cents: z.number().int(),
    notes: z.string().max(2000).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "distributor", ref: data.distributor_ref, action: "ledger",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: Math.abs(data.amount_cents), force_approval: false,
    payload: { entry_ref: data.entry_ref, entry_type: data.entry_type, amount_cents: data.amount_cents, notes: data.notes ?? null },
  }));

export const distributorDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ...DistributorBase,
    document_ref: z.string().min(1).max(160),
    doc_type: z.enum(["agreement", "kyc", "invoice", "policy", "other"]).default("other"),
    storage_url: z.string().max(500).optional(),
  }).parse(i))
  .handler(({ data, context }) => runDealer(context, {
    kind: "distributor", ref: data.distributor_ref, action: "document",
    company_id: data.company_id, workspace_id: data.workspace_id,
    currency: data.currency, tags: data.tags, amount_cents: 0, force_approval: false,
    payload: { document_ref: data.document_ref, doc_type: data.doc_type, storage_url: data.storage_url ?? null },
  }));

/* ── Sales Network readers + Mission Control aggregation ─────────────── */

export const dealerNetworkList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    kind: z.enum(["dealer", "distributor"]).optional(),
    action: z.string().max(40).optional(),
    limit: z.number().int().min(1).max(200).default(100),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const like = data.kind ? `partner.${data.kind}` : "partner.dealer";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", data.kind ? like : "partner.%")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (!data.kind) q = q.in("kind", ["partner.dealer", "partner.distributor"]);
    const r = await q;
    if (r.error) throw new Error(`dealer_network_list_failed: ${r.error.message}`);
    const items = r.data ?? [];
    return data.action
      ? items.filter((row) => {
          const m = row.metadata as { payload?: { action?: string } } | null;
          return m?.payload?.action === data.action;
        })
      : items;
  });

export const dealerNetworkHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await context.supabase
      .from("creator_assets")
      .select("kind,metadata,created_at")
      .in("kind", ["partner.dealer", "partner.distributor"])
      .order("created_at", { ascending: false })
      .limit(1000);
    if (r.error) throw new Error(`dealer_network_health_failed: ${r.error.message}`);
    const rows = (r.data ?? []) as Array<{ kind: string; metadata: Record<string, unknown> | null; created_at: string }>;
    const stats = {
      dealers: { total: 0, orders: 0, order_value_cents: 0, pending_approval: 0 },
      distributors: { total: 0, orders: 0, order_value_cents: 0, pending_approval: 0 },
    };
    let latest: string | null = null;
    for (const row of rows) {
      const bucket = row.kind === "partner.dealer" ? stats.dealers : stats.distributors;
      const md = (row.metadata ?? {}) as { payload?: { action?: string }; amount_cents?: number; impact?: { requires_approval?: boolean } };
      const action = md.payload?.action;
      if (action === "registration") bucket.total += 1;
      if (action === "order") { bucket.orders += 1; bucket.order_value_cents += Number(md.amount_cents ?? 0); }
      if (md.impact?.requires_approval) bucket.pending_approval += 1;
      if (!latest || row.created_at > latest) latest = row.created_at;
    }
    return { status: "operational" as const, latest_activity_at: latest, ...stats };
  });
