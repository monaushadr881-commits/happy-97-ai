// R45 Founder Executive AI — orchestration only.
// Aggregates evidence from existing runtimes (RLS-scoped) into briefings,
// business-health snapshots, decisions and executive reports.
// Never fabricates KPIs. Never merges FACT with AI RECOMMENDATION.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Fact, JsonValue, Recommendation } from '../happy-orchestration/json';

type Sb = SupabaseClient<any, any, any>;

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]),
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

// -------- Business Health -------------------------------------------------
const DIMENSIONS = ['revenue','sales','customer','inventory','manufacturing','deployment','security','platform','growth'] as const;
type Dimension = typeof DIMENSIONS[number];

function classify(score: number): string {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'watch';
  if (score >= 40) return 'at_risk';
  return 'critical';
}

async function computeDimensionScore(
  sb: Sb,
  dim: Dimension,
  companyId: string | null,
  from: string,
  to: string,
): Promise<{ score: number; facts: Fact[]; source_runtimes: string[] }> {
  const facts: Fact[] = [];
  const sources: string[] = [];
  const record = (source: string, evidence: JsonValue, confidence: number) => {
    facts.push({ source_runtime: source, timestamp: new Date().toISOString(), evidence, confidence });
    if (!sources.includes(source)) sources.push(source);
  };

  // Each dimension pulls only from an existing runtime table via RLS.
  if (dim === 'revenue') {
    let q = sb.from('invoices').select('id,total,status,created_at').gte('created_at', from).lte('created_at', to);
    if (companyId) q = q.eq('company_id', companyId);
    const { data } = await q;
    const rows = data ?? [];
    const paid = rows.filter((r: any) => String(r.status ?? '').toLowerCase() === 'paid').length;
    const rate = rows.length ? paid / rows.length : 0;
    record('finance', { invoices: rows.length, paid, rate }, 0.9);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'sales') {
    let q = sb.from('deals').select('id,stage,amount,created_at').gte('created_at', from).lte('created_at', to);
    if (companyId) q = q.eq('company_id', companyId);
    const { data } = await q;
    const rows = data ?? [];
    const won = rows.filter((r: any) => /won|closed_won/i.test(String(r.stage ?? ''))).length;
    const rate = rows.length ? won / rows.length : 0;
    record('crm', { deals: rows.length, won, win_rate: rate }, 0.9);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'customer') {
    let q = sb.from('customers').select('id,status,created_at').gte('created_at', from).lte('created_at', to);
    if (companyId) q = q.eq('company_id', companyId);
    const { data } = await q;
    const rows = data ?? [];
    const active = rows.filter((r: any) => /active/i.test(String(r.status ?? ''))).length;
    const rate = rows.length ? active / rows.length : 0;
    record('crm', { customers: rows.length, active, active_rate: rate }, 0.85);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'inventory') {
    let q = sb.from('inventory_thresholds').select('id,current_level,threshold_level,status');
    if (companyId) q = q.eq('company_id', companyId);
    const { data } = await q;
    const rows = data ?? [];
    const breaches = rows.filter((r: any) => Number(r.current_level ?? 0) < Number(r.threshold_level ?? 0)).length;
    const okRate = rows.length ? 1 - breaches / rows.length : 1;
    record('wms', { thresholds: rows.length, breaches }, 0.9);
    return { score: Math.round(okRate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'manufacturing') {
    let q = sb.from('production_orders').select('id,status,created_at').gte('created_at', from).lte('created_at', to);
    if (companyId) q = q.eq('company_id', companyId);
    const { data } = await q;
    const rows = data ?? [];
    const done = rows.filter((r: any) => /complet|done|closed/i.test(String(r.status ?? ''))).length;
    const rate = rows.length ? done / rows.length : 0;
    record('mfg', { orders: rows.length, completed: done }, 0.85);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'deployment') {
    let q = sb.from('project_deployments').select('id,status,created_at').gte('created_at', from).lte('created_at', to);
    const { data } = await q;
    const rows = data ?? [];
    const ok = rows.filter((r: any) => /success|deployed|live/i.test(String(r.status ?? ''))).length;
    const rate = rows.length ? ok / rows.length : 1;
    record('deployment', { deployments: rows.length, ok }, 0.85);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'security') {
    let q = sb.from('audit_logs').select('id,severity,created_at').gte('created_at', from).lte('created_at', to);
    if (companyId) q = q.eq('company_id', companyId);
    const { data } = await q;
    const rows = data ?? [];
    const critical = rows.filter((r: any) => /critical|high/i.test(String(r.severity ?? ''))).length;
    const rate = rows.length ? 1 - Math.min(1, critical / Math.max(10, rows.length)) : 1;
    record('audit', { events: rows.length, critical }, 0.8);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  if (dim === 'platform') {
    const { data } = await sb.from('health_checks').select('id,status,checked_at').gte('checked_at', from).lte('checked_at', to);
    const rows = data ?? [];
    const ok = rows.filter((r: any) => /ok|healthy|up/i.test(String(r.status ?? ''))).length;
    const rate = rows.length ? ok / rows.length : 1;
    record('observability', { checks: rows.length, ok }, 0.9);
    return { score: Math.round(rate * 100), facts, source_runtimes: sources };
  }
  // growth
  let q = sb.from('leads').select('id,status,created_at').gte('created_at', from).lte('created_at', to);
  if (companyId) q = q.eq('company_id', companyId);
  const { data } = await q;
  const rows = data ?? [];
  const qualified = rows.filter((r: any) => /qualified|converted/i.test(String(r.status ?? ''))).length;
  const rate = rows.length ? qualified / rows.length : 0;
  record('crm', { leads: rows.length, qualified }, 0.8);
  return { score: Math.round(rate * 100), facts, source_runtimes: sources };
}

const healthSchema = z.object({
  companyId: z.string().uuid().nullish(),
  from: z.string().min(1),
  to: z.string().min(1),
  dimensions: z.array(z.enum(DIMENSIONS)).optional(),
});
export const computeBusinessHealthFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => healthSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "computeBusinessHealthFn", source: "api", module: "founder.exec.computeBusinessHealthFn" });
    const dims = (data.dimensions ?? DIMENSIONS) as Dimension[];
    const results: any[] = [];
    for (const dim of dims) {
      const { score, facts, source_runtimes } = await computeDimensionScore(
        context.supabase, dim, data.companyId ?? null, data.from, data.to,
      );
      const row = {
        company_id: data.companyId ?? null,
        computed_by: context.userId,
        period_start: data.from,
        period_end: data.to,
        dimension: dim,
        score,
        status: classify(score),
        facts,
        recommendations: [],
        source_runtimes,
      };
      const { data: inserted, error } = await context.supabase
        .from('founder_business_health_snapshots').insert(row as any).select('*').single();
      if (error) throw error;
      results.push(inserted);
    }
    return results;
  });

const listHealthSchema = z.object({
  companyId: z.string().uuid().nullish(),
  dimension: z.enum(DIMENSIONS).nullish(),
  limit: z.number().int().min(1).max(200).default(50),
});
export const listBusinessHealthFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listHealthSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from('founder_business_health_snapshots')
      .select('*').order('created_at', { ascending: false }).limit(data.limit);
    if (data.companyId) q = q.eq('company_id', data.companyId);
    if (data.dimension) q = q.eq('dimension', data.dimension);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// -------- Executive Decisions --------------------------------------------
const decisionSchema = z.object({
  companyId: z.string().uuid().nullish(),
  title: z.string().min(1),
  category: z.enum(['strategy','expansion','cost','revenue','risk','hiring','other']),
  decision: z.enum(['approve','reject','defer','delegate']),
  rationale: z.string().optional(),
  facts: z.array(factSchema).default([]),
  recommendations_considered: z.array(recSchema).default([]),
  alternatives: z.array(jsonValue).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});
export const recordFounderDecisionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decisionSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "recordFounderDecisionFn", source: "api", module: "founder.exec.recordFounderDecisionFn" });
    const { data: row, error } = await context.supabase
      .from('founder_decision_records')
      .insert({ title: data.title, category: data.category, decision: data.decision, rationale: data.rationale ?? null, facts: data.facts as any, recommendations_considered: data.recommendations_considered as any, alternatives: data.alternatives as any, confidence: data.confidence, company_id: data.companyId ?? null, decided_by: context.userId } as any)
      .select('*').single();
    if (error) throw error;
    return row;
  });

const decisionOutcomeSchema = z.object({
  decisionId: z.string().uuid(),
  outcome: z.string().min(1),
});
export const recordDecisionOutcomeFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decisionOutcomeSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "recordDecisionOutcomeFn", source: "api", module: "founder.exec.recordDecisionOutcomeFn" });
    const { data: row, error } = await context.supabase
      .from('founder_decision_records')
      .update({ outcome: data.outcome, outcome_recorded_at: new Date().toISOString() })
      .eq('id', data.decisionId).select('*').single();
    if (error) throw error;
    return row;
  });

// -------- Executive Reports & Briefings ----------------------------------
const reportSchema = z.object({
  companyId: z.string().uuid().nullish(),
  reportType: z.enum(['board','investor','management','operational','growth','audit','briefing']),
  from: z.string().min(1),
  to: z.string().min(1),
  title: z.string().min(1),
  briefingType: z.enum(['morning','evening','daily','weekly','monthly','quarterly','annual']).optional(),
});
export const generateExecutiveReportFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reportSchema.parse(d))
  .handler(async ({ data, context }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "generateExecutiveReportFn", source: "api", module: "founder.exec.generateExecutiveReportFn" });
    const dims: Dimension[] = ['revenue','sales','customer','inventory','manufacturing','deployment','security','platform','growth'];
    const sections: any[] = [];
    const allFacts: Fact[] = [];
    const sources = new Set<string>();
    for (const dim of dims) {
      const { score, facts, source_runtimes } = await computeDimensionScore(
        context.supabase, dim, data.companyId ?? null, data.from, data.to,
      );
      sections.push({ dimension: dim, score, status: classify(score), facts });
      allFacts.push(...facts);
      source_runtimes.forEach((s) => sources.add(s));
    }
    // Executive recommendations kept explicitly separate from facts.
    const recommendations: Recommendation[] = sections
      .filter((s) => s.score < 60)
      .map((s) => ({
        reason: `${s.dimension} score is ${s.score} (${s.status}). Investigate before next review.`,
        confidence: 0.6,
        supporting_evidence: s.facts as JsonValue[],
        source_runtime: 'founder-executive',
        timestamp: new Date().toISOString(),
      }));

    const content = {
      report_type: data.reportType,
      briefing_type: data.briefingType ?? null,
      period: { from: data.from, to: data.to },
      sections,
      recommendations,
      overall_score: Math.round(sections.reduce((s, r) => s + r.score, 0) / Math.max(1, sections.length)),
    };
    const { data: row, error } = await context.supabase.from('founder_executive_reports').insert({
      company_id: data.companyId ?? null,
      generated_by: context.userId,
      report_type: data.reportType,
      period_start: data.from,
      period_end: data.to,
      title: data.title,
      content: content as any,

      facts_count: allFacts.length,
      recommendations_count: recommendations.length,
      source_runtimes: Array.from(sources),
      status: 'draft',
    }).select('*').single();
    if (error) throw error;
    return row;
  });

const listReportsSchema = z.object({
  companyId: z.string().uuid().nullish(),
  reportType: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});
export const listExecutiveReportsFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listReportsSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from('founder_executive_reports')
      .select('*').order('created_at', { ascending: false }).limit(data.limit);
    if (data.companyId) q = q.eq('company_id', data.companyId);
    if (data.reportType) q = q.eq('report_type', data.reportType);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
