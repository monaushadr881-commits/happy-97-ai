import { describe, it, expect } from "vitest";
import {
  nextBlinkDelay, breathingAmplitude, smileFromSentiment,
  eyeContactStrength, postureBiasForMode, interruptRecoveryPlan, walkKeyframes,
} from "@/lib/happy-r112/dh-extensions";
import {
  normalizeBrainRequest, SCOPE_TABLE, emptyBundle,
} from "@/lib/happy-r112/brain-context";
import {
  makeTicket, nextChunkRange, shouldRetry, progressPct, deriveUploadId,
  DEFAULT_CHUNK_BYTES,
} from "@/lib/happy-r112/files-upload";
import { quotaFor, isUnlimited } from "@/lib/happy-r112/workspace-policy";

describe("R112 DH extensions", () => {
  it("blink delay is within human range", () => {
    for (let i = 0; i < 100; i++) {
      const d = nextBlinkDelay();
      expect(d).toBeGreaterThanOrEqual(2500);
      expect(d).toBeLessThan(5501);
    }
  });
  it("breathing is bounded 0..1", () => {
    for (let t = 0; t < 20; t += 0.3) {
      const a = breathingAmplitude(t);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });
  it("smile clamps sentiment", () => {
    expect(smileFromSentiment(-1)).toBe(0);
    expect(smileFromSentiment(0.5)).toBe(0.5);
    expect(smileFromSentiment(5)).toBe(1);
  });
  it("eye contact peaks when user is speaking", () => {
    expect(eyeContactStrength("thinking", true)).toBe(1);
    expect(eyeContactStrength("thinking", false)).toBeLessThan(0.5);
  });
  it("posture bias exists for every mode", () => {
    for (const m of ["idle","listening","thinking","speaking",
      "whiteboard","presentation","roadmap","consultant","friend"] as const) {
      const p = postureBiasForMode(m);
      expect(p).toHaveProperty("spine");
      expect(p).toHaveProperty("head");
    }
  });
  it("interrupt recovery immediately listens, then restores", () => {
    const plan = interruptRecoveryPlan("presentation");
    expect(plan.immediate).toBe("listening");
    expect(plan.resumeMode).toBe("presentation");
    expect(plan.resumeAfterMs).toBeGreaterThan(0);
  });
  it("walk keyframes scale with distance", () => {
    const short = walkKeyframes(100);
    const long  = walkKeyframes(1000);
    expect(long.durationMs).toBeGreaterThan(short.durationMs);
    expect(long.steps).toBeGreaterThan(short.steps);
  });
});

describe("R112 brain context", () => {
  it("normalizes and dedups", () => {
    const n = normalizeBrainRequest({ scopes: ["long_term","long_term","recall"], query: "  hi  ", limitPerScope: 999 });
    expect(n.scopes).toEqual(["long_term","recall"]);
    expect(n.query).toBe("hi");
    expect(n.limitPerScope).toBe(50);
  });
  it("every scope maps to an existing owner table", () => {
    for (const k of Object.keys(SCOPE_TABLE)) {
      expect(SCOPE_TABLE[k as keyof typeof SCOPE_TABLE]).toBeTruthy();
    }
  });
  it("empty bundle covers requested scopes", () => {
    const b = emptyBundle(["long_term","files"]);
    expect(b.long_term).toEqual([]);
    expect(b.files).toEqual([]);
  });
});

describe("R112 resumable upload", () => {
  it("computes chunk ranges and progress", () => {
    const t = makeTicket({ id: "x", bucket: "happy-assets", path: "u/f", size: DEFAULT_CHUNK_BYTES * 2 + 5 });
    const r1 = nextChunkRange(t)!;
    expect(r1.start).toBe(0);
    expect(r1.end).toBe(DEFAULT_CHUNK_BYTES);
    t.uploadedBytes = t.size;
    expect(nextChunkRange(t)).toBeNull();
    expect(progressPct(t)).toBe(100);
  });
  it("retry policy respects max attempts", () => {
    const t = makeTicket({ id: "x", bucket: "happy-assets", path: "u/f", size: 100 });
    t.state = "error"; t.attempts = 4;
    expect(shouldRetry(t)).toBe(true);
    t.attempts = 5;
    expect(shouldRetry(t)).toBe(false);
  });
  it("upload id is stable per file identity", () => {
    const f = { name: "big.zip", size: 12345, lastModified: 1000 };
    expect(deriveUploadId(f)).toBe(deriveUploadId(f));
  });
});

describe("R112 workspace policy", () => {
  it("founder + enterprise are unlimited everywhere", () => {
    for (const r of ["projects","chats","companies","brands","teams","documents","memory_items"] as const) {
      expect(isUnlimited("founder", r)).toBe(true);
      expect(isUnlimited("enterprise", r)).toBe(true);
    }
  });
  it("free tier has finite project quota", () => {
    expect(quotaFor("free","projects")).toBeGreaterThan(0);
    expect(isUnlimited("free","projects")).toBe(false);
  });
});
