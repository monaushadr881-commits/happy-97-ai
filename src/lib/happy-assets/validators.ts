/**
 * R40 HAPPY Asset Pipeline — Validators.
 *
 * Every validator returns { status, missing[], report } where status is
 * READY / PARTIAL / BLOCKED. Missing items are always explicit — never
 * silently succeed.
 */

import {
  REQUIRED_BONES, FINGER_BONES, ARKIT52, REQUIRED_VISEMES,
  REQUIRED_ANIMATIONS, RUNTIME_REQUIREMENTS, RUNTIME_TARGETS,
  type ValidationStatus, type RuntimeTarget,
} from "./contracts";

export type ValidationResult = {
  status: ValidationStatus;
  missing: string[];
  report: Record<string, unknown>;
};

function statusFor(missingRequired: number, missingOptional: number): ValidationStatus {
  if (missingRequired > 0) return "BLOCKED";
  if (missingOptional > 0) return "PARTIAL";
  return "READY";
}

export function validateRig(rigMeta: {
  bones?: string[];
  humanoid?: boolean;
  animation_compatible?: boolean;
}): ValidationResult {
  const bones = new Set((rigMeta.bones ?? []).map((b) => b.trim()));
  const missingRequired = REQUIRED_BONES.filter((b) => !bones.has(b));
  const missingOptional = FINGER_BONES.filter((b) => !bones.has(b));
  const structural: string[] = [];
  if (!rigMeta.humanoid) structural.push("humanoid_mapping");
  if (rigMeta.animation_compatible === false) structural.push("animation_compatibility");
  const status = statusFor(missingRequired.length + structural.length, missingOptional.length);
  return {
    status,
    missing: [...missingRequired.map((b) => `bone:${b}`), ...structural, ...missingOptional.map((b) => `bone_optional:${b}`)],
    report: {
      required_total: REQUIRED_BONES.length,
      required_present: REQUIRED_BONES.length - missingRequired.length,
      finger_total: FINGER_BONES.length,
      finger_present: FINGER_BONES.length - missingOptional.length,
      humanoid: !!rigMeta.humanoid,
      animation_compatible: rigMeta.animation_compatible !== false,
    },
  };
}

export function validateSkeleton(skeletonMeta: { bone_count?: number; root?: string }): ValidationResult {
  const missing: string[] = [];
  if (!skeletonMeta.root) missing.push("skeleton_root");
  if (!skeletonMeta.bone_count || skeletonMeta.bone_count < REQUIRED_BONES.length) {
    missing.push(`bone_count_below_min:${REQUIRED_BONES.length}`);
  }
  return {
    status: missing.length ? "BLOCKED" : "READY",
    missing,
    report: { ...skeletonMeta, min_bone_count: REQUIRED_BONES.length },
  };
}

export function validateBlendshapes(profile: string, provided: string[]): ValidationResult {
  const set = new Set(provided.map((s) => s.trim()));
  if (profile === "arkit52") {
    const missingRequired = REQUIRED_VISEMES.filter((v) => !set.has(v));
    const missingOptional = ARKIT52.filter((v) => !REQUIRED_VISEMES.includes(v as never) && !set.has(v));
    return {
      status: statusFor(missingRequired.length, missingOptional.length),
      missing: [
        ...missingRequired.map((v) => `viseme_required:${v}`),
        ...missingOptional.map((v) => `arkit52_optional:${v}`),
      ],
      report: {
        profile,
        arkit52_total: ARKIT52.length,
        arkit52_present: ARKIT52.length - missingOptional.length - missingRequired.length,
        required_visemes_present: REQUIRED_VISEMES.length - missingRequired.length,
      },
    };
  }
  // equivalent / custom: require the viseme subset only
  const missingRequired = REQUIRED_VISEMES.filter((v) => !set.has(v));
  return {
    status: missingRequired.length ? "BLOCKED" : "READY",
    missing: missingRequired.map((v) => `viseme_required:${v}`),
    report: { profile, provided_count: set.size },
  };
}

export function validateAnimations(clips: string[]): ValidationResult {
  const set = new Set(clips.map((c) => c.trim()));
  const missingRequired = REQUIRED_ANIMATIONS.filter((c) => !set.has(c));
  return {
    status: missingRequired.length ? "BLOCKED" : "READY",
    missing: missingRequired.map((c) => `animation:${c}`),
    report: {
      required_total: REQUIRED_ANIMATIONS.length,
      required_present: REQUIRED_ANIMATIONS.length - missingRequired.length,
      provided_total: set.size,
    },
  };
}

export type ManifestAssetLite = { role: string; slot: string | null; required: boolean };

/**
 * Compatibility matrix: for each runtime target, list the required asset
 * roles that are missing from the manifest. Target is READY only when ALL
 * required roles are present.
 */
export function computeCompatibility(manifestAssets: ManifestAssetLite[]): {
  status: ValidationStatus;
  targets: Record<RuntimeTarget, { status: ValidationStatus; missing_roles: string[] }>;
  missing: string[];
} {
  const rolesPresent = new Set(manifestAssets.map((a) => a.role));
  const targets: Record<string, { status: ValidationStatus; missing_roles: string[] }> = {};
  let anyReady = false;
  let allReady = true;
  const overallMissing: string[] = [];
  for (const t of RUNTIME_TARGETS) {
    const req = RUNTIME_REQUIREMENTS[t];
    const missingRoles = req.filter((r) => !rolesPresent.has(r));
    const status: ValidationStatus = missingRoles.length === 0 ? "READY" : "BLOCKED";
    targets[t] = { status, missing_roles: missingRoles };
    if (status === "READY") anyReady = true;
    else {
      allReady = false;
      overallMissing.push(...missingRoles.map((r) => `${t}:${r}`));
    }
  }
  const status: ValidationStatus = allReady ? "READY" : anyReady ? "PARTIAL" : "BLOCKED";
  return { status, targets: targets as never, missing: overallMissing };
}

/**
 * Overall manifest status: aggregate of rig + blendshape + animation +
 * compatibility. BLOCKED if any is BLOCKED; PARTIAL if any is PARTIAL;
 * READY only when all four are READY.
 */
export function rollupStatus(parts: ValidationStatus[]): ValidationStatus {
  if (parts.some((s) => s === "BLOCKED")) return "BLOCKED";
  if (parts.some((s) => s === "PARTIAL")) return "PARTIAL";
  return "READY";
}
