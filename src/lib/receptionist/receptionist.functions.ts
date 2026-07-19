// R46 Public AI Receptionist — visitor orchestration.
// Every capability delegates to an existing runtime table (CRM leads,
// support tickets, appointments) — never duplicates them.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { JsonValue } from '../happy-orchestration/json';

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]),
);

const MODES = ['welcome','company','product','service','dealer','distributor','career','support','contact','investor','education'] as const;
type Mode = typeof MODES[number];

// -------- Session lifecycle ----------------------------------------------
const startSchema = z.object({
  visitorKey: z.string().min(1).max(128),
  companyId: z.string().uuid().nullish(),
  channel: z.enum(['web','voice','whatsapp','mobile','kiosk']).default('web'),
  mode: z.enum(MODES).default('welcome'),
  language: z.string().min(2).max(8).default('en'),
  metadata: z.record(z.string(), jsonValue).optional(),
});
export const startReceptionistSessionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "startReceptionistSessionFn", source: "api", module: "receptionist.startReceptionistSessionFn" });
    // Detect returning visitor by visitor_key.
    const { data: prior } = await context.supabase
      .from('receptionist_sessions').select('id').eq('visitor_key', data.visitorKey).limit(1).maybeSingle();
    const { data: row, error } = await context.supabase.from('receptionist_sessions').insert({
      visitor_key: data.visitorKey,
      user_id: context.userId,
      company_id: data.companyId ?? null,
      channel: data.channel,
      mode: data.mode,
      language: data.language,
      is_returning: Boolean(prior?.id),
      metadata: data.metadata ?? {},
    }).select('*').single();
    if (error) throw error;
    return row);

const endSchema = z.object({ sessionId: z.string().uuid(), status: z.enum(['ended','abandoned']).default('ended') });
export const endReceptionistSessionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => endSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from('receptionist_sessions')
      .update({ status: data.status, ended_at: new Date().toISOString() })
      .eq('id', data.sessionId).select('*').single();
    if (error) throw error;
    return row;
  });

// -------- Intent routing --------------------------------------------------
const ROUTES: { kw: RegExp; mode: Mode; domain: string; runtime: string }[] = [
  { kw: /product|catalog|item|price|spec/i, mode: 'product', domain: 'products', runtime: 'marketplace' },
  { kw: /service|solution|offering/i, mode: 'service', domain: 'services', runtime: 'cms' },
  { kw: /dealer/i, mode: 'dealer', domain: 'leads', runtime: 'crm' },
  { kw: /distributor/i, mode: 'distributor', domain: 'leads', runtime: 'crm' },
  { kw: /career|job|hiring/i, mode: 'career', domain: 'leads', runtime: 'crm' },
  { kw: /invest/i, mode: 'investor', domain: 'leads', runtime: 'crm' },
  { kw: /quote|quotation|pricing/i, mode: 'contact', domain: 'quotation', runtime: 'crm' },
  { kw: /meeting|demo|appointment|call ?back|visit|consult/i, mode: 'contact', domain: 'appointment', runtime: 'crm' },
  { kw: /support|help|issue|ticket|problem/i, mode: 'support', domain: 'support', runtime: 'support' },
  { kw: /course|academy|training|library|learn/i, mode: 'education', domain: 'navigation', runtime: 'education' },
  { kw: /contact|reach|call|email|address/i, mode: 'contact', domain: 'contact', runtime: 'cms' },
  { kw: /company|about|leadership|mission|vision/i, mode: 'company', domain: 'company', runtime: 'cms' },
];

function routeReception(intent: string): { mode: Mode; domain: string; runtime: string; confidence: number } {
  for (const r of ROUTES) {
    if (r.kw.test(intent)) {
      return { mode: r.mode, domain: r.domain, runtime: r.runtime, confidence: 0.75 };
    }
  }
  return { mode: 'welcome', domain: 'welcome', runtime: 'receptionist', confidence: 0.3 };
}

// -------- Turn processing -------------------------------------------------
const turnSchema = z.object({
  sessionId: z.string().uuid(),
  intent: z.string().min(1).max(2000),
  input: z.record(z.string(), jsonValue).optional(),
  createLead: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string().default('receptionist'),
  }).optional(),
  createTicket: z.object({
    subject: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['low','medium','high','critical']).default('medium'),
  }).optional(),
});
export const processReceptionistTurnFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => turnSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "processReceptionistTurnFn", source: "api", module: "receptionist.processReceptionistTurnFn" });
    const started = Date.now();
    const { data: session, error: sErr } = await context.supabase
      .from('receptionist_sessions').select('*').eq('id', data.sessionId).single();
    if (sErr) throw sErr;

    const route = routeReception(data.intent);
    const outcome: Record<string, JsonValue> = {};

    // Optional side effects delegated to owning runtimes via RLS.
    if (data.createLead) {
      const { data: lead, error } = await context.supabase.from('leads').insert({
        name: data.createLead.name,
        email: data.createLead.email ?? null,
        phone: data.createLead.phone ?? null,
        source: data.createLead.source,
        status: 'active',
        company_id: session.company_id ?? '',
      } as any).select('id').single();
      if (!error && lead) outcome.lead_id = lead.id as JsonValue;
    }

    // Determine next seq
    const { data: last } = await context.supabase
      .from('receptionist_turns').select('seq')
      .eq('session_id', data.sessionId).order('seq', { ascending: false }).limit(1).maybeSingle();
    const seq = ((last?.seq as number | undefined) ?? 0) + 1;

    const facts = [{
      source_runtime: route.runtime,
      timestamp: new Date().toISOString(),
      evidence: { routed: true, mode: route.mode, domain: route.domain } as JsonValue,
      confidence: route.confidence,
    }];

    const { error: insErr } = await context.supabase.from('receptionist_turns').insert({
      session_id: data.sessionId,
      seq,
      user_id: context.userId,
      company_id: session.company_id ?? null,
      mode: route.mode,
      intent: data.intent,
      domain: route.domain,
      routed_runtime: route.runtime,
      input: data.input ?? {},
      facts,
      recommendations: [],
      outcome,
      confidence: route.confidence,
      latency_ms: Date.now() - started,
    });
    if (insErr) throw insErr;

    // Update session mode + activity
    await context.supabase.from('receptionist_sessions').update({
      mode: route.mode, last_activity_at: new Date().toISOString(),
    }).eq('id', data.sessionId);

    return { route, outcome, seq };
  });

// -------- Analytics -------------------------------------------------------
const analyticsSchema = z.object({
  companyId: z.string().uuid().nullish(),
  from: z.string().min(1),
  to: z.string().min(1),
});
export const computeReceptionistAnalyticsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => analyticsSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "computeReceptionistAnalyticsFn", source: "api", module: "receptionist.computeReceptionistAnalyticsFn" });
    let q = context.supabase.from('receptionist_turns')
      .select('session_id,mode,domain,confidence,latency_ms,outcome,created_at,company_id')
      .gte('created_at', data.from).lte('created_at', data.to);
    if (data.companyId) q = q.eq('company_id', data.companyId);
    const { data: turns, error } = await q;
    if (error) throw error;

    const modeDist: Record<string, number> = {};
    const domainDist: Record<string, number> = {};
    const sessions = new Set<string>();
    let leads = 0, tickets = 0, appts = 0, totalConf = 0, totalLat = 0;
    for (const t of turns ?? []) {
      modeDist[t.mode] = (modeDist[t.mode] ?? 0) + 1;
      domainDist[t.domain] = (domainDist[t.domain] ?? 0) + 1;
      sessions.add(t.session_id);
      const out: any = t.outcome ?? {};
      if (out.lead_id) leads++;
      if (out.ticket_id) tickets++;
      if (out.appointment_id) appts++;
      totalConf += Number(t.confidence ?? 0);
      totalLat += Number(t.latency_ms ?? 0);
    }
    const n = Math.max(1, (turns ?? []).length);
    const snapshot = {
      company_id: data.companyId ?? null,
      window_start: data.from,
      window_end: data.to,
      total_sessions: sessions.size,
      total_turns: (turns ?? []).length,
      languages: {},
      mode_distribution: modeDist,
      domain_distribution: domainDist,
      lead_conversions: leads,
      appointment_conversions: appts,
      ticket_conversions: tickets,
      avg_confidence: totalConf / n,
      avg_latency_ms: totalLat / n,
      computed_by: context.userId,
    };
    const { data: row, error: insErr } = await context.supabase
      .from('receptionist_analytics_snapshots').insert(snapshot).select('*').single();
    if (insErr) throw insErr;
    return row;
  });
