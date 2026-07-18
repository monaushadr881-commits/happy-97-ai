import { describe, it, expect } from "vitest";
import {
  idleTelemetry, behaviourFor, gestureIntelligence, relationshipTier,
  memoryAwareGreeting, pickEnvironment, presentationFor, pickEntry,
  voicePersonality, analyticsSnapshot,
} from "@/lib/happy-r117/dh-intelligence";
import { voiceProfileFor } from "@/components/digital-human/conversation-engine";

describe("R117 · DH intelligence", () => {
  it("idle telemetry differs for focused personas", () => {
    expect(idleTelemetry("founder").breathHz).toBeGreaterThan(idleTelemetry("guest").breathHz - 0.05);
  });
  it("behaviour maps state+intent", () => {
    expect(behaviourFor("listening")).toBe("listening");
    expect(behaviourFor("speaking", "congrats")).toBe("celebration");
    expect(behaviourFor("speaking", "warning")).toBe("concern");
  });
  it("gesture intelligence is deterministic and context-aware", () => {
    expect(gestureIntelligence("greeting", "friend")).toBe("wave");
    expect(gestureIntelligence("teaching", "presentation")).toBe("whiteboard");
    expect(gestureIntelligence("short", "conversation")).toBe("none");
    expect(gestureIntelligence("congrats", "business")).toBe("celebrate");
  });
  it("relationship tier respects founder flag", () => {
    expect(relationshipTier({ interactions: 0, daysKnown: 0, founder: true })).toBe("founder");
    expect(relationshipTier({ interactions: 50, daysKnown: 30 })).toBe("friend");
    expect(relationshipTier({ interactions: 1, daysKnown: 1 })).toBe("stranger");
  });
  it("greeting uses name + last topic when known", () => {
    const g = memoryAwareGreeting({ tier: "friend", firstName: "Sam", hourLocal: 10, lastTopic: "the roadmap" });
    expect(g).toMatch(/Good morning, Sam/);
    expect(g).toMatch(/roadmap/);
  });
  it("environment picks board_room for presentation", () => {
    expect(pickEnvironment({ presentation: true })).toBe("board_room");
    expect(pickEnvironment({ mode: "teacher" })).toBe("classroom");
    expect(pickEnvironment({ tier: "friend" })).toBe("coffee_shop");
  });
  it("presentation surface picks whiteboard for complex", () => {
    expect(presentationFor("complex")).toBe("whiteboard");
    expect(presentationFor("teaching")).toBe("teaching");
  });
  it("entry defaults to none unless enabled", () => {
    expect(pickEntry({ enabled: false })).toBe("none");
    expect(pickEntry({ enabled: true, tier: "founder", scene: "office" })).toBe("office");
    expect(pickEntry({ enabled: true, tier: "founder" })).toBe("bmw_m5");
  });
  it("voice personality layers emotion + confidence", () => {
    const v = voicePersonality(voiceProfileFor("teacher"), "teaching", "colleague");
    expect(v.emotion).toBe("focused");
    expect(v.confidence).toBeGreaterThan(0.7);
  });
  it("analytics summarises frames", () => {
    const now = Date.now();
    const a = analyticsSnapshot([
      { gesture: "wave", behaviour: "talking", posture: "speaking", frameTimeMs: 16, eyeContact: true, speaking: true, at: now },
      { gesture: "none", behaviour: "listening", posture: "listening", frameTimeMs: 20, eyeContact: false, speaking: false, at: now },
    ]);
    expect(a.frames).toBe(2);
    expect(a.gestureUsage.wave).toBe(1);
    expect(a.eyeContactRatio).toBe(0.5);
  });
});
