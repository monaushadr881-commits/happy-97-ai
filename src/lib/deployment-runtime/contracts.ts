/**
 * R61 — Universal Deployment Runtime contracts.
 * Shared types between engine, validator, adapters, server fns.
 */

export type PlatformCode =
  | "web" | "pwa"
  | "android_apk" | "android_aab"
  | "ios" | "ipados"
  | "macos" | "windows" | "linux"
  | "chromeos"
  | "android_tv" | "wearos" | "visionpro";

export type BuildChannel = "production" | "staging" | "testing" | "development";
export type BuildStatus = "queued" | "running" | "succeeded" | "failed" | "blocked";
export type ArtifactKind =
  | "web_bundle" | "pwa" | "apk" | "aab" | "ipa"
  | "msi" | "dmg" | "appimage" | "deb" | "zip" | "other";
export type StoreCode = "google_play" | "app_store" | "microsoft_store" | "web";
export type StoreStatus = "ready" | "blocked" | "submitted" | "live";
export type ReadinessState = "working" | "partial" | "blocked" | "planned";

export interface ValidationCheck {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export interface ValidationReport {
  ok: boolean;
  checks: ValidationCheck[];
}

export interface AdapterPlanResult {
  platform_code: PlatformCode;
  steps: string[];
  required_dependencies: string[];
  can_execute_here: boolean;
  blocked_reason?: string;
}

export interface AdapterExecuteResult {
  status: BuildStatus;
  logs_url?: string;
  blocked_reason?: string;
  artifacts: Array<{
    kind: ArtifactKind;
    filename: string;
    size_bytes: number;
    sha256?: string;
    storage_url?: string;
    signed?: boolean;
    signing_identity?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface PlatformAdapter {
  code: PlatformCode;
  plan(): AdapterPlanResult;
  validate(): Promise<ValidationReport>;
  execute(opts: { channel: BuildChannel; version: string }): Promise<AdapterExecuteResult>;
}
