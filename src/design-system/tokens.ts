/**
 * HAPPY X — Design Tokens
 * Single source of truth referenced by TS code.
 * CSS variables are the authoritative runtime values (see src/styles.css).
 */

export const color = {
  obsidian: "var(--obsidian)",
  charcoal: "var(--charcoal)",
  graphite: "var(--graphite)",
  onyx: "var(--onyx)",
  paper: "var(--paper)",
  softGray: "var(--soft-gray)",
  gold: "var(--gold)",
  goldBright: "var(--gold-bright)",
  goldDeep: "var(--gold-deep)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
} as const;

export const typography = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
    "7xl": "4.5rem",
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, black: 900 },
} as const;

export const spacing = {
  "3xs": "0.125rem",
  "2xs": "0.25rem",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
  "4xl": "6rem",
  "5xl": "8rem",
} as const;

export const radius = {
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  pill: "var(--radius-pill)",
} as const;

export const elevation = {
  soft: "var(--shadow-soft)",
  lifted: "var(--shadow-lifted)",
  luxe: "var(--shadow-luxe)",
  gold: "var(--shadow-gold)",
} as const;

export const motion = {
  duration: {
    fast: "var(--duration-fast)",
    base: "var(--duration-base)",
    slow: "var(--duration-slow)",
    luxe: "var(--duration-luxe)",
  },
  ease: {
    standard: "var(--ease-standard)",
    emphasized: "var(--ease-emphasized)",
    spring: "var(--ease-spring)",
  },
} as const;

export const zIndex = {
  base: 1,
  dropdown: 40,
  sticky: 50,
  overlay: 60,
  modal: 70,
  toast: 80,
  command: 90,
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  ultra: "1920px",
} as const;

export const gradient = {
  gold: "linear-gradient(135deg, #e8c96a 0%, #d4af37 50%, #8a6f22 100%)",
  paper: "linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)",
  luxeBg:
    "radial-gradient(120% 80% at 50% 0%, rgba(212,175,55,0.10), transparent 55%), linear-gradient(180deg, #0b0b0d 0%, #101013 100%)",
} as const;

export type DesignTokens = {
  color: typeof color;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: typeof elevation;
  motion: typeof motion;
  zIndex: typeof zIndex;
  breakpoints: typeof breakpoints;
  gradient: typeof gradient;
};

export const tokens: DesignTokens = {
  color,
  typography,
  spacing,
  radius,
  elevation,
  motion,
  zIndex,
  breakpoints,
  gradient,
};
