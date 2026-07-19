/**
 * R189 Batch 12 — HAPPY Infinity OS™ · Core Integration (Canonical Owner)
 *
 * SINGLE canonical Infinity integration owner. Composes existing canonical
 * runtimes ONLY — no new brain, runtime, search, memory, dashboard, tables,
 * services, APIs, or V2 surfaces.
 *
 * Reuses (Canonical Scan):
 *   • Brain           → src/lib/founder/with-brain.ts + public.brain_sessions
 *   • Pipeline        → src/lib/founder/pipeline.ts (adoptToCanonicalPipeline)
 *   • Approval R158   → src/lib/founder/approval.functions.ts + public.approvals
 *   • Audit           → src/lib/founder/audit.ts → public.audit_logs
 *   • Workspace       → public.creator_assets (kind: "infinity.*")
 *   • Mission Control → src/lib/founder/mission-control.functions.ts
 *                        (auto-aggregates via pipeline.infinity.*)
 *
 * Integration Map (Founder blueprint, reused owners — read-only references):
 *   platform → universal-runtime → business → revenue → creator → workspace →
 *   knowledge → publishing → enterprise → education → communication →
 *   marketplace → manufacturing → healthcare → agriculture → cloud →
 *   commerce → partner → ai → mission-control
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

/** Canonical integration map — reused domains (owner-only, no runtime here). */
export const INFINITY_DOMAINS = [
  "platform",
  "universal-runtime",
  "business",
  "revenue",
  "creator",
  "workspace",
  "knowledge",
  "publishing",
  "enterprise",
  "education",
  "communication",
  "marketplace",
  "manufacturing",
  "healthcare",
  "agriculture",
  "cloud",
  "commerce",
  "partner",
  "ai",
  "mission-control",
] as const;
export type InfinityDomain = typeof INFINITY_DOMAINS[number];

const INFINITY_MODULES = ["orchestrate", "register", "probe"] as const;
type InfinityModule = typeof INFINITY_MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: InfinityModule; domains: number; cost_cents: number; critical: boolean },
  Impact
>({
  capability: "infinity.impact",
  handler: ({ module, domains, cost_cents, critical }) => {
    if (critical) return { severity: "critical", requires_approval: true, reason: "critical_infinity_action" };
    if (cost_cents >= APPROVAL_THRESHOLD_CENTS) {
      return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    }
    if (module === "orchestrate" && domains >= 5) {
      return { severity: "warning", requires_approval: true, reason: "cross_domain_orchestration" };
    }
    if (module === "register") return { severity: "notice", requires_approval: false, reason: "domain_registration" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const DomainEnum = z.enum(INFINITY_DOMAINS);

interface Submit {
  module: InfinityModule;
  reference: string;
  domains: InfinityDomain[];
  cost_cents: number;
  critical: boolean;
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

async function runInfinityPipeline(
  data: Submit,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "infinity",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: data.company_id ?? ZERO_UUID,
    metadata: {
      domains: data.domains,
      cost_cents: data.cost_cents,
      currency: data.currency,
      critical: data.critical,
    },
  });
  const brain = await analyze({
    capability: "infinity.impact",
    input: {
      module: data.module,
      domains: data.domains.length,
      cost_cents: data.cost_cents,
      critical: data.critical,
    },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `infinity.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `infinity.${data.module}`,
        entity_id: crypto.randomUUID(),
        title: `Infinity · ${data.module} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents || undefined,
        currency: data.currency,
        metadata: {
          source: "infinity",
          module: data.module,
          domains: data.domains,
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
  const meta = {
    domain: "infinity",
    module: data.module,
    reference: data.reference,
    workspace_id: data.workspace_id ?? null,
    company_id: data.company_id ?? null,
    domains: data.domains,
    cost_cents: data.cost_cents,
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
      mime_type: "application/x-happy-infinity+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "infinity", data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`infinity_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "infinity",
    action: `${data.module}.record`,
    entity_type: "creator_asset",
    entity_id: record.id,
    company_id: data.company_id ?? undefined,
    after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, domains: data.domains, impact: brain.output },
  });
  return { status: "recorded", record, impact: brain.output };
}

const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  currency: z.string().min(3).max(8).default("INR"),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Cross-domain Founder orchestration through the canonical pipeline. */
export const infinityOrchestrate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      orchestration_ref: z.string().min(1).max(160),
      intent: z.string().min(1).max(2000),
      domains: z.array(DomainEnum).min(1).max(INFINITY_DOMAINS.length),
      cost_cents: z.number().int().nonnegative().default(0),
      critical: z.boolean().default(false),
      plan: z.array(z.object({
        domain: DomainEnum,
        action: z.string().min(1).max(200),
        owner: z.string().min(1).max(200),
      })).max(64).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runInfinityPipeline(
      {
        module: "orchestrate",
        reference: data.orchestration_ref,
        domains: data.domains,
        cost_cents: data.cost_cents,
        critical: data.critical,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { intent: data.intent, plan: data.plan },
      },
      context,
    ),
  );

/** Register/refresh a canonical domain into the Infinity integration map. */
export const infinityRegisterDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      domain: DomainEnum,
      owner_path: z.string().min(1).max(240),
      notes: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runInfinityPipeline(
      {
        module: "register",
        reference: data.domain,
        domains: [data.domain],
        cost_cents: 0,
        critical: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { owner_path: data.owner_path, notes: data.notes ?? null },
      },
      context,
    ),
  );

/** Record an Infinity integration health probe (reads pipeline audit ledger). */
export const infinityHealthProbe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      probe_ref: z.string().min(1).max(160),
      window_hours: z.number().int().min(1).max(720).default(24),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.window_hours * 3_600_000).toISOString();
    const { data: rows } = await context.supabase
      .from("audit_logs")
      .select("category,metadata")
      .eq("action", "adopt")
      .like("category", "pipeline.%")
      .gte("created_at", since)
      .limit(2000);
    const observed = new Set<string>();
    for (const r of (rows ?? []) as Array<{ category: string }>) {
      observed.add(r.category.replace(/^pipeline\./, ""));
    }
    const expected = INFINITY_DOMAINS.length;
    const covered = INFINITY_DOMAINS.filter((d) =>
      observed.has(d) || observed.has(d.replace(/-/g, "_")),
    ).length;
    const coverage_pct = Math.round((covered / expected) * 100);
    const result = await runInfinityPipeline(
      {
        module: "probe",
        reference: data.probe_ref,
        domains: INFINITY_DOMAINS as unknown as InfinityDomain[],
        cost_cents: 0,
        critical: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: {
          window_hours: data.window_hours,
          observed: Array.from(observed),
          covered,
          expected,
          coverage_pct,
        },
      },
      context,
    );
    return { ...result, coverage: { covered, expected, coverage_pct } };
  });

/** List Infinity assets (orchestrations, domain registrations, probes). */
export const infinityList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(INFINITY_MODULES).optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `infinity.${data.module}` : "infinity.%";
    const q = context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(`infinity_list_failed: ${error.message}`);
    return { items: rows ?? [] };
  });

/** Read the current Infinity integration coverage from the pipeline ledger. */
export const infinityCoverage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ window_hours: z.number().int().min(1).max(720).default(168) }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - data.window_hours * 3_600_000).toISOString();
    const { data: rows } = await context.supabase
      .from("audit_logs")
      .select("category,metadata,occurred_at")
      .eq("action", "adopt")
      .like("category", "pipeline.%")
      .gte("created_at", since)
      .order("occurred_at", { ascending: false })
      .limit(2000);
    const per_domain = new Map<string, number>();
    for (const r of (rows ?? []) as Array<{ category: string }>) {
      const d = r.category.replace(/^pipeline\./, "");
      per_domain.set(d, (per_domain.get(d) ?? 0) + 1);
    }
    const domains = INFINITY_DOMAINS.map((d) => ({
      domain: d,
      integrated: per_domain.has(d) || per_domain.has(d.replace(/-/g, "_")),
      count_window: per_domain.get(d) ?? per_domain.get(d.replace(/-/g, "_")) ?? 0,
    }));
    const integrated = domains.filter((d) => d.integrated).length;
    return {
      window_hours: data.window_hours,
      integrated,
      expected: INFINITY_DOMAINS.length,
      coverage_pct: Math.round((integrated / INFINITY_DOMAINS.length) * 100),
      domains,
    };
  });
