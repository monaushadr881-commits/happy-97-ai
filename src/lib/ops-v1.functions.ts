/**
 * HAPPY X — Ops API v1 (server functions)
 *
 * Thin RPC adapters over @/ops services. All require auth; the RLS policies
 * on ops tables further restrict everything to ops-admins (platform founder
 * or `platform.manage` permission).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { adoptToCanonicalPipeline } from "@/lib/founder/pipeline";
import {
  healthService, metricsService, alertingService, incidentService,
  deploymentService, queueOpsService, securityOpsService, aiOpsService, dbOpsService,
} from "@/ops";

type AuthCtx = Parameters<typeof makeServiceContext>[0];
const svc = (ctx: { supabase: AuthCtx["supabase"]; userId: string; claims?: Record<string, unknown> }) =>
  makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const adopt = (
  context: { supabase: AuthCtx["supabase"]; userId: string },
  module: string,
  capability: string,
  metadata: Record<string, unknown> = {},
) =>
  adoptToCanonicalPipeline(context.supabase, {
    domain: "founder",
    module: `ops.${module}`,
    capability,
    user_id: context.userId,
    company_id: ZERO_UUID,
    source: "ops-v1",
    metadata,
  });

// ---- Health ----
export const opsHealthAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => healthService.all(svc(context))));

export const opsHealthRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as Parameters<typeof healthService.record>[1])
  .handler(async ({ data, context }) => { await adopt(context, "health", "record"); return guard(() => healthService.record(svc(context), data)); });

// ---- Metrics ----
export const opsMetricsEmit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => { await adopt(context, "metrics", "emit"); return guard(() => metricsService.emit(svc(context), data)); });

export const opsMetricsRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => metricsService.range(svc(context), data)));

// ---- Alerting ----
export const opsListAlertRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => alertingService.listRules(svc(context))));

export const opsUpsertAlertRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => { await adopt(context, "alert", "upsert_rule"); return guard(() => alertingService.upsertRule(svc(context), data)); });

export const opsTripAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => { await adopt(context, "alert", "trip"); return guard(() => alertingService.trip(svc(context), data)); });

// ---- Incidents ----
export const opsListIncidents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i as { status?: string } | undefined) ?? {})
  .handler(async ({ data, context }) => guard(() => incidentService.list(svc(context), (data as { status?: string }).status)));

export const opsOpenIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => { await adopt(context, "incident", "open"); return guard(() => incidentService.open(svc(context), data)); });

export const opsTransitionIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => { await adopt(context, "incident", "transition"); return guard(() => incidentService.transition(svc(context), data)); });

export const opsIncidentTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => guard(() => incidentService.timeline(svc(context), data.id)));

// ---- Deployments ----
export const opsListDeployments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i as { channel?: string } | undefined) ?? {})
  .handler(async ({ data, context }) => guard(() => deploymentService.list(svc(context), (data as { channel?: string }).channel)));

export const opsStartDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => deploymentService.start(svc(context), data)));

export const opsFinishDeployment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => deploymentService.finish(svc(context), data)));

export const opsDeploymentAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => deploymentService.analytics(svc(context))));

// ---- Queue ----
export const opsQueueStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => queueOpsService.stats(svc(context))));

export const opsQueueFailed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => queueOpsService.listFailed(svc(context))));

export const opsQueueRetry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => guard(() => queueOpsService.retry(svc(context), data.id)));

// ---- Security ----
export const opsSecuritySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => securityOpsService.summary(svc(context))));

export const opsSecurityAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i ?? {})
  .handler(async ({ data, context }) => {
    const rows = await guard(() => securityOpsService.recentAudit(svc(context), data));
    // ip_address is Postgres inet (unknown) — coerce to string for RPC serialization.
    const safe = rows.map((r) => {
      const { ip_address, ...rest } = r as typeof r & { ip_address: unknown };
      return { ...rest, ip_address: ip_address == null ? null : String(ip_address) };
    });
    return safe as Array<Omit<(typeof rows)[number], "ip_address"> & { ip_address: string | null }>;
  });

// ---- AI Ops ----
export const opsAiUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i ?? {})
  .handler(async ({ data, context }) => guard(() => aiOpsService.usage(svc(context), data)));

// ---- DB Ops ----
export const opsDbSchemaCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => dbOpsService.schemaCounts(svc(context))));
