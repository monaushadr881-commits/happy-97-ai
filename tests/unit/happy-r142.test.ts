/**
 * R142 External Integration & Production Wiring™
 * - Every new family reports readiness without throwing.
 * - Managed surfaces (Lovable Cloud auth extras) report configured=true.
 * - No duplicate adapter IDs across families.
 * - Invoking an unconfigured provider throws AdapterNotConfiguredError.
 */
import { describe, it, expect } from "vitest";
import {
  adapterReadiness,
  adapterReadinessFlat,
  iap,
  sms,
  whatsapp,
  ai,
  storage,
  maps,
  analytics,
  social,
  authExtra,
  AdapterNotConfiguredError,
} from "@/lib/happy-adapters";

describe("R142 adapter families", () => {
  it("expose readiness for every new family", () => {
    const r = adapterReadiness();
    expect(r.iap.length).toBeGreaterThanOrEqual(2);
    expect(r.sms.length).toBeGreaterThanOrEqual(3);
    expect(r.whatsapp.length).toBeGreaterThanOrEqual(2);
    expect(r.ai.length).toBeGreaterThanOrEqual(5);
    expect(r.storage.length).toBeGreaterThanOrEqual(5);
    expect(r.maps.length).toBeGreaterThanOrEqual(4);
    expect(r.analytics.length).toBeGreaterThanOrEqual(5);
    expect(r.social.length).toBeGreaterThanOrEqual(6);
    expect(r.authExtra.length).toBeGreaterThanOrEqual(3);
  });

  it("readiness entries have stable shape", () => {
    for (const row of adapterReadinessFlat()) {
      expect(typeof row.id).toBe("string");
      expect(typeof row.configured).toBe("boolean");
      expect(Array.isArray(row.missing)).toBe(true);
    }
  });

  it("no duplicate adapter ids across families", () => {
    const ids = adapterReadinessFlat().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("managed surfaces report configured=true without credentials", () => {
    const extras = authExtra.readiness();
    expect(extras.find((e) => e.id === "auth.magic_link")?.configured).toBe(true);
    expect(extras.find((e) => e.id === "auth.phone_otp")?.configured).toBe(true);
    const g = maps.readiness().find((e) => e.id === "maps.geolocation_browser");
    expect(g?.configured).toBe(true);
  });

  it("invoking unconfigured providers throws AdapterNotConfiguredError", async () => {
    await expect(iap.googlePlayBilling.verifyReceipt({ platform: "android", productId: "x", token: "t", userId: "u" }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(sms.twilio.send({ to: "+1", body: "hi" }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(whatsapp.cloudApi.send({ to: "+1", text: "hi" }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(ai.openai.chat({ model: "x", messages: [] }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
  });

  it("storage/social/analytics readiness expose the required providers", () => {
    const ids = adapterReadinessFlat().map((r) => r.id);
    for (const need of [
      "iap.google_play", "iap.apple",
      "sms.twilio", "whatsapp.cloud_api",
      "ai.openai", "ai.gemini", "ai.anthropic", "ai.local", "ai.lovable_gateway",
      "storage.supabase", "storage.s3", "storage.gdrive",
      "maps.google", "maps.geolocation_browser",
      "analytics.sentry_crash", "analytics.posthog", "analytics.datadog_perf",
      "social.instagram", "social.facebook", "social.youtube", "social.linkedin", "social.x",
      "auth.magic_link", "auth.phone_otp", "auth.passkeys",
    ]) {
      expect(ids).toContain(need);
    }
  });
});
