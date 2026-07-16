/**
 * R80 — Living Companion Service (pure logic).
 * Composes existing R71–R79 modules into a single "Happy is with me" state.
 * No DB, no side effects, no fake avatar assets.
 */

import { composeLivingCore, type LivingCoreInput, type LivingCoreState } from "@/lib/happy-living/core";

export type CompanionRole = "founder" | "admin" | "employee" | "customer" | "guest";

export type CompanionInput = LivingCoreInput & {
  role: CompanionRole;
  route: string;
  hasNotifications: boolean;
  hasError: boolean;
  hourOfDay: number; // 0-23 local
  languageCode: string; // "en", "hi", etc
};

export type CompanionState = LivingCoreState & {
  role: CompanionRole;
  daypart: "morning" | "afternoon" | "evening" | "night";
  greeting: string;
  posture: "relaxed" | "attentive" | "presenting" | "concerned";
  suggestNotification: boolean;
  concerned: boolean;
};

export function composeCompanion(inp: CompanionInput): CompanionState {
  const core = composeLivingCore(inp);
  const daypart: CompanionState["daypart"] =
    inp.hourOfDay < 5 ? "night" :
    inp.hourOfDay < 12 ? "morning" :
    inp.hourOfDay < 17 ? "afternoon" :
    inp.hourOfDay < 21 ? "evening" : "night";

  const concerned = inp.hasError;
  const posture: CompanionState["posture"] =
    concerned ? "concerned" :
    core.mode === "presenting" ? "presenting" :
    core.mode === "engaged" || core.mode === "attentive" ? "attentive" : "relaxed";

  const nameByRole: Record<CompanionRole, string> = {
    founder: "Founder",
    admin: "Admin",
    employee: "friend",
    customer: "there",
    guest: "there",
  };
  const salute = daypart === "night" ? "Working late" : `Good ${daypart}`;
  const greeting = `${salute}, ${nameByRole[inp.role]}`;

  return {
    ...core,
    role: inp.role,
    daypart,
    greeting,
    posture,
    suggestNotification: inp.hasNotifications && !inp.conversing,
    concerned,
  };
}
