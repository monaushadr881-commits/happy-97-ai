/**
 * HAPPY Dynamic Theme Engine v2.0 — Appearance preferences (UI stubs).
 */
import { createServerFn } from "@tanstack/react-start";

export interface AppearancePrefs {
  radius: "sharp" | "soft" | "pill";
  density: "compact" | "cozy" | "spacious";
  animation: "off" | "subtle" | "full";
  glass: "off" | "soft" | "luxe";
  background: "aurora" | "static" | "fog" | "rays";
  sidebar: "glass" | "solid" | "floating";
  fontSize: "sm" | "md" | "lg";
}

export const DEFAULT_APPEARANCE: AppearancePrefs = {
  radius: "soft",
  density: "cozy",
  animation: "full",
  glass: "luxe",
  background: "aurora",
  sidebar: "glass",
  fontSize: "md",
};

export const getAppearance = createServerFn({ method: "GET" }).handler(async () => DEFAULT_APPEARANCE);
