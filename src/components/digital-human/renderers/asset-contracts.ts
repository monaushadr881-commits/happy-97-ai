/**
 * Asset contracts + runtime validators for the Digital Human renderers.
 *
 * The validators are pure: they never fetch, throw, or crash. Each
 * returns a `ValidationResult` shaped:
 *   { runtime, status: "ready" | "blocked_asset_required", missing: string[] }
 *
 * Detection is done via a supplied `AssetManifest` — a snapshot of which
 * files are currently present under `src/assets/digital-human/`. In the
 * real app the manifest is built at boot time from the Vite glob (see
 * `runtime-detect.ts`); tests can hand-craft a manifest directly.
 */
import type { RuntimeId } from "./index";

/**
 * A manifest of which asset paths are present. Keys are project-relative
 * paths (e.g. `src/assets/digital-human/live2d/model.moc3`), values are
 * `true` when the file exists. Missing keys are treated as "not present".
 */
export type AssetManifest = Record<string, boolean>;

export type ValidationResult = {
  runtime: RuntimeId;
  status: "ready" | "blocked_asset_required";
  missing: string[];
  /** Non-fatal warnings (e.g. missing optional expression preset). */
  warnings: string[];
};

const PORTRAIT_REQUIRED = ["public/happy-portrait-v2.png"];

const LAYERED_REQUIRED = [
  "src/assets/digital-human/layered/base.png",
];
const LAYERED_OPTIONAL = [
  "src/assets/digital-human/layered/mouth-closed.png",
  "src/assets/digital-human/layered/mouth-a.png",
  "src/assets/digital-human/layered/mouth-e.png",
  "src/assets/digital-human/layered/mouth-o.png",
  "src/assets/digital-human/layered/mouth-u.png",
  "src/assets/digital-human/layered/eyes-open.png",
  "src/assets/digital-human/layered/eyes-closed.png",
];

const LIVE2D_REQUIRED = [
  "src/assets/digital-human/live2d/model.model3.json",
  "src/assets/digital-human/live2d/model.moc3",
  "src/assets/digital-human/live2d/textures/texture_00.png",
  "src/assets/digital-human/live2d/physics3.json",
];
const LIVE2D_OPTIONAL = [
  "src/assets/digital-human/live2d/pose3.json",
  "src/assets/digital-human/live2d/expressions/neutral.exp3.json",
  "src/assets/digital-human/live2d/motions/idle.motion3.json",
  "src/assets/digital-human/live2d/motions/greeting.motion3.json",
  "src/assets/digital-human/live2d/motions/talking.motion3.json",
];

const LIVE3D_REQUIRED = [
  "src/assets/digital-human/live3d/avatar.glb",
];
const LIVE3D_OPTIONAL = [
  "src/assets/digital-human/live3d/animations/idle.glb",
  "src/assets/digital-human/live3d/animations/greeting.glb",
  "src/assets/digital-human/live3d/animations/talking.glb",
  "src/assets/digital-human/live3d/animations/thinking.glb",
  "src/assets/digital-human/live3d/environment/studio.hdr",
  "src/assets/digital-human/live3d/environment/boardroom.hdr",
];

export const ASSET_CONTRACTS = {
  portrait: { required: PORTRAIT_REQUIRED, optional: [] as string[] },
  "layered-portrait": { required: LAYERED_REQUIRED, optional: LAYERED_OPTIONAL },
  live2d: { required: LIVE2D_REQUIRED, optional: LIVE2D_OPTIONAL },
  live3d: { required: LIVE3D_REQUIRED, optional: LIVE3D_OPTIONAL },
} as const satisfies Record<RuntimeId, { required: readonly string[]; optional: readonly string[] }>;

function has(manifest: AssetManifest, path: string): boolean {
  return manifest[path] === true;
}

/** Validate one runtime against a manifest. Never throws. */
export function validateRuntime(id: RuntimeId, manifest: AssetManifest): ValidationResult {
  const contract = ASSET_CONTRACTS[id];
  const missing = contract.required.filter((p) => !has(manifest, p));
  const warnings = contract.optional.filter((p) => !has(manifest, p));
  return {
    runtime: id,
    status: missing.length === 0 ? "ready" : "blocked_asset_required",
    missing,
    warnings,
  };
}

/** Validate every runtime. Handy for boot-time diagnostics + STATUS pages. */
export function validateAll(manifest: AssetManifest): Record<RuntimeId, ValidationResult> {
  return {
    portrait: validateRuntime("portrait", manifest),
    "layered-portrait": validateRuntime("layered-portrait", manifest),
    live2d: validateRuntime("live2d", manifest),
    live3d: validateRuntime("live3d", manifest),
  };
}
