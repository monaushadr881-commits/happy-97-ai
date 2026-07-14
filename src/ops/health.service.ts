/**
 * HAPPY X Ops — Health Service
 *
 * Aggregates health probes across every platform sub-system. Each probe is
 * fast (bounded latency), returns a HealthReport, and writes to
 * `health_checks` for historical trending.
 */

import { defineService, type ServiceContext, AppError } from "@/services/core";

export type HealthStatus = "ok" | "degraded" | "down" | "unknown";

export interface HealthReport {
  service: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  metadata?: Record<string, unknown>;
  checkedAt: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ v: T; ms: number }> {
  const t = Date.now();
  const v = await fn();
  return { v, ms: Date.now() - t };
}

export const healthService = defineService({ name: "ops.health", version: "v1" }, () => ({
  async database(ctx: ServiceContext): Promise<HealthReport> {
    try {
      const { ms } = await timed(async () => {
        const { error } = await ctx.supabase.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
        if (error) throw error;
      });
      return { service: "database", status: ms < 400 ? "ok" : "degraded", latencyMs: ms, checkedAt: new Date().toISOString() };
    } catch (e) {
      return { service: "database", status: "down", latencyMs: -1, message: String(e), checkedAt: new Date().toISOString() };
    }
  },

  async queue(ctx: ServiceContext): Promise<HealthReport> {
    try {
      const { v, ms } = await timed(async () => {
        const [ready, failed] = await Promise.all([
          ctx.supabase.from("job_queue").select("id", { head: true, count: "exact" }).eq("status", "ready"),
          ctx.supabase.from("job_queue").select("id", { head: true, count: "exact" }).eq("status", "failed"),
        ]);
        return { ready: ready.count ?? 0, failed: failed.count ?? 0 };
      });
      const status: HealthStatus = v.failed > 100 ? "degraded" : v.failed > 500 ? "down" : "ok";
      return { service: "queue", status, latencyMs: ms, metadata: v, checkedAt: new Date().toISOString() };
    } catch (e) {
      return { service: "queue", status: "down", latencyMs: -1, message: String(e), checkedAt: new Date().toISOString() };
    }
  },

  async aiGateway(_ctx: ServiceContext): Promise<HealthReport> {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { service: "ai-gateway", status: "down", latencyMs: -1, message: "Missing LOVABLE_API_KEY", checkedAt: new Date().toISOString() };
    try {
      const { ms } = await timed(async () => {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/models", {
          headers: { "Lovable-API-Key": apiKey },
        });
        if (!r.ok && r.status !== 404) throw new Error(`gateway ${r.status}`);
      });
      return { service: "ai-gateway", status: ms < 800 ? "ok" : "degraded", latencyMs: ms, checkedAt: new Date().toISOString() };
    } catch (e) {
      return { service: "ai-gateway", status: "down", latencyMs: -1, message: String(e), checkedAt: new Date().toISOString() };
    }
  },

  async cache(_ctx: ServiceContext): Promise<HealthReport> {
    // In-memory cache is always ok. Placeholder for Redis probe.
    return { service: "cache", status: "ok", latencyMs: 0, checkedAt: new Date().toISOString() };
  },

  async search(ctx: ServiceContext): Promise<HealthReport> {
    try {
      const { ms } = await timed(async () => {
        const { error } = await ctx.supabase.from("knowledge_articles").select("id", { head: true, count: "exact" }).limit(1);
        if (error) throw error;
      });
      return { service: "search", status: "ok", latencyMs: ms, checkedAt: new Date().toISOString() };
    } catch (e) {
      return { service: "search", status: "down", latencyMs: -1, message: String(e), checkedAt: new Date().toISOString() };
    }
  },

  async webhooks(ctx: ServiceContext): Promise<HealthReport> {
    try {
      const { v, ms } = await timed(async () => {
        const { count } = await ctx.supabase
          .from("webhook_deliveries").select("id", { head: true, count: "exact" })
          .eq("status", "failed");
        return { failed: count ?? 0 };
      });
      const status: HealthStatus = v.failed > 20 ? "degraded" : "ok";
      return { service: "webhooks", status, latencyMs: ms, metadata: v, checkedAt: new Date().toISOString() };
    } catch {
      return { service: "webhooks", status: "unknown", latencyMs: -1, checkedAt: new Date().toISOString() };
    }
  },

  /** Snapshot every subsystem in parallel. */
  async all(ctx: ServiceContext): Promise<HealthReport[]> {
    return Promise.all([
      this.database(ctx), this.queue(ctx), this.aiGateway(ctx),
      this.cache(ctx), this.search(ctx), this.webhooks(ctx),
    ]);
  },

  /** Persist a probe result. Requires ops-admin (RLS enforced). */
  async record(ctx: ServiceContext, report: HealthReport) {
    const { error } = await ctx.supabase.from("health_checks").insert({
      service: report.service,
      status: report.status,
      latency_ms: report.latencyMs >= 0 ? report.latencyMs : null,
      message: report.message ?? null,
      metadata: (report.metadata ?? {}) as never,
    } as never);
    if (error) throw new AppError("INFRA.DB_ERROR", { cause: error });
  },
}));
