/**
 * HAPPY X — R34 Backup / DR / Business Continuity server functions.
 *
 * Auth-gated (requireSupabaseAuth) + RLS-gated to is_ops_admin.
 * Every response separates `fact.*` (measured / recorded) from
 * `recommendation.*` (AI heuristics).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { toAppError } from "@/services/core/errors";
import { backupEngine, BACKUP_TARGETS, type BackupTarget } from "./engine";

const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });
const TargetEnum = z.enum(BACKUP_TARGETS as [BackupTarget, ...BackupTarget[]]);
const BackupTypeEnum = z.enum(["full", "incremental", "differential", "point_in_time"]);

// ---- Policies ----
const PolicyInput = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  target_scope: TargetEnum,
  backup_type: BackupTypeEnum.default("full"),
  schedule_cron: z.string().max(120).optional(),
  retention_daily: z.number().int().min(1).max(3650).default(7),
  retention_weekly: z.number().int().min(0).max(520).default(4),
  retention_monthly: z.number().int().min(0).max(240).default(12),
  retention_yearly: z.number().int().min(0).max(50).default(3),
  encryption_algo: z.string().max(80).default("aes-256-gcm"),
  compression: z.string().max(40).default("zstd"),
  deduplication: z.boolean().default(true),
  enabled: z.boolean().default(true),
});
export const bkpListPolicies = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await context.supabase.from("bkp_policies").select("*").order("name");
    if (error) throw error; return data ?? [];
  }));
export const bkpUpsertPolicy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PolicyInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpUpsertPolicy", source: "api", module: "backup.bkpUpsertPolicy" });
    return guard(async () => {
    const { data: row, error } = await context.supabase.from("bkp_policies")
      .upsert({ ...data, created_by: context.userId } as never, { onConflict: "name" })
      .select("*").single(;
  });
    if (error) throw error;
    await context.supabase.from("bkp_audit_events").insert({
      kind: "policy.upserted", ref_type: "policy", ref_id: (row as { id: string }).id,
      actor_id: context.userId, message: `Policy upserted: ${data.name}`,
    } as never);
    return row;
  }));
export const bkpDeletePolicy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpDeletePolicy", source: "api", module: "backup.bkpDeletePolicy" });
    return guard(async () => {
    const { error } = await context.supabase.from("bkp_policies").delete().eq("id", data.id;
  });
    if (error) throw error; return { ok: true };
  }));

// ---- Backups ----
const RunBackupInput = z.object({
  target: TargetEnum,
  backup_type: BackupTypeEnum.default("full"),
  policy_id: z.string().uuid().optional(),
  trigger: z.enum(["scheduled", "manual", "drill"]).default("manual"),
  parent_job_id: z.string().uuid().optional(),
});
export const bkpRunBackup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RunBackupInput.parse(i))
  .handler(async ({ data, context }) => guard(() => backupEngine.runBackup(context.supabase, context.userId, data)));

export const bkpVerifyBackup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ job_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpVerifyBackup", source: "api", module: "backup.bkpVerifyBackup" });
    return guard(() => backupEngine.verifyBackup(context.supabase, context.userId, data.job_id));
  });
const ListBackupsInput = z.object({
  target: TargetEnum.optional(),
  status: z.string().max(40).optional(),
  limit: z.number().int().min(1).max(200).default(50),
}).partial();
export const bkpListJobs = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ListBackupsInput.parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("bkp_jobs").select("*")
      .order("started_at", { ascending: false }).limit(data.limit ?? 50);
    if (data.target) q = q.eq("target", data.target);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error; return rows ?? [];
  }));

export const bkpJobArtifacts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ job_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => guard(async () => {
    const { data: rows, error } = await context.supabase.from("bkp_artifacts")
      .select("*").eq("job_id", data.job_id).order("created_at", { ascending: true });
    if (error) throw error; return rows ?? [];
  }));

// ---- Restores ----
const RestoreInput = z.object({
  source_job_id: z.string().uuid(),
  mode: z.enum(["full", "partial", "object", "project", "database", "configuration"]).default("full"),
  target: TargetEnum.optional(),
  scope: z.record(z.unknown()).default({}),
});
export const bkpRestore = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RestoreInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpRestore", source: "api", module: "backup.bkpRestore" });
    return guard(() => backupEngine.runRestore(context.supabase, context.userId, data));
  });export const bkpListRestores = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(i ?? {}))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpListRestores", source: "api", module: "backup.bkpListRestores" });
    return guard(async () => {
    const { data: rows, error } = await context.supabase.from("bkp_restore_jobs")
      .select("*").order("started_at", { ascending: false }).limit(data.limit;
  });
    if (error) throw error; return rows ?? [];
  }));

// ---- Retention ----
export const bkpApplyRetention = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ policy_id: z.string().uuid().optional() }).parse(i ?? {}))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpApplyRetention", source: "api", module: "backup.bkpApplyRetention" });
    return guard(() => backupEngine.applyRetention(context.supabase, context.userId, data.policy_id));
  });
// ---- Recovery plans + drills ----
const PlanInput = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  steps: z.array(z.object({
    name: z.string().max(120).optional(),
    kind: z.enum(["backup", "verify", "checkpoint", "notify"]),
    target: TargetEnum.optional(),
    params: z.record(z.unknown()).optional(),
  })).default([]),
  rto_minutes: z.number().int().min(1).max(60 * 24 * 30).default(60),
  rpo_minutes: z.number().int().min(1).max(60 * 24 * 30).default(60),
  enabled: z.boolean().default(true),
});
export const bkpListPlans = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const { data, error } = await context.supabase.from("bkp_recovery_plans").select("*").order("name");
    if (error) throw error; return data ?? [];
  }));
export const bkpUpsertPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PlanInput.parse(i))
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "bkpUpsertPlan", source: "api", module: "backup.bkpUpsertPlan" });
    return guard(async () => {
    const { data: row, error } = await context.supabase.from("bkp_recovery_plans")
      .upsert({ ...data, created_by: context.userId } as never, { onConflict: "name" })
      .select("*").single(;
  });
    if (error) throw error; return row;
  }));
export const bkpRunDrill = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ plan_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => guard(() => backupEngine.runDrill(context.supabase, context.userId, data.plan_id)));

export const bkpListDrills = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ plan_id: z.string().uuid().optional(), limit: z.number().int().min(1).max(200).default(50) }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("bkp_recovery_drills").select("*").order("started_at", { ascending: false }).limit(data.limit);
    if (data.plan_id) q = q.eq("plan_id", data.plan_id);
    const { data: rows, error } = await q;
    if (error) throw error; return rows ?? [];
  }));

// ---- Audit ----
export const bkpAudit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    ref_type: z.string().max(40).optional(),
    ref_id: z.string().uuid().optional(),
    kind: z.string().max(80).optional(),
    limit: z.number().int().min(1).max(500).default(100),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => guard(async () => {
    let q = context.supabase.from("bkp_audit_events").select("*")
      .order("occurred_at", { ascending: false }).limit(data.limit);
    if (data.ref_type) q = q.eq("ref_type", data.ref_type);
    if (data.ref_id) q = q.eq("ref_id", data.ref_id);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw error; return rows ?? [];
  }));

// ---- Founder dashboard: readiness + alerts + recommendations ----
export const bkpDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(async () => {
    const readiness = await backupEngine.readiness(context.supabase);
    const [failedBackups, failedRestores, failedDrills] = await Promise.all([
      context.supabase.from("bkp_jobs").select("id", { head: true, count: "exact" }).eq("status", "failed"),
      context.supabase.from("bkp_restore_jobs").select("id", { head: true, count: "exact" }).eq("status", "failed"),
      context.supabase.from("bkp_recovery_drills").select("id", { head: true, count: "exact" }).eq("status", "failed"),
    ]);
    const { data: recentRestores } = await context.supabase.from("bkp_restore_jobs")
      .select("id, status, verified, finished_at").order("started_at", { ascending: false }).limit(10);
    const { data: openPlans } = await context.supabase.from("bkp_recovery_plans")
      .select("id, name, last_drill_at, last_drill_status, enabled").eq("enabled", true).order("name");

    const alerts: Array<{ code: string; severity: "info" | "warning" | "critical"; message: string }> = [];
    if ((failedBackups.count ?? 0) > 0) alerts.push({ code: "backup.failed", severity: "critical", message: `${failedBackups.count} backup job(s) in failed state` });
    if ((failedRestores.count ?? 0) > 0) alerts.push({ code: "restore.failed", severity: "critical", message: `${failedRestores.count} restore job(s) in failed state` });
    if ((failedDrills.count ?? 0) > 0) alerts.push({ code: "drill.failed", severity: "warning", message: `${failedDrills.count} recovery drill(s) failed — recovery readiness at risk` });
    for (const t of readiness.targets) {
      if (!t.last_job_id) alerts.push({ code: "backup.missing", severity: "warning", message: `No backup on record for ${t.target}` });
      else if ((t.age_minutes ?? 0) > 60 * 24 * 2) alerts.push({ code: "backup.stale", severity: "warning", message: `Backup for ${t.target} is ${Math.round((t.age_minutes ?? 0) / 60)}h old` });
    }

    const recommendations: string[] = [];
    if (readiness.totals.uncovered > 0) recommendations.push(`AI RECOMMENDATION: ${readiness.totals.uncovered} target(s) have never been backed up — run bkpRunBackup for each.`);
    if (readiness.totals.covered > 0 && readiness.totals.verified === 0) recommendations.push("AI RECOMMENDATION: No backups have been verified — call bkpVerifyBackup on the latest job per target.");
    if ((openPlans ?? []).some((p) => !(p as { last_drill_at: string | null }).last_drill_at)) recommendations.push("AI RECOMMENDATION: Some recovery plans have never been exercised — run bkpRunDrill on each.");
    if (alerts.length === 0 && recommendations.length === 0) recommendations.push("AI RECOMMENDATION: All backup/DR indicators are green — schedule the next quarterly drill.");

    return {
      fact: {
        readiness,
        failed_backup_count: failedBackups.count ?? 0,
        failed_restore_count: failedRestores.count ?? 0,
        failed_drill_count: failedDrills.count ?? 0,
        recent_restores: recentRestores ?? [],
        active_plans: openPlans ?? [],
        alerts,
        generated_at: new Date().toISOString(),
      },
      recommendation: recommendations,
    };
  }));
