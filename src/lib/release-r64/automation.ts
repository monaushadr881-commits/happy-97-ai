/** R64 — automation checks + release readiness scoring. Pure functions. */
import type { CheckStatus, ArtifactKind } from "./contracts";

export interface CheckResult {
  kind: string;
  status: CheckStatus;
  detail?: string;
  hint?: string;
}

export interface ReleaseInput {
  version?: string | null;
  channel?: string | null;
  release_notes?: string | null;
  artifacts?: Array<{ kind: ArtifactKind; sha256?: string | null; storage_url?: string | null; validation_status?: string }>;
  signing_profile_present?: boolean;
  stores_targeted?: string[];
  store_readiness?: Array<{ store: string; ready: boolean; missing_secrets?: string[] }>;
  dependency_audit?: { high?: number; critical?: number } | null;
  security_scan?: { high?: number; critical?: number } | null;
  prior_version?: string | null;
}

const SEMVER = /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/;

export function runAllChecks(r: ReleaseInput): CheckResult[] {
  const out: CheckResult[] = [];
  // Pre-build validation
  out.push({
    kind: "semver",
    status: r.version && SEMVER.test(r.version) ? "pass" : "fail",
    detail: r.version ?? "(missing)",
  });
  out.push({
    kind: "channel_present",
    status: r.channel ? "pass" : "fail",
  });
  out.push({
    kind: "release_notes",
    status: (r.release_notes?.trim().length ?? 0) >= 20 ? "pass" : "warn",
    hint: "Release notes should be ≥20 chars.",
  });
  // Artifact validation
  const arts = r.artifacts ?? [];
  out.push({
    kind: "artifacts_present",
    status: arts.length > 0 ? "pass" : "warn",
    detail: `${arts.length} artifact(s)`,
  });
  const invalid = arts.filter((a) => a.validation_status === "invalid").length;
  out.push({
    kind: "artifact_validation",
    status: invalid === 0 ? "pass" : "fail",
    detail: invalid > 0 ? `${invalid} invalid artifact(s)` : "all valid",
  });
  const missingSha = arts.filter((a) => !a.sha256).length;
  out.push({
    kind: "artifact_checksums",
    status: missingSha === 0 ? "pass" : "warn",
    detail: missingSha > 0 ? `${missingSha} missing sha256` : "all checksummed",
  });
  // Signing validation
  out.push({
    kind: "signing_profile",
    status: r.signing_profile_present ? "pass" : "warn",
    hint: "A signing profile is required for native store submissions.",
  });
  // Store validation
  const targeted = r.stores_targeted ?? [];
  if (targeted.length) {
    const readiness = r.store_readiness ?? [];
    const blocked = readiness.filter((s) => !s.ready);
    out.push({
      kind: "store_readiness",
      status: blocked.length === 0 ? "pass" : "blocked",
      detail: blocked.length ? blocked.map((b) => `${b.store}: ${(b.missing_secrets ?? []).join(",") || "adapter not enabled"}`).join("; ") : "all targeted stores ready",
    });
  }
  // Dependency + security
  const dep = r.dependency_audit ?? {};
  out.push({
    kind: "dependency_audit",
    status: (dep.critical ?? 0) > 0 ? "fail" : (dep.high ?? 0) > 0 ? "warn" : "pass",
    detail: `high=${dep.high ?? 0} critical=${dep.critical ?? 0}`,
  });
  const sec = r.security_scan ?? {};
  out.push({
    kind: "security_scan",
    status: (sec.critical ?? 0) > 0 ? "fail" : (sec.high ?? 0) > 0 ? "warn" : "pass",
    detail: `high=${sec.high ?? 0} critical=${sec.critical ?? 0}`,
  });
  // Version compare
  if (r.prior_version && r.version) {
    out.push({
      kind: "version_monotonic",
      status: compareSemverLite(r.version, r.prior_version) > 0 ? "pass" : "fail",
      detail: `${r.prior_version} → ${r.version}`,
    });
  }
  return out;
}

export function readinessScore(checks: CheckResult[]): { score: number; total: number; grade: "A" | "B" | "C" | "D" | "F" } {
  const total = checks.length;
  let score = 0;
  for (const c of checks) {
    score += c.status === "pass" ? 1 : c.status === "warn" ? 0.6 : 0;
  }
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);
  const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
  return { score: pct, total, grade };
}

export function generateReleaseNotes(input: { version: string; changes: string[]; channel?: string }): string {
  const lines = [
    `# Release ${input.version}${input.channel ? ` (${input.channel})` : ""}`,
    "",
    "## Changes",
    ...input.changes.map((c) => `- ${c.trim()}`),
    "",
    `Generated ${new Date().toISOString()}`,
  ];
  return lines.join("\n");
}

export function generateChangelog(entries: Array<{ version: string; date: string; changes: string[] }>): string {
  return entries.map((e) => `## ${e.version} — ${e.date}\n${e.changes.map((c) => `- ${c}`).join("\n")}`).join("\n\n");
}

export function rollbackRecommendation(m: { crash_free_rate?: number | null; anr_rate?: number | null; rating_avg?: number | null }): { recommend: boolean; reason: string } {
  if ((m.crash_free_rate ?? 1) < 0.985) return { recommend: true, reason: "crash-free rate below 98.5%" };
  if ((m.anr_rate ?? 0) > 0.005) return { recommend: true, reason: "ANR rate above 0.5%" };
  if ((m.rating_avg ?? 5) < 3.5) return { recommend: true, reason: "avg rating below 3.5" };
  return { recommend: false, reason: "metrics within thresholds" };
}

function compareSemverLite(a: string, b: string): number {
  const pa = a.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}
