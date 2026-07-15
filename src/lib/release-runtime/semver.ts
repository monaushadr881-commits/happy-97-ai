/**
 * R63 — Semantic Version Runtime.
 * Pure functions. No I/O.
 */
import type { SemanticVersion } from "./contracts";

const RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

export function parseSemver(input: string): SemanticVersion {
  const m = RE.exec(input.trim());
  if (!m) throw new Error(`Invalid semantic version: ${input}`);
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4],
    build: m[5],
  };
}

export function formatSemver(v: SemanticVersion): string {
  let s = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease) s += `-${v.prerelease}`;
  if (v.build) s += `+${v.build}`;
  return s;
}

export type BumpKind = "major" | "minor" | "patch" | "hotfix" | "rc";

export function bumpSemver(current: string, kind: BumpKind): string {
  const v = parseSemver(current);
  switch (kind) {
    case "major": return formatSemver({ major: v.major + 1, minor: 0, patch: 0 });
    case "minor": return formatSemver({ major: v.major, minor: v.minor + 1, patch: 0 });
    case "patch":
    case "hotfix": return formatSemver({ major: v.major, minor: v.minor, patch: v.patch + 1 });
    case "rc": {
      const pre = v.prerelease ?? "rc.0";
      const m = /^rc\.(\d+)$/.exec(pre);
      const next = m ? `rc.${Number(m[1]) + 1}` : "rc.1";
      return formatSemver({ major: v.major, minor: v.minor, patch: v.patch, prerelease: next });
    }
  }
}

export function compareSemver(a: string, b: string): number {
  const av = parseSemver(a); const bv = parseSemver(b);
  if (av.major !== bv.major) return av.major - bv.major;
  if (av.minor !== bv.minor) return av.minor - bv.minor;
  if (av.patch !== bv.patch) return av.patch - bv.patch;
  // stable > any prerelease
  if (!av.prerelease && bv.prerelease) return 1;
  if (av.prerelease && !bv.prerelease) return -1;
  if (av.prerelease && bv.prerelease) return av.prerelease.localeCompare(bv.prerelease);
  return 0;
}
