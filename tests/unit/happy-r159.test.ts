import { describe, it, expect } from "vitest";
import {
  INTENT_INPUT_MODES, INTENT_TYPES, UNDERSTANDING_FIELDS, THINKING_ARTIFACTS,
  AUTOMATIC_CHECKS, OUTPUT_PLANS, PRESENTATION_FIELDS, LEARNING_SURFACES,
  SUGGESTION_DOMAINS, INTENT_PIPELINE,
  normalizeInputModes, missingUnderstanding, isUnderstandingComplete,
  needsClarification, nextIntentStage, tierForIntent, buildPlanSurface,
  intentSnapshot,
} from "@/lib/founder/intent-engine";

describe("R159 — Founder Intent Engine™", () => {
  it("enumerates governance constants", () => {
    expect(INTENT_INPUT_MODES.length).toBe(11);
    expect(INTENT_TYPES.length).toBe(21);
    expect(UNDERSTANDING_FIELDS.length).toBe(8);
    expect(THINKING_ARTIFACTS.length).toBe(9);
    expect(AUTOMATIC_CHECKS.length).toBe(9);
    expect(OUTPUT_PLANS.length).toBe(6);
    expect(PRESENTATION_FIELDS.length).toBe(8);
    expect(LEARNING_SURFACES.length).toBe(6);
    expect(SUGGESTION_DOMAINS.length).toBe(5);
    expect(INTENT_PIPELINE.length).toBe(9);
  });

  it("normalizes single + mixed modalities and rejects unknowns", () => {
    expect(normalizeInputModes("voice")).toEqual(["voice"]);
    expect(normalizeInputModes(["text", "image", "url"])).toEqual(["text", "image", "url"]);
    // @ts-expect-error runtime guard
    expect(normalizeInputModes(["text", "hologram"])).toEqual(["text"]);
  });

  it("understanding completeness + clarify rule (ask, don't guess)", () => {
    const full = Object.fromEntries(UNDERSTANDING_FIELDS.map((f) => [f, "x"]));
    expect(isUnderstandingComplete(full)).toBe(true);
    expect(needsClarification(full)).toBe(false);
    expect(missingUnderstanding({}).length).toBe(UNDERSTANDING_FIELDS.length);
    expect(needsClarification({})).toBe(true);
  });

  it("pipeline routes to clarify when understanding is incomplete", () => {
    expect(nextIntentStage("understand", {})).toBe("clarify");
    expect(nextIntentStage("clarify", {})).toBe("clarify");
    const full = Object.fromEntries(UNDERSTANDING_FIELDS.map((f) => [f, "x"]));
    expect(nextIntentStage("understand", full)).toBe("clarify"); // still moves forward via i+1
    // But sequential progression from clarify with full data advances
    expect(nextIntentStage("clarify", full)).toBe("think");
    expect(nextIntentStage("think", full)).toBe("check");
    expect(nextIntentStage("handoff", full)).toBe("done");
  });

  it("maps intent → R158 approval tier via change descriptor", () => {
    expect(tierForIntent(
      { type: "database", input: "text", understanding: {} },
      { destructive: true },
    )).toBe("critical");
    expect(tierForIntent(
      { type: "bugfix", input: "text", understanding: {} },
      { filesTouched: 1 },
    )).toBe("minor");
    expect(tierForIntent(
      { type: "ui", input: "text", understanding: {} },
      { filesTouched: 30 },
    )).toBe("standard");
  });

  it("buildPlanSurface exposes plans/checks/thinking + tier requirements", () => {
    const s = buildPlanSurface(
      { type: "database", input: "text", understanding: {} },
      { destructive: true },
    );
    expect(s.tier).toBe("critical");
    expect(s.approvalRequirements.requiresOtp).toBe(true);
    expect(s.plans).toEqual(OUTPUT_PLANS);
    expect(s.checks).toEqual(AUTOMATIC_CHECKS);
    expect(s.thinking).toEqual(THINKING_ARTIFACTS);
  });

  it("intentSnapshot exposes the full Founder-Dashboard surface", () => {
    const snap = intentSnapshot(
      { type: "feature", input: ["text", "screenshot"], understanding: { goal: "Add magic" } },
      { filesTouched: 3 },
    );
    expect(snap.inputs).toEqual(["text", "screenshot"]);
    expect(snap.needsClarification).toBe(true);
    expect(snap.missing.length).toBe(UNDERSTANDING_FIELDS.length - 1);
    expect(snap.stages).toEqual(INTENT_PIPELINE);
    expect(snap.learningSurfaces).toEqual(LEARNING_SURFACES);
    expect(snap.suggestions).toEqual(SUGGESTION_DOMAINS);
    expect(snap.tier).toBeDefined();
  });
});
