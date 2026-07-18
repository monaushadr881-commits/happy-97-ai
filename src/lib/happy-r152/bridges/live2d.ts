/**
 * R152 — Live2D Bridge (architecture-only).
 * Motion / Expression / Physics / Lip Sync / Animation hooks.
 */
import type { AvatarEngine } from "../avatar-engine";

export interface Live2DBridge {
  motion: Pick<AvatarEngine, "animate" | "gesture">;
  expression: Pick<AvatarEngine, "expression" | "emotion">;
  physics: { setEnabled(v: boolean): void; step(dtMs: number): void };
  lipSync: {
    push(pcm: Float32Array, sampleRate: number): Promise<void>;
    onMouthOpen(cb: (weight: number) => void): () => void;
  };
  animation: Pick<AvatarEngine, "animate">;
}

export const REQUIRED_ENV = ["LIVE2D_MODEL_URL"] as const;
