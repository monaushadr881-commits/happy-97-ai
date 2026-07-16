import { describe, it, expect } from "vitest";
import { composeLiving } from "@/lib/happy-cinematic/living-intelligence";
import { sampleMicroHuman } from "@/lib/happy-cinematic/micro-human";
import { expressionFor, poseFor } from "@/lib/happy-cinematic/micro-expression";

const base = {
  listening: false, speaking: false, walking: false,
  celebrating: false, concerned: false,
  hasNotification: false, focusedElement: false,
};

describe("composeLiving", () => {
  it("defaults to idle/professional/workspace", () => {
    const s = composeLiving({ ...base });
    expect(s.state).toBe("idle");
    expect(s.emotion).toBe("professional");
    expect(s.attentionTarget).toBe("workspace");
    expect(s.workReal).toBe(false);
  });

  it("state precedence: walking > speaking > listening > thinking > celebrating", () => {
    expect(composeLiving({ ...base, walking: true, speaking: true }).state).toBe("walking");
    expect(composeLiving({ ...base, speaking: true, listening: true }).state).toBe("speaking");
    expect(composeLiving({ ...base, listening: true, faiosStatus: "executing" }).state).toBe("listening");
    expect(composeLiving({ ...base, faiosStatus: "planning" }).state).toBe("thinking");
    expect(composeLiving({ ...base, celebrating: true }).state).toBe("celebrating");
  });

  it("workReal is true only for planning/executing", () => {
    expect(composeLiving({ ...base, faiosStatus: "planning" }).workReal).toBe(true);
    expect(composeLiving({ ...base, faiosStatus: "executing" }).workReal).toBe(true);
    expect(composeLiving({ ...base, faiosStatus: "waiting-approval" }).workReal).toBe(false);
    expect(composeLiving({ ...base, faiosStatus: "completed" }).workReal).toBe(false);
  });

  it("emotion precedence honours concern above celebration", () => {
    expect(composeLiving({ ...base, concerned: true, celebrating: true }).emotion).toBe("concerned");
    expect(composeLiving({ ...base, celebrating: true }).emotion).toBe("celebrating");
    expect(composeLiving({ ...base, listening: true }).emotion).toBe("supportive");
  });

  it("attention flips to user while speaking, to notification when pending", () => {
    expect(composeLiving({ ...base, speaking: true, hasNotification: true }).attentionTarget).toBe("user");
    expect(composeLiving({ ...base, hasNotification: true }).attentionTarget).toBe("notification");
    expect(composeLiving({ ...base, focusedElement: true }).attentionTarget).toBe("focused-element");
  });
});

describe("sampleMicroHuman", () => {
  it("keeps every channel within its declared range", () => {
    for (let t = 0; t < 60_000; t += 137) {
      const s = sampleMicroHuman(t);
      expect(s.blinkOpen).toBeGreaterThanOrEqual(0);
      expect(s.blinkOpen).toBeLessThanOrEqual(1);
      expect(s.smile).toBeGreaterThanOrEqual(0.2);
      expect(s.smile).toBeLessThanOrEqual(0.5);
      expect(Math.abs(s.headTiltDeg)).toBeLessThanOrEqual(3.1);
      expect(Math.abs(s.shoulderShiftPx)).toBeLessThanOrEqual(1.3);
      expect(s.fingerRelax).toBeGreaterThanOrEqual(0);
      expect(s.fingerRelax).toBeLessThanOrEqual(1);
      expect(Math.abs(s.weightShift)).toBeLessThanOrEqual(1);
      expect(s.breath).toBeGreaterThanOrEqual(0);
      expect(s.breath).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for the same input", () => {
    expect(sampleMicroHuman(12345)).toEqual(sampleMicroHuman(12345));
  });

  it("produces at least one blink within a 20s window", () => {
    let minOpen = 1;
    for (let t = 0; t < 20_000; t += 50) {
      minOpen = Math.min(minOpen, sampleMicroHuman(t).blinkOpen);
    }
    expect(minOpen).toBeLessThan(0.3);
  });
});

describe("expressionFor / poseFor", () => {
  const b = { speaking: false, listening: false, working: false, celebrating: false, concerned: false };

  it("celebration and concern outrank speaking", () => {
    expect(expressionFor({ ...b, celebrating: true, speaking: true })).toBe("celebration");
    expect(expressionFor({ ...b, concerned: true, speaking: true })).toBe("concern");
  });

  it("falls back to tiny-smile when idle", () => {
    expect(expressionFor({ ...b })).toBe("tiny-smile");
  });

  it("presentation mode overrides speaking pose", () => {
    expect(poseFor({ mode: "presentation", speaking: true, walking: false, working: false })).toBe("presentation");
  });

  it("walking always wins", () => {
    expect(poseFor({ mode: "presentation", speaking: true, walking: true, working: true })).toBe("walking");
  });

  it("working goes to thinking-pose when not speaking", () => {
    expect(poseFor({ mode: "dock", speaking: false, walking: false, working: true })).toBe("thinking-pose");
  });
});
