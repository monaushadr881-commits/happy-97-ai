/**
 * R275 — HAPPY™ Enterprise Brand Ecosystem
 *
 * ONE brand system for the ONE canonical HAPPY. Extends the single
 * canonical persona (`canonical-avatar.ts`). Consumed by the existing
 * Creator and Publishing runtimes — no new runtime, no duplicate
 * personality, no second avatar, no duplicate brand system.
 *
 * All templates below are declarative specs. Rendering runs through the
 * canonical Creator runtime; distribution runs through the canonical
 * Publishing runtime; every generation flows the 13-stage pipeline.
 */
import {
  HAPPY_CANONICAL_AVATAR,
  HAPPY_CANONICAL_BRAND,
  HAPPY_CANONICAL_IDENTITY,
  HAPPY_CANONICAL_PERSONALITY,
  HAPPY_CANONICAL_STATES,
  HAPPY_FOUNDER_SIGNATURE,
} from "./canonical-avatar";

// ─── Identity ────────────────────────────────────────────────────────────
export const HAPPY_BRAND_IDENTITY = Object.freeze({
  name: HAPPY_CANONICAL_IDENTITY.name,
  wordmark: "HAPPY™",
  tagline: HAPPY_CANONICAL_IDENTITY.tagline,
  motto: HAPPY_FOUNDER_SIGNATURE.motto,
  category: "Founder-AI Operating System",
  logo_asset: HAPPY_CANONICAL_AVATAR.image_url,
});

// ─── Colors ──────────────────────────────────────────────────────────────
export const HAPPY_BRAND_COLORS = Object.freeze({
  primary:    HAPPY_CANONICAL_BRAND.palette.gold,
  accent:     HAPPY_CANONICAL_BRAND.palette.accent,
  background: HAPPY_CANONICAL_BRAND.palette.background,
  surface:    HAPPY_CANONICAL_BRAND.palette.surface,
  ink:        HAPPY_CANONICAL_BRAND.palette.ink,
  gradient:   HAPPY_CANONICAL_BRAND.gradient,
  semantic: Object.freeze({
    success: "#22C55E",
    warning: "#F59E0B",
    danger:  "#EF4444",
    info:    "#38BDF8",
  }),
});

// ─── Fonts ───────────────────────────────────────────────────────────────
export const HAPPY_BRAND_FONTS = Object.freeze({
  display: { family: "Instrument Serif", weight: "400", use: "hero, editorial" },
  heading: { family: "Space Grotesk",    weight: "600", use: "H1-H3, product" },
  body:    { family: "Inter",            weight: "400", use: "body, ui"       },
  mono:    { family: "JetBrains Mono",   weight: "400", use: "code, data"     },
});

// ─── Motion ──────────────────────────────────────────────────────────────
export const HAPPY_BRAND_MOTION = Object.freeze({
  easing:   "cubic-bezier(0.22, 1, 0.36, 1)",
  duration: { instant: 120, quick: 200, base: 320, cinematic: 640 },
  signature: "gold-ray sweep · warm fade · founder-calm",
});

// ─── Icons / Illustrations / Mascot ──────────────────────────────────────
export const HAPPY_BRAND_ICONS = Object.freeze({
  library: "lucide-react",
  style: "stroke-1.5 · rounded",
  accent_color: HAPPY_BRAND_COLORS.primary,
});

export const HAPPY_BRAND_ILLUSTRATIONS = Object.freeze({
  style: "photo-real · black backdrop · warm gold rays",
  palette: [HAPPY_BRAND_COLORS.background, HAPPY_BRAND_COLORS.primary, HAPPY_BRAND_COLORS.ink],
});

export const HAPPY_BRAND_MASCOT = Object.freeze({
  identity: HAPPY_CANONICAL_IDENTITY.name,
  image_url: HAPPY_CANONICAL_AVATAR.image_url,
  states: Object.keys(HAPPY_CANONICAL_STATES),
});

// ─── Voice / Tone / Copy ─────────────────────────────────────────────────
export const HAPPY_BRAND_VOICE = Object.freeze({
  archetype: HAPPY_CANONICAL_PERSONALITY.archetype,
  qualities: HAPPY_CANONICAL_PERSONALITY.traits,
});

export const HAPPY_BRAND_TONE = Object.freeze({
  default: "executive-warm",
  contexts: Object.freeze({
    marketing:    "confident · aspirational · founder-first",
    product:      "clear · calm · action-oriented",
    support:      "empathetic · patient · precise",
    investor:     "measured · data-led · visionary",
    sales:        "warm · direct · outcome-led",
    education:    "encouraging · structured · patient",
  }),
});

export const HAPPY_BRAND_COPY = Object.freeze({
  greetings: Object.freeze([
    "Hi, I'm HAPPY.",
    "Welcome to HAPPY X.",
    "Ready when you are, Founder.",
  ]),
  ctas: Object.freeze([
    "Talk to HAPPY", "Open Mission Control", "Ask the Founder AI",
    "Build with HAPPY", "Present with HAPPY", "Publish with HAPPY",
  ]),
  taglines: Object.freeze([
    HAPPY_CANONICAL_IDENTITY.tagline,
    "Founder-grade AI. One canonical identity.",
    "One HAPPY. One pipeline. Every action audited.",
  ]),
});

// ─── Guidelines ──────────────────────────────────────────────────────────
export const HAPPY_BRAND_GUIDELINES = Object.freeze({
  do: Object.freeze([
    "Use the canonical HAPPY portrait as the sole avatar.",
    "Pair black surfaces with warm gold light rays.",
    "Sign every founder communication with the canonical signature.",
    "Route every asset through the Creator + Publishing runtimes.",
  ]),
  dont: Object.freeze([
    "Never introduce a second avatar, mascot, or personality.",
    "Never mix palettes outside the canonical black/gold system.",
    "Never bypass the 13-stage canonical pipeline for publishing.",
    "Never publish an asset without a canonical audit row.",
  ]),
});

// ─── Templates (declarative specs; rendered by Creator runtime) ──────────
type BrandTemplate = Readonly<{
  id: string;
  label: string;
  kind: string;
  size: string;
  medium: "print" | "digital" | "messaging" | "presentation" | "email";
  runtime: "creator" | "publishing";
}>;

export const HAPPY_BRAND_TEMPLATES: readonly BrandTemplate[] = Object.freeze([
  { id: "business-card",         label: "Business Card",           kind: "card",         size: "3.5x2 in",  medium: "print",        runtime: "creator"    },
  { id: "letterhead",            label: "Letterhead",              kind: "stationery",   size: "A4",        medium: "print",        runtime: "creator"    },
  { id: "invoice",               label: "Invoice",                 kind: "document",     size: "A4",        medium: "print",        runtime: "creator"    },
  { id: "certificate",           label: "Certificate",             kind: "document",     size: "A4-landscape", medium: "print",     runtime: "creator"    },
  { id: "email-transactional",   label: "Transactional Email",     kind: "email",        size: "600px",     medium: "email",        runtime: "publishing" },
  { id: "email-founder-briefing",label: "Founder Briefing Email",  kind: "email",        size: "600px",     medium: "email",        runtime: "publishing" },
  { id: "whatsapp-welcome",      label: "WhatsApp · Welcome",      kind: "messaging",    size: "1080x1080", medium: "messaging",    runtime: "publishing" },
  { id: "whatsapp-broadcast",    label: "WhatsApp · Broadcast",    kind: "messaging",    size: "1080x1350", medium: "messaging",    runtime: "publishing" },
  { id: "deck-pitch",            label: "Pitch Deck",              kind: "presentation", size: "16:9",      medium: "presentation", runtime: "creator"    },
  { id: "deck-investor",         label: "Investor Deck",           kind: "presentation", size: "16:9",      medium: "presentation", runtime: "creator"    },
  { id: "deck-founder-briefing", label: "Founder Briefing Deck",   kind: "presentation", size: "16:9",      medium: "presentation", runtime: "creator"    },
  { id: "media-kit",             label: "Media Kit",               kind: "kit",          size: "A4",        medium: "digital",      runtime: "publishing" },
  { id: "press-kit",             label: "Press Kit",               kind: "kit",          size: "A4",        medium: "digital",      runtime: "publishing" },
  { id: "brand-book",            label: "Brand Book",              kind: "document",     size: "A4",        medium: "digital",      runtime: "publishing" },
] as const);

export type HappyBrandTemplateId = (typeof HAPPY_BRAND_TEMPLATES)[number]["id"];

// ─── Master Bundle ───────────────────────────────────────────────────────
export const HAPPY_BRAND_KIT = Object.freeze({
  identity:      HAPPY_BRAND_IDENTITY,
  colors:        HAPPY_BRAND_COLORS,
  fonts:         HAPPY_BRAND_FONTS,
  motion:        HAPPY_BRAND_MOTION,
  icons:         HAPPY_BRAND_ICONS,
  illustrations: HAPPY_BRAND_ILLUSTRATIONS,
  mascot:        HAPPY_BRAND_MASCOT,
  voice:         HAPPY_BRAND_VOICE,
  tone:          HAPPY_BRAND_TONE,
  copy:          HAPPY_BRAND_COPY,
  guidelines:    HAPPY_BRAND_GUIDELINES,
  templates:     HAPPY_BRAND_TEMPLATES,
  runtimes: Object.freeze({
    creator:    "src/lib/creator/*",
    publishing: "src/lib/publishing/*",
    pipeline:   "src/lib/founder/pipeline.ts",
  }),
});

export type HappyBrandKit = typeof HAPPY_BRAND_KIT;
