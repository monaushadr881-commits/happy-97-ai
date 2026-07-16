import { describe, it, expect } from "vitest";
import { detectEmotion, emotionToPose } from "@/lib/happy-cinematic/emotion";
import { planEntry, planWalk, planGreeting, planExit } from "@/lib/happy-cinematic/choreography";

describe("emotion detection", () => {
  it.each([
    ["We just shipped it!", "celebrating"],
    ["Everything is broken", "concerned"],
    ["Please analyze the numbers", "thinking"],
    ["Hi there", "happy"],
    ["random unrelated text", "neutral"],
  ])("detects %s", (text, expected) => {
    expect(detectEmotion(text)).toBe(expected);
  });

  it("maps every emotion to a pose", () => {
    for (const e of ["celebrating", "concerned", "neutral", "happy"] as const) {
      const pose = emotionToPose(e);
      expect(pose).toHaveProperty("smile");
      expect(pose).toHaveProperty("brow");
    }
  });
});

describe("choreography", () => {
  it("short entry when reduced motion", () => {
    const full = planEntry({ qualityTier: "high", reducedMotion: false });
    const reduced = planEntry({ qualityTier: "high", reducedMotion: true });
    expect(full.sequence.length).toBeGreaterThan(reduced.sequence.length);
    expect(reduced.durationMs).toBeLessThan(full.durationMs);
  });

  it("walk steps scale with distance", () => {
    const near = planWalk([0, 0], [10, 0], false);
    const far = planWalk([0, 0], [1000, 0], false);
    expect(far.steps).toBeGreaterThanOrEqual(near.steps);
  });

  it("founder greeting differs from generic", () => {
    const founder = planGreeting({ pendingDeployment: true, hasErrors: false } as any, true);
    const guest = planGreeting({} as any, false);
    expect(founder.emotion).toBe("supportive");
    expect(guest.emotion).toBe("happy");
  });

  it("exit shortens under reduced motion", () => {
    expect(planExit(true).sequence.length).toBeLessThan(planExit(false).sequence.length);
  });
});
