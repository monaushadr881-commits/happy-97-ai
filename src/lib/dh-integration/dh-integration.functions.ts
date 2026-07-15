// R49 Digital Human Integration Runtime.
// Adapters and streaming/sync contracts only. Never implements rendering.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { JsonValue } from '../happy-orchestration/json';

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]),
);

// -------- Adapter registry ------------------------------------------------
export const listRendererAdaptersFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('dh_renderer_adapters').select('*').order('kind');
    if (error) throw error;
    return data ?? [];
  });

const upsertAdapterSchema = z.object({
  code: z.string().min(2),
  label: z.string().min(1),
  kind: z.enum(['2d','3d','streaming','xr']),
  capabilities: z.record(z.string(), jsonValue).default({}),
  requiredAssets: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});
export const registerRendererAdapterFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertAdapterSchema.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      code: data.code, label: data.label, kind: data.kind,
      capabilities: data.capabilities, required_assets: data.requiredAssets,
      enabled: data.enabled, registered_by: context.userId,
    };
    const { data: existing } = await context.supabase.from('dh_renderer_adapters')
      .select('id').eq('code', data.code).maybeSingle();
    if (existing) {
      const { data: updated, error } = await context.supabase.from('dh_renderer_adapters')
        .update(row).eq('id', existing.id).select('*').single();
      if (error) throw error;
      return updated;
    }
    const { data: inserted, error } = await context.supabase.from('dh_renderer_adapters')
      .insert(row).select('*').single();
    if (error) throw error;
    return inserted;
  });

// -------- Integration sessions -------------------------------------------
const startSchema = z.object({
  rendererCode: z.string().min(1),
  companyId: z.string().uuid().nullish(),
  identityId: z.string().uuid().nullish(),
  happySessionId: z.string().uuid().nullish(),
  voiceSessionId: z.string().uuid().nullish(),
});
export const startDhIntegrationSessionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: adapter } = await context.supabase.from('dh_renderer_adapters')
      .select('*').eq('code', data.rendererCode).maybeSingle();
    if (!adapter) throw new Error(`Unknown renderer: ${data.rendererCode}`);
    if (!adapter.enabled) throw new Error(`Renderer ${data.rendererCode} not enabled — required assets not provisioned`);
    const { data: row, error } = await context.supabase.from('dh_integration_sessions').insert({
      user_id: context.userId,
      company_id: data.companyId ?? null,
      renderer_code: data.rendererCode,
      identity_id: data.identityId ?? null,
      happy_session_id: data.happySessionId ?? null,
      voice_session_id: data.voiceSessionId ?? null,
      status: 'connecting',
    }).select('*').single();
    if (error) throw error;
    return row;
  });

const heartbeatSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(['connecting','connected','degraded','disconnected','ended']).optional(),
  latencyMs: z.number().int().min(0).optional(),
  syncState: z.record(z.string(), jsonValue).optional(),
});
export const heartbeatDhSessionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => heartbeatSchema.parse(d))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { last_heartbeat_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.latencyMs !== undefined) patch.latency_ms = data.latencyMs;
    if (data.syncState) patch.sync_state = data.syncState;
    if (data.status === 'ended') patch.ended_at = new Date().toISOString();
    const { data: row, error } = await context.supabase.from('dh_integration_sessions')
      .update(patch as any).eq('id', data.sessionId).select('*').single();
    if (error) throw error;
    return row;
  });

// -------- Integration events (animation/lipsync/gesture/lookat/env/health)
const eventSchema = z.object({
  sessionId: z.string().uuid(),
  channel: z.enum(['animation','lipsync','gesture','lookat','environment','health','stream']),
  eventType: z.string().min(1),
  payload: jsonValue.default({}),
});
export const emitDhIntegrationEventFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => eventSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: last } = await context.supabase.from('dh_integration_events')
      .select('seq').eq('session_id', data.sessionId)
      .order('seq', { ascending: false }).limit(1).maybeSingle();
    const seq = ((last?.seq as number | undefined) ?? 0) + 1;
    const { data: row, error } = await context.supabase.from('dh_integration_events').insert({
      session_id: data.sessionId, seq, user_id: context.userId,
      channel: data.channel, event_type: data.eventType, payload: data.payload,
    }).select('*').single();
    if (error) throw error;
    return row;
  });

// -------- Health rollup ---------------------------------------------------
const healthSchema = z.object({ sessionId: z.string().uuid() });
export const dhSessionHealthFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => healthSchema.parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: session }, { data: events }] = await Promise.all([
      context.supabase.from('dh_integration_sessions').select('*').eq('id', data.sessionId).single(),
      context.supabase.from('dh_integration_events').select('channel,event_type,emitted_at')
        .eq('session_id', data.sessionId).order('emitted_at', { ascending: false }).limit(200),
    ]);
    const evts = events ?? [];
    const byChannel: Record<string, number> = {};
    for (const e of evts) byChannel[e.channel] = (byChannel[e.channel] ?? 0) + 1;
    const now = Date.now();
    const lastHb = session?.last_heartbeat_at ? new Date(session.last_heartbeat_at).getTime() : 0;
    const stale = lastHb ? (now - lastHb) > 30_000 : true;
    return {
      session,
      total_events: evts.length,
      events_by_channel: byChannel,
      heartbeat_stale: stale,
      health: stale ? 'degraded' : session?.status ?? 'unknown',
    };
  });
