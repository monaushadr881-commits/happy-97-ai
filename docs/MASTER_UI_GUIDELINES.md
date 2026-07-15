# HAPPY — MASTER UI GUIDELINES

**Version:** 1.0 · Companion to `MASTER_DESIGN_SYSTEM.md`.

Concrete component and interaction rules. When these disagree with a
per-module design doc, this file wins.

## 1. Page Anatomy

Every authenticated page:

1. Route layout wraps content in `<Container className="py-6 md:py-10">`.
2. Exactly one `<main>` per route tree.
3. Page heading is a single `<h1>` — subheadings use `<h2>` / `<h3>`.
4. Loading, empty, and error states are first-class (never blank div).

## 2. Data Fetching UI Contract

Follow the TanStack Query + Router pattern:

- Loader preloads with `context.queryClient.ensureQueryData(queryOptions)`.
- Component reads with `useSuspenseQuery(queryOptions)`.
- Suspense boundary shows a skeleton, not a spinner-only.
- Error boundary shows the error + a Retry button that calls both
  `router.invalidate()` and `reset()`.

Never use `useEffect` + `fetch` for initial render.

## 3. Forms

- Zod schema in the same file (or colocated `.schema.ts`).
- React Hook Form + shadcn `<Form />` primitives.
- Inline field errors with `aria-describedby`.
- Submit button disabled while pending; label changes to "Saving…".

## 4. Tables & Lists

- Server-paginated (limit ≤ 200 per page).
- Column headers use `scope="col"`.
- Row actions collapse into a menu on `sm:` and below.
- Empty state: illustration + one CTA, never bare text.

## 5. Feedback

- Toasts for transient success/failure (`useToast`).
- Inline banners for persistent state (subscription expired, credit low).
- Live regions (`role="status" aria-live="polite"`) for async progress.

## 6. Navigation

- All nav uses `<Link to="...">` from `@tanstack/react-router`.
- Never anchor-nav (`href="#..."`) as primary navigation between sections.
- Breadcrumbs on any page ≥ 2 levels deep.

## 7. Digital Human Surfaces

- HAPPY avatar (`HappyAvatar.tsx`) is the only face of the platform.
- Speaking waveform uses `--dh-wave-speak`; listening uses `--dh-wave-listen`.
- Tool calls that navigate MUST wait 250 ms after speech tail before
  executing `client_actions` (see `dhSpeak`).

## 8. Accessibility Checklist (per PR)

- [ ] Every interactive element reachable by keyboard
- [ ] Focus visible on both themes
- [ ] Icon-only buttons have `aria-label`
- [ ] Dialogs trap focus, restore on close
- [ ] `prefers-reduced-motion` disables non-essential motion
- [ ] Contrast ≥ 4.5:1 body / 3:1 large

## 9. Copy

- Sentence case for titles and buttons.
- Numbers formatted with `Intl.NumberFormat` (locale-aware).
- Currency uses the store's `currency_code`, never a hardcoded symbol.
- Dates use `Intl.DateTimeFormat`, ISO in tooltips.

## 10. Do NOT

- Do NOT ship a page whose body is only `<V2TabBody />`.
- Do NOT put business logic in components; call a server function.
- Do NOT read from Supabase directly in components; go through a service.
- Do NOT introduce new libraries without Founder approval.
