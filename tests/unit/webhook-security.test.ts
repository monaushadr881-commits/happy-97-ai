import { describe, it, expect, beforeEach } from "vitest";
import {
  hmacSha256Hex,
  timingSafeEqual,
  verifyWebhook,
  isReplay,
  __resetReplayCacheForTests,
} from "@/lib/webhook-security";

describe("webhook security", () => {
  beforeEach(() => __resetReplayCacheForTests());

  it("hmacSha256Hex is deterministic and hex-encoded", async () => {
    const a = await hmacSha256Hex("secret", "hello");
    const b = await hmacSha256Hex("secret", "hello");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hmacSha256Hex changes with secret/message", async () => {
    const a = await hmacSha256Hex("s1", "m");
    const b = await hmacSha256Hex("s2", "m");
    const c = await hmacSha256Hex("s1", "m2");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it("timingSafeEqual only true for exact match", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("verifyWebhook rejects missing fields", async () => {
    const r = await verifyWebhook({ body: "", signature: "", secret: "" });
    expect(r).toEqual({ ok: false, reason: "missing" });
  });

  it("verifyWebhook accepts a correctly-signed body", async () => {
    const body = '{"x":1}';
    const sig = await hmacSha256Hex("k", body);
    const r = await verifyWebhook({ body, signature: sig, secret: "k" });
    expect(r.ok).toBe(true);
  });

  it("verifyWebhook rejects bad signature", async () => {
    const r = await verifyWebhook({ body: "b", signature: "deadbeef".repeat(8), secret: "k" });
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("verifyWebhook enforces timestamp tolerance", async () => {
    const body = "b";
    const ts = Math.floor(Date.now() / 1000) - 10_000;
    const sig = await hmacSha256Hex("k", `${ts}.${body}`);
    const r = await verifyWebhook({ body, signature: sig, secret: "k", timestamp: ts });
    expect(r).toEqual({ ok: false, reason: "expired" });
  });

  it("verifyWebhook accepts fresh timestamp", async () => {
    const body = "b";
    const ts = Math.floor(Date.now() / 1000);
    const sig = await hmacSha256Hex("k", `${ts}.${body}`);
    const r = await verifyWebhook({ body, signature: sig, secret: "k", timestamp: ts });
    expect(r.ok).toBe(true);
  });

  it("verifyWebhook flags replayed deliveryId", async () => {
    const body = "b";
    const sig = await hmacSha256Hex("k", body);
    const first = await verifyWebhook({ body, signature: sig, secret: "k", deliveryId: "d1" });
    const second = await verifyWebhook({ body, signature: sig, secret: "k", deliveryId: "d1" });
    expect(first.ok).toBe(true);
    expect(second).toEqual({ ok: false, reason: "replay" });
  });

  it("isReplay flags second call for same id", () => {
    expect(isReplay("x", 60)).toBe(false);
    expect(isReplay("x", 60)).toBe(true);
    expect(isReplay("y", 60)).toBe(false);
  });
});
