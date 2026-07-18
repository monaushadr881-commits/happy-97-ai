/**
 * R152 — Canonical Avatar Engine (architecture-only).
 *
 * ONE Avatar Engine. Every renderer (VRM, MetaHuman, Live2D, NVIDIA ACE,
 * future) MUST implement this interface and plug into the existing
 * canonical Digital Human runtime at
 *   - src/components/digital-human/HappyVRM.tsx        (primary renderer)
 *   - src/lib/happy-runtime/digital-human.ts           (runtime contract)
 *   - src/lib/happy-adapters/digital-human/index.ts    (adapter stubs)
 *
 * NO new runtime, NO renderer V2. This file only DECLARES the contract and
 * a lightweight registry so future renderers can register without forking.
 * Locks: R91 · R111 · R145 · R151.
 */

export type RendererId =
  | "vrm"
  | "metahuman"
  | "live2d"
  | "nvidia_ace"
  | (string & { __plugin?: true });

export type RendererStatus = "primary" | "architecture_ready" | "plugin_slot";

export interface AvatarPose {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export interface AvatarEmotion {
  key:
    | "neutral"
    | "smile"
    | "thinking"
    | "explain"
    | "concern"
    | "celebrate"
    | "listen"
    | (string & {});
  intensity?: number; // 0..1
}

export interface AvatarSpeakOptions {
  text: string;
  language?: string;
  voice?: string;
  ssml?: boolean;
  lipSync?: boolean;
}

export interface AvatarGestureCue {
  clip: string;
  loop?: boolean;
  weight?: number;
  fadeMs?: number;
}

export interface AvatarPresentationInput {
  slides: Array<{ title: string; body?: string; imageUrl?: string }>;
  narrate?: boolean;
}

export interface AvatarWhiteboardInput {
  strokes?: unknown[]; // canonical stroke format lives in Whiteboard.tsx
  imageUrl?: string;
}

/** Canonical Avatar Engine contract. Every renderer implements this. */
export interface AvatarEngine {
  readonly id: RendererId;
  readonly status: RendererStatus;

  initialize(container: HTMLElement, opts?: Record<string, unknown>): Promise<void>;
  load(assetId: string): Promise<void>;
  unload(): Promise<void>;
  render(): void;

  speak(opts: AvatarSpeakOptions): Promise<void>;
  listen(enabled: boolean): Promise<void>;

  animate(clip: string, opts?: { loop?: boolean; fadeMs?: number }): Promise<void>;
  gesture(cue: AvatarGestureCue): Promise<void>;
  emotion(e: AvatarEmotion): Promise<void>;
  expression(name: string, weight?: number): Promise<void>;

  lookAt(target: [number, number, number] | "user" | "camera"): void;
  move(pose: AvatarPose, durationMs?: number): Promise<void>;
  teleport(pose: AvatarPose): void;

  present(input: AvatarPresentationInput): Promise<void>;
  whiteboard(input: AvatarWhiteboardInput): Promise<void>;

  shutdown(): Promise<void>;
}

export const AVATAR_ENGINE_METHODS: ReadonlyArray<keyof AvatarEngine> = [
  "initialize", "load", "unload", "render",
  "speak", "listen",
  "animate", "gesture", "emotion", "expression",
  "lookAt", "move", "teleport",
  "present", "whiteboard",
  "shutdown",
];

/** Registry entry. Registration is descriptive — no runtime is instantiated here. */
export interface AvatarRendererRegistration {
  id: RendererId;
  name: string;
  status: RendererStatus;
  canonicalOwner: string; // path to owner module
  bridge?: string;        // path to adapter/bridge (if any)
  externalDeps: string[]; // SDKs / assets required to activate
}

const REGISTRY = new Map<RendererId, AvatarRendererRegistration>();

export function registerRenderer(reg: AvatarRendererRegistration): void {
  // Guard: never allow silent re-registration under a new id ("V2" ban).
  if (REGISTRY.has(reg.id) && REGISTRY.get(reg.id)!.canonicalOwner !== reg.canonicalOwner) {
    throw new Error(
      `avatar_registry: duplicate registration for "${reg.id}" — extend the canonical owner instead of forking.`,
    );
  }
  REGISTRY.set(reg.id, reg);
}

export function listRenderers(): AvatarRendererRegistration[] {
  return [...REGISTRY.values()];
}

export function getRenderer(id: RendererId): AvatarRendererRegistration | undefined {
  return REGISTRY.get(id);
}

// --- Seed registrations (architecture-only; no SDK imports) ---
registerRenderer({
  id: "vrm",
  name: "VRM (Primary)",
  status: "primary",
  canonicalOwner: "src/components/digital-human/HappyVRM.tsx",
  externalDeps: [],
});
registerRenderer({
  id: "metahuman",
  name: "MetaHuman Renderer",
  status: "architecture_ready",
  canonicalOwner: "src/lib/happy-runtime/digital-human.ts",
  bridge: "src/lib/happy-r152/bridges/metahuman.ts",
  externalDeps: ["METAHUMAN_STREAM_URL", "METAHUMAN_API_KEY"],
});
registerRenderer({
  id: "live2d",
  name: "Live2D Renderer",
  status: "architecture_ready",
  canonicalOwner: "src/lib/happy-runtime/digital-human.ts",
  bridge: "src/lib/happy-r152/bridges/live2d.ts",
  externalDeps: ["LIVE2D_MODEL_URL"],
});
registerRenderer({
  id: "nvidia_ace",
  name: "NVIDIA ACE Renderer",
  status: "architecture_ready",
  canonicalOwner: "src/lib/happy-runtime/digital-human.ts",
  bridge: "src/lib/happy-r152/bridges/nvidia-ace.ts",
  externalDeps: ["NVIDIA_ACE_URL", "NVIDIA_ACE_API_KEY"],
});
registerRenderer({
  id: "plugin",
  name: "Generic Plugin Slot",
  status: "plugin_slot",
  canonicalOwner: "src/lib/happy-runtime/digital-human.ts",
  externalDeps: [],
});
