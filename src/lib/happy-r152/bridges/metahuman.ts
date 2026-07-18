/**
 * R152 — MetaHuman Bridge (architecture-only).
 * Adapter shape that maps the canonical AvatarEngine surface onto an
 * eventual MetaHuman Pixel-Streaming runtime. NO SDK import here.
 * Plugs into the canonical runtime at src/lib/happy-runtime/digital-human.ts.
 */
import type { AvatarEngine } from "../avatar-engine";

export interface MetaHumanBridge {
  renderer: Pick<AvatarEngine, "initialize" | "load" | "render" | "shutdown">;
  animation: Pick<AvatarEngine, "animate" | "gesture">;
  expression: Pick<AvatarEngine, "expression" | "emotion">;
  voice: Pick<AvatarEngine, "speak" | "listen">;
  camera: Pick<AvatarEngine, "lookAt" | "move" | "teleport">;
  lipSync: {
    push(pcm: Float32Array, sampleRate: number): Promise<void>;
    onViseme(cb: (v: { id: string; weight: number; t: number }) => void): () => void;
  };
}

export const REQUIRED_ENV = ["METAHUMAN_STREAM_URL", "METAHUMAN_API_KEY"] as const;
