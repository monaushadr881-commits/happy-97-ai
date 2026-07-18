/**
 * R130 — HAPPY Founder Dashboard™ Intelligence
 *
 * Pure extension layer over the canonical Founder stack. No new dashboard
 * runtime, no duplicate analytics, no duplicate monitoring, no duplicate
 * health engine, no new DB tables.
 *
 * Canonical owners (reused):
 *  - Dashboard runtime → src/lib/dashboard-runtime-v3, dashboard-v2
 *  - Founder surfaces → src/lib/founder-executive, founder-workspace, founder-v2
 *  - Health → src/lib/health-v8, public-health-v9
 *  - Maintenance → src/lib/maintenance-v10
 *  - Analytics → src/lib/analytics-v7
 *  - Monitoring → src/lib/monitoring-v4 (+ R129 monitorAlert)
 *  - Revenue → src/lib/happy-r128/revenue-intelligence
 *  - Enterprise → src/lib/happy-r129/enterprise-intelligence
 *  - Brain → src/lib/brain/engine
 *  - Memory → src/lib/memory
 *  - Feature flags → `feature_flags` table (canonical)
 */

import type { EnterpriseIntent } from '@/lib/happy-r129/enterprise-intelligence';

// =========================================================================
// TYPES
// =========================================================================

export type ServiceKind =
  | 'platform'
  | 'ai'
  | 'brain'
  | 'memory'
  | 'workspace'
  | 'search'
  | 'files'
  | 'builder'
  | 'crm'
  | 'erp'
  | 'hrms'
  | 'inventory'
  | 'creator'
  | 'communication'
  | 'revenue'
  | 'enterprise';

export type ServiceHealth = {
  kind: ServiceKind;
  availability: number; // 0..1
  errorRate: number; // 0..1
  latencyP95Ms: number;
  saturation?: number; // 0..1
  updatedAt: number;
};

export type HealthStatus = 'operational' | 'degraded' | 'partial-outage' | 'major-outage';

export type AnalyticsSnapshot = {
  dau: number;
  mau: number;
  companies: number;
  workspaces: number;
  projects: number;
  files: number;
  aiTokens: number;
  creditsUsedMinor: number;
  activeSubscriptions: number;
  revenueMinor: number;
  creatorPublishes: number;
  commSent: number;
  at: number;
};

export type BriefKind = 'morning' | 'evening' | 'weekly' | 'monthly';

export type BriefInsight = {
  kind: 'opportunity' | 'risk' | 'action' | 'trend';
  title: string;
  detail: string;
  weight: number; // 0..1 priority
};

export type FeatureFlag = {
  key: string;
  channel: 'stable' | 'beta' | 'experimental' | 'internal';
  enabled: boolean;
  rolloutPct?: number; // 0..100
  audiences?: string[]; // e.g. ['founder','admin']
};

export type PlatformMode = 'normal' | 'maintenance' | 'emergency' | 'read-only';

export type ArchitectureAudit = {
  duplicates: { capability: string; files: string[] }[];
  orphanModules: string[];
  missingDocs: string[];
  registryDrift: string[];
  brokenTests: number;
  buildOk: boolean;
};

// =========================================================================
// PLATFORM HEALTH
// =========================================================================

export function scoreService(s: ServiceHealth): HealthStatus {
  if (s.availability < 0.95 || s.errorRate > 0.1) return 'major-outage';
  if (s.availability < 0.99 || s.errorRate > 0.03 || s.latencyP95Ms > 3000) return 'partial-outage';
  if (s.errorRate > 0.01 || s.latencyP95Ms > 1500 || (s.saturation ?? 0) > 0.85) return 'degraded';
  return 'operational';
}

const STATUS_RANK: Record<HealthStatus, number> = {
  operational: 0,
  degraded: 1,
  'partial-outage': 2,
  'major-outage': 3,
};

/** Roll a list of service scores into an overall platform status. */
export function rollupPlatformStatus(items: ServiceHealth[]): HealthStatus {
  if (items.length === 0) return 'operational';
  const worst = items
    .map(scoreService)
    .reduce((a, b) => (STATUS_RANK[a] >= STATUS_RANK[b] ? a : b));
  return worst;
}

export function unhealthy(items: ServiceHealth[]): ServiceHealth[] {
  return items.filter((s) => scoreService(s) !== 'operational');
}

// =========================================================================
// FOUNDER ANALYTICS (delta + growth helpers over analytics-v7 output)
// =========================================================================

export type Delta = { abs: number; pct: number; direction: 'up' | 'down' | 'flat' };

export function delta(current: number, previous: number): Delta {
  const abs = current - previous;
  const pct = previous === 0 ? (current === 0 ? 0 : 1) : abs / previous;
  const direction = abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
  return { abs, pct, direction };
}

export function stickiness(snap: AnalyticsSnapshot): number {
  return snap.mau === 0 ? 0 : snap.dau / snap.mau;
}

export function revenuePerActive(snap: AnalyticsSnapshot): number {
  return snap.mau === 0 ? 0 : Math.round(snap.revenueMinor / snap.mau);
}

/** Compare two snapshots and return prioritised deltas. */
export function compareSnapshots(
  cur: AnalyticsSnapshot,
  prev: AnalyticsSnapshot,
): { key: keyof AnalyticsSnapshot; delta: Delta }[] {
  const keys: (keyof AnalyticsSnapshot)[] = [
    'dau',
    'mau',
    'companies',
    'workspaces',
    'projects',
    'files',
    'aiTokens',
    'creditsUsedMinor',
    'activeSubscriptions',
    'revenueMinor',
    'creatorPublishes',
    'commSent',
  ];
  return keys
    .map((k) => ({ key: k, delta: delta(cur[k] as number, prev[k] as number) }))
    .sort((a, b) => Math.abs(b.delta.pct) - Math.abs(a.delta.pct));
}

// =========================================================================
// FOUNDER AI BRIEFING (Morning / Evening / Weekly / Monthly)
// =========================================================================

/** Generate briefing insights from analytics + health rollup. Pure. */
export function generateBrief(input: {
  kind: BriefKind;
  cur: AnalyticsSnapshot;
  prev: AnalyticsSnapshot;
  services: ServiceHealth[];
}): BriefInsight[] {
  const out: BriefInsight[] = [];
  const status = rollupPlatformStatus(input.services);
  if (status !== 'operational') {
    const bad = unhealthy(input.services);
    out.push({
      kind: 'risk',
      title: `Platform ${status}`,
      detail: `${bad.length} service(s) degraded: ${bad.map((b) => b.kind).join(', ')}`,
      weight: status === 'major-outage' ? 1 : 0.8,
    });
  }
  const cmp = compareSnapshots(input.cur, input.prev);
  for (const { key, delta: d } of cmp.slice(0, 5)) {
    if (Math.abs(d.pct) < 0.05) continue;
    const isRevenue = key === 'revenueMinor' || key === 'activeSubscriptions';
    const isBad = d.direction === 'down' && (isRevenue || key === 'dau' || key === 'mau');
    out.push({
      kind: isBad ? 'risk' : d.direction === 'up' ? 'opportunity' : 'trend',
      title: `${String(key)} ${d.direction} ${(d.pct * 100).toFixed(1)}%`,
      detail: `Changed by ${d.abs}`,
      weight: Math.min(1, Math.abs(d.pct)),
    });
  }
  const stick = stickiness(input.cur);
  if (stick > 0 && stick < 0.15) {
    out.push({
      kind: 'action',
      title: 'Low stickiness',
      detail: `DAU/MAU = ${(stick * 100).toFixed(1)}%. Investigate activation flows.`,
      weight: 0.7,
    });
  }
  if (input.kind === 'weekly' || input.kind === 'monthly') {
    out.push({
      kind: 'trend',
      title: `${input.kind} summary`,
      detail: `Revenue ${input.cur.revenueMinor} minor units across ${input.cur.mau} MAU.`,
      weight: 0.4,
    });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

// =========================================================================
// ARCHITECTURE HEALTH
// =========================================================================

export function architectureHealthScore(a: ArchitectureAudit): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  let score = 100;
  score -= Math.min(30, a.duplicates.length * 5);
  score -= Math.min(15, a.orphanModules.length * 2);
  score -= Math.min(15, a.missingDocs.length);
  score -= Math.min(10, a.registryDrift.length * 2);
  score -= Math.min(20, a.brokenTests * 2);
  if (!a.buildOk) score -= 30;
  score = Math.max(0, score);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  return { score, grade };
}

// =========================================================================
// FEATURE MANAGEMENT (reads feature_flags table via canonical API)
// =========================================================================

/** Deterministic hash 0..99 for percentage rollouts. */
export function bucketFor(userId: string, flagKey: string): number {
  let h = 5381;
  const s = `${userId}::${flagKey}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 100;
}

export function isFlagOn(
  flag: FeatureFlag,
  ctx: { userId: string; audience?: string },
): boolean {
  if (!flag.enabled) return false;
  if (flag.audiences && flag.audiences.length > 0) {
    if (!ctx.audience || !flag.audiences.includes(ctx.audience)) return false;
  }
  if (typeof flag.rolloutPct === 'number' && flag.rolloutPct < 100) {
    return bucketFor(ctx.userId, flag.key) < flag.rolloutPct;
  }
  return true;
}

/** Rollback logic: force disable + zero rollout while preserving definition. */
export function rollbackFlag(flag: FeatureFlag): FeatureFlag {
  return { ...flag, enabled: false, rolloutPct: 0 };
}

// =========================================================================
// PLATFORM OPERATIONS
// =========================================================================

export function nextPlatformMode(
  current: PlatformMode,
  event: 'incident' | 'maintenance-start' | 'maintenance-end' | 'emergency' | 'recover',
): PlatformMode {
  if (event === 'emergency') return 'emergency';
  if (event === 'recover') return 'normal';
  if (event === 'maintenance-start') return 'maintenance';
  if (event === 'maintenance-end') return current === 'maintenance' ? 'normal' : current;
  if (event === 'incident') return current === 'normal' ? 'read-only' : current;
  return current;
}

export function writesAllowed(mode: PlatformMode): boolean {
  return mode === 'normal';
}

// =========================================================================
// BRAIN INTEGRATION
// =========================================================================

export type FounderIntent =
  | 'dashboard.overview'
  | 'health.status'
  | 'analytics.today'
  | 'analytics.week'
  | 'analytics.month'
  | 'brief.morning'
  | 'brief.evening'
  | 'brief.weekly'
  | 'brief.monthly'
  | 'architecture.health'
  | 'features.review'
  | 'ops.incident'
  | 'ops.maintenance'
  | 'report.revenue'
  | 'report.growth'
  | 'report.ai-usage'
  | 'intelligence.opportunities'
  | 'intelligence.risks';

/** Route natural-language Founder queries into a dashboard intent. */
export function resolveForBrain(text: string): FounderIntent | null {
  const q = text.toLowerCase();
  if (/(morning brief)/.test(q)) return 'brief.morning';
  if (/(evening brief|end of day)/.test(q)) return 'brief.evening';
  if (/(weekly (brief|summary))/.test(q)) return 'brief.weekly';
  if (/(monthly (brief|summary))/.test(q)) return 'brief.monthly';
  if (/(health|status|uptime|slo)/.test(q)) return 'health.status';
  if (/(architecture|duplic|technical debt|module health)/.test(q)) return 'architecture.health';
  if (/(feature (flag|toggle)|beta|experiment|rollout|rollback)/.test(q)) return 'features.review';
  if (/(incident|outage)/.test(q)) return 'ops.incident';
  if (/(maintenance|read.?only)/.test(q)) return 'ops.maintenance';
  if (/(revenue report|mrr|arr)/.test(q)) return 'report.revenue';
  if (/(growth report|dau|mau|retention)/.test(q)) return 'report.growth';
  if (/(ai usage|token spend|model spend)/.test(q)) return 'report.ai-usage';
  if (/(opportunit|growth idea)/.test(q)) return 'intelligence.opportunities';
  if (/(risk|threat|churn)/.test(q)) return 'intelligence.risks';
  if (/(today|now).*(numbers|kpi|analytic)/.test(q) || /^kpis?$/.test(q)) return 'analytics.today';
  if (/(this week)/.test(q)) return 'analytics.week';
  if (/(this month)/.test(q)) return 'analytics.month';
  if (/(dashboard|overview|founder view)/.test(q)) return 'dashboard.overview';
  return null;
}

/** Bridge a Founder intent to an Enterprise intent when the query fits both. */
export function bridgeToEnterprise(intent: FounderIntent): EnterpriseIntent | null {
  switch (intent) {
    case 'health.status':
      return 'monitoring.status';
    case 'report.revenue':
      return 'analytics.enterprise';
    case 'ops.incident':
    case 'ops.maintenance':
      return 'security.review';
    case 'architecture.health':
      return 'compliance.report';
    default:
      return null;
  }
}

// =========================================================================
// DIGITAL HUMAN — FOUNDER MODES
// =========================================================================

export type DhFounderMode =
  | 'founder'
  | 'executive'
  | 'board-meeting'
  | 'presentation'
  | 'whiteboard'
  | 'strategic-review'
  | 'silent';

export function pickDhFounderMode(input: {
  intent?: FounderIntent | null;
  audience?: 'founder' | 'board' | 'exec' | 'team';
  briefing?: BriefKind;
  hasCritical?: boolean;
}): DhFounderMode {
  if (input.hasCritical) return 'strategic-review';
  if (input.audience === 'board') return 'board-meeting';
  if (input.audience === 'exec') return 'executive';
  if (input.intent === 'dashboard.overview') return 'founder';
  if (input.briefing === 'weekly' || input.briefing === 'monthly') return 'presentation';
  if (input.intent === 'architecture.health') return 'whiteboard';
  if (input.intent && input.intent.startsWith('brief.')) return 'presentation';
  return 'silent';
}

// =========================================================================
// FOUNDER REPORTS (PDF-ready payload shapes)
// =========================================================================

export type ReportPayload = {
  title: string;
  generatedAt: number;
  sections: { heading: string; rows: [string, string | number][] }[];
  ready: boolean;
};

export function buildRevenueReport(cur: AnalyticsSnapshot, prev: AnalyticsSnapshot): ReportPayload {
  const d = delta(cur.revenueMinor, prev.revenueMinor);
  return {
    title: 'Revenue Report',
    generatedAt: Date.now(),
    ready: true,
    sections: [
      {
        heading: 'Snapshot',
        rows: [
          ['Revenue (minor)', cur.revenueMinor],
          ['Subscriptions', cur.activeSubscriptions],
          ['Δ Revenue', `${(d.pct * 100).toFixed(1)}%`],
          ['Revenue / MAU', revenuePerActive(cur)],
        ],
      },
    ],
  };
}

export function buildGrowthReport(cur: AnalyticsSnapshot, prev: AnalyticsSnapshot): ReportPayload {
  const dDau = delta(cur.dau, prev.dau);
  const dMau = delta(cur.mau, prev.mau);
  return {
    title: 'Growth Report',
    generatedAt: Date.now(),
    ready: true,
    sections: [
      {
        heading: 'Activity',
        rows: [
          ['DAU', cur.dau],
          ['MAU', cur.mau],
          ['Δ DAU', `${(dDau.pct * 100).toFixed(1)}%`],
          ['Δ MAU', `${(dMau.pct * 100).toFixed(1)}%`],
          ['Stickiness', `${(stickiness(cur) * 100).toFixed(1)}%`],
        ],
      },
    ],
  };
}

// =========================================================================
// FOUNDER INTELLIGENCE (auto-identify opportunities / risks)
// =========================================================================

export type IntelligenceSignal = {
  kind:
    | 'growth-opportunity'
    | 'security-risk'
    | 'revenue-risk'
    | 'performance-issue'
    | 'unused-feature'
    | 'popular-feature'
    | 'customer-trend'
    | 'enterprise-trend';
  title: string;
  weight: number; // 0..1
};

export function detectIntelligence(input: {
  cur: AnalyticsSnapshot;
  prev: AnalyticsSnapshot;
  services: ServiceHealth[];
  featureUsage?: { key: string; users30d: number }[];
}): IntelligenceSignal[] {
  const signals: IntelligenceSignal[] = [];
  const cmp = compareSnapshots(input.cur, input.prev);

  for (const { key, delta: d } of cmp) {
    if (key === 'revenueMinor' && d.direction === 'down' && d.pct < -0.1) {
      signals.push({ kind: 'revenue-risk', title: `Revenue down ${(d.pct * 100).toFixed(1)}%`, weight: 0.9 });
    }
    if (key === 'dau' && d.direction === 'up' && d.pct > 0.2) {
      signals.push({ kind: 'growth-opportunity', title: `DAU surge +${(d.pct * 100).toFixed(1)}%`, weight: 0.8 });
    }
    if (key === 'aiTokens' && d.direction === 'up' && d.pct > 0.5) {
      signals.push({
        kind: 'enterprise-trend',
        title: `AI usage +${(d.pct * 100).toFixed(1)}%`,
        weight: 0.6,
      });
    }
  }

  for (const s of input.services) {
    if (scoreService(s) !== 'operational') {
      signals.push({
        kind: 'performance-issue',
        title: `${s.kind} degraded (p95 ${s.latencyP95Ms}ms, err ${(s.errorRate * 100).toFixed(1)}%)`,
        weight: 0.7,
      });
    }
  }

  for (const f of input.featureUsage ?? []) {
    if (f.users30d === 0) signals.push({ kind: 'unused-feature', title: `Unused: ${f.key}`, weight: 0.3 });
    else if (f.users30d > 1000) signals.push({ kind: 'popular-feature', title: `Popular: ${f.key}`, weight: 0.5 });
  }

  return signals.sort((a, b) => b.weight - a.weight);
}

// =========================================================================
// R139 — FOUNDER ALERTS (pure prioritiser over existing signals)
// =========================================================================

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type FounderAlert = {
  id: string;
  severity: AlertSeverity;
  source: 'health' | 'analytics' | 'architecture' | 'security' | 'revenue';
  title: string;
  detail: string;
  at: number;
};

export function buildFounderAlerts(input: {
  services: ServiceHealth[];
  cur: AnalyticsSnapshot;
  prev: AnalyticsSnapshot;
  architecture?: ArchitectureAudit;
}): FounderAlert[] {
  const now = Date.now();
  const out: FounderAlert[] = [];
  for (const s of input.services) {
    const st = scoreService(s);
    if (st === 'operational') continue;
    const sev: AlertSeverity =
      st === 'major-outage' ? 'critical' : st === 'partial-outage' ? 'high' : 'medium';
    out.push({
      id: `health:${s.kind}:${s.updatedAt}`,
      severity: sev,
      source: 'health',
      title: `${s.kind} ${st}`,
      detail: `p95 ${s.latencyP95Ms}ms · err ${(s.errorRate * 100).toFixed(1)}% · avail ${(s.availability * 100).toFixed(2)}%`,
      at: s.updatedAt || now,
    });
  }
  const cmp = compareSnapshots(input.cur, input.prev);
  for (const { key, delta: d } of cmp) {
    if (key === 'revenueMinor' && d.direction === 'down' && d.pct <= -0.1) {
      out.push({
        id: `analytics:revenue:${input.cur.at}`,
        severity: d.pct <= -0.3 ? 'critical' : 'high',
        source: 'revenue',
        title: `Revenue down ${(d.pct * 100).toFixed(1)}%`,
        detail: `${input.prev.revenueMinor} → ${input.cur.revenueMinor} (minor units)`,
        at: input.cur.at || now,
      });
    }
    if (key === 'dau' && d.direction === 'down' && d.pct <= -0.15) {
      out.push({
        id: `analytics:dau:${input.cur.at}`,
        severity: d.pct <= -0.3 ? 'high' : 'medium',
        source: 'analytics',
        title: `DAU down ${(d.pct * 100).toFixed(1)}%`,
        detail: `${input.prev.dau} → ${input.cur.dau}`,
        at: input.cur.at || now,
      });
    }
  }
  if (input.architecture) {
    const a = input.architecture;
    if (!a.buildOk) {
      out.push({ id: `arch:build:${now}`, severity: 'critical', source: 'architecture', title: 'Build failing', detail: 'CI build is red.', at: now });
    }
    if (a.brokenTests > 0) {
      out.push({
        id: `arch:tests:${now}`,
        severity: a.brokenTests > 10 ? 'high' : 'medium',
        source: 'architecture',
        title: `${a.brokenTests} broken tests`,
        detail: 'Test suite has failures.',
        at: now,
      });
    }
    if (a.duplicates.length > 0) {
      out.push({
        id: `arch:dup:${now}`,
        severity: a.duplicates.length > 5 ? 'high' : 'low',
        source: 'architecture',
        title: `${a.duplicates.length} duplicate runtime(s)`,
        detail: a.duplicates.slice(0, 3).map((d) => d.capability).join(', '),
        at: now,
      });
    }
  }
  const rank: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || b.at - a.at);
}

export function countAlertsBySeverity(alerts: FounderAlert[]): Record<AlertSeverity, number> {
  const out: Record<AlertSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of alerts) out[a.severity]++;
  return out;
}

