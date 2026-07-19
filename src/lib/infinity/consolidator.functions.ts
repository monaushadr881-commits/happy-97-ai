/**
 * R189 Batch 15 — HAPPY Infinity OS™ · Runtime Consolidation (Canonical Owner)
 *
 * SINGLE runtime consolidation surface. Orchestration-ONLY. Never re-implements
 * business logic, persistence, execution, or pipeline. Every domain listed in
 * CANONICAL_OWNERS remains the sole owner of its runtime.
 *
 * Reuses (Canonical Scan verified — no consolidator existed):
 *   • Pipeline        → src/lib/founder/pipeline.ts (adoptToCanonicalPipeline)
 *   • Brain           → src/lib/founder/with-brain.ts
 *   • Approval R158   → src/lib/founder/approval.functions.ts
 *   • Audit           → src/lib/founder/audit.ts
 *   • Mission Control → src/lib/founder/mission-control.functions.ts
 *   • Infinity core   → src/lib/infinity/infinity.functions.ts
 *
 * Contract:
 *   Callers submit an INTENT. Consolidator routes it through the canonical
 *   pipeline (Founder → adopt → brain → approval → audit) and RETURNS the
 *   canonical owner handle. Actual execution happens in the owner's own
 *   serverFn — never re-implemented here.
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

/**
 * Canonical Owner Registry — verified against repository at Batch 15.
 * Each entry declares the SINGLE canonical owner path for that domain.
 * The consolidator NEVER re-implements; it only routes to these owners.
 */
export const CANONICAL_OWNERS = {
  platform:            { owner: "src/lib/founder/mission-control.functions.ts",    kind: "aggregator" },
  "universal-runtime": { owner: "src/lib/founder/pipeline.ts",                     kind: "pipeline"   },
  business:            { owner: "src/lib/business/business-runtime.functions.ts",  kind: "runtime"    },
  revenue:             { owner: "src/lib/revenue/revenue.functions.ts",            kind: "runtime"    },
  creator:             { owner: "src/lib/founder/creator.functions.ts",            kind: "runtime"    },
  workspace:           { owner: "src/lib/founder/workspace-knowledge.functions.ts", kind: "runtime"   },
  knowledge:           { owner: "src/lib/founder/workspace-knowledge.functions.ts", kind: "runtime"   },
  publishing:          { owner: "src/lib/founder/publishing.functions.ts",         kind: "runtime"    },
  enterprise:          { owner: "src/lib/enterprise-v1.functions.ts",              kind: "runtime"    },
  education:           { owner: "src/lib/education-v1.functions.ts",               kind: "runtime"    },
  communication:       { owner: "src/lib/cmos-v1.functions.ts",                    kind: "runtime"    },
  marketplace:         { owner: "src/lib/cmos-v1.functions.ts",                    kind: "runtime"    },
  manufacturing:       { owner: "src/lib/manufacturing",                           kind: "runtime"    },
  healthcare:          { owner: "src/lib/healthcare",                              kind: "runtime"    },
  agriculture:         { owner: "src/lib/agriculture",                             kind: "runtime"    },
  cloud:               { owner: "src/lib/cloud/cloud.functions.ts",                kind: "runtime"    },
  commerce:            { owner: "src/lib/commerce/commerce.functions.ts",          kind: "runtime"    },
  partner:             { owner: "src/lib/partner/partner.functions.ts",            kind: "runtime"    },
  ai:                  { owner: "src/lib/ai-platform/ai-platform.functions.ts",    kind: "runtime"    },
  "digital-human":     { owner: "src/lib/digital-human/digital-human-runtime.functions.ts", kind: "runtime" },
  memory:              { owner: "src/lib/memory/memory.functions.ts",              kind: "runtime"    },
  experience:          { owner: "src/lib/experience/experience.functions.ts",      kind: "runtime"    },
  infinity:            { owner: "src/lib/infinity/infinity.functions.ts",          kind: "orchestrator" },
  universe:            { owner: "src/lib/universe/universe.functions.ts",          kind: "orchestrator" },
  "mission-control":   { owner: "src/lib/founder/mission-control.functions.ts",    kind: "aggregator" },
} as const;

export type ConsolidatedDomain = keyof typeof CANONICAL_OWNERS;
export const CONSOLIDATED_DOMAINS = Object.keys(CANONICAL_OWNERS) as ConsolidatedDomain[];

const DomainEnum = z.enum(
  CONSOLIDATED_DOMAINS as [ConsolidatedDomain, ...ConsolidatedDomain[]],
);
const uuid = z.string().uuid();

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { domain: ConsolidatedDomain; cost_cents: number; critical: boolean; cross_domain: number },
  Impact
>({
  capability: "infinity.consolidated.impact",
  handler: ({ cost_cents, critical, cross_domain }) => {
    if (critical) return { severity: "critical", requires_approval: true, reason: "critical_consolidated_action" };
    if (cost_cents >= APPROVAL_THRESHOLD_CENTS)
      return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    if (cross_domain >= 3)
      return { severity: "warning", requires_approval: true, reason: "wide_cross_domain_intent" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

/**
 * Route an intent through the canonical pipeline and return the target owner
 * handle. This handler NEVER executes owner logic — it only routes.
 */
export const infinityConsolidatedIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      intent_ref: z.string().min(1).max(160),
      primary_domain: DomainEnum,
      secondary_domains: z.array(DomainEnum).max(24).default([]),
      capability: z.string().min(1).max(120),
      intent: z.string().min(1).max(2000),
      cost_cents: z.number().int().nonnegative().default(0),
      critical: z.boolean().default(false),
      company_id: uuid.optional(),
      workspace_id: uuid.optional(),
      currency: z.string().min(3).max(8).default("INR"),
      payload: z.record(z.string(), z.unknown()).default({}),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const owner = CANONICAL_OWNERS[data.primary_domain];
    await adoptToCanonicalPipeline(context.supabase, {
      domain: "infinity",
      module: "consolidated.intent",
      capability: data.capability,
      user_id: context.userId,
      company_id: data.company_id ?? ZERO_UUID,
      metadata: {
        primary_domain: data.primary_domain,
        secondary_domains: data.secondary_domains,
        cost_cents: data.cost_cents,
        currency: data.currency,
        critical: data.critical,
        owner_path: owner.owner,
      },
    });
    const brain = await analyze({
      capability: "infinity.consolidated.impact",
      input: {
        domain: data.primary_domain,
        cost_cents: data.cost_cents,
        critical: data.critical,
        cross_domain: 1 + data.secondary_domains.length,
      },
      context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
    });
    let approval_id: string | undefined;
    let approval_status: "pending" | "approved" | "rejected" | "cancelled" | undefined;
    if (brain.output.requires_approval && data.company_id) {
      const a = await requestFounderApproval({
        data: {
          company_id: data.company_id,
          entity_type: `infinity.consolidated.${data.primary_domain}`,
          entity_id: crypto.randomUUID(),
          title: `Infinity · ${data.primary_domain} · ${data.intent_ref}`,
          reason: brain.output.reason,
          amount_cents: data.cost_cents || undefined,
          currency: data.currency,
          metadata: {
            source: "infinity.consolidated",
            primary_domain: data.primary_domain,
            secondary_domains: data.secondary_domains,
            capability: data.capability,
            owner_path: owner.owner,
            payload: data.payload,
            impact: brain.output,
            brain_duration_ms: brain.durationMs,
            threshold_cents: APPROVAL_THRESHOLD_CENTS,
          },
        },
      });
      approval_id = a.id;
      approval_status = a.status;
    }
    await writeCanonicalAudit(context.supabase, {
      category: "infinity",
      action: "consolidated.intent",
      entity_type: "infinity.consolidated",
      entity_id: data.intent_ref,
      company_id: data.company_id ?? undefined,
      severity: brain.output.severity,
      metadata: {
        primary_domain: data.primary_domain,
        secondary_domains: data.secondary_domains,
        capability: data.capability,
        owner_path: owner.owner,
        impact: brain.output,
        approval_id: approval_id ?? null,
      },
    });
    return {
      status: brain.output.requires_approval ? "pending_approval" : "routed",
      route: {
        primary: { domain: data.primary_domain, ...owner },
        secondary: data.secondary_domains.map((d) => ({ domain: d, ...CANONICAL_OWNERS[d] })),
      },
      impact: brain.output,
      approval_id,
      approval_status,
    };
  });

/** Static canonical-owner registry (no persistence, no execution). */
export const infinityConsolidatedRegistry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    total: CONSOLIDATED_DOMAINS.length,
    owners: CONSOLIDATED_DOMAINS.map((d) => ({ domain: d, ...CANONICAL_OWNERS[d] })),
  }));

/** Runtime Consolidation coverage from the pipeline audit ledger. */
export const infinityConsolidatedCoverage = createServerFn({ method: "GET" })
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
      .limit(4000);
    const observed = new Map<string, number>();
    for (const r of (rows ?? []) as Array<{ category: string }>) {
      const d = r.category.replace(/^pipeline\./, "");
      observed.set(d, (observed.get(d) ?? 0) + 1);
    }
    const domains = CONSOLIDATED_DOMAINS.map((d) => {
      const key = d.replace(/-/g, "_");
      const count = observed.get(d) ?? observed.get(key) ?? 0;
      return { domain: d, consolidated: count > 0, count_window: count, owner: CANONICAL_OWNERS[d].owner };
    });
    const consolidated = domains.filter((d) => d.consolidated).length;
    return {
      window_hours: data.window_hours,
      consolidated,
      expected: CONSOLIDATED_DOMAINS.length,
      coverage_pct: Math.round((consolidated / CONSOLIDATED_DOMAINS.length) * 100),
      domains,
    };
  });

/** List consolidated intent audits (no duplicate persistence). */
export const infinityConsolidatedList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      domain: DomainEnum.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("audit_logs")
      .select("id,category,action,entity_id,severity,metadata,occurred_at")
      .eq("category", "infinity")
      .eq("action", "consolidated.intent")
      .order("occurred_at", { ascending: false })
      .limit(data.limit);
    if (data.domain) {
      q = q.contains("metadata", { primary_domain: data.domain } as never);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(`infinity_consolidated_list_failed: ${error.message}`);
    return { items: rows ?? [] };
  });
