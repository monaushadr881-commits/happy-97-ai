# HAPPY X — Executive AI Luxury Design System (v1.0)

The permanent visual language of the HAPPY X ecosystem. Every module, dashboard,
and marketing surface must be composed from these tokens and primitives.

> **Golden rule:** Never hardcode colors, spacing, radii, shadows, or fonts in
> components. Consume tokens via CSS variables (`var(--gold)`) or Tailwind classes
> generated from `@theme` (e.g. `bg-gold`, `text-paper`, `rounded-lg`). For any
> new surface, compose the primitives in `@/design-system` before writing custom
> CSS.

---

## 1. Token Inventory

Authoritative source: `src/styles.css` (`:root` + `@theme inline`).
TypeScript mirror for programmatic use: `src/design-system/tokens.ts`.

| Category      | Tokens |
| ------------- | ------ |
| Color · Brand | `obsidian` `charcoal` `graphite` `onyx` `paper` `soft-gray` `gold` `gold-bright` `gold-deep` |
| Color · Semantic | `success` `warning` `danger` `info` |
| Color · shadcn aliases | `background` `foreground` `card` `popover` `primary` `secondary` `muted` `accent` `destructive` `border` `input` `ring` `sidebar-*` |
| Typography    | `font-display` (Inter Tight) · `font-sans` (Inter) · `font-mono` (Manrope) |
| Radius        | `radius-xs` `-sm` `-md` `-lg` `-xl` `-2xl` `-3xl` `-pill` |
| Elevation     | `shadow-soft` `shadow-lifted` `shadow-luxe` `shadow-gold` `shadow-inset-hair` |
| Motion        | `duration-fast|base|slow|luxe` · `ease-standard|emphasized|spring` |
| Z-index       | `base` `dropdown` `sticky` `overlay` `modal` `toast` `command` |
| Breakpoints   | `sm` `md` `lg` `xl` `2xl` `ultra` (1920px) |
| Gradient      | `text-gradient-gold` `text-gradient-paper` `bg-gradient-luxe` `bg-hairline-gold` |

## 2. Theme Inventory

| Theme | Status | Scope |
| ----- | ------ | ----- |
| Premium Dark  | ✅ default | `:root` |
| Premium Light | ✅ opt-in  | `.light` scope class |
| High Contrast | 🕒 reserved | future `.hc` scope |
| Accessibility | 🕒 reserved | future `.a11y` scope |
| Founder / Presentation / Education / Business | 🕒 reserved | future scope classes |

The theme manager (`src/kernel/theme.tsx`) toggles scope classes on `<html>`.

## 3. Component Inventory

Base primitives live under `src/components/ui/*` (shadcn — Radix-based, accessible).
HAPPY X primitives live under `src/design-system/primitives.tsx` and compose them:

| Primitive     | Purpose | Notes |
| ------------- | ------- | ----- |
| `Section`     | Vertical rhythm for page bands | `py-16 md:py-24` |
| `Container`   | Max-width + gutters | `max-w-7xl px-6 md:px-10` |
| `Eyebrow`     | Signature label above headings | Uppercase 0.32em gold |
| `Hairline`    | Gold divider | Radial gold-fade line |
| `Panel`       | Content surface | `default | elevated | glass`, optional `interactive` lift |
| `PageHeader`  | Dashboard header | Grid layout, mobile-safe |
| `StatCard`    | KPI tile | Label + numeric value + delta + trend |
| `EmptyState`  | Zero-data pattern | Icon + copy + action |
| `Chip`        | Status token | Tones: `neutral gold success warning danger info` |
| `Kbd`         | Keyboard hint | Command palette shortcuts |

Additional shadcn primitives (Dialog, Drawer, Popover, Tooltip, Command,
Calendar, Chart, DataTable, DropdownMenu, Tabs, Accordion, Toast/Sonner, etc.)
are already installed at `src/components/ui/*` and inherit the token system.

## 4. Layout Inventory

Dashboard shell: `src/routes/_authenticated/route.tsx` (sidebar + top bar).

Reusable layout patterns:
- **Marketing** — `Container` + full-bleed `Section` with `bg-gradient-luxe`.
- **Dashboard** — `PageHeader` → `StatCard` grid → `Panel` content.
- **Auth** — Centered card on `bg-obsidian` with `hairline` accent.
- **Empty** — `EmptyState` inside `Panel`.

All layouts respect the sidebar's `collapsible="icon"` mode and mobile-safe grid
(`grid-cols-[minmax(0,1fr)_auto]` when mixing text with fixed-width widgets).

## 5. Motion Inventory

Defined in `src/styles.css` and exposed as tokens.

| Utility            | Use case |
| ------------------ | -------- |
| `animate-rise-in`  | Content reveal on mount |
| `animate-fade-soft`| Overlay & panel fades |
| `animate-float-slow` | Ambient hero elements |
| `animate-pulse-halo` | AI presence indicators |
| `animate-gold-drift` | Premium gradient movement |
| `shimmer-on-hover` | Hover polish on primary surfaces |
| `Panel` (interactive) | Standard hover lift + border glow |

Motion respects `prefers-reduced-motion: reduce` — all animations collapse to
1ms so no user is forced to see movement.

## 6. Accessibility Report

- **Contrast:** Default pairs (paper on obsidian, obsidian on gold, gold on
  obsidian) exceed WCAG AA. Semantic tones tested at 10% overlay + solid text.
- **Focus:** Global `:focus-visible` — 2px gold outline with 2px offset.
- **Keyboard:** Sidebar, dialogs, popovers, and command primitives inherit
  Radix keyboard behavior. Icon-only buttons must supply `aria-label`.
- **Reduced motion:** Global media query neutralizes animations.
- **Semantics:** Use `Section`/`<main>`/`<header>`/`<nav>` primitives, single
  `<main>` per route, headings in order.
- **Screen readers:** shadcn primitives ship correct ARIA out of the box.

## 7. Performance Report

- Design tokens compile to CSS variables at build time — zero runtime cost.
- Primitives are tree-shakeable named exports from `@/design-system`.
- Routes are code-split by TanStack Router; heavy modules lazy-load.
- Google Fonts preconnected in `__root.tsx`; only three weights per family.
- Backdrop filters used sparingly (`glass-luxe`, `glass-panel`) to preserve GPU
  budget on entry surfaces only.

## 8. Extension Guidelines

1. Prefer composition of existing primitives before authoring new ones.
2. New tokens land in `src/styles.css` **and** `src/design-system/tokens.ts` in
   the same commit.
3. New primitives must accept `className`, forward refs where they wrap a real
   element, and only reference tokens (never raw hex).
4. Motion additions must ship a keyframe + `@utility` wrapper and respect the
   reduced-motion rule.
5. Every new primitive gets an entry on `/design` (the living style guide).

## 9. Versioning

- **v1.0** — Foundations: tokens, dark theme, primitives, motion, accessibility.
- **v1.1** (planned) — Light theme polish, high-contrast theme, chart tokens,
  data-grid density system.
- **v2.0** (planned) — Founder / Education / Business theme scopes, voice UI
  components, 3D avatar container.

## 10. Living Style Guide

Visit **`/design`** in the running app to browse tokens and primitives with
live examples.
