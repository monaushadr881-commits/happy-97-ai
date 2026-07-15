/**
 * R39–R50 HAPPY Runtime — Digital Human integration boundary.
 *
 * HONEST POLICY (per user directive):
 *   - No fake Live2D
 *   - No fake photoreal rendering
 *   - No fake lip sync
 *   - No fake gestures
 *
 * This file defines the CONTRACTS the runtime will call once real assets and
 * infrastructure are provisioned (MetaHuman / Character Creator / Omniverse
 * ACE / Pixel Streaming / Audio2Face / etc.). Runtimes can be swapped without
 * changing calling code.
 *
 * NO IMPLEMENTATION shipped here. Every method throws a clearly labeled
 * `DigitalHumanNotProvisionedError` when called against the default stub.
 * This intentionally FAILS LOUDLY rather than pretending to render.
 */

export type DigitalHumanAssetManifest = {
  identity_id: string;
  character_id: string;               // rig id, e.g. "happy_metahuman_v1"
  skeleton_url?: string;
  face_blendshapes_url?: string;
  animation_bundle_url?: string;
  material_pack_url?: string;
  license: {
    provider: string;
    verified: boolean;
    expires_at?: string;
  };
};

export type LipSyncFrame = {
  t_ms: number;
  visemes: Record<string, number>; // ARKit-style ("A","E","I","O","U","M","B","P",...)
};

export type GestureCue = { t_ms: number; clip_code: string };

export interface DigitalHumanRuntime {
  /** Provisioning check. Callers MUST branch on this before invoking anything else. */
  isProvisioned(): boolean;
  /** Publish/refresh asset manifest for the singleton HAPPY. */
  registerAssets(manifest: DigitalHumanAssetManifest): Promise<void>;
  /** Open a realtime session (Pixel Streaming / WebRTC / etc.). */
  openSession(input: { language: string; persona: string; audience: string }): Promise<{ session_id: string; transport_url: string }>;
  /** Feed audio + viseme frames for lip sync. */
  pushLipSync(sessionId: string, frames: LipSyncFrame[]): Promise<void>;
  /** Trigger a gesture animation. */
  triggerGesture(sessionId: string, cue: GestureCue): Promise<void>;
  /** Close and release resources. */
  closeSession(sessionId: string): Promise<void>;
}

export class DigitalHumanNotProvisionedError extends Error {
  constructor(action: string) {
    super(`digital_human_not_provisioned: ${action}. See docs/digital-human-assets.md`);
    this.name = "DigitalHumanNotProvisionedError";
  }
}

/** Default stub. Intentionally throws — do not treat as a working renderer. */
export const stubDigitalHuman: DigitalHumanRuntime = {
  isProvisioned: () => false,
  async registerAssets() { throw new DigitalHumanNotProvisionedError("registerAssets"); },
  async openSession() { throw new DigitalHumanNotProvisionedError("openSession"); },
  async pushLipSync() { throw new DigitalHumanNotProvisionedError("pushLipSync"); },
  async triggerGesture() { throw new DigitalHumanNotProvisionedError("triggerGesture"); },
  async closeSession() { throw new DigitalHumanNotProvisionedError("closeSession"); },
};

let ACTIVE: DigitalHumanRuntime = stubDigitalHuman;

/** Wire a real runtime here once assets/infra are provisioned. */
export function setDigitalHumanRuntime(rt: DigitalHumanRuntime): void {
  ACTIVE = rt;
}
export function getDigitalHumanRuntime(): DigitalHumanRuntime {
  return ACTIVE;
}

/** Honest readiness report used by the founder dashboard. */
export function digitalHumanReadiness(): {
  provisioned: boolean;
  runtime_name: string;
  missing: string[];
} {
  const provisioned = ACTIVE.isProvisioned();
  return {
    provisioned,
    runtime_name: provisioned ? "custom" : "stub",
    missing: provisioned
      ? []
      : [
          "Rigged HAPPY character (MetaHuman / Character Creator)",
          "Facial blendshapes (ARKit or Faceware)",
          "Skeleton + animation clips",
          "Streaming renderer (Unreal Pixel Streaming or Omniverse ACE)",
          "GPU runtime (Cloud/On-prem)",
          "Voice provider bound to lip-sync pipeline (Audio2Face or equivalent)",
          "Realtime transport (WebRTC / WebSocket)",
        ],
  };
}
