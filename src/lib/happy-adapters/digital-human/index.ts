/**
 * Digital Human adapters — interfaces only.
 * Plugs into the existing ONE HAPPY runtime at src/components/digital-human/
 * and src/lib/happy-runtime/digital-human.ts. Do NOT instantiate an alternate
 * runtime; adapters translate provider frames into the existing avatar bus.
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError } from "../types";

export interface AvatarFrame {
  visemes?: Array<{ id: string; weight: number; t: number }>;
  blendshapes?: Record<string, number>;
  bones?: Record<string, [number, number, number, number]>;
  emotion?: string;
  t: number;
}

export interface DigitalHumanAdapter {
  id: string;
  isConfigured(): boolean;
  connect(): Promise<void>;
  pushAudio(pcm: Float32Array, sampleRate: number): Promise<void>;
  onFrame(cb: (frame: AvatarFrame) => void): () => void;
  dispose(): Promise<void>;
}

function stub(id: string, envs: string[]): DigitalHumanAdapter {
  const check = () => checkEnv(envs);
  return {
    id,
    isConfigured: () => check().configured,
    async connect() {
      const c = check();
      if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
      throw new Error(`${id}: external SDK/asset not present in repository`);
    },
    async pushAudio() { throw new Error(`${id}: connect() first`); },
    onFrame() { return () => {}; },
    async dispose() {},
  };
}

export const live2d = stub("digital-human.live2d", ["LIVE2D_MODEL_URL"]);
export const metaHuman = stub("digital-human.metahuman", ["METAHUMAN_STREAM_URL", "METAHUMAN_API_KEY"]);
export const audio2Face = stub("digital-human.audio2face", ["AUDIO2FACE_URL", "AUDIO2FACE_API_KEY"]);
export const nvidiaAce = stub("digital-human.nvidia_ace", ["NVIDIA_ACE_URL", "NVIDIA_ACE_API_KEY"]);
export const visionPro = stub("digital-human.vision_pro", ["APPLE_VISION_PRO_BUNDLE"]);
export const professionalAssets = stub("digital-human.pro_assets", ["PRO_AVATAR_ASSET_BUNDLE_URL"]);

export const registry: Record<string, DigitalHumanAdapter> = {
  live2d, metaHuman, audio2Face, nvidiaAce, visionPro, professionalAssets,
};

export function readiness(): AdapterStatus[] {
  return Object.values(registry).map((a) => {
    const envs = envsFor(a.id);
    return { id: a.id, ...checkEnv(envs) };
  });
}
function envsFor(id: string): string[] {
  switch (id) {
    case "digital-human.live2d": return ["LIVE2D_MODEL_URL"];
    case "digital-human.metahuman": return ["METAHUMAN_STREAM_URL", "METAHUMAN_API_KEY"];
    case "digital-human.audio2face": return ["AUDIO2FACE_URL", "AUDIO2FACE_API_KEY"];
    case "digital-human.nvidia_ace": return ["NVIDIA_ACE_URL", "NVIDIA_ACE_API_KEY"];
    case "digital-human.vision_pro": return ["APPLE_VISION_PRO_BUNDLE"];
    case "digital-human.pro_assets": return ["PRO_AVATAR_ASSET_BUNDLE_URL"];
    default: return [];
  }
}
