/** R72 — micro expressions & body language. */

export type MicroExpression =
  | "tiny-smile" | "thinking" | "listening" | "curious"
  | "professional" | "celebration" | "concern";

export type BodyPose =
  | "relaxed" | "hands-behind" | "hands-front" | "open-gesture"
  | "pointing" | "presentation" | "thinking-pose" | "walking";

export function expressionFor(input: {
  speaking: boolean; listening: boolean; working: boolean;
  celebrating: boolean; concerned: boolean;
}): MicroExpression {
  if (input.celebrating) return "celebration";
  if (input.concerned) return "concern";
  if (input.speaking) return "professional";
  if (input.listening) return "listening";
  if (input.working) return "thinking";
  return "tiny-smile";
}

export function poseFor(input: {
  mode: "dock" | "floating" | "presentation" | "meeting" | string;
  speaking: boolean; walking: boolean; working: boolean;
}): BodyPose {
  if (input.walking) return "walking";
  if (input.mode === "presentation") return "presentation";
  if (input.speaking) return "open-gesture";
  if (input.working) return "thinking-pose";
  return "relaxed";
}
