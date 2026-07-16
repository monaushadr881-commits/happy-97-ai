/** R73 — living intelligence: aggregates state from earlier engines. */
import type { CinematicState, Emotion } from "./contracts";

export interface LivingSnapshot {
  state: CinematicState;
  emotion: Emotion;
  workReal: boolean;
  attentionTarget: "user" | "focused-element" | "notification" | "workspace" | "away";
  proactiveHint?: string;
}

export function composeLiving(input: {
  faiosStatus?: "idle" | "planning" | "executing" | "waiting-approval" | "completed" | "error";
  listening: boolean;
  speaking: boolean;
  walking: boolean;
  celebrating: boolean;
  concerned: boolean;
  hasNotification: boolean;
  focusedElement: boolean;
}): LivingSnapshot {
  const workReal = input.faiosStatus === "planning" || input.faiosStatus === "executing";
  const state: CinematicState =
    input.walking ? "walking"
    : input.speaking ? "speaking"
    : input.listening ? "listening"
    : workReal ? "thinking"
    : input.celebrating ? "celebrating"
    : "idle";
  const emotion: Emotion =
    input.concerned ? "concerned"
    : input.celebrating ? "celebrating"
    : workReal ? "focused"
    : input.listening ? "supportive"
    : "professional";
  const attentionTarget =
    input.speaking ? "user"
    : input.hasNotification ? "notification"
    : input.focusedElement ? "focused-element"
    : "workspace";
  return { state, emotion, workReal, attentionTarget };
}
