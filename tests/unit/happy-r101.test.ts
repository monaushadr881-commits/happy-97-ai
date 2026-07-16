import { describe, it, expect } from "vitest";
import {
  adapterReadiness,
  AdapterNotConfiguredError,
  voice,
  payments,
  email,
  push,
  digitalHuman,
  android,
  ios,
  desktop,
  deployment,
  auth,
} from "@/lib/happy-adapters";

describe("R101 external integration adapters", () => {
  it("aggregate readiness returns all categories", () => {
    const r = adapterReadiness();
    for (const k of ["android", "ios", "desktop", "digitalHuman", "voice", "payments", "email", "push", "auth", "deployment"]) {
      expect(r).toHaveProperty(k);
      expect(Array.isArray((r as any)[k])).toBe(true);
    }
  });

  it("all adapters expose {id, configured, missing}", () => {
    const r = adapterReadiness();
    for (const list of Object.values(r)) {
      for (const s of list as any[]) {
        expect(typeof s.id).toBe("string");
        expect(typeof s.configured).toBe("boolean");
        expect(Array.isArray(s.missing)).toBe(true);
      }
    }
  });

  it("without credentials, adapters fail gracefully with AdapterNotConfiguredError", async () => {
    await expect(payments.razorpay.createIntent({ amountMinor: 1, currency: "INR", userId: "u" }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(email.resend.send({ to: "a@b.c", from: "x@y.z", subject: "t", text: "t" }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(push.fcm.send({ to: "d", title: "t", body: "b" }))
      .rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(digitalHuman.live2d.connect()).rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(deployment.netlify.deploy({ artifactPath: "/x" })).rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(android.detectSdk()).rejects.toBeInstanceOf(AdapterNotConfiguredError);
    await expect(ios.detectXcode()).rejects.toBeInstanceOf(AdapterNotConfiguredError);
    expect(desktop.readiness().every((s) => !s.configured)).toBe(true);
  });

  it("voice.pickFor returns null when no adapter configured", () => {
    expect(voice.pickFor("stt")).toBeNull();
    expect(voice.pickFor("tts")).toBeNull();
    expect(voice.pickFor("realtime")).toBeNull();
  });

  it("auth readiness includes managed google + apple", () => {
    const ids = auth.readiness().map((s: any) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["auth.google", "auth.apple", "auth.microsoft", "auth.github", "auth.linkedin", "auth.facebook"]));
  });
});
