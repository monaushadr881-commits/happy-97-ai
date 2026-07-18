/** HAPPY UVE v4.0 — Appearance preferences (UI stub). */
import { createServerFn } from "@tanstack/react-start";

export interface AppearanceV4 {
  accent: string;
  radius: "sharp" | "soft" | "pill";
  density: "compact" | "cozy" | "spacious";
  animation: "off" | "subtle" | "full" | "cinematic";
  glass: "off" | "soft" | "luxe" | "crystal";
  background: "aurora" | "mesh" | "particles" | "bokeh" | "rays" | "parallax" | "static";
  sidebar: "glass" | "solid" | "floating" | "minimal";
  navbar: "glass" | "solid" | "floating";
  fontSize: "sm" | "md" | "lg" | "xl";
  cursor: "default" | "glow" | "spotlight" | "magnetic";
  glowIntensity: 0 | 25 | 50 | 75 | 100;
  timeAware: boolean;
  weatherMode: "off" | "sunny" | "rain" | "cloudy" | "snow" | "night-sky";
}

export const DEFAULT_APPEARANCE_V4: AppearanceV4 = {
  accent: "#7c5cff",
  radius: "soft",
  density: "cozy",
  animation: "full",
  glass: "luxe",
  background: "aurora",
  sidebar: "glass",
  navbar: "glass",
  fontSize: "md",
  cursor: "spotlight",
  glowIntensity: 50,
  timeAware: true,
  weatherMode: "off",
};

export const getAppearanceV4 = createServerFn({ method: "GET" }).handler(async () => DEFAULT_APPEARANCE_V4);
