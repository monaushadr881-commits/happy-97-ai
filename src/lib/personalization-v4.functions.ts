/** HAPPY UVE v4.0 — AI personalization recommendations (stub). */
import { createServerFn } from "@tanstack/react-start";

export const getPersonalizationV4 = createServerFn({ method: "GET" }).handler(async () => ({
  themeId: "aurora-dynamic",
  accent: "#7c5cff",
  wallpaperId: "luxury-workspace",
  background: "aurora" as const,
  density: "cozy" as const,
  animation: "full" as const,
  reason: "Balanced luxury with cinematic motion for long working sessions.",
}));
