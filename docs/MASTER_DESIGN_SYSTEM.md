# HAPPY — MASTER DESIGN SYSTEM

**Version:** 1.0 · Companion to `MASTER_UI_GUIDELINES.md`.

Canonical design language for every HAPPY surface. Source files:
`src/design-system/tokens.ts`, `src/design-system/primitives.tsx`,
`src/styles.css`.

## 1. Principles

1. **One HAPPY** — every product surface (Founder, Business OS, Studio,
   Digital Human, Billing, Notifications) feels like one operating system.
2. **Semantic tokens only** — never hardcode colors, fonts, spacing in
   components. Use design tokens.
3. **Dark-first** — the default theme is dark; light must be equally polished.
4. **Motion is a signal** — motion communicates state, never decorates.
5. **Reduced-motion respected** — `prefers-reduced-motion` disables all
   non-essential animation.

## 2. Color Tokens (semantic)

All color is declared in `src/styles.css` `@theme` and consumed via
Tailwind v4 utility classes. Never use `text-white`, `bg-black`, or
`bg-[#...]` in components.

Categories:

- `--color-background` / `--color-foreground`
- `--color-card` / `--color-card-foreground`
- `--color-primary` / `--color-primary-foreground`
- `--color-secondary` / `--color-muted` / `--color-accent`
- `--color-destructive` / `--color-warning` / `--color-success`
- `--color-border` / `--color-input` / `--color-ring`

Digital Human channels use their own dedicated tokens
(`--dh-halo`, `--dh-wave-speak`, `--dh-wave-listen`) to keep audio-reactive
visuals identifiable across themes.

## 3. Typography

- Display: geometric sans (headings, KPIs)
- Body: humanist sans (paragraphs, tables)
- Mono: for code, IDs, ledger entries

Sizes follow the Tailwind scale; never inline `font-size: 13px`.

## 4. Spacing & Layout

- 4 px base grid.
- Use `Container`, `Section`, `Stack`, `Row` primitives from
  `src/design-system/primitives.tsx`.
- Page padding: `py-6 md:py-10` on route layouts.

## 5. Elevation

Three tiers only:

- `flat` — no shadow, border only
- `raised` — subtle shadow for cards
- `overlay` — dialogs, popovers, command palette

## 6. Motion

- 150 ms — micro (hover, focus)
- 250 ms — small (tabs, disclosures)
- 400 ms — large (page-level, dialogs)

Digital Human motion (blink, drift, breathing) is driven by the
`audio-bus` and MUST bypass the standard animation tokens.

## 7. Iconography

- Lucide icons only.
- Every icon-only button MUST have `aria-label`.

## 8. Components (shadcn-based)

Approved primitives live in `src/components/ui/*`. When theming needs
change, edit the variant in the primitive, never override at call sites
with hardcoded classes.

## 9. Accessibility Baseline

- WCAG 2.1 AA contrast minimum.
- Focus rings visible in both themes (`--color-ring`).
- Reduced-motion honored via `DigitalHumanContext` and Tailwind's
  `motion-safe` / `motion-reduce` variants.

## 10. Do NOT

- Do NOT introduce a new font, palette, or spacing scale without Founder approval.
- Do NOT ship purple/indigo gradient hero on white — generic AI aesthetic.
- Do NOT hardcode brand colors; add a token instead.
