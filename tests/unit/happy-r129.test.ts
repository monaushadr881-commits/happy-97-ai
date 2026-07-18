import { describe, it, expect } from 'vitest';
import {
  ancestorsOf,
  detectCycles,
  canNest,
  roleAllows,
  meetsMinRole,
  evaluatePolicy,
  chainAuditEvent,
  verifyAuditChain,
  classifyAuditSeverity,
  complianceScore,
  retentionDecision,
  monitorAlert,
  sloAvailability,
  seatUtilization,
  storageStatus,
  aiCostForecast,
  prioritizeFindings,
  resolveForBrain,
  pickDhEnterpriseMode,
  type EntityNode,
  type PolicyRule,
} from '@/lib/happy-r129/enterprise-intelligence';

const nodes: EntityNode[] = [
  { id: 'o', kind: 'org', name: 'Org' },
  { id: 'c', kind: 'company', name: 'Co', parentId: 'o' },
  { id: 'b', kind: 'branch', name: 'HQ', parentId: 'c' },
  { id: 'd', kind: 'department', name: 'Eng', parentId: 'b' },
];

describe('R129 hierarchy', () => {
  it('resolves ancestors root→node', () => {
    expect(ancestorsOf(nodes, 'd').map((n) => n.id)).toEqual(['o', 'c', 'b', 'd']);
  });
  it('detects cycles', () => {
    const bad: EntityNode[] = [
      { id: 'a', kind: 'org', name: 'A', parentId: 'b' },
      { id: 'b', kind: 'org', name: 'B', parentId: 'a' },
    ];
    expect(detectCycles(bad).length).toBeGreaterThan(0);
  });
  it('enforces nesting rules', () => {
    expect(canNest('org', 'company')).toBe(true);
    expect(canNest('department', 'branch')).toBe(false);
  });
});

describe('R129 RBAC + policy', () => {
  it('role matrix works', () => {
    expect(roleAllows('admin', 'rbac.manage')).toBe(true);
    expect(roleAllows('member', 'rbac.manage')).toBe(false);
    expect(meetsMinRole('manager', 'operator')).toBe(true);
  });
  it('deny wins over allow', () => {
    const rules: PolicyRule[] = [
      { id: 'r1', effect: 'allow', capability: 'audit.read' },
      { id: 'r2', effect: 'deny', capability: 'audit.read' },
    ];
    const res = evaluatePolicy(rules, { role: 'admin', capability: 'audit.read' });
    expect(res.allow).toBe(false);
    expect(res.matchedRuleId).toBe('r2');
  });
  it('falls back to RBAC when no rules match', () => {
    expect(evaluatePolicy([], { role: 'admin', capability: 'audit.read' }).allow).toBe(true);
    expect(evaluatePolicy([], { role: 'member', capability: 'audit.read' }).allow).toBe(false);
  });
  it('respects MFA + hours conditions', () => {
    const rules: PolicyRule[] = [
      {
        id: 'ok',
        effect: 'allow',
        capability: 'security.manage',
        condition: { mfaRequired: true, hoursUtc: [9, 17] },
      },
    ];
    const noMfa = evaluatePolicy(rules, {
      role: 'admin',
      capability: 'security.manage',
      request: { mfa: false, hourUtc: 10 },
    });
    expect(noMfa.reason).toBe('rbac');
    const good = evaluatePolicy(rules, {
      role: 'admin',
      capability: 'security.manage',
      request: { mfa: true, hourUtc: 10 },
    });
    expect(good.allow).toBe(true);
  });
});

describe('R129 audit chain', () => {
  it('chains and verifies events', async () => {
    const e1 = await chainAuditEvent(undefined, {
      id: '1',
      actorId: 'u',
      action: 'role.revoke',
      at: 1,
      severity: classifyAuditSeverity('role.revoke'),
    });
    const e2 = await chainAuditEvent(e1.hash, {
      id: '2',
      actorId: 'u',
      action: 'read.user',
      at: 2,
      severity: classifyAuditSeverity('read.user'),
    });
    expect(await verifyAuditChain([e1, e2])).toBe(-1);
    const tampered = { ...e2, action: 'user.delete.admin' };
    expect(await verifyAuditChain([e1, tampered])).toBe(1);
  });
});

describe('R129 compliance + monitoring + analytics', () => {
  it('scores compliance ignoring N/A', () => {
    const r = complianceScore([
      { standard: 'SOC2', control: 'CC1', status: 'pass' },
      { standard: 'SOC2', control: 'CC2', status: 'fail' },
      { standard: 'SOC2', control: 'CC3', status: 'na' },
    ]);
    expect(r.score).toBe(50);
    expect(r.failing).toHaveLength(1);
  });
  it('retention purges old records', () => {
    expect(retentionDecision(0, 30, 40 * 86_400_000)).toBe('purge');
    expect(retentionDecision(Date.now(), 30)).toBe('keep');
  });
  it('monitor alert grading', () => {
    expect(monitorAlert({ kind: 'latency', value: 200, threshold: 100, window: '5m' })).toBe('page');
    expect(monitorAlert({ kind: 'error', value: 100, threshold: 100, window: '5m' })).toBe('warn');
    expect(monitorAlert({ kind: 'availability', value: 0.999, threshold: 0.999, window: '1h' })).toBe('ok');
  });
  it('SLO availability', () => {
    expect(sloAvailability([true, true, false, true])).toBeCloseTo(0.75);
  });
  it('seat + storage + AI cost', () => {
    expect(seatUtilization({ plan: 'pro', purchased: 10, used: 11 }).status).toBe('over');
    expect(storageStatus({ bytes: 96, quota: 100 })).toBe('critical');
    expect(aiCostForecast([100, 200, 300], 10)).toBe(2000);
  });
});

describe('R129 security + brain + DH', () => {
  it('prioritizes findings', () => {
    const sorted = prioritizeFindings([
      { id: 'a', severity: 'low', category: 'auth', title: 'x' },
      { id: 'b', severity: 'critical', category: 'data', title: 'y' },
    ]);
    expect(sorted[0].id).toBe('b');
  });
  it('resolves brain intent', () => {
    expect(resolveForBrain('who deleted the user yesterday?')).toBe('audit.investigate');
    expect(resolveForBrain('SOC2 status')).toBe('compliance.report');
    expect(resolveForBrain('show me the org tree')).toBe('org.tree');
    expect(resolveForBrain('random unrelated')).toBeNull();
  });
  it('picks DH enterprise mode', () => {
    expect(pickDhEnterpriseMode({ severity: 'critical' })).toBe('security-officer');
    expect(pickDhEnterpriseMode({ intent: 'audit.investigate' })).toBe('auditor');
    expect(pickDhEnterpriseMode({ audience: 'founder' })).toBe('executive-briefing');
    expect(pickDhEnterpriseMode({})).toBe('silent');
  });
});
