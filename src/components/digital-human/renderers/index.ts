/**
 * Digital Human renderer registry.
 *
 * HAPPY supports multiple avatar runtimes. Only the ones with real
 * assets in the repo are actually mountable — everything else is an
 * honest `BLOCKED_ASSET_REQUIRED` stub that throws when selected, so we
 * never silently fall through to a fake implementation.
 *
 * Runtimes:
 *   - `portrait`         → the shipped HAPPY portrait + layered overlays.
 *                          Uses `HappyAvatar`. Working.
 *   - `layered-portrait` → alias for `portrait`. Working.
 *   - `live2d`           → BLOCKED. Requires a Cubism SDK licence and a
 *                          `.model3.json` + `.moc3` + textures + physics
 *                          asset bundle. No such asset ships with the
 *                          project. Selecting this runtime throws.
 *   - `live3d`           → BLOCKED. Requires a rigged GLB with the 52
 *                          ARKit blendshapes and matching skeleton /
 *                          hand rig. No such asset ships with the
 *                          project. Selecting this runtime throws.
 */

export type RuntimeId = "portrait" | "layered-portrait" | "live2d" | "live3d" | "vrm";

export type RuntimeCapability = {
  id: RuntimeId;
  label: string;
  status: "ready" | "blocked_asset_required";
  requires?: string[];
};

export const RUNTIME_CATALOG: Record<RuntimeId, RuntimeCapability> = {
  portrait: { id: "portrait", label: "Portrait", status: "ready" },
  "layered-portrait": { id: "layered-portrait", label: "Layered Portrait", status: "ready" },
  live2d: {
    id: "live2d",
    label: "Live2D (Cubism)",
    status: "blocked_asset_required",
    requires: [
      "Live2D Cubism SDK licence",
      "public/happy-live2d/model.model3.json",
      "public/happy-live2d/model.moc3",
      "public/happy-live2d/textures/*.png",
      "public/happy-live2d/physics3.json",
      "public/happy-live2d/expressions/*.exp3.json",
      "public/happy-live2d/motions/*.motion3.json",
    ],
  },
  live3d: {
    id: "live3d",
    label: "Live3D (glTF / WebGPU)",
    status: "blocked_asset_required",
    requires: [
      "public/happy-live3d/happy.glb (rigged mesh)",
      "ARKit 52 blendshapes on the head mesh",
      "Skeleton with named humanoid bones",
      "public/happy-live3d/animations/*.glb (idle, gesture, greet)",
      "Hand rig with finger bones",
      "Lighting IBL: public/happy-live3d/env.hdr",
    ],
  },
  vrm: {
    id: "vrm",
    label: "VRM (three-vrm)",
    status: "blocked_asset_required",
    requires: [
      "npm: three, @react-three/fiber, @react-three/drei, @pixiv/three-vrm",
      "src/assets/digital-human/vrm/happy.vrm (Founder-selected VRM avatar, licensed)",
      "VRM 1.0 humanoid bone map + expression presets (happy, sad, angry, surprised, aa/ih/ou/ee/oh)",
      "Optional: src/assets/digital-human/vrm/animations/*.vrma (idle, walk, wave, sit, presentation, thinking)",
      "Optional: src/assets/digital-human/vrm/environment/*.hdr (lighting IBL)",
    ],
  },
};

export function selectRuntime(preferred: RuntimeId = "portrait"): RuntimeCapability {
  const cap = RUNTIME_CATALOG[preferred];
  if (cap.status === "blocked_asset_required") {
    throw new Error(
      `[HAPPY] Runtime "${cap.label}" is BLOCKED_ASSET_REQUIRED. ` +
      `Ship the following before selecting it:\n  - ${cap.requires?.join("\n  - ")}\n` +
      `Falling back to the portrait runtime is the caller's responsibility.`,
    );
  }
  return cap;
}

/** Cheap capability probe without throwing — for UI badges and diagnostics. */
export function runtimeStatus(id: RuntimeId): "ready" | "blocked_asset_required" {
  return RUNTIME_CATALOG[id].status;
}
