/**
 * R152 — Unified Asset Registry (architecture-only).
 *
 * Single index of every avatar / animation / voice / environment / camera /
 * presentation / whiteboard asset the canonical Digital Human runtime can
 * consume. Extend, never fork. Locks: R91 · R111 · R151.
 */

export type AssetKind =
  | "vrm"
  | "metahuman"
  | "live2d"
  | "animation"
  | "expression"
  | "voice_pack"
  | "environment_pack"
  | "camera_preset"
  | "bmw_entry"
  | "presentation"
  | "whiteboard";

export interface AssetRecord {
  id: string;
  kind: AssetKind;
  name: string;
  owner: string;           // canonical owner path
  status: "active" | "architecture_ready" | "pending";
  externalDeps?: string[];
  meta?: Record<string, unknown>;
}

const ASSETS = new Map<string, AssetRecord>();

export function registerAsset(a: AssetRecord): void {
  if (ASSETS.has(a.id)) {
    const prev = ASSETS.get(a.id)!;
    if (prev.owner !== a.owner) {
      throw new Error(`asset_registry: duplicate id "${a.id}" with different owner — extend, don't fork.`);
    }
  }
  ASSETS.set(a.id, a);
}
export function listAssets(kind?: AssetKind): AssetRecord[] {
  const all = [...ASSETS.values()];
  return kind ? all.filter((a) => a.kind === kind) : all;
}
export function getAsset(id: string): AssetRecord | undefined { return ASSETS.get(id); }

// --- Seed catalogue (mirrors existing asset directories) ---
const seed: AssetRecord[] = [
  { id: "vrm.happy.primary", kind: "vrm", name: "HAPPY VRM (Primary)",
    owner: "src/assets/digital-human/vrm/happy.vrm.asset.json", status: "active" },
  { id: "metahuman.happy", kind: "metahuman", name: "HAPPY MetaHuman",
    owner: "src/assets/digital-human/character/", status: "architecture_ready",
    externalDeps: ["METAHUMAN_STREAM_URL"] },
  { id: "live2d.happy", kind: "live2d", name: "HAPPY Live2D",
    owner: "src/assets/digital-human/live2d/", status: "architecture_ready",
    externalDeps: ["LIVE2D_MODEL_URL"] },
  { id: "anim.catalogue.r143", kind: "animation", name: "R143 Animation Catalogue (20 clips)",
    owner: "src/lib/happy-r143/dh-production.ts", status: "active" },
  { id: "expr.catalogue", kind: "expression", name: "Expression Tokens",
    owner: "src/assets/digital-human/expressions/", status: "active" },
  { id: "voice.pack.default", kind: "voice_pack", name: "Default Voice Pack (8 voices)",
    owner: "src/assets/digital-human/voices/", status: "active" },
  { id: "env.pack.r143", kind: "environment_pack", name: "R143 Environment Presets (7)",
    owner: "src/lib/happy-r143/dh-production.ts", status: "active" },
  { id: "camera.presets.r143", kind: "camera_preset", name: "R143 Camera Modes (5)",
    owner: "src/lib/happy-r143/dh-production.ts", status: "active" },
  { id: "bmw.entry.r143", kind: "bmw_entry", name: "BMW M5 Entry Sequence (6400ms)",
    owner: "src/lib/happy-r143/dh-production.ts", status: "active" },
  { id: "presentation.engine", kind: "presentation", name: "Presentation Engine",
    owner: "src/routes/_authenticated/digital-human.presentation.tsx", status: "active" },
  { id: "whiteboard.engine", kind: "whiteboard", name: "Whiteboard Engine",
    owner: "src/components/digital-human/Whiteboard.tsx", status: "active" },
];
seed.forEach(registerAsset);
