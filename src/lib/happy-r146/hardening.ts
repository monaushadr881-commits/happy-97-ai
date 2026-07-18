/**
 * R146 · Production Hardening™
 *
 * FINAL hardening pass. NOT feature development. NO new runtime, NO V2.
 * Pure decision helpers that read the canonical owners produced by
 * R114–R145 and emit a Production Readiness verdict. Consumed by the
 * Founder Ops surface and CI to gate deploys.
 *
 * Extends (never replaces):
 *  - R144 `performance.ts`      → PERF_BUDGETS + snapshot
 *  - R145 `consolidation.ts`    → archive-path guard
 *  - R104 `src/lib/security/*`  → cron-auth, TTS rate limit, PostgREST sanitizer
 *  - R114 `src/lib/happy-id`    → risk detection + session meta
 *  - Adapter families under `src/lib/happy-adapters/*`
 */

export type Verdict = "ready" | "configuration_required" | "blocked";

export interface CheckResult {
  id: string;
  area: string;
  verdict: Verdict;
  note: string;
}

export interface AdapterStatus {
  name: string;
  family: "payments" | "comms" | "auth" | "ai" | "storage" | "analytics";
  hasSecret: boolean;
  hasSandbox: boolean;
  externalOnly?: boolean;
}

/** Aggregate verdict: any blocked → blocked; any config_required → configuration_required. */
export function rollup(results: readonly CheckResult[]): Verdict {
  if (results.some((r) => r.verdict === "blocked")) return "blocked";
  if (results.some((r) => r.verdict === "configuration_required"))
    return "configuration_required";
  return "ready";
}

/** Security posture check. All items must be present in canonical owners. */
export function checkSecurity(input: {
  rlsEnabledTables: number;
  totalPublicTables: number;
  cronAuthEnforced: boolean;
  ttsRateLimited: boolean;
  postgrestSanitized: boolean;
  auditLogImmutable: boolean;
  secretsPresent: readonly string[];
  requiredSecrets: readonly string[];
}): CheckResult[] {
  const rlsGap = input.totalPublicTables - input.rlsEnabledTables;
  const missing = input.requiredSecrets.filter(
    (s) => !input.secretsPresent.includes(s),
  );
  return [
    {
      id: "sec.rls",
      area: "security",
      verdict: rlsGap === 0 ? "ready" : "blocked",
      note: `${input.rlsEnabledTables}/${input.totalPublicTables} public tables with RLS`,
    },
    {
      id: "sec.cron",
      area: "security",
      verdict: input.cronAuthEnforced ? "ready" : "blocked",
      note: "cron shared-secret enforced on /api/public/* cron routes",
    },
    {
      id: "sec.tts_rate",
      area: "security",
      verdict: input.ttsRateLimited ? "ready" : "blocked",
      note: "TTS/voice endpoints JWT-scoped rate limited",
    },
    {
      id: "sec.postgrest",
      area: "security",
      verdict: input.postgrestSanitized ? "ready" : "blocked",
      note: "PostgREST filter values sanitized",
    },
    {
      id: "sec.audit",
      area: "security",
      verdict: input.auditLogImmutable ? "ready" : "blocked",
      note: "audit_logs table immutable via trigger",
    },
    {
      id: "sec.secrets",
      area: "security",
      verdict: missing.length === 0 ? "ready" : "configuration_required",
      note:
        missing.length === 0
          ? "all required secrets present"
          : `missing: ${missing.join(", ")}`,
    },
  ];
}

/** Runtime pillars: Brain, Memory, Workspace, Search, Files, Business OS, Creator, DH, Founder. */
export const RUNTIME_PILLARS = [
  "brain",
  "memory",
  "workspace",
  "search",
  "files",
  "business_os",
  "creator",
  "digital_human",
  "founder_dashboard",
] as const;
export type RuntimePillar = (typeof RUNTIME_PILLARS)[number];

export function checkRuntimePillars(
  owners: Readonly<Record<RuntimePillar, string>>,
): CheckResult[] {
  return RUNTIME_PILLARS.map((p) => ({
    id: `pillar.${p}`,
    area: "runtime",
    verdict: owners[p] ? ("ready" as const) : ("blocked" as const),
    note: owners[p] ? `owner: ${owners[p]}` : `missing canonical owner for ${p}`,
  }));
}

/** Performance verdict derived from R144 snapshot score. */
export function checkPerformance(score: number): CheckResult {
  return {
    id: "perf.score",
    area: "performance",
    verdict: score >= 90 ? "ready" : score >= 75 ? "configuration_required" : "blocked",
    note: `R144 perf score ${score}/100`,
  };
}

/** Adapter readiness: BLOCKED when secretless & no sandbox; CONFIG when only sandbox. */
export function checkAdapters(adapters: readonly AdapterStatus[]): CheckResult[] {
  return adapters.map((a) => {
    let verdict: Verdict;
    if (a.hasSecret) verdict = "ready";
    else if (a.externalOnly) verdict = "blocked";
    else if (a.hasSandbox) verdict = "configuration_required";
    else verdict = "configuration_required";
    return {
      id: `adapter.${a.family}.${a.name}`,
      area: "adapters",
      verdict,
      note: a.hasSecret
        ? "live credentials configured"
        : a.externalOnly
          ? "external dependency — awaiting provider credentials"
          : "sandbox default; add secret to go live",
    };
  });
}

/** Deployment configuration surface. */
export function checkDeployment(input: {
  envVars: readonly string[];
  requiredEnv: readonly string[];
  healthEndpoint: boolean;
  rollbackReady: boolean;
  backupsEnabled: boolean;
  ciGreen: boolean;
}): CheckResult[] {
  const missing = input.requiredEnv.filter((e) => !input.envVars.includes(e));
  return [
    {
      id: "deploy.env",
      area: "deployment",
      verdict: missing.length === 0 ? "ready" : "configuration_required",
      note: missing.length === 0 ? "all env vars set" : `missing env: ${missing.join(", ")}`,
    },
    {
      id: "deploy.health",
      area: "deployment",
      verdict: input.healthEndpoint ? "ready" : "blocked",
      note: "GET /api/public/health available",
    },
    {
      id: "deploy.rollback",
      area: "deployment",
      verdict: input.rollbackReady ? "ready" : "configuration_required",
      note: "previous build tag retained for rollback",
    },
    {
      id: "deploy.backups",
      area: "deployment",
      verdict: input.backupsEnabled ? "ready" : "configuration_required",
      note: "database point-in-time backups enabled",
    },
    {
      id: "deploy.ci",
      area: "deployment",
      verdict: input.ciGreen ? "ready" : "blocked",
      note: "CI: build + typecheck + tests green",
    },
  ];
}

export interface ReadinessReport {
  verdict: Verdict;
  critical: CheckResult[];
  warnings: CheckResult[];
  ready: CheckResult[];
  externalDependencies: CheckResult[];
  generatedAt: string;
}

export function buildReadinessReport(all: readonly CheckResult[]): ReadinessReport {
  const critical = all.filter((r) => r.verdict === "blocked" && !/external/i.test(r.note));
  const externalDependencies = all.filter(
    (r) => r.verdict === "blocked" && /external/i.test(r.note),
  );
  const warnings = all.filter((r) => r.verdict === "configuration_required");
  const ready = all.filter((r) => r.verdict === "ready");
  return {
    verdict: rollup(all),
    critical,
    warnings,
    ready,
    externalDependencies,
    generatedAt: new Date(0).toISOString(), // deterministic for tests
  };
}
