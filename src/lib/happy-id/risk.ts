/**
 * R114.3 — Pure risk engine + session-policy resolver.
 * Extends HAPPY ID (canonical owner: src/lib/happy-id.functions.ts).
 * NO duplicate runtime — pure helpers consumed by server fns + tests.
 */

export interface RiskInput {
  newDevice?: boolean;
  newCountry?: boolean;
  impossibleTravel?: boolean;
  failedLoginsLast24h?: number;
  anonymousProxy?: boolean;
  vpn?: boolean;
  tor?: boolean;
  offHours?: boolean;
  deviceTrusted?: boolean;
  userHistoryDays?: number; // account age in days
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskReport {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

/**
 * Expanded risk score covering: New Device, New Country, Impossible Travel,
 * Repeated Failures, Anonymous Proxy, VPN, Tor, Time Pattern, Device Trust,
 * User History. Returns 0-100 + level classification.
 */
export function computeRiskScore(input: RiskInput = {}): RiskReport {
  let s = 0;
  const reasons: string[] = [];

  if (input.impossibleTravel) { s += 45; reasons.push("impossible_travel"); }
  if (input.tor) { s += 30; reasons.push("tor_exit_node"); }
  if (input.anonymousProxy) { s += 20; reasons.push("anonymous_proxy"); }
  if (input.newDevice) { s += 20; reasons.push("new_device"); }
  if (input.newCountry) { s += 18; reasons.push("new_country"); }
  if (input.vpn) { s += 8; reasons.push("vpn_detected"); }
  if (input.offHours) { s += 5; reasons.push("off_hours"); }

  const fails = input.failedLoginsLast24h ?? 0;
  if (fails > 0) {
    const add = Math.min(25, fails * 5);
    s += add;
    reasons.push(`failed_logins_${fails}`);
  }

  // Trust reduces score
  if (input.deviceTrusted) { s -= 15; reasons.push("trusted_device"); }

  // New accounts (< 3 days) are slightly riskier
  const days = input.userHistoryDays ?? 0;
  if (days > 0 && days < 3) { s += 8; reasons.push("new_account"); }
  else if (days >= 30) { s -= 5; reasons.push("established_account"); }

  const score = Math.max(0, Math.min(100, s));
  const level: RiskLevel =
    score >= 80 ? "critical"
    : score >= 55 ? "high"
    : score >= 25 ? "medium"
    : "low";
  return { score, level, reasons };
}

export interface PolicyRow {
  scope_type: "platform" | "company" | "workspace" | "user";
  scope_id: string | null;
  max_active_sessions?: number | null;
  require_trusted_device?: boolean | null;
  idle_timeout_minutes?: number | null;
  absolute_timeout_hours?: number | null;
  require_mfa?: boolean | null;
  allowed_providers?: string[] | null;
  enterprise_configurable?: boolean | null;
}

/**
 * Resolve effective session policy using priority:
 *   user > workspace > company > platform
 * A more-specific scope OVERRIDES coarser scopes field-by-field.
 */
export function resolveSessionPolicy(rows: PolicyRow[], ctx: {
  userId?: string; workspaceId?: string | null; companyId?: string | null;
}): PolicyRow {
  const platform = rows.find(r => r.scope_type === "platform");
  const company = ctx.companyId ? rows.find(r => r.scope_type === "company" && r.scope_id === ctx.companyId) : undefined;
  const workspace = ctx.workspaceId ? rows.find(r => r.scope_type === "workspace" && r.scope_id === ctx.workspaceId) : undefined;
  const user = ctx.userId ? rows.find(r => r.scope_type === "user" && r.scope_id === ctx.userId) : undefined;

  const merged: PolicyRow = {
    scope_type: "platform", scope_id: null,
    max_active_sessions: 1,
    require_trusted_device: false,
    idle_timeout_minutes: 43200,
    absolute_timeout_hours: 720,
    require_mfa: false,
    allowed_providers: ["email", "google", "apple", "magic_link"],
    enterprise_configurable: true,
  };

  for (const row of [platform, company, workspace, user]) {
    if (!row) continue;
    for (const k of Object.keys(row) as (keyof PolicyRow)[]) {
      if (k === "scope_type" || k === "scope_id") continue;
      const v = row[k];
      if (v !== null && v !== undefined) (merged as Record<string, unknown>)[k] = v;
    }
    merged.scope_type = row.scope_type;
    merged.scope_id = row.scope_id;
  }
  return merged;
}
