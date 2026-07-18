import { describe, it, expect } from 'vitest';
import {
  scoreService,
  rollupPlatformStatus,
  unhealthy,
  delta,
  stickiness,
  revenuePerActive,
  compareSnapshots,
  generateBrief,
  architectureHealthScore,
  bucketFor,
  isFlagOn,
  rollbackFlag,
  nextPlatformMode,
  writesAllowed,
  resolveForBrain,
  bridgeToEnterprise,
  pickDhFounderMode,
  buildRevenueReport,
  buildGrowthReport,
  detectIntelligence,
  type ServiceHealth,
  type AnalyticsSnapshot,
} from '@/lib/happy-r130/founder-dashboard';

const svcOk: ServiceHealth = {
  kind: 'brain',
  availability: 0.9999,
  errorRate: 0.001,
  latencyP95Ms: 400,
  updatedAt: 0,
};
const svcBad: ServiceHealth = {
  kind: 'revenue',
  availability: 0.9,
  errorRate: 0.2,
  latencyP95Ms: 5000,
  updatedAt: 0,
};

const prev: AnalyticsSnapshot = {
  dau: 100, mau: 1000, companies: 10, workspaces: 20, projects: 50, files: 500,
  aiTokens: 10000, creditsUsedMinor: 1000, activeSubscriptions: 40,
  revenueMinor: 10000, creatorPublishes: 5, commSent: 200, at: 0,
};
const cur: AnalyticsSnapshot = {
  ...prev, dau: 150, mau: 1200, revenueMinor: 8000, aiTokens: 20000,
};

describe('R130 platform health', () => {
  it('scores services', () => {
    expect(scoreService(svcOk)).toBe('operational');
    expect(scoreService(svcBad)).toBe('major-outage');
  });
  it('rolls up worst status', () => {
    expect(rollupPlatformStatus([svcOk, svcBad])).toBe('major-outage');
    expect(rollupPlatformStatus([svcOk])).toBe('operational');
    expect(rollupPlatformStatus([])).toBe('operational');
  });
  it('lists unhealthy', () => {
    expect(unhealthy([svcOk, svcBad]).map((s) => s.kind)).toEqual(['revenue']);
  });
});

describe('R130 founder analytics', () => {
  it('delta + stickiness', () => {
    expect(delta(120, 100).direction).toBe('up');
    expect(delta(0, 0).pct).toBe(0);
    expect(delta(5, 0).pct).toBe(1);
    expect(stickiness(cur)).toBeCloseTo(0.125);
    expect(revenuePerActive(cur)).toBe(Math.round(8000 / 1200));
  });
  it('compareSnapshots sorted by |pct|', () => {
    const rows = compareSnapshots(cur, prev);
    expect(rows[0].delta.pct >= rows[rows.length - 1].delta.pct).toBe(true);
  });
});

describe('R130 briefing', () => {
  it('flags outages + revenue drops', () => {
    const brief = generateBrief({ kind: 'morning', cur, prev, services: [svcOk, svcBad] });
    expect(brief[0].kind).toBe('risk');
    expect(brief.some((b) => b.title.toLowerCase().includes('platform'))).toBe(true);
    expect(brief.some((b) => b.title.includes('revenueMinor'))).toBe(true);
  });
});

describe('R130 architecture health', () => {
  it('grades', () => {
    expect(
      architectureHealthScore({
        duplicates: [], orphanModules: [], missingDocs: [], registryDrift: [],
        brokenTests: 0, buildOk: true,
      }).grade,
    ).toBe('A');
    expect(
      architectureHealthScore({
        duplicates: [{ capability: 'x', files: ['a', 'b'] }], orphanModules: [],
        missingDocs: [], registryDrift: [], brokenTests: 0, buildOk: false,
      }).grade,
    ).toBe('C');
  });
});

describe('R130 feature flags', () => {
  it('bucket is deterministic', () => {
    expect(bucketFor('u1', 'flag')).toBe(bucketFor('u1', 'flag'));
  });
  it('respects audiences + rollout', () => {
    const f = { key: 'x', channel: 'beta' as const, enabled: true, rolloutPct: 100, audiences: ['founder'] };
    expect(isFlagOn(f, { userId: 'u1', audience: 'founder' })).toBe(true);
    expect(isFlagOn(f, { userId: 'u1', audience: 'member' })).toBe(false);
    expect(isFlagOn({ ...f, enabled: false }, { userId: 'u1', audience: 'founder' })).toBe(false);
  });
  it('rollback disables flag', () => {
    const r = rollbackFlag({ key: 'x', channel: 'stable', enabled: true, rolloutPct: 100 });
    expect(r.enabled).toBe(false);
    expect(r.rolloutPct).toBe(0);
  });
});

describe('R130 platform ops', () => {
  it('mode transitions', () => {
    expect(nextPlatformMode('normal', 'maintenance-start')).toBe('maintenance');
    expect(nextPlatformMode('maintenance', 'maintenance-end')).toBe('normal');
    expect(nextPlatformMode('normal', 'emergency')).toBe('emergency');
    expect(nextPlatformMode('normal', 'incident')).toBe('read-only');
    expect(writesAllowed('normal')).toBe(true);
    expect(writesAllowed('read-only')).toBe(false);
  });
});

describe('R130 brain + DH + reports + intelligence', () => {
  it('resolves brain intent', () => {
    expect(resolveForBrain('morning brief please')).toBe('brief.morning');
    expect(resolveForBrain('platform health status')).toBe('health.status');
    expect(resolveForBrain('rollback the beta flag')).toBe('features.review');
    expect(resolveForBrain('random')).toBeNull();
  });
  it('bridges to enterprise', () => {
    expect(bridgeToEnterprise('health.status')).toBe('monitoring.status');
    expect(bridgeToEnterprise('dashboard.overview')).toBeNull();
  });
  it('picks DH founder mode', () => {
    expect(pickDhFounderMode({ hasCritical: true })).toBe('strategic-review');
    expect(pickDhFounderMode({ audience: 'board' })).toBe('board-meeting');
    expect(pickDhFounderMode({ briefing: 'weekly' })).toBe('presentation');
    expect(pickDhFounderMode({ intent: 'dashboard.overview' })).toBe('founder');
    expect(pickDhFounderMode({})).toBe('silent');
  });
  it('builds reports', () => {
    expect(buildRevenueReport(cur, prev).ready).toBe(true);
    expect(buildGrowthReport(cur, prev).sections[0].rows.length).toBeGreaterThan(0);
  });
  it('detects intelligence signals', () => {
    const s = detectIntelligence({
      cur, prev, services: [svcBad],
      featureUsage: [{ key: 'foo', users30d: 0 }, { key: 'bar', users30d: 5000 }],
    });
    expect(s.some((x) => x.kind === 'revenue-risk')).toBe(true);
    expect(s.some((x) => x.kind === 'performance-issue')).toBe(true);
    expect(s.some((x) => x.kind === 'unused-feature')).toBe(true);
    expect(s.some((x) => x.kind === 'popular-feature')).toBe(true);
  });
});
