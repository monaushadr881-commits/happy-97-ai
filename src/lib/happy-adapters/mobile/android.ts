/** Android build & release adapters (SDK / Gradle / signing / Play). */
import { AdapterStatus, checkEnv, requireEnv } from "../types";

const ENV = {
  sdk: ["ANDROID_SDK_ROOT"],
  gradle: ["ANDROID_GRADLE_HOME"],
  keystore: ["ANDROID_KEYSTORE_PATH", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"],
  play: ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_PACKAGE_NAME"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "android.sdk", ...checkEnv(ENV.sdk) },
    { id: "android.gradle", ...checkEnv(ENV.gradle) },
    { id: "android.keystore", ...checkEnv(ENV.keystore) },
    { id: "android.play", ...checkEnv(ENV.play) },
  ];
}

export interface BuildRequest { module: string; variant: "debug" | "release"; format: "apk" | "aab"; }
export interface BuildResult { artifactPath: string; sha256: string; sizeBytes: number; format: "apk" | "aab"; }

export async function detectSdk() { return requireEnv("android.sdk", ENV.sdk); }
export async function loadKeystore() { return requireEnv("android.keystore", ENV.keystore); }
export async function buildArtifact(_req: BuildRequest): Promise<BuildResult> {
  requireEnv("android.sdk", ENV.sdk);
  requireEnv("android.gradle", ENV.gradle);
  requireEnv("android.keystore", ENV.keystore);
  throw new Error("android.buildArtifact requires Android SDK + Gradle daemon in build host");
}
export async function uploadToPlay(_artifact: BuildResult, _track: "internal" | "alpha" | "beta" | "production") {
  requireEnv("android.play", ENV.play);
  throw new Error("android.uploadToPlay requires Google Play Developer API access");
}
