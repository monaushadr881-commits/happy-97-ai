/**
 * In-App Purchase adapters — Google Play Billing (Android) and Apple StoreKit
 * (iOS). Server-side receipt validation only; the client SDK is invoked from
 * the native shell (Capacitor plugin). Readiness reflects the credentials the
 * verifier needs; the actual native purchase surface lives in the mobile
 * adapters (`mobile/android`, `mobile/ios`).
 */
import { AdapterStatus, checkEnv, AdapterNotConfiguredError, env } from "../types";

export interface IapReceipt { platform: "android" | "ios"; productId: string; token: string; userId: string; }
export interface IapAdapter {
  id: string;
  isConfigured(): boolean;
  verifyReceipt(r: IapReceipt): Promise<{ ok: boolean; purchaseState?: string; expiresAt?: number }>;
}

function guard(id: string, envs: string[]) {
  const c = checkEnv(envs);
  if (!c.configured) throw new AdapterNotConfiguredError(id, c.missing);
}

export const googlePlayBilling: IapAdapter = {
  id: "iap.google_play",
  isConfigured: () => checkEnv(["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_PACKAGE_NAME"]).configured,
  async verifyReceipt(r) {
    guard(this.id, ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_PACKAGE_NAME"]);
    // Contract: exchange service-account JWT → Play Developer API v3 purchases.products.get
    // Left as architecture-ready; native SDK dependency documented in registry.
    void r; throw new Error("iap.google_play: server verifier requires Play Developer API JWT exchange");
  },
};

export const appleIap: IapAdapter = {
  id: "iap.apple",
  isConfigured: () => checkEnv(["APPSTORE_CONNECT_KEY_ID", "APPSTORE_CONNECT_ISSUER_ID", "APPSTORE_CONNECT_PRIVATE_KEY", "APPLE_IAP_SHARED_SECRET"]).configured,
  async verifyReceipt(r) {
    guard(this.id, ["APPSTORE_CONNECT_KEY_ID", "APPSTORE_CONNECT_ISSUER_ID", "APPSTORE_CONNECT_PRIVATE_KEY", "APPLE_IAP_SHARED_SECRET"]);
    void env; void r; throw new Error("iap.apple: App Store Server API JWT signer not bundled");
  },
};

export const registry: Record<string, IapAdapter> = { googlePlayBilling, appleIap };

export function readiness(): AdapterStatus[] {
  const envsFor: Record<string, string[]> = {
    "iap.google_play": ["GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "ANDROID_PACKAGE_NAME"],
    "iap.apple": ["APPSTORE_CONNECT_KEY_ID", "APPSTORE_CONNECT_ISSUER_ID", "APPSTORE_CONNECT_PRIVATE_KEY", "APPLE_IAP_SHARED_SECRET"],
  };
  return Object.values(registry).map((a) => ({ id: a.id, ...checkEnv(envsFor[a.id] ?? []) }));
}
