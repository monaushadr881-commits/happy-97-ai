/** R71.2 — relationship-aware greeting composer. */
import type { Emotion } from "./contracts";

export type UserKind = "founder" | "customer" | "student" | "developer" | "business_owner" | "guest";
export type Daypart = "morning" | "afternoon" | "evening" | "night";

export function dayparts(hour: number): Daypart {
  if (hour < 5)  return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export function greet(input: {
  hour: number;
  kind: UserKind;
  returning: boolean;
  lastArea?: string;
  pendingApprovals?: number;
  incompleteDeployments?: number;
}): { lines: string[]; emotion: Emotion } {
  const dp = dayparts(input.hour);
  const hi = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Hey" }[dp];

  if (input.kind === "founder") {
    const lines = [`${hi}.`, input.returning ? "Welcome back." : "Good to have you."];
    if (input.lastArea) lines.push(`Yesterday we were on ${input.lastArea}.`);
    if ((input.pendingApprovals ?? 0) > 0) lines.push(`You have ${input.pendingApprovals} approvals waiting.`);
    if ((input.incompleteDeployments ?? 0) > 0) lines.push(`One deployment is still open.`);
    lines.push("Shall we continue?");
    return { lines, emotion: "supportive" };
  }

  const base = input.returning ? "Good to see you again." : "I'm HAPPY.";
  const lines: string[] = [`${hi} 👋`, base];
  if (input.kind === "student") lines.push("Ready for today's learning?");
  else if (input.kind === "developer") lines.push("Want to jump into the builder?");
  else if (input.kind === "business_owner") lines.push("Want to review today's business?");
  else lines.push("How can I help you today?");
  return { lines, emotion: input.returning ? "happy" : "professional" };
}
