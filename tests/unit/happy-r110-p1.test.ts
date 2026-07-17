/** R110 P1 — Digital Human polish extensions (gesture cues, posture,
 *  voice fallback, interruption). Pure-function tests. */
import { describe, it, expect } from "vitest";
import {
  gestureFor,
  postureFor,
  voiceFallbackOnError,
  voiceFallbackOnRecovery,
  nextStateOnInterrupt,
  INITIAL_VOICE_FALLBACK,
  classifyIntent,
} from "@/components/digital-human/conversation-engine";

describe("R110 P1 — gesture cues", () => {
  it("maps greeting/farewell/congrats to matching gestures", () => {
    expect(gestureFor("greeting")).toBe("greeting");
    expect(gestureFor("farewell")).toBe("goodbye");
    expect(gestureFor("congrats")).toBe("celebrate");
    expect(gestureFor("warning")).toBe("point");
    expect(gestureFor("teaching")).toBe("teaching");
    expect(gestureFor("general")).toBe("none");
  });

  it("classifyIntent → gestureFor produces stable ids", () => {
    expect(gestureFor(classifyIntent("hello there"))).toBe("greeting");
    expect(gestureFor(classifyIntent("goodbye"))).toBe("goodbye");
    expect(gestureFor(classifyIntent("thank you so much"))).toBe("celebrate");
  });
});

describe("R110 P1 — posture cues", () => {
  it("returns the state name for listening/thinking/speaking", () => {
    expect(postureFor("listening")).toBe("listening");
    expect(postureFor("thinking")).toBe("thinking");
    expect(postureFor("speaking")).toBe("speaking");
    expect(postureFor("idle")).toBe("idle");
  });
  it("uses greeting posture when speaking a greeting", () => {
    expect(postureFor("speaking", "greeting")).toBe("greeting");
  });
});

describe("R110 P1 — TTS fallback", () => {
  it("switches to subtitles on error with backoff", () => {
    const s1 = voiceFallbackOnError(INITIAL_VOICE_FALLBACK, new Error("boom"));
    expect(s1.mode).toBe("subtitles");
    expect(s1.attempt).toBe(1);
    expect(s1.retryAfterMs).toBeGreaterThanOrEqual(1000);
    const s2 = voiceFallbackOnError(s1, new Error("boom2"));
    expect(s2.attempt).toBe(2);
    expect(s2.retryAfterMs).toBeGreaterThan(s1.retryAfterMs);
    expect(s2.retryAfterMs).toBeLessThanOrEqual(30_000);
  });
  it("recovery resets to voice", () => {
    const r = voiceFallbackOnRecovery();
    expect(r.mode).toBe("voice");
    expect(r.attempt).toBe(0);
    expect(r.reason).toBeNull();
  });
});

describe("R110 P1 — interruption", () => {
  it("only interrupts mid-turn states", () => {
    expect(nextStateOnInterrupt("speaking")).toBe("interrupted");
    expect(nextStateOnInterrupt("thinking")).toBe("interrupted");
    expect(nextStateOnInterrupt("idle")).toBe("idle");
    expect(nextStateOnInterrupt("finished")).toBe("finished");
  });
});
