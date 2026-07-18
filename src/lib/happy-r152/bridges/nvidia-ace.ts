/**
 * R152 — NVIDIA ACE Bridge (architecture-only).
 * Hooks only. Plugs into canonical DH runtime.
 */
import type { AvatarEngine } from "../avatar-engine";

export interface NvidiaAceBridge {
  speech: Pick<AvatarEngine, "speak" | "listen">;
  emotion: Pick<AvatarEngine, "emotion" | "expression">;
  faceAnimation: Pick<AvatarEngine, "animate" | "gesture">;
  conversation: { send(text: string): Promise<void> };
  streaming: { connect(): Promise<void>; disconnect(): Promise<void> };
  lipSync: {
    push(pcm: Float32Array, sampleRate: number): Promise<void>;
    onBlendshapes(cb: (b: Record<string, number>) => void): () => void;
  };
}

export const REQUIRED_ENV = ["NVIDIA_ACE_URL", "NVIDIA_ACE_API_KEY"] as const;
