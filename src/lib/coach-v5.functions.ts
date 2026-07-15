/** HAPPY UUE v5.0 — AI Coach (stub). */
import { createServerFn } from "@tanstack/react-start";

export const getCoachTips = createServerFn({ method: "GET" }).handler(async () => ({
  tips: [
    { id: "cmd-k", title: "Try CMD+K", body: "Open the Global Command Center from anywhere." },
    { id: "focus", title: "Focus Mode", body: "Hide distractions and start a Pomodoro session." },
    { id: "zen", title: "Zen Mode", body: "Aurora, forest, rain and ocean ambience for deep work." },
    { id: "dock", title: "Universal Dock", body: "Magnetic dock with Home, Chat, Digital Human and more." },
  ],
}));
