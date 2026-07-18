import { describe, it, expect } from "vitest";
import {
  planBmwM5Entry, ANIMATION_CATALOGUE, animationFor,
  environmentPreset, ENVIRONMENT_SCENES,
  cameraMode, CAMERA_MODES,
  voiceExperience,
  relationshipBehaviour, RELATIONSHIP_ROLES,
  planPresentation, PRESENTATION_MODES,
  productionFrame,
} from "@/lib/happy-r143/dh-production";

describe("R143 · DH Production Experience", () => {
  it("BMW M5 entry has all beats, trims under reduced motion", () => {
    const full = planBmwM5Entry(false);
    expect(full.beats).toContain("side-slide-drift");
    expect(full.beats).toContain("door-open");
    expect(full.beats).toContain("drive-away");
    expect(full.totalMs).toBeGreaterThan(3000);
    const rm = planBmwM5Entry(true);
    expect(rm.beats.length).toBeLessThan(full.beats.length);
    expect(rm.totalMs).toBeLessThanOrEqual(1200);
  });

  it("animation catalogue exposes all 20 clips", () => {
    expect(ANIMATION_CATALOGUE).toHaveLength(20);
    expect(ANIMATION_CATALOGUE).toContain("handshake");
    expect(ANIMATION_CATALOGUE).toContain("founder_presentation");
  });

  it("animationFor promotes founder + presenting to founder_presentation", () => {
    expect(animationFor("talking", "founder", true).clip).toBe("founder_presentation");
    expect(animationFor("celebration", "friend", false).clip).toBe("celebration");
    expect(animationFor("talking", "friend", false).clip).toBe("friend_conversation");
  });

  it("environment presets exist for all 7 scenes", () => {
    expect(ENVIRONMENT_SCENES).toHaveLength(7);
    for (const s of ENVIRONMENT_SCENES) {
      const p = environmentPreset(s);
      expect(p.scene).toBe(s);
      expect(p.props.length).toBeGreaterThan(0);
    }
  });

  it("camera modes cover all 5 required systems", () => {
    expect(CAMERA_MODES).toHaveLength(5);
    expect(cameraMode({ tier: "founder" }).mode).toBe("founder");
    expect(cameraMode({ presenting: true }).mode).toBe("presentation");
    expect(cameraMode({ whiteboard: true }).mode).toBe("whiteboard");
    expect(cameraMode({ mode: "auto_follow" }).mode).toBe("auto_follow");
  });

  it("voice experience shapes emotion + flow", () => {
    const teach = voiceExperience("teaching", "colleague");
    expect(teach.emotion).toBe("focused");
    expect(teach.rate).toBeLessThan(1);
    const warn = voiceExperience("warning", "user" as never);
    expect(warn.flow).toBe("assertive");
    const congrats = voiceExperience("congrats", "friend");
    expect(congrats.emotion).toBe("excited");
    expect(congrats.pitch).toBeGreaterThan(1);
  });

  it("relationship behaviour covers all 7 roles with distinct traits", () => {
    expect(RELATIONSHIP_ROLES).toHaveLength(7);
    const founder = relationshipBehaviour("founder");
    expect(founder.cameraMode).toBe("founder");
    expect(founder.memoryDepth).toBe("lifetime");
    expect(relationshipBehaviour("guest").greetingStyle).toBe("brief");
    expect(relationshipBehaviour("enterprise").formality).toBe("executive");
  });

  it("presentation planning covers all 6 modes and routes cameras", () => {
    expect(PRESENTATION_MODES).toHaveLength(6);
    expect(planPresentation("slides", "founder").animation).toBe("founder_presentation");
    expect(planPresentation("whiteboard", "colleague").cameraMode).toBe("whiteboard");
    expect(planPresentation("roadmaps", "user" as never).cameraMode).toBe("whiteboard");
    expect(planPresentation("charts", "friend").surface).toBe("screen");
  });

  it("productionFrame composes entry + animation + camera + voice + environment", () => {
    const f = productionFrame({
      role: "founder",
      intent: "teaching",
      scene: "board_room",
      behaviour: "explanation",
      presentationMode: "slides",
      entry: "bmw_m5",
      reducedMotion: false,
    });
    expect(f.entry?.variant).toBe("bmw_m5");
    expect(f.camera.mode).toBe("presentation");
    expect(f.environment.scene).toBe("board_room");
    expect(f.voice.emotion).toBe("focused");
    expect(f.behaviour.role).toBe("founder");
    expect(f.presentation?.mode).toBe("slides");
    expect(f.animation.clip).toBe("founder_presentation");
  });
});
