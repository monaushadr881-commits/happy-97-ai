/**
 * HAPPY X — R35 Multi-Region / HA server functions.
 *
 * Auth-gated (requireSupabaseAuth) + RLS-gated to is_ops_admin.
 * Every response separates `fact.*` (measured / recorded) from
 * `recommendation.*` (AI heuristics).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { haEngine, REPLICATION_SCOPES, type ReplicationScope } from "./engine";

const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });
const sbOf = (ctx: { supabase: unknown }) => ctx.supabase as unknown as SupabaseClient;
const ScopeEnum = z.enum(REPLICATION_SCOPES as [ReplicationScope, ...ReplicationScope[]]);
const RoleEnum = z.enum(["primary", "secondary", "standby", "edge"]);
const FailoverKindEnum = z.enum(["automatic", "manual", "graceful", "rollback"]);

// ---- Regions ----
const RegionInput = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  role: RoleEnum.default("secondary"),
  provider: z.string().max(40).default("cloudflare"),
  location: z.string().max(120).optional(),
  endpoint_url: z.string().url().optional(),
  priority: z.number().int().min(0).max(1000).default(100),
  enabled: z.boolean().default(true),
});
export const haListRegions = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await sbOf(context).from("ha_regions").select("*").order("priority").order("code");
    if (error) throw error; return (data ?? []) as unknown as never;
  }));
export const haUpsertRegion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RegionInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "haUpsertRegion", source: "api", module: "ha.haUpsertRegion" });
    return guard(async () => {
    const sb = sbOf(context);
    const { data: row, error } = await sb.from("ha_regions")
      .upsert({ ...data, created_by: context.userId }, { onConflict: "code" })
      .select("*").single();
    if (error) throw error;
    const r = row as { id: string };
    await sb.from("ha_events").insert({
      kind: "region.upserted", severity: "info", region_id: r.id,
      ref_type: "region", ref_id: r.id, actor_id: context.userId,
      message: `Region upserted: ${data.code}`,
    });
    return row as unknown as never);
  };
  });
export const haDeleteRegion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "haDeleteRegion", source: "api", module: "ha.haDeleteRegion" });
    return guard(async () => {
    const { error } = await sbOf(context).from("ha_regions").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });
  });

export const haProbeRegion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const sb = sbOf(context);
    const { data: region } = await sb.from("ha_regions").select("id, code, endpoint_url").eq("id", data.id).single();
    if (!region) throw new Error("region_not_found");
    const r = region as { id: string; code: string; endpoint_url: string | null };
    const probe = await haEngine.probeRegion(sb, r);
    await sb.from("ha_regions").update({ status: probe.status, latency_ms: probe.latency_ms, last_probed_at: probe.observed_at }).eq("id", data.id);
    return probe;
  }));
export const haProbeAll = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const sb = sbOf(context);
    const { data: regions } = await sb.from("ha_regions").select("id, code, endpoint_url").eq("enabled", true);
    const list = (regions ?? []) as Array<{ id: string; code: string; endpoint_url: string | null }>;
    const results = await Promise.all(list.map(async (r) => ({ code: r.code, region_id: r.id, ...(await haEngine.probeRegion(sb, r)) })));
    for (const r of results) {
      await sb.from("ha_regions").update({ status: r.status, latency_ms: r.latency_ms, last_probed_at: r.observed_at }).eq("id", r.region_id);
    }
    return results;
  }));

// ---- Replication ----
export const haListReplication = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await sbOf(context).from("ha_replication_checks").select("*").order("verified_at", { ascending: false }).limit(200);
    if (error) throw error; return (data ?? []) as unknown as never;
  }));
export const haPublishMark = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ region_id: z.string().uuid(), scope: ScopeEnum }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "haPublishMark", source: "api", module: "ha.haPublishMark" });
    return guard(async () =>
    haEngine.publishMark(sbOf(context), { region_id: data.region_id, scope: data.scope, actor_id: context.userId }));
  });export const haVerifyReplication = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    scope: ScopeEnum, source_region_id: z.string().uuid(), target_region_id: z.string().uuid(),
  }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "haVerifyReplication", source: "api", module: "ha.haVerifyReplication" });
    return guard(async () => {
    const sb = sbOf(context);
    const res = await haEngine.verifyReplication(sb, data);
    await sb.from("ha_replication_checks").insert({
      scope: data.scope, source_region_id: data.source_region_id, target_region_id: data.target_region_id,
      status: res.status, source_digest: res.source_digest, target_digest: res.target_digest,
      source_total: res.source_total, target_total: res.target_total, lag_rows: res.lag_rows,
      verified_by: context.userId, verified_at: res.verified_at,
    });
    if (res.status === "failed" || res.status === "diverged") {
      await sb.from("ha_events").insert({
        kind: "replication.failed", severity: "critical",
        region_id: data.target_region_id, ref_type: "replication", ref_id: data.target_region_id,
        actor_id: context.userId,
        message: `Replication ${data.scope} → ${res.status} (lag=${res.lag_rows})`,
      });
    }
    return res);
  });

// ---- Failover ----
export const haListFailovers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await sbOf(context).from("ha_failover_runs").select("*").order("started_at", { ascending: false }).limit(100);
    if (error) throw error; return (data ?? []) as unknown as never;
  }));
export const haRunFailover = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    kind: FailoverKindEnum, from_region_id: z.string().uuid(), to_region_id: z.string().uuid(),
    reason: z.string().min(2).max(500),
  }).parse(i))
  .handler(async ({ data, context }) => guard(async () =>
    haEngine.runFailover(sbOf(context), { ...data, actor_id: context.userId })));
export const haRollback = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ failover_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "haRollback", source: "api", module: "ha.haRollback" });
    return guard(async () =>
    haEngine.rollback(sbOf(context), { failover_id: data.failover_id, actor_id: context.userId }));
  });
// ---- Recovery ----
export const haRecoverRegion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ region_id: z.string().uuid(), samples: z.number().int().min(1).max(10).optional() }).parse(i))
  .handler(async ({ data, context }) => guard(async () =>
    haEngine.recover(sbOf(context), { region_id: data.region_id, samples: data.samples, actor_id: context.userId })));

// ---- Traffic policy ----
const TrafficInput = z.object({
  policy: z.enum(["primary_only", "active_active", "weighted", "geo", "failover"]),
  active_region_id: z.string().uuid().optional(),
  weights: z.record(z.string(), z.number().min(0).max(100)).optional(),
});
export const haListTrafficPolicies = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await sbOf(context).from("ha_traffic_policies").select("*").order("policy");
    if (error) throw error; return (data ?? []) as unknown as never;
  }));
export const haUpsertTrafficPolicy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TrafficInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "haUpsertTrafficPolicy", source: "api", module: "ha.haUpsertTrafficPolicy" });
    return guard(async () => {
    const sb = sbOf(context);
    const { data: row, error } = await sb.from("ha_traffic_policies")
      .upsert({ ...data, weights: data.weights ?? {}, updated_by: context.userId, updated_at: new Date().toISOString() }, { onConflict: "policy" })
      .select("*").single();
    if (error) throw error;
    const r = row as { id: string };
    await sb.from("ha_events").insert({
      kind: "traffic.updated", severity: "info", region_id: data.active_region_id ?? null,
      ref_type: "traffic_policy", ref_id: r.id, actor_id: context.userId,
      message: `Traffic policy set to ${data.policy}`,
    });
    return row as unknown as never);
  });

// ---- Events / Alerts ----
export const haListEvents = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(500).default(100) }).partial().parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    const { data: rows, error } = await sbOf(context).from("ha_events").select("*").order("occurred_at", { ascending: false }).limit(data?.limit ?? 100);
    if (error) throw error; return (rows ?? []) as unknown as never;
  }));

// ---- Founder dashboard ----
export const haDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const sb = sbOf(context);
    const [regionsQ, checksQ, failoverQ, eventsQ] = await Promise.all([
      sb.from("ha_regions").select("*"),
      sb.from("ha_replication_checks").select("scope, status, verified_at, lag_rows").order("verified_at", { ascending: false }).limit(50),
      sb.from("ha_failover_runs").select("kind, status, traffic_switched, started_at, finished_at").order("started_at", { ascending: false }).limit(25),
      sb.from("ha_events").select("kind, severity, occurred_at, message").order("occurred_at", { ascending: false }).limit(25),
    ]);

    const regions = (regionsQ.data ?? []) as Array<{ id: string; code: string; role: string; status: string; latency_ms: number | null }>;
    const checks = (checksQ.data ?? []) as Array<{ scope: string; status: string; lag_rows: number }>;
    const failovers = (failoverQ.data ?? []) as Array<{ status: string; traffic_switched: boolean }>;

    const total = regions.length;
    const healthy = regions.filter((r) => r.status === "healthy").length;
    const offline = regions.filter((r) => r.status === "offline").length;
    const availability = total > 0 ? Math.round((healthy / total) * 10000) / 100 : 0;

    const replInSync = checks.filter((c) => c.status === "in_sync").length;
    const replFailed = checks.filter((c) => c.status === "failed" || c.status === "diverged").length;
    const failoverSuccess = failovers.filter((f) => f.status === "succeeded" && f.traffic_switched).length;
    const failoverFailed = failovers.filter((f) => f.status === "failed").length;

    const recommendation: string[] = [];
    if (total < 2) recommendation.push("Add at least one secondary region — single-region deployments cannot failover.");
    if (offline > 0) recommendation.push(`${offline} region(s) offline — run recovery drills or investigate infrastructure.`);
    if (replFailed > 0) recommendation.push("Recent replication verifications failed or diverged — inspect ha_replication_checks and re-publish marks.");
    if (regions.filter((r) => r.role === "primary").length !== 1) recommendation.push("Exactly one region must hold role=primary. Reconcile via haUpsertRegion or haRunFailover.");
    if (failoverFailed > failoverSuccess) recommendation.push("Failed failovers outnumber successful ones — target regions may be unreachable at flip time.");

    return {
      fact: {
        regions_total: total, regions_healthy: healthy, regions_offline: offline,
        availability_pct: availability,
        replication_in_sync: replInSync, replication_failed_or_diverged: replFailed,
        failover_success: failoverSuccess, failover_failed: failoverFailed,
        regions, recent_events: eventsQ.data ?? [], recent_failovers: failoverQ.data ?? [],
      },
      recommendation,
    };
  }));
