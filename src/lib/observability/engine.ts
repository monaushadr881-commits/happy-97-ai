/**
 * HAPPY X — R33 Observability Engine
 *
 * Unified health / metrics / logs / traces / status aggregator over every
 * runtime shipped in R26–R32 + Phase 5.6 ops services. This layer is a
 * READ-MOSTLY composer — it never bypasses existing services and never
 * fabricates health. Every signal is either:
 *   • FACT       — a measured probe / count / timing
 *   • RECOMMEND  — an AI/heuristic suggestion clearly labelled as such
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Health = "ok" | "degraded" | "down" | "unknown";

export interface ProbeResult {
  key: string;
  label: string;
  group: string;
  status: Health;
  latency_ms: number;
  count?: number | null;
  detail?: string;
  measured_at: string;
}

const now = () => new Date().toISOString();

async function timedCount(
  sb: SupabaseClient,
  table: string,
): Promise<{ ok: boolean; ms: number; count: number | null; err?: string }> {
  const t = Date.now();
  try {
    // deliberate `any` — table name is dynamic; typed clients cover this in production paths
    const { count, error } = await (sb as unknown as {
      from: (t: string) => {
        select: (c: string, o: Record<string, unknown>) => Promise<{ count: number | null; error: unknown }>;
      };
    }).from(table).select("id", { head: true, count: "exact" });
    if (error) return { ok: false, ms: Date.now() - t, count: null, err: String((error as { message?: string }).message ?? error) };
    return { ok: true, ms: Date.now() - t, count: count ?? 0 };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, count: null, err: String(e) };
  }
}

/** Registry of platform runtimes to probe. Ordering drives the status page. */
const RUNTIME_PROBES: Array<{ key: string; label: string; group: string; table: string; degradedMs?: number }> = [
  { key: "database", label: "Database", group: "Core", table: "profiles", degradedMs: 400 },
  { key: "api-gateway", label: "API Gateway", group: "Core", table: "apigw_api_registry", degradedMs: 500 },
  { key: "webhooks", label: "Webhooks", group: "Core", table: "apigw_webhook_deliveries", degradedMs: 600 },
  { key: "queue", label: "Job Queue", group: "Core", table: "job_queue", degradedMs: 400 },
  { key: "notifications", label: "Notifications", group: "Core", table: "notifications", degradedMs: 500 },
  { key: "brain", label: "Happy Brain", group: "Intelligence", table: "brain_sessions", degradedMs: 500 },
  { key: "memory", label: "Memory Engine", group: "Intelligence", table: "memory_items", degradedMs: 500 },
  { key: "knowledge-graph", label: "Knowledge Graph", group: "Intelligence", table: "kg_entities", degradedMs: 500 },
  { key: "analytics", label: "Analytics", group: "Intelligence", table: "bi_report_definitions", degradedMs: 600 },
  { key: "automation", label: "Automation", group: "Runtime", table: "auto_workflows", degradedMs: 500 },
  { key: "agents", label: "AI Agents", group: "Runtime", table: "agent_registry", degradedMs: 500 },
  { key: "revenue", label: "Revenue & Billing", group: "Business", table: "subscriptions", degradedMs: 500 },
  { key: "wallet", label: "Wallet & Credits", group: "Business", table: "wallets", degradedMs: 500 },
  { key: "crm", label: "CRM", group: "Business", table: "leads", degradedMs: 600 },
  { key: "erp", label: "ERP", group: "Business", table: "sales_orders", degradedMs: 600 },
  { key: "manufacturing", label: "Manufacturing", group: "Business", table: "production_orders", degradedMs: 700 },
  { key: "warehouse", label: "Warehouse", group: "Business", table: "warehouses", degradedMs: 600 },
  { key: "finance", label: "Finance", group: "Business", table: "journal_entries", degradedMs: 600 },
  { key: "marketplace", label: "Marketplace", group: "Business", table: "listings", degradedMs: 700 },
  { key: "deployment", label: "Deployment", group: "Runtime", table: "project_deployments", degradedMs: 600 },
  { key: "digital-human", label: "Digital Human", group: "Runtime", table: "dh_sessions", degradedMs: 600 },
];

export const observabilityEngine = {
  /** Live health probe across every registered runtime. Never fabricated. */
  async probeAll(sb: SupabaseClient): Promise<ProbeResult[]> {
    const results = await Promise.all(RUNTIME_PROBES.map(async (p) => {
      const r = await timedCount(sb, p.table);
      let status: Health = "ok";
      if (!r.ok) status = "down";
      else if (p.degradedMs && r.ms > p.degradedMs) status = "degraded";
      return {
        key: p.key, label: p.label, group: p.group,
        status, latency_ms: r.ms, count: r.count,
        detail: r.err, measured_at: now(),
      } as ProbeResult;
    }));

    // AI Gateway is out-of-DB → probe separately.
    const t0 = Date.now();
    let gw: ProbeResult;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      gw = { key: "ai-gateway", label: "AI Gateway", group: "Intelligence", status: "down", latency_ms: -1, detail: "LOVABLE_API_KEY not configured", measured_at: now() };
    } else {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 3000);
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/models", {
          headers: { "Lovable-API-Key": key }, signal: ctrl.signal,
        });
        clearTimeout(to);
        const ms = Date.now() - t0;
        const okish = resp.ok || resp.status === 404;
        gw = {
          key: "ai-gateway", label: "AI Gateway", group: "Intelligence",
          status: okish ? (ms > 800 ? "degraded" : "ok") : "down",
          latency_ms: ms, detail: okish ? undefined : `gateway ${resp.status}`, measured_at: now(),
        };
      } catch (e) {
        gw = { key: "ai-gateway", label: "AI Gateway", group: "Intelligence", status: "down", latency_ms: Date.now() - t0, detail: String(e), measured_at: now() };
      }
    }
    return [...results, gw];
  },

  /** Roll probes into per-group + overall counts. Pure derivation. */
  summarise(probes: ProbeResult[]) {
    const groups: Record<string, { ok: number; degraded: number; down: number; unknown: number; total: number }> = {};
    let overall: Health = "ok";
    for (const p of probes) {
      const g = (groups[p.group] ??= { ok: 0, degraded: 0, down: 0, unknown: 0, total: 0 });
      g[p.status] += 1; g.total += 1;
      if (p.status === "down") overall = "down";
      else if (p.status === "degraded" && overall === "ok") overall = "degraded";
    }
    const totals = probes.reduce(
      (a, p) => { a[p.status] += 1; a.total += 1; return a; },
      { ok: 0, degraded: 0, down: 0, unknown: 0, total: 0 },
    );
    return { overall, groups, totals };
  },

  /** Persist a probe snapshot into health_checks for trending. */
  async recordSnapshot(sb: SupabaseClient, probes: ProbeResult[]) {
    const rows = probes.map((p) => ({
      service: p.key,
      status: p.status,
      latency_ms: p.latency_ms >= 0 ? p.latency_ms : null,
      message: p.detail ?? null,
      metadata: { label: p.label, group: p.group, count: p.count } as unknown,
    }));
    const { error } = await (sb as unknown as { from: (t: string) => { insert: (r: unknown) => Promise<{ error: unknown }> } })
      .from("health_checks").insert(rows);
    if (error) throw error;
    return { inserted: rows.length };
  },

  /** Reflect probe results into obs_status_components so the status page mirrors reality. */
  async syncStatusComponents(sb: SupabaseClient, probes: ProbeResult[]) {
    const map: Record<Health, string> = { ok: "operational", degraded: "degraded", down: "major_outage", unknown: "unknown" };
    let updated = 0;
    for (const p of probes) {
      const status = map[p.status];
      const { error, data } = await (sb as unknown as {
        from: (t: string) => {
          update: (v: unknown) => { eq: (c: string, v: string) => { select: (c: string) => Promise<{ error: unknown; data: unknown[] | null }> } };
        };
      })
        .from("obs_status_components")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("key", p.key)
        .select("id");
      if (!error && Array.isArray(data) && data.length > 0) updated += 1;
    }
    return { updated };
  },

  /** Public snapshot (safe to expose): overall + per-component status only. */
  async publicStatus(sb: SupabaseClient) {
    const { data, error } = await (sb as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (c: string, v: boolean) => {
            order: (c: string, o: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }>;
          };
        };
      };
    })
      .from("obs_status_components")
      .select("key, name, group_name, status, description")
      .eq("is_public", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const items = (data ?? []) as Array<{ status: string }>;
    const overall = items.some((c) => c.status === "major_outage") ? "major_outage"
      : items.some((c) => c.status === "degraded") ? "degraded"
      : items.some((c) => c.status === "partial_outage") ? "partial_outage"
      : "operational";
    return { overall, components: data ?? [], generated_at: now() };
  },
};

export type ObservabilityEngine = typeof observabilityEngine;
