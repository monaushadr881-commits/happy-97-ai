/** Desktop packaging & signing adapters (Electron/Tauri + Win/mac/Linux). */
import { AdapterStatus, checkEnv, requireEnv } from "../types";

const ENV = {
  windowsSign: ["WINDOWS_SIGNING_CERT", "WINDOWS_SIGNING_PASSWORD"],
  macSign: ["APPLE_DEVELOPER_ID_CERT", "APPLE_DEVELOPER_ID_PASSWORD", "APPLE_TEAM_ID"],
  notarize: ["APPLE_NOTARIZE_USER", "APPLE_NOTARIZE_PASSWORD"],
  msstore: ["MICROSOFT_STORE_TENANT_ID", "MICROSOFT_STORE_CLIENT_ID", "MICROSOFT_STORE_CLIENT_SECRET"],
};

export type Target = "electron" | "tauri";
export type Platform = "win32" | "darwin" | "linux";
export interface PackageRequest { target: Target; platform: Platform; arch: "x64" | "arm64"; }
export interface PackageResult { artifactPath: string; sha256: string; sizeBytes: number; }

export function readiness(): AdapterStatus[] {
  return [
    { id: "desktop.windowsSign", ...checkEnv(ENV.windowsSign) },
    { id: "desktop.macSign", ...checkEnv(ENV.macSign) },
    { id: "desktop.notarize", ...checkEnv(ENV.notarize) },
    { id: "desktop.msstore", ...checkEnv(ENV.msstore) },
  ];
}

export async function pack(_req: PackageRequest): Promise<PackageResult> {
  throw new Error("desktop.pack requires target toolchain (electron-builder/tauri) on build host");
}
export async function signWindows(_p: PackageResult) { requireEnv("desktop.windowsSign", ENV.windowsSign); throw new Error("requires signtool"); }
export async function signMac(_p: PackageResult) { requireEnv("desktop.macSign", ENV.macSign); throw new Error("requires codesign"); }
export async function publishMicrosoftStore(_p: PackageResult) { requireEnv("desktop.msstore", ENV.msstore); throw new Error("requires MS Store partner API"); }
