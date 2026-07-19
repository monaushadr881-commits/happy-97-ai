/**
 * R189 Batch 14 — HAPPY Universe OS™ · Global Platform / World Ecosystem
 *
 * SINGLE canonical Universe owner. Orchestration-only: composes existing
 * canonical runtimes (Infinity, Business, Enterprise, Workspace, Knowledge,
 * AI Platform, Experience, Memory, Digital Human, Partner, Cloud, Mission
 * Control). Never a duplicate platform.
 *
 * Reuses (Canonical Scan proved no `universe` owner exists):
 *   • Pipeline        → src/lib/founder/pipeline.ts (adoptToCanonicalPipeline)
 *   • Brain           → src/lib/founder/with-brain.ts
 *   • Approval R158   → src/lib/founder/approval.functions.ts
 *   • Audit           → src/lib/founder/audit.ts
 *   • Workspace       → public.creator_assets (kind: "universe.*")
 *   • Mission Control → auto-aggregates via pipeline.universe.*
 *
 * Facets (Founder targets):
 *   global-platform · world-ecosystem · identity · company-network ·
 *   brand-network · workspace-federation · tenant-federation · ai-routing ·
 *   knowledge-federation · global-experience
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

export const UNIVERSE_FACETS = [
  "global-platform",
  "world-ecosystem",
  "identity",
  "company-network",
  "brand-network",
  "workspace-federation",
  "tenant-federation",
  "ai-routing",
  "knowledge-federation",
  "global-experience",
] as const;
export type UniverseFacet = typeof UNIVERSE_FACETS[number];

const MODULES = [
  "platform.register",
  "ecosystem.register",
  "identity.link",
  "company.network",
  "brand.network",
  "workspace.federate",
  "tenant.federate",
  "ai.route",
  "knowledge.federate",
  "experience.publish",
] as const;
type UniverseModule = typeof MODULES[number];

interface Impact {
  severity: "info" | "notice" | "warning" | "critical";
  requires_approval: boolean;
  reason: string;
}

const analyze = withBrain<
  { module: UniverseModule; scope: number; cost_cents: number; critical: boolean; cross_tenant: boolean },
  Impact
>({
  capability: "universe.impact",
  handler: ({ module, scope, cost_cents, critical, cross_tenant }) => {
    if (critical) return { severity: "critical", requires_approval: true, reason: "critical_universe_action" };
    if (cost_cents >= APPROVAL_THRESHOLD_CENTS)
      return { severity: "warning", requires_approval: true, reason: "cost_exceeds_founder_threshold" };
    if (cross_tenant) return { severity: "warning", requires_approval: true, reason: "cross_tenant_federation" };
    if ((module === "workspace.federate" || module === "tenant.federate") && scope >= 3)
      return { severity: "warning", requires_approval: true, reason: "wide_federation_scope" };
    if (module === "ai.route" && scope >= 5)
      return { severity: "notice", requires_approval: false, reason: "multi_provider_routing" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

const uuid = z.string().uuid();
const FacetEnum = z.enum(UNIVERSE_FACETS);

interface Submit {
  module: UniverseModule;
  facet: UniverseFacet;
  reference: string;
  scope: number;
  cost_cents: number;
  critical: boolean;
  cross_tenant: boolean;
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

async function runUniversePipeline(
  data: Submit,
  context: { supabase: import("@supabase/supabase-js").SupabaseClient; userId: string },
): Promise<SubmitResult> {
  await adoptToCanonicalPipeline(context.supabase, {
    domain: "universe",
    module: data.module,
    capability: "submit",
    user_id: context.userId,
    company_id: data.company_id ?? ZERO_UUID,
    metadata: {
      facet: data.facet,
      scope: data.scope,
      cost_cents: data.cost_cents,
      currency: data.currency,
      critical: data.critical,
      cross_tenant: data.cross_tenant,
    },
  });
  const brain = await analyze({
    capability: "universe.impact",
    input: {
      module: data.module,
      scope: data.scope,
      cost_cents: data.cost_cents,
      critical: data.critical,
      cross_tenant: data.cross_tenant,
    },
    context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
  });
  const kind = `universe.${data.module}`;
  if (brain.output.requires_approval && data.company_id) {
    const approval = await requestFounderApproval({
      data: {
        company_id: data.company_id,
        entity_type: `universe.${data.module}`,
        entity_id: crypto.randomUUID(),
        title: `Universe · ${data.facet} · ${data.reference}`,
        reason: brain.output.reason,
        amount_cents: data.cost_cents || undefined,
        currency: data.currency,
        metadata: {
          source: "universe",
          module: data.module,
          facet: data.facet,
          scope: data.scope,
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
    domain: "universe",
    module: data.module,
    facet: data.facet,
    reference: data.reference,
    workspace_id: data.workspace_id ?? null,
    company_id: data.company_id ?? null,
    scope: data.scope,
    cost_cents: data.cost_cents,
    currency: data.currency,
    cross_tenant: data.cross_tenant,
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
      mime_type: "application/x-happy-universe+json",
      name: `${kind}:${data.reference}`,
      tags: Array.from(new Set([...data.tags, "universe", data.facet, data.module])).slice(0, 24),
      metadata: meta as never,
    })
    .select("id,name,kind,created_at")
    .single();
  if (error || !row) throw new Error(`universe_persist_failed: ${error?.message ?? "unknown"}`);
  const record = row as { id: string; name: string; kind: string; created_at: string };
  await writeCanonicalAudit(context.supabase, {
    category: "universe",
    action: `${data.module}.record`,
    entity_type: "creator_asset",
    entity_id: record.id,
    company_id: data.company_id ?? undefined,
    after: record,
    severity: brain.output.severity,
    metadata: { module: data.module, facet: data.facet, impact: brain.output },
  });
  return { status: "recorded", record, impact: brain.output };
}

const Base = {
  company_id: uuid.optional(),
  workspace_id: uuid.optional(),
  currency: z.string().min(3).max(8).default("INR"),
  tags: z.array(z.string().min(1).max(80)).max(24).default([]),
};

/** Global Platform™ — register/refresh the global platform surface. */
export const universeGlobalPlatformRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      platform_ref: z.string().min(1).max(160),
      regions: z.array(z.string().min(1).max(80)).min(1).max(64),
      capabilities: z.array(z.string().min(1).max(120)).max(64).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "platform.register",
        facet: "global-platform",
        reference: data.platform_ref,
        scope: data.regions.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { regions: data.regions, capabilities: data.capabilities },
      },
      context,
    ),
  );

/** World Ecosystem™ — register a partner/ally node into the ecosystem graph. */
export const universeEcosystemRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      ecosystem_ref: z.string().min(1).max(160),
      role: z.enum(["partner", "vendor", "integrator", "reseller", "ally"]),
      surface: z.array(z.string().min(1).max(120)).max(64).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "ecosystem.register",
        facet: "world-ecosystem",
        reference: data.ecosystem_ref,
        scope: data.surface.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { role: data.role, surface: data.surface },
      },
      context,
    ),
  );

/** Universal Identity™ — link an identity across tenants. */
export const universeIdentityLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      identity_ref: z.string().min(1).max(160),
      subject_id: uuid,
      providers: z.array(z.string().min(1).max(80)).min(1).max(16),
      cross_tenant: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "identity.link",
        facet: "identity",
        reference: data.identity_ref,
        scope: data.providers.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: data.cross_tenant,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { subject_id: data.subject_id, providers: data.providers },
      },
      context,
    ),
  );

/** Company Network™ — register a company node into the network. */
export const universeCompanyNetworkRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      network_ref: z.string().min(1).max(160),
      companies: z.array(uuid).min(1).max(64),
      relationship: z.enum(["parent", "subsidiary", "affiliate", "peer"]).default("peer"),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "company.network",
        facet: "company-network",
        reference: data.network_ref,
        scope: data.companies.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: data.companies.length > 1,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { companies: data.companies, relationship: data.relationship },
      },
      context,
    ),
  );

/** Brand Network™ — register a brand node into the network. */
export const universeBrandNetworkRegister = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      network_ref: z.string().min(1).max(160),
      brands: z.array(uuid).min(1).max(64),
      surface: z.array(z.string().min(1).max(120)).max(32).default([]),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "brand.network",
        facet: "brand-network",
        reference: data.network_ref,
        scope: data.brands.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { brands: data.brands, surface: data.surface },
      },
      context,
    ),
  );

/** Workspace Federation™ — federate workspaces across companies. */
export const universeWorkspaceFederate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      federation_ref: z.string().min(1).max(160),
      workspaces: z.array(uuid).min(1).max(64),
      policy: z.enum(["read", "write", "admin"]).default("read"),
      cross_tenant: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "workspace.federate",
        facet: "workspace-federation",
        reference: data.federation_ref,
        scope: data.workspaces.length,
        cost_cents: 0,
        critical: data.policy === "admin",
        cross_tenant: data.cross_tenant,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { workspaces: data.workspaces, policy: data.policy },
      },
      context,
    ),
  );

/** Multi-Tenant Federation™ — federate tenants under a global policy. */
export const universeTenantFederate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      federation_ref: z.string().min(1).max(160),
      tenants: z.array(uuid).min(1).max(64),
      policy_ref: z.string().min(1).max(200),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "tenant.federate",
        facet: "tenant-federation",
        reference: data.federation_ref,
        scope: data.tenants.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: true,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { tenants: data.tenants, policy_ref: data.policy_ref },
      },
      context,
    ),
  );

/** Global AI Routing™ — configure routing across AI Platform providers. */
export const universeAiRouteConfigure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      route_ref: z.string().min(1).max(160),
      providers: z.array(z.string().min(1).max(80)).min(1).max(32),
      strategy: z.enum(["cost", "latency", "quality", "balanced"]).default("balanced"),
      cost_cents: z.number().int().nonnegative().default(0),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "ai.route",
        facet: "ai-routing",
        reference: data.route_ref,
        scope: data.providers.length,
        cost_cents: data.cost_cents,
        critical: false,
        cross_tenant: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { providers: data.providers, strategy: data.strategy },
      },
      context,
    ),
  );

/** Global Knowledge Federation™ — federate knowledge stores across tenants. */
export const universeKnowledgeFederate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      federation_ref: z.string().min(1).max(160),
      knowledge_ids: z.array(uuid).min(1).max(64),
      visibility: z.enum(["private", "network", "public"]).default("network"),
      cross_tenant: z.boolean().default(false),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "knowledge.federate",
        facet: "knowledge-federation",
        reference: data.federation_ref,
        scope: data.knowledge_ids.length,
        cost_cents: 0,
        critical: data.visibility === "public",
        cross_tenant: data.cross_tenant,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { knowledge_ids: data.knowledge_ids, visibility: data.visibility },
      },
      context,
    ),
  );

/** Global Experience™ — publish a global experience surface. */
export const universeExperiencePublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...Base,
      experience_ref: z.string().min(1).max(160),
      surface: z.enum(["web", "mobile", "dh", "voice", "immersive"]),
      regions: z.array(z.string().min(1).max(80)).min(1).max(64),
    }).parse(i),
  )
  .handler(({ data, context }) =>
    runUniversePipeline(
      {
        module: "experience.publish",
        facet: "global-experience",
        reference: data.experience_ref,
        scope: data.regions.length,
        cost_cents: 0,
        critical: false,
        cross_tenant: false,
        company_id: data.company_id,
        workspace_id: data.workspace_id,
        currency: data.currency,
        tags: data.tags,
        payload: { surface: data.surface, regions: data.regions },
      },
      context,
    ),
  );

/** List Universe assets (per facet/module). */
export const universeList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      module: z.enum(MODULES).optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const like = data.module ? `universe.${data.module}` : "universe.%";
    const { data: rows, error } = await context.supabase
      .from("creator_assets")
      .select("id,name,kind,tags,metadata,created_at")
      .like("kind", like)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(`universe_list_failed: ${error.message}`);
    return { items: rows ?? [] };
  });

/** Read current Universe federation coverage from the pipeline ledger. */
export const universeCoverage = createServerFn({ method: "GET" })
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
      .like("category", "pipeline.universe")
      .gte("created_at", since)
      .limit(2000);
    const per_module = new Map<string, number>();
    for (const r of (rows ?? []) as Array<{ metadata: { module?: string } | null }>) {
      const m = r.metadata?.module;
      if (m) per_module.set(m, (per_module.get(m) ?? 0) + 1);
    }
    const modules = MODULES.map((m) => ({
      module: m,
      active: per_module.has(m),
      count_window: per_module.get(m) ?? 0,
    }));
    const active = modules.filter((m) => m.active).length;
    return {
      window_hours: data.window_hours,
      active,
      expected: MODULES.length,
      coverage_pct: Math.round((active / MODULES.length) * 100),
      modules,
    };
  });
