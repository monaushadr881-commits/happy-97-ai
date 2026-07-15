// R44 — Business Specialist Runtime engine.
// Persists sessions, appends turns, resolves evidence and recommendations
// strictly through the caller's RLS-authenticated Supabase client.

import type { SupabaseClient } from '@supabase/supabase-js';
import { routeIntent } from './router';
import type {
  Fact,
  Recommendation,
  RouteResolution,
  SessionStatus,
  SpecialistModeCode,
  TurnResult,
} from './contracts';

type Sb = SupabaseClient<any, any, any>;

export interface StartSessionInput {
  userId: string;
  mode: SpecialistModeCode;
  companyId?: string | null;
  workspaceId?: string | null;
  happySessionId?: string | null;
  language?: string;
  metadata?: Record<string, unknown>;
}

export async function startSession(sb: Sb, input: StartSessionInput) {
  const { data, error } = await sb
    .from('specialist_sessions')
    .insert({
      user_id: input.userId,
      current_mode: input.mode,
      company_id: input.companyId ?? null,
      workspace_id: input.workspaceId ?? null,
      happy_session_id: input.happySessionId ?? null,
      language: input.language ?? 'en',
      mode_history: [{ mode: input.mode, at: new Date().toISOString() }],
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function transitionMode(
  sb: Sb,
  sessionId: string,
  newMode: SpecialistModeCode,
) {
  const { data: existing, error: readErr } = await sb
    .from('specialist_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (readErr) throw readErr;
  const history = Array.isArray(existing.mode_history) ? existing.mode_history : [];
  const { data, error } = await sb
    .from('specialist_sessions')
    .update({
      previous_mode: existing.current_mode,
      current_mode: newMode,
      mode_history: [...history, { mode: newMode, at: new Date().toISOString() }],
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function setStatus(sb: Sb, sessionId: string, status: SessionStatus) {
  const patch: Record<string, unknown> = {
    status,
    last_activity_at: new Date().toISOString(),
  };
  if (status === 'ended' || status === 'archived') patch.ended_at = new Date().toISOString();
  const { data, error } = await sb
    .from('specialist_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function loadRegistry(sb: Sb) {
  const { data, error } = await sb
    .from('specialist_mode_registry')
    .select('code,domain,capabilities,runtime_routes,min_confidence,enabled')
    .eq('enabled', true);
  if (error) throw error;
  return data ?? [];
}

export interface ProcessTurnInput {
  sessionId: string;
  userId: string;
  companyId?: string | null;
  intent: string;
  input?: Record<string, unknown>;
  facts?: Fact[];
  recommendations?: Recommendation[];
}

// The engine does not execute business logic itself. Callers pass in facts/
// recommendations they've resolved from owning runtimes (Brain, Finance, CRM,
// etc). The engine records the routing decision and enforces the FACT vs
// RECOMMENDATION separation.
export async function processTurn(sb: Sb, input: ProcessTurnInput): Promise<TurnResult> {
  const started = Date.now();
  const [{ data: session, error: sErr }, registry] = await Promise.all([
    sb.from('specialist_sessions').select('*').eq('id', input.sessionId).single(),
    loadRegistry(sb),
  ]);
  if (sErr) throw sErr;

  const route: RouteResolution = routeIntent(
    input.intent,
    session.current_mode as SpecialistModeCode,
    registry,
  );

  // Auto-switch mode if router chose a different mode with meaningful confidence.
  if (route.mode !== session.current_mode && route.confidence >= 0.55) {
    await transitionMode(sb, input.sessionId, route.mode);
  }

  const facts = (input.facts ?? []).map((f) => ({
    source_runtime: f.source_runtime,
    timestamp: f.timestamp,
    evidence: f.evidence,
    confidence: Math.max(0, Math.min(1, f.confidence)),
  }));
  const recommendations = (input.recommendations ?? []).map((r) => ({
    reason: r.reason,
    confidence: Math.max(0, Math.min(1, r.confidence)),
    supporting_evidence: Array.isArray(r.supporting_evidence) ? r.supporting_evidence : [],
    source_runtime: r.source_runtime,
    timestamp: r.timestamp,
  }));

  // Determine next sequence number (append-only, per session).
  const { data: last } = await sb
    .from('specialist_turns')
    .select('seq')
    .eq('session_id', input.sessionId)
    .order('seq', { ascending: false })
    .limit(1)
    .maybeSingle();
  const seq = ((last?.seq as number | undefined) ?? 0) + 1;

  const latency = Date.now() - started;
  const { error: insErr } = await sb.from('specialist_turns').insert({
    session_id: input.sessionId,
    user_id: input.userId,
    company_id: input.companyId ?? session.company_id ?? null,
    seq,
    mode: route.mode,
    intent: input.intent,
    domain: route.domain,
    capability: route.capability,
    routed_runtime: route.routed_runtime,
    input: input.input ?? {},
    facts,
    recommendations,
    confidence: route.confidence,
    latency_ms: latency,
  });
  if (insErr) throw insErr;

  await sb
    .from('specialist_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', input.sessionId);

  return { route, facts, recommendations, latency_ms: latency };
}

export interface AnalyticsWindow {
  from: string;
  to: string;
  companyId?: string | null;
  sessionId?: string | null;
}

export async function computeAnalytics(sb: Sb, userId: string, win: AnalyticsWindow) {
  let q = sb
    .from('specialist_turns')
    .select('session_id,mode,domain,confidence,latency_ms,facts,recommendations,created_at,company_id')
    .gte('created_at', win.from)
    .lte('created_at', win.to);
  if (win.companyId) q = q.eq('company_id', win.companyId);
  if (win.sessionId) q = q.eq('session_id', win.sessionId);
  const { data: turns, error } = await q;
  if (error) throw error;

  const rows = turns ?? [];
  const modeDist: Record<string, number> = {};
  const domainDist: Record<string, number> = {};
  const sessionSet = new Set<string>();
  let totalConfidence = 0;
  let totalLatency = 0;
  let evidenceCovered = 0;
  let recCount = 0;
  for (const t of rows) {
    modeDist[t.mode] = (modeDist[t.mode] ?? 0) + 1;
    domainDist[t.domain] = (domainDist[t.domain] ?? 0) + 1;
    sessionSet.add(t.session_id);
    totalConfidence += Number(t.confidence ?? 0);
    totalLatency += Number(t.latency_ms ?? 0);
    if (Array.isArray(t.facts) && t.facts.length > 0) evidenceCovered += 1;
    if (Array.isArray(t.recommendations)) recCount += t.recommendations.length;
  }
  const n = Math.max(1, rows.length);
  const snapshot = {
    company_id: win.companyId ?? null,
    session_id: win.sessionId ?? null,
    window_start: win.from,
    window_end: win.to,
    total_turns: rows.length,
    total_sessions: sessionSet.size,
    mode_distribution: modeDist,
    domain_distribution: domainDist,
    avg_confidence: totalConfidence / n,
    evidence_coverage: evidenceCovered / n,
    recommendation_count: recCount,
    avg_latency_ms: totalLatency / n,
    computed_by: userId,
  };
  const { data, error: insErr } = await sb
    .from('specialist_analytics_snapshots')
    .insert(snapshot)
    .select('*')
    .single();
  if (insErr) throw insErr;
  return data;
}
