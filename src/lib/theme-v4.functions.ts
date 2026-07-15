/**
 * HAPPY Ultimate Visual Experience v4.0 — Theme catalog (extended).
 * Read-only stubs. No schema, no writes.
 */
import { createServerFn } from "@tanstack/react-start";

export type ThemeIdV4 =
  | "executive-dark" | "aurora-dynamic" | "professional-light" | "ocean-blue"
  | "emerald-green" | "royal-purple" | "rose-gold" | "sunset-orange"
  | "midnight-black" | "founder-gold" | "glass-crystal" | "nordic-frost"
  | "minimal-white" | "cyber-neon" | "luxury-black" | "corporate-blue"
  | "forest-green" | "desert-gold" | "royal-crimson";

export interface ThemeV4 {
  id: ThemeIdV4;
  name: string;
  tagline: string;
  accent: string;
  isDefault?: boolean;
  premium?: boolean;
}

export const THEMES_V4: ThemeV4[] = [
  { id: "executive-dark", name: "Executive Dark", tagline: "Obsidian + Gold", accent: "#d4af37" },
  { id: "aurora-dynamic", name: "Aurora Dynamic", tagline: "Living luxury gradient", accent: "#7c5cff", isDefault: true },
  { id: "professional-light", name: "Professional Light", tagline: "Premium paper", accent: "#8a6f22" },
  { id: "ocean-blue", name: "Ocean Blue", tagline: "Deep tide", accent: "#38bdf8" },
  { id: "emerald-green", name: "Emerald Green", tagline: "Forest wealth", accent: "#34d399" },
  { id: "royal-purple", name: "Royal Purple", tagline: "Regal mist", accent: "#a78bfa" },
  { id: "rose-gold", name: "Rose Gold", tagline: "Soft opulence", accent: "#f9a8d4" },
  { id: "sunset-orange", name: "Sunset Orange", tagline: "Warm horizon", accent: "#fb923c" },
  { id: "midnight-black", name: "Midnight Black", tagline: "Pure void", accent: "#e8c96a" },
  { id: "founder-gold", name: "Founder Gold", tagline: "Command tier", accent: "#ffd45a", premium: true },
  { id: "glass-crystal", name: "Glass Crystal", tagline: "Translucent luxury", accent: "#c7d2fe", premium: true },
  { id: "nordic-frost", name: "Nordic Frost", tagline: "Arctic calm", accent: "#93c5fd" },
  { id: "minimal-white", name: "Minimal White", tagline: "Editorial silence", accent: "#111827" },
  { id: "cyber-neon", name: "Cyber Neon", tagline: "Electric future", accent: "#22d3ee", premium: true },
  { id: "luxury-black", name: "Luxury Black", tagline: "Monolithic", accent: "#f5f5f4" },
  { id: "corporate-blue", name: "Corporate Blue", tagline: "Trust", accent: "#2563eb" },
  { id: "forest-green", name: "Forest Green", tagline: "Grounded", accent: "#16a34a" },
  { id: "desert-gold", name: "Desert Gold", tagline: "Warm sand", accent: "#eab308" },
  { id: "royal-crimson", name: "Royal Crimson", tagline: "Regal fire", accent: "#dc2626", premium: true },
];

export const listThemesV4 = createServerFn({ method: "GET" }).handler(async () => ({
  themes: THEMES_V4,
  defaultThemeId: "aurora-dynamic" as ThemeIdV4,
}));
