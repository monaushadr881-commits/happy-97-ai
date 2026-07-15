/**
 * R40 HAPPY Asset Pipeline — Contracts.
 *
 * The single source of truth for what a "real" HAPPY character must have.
 * These lists are enforced by the validators. Never fake support: if a
 * required item is missing, validation returns BLOCKED with the exact list.
 */

/**
 * Required humanoid skeleton bones. A rig missing any of these is BLOCKED.
 * Additional bones (fingers, twist bones, etc.) are allowed but optional.
 */
export const REQUIRED_BONES = [
  "root", "hips", "spine", "spine1", "spine2", "chest",
  "neck", "head", "jaw",
  "leftEye", "rightEye",
  "leftShoulder", "leftArm", "leftForeArm", "leftHand",
  "rightShoulder", "rightArm", "rightForeArm", "rightHand",
  "leftUpLeg", "leftLeg", "leftFoot", "leftToeBase",
  "rightUpLeg", "rightLeg", "rightFoot", "rightToeBase",
] as const;

/** Finger bones: not strictly required for READY, but tracked. Missing → PARTIAL. */
export const FINGER_BONES = [
  "leftHandThumb1","leftHandIndex1","leftHandMiddle1","leftHandRing1","leftHandPinky1",
  "rightHandThumb1","rightHandIndex1","rightHandMiddle1","rightHandRing1","rightHandPinky1",
] as const;

/** ARKit 52 blendshapes. This is the canonical facial contract. */
export const ARKIT52 = [
  "eyeBlinkLeft","eyeLookDownLeft","eyeLookInLeft","eyeLookOutLeft","eyeLookUpLeft",
  "eyeSquintLeft","eyeWideLeft",
  "eyeBlinkRight","eyeLookDownRight","eyeLookInRight","eyeLookOutRight","eyeLookUpRight",
  "eyeSquintRight","eyeWideRight",
  "jawForward","jawLeft","jawRight","jawOpen",
  "mouthClose","mouthFunnel","mouthPucker","mouthLeft","mouthRight",
  "mouthSmileLeft","mouthSmileRight","mouthFrownLeft","mouthFrownRight",
  "mouthDimpleLeft","mouthDimpleRight","mouthStretchLeft","mouthStretchRight",
  "mouthRollLower","mouthRollUpper","mouthShrugLower","mouthShrugUpper",
  "mouthPressLeft","mouthPressRight","mouthLowerDownLeft","mouthLowerDownRight",
  "mouthUpperUpLeft","mouthUpperUpRight",
  "browDownLeft","browDownRight","browInnerUp","browOuterUpLeft","browOuterUpRight",
  "cheekPuff","cheekSquintLeft","cheekSquintRight",
  "noseSneerLeft","noseSneerRight",
  "tongueOut",
] as const;

/** Viseme subset that must be present for lip-sync (subset of ARKit52-ish). */
export const REQUIRED_VISEMES = [
  "jawOpen","mouthClose","mouthFunnel","mouthPucker",
  "mouthSmileLeft","mouthSmileRight",
  "mouthPressLeft","mouthPressRight",
  "tongueOut",
] as const;

/** Required animation clips. Missing any → BLOCKED. */
export const REQUIRED_ANIMATIONS = [
  "idle","stand","walk","sit",
  "wave","greeting","goodbye",
  "explain","presentation","teach",
  "point_left","point_right",
  "thinking","listening",
  "celebrate","thank_you",
] as const;

/** Renderer targets the asset pipeline must report compatibility for. */
export const RUNTIME_TARGETS = [
  "portrait","layered_portrait","live2d","live3d","xr","vr","ar",
] as const;

export type RuntimeTarget = (typeof RUNTIME_TARGETS)[number];

/**
 * Minimum asset roles needed per runtime target. Used by the compatibility
 * engine. A target requires ALL listed roles to be present in the manifest.
 */
export const RUNTIME_REQUIREMENTS: Record<RuntimeTarget, ReadonlyArray<string>> = {
  portrait: ["character", "texture"],
  layered_portrait: ["character", "texture", "blendshapes"],
  live2d: ["character", "texture", "animation"], // Cubism assets carried as "character" + params in meta
  live3d: ["character", "skeleton", "blendshapes", "animation", "material"],
  xr: ["character", "skeleton", "blendshapes", "animation", "material", "hdr_environment"],
  vr: ["character", "skeleton", "blendshapes", "animation", "material", "hdr_environment"],
  ar: ["character", "skeleton", "blendshapes", "animation"],
};

export type ValidationStatus = "READY" | "PARTIAL" | "BLOCKED";
