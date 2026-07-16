/** iOS build & release adapters (Xcode / signing / App Store Connect). */
import { AdapterStatus, checkEnv, requireEnv } from "../types";

const ENV = {
  xcode: ["XCODE_PATH", "APPLE_TEAM_ID"],
  signing: ["APPLE_SIGNING_CERT_P12", "APPLE_SIGNING_CERT_PASSWORD"],
  provisioning: ["APPLE_PROVISIONING_PROFILE"],
  appstore: ["APPSTORE_CONNECT_KEY_ID", "APPSTORE_CONNECT_ISSUER_ID", "APPSTORE_CONNECT_PRIVATE_KEY"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "ios.xcode", ...checkEnv(ENV.xcode) },
    { id: "ios.signing", ...checkEnv(ENV.signing) },
    { id: "ios.provisioning", ...checkEnv(ENV.provisioning) },
    { id: "ios.appstore", ...checkEnv(ENV.appstore) },
  ];
}

export interface IpaResult { artifactPath: string; sha256: string; sizeBytes: number; }

export async function detectXcode() { return requireEnv("ios.xcode", ENV.xcode); }
export async function loadSigning() {
  return { ...requireEnv("ios.signing", ENV.signing), ...requireEnv("ios.provisioning", ENV.provisioning) };
}
export async function buildIpa(_scheme: string): Promise<IpaResult> {
  requireEnv("ios.xcode", ENV.xcode);
  requireEnv("ios.signing", ENV.signing);
  throw new Error("ios.buildIpa requires macOS host with Xcode");
}
export async function uploadToAppStore(_ipa: IpaResult) {
  requireEnv("ios.appstore", ENV.appstore);
  throw new Error("ios.uploadToAppStore requires App Store Connect API key");
}
