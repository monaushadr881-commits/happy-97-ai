/**
 * R152 — Future Platform & Avatar Architecture (barrel).
 * Architecture-only. Extends canonical owners; no new runtimes. Locks: R91 · R111 · R145 · R151.
 */
export * from "./avatar-engine";
export * from "./platform-registry";
export * from "./xr";
export * from "./asset-registry";
export type { MetaHumanBridge } from "./bridges/metahuman";
export type { NvidiaAceBridge } from "./bridges/nvidia-ace";
export type { Live2DBridge } from "./bridges/live2d";

import { listRenderers } from "./avatar-engine";
import { listPlatforms } from "./platform-registry";
import { listXRModes } from "./xr";
import { listAssets } from "./asset-registry";

export interface R152ArchitectureReport {
  renderers: number;
  platforms: number;
  xrModes: number;
  assets: number;
  canonicalOwners: {
    brain: string;
    memory: string;
    workspace: string;
    conversation: string;
    digitalHuman: string;
    avatarEngine: string;
  };
}

export function r152Report(): R152ArchitectureReport {
  return {
    renderers: listRenderers().length,
    platforms: listPlatforms().length,
    xrModes: listXRModes().length,
    assets: listAssets().length,
    canonicalOwners: {
      brain: "src/brain/kernel.ts",
      memory: "src/lib/memory/intelligence.ts",
      workspace: "src/workspace/",
      conversation: "src/lib/happy-runtime/conversation.ts",
      digitalHuman: "src/components/digital-human/HappyVRM.tsx",
      avatarEngine: "src/lib/happy-r152/avatar-engine.ts",
    },
  };
}
