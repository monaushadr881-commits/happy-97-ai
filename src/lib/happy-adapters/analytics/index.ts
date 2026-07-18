/**
 * Analytics / monitoring adapters. Feed the canonical analytics runtime
 * (`analytics-v7`) and Founder Dashboard (`happy-r130`). Do not create a
 * second analytics store.
 */
import { AdapterStatus, checkEnv } from "../types";

const ENV = {
  sentry: ["SENTRY_DSN"],
  posthog: ["POSTHOG_API_KEY", "POSTHOG_HOST"],
  plausible: ["PLAUSIBLE_DOMAIN"],
  datadog: ["DATADOG_API_KEY", "DATADOG_APP_KEY"],
  ga4: ["GA4_MEASUREMENT_ID", "GA4_API_SECRET"],
};

export function readiness(): AdapterStatus[] {
  return [
    { id: "analytics.sentry_crash", ...checkEnv(ENV.sentry) },
    { id: "analytics.posthog", ...checkEnv(ENV.posthog) },
    { id: "analytics.plausible", ...checkEnv(ENV.plausible) },
    { id: "analytics.datadog_perf", ...checkEnv(ENV.datadog) },
    { id: "analytics.ga4", ...checkEnv(ENV.ga4) },
  ];
}
