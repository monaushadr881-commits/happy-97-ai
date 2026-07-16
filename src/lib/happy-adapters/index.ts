/**
 * HAPPY External Integration Adapters (R101)
 *
 * Expansion-only adapter layer. Every adapter:
 *  - reuses existing HAPPY runtime (no duplicate systems)
 *  - is configured via environment variables
 *  - reports readiness (`isConfigured`) without throwing
 *  - throws a typed `AdapterNotConfiguredError` when invoked without credentials
 *
 * NOTHING in this folder performs a live provider call unless credentials
 * are present. This is the seam where SDKs / accounts / assets plug in.
 */

export * from "./types";
export * as android from "./mobile/android";
export * as ios from "./mobile/ios";
export * as desktop from "./desktop";
export * as digitalHuman from "./digital-human";
export * as voice from "./voice";
export * as payments from "./payments";
export * as email from "./email";
export * as push from "./push";
export * as auth from "./auth";
export * as deployment from "./deployment";

import * as android from "./mobile/android";
import * as ios from "./mobile/ios";
import * as desktop from "./desktop";
import * as digitalHuman from "./digital-human";
import * as voice from "./voice";
import * as payments from "./payments";
import * as email from "./email";
import * as push from "./push";
import * as auth from "./auth";
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
    email: email.readiness(),
    push: push.readiness(),
    auth: auth.readiness(),
    deployment: deployment.readiness(),
  } as const;
}
