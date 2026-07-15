// R44 — Business Specialist Runtime server functions.
// All functions are auth-gated; RLS enforced through requireSupabaseAuth.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import {
  startSession,
  transitionMode,
  setStatus,
  processTurn,
  computeAnalytics,
} from './engine';
import type { Fact, Recommendation, SpecialistModeCode } from './contracts';

const modeSchema = z.string().min(2).max(64);

const startSchema = z.object({
  mode: modeSchema,
  companyId: z.string().uuid().nullish(),
  workspaceId: z.string().uuid().nullish(),
  happySessionId: z.string().uuid().nullish(),
  language: z.string().min(2).max(8).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export const startSpecialistSessionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startSchema.parse(d))
  .handler(async ({ data, context }) =>
    startSession(context.supabase, {
      userId: context.userId,
      mode: data.mode as SpecialistModeCode,
      companyId: data.companyId ?? null,
      workspaceId: data.workspaceId ?? null,
      happySessionId: data.happySessionId ?? null,
      language: data.language,
      metadata: data.metadata,
    }),
  );

const transitionSchema = z.object({
  sessionId: z.string().uuid(),
  mode: modeSchema,
});
export const transitionSpecialistModeFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => transitionSchema.parse(d))
  .handler(async ({ data, context }) =>
    transitionMode(context.supabase, data.sessionId, data.mode as SpecialistModeCode),
  );

const statusSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(['active', 'paused', 'archived', 'ended']),
});
export const setSpecialistStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => setStatus(context.supabase, data.sessionId, data.status));

const jsonValue: z.ZodType<import('./contracts').JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);
const factSchema = z.object({
  source_runtime: z.string().min(1),
  timestamp: z.string().min(1),
  evidence: jsonValue,
  confidence: z.number().min(0).max(1),
});
const recSchema = z.object({
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
  supporting_evidence: z.array(jsonValue).default([]),
  source_runtime: z.string().min(1),
  timestamp: z.string().min(1),
});
const turnSchema = z.object({
  sessionId: z.string().uuid(),
  companyId: z.string().uuid().nullish(),
  intent: z.string().min(1).max(4000),
  input: z.record(z.string(), z.unknown()).optional(),
  facts: z.array(factSchema).optional(),
  recommendations: z.array(recSchema).optional(),
});
export const processSpecialistTurnFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => turnSchema.parse(d))
  .handler(async ({ data, context }) =>
    processTurn(context.supabase, {
      sessionId: data.sessionId,
      userId: context.userId,
      companyId: data.companyId ?? null,
      intent: data.intent,
      input: data.input,
      facts: data.facts as Fact[] | undefined,
      recommendations: data.recommendations as Recommendation[] | undefined,
    }),
  );

const listRegistrySchema = z.object({ enabledOnly: z.boolean().optional() });
export const listSpecialistModesFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listRegistrySchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from('specialist_mode_registry').select('*').order('domain');
    if (data.enabledOnly) q = q.eq('enabled', true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const listSessionsSchema = z.object({
  status: z.enum(['active', 'paused', 'archived', 'ended']).optional(),
  companyId: z.string().uuid().nullish(),
  limit: z.number().int().min(1).max(200).default(50),
});
export const listSpecialistSessionsFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSessionsSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from('specialist_sessions')
      .select('*')
      .order('last_activity_at', { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq('status', data.status);
    if (data.companyId) q = q.eq('company_id', data.companyId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const listTurnsSchema = z.object({
  sessionId: z.string().uuid(),
  limit: z.number().int().min(1).max(500).default(100),
});
export const listSpecialistTurnsFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listTurnsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('specialist_turns')
      .select('*')
      .eq('session_id', data.sessionId)
      .order('seq', { ascending: true })
      .limit(data.limit);
    if (error) throw error;
    return rows ?? [];
  });

const analyticsSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  companyId: z.string().uuid().nullish(),
  sessionId: z.string().uuid().nullish(),
});
export const computeSpecialistAnalyticsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => analyticsSchema.parse(d))
  .handler(async ({ data, context }) =>
    computeAnalytics(context.supabase, context.userId, {
      from: data.from,
      to: data.to,
      companyId: data.companyId ?? null,
      sessionId: data.sessionId ?? null,
    }),
  );
