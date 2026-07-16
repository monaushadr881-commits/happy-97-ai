/** R67 UABR — Universal AI Builder Runtime. Shared contracts. */

export type UabrMode =
  | "website" | "pwa" | "android" | "ios" | "desktop"
  | "backend" | "frontend" | "complete" | "enterprise";

export type UabrIndustry =
  | "restaurant" | "hotel" | "cafe" | "cloud_kitchen"
  | "hospital" | "clinic" | "medical_store" | "laboratory"
  | "school" | "college" | "university" | "library"
  | "ngo" | "government"
  | "retail" | "wholesale" | "manufacturing" | "factory" | "construction"
  | "real_estate" | "finance" | "insurance" | "banking" | "logistics"
  | "travel" | "salon" | "spa" | "gym" | "event_management"
  | "marketplace" | "ecommerce" | "corporate" | "portfolio" | "ai_saas"
  | "custom";

export type UabrRisk = "low" | "medium" | "high" | "critical";
export type UabrStepStatus = "pending" | "ready" | "blocked" | "in_progress" | "done";
export type UabrBuildStatus =
  | "planning" | "designing" | "generating" | "optimizing"
  | "testing" | "documenting" | "packaging"
  | "ready" | "blocked" | "completed";

export interface UabrExternalDeps {
  toolchain?: string[];
  secrets?: string[];
  accounts?: string[];
  certificates?: string[];
  environment?: string[];
}

export interface UabrStep {
  order: number;
  title: string;
  detail?: string;
  category:
    | "planning" | "design" | "database" | "backend" | "frontend"
    | "documentation" | "testing" | "deployment" | "native_build" | "publishing";
  risk: UabrRisk;
  status: UabrStepStatus;
  files?: string[];
  external?: UabrExternalDeps;
  blocked_reason?: string;
}

export interface UabrProjectPlan {
  summary: string;
  project_name: string;
  domain: string;
  industry: UabrIndustry;
  modes: UabrMode[];
  features: string[];
  modules: string[];
  roles: string[];
  permissions: string[];
  pages: string[];
  api_endpoints: string[];
  database_tables: string[];
  security: string[];
  accessibility: string[];
  seo: string[];
  performance: string[];
  timeline_days: number;
  estimated_credits: number;
  complexity: "small" | "medium" | "large" | "enterprise";
  steps: UabrStep[];
  external_dependencies: UabrExternalDeps;
  blocked_reason?: string;
}

export interface UabrDesignKit {
  brand_name: string;
  logo_concept: string;
  typography: { heading: string; body: string };
  palette: { name: string; hex: string; role: string }[];
  tokens: Record<string, string>;
  wireframes: { name: string; sections: string[] }[];
}

export interface UabrDatabasePlan {
  tables: { name: string; columns: { name: string; type: string; notes?: string }[]; rls: string[] }[];
  relationships: { from: string; to: string; kind: "one-to-many" | "many-to-many" | "one-to-one" }[];
  indexes: string[];
  storage_buckets: string[];
  seed_hints: string[];
}

export interface UabrBackendPlan {
  endpoints: { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string; purpose: string; auth: "public" | "user" | "admin" }[];
  realtime_channels: string[];
  jobs: string[];
  webhooks: string[];
  audit: string[];
  rate_limits: string[];
}

export interface UabrFrontendPlan {
  layouts: string[];
  pages: { path: string; kind: "public" | "app" | "admin" | "founder"; sections: string[] }[];
  components: string[];
  hooks: string[];
  forms: string[];
  charts: string[];
  responsive: string[];
}

export interface UabrDocsPlan {
  files: { path: string; purpose: string }[];
}

export interface UabrTestPlan {
  suites: { name: string; kind: "unit" | "integration" | "e2e" | "perf" | "a11y" | "security"; count: number }[];
}

export interface UabrDeployPlan {
  targets: { name: string; status: UabrStepStatus; blocked_reason?: string; external?: UabrExternalDeps }[];
  release_channel: "internal" | "beta" | "production";
  rollback: string;
}

export const NATIVE_BLOCK: Record<"android" | "ios" | "desktop", UabrExternalDeps & { reason: string }> = {
  android: {
    reason: "Android native build toolchain not provisioned in the sandbox.",
    toolchain: ["Android SDK", "JDK 17", "Gradle"],
    secrets: ["ANDROID_KEYSTORE_BASE64", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD"],
    accounts: ["Google Play Console"],
    certificates: ["Upload keystore"],
  },
  ios: {
    reason: "iOS native build requires macOS + Xcode; unavailable in the sandbox.",
    toolchain: ["Xcode", "macOS host", "CocoaPods", "fastlane"],
    secrets: ["APPLE_APP_SPECIFIC_PASSWORD", "APPSTORE_CONNECT_API_KEY"],
    accounts: ["Apple Developer Program"],
    certificates: ["Distribution certificate", "Provisioning profile"],
  },
  desktop: {
    reason: "Desktop packaging (msix/dmg/appimage) requires per-OS toolchains not present.",
    toolchain: ["electron-builder OR tauri", "Windows/macOS/Linux hosts"],
    secrets: ["MSIX_SIGNING_CERT", "APPLE_DEVELOPER_ID_CERT"],
    accounts: ["Microsoft Partner Center (optional)", "Apple Developer (optional)"],
  },
};
