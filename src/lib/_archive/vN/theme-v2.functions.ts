/**
 * HAPPY Dynamic Theme Engine v2.0 — Theme server functions.
 * Read-only stubs: theme catalog + module accent map. UI-only expansion,
 * no schema, no writes, no side effects.
 */
import { createServerFn } from "@tanstack/react-start";

export type ThemeId =
  | "aurora-dynamic"
  | "executive-dark"
  | "professional-light"
  | "midnight-black"
  | "ocean-blue"
  | "emerald-green"
  | "royal-purple"
  | "sunset-orange"
  | "rose-gold"
  | "founder-gold";

export interface ThemeDescriptor {
  id: ThemeId;
  name: string;
  tagline: string;
  accent: string;
  surface: string;
  background: string;
  isDefault?: boolean;
  seasonal?: boolean;
}

export const THEME_CATALOG: ThemeDescriptor[] = [
  { id: "aurora-dynamic", name: "Aurora Dynamic", tagline: "Living luxury gradient", accent: "#7c5cff", surface: "rgba(20,20,28,0.6)", background: "radial-gradient(120% 80% at 20% 0%, rgba(124,92,255,0.18), transparent 55%), radial-gradient(90% 60% at 90% 100%, rgba(56,189,248,0.14), transparent 55%), #0b0b0d", isDefault: true },
  { id: "executive-dark", name: "Executive Dark", tagline: "Obsidian + Gold", accent: "#d4af37", surface: "#101013", background: "#0b0b0d" },
  { id: "professional-light", name: "Professional Light", tagline: "Premium paper", accent: "#8a6f22", surface: "#ffffff", background: "#fafaf7" },
  { id: "midnight-black", name: "Midnight Black", tagline: "Pure void", accent: "#e8c96a", surface: "#050505", background: "#000000" },
  { id: "ocean-blue", name: "Ocean Blue", tagline: "Deep tide", accent: "#38bdf8", surface: "#0c1e2e", background: "#061423" },
  { id: "emerald-green", name: "Emerald Green", tagline: "Forest wealth", accent: "#34d399", surface: "#0c1f18", background: "#061510" },
  { id: "royal-purple", name: "Royal Purple", tagline: "Regal mist", accent: "#a78bfa", surface: "#171029", background: "#0d0820" },
  { id: "sunset-orange", name: "Sunset Orange", tagline: "Warm horizon", accent: "#fb923c", surface: "#221208", background: "#160a04" },
  { id: "rose-gold", name: "Rose Gold", tagline: "Soft opulence", accent: "#f9a8d4", surface: "#1a1216", background: "#100a0d" },
  { id: "founder-gold", name: "Founder Gold", tagline: "Command tier", accent: "#ffd45a", surface: "#12100a", background: "#0a0805" },
];

export const MODULE_ACCENTS = {
  business: "#d4af37",
  education: "#3b82f6",
  knowledge: "#22d3ee",
  creator: "#a78bfa",
  research: "#6366f1",
  healthcare: "#ef4444",
  manufacturing: "#f97316",
  government: "#22c55e",
  marketplace: "#ec4899",
  community: "#14b8a6",
  enterprise: "#ffd45a",
  cloud: "#38bdf8",
  analytics: "#10b981",
  developer: "#0ea5e9",
  automation: "#8b5cf6",
} as const;

export const listThemes = createServerFn({ method: "GET" }).handler(async () => ({
  themes: THEME_CATALOG,
  moduleAccents: MODULE_ACCENTS,
  defaultThemeId: "aurora-dynamic" as ThemeId,
}));
