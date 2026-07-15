/** HAPPY UUE v5.0 — Streaks (stub). */
import { createServerFn } from "@tanstack/react-start";

export const getStreaks = createServerFn({ method: "GET" }).handler(async () => ({
  streaks: [
    { id: "daily", name: "Daily Usage", days: 0 },
    { id: "learning", name: "Learning", days: 0 },
    { id: "business", name: "Business", days: 0 },
    { id: "creator", name: "Creator", days: 0 },
    { id: "research", name: "Research", days: 0 },
    { id: "founder", name: "Founder", days: 0 },
  ],
}));
