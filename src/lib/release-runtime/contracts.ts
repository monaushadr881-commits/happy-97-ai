/**
 * R63 — Enterprise Release & Store Automation Runtime contracts.
 * Extends R61 Deployment Runtime. No duplication of build engine.
 */

export type StoreCode =
  | "google_play" | "app_store" | "microsoft_store"
  | "amazon_appstore" | "samsung_galaxy" | "huawei_appgallery"
  | "web" | "pwa";

export type ReleaseChannel = "rc" | "beta" | "stable" | "lts" | "hotfix";
export type ReleaseStatus = "pending" | "validating" | "ready" | "released" | "rolled_back" | "failed";
export type SubmissionStatus =
  | "planned" | "ready" | "submitted" | "in_review"
  | "live" | "rejected" | "blocked" | "rolled_back";

export type ChangelogCategory =
  | "feature" | "fix" | "security" | "breaking"
  | "known_issue" | "deprecated" | "performance";

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;   // e.g. "rc.1", "beta.3"
  build?: string;        // e.g. "sha.abc123"
}

export interface StoreValidationCheck {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export interface StoreValidationReport {
  store: StoreCode;
  ok: boolean;
  checks: StoreValidationCheck[];
  missing_requirements: string[];
}

/** Store-submission adapter — validation + readiness only.
 * Actual submission is BLOCKED without external credentials; adapters return
 * the exact missing dependency list rather than fabricating success. */
export interface StoreAdapter {
  store: StoreCode;
  validate(input: { version: string; channel: ReleaseChannel }): Promise<StoreValidationReport>;
  submissionPlan(): {
    can_submit_here: boolean;
    required_credentials: string[];
    blocked_reason?: string;
  };
}
