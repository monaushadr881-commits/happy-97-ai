# HAPPY Dynamic Theme Engine v2.0

Living, premium, enterprise-grade theming layered on top of the frozen
Executive Dark (Black + Gold) system. Purely additive — no schema, service,
or business-logic changes.

## Themes
Aurora Dynamic (default), Executive Dark, Professional Light, Midnight Black,
Ocean Blue, Emerald Green, Royal Purple, Sunset Orange, Rose Gold, Founder Gold.
Seasonal packs: Diwali, Eid, Christmas, New Year, Independence Day, Anniversary,
Launch.

## Module accents
Business gold · Education blue · Knowledge cyan · Creator purple · Research
indigo · Healthcare red · Manufacturing orange · Government green ·
Marketplace pink · Community teal · Enterprise royal gold · Cloud sky ·
Analytics emerald · Developer electric blue · Automation violet.

## Color system
All surfaces read from CSS custom properties: `--color-primary`,
`--color-accent`, `--color-surface`, `--color-glass`, `--color-border`,
`--color-success`, `--color-warning`, `--color-danger`, `--color-info`. A
theme switch swaps the token block on `<html data-theme="…">` — instant, no
reload, no layout shift.

## Background system
Aurora gradient, glass morphism, animated gradient, dynamic glow, soft fog,
light rays, depth layers, floating shapes. All GPU (transform / opacity /
blur only).

## Animation system
GPU-only micro-interactions at 60 fps: magnetic hover, glow, soft ripple,
card lift, glass reflection, cursor spotlight, page transitions. Fully
gated by `prefers-reduced-motion`.

## Digital Human adaptation
Halo, voice ring, thinking / listening / speaking rings and ambient card
lighting bind to the active module accent so Happy visually belongs to the
surface she appears on.

## Accessibility
WCAG AAA target: reduced motion, high contrast, large text, color-blind
safe palettes, keyboard-first navigation, visible focus rings, screen-reader
labels on all interactive tokens.

## Performance
Lazy load per theme, cached token blocks, GPU rendering, zero CLS. Theme
switching is a single custom-property write.

## Customization
Per-user: accent, border radius, animation level, glass level, background
style, sidebar style, card density, font size.

## Founder controls
Create / edit / publish themes, assign defaults, seasonal + festival
packs, brand themes, theme marketplace curation.

## Server surface (read-only stubs)
- `src/lib/theme-v2.functions.ts` — theme catalog + module accent map
- `src/lib/appearance-v2.functions.ts` — appearance preference shape
- `src/lib/personalization-v2.functions.ts` — AI recommendation

## Routes
- `/settings-theme`
- `/settings-appearance`
- `/settings-accessibility`
