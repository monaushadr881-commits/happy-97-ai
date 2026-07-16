/** R64 — Store monitors. Never fabricates credentials. */
import type { StoreCode, StoreMonitorSnapshot } from "./contracts";
import { STORE_CODES } from "./contracts";

interface Gate {
  required_secrets: string[];
  required_accounts?: string[];
  reason: string;
}

const GATES: Record<StoreCode, Gate> = {
  google_play: {
    required_secrets: ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_KEYSTORE_ALIAS"],
    required_accounts: ["Google Play Console"],
    reason: "Google Play Console service account and signed AAB required.",
  },
  app_store: {
    required_secrets: ["APP_STORE_CONNECT_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID", "APP_STORE_CONNECT_PRIVATE_KEY"],
    required_accounts: ["Apple Developer Program", "App Store Connect"],
    reason: "Apple Developer + App Store Connect API key required; distribution cert + macOS host needed to build.",
  },
  microsoft_store: {
    required_secrets: ["MS_PARTNER_TENANT_ID", "MS_PARTNER_CLIENT_ID", "MS_PARTNER_CLIENT_SECRET"],
    required_accounts: ["Microsoft Partner Center"],
    reason: "Partner Center credentials and MSIX signing certificate required.",
  },
  amazon_appstore: {
    required_secrets: ["AMAZON_DEV_CLIENT_ID", "AMAZON_DEV_CLIENT_SECRET"],
    required_accounts: ["Amazon Developer"],
    reason: "Amazon Developer credentials required.",
  },
  samsung_galaxy: {
    required_secrets: ["SAMSUNG_SELLER_TOKEN"],
    required_accounts: ["Samsung Seller Portal"],
    reason: "Samsung Seller Portal token required.",
  },
  huawei_appgallery: {
    required_secrets: ["HUAWEI_APPGALLERY_CLIENT_ID", "HUAWEI_APPGALLERY_CLIENT_SECRET"],
    required_accounts: ["Huawei Developer"],
    reason: "Huawei Developer credentials required.",
  },
  enterprise_direct: { required_secrets: [], reason: "" },
  web: { required_secrets: [], reason: "" },
};

function missing(gate: Gate): string[] {
  return gate.required_secrets.filter((k) => !process.env[k]);
}

export function monitorStore(store: StoreCode): StoreMonitorSnapshot {
  const gate = GATES[store];
  if (!gate) return { store, status: "blocked", blocked_reason: `unknown store: ${store}` };
  if (store === "web" || store === "enterprise_direct") {
    return { store, status: "ok", data: {} };
  }
  const miss = missing(gate);
  if (miss.length) {
    return { store, status: "blocked", blocked_reason: gate.reason, required_secrets: miss };
  }
  // Credentials present, but real API integration is not implemented in Worker runtime.
  return {
    store,
    status: "blocked",
    blocked_reason: "Credentials present, but real store API adapter is not enabled in this runtime.",
    required_secrets: [],
  };
}

export function monitorAllStores(): StoreMonitorSnapshot[] {
  return STORE_CODES.map(monitorStore);
}

export function storeReadiness(store: StoreCode) {
  const gate = GATES[store];
  if (!gate) return { store, ready: false, reason: "unknown store" };
  const miss = missing(gate);
  return {
    store,
    ready: miss.length === 0 && (store === "web" || store === "enterprise_direct"),
    missing_secrets: miss,
    required_accounts: gate.required_accounts ?? [],
    reason: gate.reason,
  };
}
