/**
 * R152 — XR Abstraction (architecture-only).
 *
 * Prepares AR / VR / MR surfaces for the CANONICAL Digital Human runtime.
 * No new runtime. Adapters here are contracts only; wiring lands when
 * WebXR-capable devices and SDKs are provisioned. Locks: R91 · R111 · R151.
 */

export type XRMode = "ar" | "vr" | "mr";

export interface SpatialAnchor {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  persistent?: boolean;
}

export interface HandTrackingFrame {
  hand: "left" | "right";
  joints: Array<{ id: string; pos: [number, number, number] }>;
  pinchStrength?: number;
}

export interface EyeTrackingFrame {
  gazeOrigin: [number, number, number];
  gazeDirection: [number, number, number];
  fixationMs?: number;
}

export interface EnvironmentMap {
  meshUrl?: string;
  planes?: Array<{ id: string; extent: [number, number]; pose: SpatialAnchor }>;
  lighting?: { intensity: number; sh?: number[] };
}

export interface XRAdapter {
  id: string;
  mode: XRMode;
  isSupported(): Promise<boolean>;
  startSession(): Promise<{ sessionId: string }>;
  endSession(sessionId: string): Promise<void>;
  createAnchor(a: Omit<SpatialAnchor, "id">): Promise<SpatialAnchor>;
  onHands(cb: (f: HandTrackingFrame) => void): () => void;
  onGaze(cb: (f: EyeTrackingFrame) => void): () => void;
  onVoice(cb: (utterance: string) => void): () => void;
  getEnvironment(): Promise<EnvironmentMap>;
}

/** Stub adapter — throws loudly. Wire real WebXR/VisionOS runtimes later. */
export function stubXRAdapter(mode: XRMode): XRAdapter {
  const err = (m: string) => { throw new Error(`xr_not_provisioned:${mode}:${m}`); };
  return {
    id: `xr.${mode}.stub`,
    mode,
    async isSupported() { return false; },
    async startSession() { return err("startSession"); },
    async endSession() { err("endSession"); },
    async createAnchor() { return err("createAnchor"); },
    onHands() { return () => {}; },
    onGaze() { return () => {}; },
    onVoice() { return () => {}; },
    async getEnvironment() { return err("getEnvironment"); },
  };
}

const REGISTRY = new Map<XRMode, XRAdapter>([
  ["ar", stubXRAdapter("ar")],
  ["vr", stubXRAdapter("vr")],
  ["mr", stubXRAdapter("mr")],
]);

export function getXRAdapter(mode: XRMode): XRAdapter {
  return REGISTRY.get(mode)!;
}
export function setXRAdapter(mode: XRMode, adapter: XRAdapter): void {
  REGISTRY.set(mode, adapter);
}
export function listXRModes(): XRMode[] { return [...REGISTRY.keys()]; }
