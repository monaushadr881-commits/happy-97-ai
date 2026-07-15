/** R64 — shared contract types for Release Engineering & Distribution. */

export type ArtifactKind =
  | "apk" | "aab" | "ipa" | "msix" | "exe" | "dmg" | "pkg"
  | "appimage" | "snap" | "flatpak" | "docker"
  | "source" | "sourcemap" | "crash_symbol" | "debug_symbol" | "other";

export type PipelineStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "blocked";
export type BuildKind = "incremental" | "clean" | "nightly" | "manual" | "scheduled";

export type RolloutState = "planned" | "active" | "paused" | "cancelled" | "rolled_back" | "completed";
export type RolloutPercent = 0 | 1 | 5 | 10 | 20 | 50 | 100;

export type StoreCode =
  | "google_play" | "app_store" | "microsoft_store" | "amazon_appstore"
  | "samsung_galaxy" | "huawei_appgallery" | "enterprise_direct" | "web";

export type CheckStatus = "pass" | "warn" | "fail" | "blocked";

export interface BlockedReport {
  status: "blocked";
  reason: string;
  required_secrets?: string[];
  required_accounts?: string[];
  required_toolchain?: string[];
}

export interface StoreMonitorSnapshot {
  store: StoreCode;
  status: "ok" | "blocked";
  blocked_reason?: string;
  required_secrets?: string[];
  data?: {
    downloads?: number;
    installs?: number;
    rating_avg?: number;
    crash_free_rate?: number;
  };
}

export const ROLLOUT_STEPS: RolloutPercent[] = [1, 5, 10, 20, 50, 100];

export const STORE_CODES: StoreCode[] = [
  "google_play", "app_store", "microsoft_store", "amazon_appstore",
  "samsung_galaxy", "huawei_appgallery", "enterprise_direct", "web",
];

export const ARTIFACT_KINDS: ArtifactKind[] = [
  "apk","aab","ipa","msix","exe","dmg","pkg","appimage","snap","flatpak","docker",
  "source","sourcemap","crash_symbol","debug_symbol","other",
];
