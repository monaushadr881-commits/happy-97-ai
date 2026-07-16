import type { QualityTier, VfxLayerPlan } from "./contracts";

export function detectQualityTier(input: {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  isMobile?: boolean;
  reducedMotion?: boolean;
}): QualityTier {
  if (input.reducedMotion) return "low";
  const cores = input.hardwareConcurrency ?? 4;
  const mem = input.deviceMemory ?? 4;
  if (input.isMobile) {
    if (cores >= 8 && mem >= 6) return "high";
    if (cores >= 6) return "medium";
    return "low";
  }
  if (cores >= 12 && mem >= 8) return "ultra";
  if (cores >= 8) return "high";
  if (cores >= 4) return "medium";
  return "low";
}

export function planVfx(tier: QualityTier, reducedMotion: boolean): VfxLayerPlan {
  if (reducedMotion || tier === "low") {
    return {
      smoke: { enabled: false, opacity: 0, height: 0 },
      particles: { enabled: false, cap: 0, palette: [] },
      ground: { ripple: false, energyRing: false, footstepResponse: false },
      lighting: { ambient: 0.6, rim: 0.2, contactShadow: true },
      camera: { microMotion: false, focusShift: false, depthOfField: 0 },
    };
  }
  const caps: Record<Exclude<QualityTier, "low" | "auto">, number> = {
    medium: 96, high: 256, ultra: 512,
  };
  const t = tier === "auto" ? "high" : tier;
  return {
    smoke: { enabled: t !== "medium", opacity: t === "ultra" ? 0.25 : 0.18, height: 0.3 },
    particles: { enabled: true, cap: caps[t], palette: ["dust", "gold", "blue", "firefly"] },
    ground: { ripple: true, energyRing: t !== "medium", footstepResponse: true },
    lighting: { ambient: 0.7, rim: t === "ultra" ? 0.6 : 0.4, contactShadow: true },
    camera: { microMotion: true, focusShift: t !== "medium", depthOfField: t === "ultra" ? 0.35 : 0.15 },
  };
}
