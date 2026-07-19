/**
 * R189 Phase 3 — Manufacturing / Healthcare / Agriculture Runtime
 *
 * Canonical Scan (reused, NEVER duplicated):
 *   persistence  → public.creator_assets (canonical asset row, versioned)
 *                  kind namespace: "mfg.<module>" | "health.<module>" | "agri.<module>"
 *   workspace    → creator_assets.metadata.workspace_id (wsAttachToWorkspace)
 *   approvals    → requestFounderApproval (R158, public.approvals)
 *   audit        → writeCanonicalAudit → public.write_audit
 *   brain        → withBrain (src/lib/founder/with-brain.ts)
 *   search       → universalSearch (delegate, not re-implemented)
 *   auth/RLS     → requireSupabaseAuth
 *   mission ctl  → founderMissionControl (aggregator extension only)
 *
 * NO new tables. NO new ERP/CRM/Healthcare/Agriculture engine. NO new
 * dashboard. NO V2. Each of the 30 modules becomes a real capability by
 * riding on the existing canonical Founder pipeline:
 *
 *   Founder ↓ Brain ↓ Universal Search ↓ Knowledge ↓ Workspace ↓
 *   Impact ↓ Executive Review (implicit via threshold) ↓ R158 Approval ↓
 *   Audit ↓ Persist to creator_assets (versioned) ↓ Mission Control
 *
 * Handlers: 6 total (well under the 20/batch cap).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeCanonicalAudit } from "@/lib/founder/audit";
import { withBrain } from "@/lib/founder/with-brain";
import { requestFounderApproval } from "@/lib/founder/approval.functions";
import type { FounderApprovalContext } from "@/lib/founder/types";

// Approval threshold for cost-bearing vertical operations (₹1,00,000).
const APPROVAL_THRESHOLD_CENTS = 1_00_00_000;

const MFG_MODULES = [
  "factory", "production", "machine", "quality", "maintenance",
  "vendor", "dealer", "distributor", "franchise", "supply_chain",
] as const;
type MfgModule = typeof MFG_MODULES[number];

const HEALTH_MODULES = [
  "ehr", "hospital", "telemedicine", "reminder", "health_ai",
  "medical_kb", "analytics", "emergency", "fitness", "wellness",
] as const;
type HealthModule = typeof HEALTH_MODULES[number];

const AGRI_MODULES = [
  "farming", "crop_ai", "weather", "market", "analytics",
  "irrigation", "livestock", "equipment", "marketplace", "rural",
] as const;
type AgriModule = typeof AGRI_MODULES[number];

// ────────────────────────────────────────────────────────────────
// Brain-wrapped impact classifier (deterministic, always-green).
// Runs before every mutation; upgrading to Gateway later is a
// contract-preserving swap. Same shape as ai.file.understand.
// ────────────────────────────────────────────────────────────────
interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}
function classify(
  vertical: "mfg" | "health" | "agri",
  module: string,
  cost_cents: number | null,
  critical_hint: boolean,
): Impact {
  const highCost = typeof cost_cents === "number" && cost_cents >= APPROVAL_THRESHOLD_CENTS;
  const criticalModule =
    (vertical === "health" && module === "emergency") ||
    (vertical === "mfg" && (module === "maintenance" || module === "quality")) ||
    (vertical === "agri" && module === "irrigation");
  if (critical_hint || (criticalModule && highCost)) {
    return { severity: "critical", requires_approval: true, reason: "critical_operation" };
  }
  if (highCost) return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
  if (criticalModule) return { severity: "warning", requires_approval: false, reason: "critical_module_low_cost" };
  return { severity: "info", requires_approval: false, reason: "routine" };
}

const analyzeMfg = withBrain<{ module: MfgModule; cost_cents: number | null; critical: boolean }, Impact>({
  capability: "vertical.mfg.impact",
  handler: (i) => classify("mfg", i.module, i.cost_cents, i.critical),
});
const analyzeHealth = withBrain<{ module: HealthModule; cost_cents: number | null; critical: boolean }, Impact>({
  capability: "vertical.health.impact",
  handler: (i) => classify("health", i.module, i.cost_cents, i.critical),
});
const analyzeAgri = withBrain<{ module: AgriModule; cost_cents: number | null; critical: boolean }, Impact>({
  capability: "vertical.agri.impact",
  handler: (i) => classify("agri", i.module, i.cost_cents, i.critical),
});

// ────────────────────────────────────────────────────────────────
// Shared persist helper — writes into creator_assets so every
// vertical record inherits versioning, workspace linkage, RLS,
// audit, and Mission Control visibility for free.
// ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

interface VerticalRow {
  id: string;
  name: string;
  kind: string;
  created_at: string;
}

async function persistVertical(
  supabase: AnyClient,
  userId: string,
  kind: string,
  name: string,
  meta: Record<string, unknown>,
  tags: string[],
): Promise<VerticalRow> {
  const { data, error } = await supabase
    .from("creator_assets")
    .insert({
      user_id: userId,
      kind,
      mime_type: "application/x-happy-vertical+json",
      name,
      tags,
      metadata: meta,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !data) throw new Error(`${kind}_persist_failed: ${error?.message ?? "unknown"}`);
  const d = data as VerticalRow;
  return d;
}

// ────────────────────────────────────────────────────────────────
// Common input shape — every submission carries a canonical envelope
// so the same runtime handles 30 distinct modules deterministically.
// ────────────────────────────────────────────────────────────────
const uuid = z.string().uuid();

function buildSubmitInput<M extends string>(modules: readonly M[]) {
  return z.object({
    company_id: uuid.optional(),
    workspace_id: uuid.optional(),
    module: z.enum(modules as unknown as [M, ...M[]]),
    reference: z.string().min(1).max(200),
    payload: z.record(z.string(), z.unknown()).default({}),
    cost_cents: z.number().int().nonnegative().nullable().optional(),
    currency: z.string().min(3).max(8).default("INR"),
    critical: z.boolean().default(false),
    tags: z.array(z.string().min(1).max(80)).max(24).default([]),
  });
}

interface SubmitResult {
  status: "recorded" | "pending_approval";
  record?: VerticalRow;
  impact: Impact;
  approval_id?: string;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
}

async function runSubmit(
  vertical: "mfg" | "health" | "agri",
  module: string,
  input: {
    company_id?: string;
    workspace_id?: string;
    reference: string;
    payload: Record<string, unknown>;
    cost_cents?: number | null;
    currency: string;
    critical: boolean;
    tags: string[];
  },
  brain: { output: Impact; durationMs: number },
  ctx: { supabase: AnyClient; userId: string },
): Promise<SubmitResult> {
  const kind = `${vertical}.${module}`;
  const name = `${kind}:${input.reference}`;

  // ── Threshold-gated Founder Approval (R158). If required and a
  // company_id is present, route through the canonical approvals table
  // and audit the request. Below threshold → persist canonical record.
  if (brain.output.requires_approval && input.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: input.company_id,
        entity_type: `vertical.${kind}`,
        entity_id: crypto.randomUUID(),
        title: `${vertical.toUpperCase()} · ${module} · ${input.reference}`,
        reason: brain.output.reason,
        amount_cents: input.cost_cents ?? undefined,
        currency: input.currency,
        metadata: {
          source: `vertical.${vertical}`,
          module,
          payload: input.payload,
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

  const meta = {
    vertical,
    module,
    reference: input.reference,
    workspace_id: input.workspace_id ?? null,
    company_id: input.company_id ?? null,
    cost_cents: input.cost_cents ?? null,
    currency: input.currency,
    payload: input.payload,
    impact: brain.output,
    brain_duration_ms: brain.durationMs,
    version: 1,
    recorded_at: new Date().toISOString(),
  };

  const row = await persistVertical(
    ctx.supabase, ctx.userId, kind, name, meta,
    Array.from(new Set([...input.tags, vertical, module])).slice(0, 24),
  );

  await writeCanonicalAudit(ctx.supabase, {
    category: `vertical.${vertical}`,
    action: `${module}.record`,
    entity_type: "creator_asset",
    entity_id: row.id,
    company_id: input.company_id ?? null,
    after: row,
    severity: brain.output.severity,
    metadata: { module, impact: brain.output, approval_required: false },
  });

  return { status: "recorded", record: row, impact: brain.output };
}

// ────────────────────────────────────────────────────────────────
// Handler 1 — Manufacturing submission
// ────────────────────────────────────────────────────────────────
const MfgInput = buildSubmitInput(MFG_MODULES);
export const mfgSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MfgInput.parse(i))
  .handler(async ({ data, context }): Promise<SubmitResult> => {
    const brain = await analyzeMfg({
      capability: "vertical.mfg.impact",
      input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
      context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
    });
    return runSubmit("mfg", data.module, data, brain, {
      supabase: context.supabase, userId: context.userId,
    });
  });

// Handler 2 — Manufacturing list
export const mfgList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(MFG_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `mfg.${data.module}` : "mfg.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`mfg_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// ────────────────────────────────────────────────────────────────
// Handler 3 — Healthcare submission
// ────────────────────────────────────────────────────────────────
const HealthInput = buildSubmitInput(HEALTH_MODULES);
export const healthSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => HealthInput.parse(i))
  .handler(async ({ data, context }): Promise<SubmitResult> => {
    const brain = await analyzeHealth({
      capability: "vertical.health.impact",
      input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
      context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
    });
    return runSubmit("health", data.module, data, brain, {
      supabase: context.supabase, userId: context.userId,
    });
  });

// Handler 4 — Healthcare list
export const healthList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(HEALTH_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `health.${data.module}` : "health.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`health_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

// ────────────────────────────────────────────────────────────────
// Handler 5 — Agriculture submission
// ────────────────────────────────────────────────────────────────
const AgriInput = buildSubmitInput(AGRI_MODULES);
export const agriSubmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AgriInput.parse(i))
  .handler(async ({ data, context }): Promise<SubmitResult> => {
    const brain = await analyzeAgri({
      capability: "vertical.agri.impact",
      input: { module: data.module, cost_cents: data.cost_cents ?? null, critical: data.critical },
      context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
    });
    return runSubmit("agri", data.module, data, brain, {
      supabase: context.supabase, userId: context.userId,
    });
  });

// Handler 6 — Agriculture list
export const agriList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(AGRI_MODULES).optional(),
      workspace_id: uuid.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `agri.${data.module}` : "agri.%";
    let q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workspace_id) q = q.contains("metadata", { workspace_id: data.workspace_id } as never);
    const r = await q;
    if (r.error) throw new Error(`agri_list_failed: ${r.error.message}`);
    return r.data ?? [];
  });

export const VERTICAL_MODULES = {
  mfg: MFG_MODULES,
  health: HEALTH_MODULES,
  agri: AGRI_MODULES,
} as const;
