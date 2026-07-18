// R143 — HAPPY Digital Human Production Experience (pure helpers, no new runtime).
//
// Extends the canonical owners:
//   • src/components/digital-human/HappyVRM.tsx        (renderer)
//   • src/components/digital-human/HappyAvatar.tsx     (fallback renderer)
//   • src/components/digital-human/conversation-engine.ts   (behaviour)
//   • src/components/digital-human/useHappySpeech.ts   (speech runtime)
//   • src/lib/happy-cinematic/*                        (choreography/camera)
//   • src/lib/happy-r117/dh-intelligence.ts            (intelligence)
//
// R143 adds decision helpers for the founder-approved Production Experience:
// BMW M5 cinematic entry, animation catalogue, environment presets, camera
// modes, voice experience shaping, relationship behaviours, and presentation
// surfaces. No new VRM, no new animation engine, no duplicate runtime.

import type { CameraScene } from "@/lib/happy-cinematic/camera";
import type { EnvironmentScene, RelationshipTier } from "@/lib/happy-r117/dh-intelligence";
import type { Intent } from "@/components/digital-human/conversation-engine";

/* ────────────────── BMW M5 Cinematic Entry ────────────────── */

export type BmwEntryBeat =
  | "engine-rumble" | "arrive-far" | "side-slide-drift" | "brake-settle"
  | "door-open" | "happy-exit" | "stand-up" | "door-close"
  | "drive-away" | "walk-begin" | "camera-follow" | "eye-contact" | "greet";

export interface BmwEntryPlan {
  variant: "bmw_m5";
  beats: BmwEntryBeat[];
  totalMs: number;
  reducedMotion: boolean;
}

/**
 * Choreograph the founder BMW M5 arrival. Trims to a compact 900 ms path
 * when reduced motion is active so accessibility remains first-class.
 */
export function planBmwM5Entry(reducedMotion: boolean): BmwEntryPlan {
  if (reducedMotion) {
    return {
      variant: "bmw_m5",
      beats: ["arrive-far", "happy-exit", "eye-contact", "greet"],
      totalMs: 900,
      reducedMotion: true,
    };
  }
  return {
    variant: "bmw_m5",
    beats: [
      "engine-rumble", "arrive-far", "side-slide-drift", "brake-settle",
      "door-open", "happy-exit", "stand-up", "door-close",
      "drive-away", "walk-begin", "camera-follow", "eye-contact", "greet",
    ],
    totalMs: 6400,
    reducedMotion: false,
  };
}

/* ────────────────── Animation Catalogue ────────────────── */

export type Animation =
  | "idle" | "walk" | "turn" | "sit" | "stand"
  | "greeting" | "handshake" | "point" | "whiteboard" | "presentation"
  | "teaching" | "listening" | "thinking" | "celebration" | "concern"
  | "agreement" | "disagreement" | "business_discussion"
  | "friend_conversation" | "founder_presentation";

export const ANIMATION_CATALOGUE: readonly Animation[] = [
  "idle", "walk", "turn", "sit", "stand",
  "greeting", "handshake", "point", "whiteboard", "presentation",
  "teaching", "listening", "thinking", "celebration", "concern",
  "agreement", "disagreement", "business_discussion",
  "friend_conversation", "founder_presentation",
] as const;

export interface AnimationChoice {
  clip: Animation;
  loop: boolean;
  fadeMs: number;
}

/** Choose an animation clip from behaviour + relationship tier. */
export function animationFor(
  behaviour:
    | "listening" | "thinking" | "talking" | "agreement" | "disagreement"
    | "celebration" | "concern" | "explanation" | "question",
  tier: RelationshipTier,
  presenting: boolean,
): AnimationChoice {
  const fadeMs = 240;
  if (presenting) {
    if (tier === "founder") return { clip: "founder_presentation", loop: true, fadeMs };
    return { clip: "presentation", loop: true, fadeMs };
  }
  switch (behaviour) {
    case "listening": return { clip: "listening", loop: true, fadeMs };
    case "thinking": return { clip: "thinking", loop: true, fadeMs };
    case "agreement": return { clip: "agreement", loop: false, fadeMs };
    case "disagreement": return { clip: "disagreement", loop: false, fadeMs };
    case "celebration": return { clip: "celebration", loop: false, fadeMs };
    case "concern": return { clip: "concern", loop: false, fadeMs };
    case "explanation":
      return { clip: tier === "friend" ? "friend_conversation" : "business_discussion", loop: true, fadeMs };
    case "question":
      return { clip: "thinking", loop: true, fadeMs };
    default:
      return { clip: tier === "friend" ? "friend_conversation" : "business_discussion", loop: true, fadeMs };
  }
}

/* ────────────────── Environment Presets ────────────────── */

export interface EnvironmentPreset {
  scene: EnvironmentScene;
  skybox: string;
  floor: "wood" | "concrete" | "carpet" | "grass" | "grid" | "marble";
  lighting: "warm" | "cool" | "neutral" | "spot" | "studio" | "sunlight" | "volumetric";
  ambientDb: number;
  props: readonly string[];
}

const ENVIRONMENTS: Record<EnvironmentScene, EnvironmentPreset> = {
  office:        { scene: "office",        skybox: "city_dawn",    floor: "carpet",   lighting: "warm",       ambientDb: -32, props: ["desk", "monitor", "plant"] },
  board_room:    { scene: "board_room",    skybox: "penthouse",    floor: "wood",     lighting: "studio",     ambientDb: -36, props: ["long_table", "screen", "chairs"] },
  classroom:     { scene: "classroom",     skybox: "morning",      floor: "wood",     lighting: "sunlight",   ambientDb: -30, props: ["whiteboard", "seats", "projector"] },
  coffee_shop:   { scene: "coffee_shop",   skybox: "street",       floor: "wood",     lighting: "warm",       ambientDb: -22, props: ["bar", "cups", "warm_lamp"] },
  studio:        { scene: "studio",        skybox: "neutral_grey", floor: "concrete", lighting: "studio",     ambientDb: -40, props: ["softbox", "camera_rig", "marker"] },
  virtual_space: { scene: "virtual_space", skybox: "aurora",       floor: "grid",     lighting: "volumetric", ambientDb: -38, props: ["holo_panel", "orbs"] },
  future_lab:    { scene: "future_lab",    skybox: "space",        floor: "marble",   lighting: "cool",       ambientDb: -34, props: ["holo_desk", "servers", "quantum_core"] },
};

export function environmentPreset(scene: EnvironmentScene): EnvironmentPreset {
  return ENVIRONMENTS[scene];
}

export const ENVIRONMENT_SCENES: readonly EnvironmentScene[] = [
  "office", "board_room", "classroom", "coffee_shop", "studio", "virtual_space", "future_lab",
] as const;

/* ────────────────── Camera Mode System ────────────────── */

export type CameraMode =
  | "auto_follow" | "presentation" | "whiteboard" | "conversation" | "founder";

export interface CameraModePlan {
  mode: CameraMode;
  scene: CameraScene;
  followSubject: "happy" | "surface" | "user";
  lerp: number;               // 0..1 tracking smoothness
  offset: [number, number, number];
}

export function cameraMode(input: {
  mode?: CameraMode;
  presenting?: boolean;
  whiteboard?: boolean;
  tier?: RelationshipTier;
}): CameraModePlan {
  if (input.mode) return resolveCameraMode(input.mode);
  if (input.whiteboard) return resolveCameraMode("whiteboard");
  if (input.presenting) return resolveCameraMode("presentation");
  if (input.tier === "founder") return resolveCameraMode("founder");
  return resolveCameraMode("conversation");
}

function resolveCameraMode(mode: CameraMode): CameraModePlan {
  switch (mode) {
    case "auto_follow":   return { mode, scene: "conversation", followSubject: "happy",   lerp: 0.12, offset: [0, 1.6, 2.2] };
    case "presentation":  return { mode, scene: "presentation", followSubject: "surface", lerp: 0.08, offset: [0, 1.4, 4.0] };
    case "whiteboard":    return { mode, scene: "presentation", followSubject: "surface", lerp: 0.14, offset: [0, 1.5, 3.0] };
    case "conversation":  return { mode, scene: "conversation", followSubject: "happy",   lerp: 0.18, offset: [0, 1.6, 1.8] };
    case "founder":       return { mode, scene: "founder",      followSubject: "happy",   lerp: 0.10, offset: [0, 1.6, 2.6] };
  }
}

export const CAMERA_MODES: readonly CameraMode[] = [
  "auto_follow", "presentation", "whiteboard", "conversation", "founder",
] as const;

/* ────────────────── Voice Experience Shaping ────────────────── */

export interface VoiceExperience {
  pitch: number;         // 0.7..1.3
  rate: number;          // 0.7..1.3
  emotion: "neutral" | "warm" | "focused" | "excited" | "gentle" | "concerned";
  confidence: number;    // 0..1
  pauseMs: number;       // end-of-sentence pause
  flow: "steady" | "expressive" | "gentle" | "assertive";
}

export function voiceExperience(intent: Intent, tier: RelationshipTier): VoiceExperience {
  const emotion: VoiceExperience["emotion"] =
    intent === "congrats" ? "excited" :
    intent === "warning"  ? "concerned" :
    intent === "greeting" ? "warm" :
    intent === "teaching" ? "focused" :
    tier === "friend"     ? "warm" : "neutral";

  const flow: VoiceExperience["flow"] =
    intent === "warning" ? "assertive" :
    intent === "teaching" ? "steady" :
    intent === "congrats" ? "expressive" :
    tier === "friend" ? "expressive" : "steady";

  const pitch =
    emotion === "excited" ? 1.1 :
    emotion === "concerned" ? 0.94 :
    emotion === "warm" ? 1.03 : 1.0;

  const rate =
    intent === "warning" ? 0.95 :
    intent === "teaching" ? 0.92 :
    intent === "short" ? 1.05 : 1.0;

  const confidence =
    intent === "warning" ? 0.7 :
    intent === "greeting" ? 0.9 :
    intent === "teaching" ? 0.85 :
    tier === "founder" ? 0.9 : 0.8;

  const pauseMs =
    intent === "teaching" ? 260 :
    intent === "warning" ? 240 :
    intent === "short" ? 160 : 220;

  return { pitch, rate, emotion, confidence, pauseMs, flow };
}

/* ────────────────── Relationship Behaviour Matrix ────────────────── */

export type RelationshipRole =
  | "guest" | "user" | "member" | "premium" | "founder"
  | "company_admin" | "enterprise";

export interface RelationshipBehaviour {
  role: RelationshipRole;
  tier: RelationshipTier;
  formality: "casual" | "professional" | "executive";
  warmth: number;           // 0..1
  proactivity: number;      // 0..1
  cameraMode: CameraMode;
  greetingStyle: "brief" | "friendly" | "personal" | "executive";
  memoryDepth: "session" | "short" | "long" | "lifetime";
}

const BEHAVIOURS: Record<RelationshipRole, RelationshipBehaviour> = {
  guest:         { role: "guest",         tier: "stranger",     formality: "casual",       warmth: 0.55, proactivity: 0.25, cameraMode: "conversation", greetingStyle: "brief",     memoryDepth: "session" },
  user:          { role: "user",          tier: "acquaintance", formality: "casual",       warmth: 0.7,  proactivity: 0.45, cameraMode: "conversation", greetingStyle: "friendly",  memoryDepth: "short" },
  member:        { role: "member",        tier: "acquaintance", formality: "professional", warmth: 0.75, proactivity: 0.55, cameraMode: "conversation", greetingStyle: "friendly",  memoryDepth: "long" },
  premium:       { role: "premium",       tier: "friend",       formality: "professional", warmth: 0.85, proactivity: 0.7,  cameraMode: "auto_follow",  greetingStyle: "personal",  memoryDepth: "long" },
  founder:       { role: "founder",       tier: "founder",      formality: "executive",    warmth: 0.9,  proactivity: 0.95, cameraMode: "founder",      greetingStyle: "executive", memoryDepth: "lifetime" },
  company_admin: { role: "company_admin", tier: "colleague",    formality: "professional", warmth: 0.75, proactivity: 0.8,  cameraMode: "founder",      greetingStyle: "personal",  memoryDepth: "long" },
  enterprise:    { role: "enterprise",    tier: "colleague",    formality: "executive",    warmth: 0.7,  proactivity: 0.75, cameraMode: "presentation", greetingStyle: "executive", memoryDepth: "long" },
};

export function relationshipBehaviour(role: RelationshipRole): RelationshipBehaviour {
  return BEHAVIOURS[role];
}

export const RELATIONSHIP_ROLES: readonly RelationshipRole[] = [
  "guest", "user", "member", "premium", "founder", "company_admin", "enterprise",
] as const;

/* ────────────────── Presentation Mode ────────────────── */

export type PresentationMode =
  | "slides" | "charts" | "graphs" | "roadmaps" | "business_canvas" | "whiteboard";

export const PRESENTATION_MODES: readonly PresentationMode[] = [
  "slides", "charts", "graphs", "roadmaps", "business_canvas", "whiteboard",
] as const;

export interface PresentationPlan {
  mode: PresentationMode;
  surface: "board" | "screen" | "wall" | "canvas";
  cameraMode: CameraMode;
  animation: Animation;
  gestureCue: "point" | "whiteboard" | "presentation" | "explain";
}

export function planPresentation(mode: PresentationMode, tier: RelationshipTier): PresentationPlan {
  const founderMode = tier === "founder";
  switch (mode) {
    case "slides":
      return { mode, surface: "screen", cameraMode: "presentation", animation: founderMode ? "founder_presentation" : "presentation", gestureCue: "presentation" };
    case "charts":
    case "graphs":
      return { mode, surface: "screen", cameraMode: "presentation", animation: "presentation", gestureCue: "point" };
    case "roadmaps":
      return { mode, surface: "wall", cameraMode: "whiteboard", animation: "whiteboard", gestureCue: "whiteboard" };
    case "business_canvas":
      return { mode, surface: "canvas", cameraMode: "whiteboard", animation: "whiteboard", gestureCue: "whiteboard" };
    case "whiteboard":
      return { mode, surface: "board", cameraMode: "whiteboard", animation: "whiteboard", gestureCue: "whiteboard" };
  }
}

/* ────────────────── Production Frame (aggregator) ────────────────── */

export interface ProductionFrame {
  entry: BmwEntryPlan | null;
  animation: AnimationChoice;
  environment: EnvironmentPreset;
  camera: CameraModePlan;
  voice: VoiceExperience;
  behaviour: RelationshipBehaviour;
  presentation: PresentationPlan | null;
}

export function productionFrame(input: {
  role: RelationshipRole;
  intent: Intent;
  scene: EnvironmentScene;
  behaviour: Parameters<typeof animationFor>[0];
  presentationMode?: PresentationMode | null;
  entry?: "bmw_m5" | null;
  reducedMotion?: boolean;
}): ProductionFrame {
  const bh = relationshipBehaviour(input.role);
  const presentation = input.presentationMode ? planPresentation(input.presentationMode, bh.tier) : null;
  const camera = cameraMode({
    presenting: !!presentation,
    whiteboard: presentation?.mode === "whiteboard" || presentation?.mode === "roadmaps" || presentation?.mode === "business_canvas",
    tier: bh.tier,
    mode: presentation?.cameraMode,
  });
  return {
    entry: input.entry === "bmw_m5" ? planBmwM5Entry(!!input.reducedMotion) : null,
    animation: animationFor(input.behaviour, bh.tier, !!presentation),
    environment: environmentPreset(input.scene),
    camera,
    voice: voiceExperience(input.intent, bh.tier),
    behaviour: bh,
    presentation,
  };
}
