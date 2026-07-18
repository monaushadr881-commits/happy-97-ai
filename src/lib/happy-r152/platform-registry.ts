/**
 * R152 — Platform Runtime Registry (architecture-only).
 *
 * ONE Platform Registry. Every platform reuses the CANONICAL
 *   Brain          — src/brain/kernel.ts
 *   Memory         — canonical Memory Intelligence owner
 *   Workspace      — src/workspace/
 *   Conversation   — canonical conversation engine
 *   Digital Human  — src/components/digital-human/HappyVRM.tsx + happy-runtime/digital-human.ts
 *
 * Locks: R91 · R111 · R145 · R151. No new runtime, no forked shell.
 */

export type PlatformId =
  | "web"
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux"
  | "vision_pro"
  | "xr";

export type PlatformStatus = "active" | "architecture_ready" | "pending";

export interface PlatformRuntime {
  id: PlatformId;
  name: string;
  status: PlatformStatus;
  shell: string;              // universal runtime shell path
  brain: "canonical";
  memory: "canonical";
  workspace: "canonical";
  conversation: "canonical";
  digitalHuman: "canonical";
  externalDeps: string[];
  notes?: string;
}

const REGISTRY = new Map<PlatformId, PlatformRuntime>();

export function registerPlatform(p: PlatformRuntime): void {
  // Guard against parallel-runtime attempts.
  const forbidden = [
    p.brain, p.memory, p.workspace, p.conversation, p.digitalHuman,
  ].some((v) => v !== "canonical");
  if (forbidden) {
    throw new Error(
      `platform_registry: platform "${p.id}" must reuse canonical Brain/Memory/Workspace/Conversation/Digital Human.`,
    );
  }
  REGISTRY.set(p.id, p);
}

export function listPlatforms(): PlatformRuntime[] {
  return [...REGISTRY.values()];
}

export function getPlatform(id: PlatformId): PlatformRuntime | undefined {
  return REGISTRY.get(id);
}

const CANON = {
  brain: "canonical",
  memory: "canonical",
  workspace: "canonical",
  conversation: "canonical",
  digitalHuman: "canonical",
} as const;

registerPlatform({ id: "web", name: "Web", status: "active",
  shell: "src/routes/__root.tsx", externalDeps: [], ...CANON });
registerPlatform({ id: "android", name: "Android (Capacitor)", status: "architecture_ready",
  shell: "capacitor.config.ts", externalDeps: ["ANDROID_KEYSTORE"], ...CANON });
registerPlatform({ id: "ios", name: "iOS (Capacitor)", status: "architecture_ready",
  shell: "capacitor.config.ts", externalDeps: ["APPLE_TEAM_ID"], ...CANON });
registerPlatform({ id: "windows", name: "Windows (Tauri)", status: "pending",
  shell: "src-tauri/tauri.conf.json", externalDeps: ["WINDOWS_CODESIGN_CERT"], ...CANON });
registerPlatform({ id: "macos", name: "macOS (Tauri)", status: "pending",
  shell: "src-tauri/tauri.conf.json", externalDeps: ["APPLE_TEAM_ID", "APPLE_NOTARY_KEY"], ...CANON });
registerPlatform({ id: "linux", name: "Linux (Tauri)", status: "pending",
  shell: "src-tauri/tauri.conf.json", externalDeps: [], ...CANON });
registerPlatform({ id: "vision_pro", name: "Apple Vision Pro", status: "pending",
  shell: "src-tauri/tauri.conf.json", externalDeps: ["APPLE_VISION_PRO_BUNDLE"], ...CANON,
  notes: "Reuses DH runtime via XR adapter." });
registerPlatform({ id: "xr", name: "XR (AR/VR/MR)", status: "pending",
  shell: "src/lib/happy-r152/xr.ts", externalDeps: ["WEBXR_DEVICE"], ...CANON });
