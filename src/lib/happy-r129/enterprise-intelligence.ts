/**
 * R129 — HAPPY Enterprise Control Center™ Intelligence
 *
 * Pure extension layer (no runtime duplication). Canonical owners are reused:
 *  - Organizations / Workspaces → src/lib/workspace-v16.functions.ts, organization-v15
 *  - Users / Roles / Permissions → src/lib/roles-v2, permissions-v2, auth-v2
 *  - Audit Logs → src/lib/security/*, audit tables (audit_logs)
 *  - Compliance → src/lib/compliance-v5
 *  - Monitoring → src/lib/monitoring-v4
 *  - Enterprise runtime → src/lib/enterprise-v1, enterprise-intelligence-v2
 *  - Security → src/lib/security-v2, webhook-security
 *  - Brain → src/lib/brain/engine
 *  - Memory → src/lib/memory
 *  - Revenue → src/lib/happy-r128/revenue-intelligence
 *
 * This module ONLY adds pure decision helpers used by canonical runtimes and
 * the Digital Human. No DB writes here; no parallel admin surface.
 */

// =========================================================================
// TYPES
// =========================================================================

export type EntityKind =
  | 'org'
  | 'company'
  | 'workspace'
  | 'branch'
  | 'department'
  | 'team';

export type EntityNode = {
  id: string;
  kind: EntityKind;
  name: string;
  parentId?: string | null;
  status?: 'active' | 'suspended' | 'archived';
};

export type Role =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'operator'
  | 'auditor'
  | 'member'
  | 'guest';

export type EnterpriseCapability =
  | 'org.manage'
  | 'org.read'
  | 'rbac.manage'
  | 'policy.manage'
  | 'audit.read'
  | 'audit.export'
  | 'compliance.manage'
  | 'monitoring.read'
  | 'analytics.read'
  | 'security.manage'
  | 'license.manage'
  | 'storage.manage'
  | 'ai.manage';

export type PolicyEffect = 'allow' | 'deny';

export type PolicyRule = {
  id: string;
  effect: PolicyEffect;
  capability: EnterpriseCapability | '*';
  resourceKind?: EntityKind | '*';
  resourceId?: string | '*';
  condition?: {
    ipCidr?: string[];
    hoursUtc?: [number, number]; // inclusive-exclusive window
    mfaRequired?: boolean;
    minRole?: Role;
  };
};

export type AccessContext = {
  role: Role;
  capability: EnterpriseCapability;
  resource?: { kind: EntityKind; id: string; path: string[] };
  request?: { ipInCidrs?: boolean; hourUtc?: number; mfa?: boolean };
};

export type AuditEvent = {
  id: string;
  actorId: string;
  action: string;
  resourceKind?: EntityKind;
  resourceId?: string;
  at: number; // epoch ms
  severity: 'info' | 'notice' | 'warning' | 'critical';
  ip?: string;
  hash?: string; // chain hash for tamper detection
};

export type ComplianceStandard =
  | 'SOC2'
  | 'ISO27001'
  | 'GDPR'
  | 'HIPAA'
  | 'PCI-DSS'
  | 'DPDP-IN';

export type ComplianceCheck = {
  standard: ComplianceStandard;
  control: string;
  status: 'pass' | 'fail' | 'na' | 'attention';
  evidenceRef?: string;
};

export type MonitorSignal = {
  kind: 'latency' | 'error' | 'saturation' | 'availability';
  value: number;
  threshold: number;
  window: '1m' | '5m' | '15m' | '1h';
};

export type LicenseSeat = {
  plan: string;
  purchased: number;
  used: number;
};

export type StorageUsage = { bytes: number; quota: number };

// =========================================================================
// ORGANIZATION HIERARCHY
// =========================================================================

/** Build ordered ancestor path for an entity (root → node). */
export function ancestorsOf(nodes: EntityNode[], id: string): EntityNode[] {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const chain: EntityNode[] = [];
  let cur = map.get(id);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return chain;
}

/** Detect illegal parent cycles in the hierarchy. */
export function detectCycles(nodes: EntityNode[]): string[] {
  const bad: string[] = [];
  for (const n of nodes) {
    const seen = new Set<string>();
    let cur: EntityNode | undefined = n;
    const map = new Map(nodes.map((x) => [x.id, x]));
    while (cur?.parentId) {
      if (seen.has(cur.parentId)) {
        bad.push(n.id);
        break;
      }
      seen.add(cur.parentId);
      cur = map.get(cur.parentId);
    }
  }
  return bad;
}

/** Valid kinds a parent may adopt. Prevents e.g. branch under department. */
const ALLOWED_CHILD: Record<EntityKind, EntityKind[]> = {
  org: ['company', 'workspace'],
  company: ['branch', 'workspace', 'department'],
  workspace: ['team', 'department'],
  branch: ['department', 'team'],
  department: ['team'],
  team: [],
};

export function canNest(parent: EntityKind, child: EntityKind): boolean {
  return ALLOWED_CHILD[parent]?.includes(child) ?? false;
}

// =========================================================================
// ADVANCED RBAC (extends roles-v2, permissions-v2)
// =========================================================================

const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  member: 1,
  auditor: 2,
  operator: 3,
  manager: 4,
  admin: 5,
  owner: 6,
};

/** Base capability matrix (role → allowed capabilities). */
export const RBAC_MATRIX: Record<Role, EnterpriseCapability[]> = {
  guest: [],
  member: ['org.read', 'monitoring.read'],
  auditor: ['org.read', 'audit.read', 'audit.export', 'compliance.manage', 'monitoring.read', 'analytics.read'],
  operator: ['org.read', 'monitoring.read', 'analytics.read', 'storage.manage'],
  manager: [
    'org.read',
    'monitoring.read',
    'analytics.read',
    'policy.manage',
    'license.manage',
    'storage.manage',
    'ai.manage',
  ],
  admin: [
    'org.manage',
    'org.read',
    'rbac.manage',
    'policy.manage',
    'audit.read',
    'audit.export',
    'compliance.manage',
    'monitoring.read',
    'analytics.read',
    'security.manage',
    'license.manage',
    'storage.manage',
    'ai.manage',
  ],
  owner: [
    'org.manage',
    'org.read',
    'rbac.manage',
    'policy.manage',
    'audit.read',
    'audit.export',
    'compliance.manage',
    'monitoring.read',
    'analytics.read',
    'security.manage',
    'license.manage',
    'storage.manage',
    'ai.manage',
  ],
};

export function roleAllows(role: Role, cap: EnterpriseCapability): boolean {
  return RBAC_MATRIX[role]?.includes(cap) ?? false;
}

export function meetsMinRole(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

// =========================================================================
// POLICY ENGINE
// =========================================================================

function policyMatches(rule: PolicyRule, ctx: AccessContext): boolean {
  if (rule.capability !== '*' && rule.capability !== ctx.capability) return false;
  if (rule.resourceKind && rule.resourceKind !== '*') {
    if (!ctx.resource || rule.resourceKind !== ctx.resource.kind) return false;
  }
  if (rule.resourceId && rule.resourceId !== '*') {
    if (!ctx.resource) return false;
    if (rule.resourceId !== ctx.resource.id && !ctx.resource.path.includes(rule.resourceId)) return false;
  }
  const c = rule.condition;
  if (c) {
    if (c.minRole && !meetsMinRole(ctx.role, c.minRole)) return false;
    if (c.mfaRequired && !ctx.request?.mfa) return false;
    if (c.ipCidr && !ctx.request?.ipInCidrs) return false;
    if (c.hoursUtc && typeof ctx.request?.hourUtc === 'number') {
      const [start, end] = c.hoursUtc;
      const h = ctx.request.hourUtc;
      const inWindow = start <= end ? h >= start && h < end : h >= start || h < end;
      if (!inWindow) return false;
    }
  }
  return true;
}

/**
 * Deny-wins policy evaluation with RBAC baseline.
 *  1. Explicit deny → deny
 *  2. Explicit allow → allow
 *  3. Fallback to RBAC matrix
 */
export function evaluatePolicy(
  rules: PolicyRule[],
  ctx: AccessContext,
): { allow: boolean; reason: string; matchedRuleId?: string } {
  const matches = rules.filter((r) => policyMatches(r, ctx));
  const deny = matches.find((m) => m.effect === 'deny');
  if (deny) return { allow: false, reason: `deny:${deny.id}`, matchedRuleId: deny.id };
  const allow = matches.find((m) => m.effect === 'allow');
  if (allow) return { allow: true, reason: `allow:${allow.id}`, matchedRuleId: allow.id };
  return roleAllows(ctx.role, ctx.capability)
    ? { allow: true, reason: 'rbac' }
    : { allow: false, reason: 'rbac-missing' };
}

// =========================================================================
// AUDIT CENTER
// =========================================================================

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Chain an audit event onto the previous hash for tamper-evidence. */
export async function chainAuditEvent(
  prevHash: string | undefined,
  ev: Omit<AuditEvent, 'hash'>,
): Promise<AuditEvent> {
  const payload = JSON.stringify({ prev: prevHash ?? '', ...ev });
  const hash = await sha256Hex(payload);
  return { ...ev, hash };
}

/** Validate an ordered audit chain; returns first broken index or -1. */
export async function verifyAuditChain(events: AuditEvent[]): Promise<number> {
  let prev: string | undefined;
  for (let i = 0; i < events.length; i++) {
    const { hash, ...rest } = events[i];
    const expected = await sha256Hex(JSON.stringify({ prev: prev ?? '', ...rest }));
    if (expected !== hash) return i;
    prev = hash;
  }
  return -1;
}

export function classifyAuditSeverity(action: string): AuditEvent['severity'] {
  const critical = ['user.delete', 'role.revoke', 'policy.delete', 'key.rotate', 'org.delete'];
  const warning = ['user.suspend', 'policy.update', 'permission.grant', 'billing.change'];
  if (critical.some((a) => action.startsWith(a))) return 'critical';
  if (warning.some((a) => action.startsWith(a))) return 'warning';
  if (action.startsWith('read.')) return 'info';
  return 'notice';
}

// =========================================================================
// COMPLIANCE CENTER
// =========================================================================

export function complianceScore(checks: ComplianceCheck[]): {
  score: number;
  failing: ComplianceCheck[];
} {
  const applicable = checks.filter((c) => c.status !== 'na');
  if (applicable.length === 0) return { score: 100, failing: [] };
  const passing = applicable.filter((c) => c.status === 'pass').length;
  const failing = applicable.filter((c) => c.status === 'fail' || c.status === 'attention');
  return { score: Math.round((passing / applicable.length) * 100), failing };
}

/** Data-retention decision (used by memory & audit purges). */
export function retentionDecision(
  createdAt: number,
  policyDays: number,
  now = Date.now(),
): 'keep' | 'purge' {
  return now - createdAt > policyDays * 86_400_000 ? 'purge' : 'keep';
}

// =========================================================================
// MONITORING
// =========================================================================

export function monitorAlert(sig: MonitorSignal): 'ok' | 'warn' | 'page' {
  if (sig.kind === 'availability') {
    if (sig.value < sig.threshold * 0.98) return 'page';
    if (sig.value < sig.threshold) return 'warn';
    return 'ok';
  }
  const ratio = sig.value / sig.threshold;
  if (ratio >= 1.5) return 'page';
  if (ratio >= 1.0) return 'warn';
  return 'ok';
}

/** Rolling SLO calc over a boolean series (true = healthy). */
export function sloAvailability(samples: boolean[]): number {
  if (samples.length === 0) return 1;
  const ok = samples.filter(Boolean).length;
  return ok / samples.length;
}

// =========================================================================
// ENTERPRISE ANALYTICS (extends existing analytics-v7)
// =========================================================================

export function seatUtilization(seat: LicenseSeat): {
  pct: number;
  status: 'ok' | 'warn' | 'over';
} {
  if (seat.purchased <= 0) return { pct: 0, status: 'ok' };
  const pct = seat.used / seat.purchased;
  const status = pct > 1 ? 'over' : pct > 0.85 ? 'warn' : 'ok';
  return { pct, status };
}

export function storageStatus(u: StorageUsage): 'ok' | 'warn' | 'critical' {
  if (u.quota <= 0) return 'ok';
  const r = u.bytes / u.quota;
  if (r >= 0.95) return 'critical';
  if (r >= 0.8) return 'warn';
  return 'ok';
}

export function aiCostForecast(dailyCostsMinor: number[], daysAhead: number): number {
  if (dailyCostsMinor.length === 0) return 0;
  const avg = dailyCostsMinor.reduce((a, b) => a + b, 0) / dailyCostsMinor.length;
  return Math.round(avg * daysAhead);
}

// =========================================================================
// SECURITY CENTER
// =========================================================================

export type SecurityFinding = {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'network' | 'data' | 'config' | 'supply-chain';
  title: string;
};

export function prioritizeFindings(findings: SecurityFinding[]): SecurityFinding[] {
  const order: Record<SecurityFinding['severity'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return [...findings].sort((a, b) => order[a.severity] - order[b.severity]);
}

// =========================================================================
// BRAIN INTEGRATION
// =========================================================================

export type EnterpriseIntent =
  | 'org.overview'
  | 'org.tree'
  | 'user.manage'
  | 'role.manage'
  | 'policy.review'
  | 'audit.investigate'
  | 'compliance.report'
  | 'monitoring.status'
  | 'analytics.enterprise'
  | 'security.review'
  | 'license.review'
  | 'storage.review'
  | 'ai.usage';

/** Map a natural-language query to an enterprise intent for Brain routing. */
export function resolveForBrain(text: string): EnterpriseIntent | null {
  const q = text.toLowerCase();
  if (/(audit|log|trail|who (did|deleted|changed|revoked|granted)|when did)/.test(q)) return 'audit.investigate';
  if (/(compliance|soc2|iso|gdpr|hipaa|pci|dpdp)/.test(q)) return 'compliance.report';
  if (/(policy|policies|rule|allow|deny)/.test(q)) return 'policy.review';
  if (/(role|permission|rbac|grant|revoke)/.test(q)) return 'role.manage';
  if (/(monitor|uptime|latency|slo|health)/.test(q)) return 'monitoring.status';
  if (/(license|seat|plan)/.test(q)) return 'license.review';
  if (/(storage|quota|disk)/.test(q)) return 'storage.review';
  if (/(ai (usage|cost)|token|model spend)/.test(q)) return 'ai.usage';
  if (/(security|breach|risk|mfa)/.test(q)) return 'security.review';
  if (/(analytics|report|dashboard|kpi)/.test(q)) return 'analytics.enterprise';
  if (/(org chart|tree|hierarchy|branch|department)/.test(q)) return 'org.tree';
  if (/(user|member|invite|suspend)/.test(q)) return 'user.manage';
  if (/(organization|company|workspace|overview)/.test(q)) return 'org.overview';
  return null;
}

// =========================================================================
// DIGITAL HUMAN — ENTERPRISE MODE
// =========================================================================

export type DhEnterpriseMode =
  | 'executive-briefing'
  | 'auditor'
  | 'security-officer'
  | 'operations'
  | 'advisor'
  | 'silent';

export function pickDhEnterpriseMode(input: {
  intent?: EnterpriseIntent | null;
  severity?: 'info' | 'warning' | 'critical';
  audience?: 'founder' | 'admin' | 'auditor' | 'member';
}): DhEnterpriseMode {
  if (input.severity === 'critical') return 'security-officer';
  if (input.audience === 'auditor' || input.intent === 'audit.investigate') return 'auditor';
  if (input.intent === 'security.review') return 'security-officer';
  if (input.intent === 'monitoring.status') return 'operations';
  if (input.audience === 'founder') return 'executive-briefing';
  if (input.intent === 'analytics.enterprise' || input.intent === 'org.overview') return 'advisor';
  return 'silent';
}
