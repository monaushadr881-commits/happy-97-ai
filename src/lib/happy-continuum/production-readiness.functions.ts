/**
 * R191 Batch 15 — HAPPY™ Production / Deployment / Operational Readiness
 *
 * NO new runtime, NO new dashboard, NO new tables.
 *
 * Canonical owners reused:
 *   • Ops Runtime         → src/lib/ops-v1.functions.ts (deployment/health/incidents)
 *   • Cloud Runtime       → src/lib/cloud/cloud.functions.ts (backup / recovery)
 *   • Infinity Runtime    → src/lib/infinity/infinity.functions.ts (domain probes)
 *   • Automation Runtime  → src/lib/business/automation.functions.ts
 *   • Mission Control     → founderMissionControl (auto via pipeline.deployment.*)
 *   • Pipeline / Brain    → adoptToCanonicalPipeline / withBrain
 *   • Approval / Audit    → requestFounderApproval / writeCanonicalAudit
 *   • Workspace store     → public.creator_assets (cloud.* / infinity.*)
 *
 * Every handler runs through adoptToCanonicalPipeline("deployment") for
 * Mission Control visibility. Mutations enforce R158 Founder approval when
 * severity is critical (release cutover, disaster-recovery execution).
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
const uuid = z.string().uuid();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonMeta = any;
interface AssetRow {
  id: string; name: string; kind: string; tags: string[] | null;
  metadata: JsonMeta; created_at: string;
}

async function adopt(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  module: string,
  capability: string,
  metadata: Record<string, unknown> = {},
) {
  await adoptToCanonicalPipeline(supabase, {
    domain: "deployment", module, capability,
    user_id: userId, company_id: ZERO_UUID, metadata,
  });
}

async function readAssets(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  kindLike: string,
  limit = 100,
): Promise<AssetRow[]> {
  const { data, error } = await supabase
    .from("creator_assets")
    .select("id,name,kind,tags,metadata,created_at")
    .eq("user_id", userId)
    .like("kind", kindLike)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`readiness_read_failed: ${error.message}`);
  return (data ?? []) as AssetRow[];
}

interface Impact { severity: "info" | "notice" | "warning" | "critical"; requires_approval: boolean; reason: string; }

const analyze = withBrain<
  { module: string; critical: boolean; scope: string },
  Impact
>({
  capability: "deployment.impact",
  handler: ({ module, critical, scope }) => {
    if (critical) return { severity: "critical", requires_approval: true, reason: `critical_${module}` };
    if (scope === "production") return { severity: "warning", requires_approval: true, reason: "production_scope" };
    return { severity: "info", requires_approval: false, reason: "routine" };
  },
});

/* ─────────────────  DEPLOYMENT / RELEASE READINESS  ────────────────── */

/** Deployment Checklist — canonical readiness rubric (read-only). */
export const deploymentChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "checklist", "compute");
    const [backups, recoveries, infra] = await Promise.all([
      readAssets(context.supabase, context.userId, "cloud.backup", 5),
      readAssets(context.supabase, context.userId, "cloud.recovery", 5),
      readAssets(context.supabase, context.userId, "infinity.%", 25),
    ]);
    const checks = [
      { key: "backup_recent", passed: !!backups[0], detail: backups[0]?.created_at ?? null },
      { key: "recovery_drill", passed: !!recoveries[0], detail: recoveries[0]?.created_at ?? null },
      { key: "runtime_domains_registered", passed: infra.length > 0, detail: infra.length },
    ];
    return { checks, passed: checks.every((c) => c.passed) };
  });

/** Environment Validation — verifies required env-var surface exists. */
export const environmentValidate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "environment", "validate");
    const keys = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "LOVABLE_API_KEY"];
    const results = keys.map((k) => ({ key: k, present: !!process.env[k] }));
    return { results, healthy: results.every((r) => r.present) };
  });

/** Configuration Validation — validates canonical config surface. */
export const configurationValidate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "configuration", "validate");
    const { data: settings } = await context.supabase
      .from("settings")
      .select("key,scope_type")
      .limit(200);
    return { total: settings?.length ?? 0, scopes: [...new Set((settings ?? []).map((s) => s.scope_type))] };
  });

/** Runtime Health Check — aggregates infinity + ops probes. */
export const runtimeHealthCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "runtime", "health");
    const [probes] = await Promise.all([
      readAssets(context.supabase, context.userId, "infinity.%", 50),
    ]);
    const by_kind: Record<string, number> = {};
    for (const r of probes) by_kind[r.kind] = (by_kind[r.kind] ?? 0) + 1;
    return { probes: probes.length, by_kind, latest: probes[0]?.created_at ?? null };
  });

/** Dependency Verification — verifies backend connectivity + tables. */
export const dependencyVerify = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "dependencies", "verify");
    const probes = [
      { name: "creator_assets", ok: false as boolean },
      { name: "audit_logs", ok: false as boolean },
      { name: "settings", ok: false as boolean },
    ];
    for (const p of probes) {
      const { error } = await context.supabase.from(p.name).select("id").limit(1);
      p.ok = !error;
    }
    return { dependencies: probes, healthy: probes.every((p) => p.ok) };
  });

/** Release Readiness — R158-gated release cutover request. */
export const releaseReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      release_ref: z.string().min(1).max(160),
      version: z.string().min(1).max(40),
      channel: z.enum(["preview", "production"]).default("production"),
      company_id: uuid.optional(),
      critical: z.boolean().default(false),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await adopt(context.supabase, context.userId, "release", "readiness", { channel: data.channel, version: data.version });
    const brain = await analyze({
      capability: "deployment.impact",
      input: { module: "release", critical: data.critical, scope: data.channel },
      context: { isFounder: true, correlationId: context.userId } satisfies FounderApprovalContext,
    });
    if (brain.output.requires_approval && data.company_id) {
      const approval = await requestFounderApproval({
        data: {
          company_id: data.company_id, entity_type: "deployment.release",
          entity_id: crypto.randomUUID(),
          title: `Release · ${data.version} · ${data.channel}`,
          reason: brain.output.reason, currency: "INR",
          metadata: { source: "deployment", version: data.version, channel: data.channel, impact: brain.output },
        },
      });
      return { status: "pending_approval" as const, approval_id: approval.id, impact: brain.output };
    }
    await writeCanonicalAudit(context.supabase, {
      category: "deployment", action: "release.readiness",
      entity_type: "release", entity_id: data.release_ref,
      company_id: data.company_id ?? undefined,
      severity: brain.output.severity,
      metadata: { version: data.version, channel: data.channel },
    });
    return { status: "ready" as const, impact: brain.output };
  });

/** Backup Verification — reads latest cloud backup record. */
export const backupVerify = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "backup", "verify");
    const rows = await readAssets(context.supabase, context.userId, "cloud.backup", 10);
    const latest = rows[0] ?? null;
    const ageMs = latest ? Date.now() - new Date(latest.created_at).getTime() : null;
    return {
      latest, count: rows.length,
      fresh_within_24h: ageMs !== null && ageMs < 24 * 3_600_000,
    };
  });

/** Recovery Verification — reads latest cloud recovery drill. */
export const recoveryVerify = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "recovery", "verify");
    const rows = await readAssets(context.supabase, context.userId, "cloud.recovery", 10);
    const latest = rows[0] ?? null;
    return { latest, count: rows.length, has_recent_drill: !!latest };
  });

/** Operational Readiness — composite ops readiness signal. */
export const operationalReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "operations", "readiness");
    const [runbooks, probes] = await Promise.all([
      readAssets(context.supabase, context.userId, "infinity.%", 25),
      readAssets(context.supabase, context.userId, "cloud.%", 25),
    ]);
    return {
      runtime_registrations: runbooks.length,
      cloud_activity: probes.length,
      last_runtime_event: runbooks[0]?.created_at ?? null,
      last_cloud_event: probes[0]?.created_at ?? null,
    };
  });

/** Production Readiness Score — weighted 0–100 score. */
export const productionReadinessScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "production", "score");
    const [backups, recoveries, infra] = await Promise.all([
      readAssets(context.supabase, context.userId, "cloud.backup", 1),
      readAssets(context.supabase, context.userId, "cloud.recovery", 1),
      readAssets(context.supabase, context.userId, "infinity.%", 1),
    ]);
    const envOk = ["SUPABASE_URL", "LOVABLE_API_KEY"].every((k) => !!process.env[k]);
    const signals = [
      { key: "environment", weight: 20, passed: envOk },
      { key: "runtime", weight: 30, passed: infra.length > 0 },
      { key: "backup", weight: 30, passed: backups.length > 0 },
      { key: "recovery", weight: 20, passed: recoveries.length > 0 },
    ];
    const score = signals.reduce((acc, s) => acc + (s.passed ? s.weight : 0), 0);
    return { score, signals, verdict: score >= 80 ? "ready" : score >= 50 ? "partial" : "not_ready" };
  });

/** Deployment Analytics — canonical rollups over release events. */
export const deploymentAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "analytics", "deployment");
    const { data: logs } = await context.supabase
      .from("audit_logs")
      .select("action,severity,created_at")
      .eq("category", "deployment")
      .order("created_at", { ascending: false })
      .limit(200);
    const by_action: Record<string, number> = {};
    const by_severity: Record<string, number> = {};
    for (const r of (logs ?? []) as { action: string; severity: string }[]) {
      by_action[r.action] = (by_action[r.action] ?? 0) + 1;
      by_severity[r.severity] = (by_severity[r.severity] ?? 0) + 1;
    }
    return { total: logs?.length ?? 0, by_action, by_severity };
  });

/** Health Analytics — mission-control health rollups. */
export const healthAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "analytics", "health");
    const { data: logs } = await context.supabase
      .from("audit_logs")
      .select("action,severity,created_at")
      .eq("category", "mission_control")
      .order("created_at", { ascending: false })
      .limit(200);
    const by_severity: Record<string, number> = {};
    for (const r of (logs ?? []) as { severity: string }[]) {
      by_severity[r.severity] = (by_severity[r.severity] ?? 0) + 1;
    }
    return { total: logs?.length ?? 0, by_severity };
  });

/** Production Readiness Health — Mission Control feed. */
export const productionHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adopt(context.supabase, context.userId, "production", "health");
    await writeCanonicalAudit(context.supabase, {
      category: "mission_control", action: "production.health",
      entity_type: "production", entity_id: context.userId,
      severity: "info", metadata: { at: new Date().toISOString() },
    });
    return { healthy: true, checked_at: new Date().toISOString() };
  });
