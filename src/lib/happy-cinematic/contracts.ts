/** R71 + R71.1 shared contracts. Presentation only — no DB writes. */

export type CinematicState =
  | "idle" | "entering" | "walking" | "listening" | "thinking"
  | "speaking" | "working" | "celebrating" | "exiting";

export type DisplayMode =
  | "floating" | "sidebar" | "mini" | "dock" | "fullscreen"
  | "presentation" | "picture-in-picture" | "meeting";

export type DockPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

export type QualityTier = "ultra" | "high" | "medium" | "low" | "auto";

export type Emotion =
  | "neutral" | "happy" | "professional" | "thinking" | "focused"
  | "supportive" | "celebrating" | "concerned" | "motivational" | "calm";

export interface CinematicEntryPlan {
  sequence: Array<
    | "soft-ambient-light" | "ground-light-ripple" | "volumetric-smoke"
    | "floating-particles" | "ambient-glow" | "materialize" | "turn"
    | "walk-in" | "eye-contact" | "smile" | "breath" | "greet"
  >;
  durationMs: number;
  qualityTier: QualityTier;
  reducedMotion: boolean;
}

export interface WalkPlan {
  from: [number, number];
  to: [number, number];
  steps: number;
  cadenceMs: number;
  turnAtEndDeg: number;
}

export interface VfxLayerPlan {
  smoke: { enabled: boolean; opacity: number; height: number };
  particles: { enabled: boolean; cap: number; palette: Array<"dust" | "gold" | "blue" | "firefly"> };
  ground: { ripple: boolean; energyRing: boolean; footstepResponse: boolean };
  lighting: { ambient: number; rim: number; contactShadow: boolean };
  camera: { microMotion: boolean; focusShift: boolean; depthOfField: number };
}

export interface WorkspaceContext {
  route: string;
  builder?: string;
  project?: string;
  component?: string;
  hasErrors: boolean;
  pendingDeployment: boolean;
}

export interface GreetingPlan {
  emotion: Emotion;
  lines: string[];
  followUp?: string;
}

export interface CinematicSession {
  id: string;
  userId: string;
  mode: DisplayMode;
  state: CinematicState;
  startedAt: number;
  emotion: Emotion;
}
