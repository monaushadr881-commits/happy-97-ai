/**
 * HAPPY External Integration Adapters (R101 + R142 wiring completion)
 *
 * Expansion-only adapter layer. Every adapter:
 *  - reuses existing HAPPY runtime (no duplicate systems)
 *  - is configured via environment variables
 *  - reports readiness (`isConfigured`) without throwing
 *  - throws a typed `AdapterNotConfiguredError` when invoked without credentials
 *
 * R142 adds: iap (Google Play + Apple), sms, whatsapp, ai, storage, maps,
 * analytics, social publishing, auth-extra (magic link / phone / passkeys).
 * All new adapters ROUTE INTO existing canonical owners — no second runtime.
 */

export * from "./types";
export * as android from "./mobile/android";
export * as ios from "./mobile/ios";
export * as desktop from "./desktop";
export * as digitalHuman from "./digital-human";
export * as voice from "./voice";
export * as payments from "./payments";
export * as iap from "./payments/iap";
export * as email from "./email";
export * as sms from "./sms";
export * as whatsapp from "./whatsapp";
export * as push from "./push";
export * as auth from "./auth";
export * as authExtra from "./auth-extra";
export * as ai from "./ai";
export * as storage from "./storage";
export * as maps from "./maps";
export * as analytics from "./analytics";
export * as social from "./social";
export * as deployment from "./deployment";

import * as android from "./mobile/android";
import * as ios from "./mobile/ios";
import * as desktop from "./desktop";
import * as digitalHuman from "./digital-human";
import * as voice from "./voice";
import * as payments from "./payments";
import * as iap from "./payments/iap";
import * as email from "./email";
import * as sms from "./sms";
import * as whatsapp from "./whatsapp";
import * as push from "./push";
import * as auth from "./auth";
import * as authExtra from "./auth-extra";
import * as ai from "./ai";
import * as storage from "./storage";
import * as maps from "./maps";
import * as analytics from "./analytics";
import * as social from "./social";
import * as deployment from "./deployment";

/** Aggregate readiness map for the Founder Ops dashboard. */
export function adapterReadiness() {
  return {
    android: android.readiness(),
    ios: ios.readiness(),
    desktop: desktop.readiness(),
    digitalHuman: digitalHuman.readiness(),
    voice: voice.readiness(),
    payments: payments.readiness(),
    iap: iap.readiness(),
    email: email.readiness(),
    sms: sms.readiness(),
    whatsapp: whatsapp.readiness(),
    push: push.readiness(),
    auth: auth.readiness(),
    authExtra: authExtra.readiness(),
    ai: ai.readiness(),
    storage: storage.readiness(),
    maps: maps.readiness(),
    analytics: analytics.readiness(),
    social: social.readiness(),
    deployment: deployment.readiness(),
  } as const;
}

/** Flat list for UI tables / registry export. */
export function adapterReadinessFlat() {
  const grouped = adapterReadiness();
  return Object.entries(grouped).flatMap(([family, entries]) =>
    (entries as Array<{ id: string; configured: boolean; missing: string[] }>).map((e) => ({ family, ...e })),
  );
}
