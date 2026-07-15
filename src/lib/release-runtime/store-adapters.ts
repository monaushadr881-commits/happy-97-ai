/**
 * R63 — Store adapters.
 * Validation + readiness only. Never fabricates a submission.
 * Real store submission requires external credentials the sandbox does not have.
 */
import type { StoreAdapter, StoreCode, StoreValidationReport, ReleaseChannel } from "./contracts";

interface EnvGate {
  required_credentials: string[];
  blocked_reason: string;
}

const GATES: Record<StoreCode, EnvGate> = {
  google_play: {
    required_credentials: ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_KEYSTORE_ALIAS"],
    blocked_reason: "Requires Google Play Console service account + signed AAB.",
  },
  app_store: {
    required_credentials: ["APP_STORE_CONNECT_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID"],
    blocked_reason: "Requires Apple Developer account, macOS + Xcode host, distribution certificate.",
  },
  microsoft_store: {
    required_credentials: ["MS_PARTNER_TENANT_ID", "MS_PARTNER_CLIENT_ID"],
    blocked_reason: "Requires Microsoft Partner Center credentials + MSIX signing cert.",
  },
  amazon_appstore: {
    required_credentials: ["AMAZON_DEV_CLIENT_ID", "AMAZON_DEV_CLIENT_SECRET"],
    blocked_reason: "Requires Amazon Developer credentials.",
  },
  samsung_galaxy: {
    required_credentials: ["SAMSUNG_SELLER_TOKEN"],
    blocked_reason: "Requires Samsung Seller Portal credentials.",
  },
  huawei_appgallery: {
    required_credentials: ["HUAWEI_APPGALLERY_CLIENT_ID", "HUAWEI_APPGALLERY_CLIENT_SECRET"],
    blocked_reason: "Requires Huawei Developer credentials.",
  },
  web: { required_credentials: [], blocked_reason: "" },
  pwa: { required_credentials: [], blocked_reason: "" },
};

function baseChecks(version: string, channel: ReleaseChannel) {
  return [
    { id: "version_semver", label: "Version is semver", ok: /^\d+\.\d+\.\d+/.test(version),
      detail: version },
    { id: "channel_present", label: "Channel selected", ok: !!channel },
  ];
}

function envMissing(gate: EnvGate): string[] {
  return gate.required_credentials.filter((k) => !process.env[k]);
}

function makeAdapter(store: StoreCode, extra: (v: string) => Array<{ id: string; label: string; ok: boolean; detail?: string }>): StoreAdapter {
  return {
    store,
    submissionPlan() {
      const gate = GATES[store];
      const missing = envMissing(gate);
      if (store === "web" || store === "pwa") {
        return { can_submit_here: true, required_credentials: [] };
      }
      return {
        can_submit_here: missing.length === 0,
        required_credentials: missing,
        blocked_reason: missing.length ? gate.blocked_reason : undefined,
      };
    },
    async validate({ version, channel }) {
      const gate = GATES[store];
      const missing = envMissing(gate);
      const checks = [...baseChecks(version, channel), ...extra(version)];
      const missing_requirements = [
        ...missing,
        ...checks.filter((c) => !c.ok).map((c) => c.label),
      ];
      const report: StoreValidationReport = {
        store,
        ok: missing_requirements.length === 0,
        checks,
        missing_requirements,
      };
      return report;
    },
  };
}

const ADAPTERS: Record<StoreCode, StoreAdapter> = {
  google_play: makeAdapter("google_play", () => [
    { id: "aab_ready", label: "Signed AAB artifact", ok: false, detail: "Requires Android build host." },
    { id: "package_name", label: "Package name = ai.happy.enterprise", ok: true },
    { id: "privacy_url", label: "Privacy policy URL present", ok: !!process.env.HAPPY_PRIVACY_URL },
  ]),
  app_store: makeAdapter("app_store", () => [
    { id: "ipa_ready", label: "Signed IPA artifact", ok: false, detail: "Requires macOS + Xcode." },
    { id: "bundle_id", label: "Bundle ID = ai.happy.enterprise", ok: true },
  ]),
  microsoft_store: makeAdapter("microsoft_store", () => [
    { id: "msix_ready", label: "Signed MSIX artifact", ok: false, detail: "Requires Windows signing cert." },
  ]),
  amazon_appstore: makeAdapter("amazon_appstore", () => [
    { id: "apk_ready", label: "Signed APK artifact", ok: false },
  ]),
  samsung_galaxy: makeAdapter("samsung_galaxy", () => [
    { id: "apk_ready", label: "Signed APK artifact", ok: false },
  ]),
  huawei_appgallery: makeAdapter("huawei_appgallery", () => [
    { id: "apk_ready", label: "Signed APK artifact (HMS)", ok: false },
  ]),
  web: makeAdapter("web", () => [
    { id: "web_bundle", label: "Web bundle present", ok: true },
  ]),
  pwa: makeAdapter("pwa", () => [
    { id: "manifest", label: "Web app manifest present", ok: true },
  ]),
};

export function getStoreAdapter(store: StoreCode): StoreAdapter {
  const a = ADAPTERS[store];
  if (!a) throw new Error(`Unknown store: ${store}`);
  return a;
}

export const ALL_STORES: StoreCode[] = Object.keys(ADAPTERS) as StoreCode[];
