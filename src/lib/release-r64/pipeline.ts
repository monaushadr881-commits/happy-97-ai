/** R64 — build pipeline state machine + toolchain gating. */
import type { PipelineStatus, BuildKind } from "./contracts";

const ALLOWED: Record<PipelineStatus, PipelineStatus[]> = {
  queued: ["running", "cancelled", "blocked"],
  running: ["succeeded", "failed", "cancelled"],
  succeeded: [],
  failed: ["queued"],
  cancelled: ["queued"],
  blocked: ["queued", "cancelled"],
};

export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

/** Native toolchain per platform is NOT available in the Worker runtime. */
export function toolchainAvailability(platform_code: string): { available: boolean; missing: string[] } {
  const p = platform_code.toLowerCase();
  const missing: string[] = [];
  if (p.includes("android")) missing.push("Android SDK", "gradle", "apksigner", "bundletool");
  else if (p.includes("ios") || p.includes("apple")) missing.push("Xcode", "xcodebuild", "notarytool");
  else if (p.includes("windows") || p === "msix") missing.push("signtool", "MakeAppx");
  else if (p.includes("mac") || p === "dmg" || p === "pkg") missing.push("codesign", "notarytool");
  else if (p.includes("linux") || p.includes("snap") || p.includes("flatpak")) missing.push("snapcraft/flatpak-builder");
  else if (p.includes("docker")) missing.push("docker CLI in worker");
  return { available: missing.length === 0, missing };
}

export function priorityFor(kind: BuildKind): number {
  switch (kind) {
    case "manual": return 10;
    case "scheduled": return 50;
    case "nightly": return 100;
    case "incremental": return 200;
    case "clean": return 300;
  }
}
