/** HAPPY UUE v5.0 — Achievements (stub). */
import { createServerFn } from "@tanstack/react-start";

export interface Achievement {
  id: string;
  name: string;
  xp: number;
  tier: "bronze" | "silver" | "gold" | "prestige";
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "welcome", name: "Welcome to HAPPY", xp: 10, tier: "bronze" },
  { id: "first-chat", name: "First AI Chat", xp: 20, tier: "bronze" },
  { id: "first-build", name: "First Build", xp: 50, tier: "silver" },
  { id: "first-deploy", name: "First Deploy", xp: 100, tier: "gold" },
  { id: "founder", name: "Founder Prestige", xp: 500, tier: "prestige" },
];

export const listAchievements = createServerFn({ method: "GET" }).handler(async () => ({
  achievements: ACHIEVEMENTS,
}));
