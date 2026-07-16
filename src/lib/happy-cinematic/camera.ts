/** R71.2 — cinematic camera scene presets. */
export type CameraScene = "conversation" | "presentation" | "builder" | "founder" | "meeting";

export interface CameraPreset {
  dollyRange: number;   // px
  focalLength: number;  // mm-equivalent
  depthOfField: number; // 0..1
  focusSubject: "face" | "hands" | "wide" | "workspace";
  microMotion: boolean;
}

const PRESETS: Record<CameraScene, CameraPreset> = {
  conversation: { dollyRange: 6,  focalLength: 50, depthOfField: 0.25, focusSubject: "face",      microMotion: true },
  presentation: { dollyRange: 14, focalLength: 35, depthOfField: 0.10, focusSubject: "wide",      microMotion: true },
  builder:      { dollyRange: 4,  focalLength: 40, depthOfField: 0.15, focusSubject: "workspace", microMotion: true },
  founder:      { dollyRange: 8,  focalLength: 50, depthOfField: 0.30, focusSubject: "face",      microMotion: true },
  meeting:      { dollyRange: 10, focalLength: 45, depthOfField: 0.20, focusSubject: "wide",      microMotion: true },
};

export function resolveCamera(scene: CameraScene, reducedMotion: boolean): CameraPreset {
  const p = PRESETS[scene];
  return reducedMotion ? { ...p, dollyRange: 0, microMotion: false, depthOfField: 0 } : p;
}

export function pickSceneFromRoute(route: string): CameraScene {
  if (route.startsWith("/happy/presentation")) return "presentation";
  if (route.startsWith("/founder")) return "founder";
  if (route.startsWith("/builder") || route.startsWith("/uabr")) return "builder";
  if (route.startsWith("/happy/video") || route.startsWith("/happy/call")) return "meeting";
  return "conversation";
}
