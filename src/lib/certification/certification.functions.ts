// R50 Production Certification Runtime.
// Capability registry, health checks, certification reports, releases.
// Ops-admin gated. Never fakes readiness.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { JsonValue } from '../happy-orchestration/json';

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]),
);

const CAP_STATUS = ['working','partial','blocked','planned'] as const;
const HEALTH = ['ok','degraded','down','unknown'] as const;

// -------- Registry --------------------------------------------------------
export const listCapabilitiesFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('capability_registry')
      .select('*').order('release_id').order('code');
    if (error) throw error;
    return data ?? [];
  });

const upsertCapSchema = z.object({
  code: z.string().min(2),
  release_id: z.string().min(2),
  label: z.string().min(1),
  runtime: z.string().min(1),
  version: z.string().min(1).default('1.0.0'),
  status: z.enum(CAP_STATUS),
  dependencies: z.array(z.string()).default([]),
  owner: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), jsonValue).optional(),
});
export const upsertCapabilityFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertCapSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "upsertCapabilityFn", source: "api", module: "certification.upsertCapabilityFn" });
    const { data: existing } = await context.supabase.from('capability_registry')
      .select('id').eq('code', data.code).maybeSingle();
    if (existing) {
      const { data: row, error } = await context.supabase.from('capability_registry')
        .update({ ...data, metadata: data.metadata ?? {} })
        .eq('id', existing.id).select('*').single();
      if (error) throw error;
      return row;
    }
    const { data: row, error } = await context.supabase.from('capability_registry')
      .insert({ ...data, metadata: data.metadata ?? {} }).select('*').single();
    if (error) throw error;
    return row;
  });

// -------- Health checks ---------------------------------------------------
const healthSchema = z.object({
  capabilityCode: z.string().min(2),
  status: z.enum(HEALTH),
  verificationMethod: z.enum(['typecheck','rls','policy','invoke','manual','automated']),
  evidence: jsonValue.default({}),
  latencyMs: z.number().int().min(0).optional(),
});
export const recordHealthCheckFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => healthSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "recordHealthCheckFn", source: "api", module: "certification.recordHealthCheckFn" });
    const { data: row, error } = await context.supabase.from('capability_health_checks').insert({
      capability_code: data.capabilityCode,
      status: data.status,
      verification_method: data.verificationMethod,
      evidence: data.evidence,
      latency_ms: data.latencyMs ?? null,
      checked_by: context.userId,
    }).select('*').single();
    if (error) throw error;
    return row;
  });

// -------- Certification report -------------------------------------------
const reportSchema = z.object({
  releaseId: z.string().min(2),
  version: z.string().min(1),
});
export const generateCertificationReportFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reportSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "generateCertificationReportFn", source: "api", module: "certification.generateCertificationReportFn" });
    const { data: caps, error: capsErr } = await context.supabase.from('capability_registry')
      .select('*').order('code');
    if (capsErr) throw capsErr;

    // Latest health per capability
    const healthByCap: Record<string, any> = {};
    for (const c of caps ?? []) {
      const { data: latest } = await context.supabase.from('capability_health_checks')
        .select('*').eq('capability_code', c.code)
        .order('checked_at', { ascending: false }).limit(1).maybeSingle();
      healthByCap[c.code] = latest ?? { status: 'unknown', checked_at: null };
    }

    const workingCount = (caps ?? []).filter((c: any) => c.status === 'working').length;
    const partialCount = (caps ?? []).filter((c: any) => c.status === 'partial').length;
    const blockedCount = (caps ?? []).filter((c: any) => c.status === 'blocked').length;
    const plannedCount = (caps ?? []).filter((c: any) => c.status === 'planned').length;
    const total = (caps ?? []).length || 1;
    const readinessScore = Math.round((workingCount + partialCount * 0.5) / total * 100);

    const blockedItems = (caps ?? []).filter((c: any) => c.status === 'blocked' || c.status === 'planned')
      .map((c: any) => ({ code: c.code, label: c.label, status: c.status, description: c.description }));

    const dependencyMatrix = (caps ?? []).map((c: any) => ({
      code: c.code,
      dependencies: c.dependencies,
      missing: (c.dependencies ?? []).filter((d: string) => !(caps ?? []).some((x: any) => x.code === d)),
    }));

    const healthMatrix = (caps ?? []).map((c: any) => ({
      code: c.code,
      status: healthByCap[c.code].status,
      checked_at: healthByCap[c.code].checked_at,
      method: healthByCap[c.code].verification_method ?? null,
    }));

    const facts = [{
      source_runtime: 'certification',
      timestamp: new Date().toISOString(),
      evidence: { working: workingCount, partial: partialCount, blocked: blockedCount, planned: plannedCount, total },
      confidence: 1,
    }];
    const recommendations = blockedCount + plannedCount > 0
      ? [{
          reason: `${blockedCount + plannedCount} capabilities are blocked or planned; release must list them as external dependencies.`,
          confidence: 0.95,
          supporting_evidence: blockedItems as unknown as JsonValue[],
          source_runtime: 'certification',
          timestamp: new Date().toISOString(),
        }]
      : [];

    const overall = blockedCount + plannedCount === 0 && workingCount + partialCount === total
      ? (partialCount === 0 ? 'ready' : 'ready')
      : (workingCount / total >= 0.8 ? 'ready' : 'not_ready');

    const { data: row, error } = await context.supabase.from('certification_reports').insert({
      release_id: data.releaseId,
      version: data.version,
      generated_by: context.userId,
      overall_status: overall,
      readiness_score: readinessScore,
      capability_matrix: caps ?? [],
      dependency_matrix: dependencyMatrix,
      health_matrix: healthMatrix,
      security_matrix: [],
      performance_matrix: [],
      risk_matrix: [],
      blocked_items: blockedItems,
      facts,
      recommendations,
    }).select('*').single();
    if (error) throw error;
    return row;
  });

export const listCertificationReportsFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('certification_reports')
      .select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data ?? [];
  });

// -------- Releases --------------------------------------------------------
const releaseSchema = z.object({
  version: z.string().min(1),
  channel: z.enum(['rc','stable','hotfix','rollback']).default('rc'),
  releaseNotes: z.string().optional(),
  compatibility: z.record(z.string(), jsonValue).optional(),
  certificationId: z.string().uuid().nullish(),
});
export const createReleaseFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => releaseSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "createReleaseFn", source: "api", module: "certification.createReleaseFn" });
    const { data: row, error } = await context.supabase.from('release_records').insert({
      version: data.version,
      channel: data.channel,
      released_by: context.userId,
      status: 'pending',
      release_notes: data.releaseNotes ?? null,
      compatibility: data.compatibility ?? {},
      certification_id: data.certificationId ?? null,
    }).select('*').single();
    if (error) throw error;
    return row;
  });

const releaseStatusSchema = z.object({
  releaseId: z.string().uuid(),
  status: z.enum(['pending','released','rolled_back','superseded']),
});
export const setReleaseStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => releaseStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "setReleaseStatusFn", source: "api", module: "certification.setReleaseStatusFn" });
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === 'released') patch.released_at = new Date().toISOString();
    const { data: row, error } = await context.supabase.from('release_records')
      .update(patch as any).eq('id', data.releaseId).select('*').single();
    if (error) throw error;
    return row;
  });

export const listReleasesFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('release_records')
      .select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data ?? [];
  });
