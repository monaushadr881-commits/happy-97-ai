/**
 * Runtime detection — picks the best available Digital Human runtime
 * based on which real assets are present in the project at build time.
 *
 * We use Vite's `import.meta.glob({ eager: false, query: '?url' })` to
 * enumerate every file under `src/assets/digital-human/`. Only files that
 * physically exist show up. The result is compared against
 * `ASSET_CONTRACTS`.
 *
 * Order of preference (best → worst):
 *   1. live3d
 *   2. live2d
 *   3. layered-portrait
 *   4. portrait  (always available — the shipped `/happy-portrait-v2.png`)
 *
 * `portrait` is treated as the guaranteed fallback: it does not depend on
 * anything under `src/assets/digital-human/` and its "required" entry
 * points at `public/happy-portrait-v2.png` which ships with the repo.
 */
import type { RuntimeId } from "./index";
import {
  ASSET_CONTRACTS,
  validateAll,
  validateRuntime,
  type AssetManifest,
  type ValidationResult,
} from "./asset-contracts";

// Vite build-time glob. `as: 'raw'` keeps the payload zero-cost — we only
// need the *keys* (filenames) to know which files exist.
// The `/**/*` pattern captures every file under the digital-human tree.
const _dhModules = import.meta.glob("/src/assets/digital-human/**/*", {
  query: "?url",
  import: "default",
  eager: false,
});

// Portrait is always considered present — it's the built-in fallback.
const PORTRAIT_ALWAYS: AssetManifest = {
  "public/happy-portrait-v2.png": true,
};

function buildManifest(): AssetManifest {
  const m: AssetManifest = { ...PORTRAIT_ALWAYS };
  for (const key of Object.keys(_dhModules)) {
    // Glob keys are absolute-from-project ("/src/..."). Normalise to the
    // "src/..." form that `ASSET_CONTRACTS` uses.
    const normalized = key.replace(/^\//, "");
    m[normalized] = true;
  }
  return m;
}

let _cached: AssetManifest | null = null;
export function currentManifest(): AssetManifest {
  if (!_cached) _cached = buildManifest();
  return _cached;
}

/** For tests. */
export function _resetManifestCache() { _cached = null; }

const PREFERENCE: RuntimeId[] = ["live3d", "live2d", "layered-portrait", "portrait"];

export type Detection = {
  chosen: RuntimeId;
  results: Record<RuntimeId, ValidationResult>;
};

export function detectRuntime(manifest: AssetManifest = currentManifest()): Detection {
  const results = validateAll(manifest);
  const chosen = PREFERENCE.find((id) => results[id].status === "ready") ?? "portrait";
  return { chosen, results };
}

/** Convenience — validate a single runtime against the current manifest. */
export function checkRuntime(id: RuntimeId): ValidationResult {
  return validateRuntime(id, currentManifest());
}

/** For UI badges — human-friendly asset checklist for one runtime. */
export function assetChecklist(id: RuntimeId): { path: string; present: boolean; required: boolean }[] {
  const manifest = currentManifest();
  const contract = ASSET_CONTRACTS[id];
  return [
    ...contract.required.map((p) => ({ path: p, present: manifest[p] === true, required: true })),
    ...contract.optional.map((p) => ({ path: p, present: manifest[p] === true, required: false })),
  ];
}
