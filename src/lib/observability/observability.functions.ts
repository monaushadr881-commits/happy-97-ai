/**
 * HAPPY X — R33 Observability server functions.
 *
 * Thin RPC surface. All auth-gated; RLS on obs_* + is_ops_admin gate access.
 * Reuses existing ops services for incidents/alerts/queue/ai/metrics.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import {
  metricsService, alertingService, incidentService,
  queueOpsService, securityOpsService, aiOpsService, dbOpsService,
} from "@/ops";
import { observabilityEngine } from "./engine";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (c: AuthCtx) => makeServiceContext({ supabase: c.supabase, userId: c.userId, claims: c.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// ---- Unified health ----
export const obsHealthProbe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const probes = await observabilityEngine.probeAll(context.supabase);
    return { probes, ...observabilityEngine.summarise(probes) };
  }));

export const obsHealthSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const probes = await observabilityEngine.probeAll(context.supabase);
    const [snap, sync] = await Promise.all([
      observabilityEngine.recordSnapshot(context.supabase, probes),
      observabilityEngine.syncStatusComponents(context.supabase, probes),
    ]);
    return { probes, snapshot: snap, sync, ...observabilityEngine.summarise(probes) };
  }));

// ---- Structured logging ----
const LogInput = z.object({
  service: z.string().min(1).max(80),
  level: z.enum(["debug", "info", "warn", "error", "critical"]).default("info"),
  message: z.string().min(1).max(4000),
  correlation_id: z.string().max(120).optional(),
  trace_id: z.string().max(120).optional(),
  company_id: z.string().uuid().optional(),
  attributes: z.record(z.unknown()).default({}),
});
export const obsLogWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LogInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "obsLogWrite", source: "api", module: "observability.obsLogWrite" });
    return guard(async () => {
    const { error } = await context.supabase.from("obs_log_entries").insert({
      service: data.service, level: data.level, message: data.message,
      correlation_id: data.correlation_id ?? null, trace_id: data.trace_id ?? null,
      actor_id: context.userId, company_id: data.company_id ?? null,
      attributes: data.attributes as never,
    } as never);
    if (error) throw error;
    return { ok: true };
  }));

const LogQuery = z.object({
  service: z.string().max(80).optional(),
  level: z.enum(["debug", "info", "warn", "error", "critical"]).optional(),
  correlation_id: z.string().max(120).optional(),
  sinceMinutes: z.number().int().min(1).max(60 * 24 * 7).default(60),
  limit: z.number().int().min(1).max(500).default(200),
});
export const obsLogQuery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LogQuery.parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    const since = new Date(Date.now() - data.sinceMinutes * 60_000).toISOString();
    let q = context.supabase.from("obs_log_entries").select("*")
      .gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(data.limit);
    if (data.service) q = q.eq("service", data.service);
    if (data.level) q = q.eq("level", data.level);
    if (data.correlation_id) q = q.eq("correlation_id", data.correlation_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  }));

// ---- Distributed tracing ----
const SpanInput = z.object({
  trace_id: z.string().min(4).max(120),
  span_id: z.string().min(4).max(120),
  parent_span_id: z.string().max(120).optional(),
  service: z.string().min(1).max(80),
  operation: z.string().min(1).max(200),
  status: z.enum(["ok", "error", "cancelled"]).default("ok"),
  started_at: z.string().datetime().optional(),
  duration_ms: z.number().int().min(0).max(3_600_000).optional(),
  attributes: z.record(z.unknown()).default({}),
  company_id: z.string().uuid().optional(),
});
export const obsTraceWrite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SpanInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "obsTraceWrite", source: "api", module: "observability.obsTraceWrite" });
    return guard(async () => {
    const { error } = await context.supabase.from("obs_trace_spans").insert({
      trace_id: data.trace_id, span_id: data.span_id, parent_span_id: data.parent_span_id ?? null,
      service: data.service, operation: data.operation, status: data.status,
      started_at: data.started_at ?? new Date().toISOString(),
      duration_ms: data.duration_ms ?? null, attributes: data.attributes as never,
      actor_id: context.userId, company_id: data.company_id ?? null,
    } as never);
    if (error) throw error;
    return { ok: true };
  }));

export const obsTraceGet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ trace_id: z.string().min(4).max(120) }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const { data: rows, error } = await context.supabase.from("obs_trace_spans")
      .select("*").eq("trace_id", data.trace_id).order("started_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  }));

// ---- Status page components ----
const ComponentInput = z.object({
  key: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  group_name: z.string().max(80).optional(),
  status: z.enum(["operational", "degraded", "partial_outage", "major_outage", "maintenance", "unknown"]).default("operational"),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(9999).default(100),
});
export const obsListComponents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await context.supabase.from("obs_status_components")
      .select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }));

export const obsUpsertComponent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ComponentInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "obsUpsertComponent", source: "api", module: "observability.obsUpsertComponent" });
    return guard(async () => {
    const { data: row, error } = await context.supabase.from("obs_status_components")
      .upsert(data as never, { onConflict: "key" }).select("*").single();
    if (error) throw error;
    return row;
  }));

const StatusUpdateInput = z.object({
  component_key: z.string().min(1).max(80),
  status: z.enum(["operational", "degraded", "partial_outage", "major_outage", "maintenance", "unknown"]),
  message: z.string().min(1).max(2000),
  incident_id: z.string().uuid().optional(),
});
export const obsPushStatusUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => StatusUpdateInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "obsPushStatusUpdate", source: "api", module: "observability.obsPushStatusUpdate" });
    return guard(async () => {
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      context.supabase.from("obs_status_updates").insert({
        component_key: data.component_key, status: data.status, message: data.message,
        incident_id: data.incident_id ?? null, actor_id: context.userId,
      } as never),
      context.supabase.from("obs_status_components")
        .update({ status: data.status, updated_at: new Date().toISOString() } as never)
        .eq("key", data.component_key),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;
    return { ok: true };
  }));

export const obsStatusTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    component_key: z.string().min(1).max(80).optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("obs_status_updates").select("*")
      .order("occurred_at", { ascending: false }).limit(data.limit);
    if (data.component_key) q = q.eq("component_key", data.component_key);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  }));

// ---- Founder dashboard: everything at once ----
export const obsDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const s = svc(context);
    const [probes, queue, ai, security, incidents, alerts, dbSchema] = await Promise.all([
      observabilityEngine.probeAll(context.supabase),
      queueOpsService.stats(s),
      aiOpsService.usage(s, 24).catch(() => null),
      securityOpsService.summary(s).catch(() => null),
      incidentService.list(s, "open").catch(() => []),
      alertingService.listRules(s).catch(() => []),
      dbOpsService.schemaCounts(s).catch(() => null),
    ]);
    const summary = observabilityEngine.summarise(probes);
    // SLA (fact): fraction of probes reporting ok.
    const total = summary.totals.total || 1;
    const availability = summary.totals.ok / total;
    // Error budget (fact): remaining share until we hit 99% SLO.
    const slo = 0.99;
    const error_budget_remaining = Math.max(0, availability - slo) / (1 - slo);
    return {
      fact: {
        probes, ...summary,
        availability, error_budget_remaining,
        open_incidents: (incidents as unknown[]).length,
        alert_rule_count: (alerts as unknown[]).length,
        queue, ai_usage_24h: ai, security_24h: security, db_schema: dbSchema,
        generated_at: new Date().toISOString(),
      },
      recommendation: buildRecommendations(summary, incidents as unknown[], queue),
    };
  }));

function buildRecommendations(
  summary: ReturnType<typeof observabilityEngine.summarise>,
  incidents: unknown[],
  queue: Record<string, number>,
): string[] {
  const out: string[] = [];
  if (summary.totals.down > 0) out.push(`AI RECOMMENDATION: ${summary.totals.down} runtime(s) are DOWN — open an incident and page the on-call.`);
  if (summary.totals.degraded > 0) out.push(`AI RECOMMENDATION: ${summary.totals.degraded} runtime(s) DEGRADED — inspect latency and recent deploys.`);
  const failed = queue.failed ?? 0;
  if (failed > 20) out.push(`AI RECOMMENDATION: ${failed} failed jobs — review DLQ and retry via opsQueueRetry.`);
  if (incidents.length > 0) out.push(`AI RECOMMENDATION: ${incidents.length} incident(s) open — post an update to the status page.`);
  if (out.length === 0) out.push("AI RECOMMENDATION: All probes green — no action required.");
  return out;
}

// ---- Reused ops surface re-exported for one-stop imports ----
export const obsMetricsEmit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => metricsService.emit(svc(context), data)));
export const obsMetricsRange = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => metricsService.range(svc(context), data)));

export const obsIncidentOpen = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => incidentService.open(svc(context), data)));
export const obsIncidentTransition = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => incidentService.transition(svc(context), data)));
export const obsIncidentTimeline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i as { id: string }))
  .handler(async ({ data, context }) => guard(() => incidentService.timeline(svc(context), data.id)));
export const obsIncidentList = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i as { status?: string } | undefined) ?? {})
  .handler(async ({ data, context }) => guard(() => incidentService.list(svc(context), (data as { status?: string }).status)));

export const obsAlertUpsert = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "obsAlertUpsert", source: "api", module: "observability.obsAlertUpsert" });
    return guard(() => alertingService.upsertRule(svc(context), data));
  });export const obsAlertTrip = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => alertingService.trip(svc(context), data)));
export const obsAlertList = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => alertingService.listRules(svc(context))));
