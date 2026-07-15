# HAPPY Platform — Honest Status Matrix

**Last updated:** Batch R1 recovery pass.

> This document supersedes every "Successfully Activated" / "Production
> Certified" declaration in the `docs/architecture/*.md` and
> `docs/release/*.md` files. Those documents describe *intent*, not
> shipped functionality. Do not treat them as evidence of working code.
> When in doubt, read the source.

## How to read this matrix

- **Working** — implemented, connected end-to-end, verifiable in the
  running app.
- **Partial** — some real code, but missing critical pieces
  (persistence, backend, UI, or verification).
- **Stub** — file exists but the handler returns `NOT_IMPLEMENTED` or
  the UI is a `V2TabBody` placeholder card.
- **Missing** — nothing in the repo backs the claim.

## Status by area

| Area | Status | Evidence |
|---|---|---|
| TanStack Start scaffold, routing, SSR | Working | 391 auth routes + 10 public routes registered |
| Supabase schema, RLS, roles | Working | 13 migrations, ~110 tables, RLS policies present |
| Auth (email + OAuth via Lovable Cloud) | Working | `_authenticated` gate + bearer attacher |
| Digital Human portrait avatar (blink, drift, gaze, breathing halo) | Working | `HappyAvatar.tsx` |
| Digital Human TTS pipeline | Working | `api/dh.tts.ts` + `useHappySpeech.ts` |
| Digital Human voice input (VAD + dictation) | Working | `useVoiceInput.ts` |
| Digital Human audio-reactive lip signal | Working (Batch R1) | Analyser on TTS + amplitude prop on avatar |
| Digital Human live waveform | Working (Batch R1) | Real amplitude drives bars |
| Digital Human real face rig (visemes / lip sync / eye morphs / chest / shoulders) | Missing | Portrait is a photo; would need SVG/2D rig |
| Digital Human emotion state machine | Missing | Only 7 expression tokens; no state machine |
| Pricing page render warning | Working (Batch R1) | Fragment key added |
| Security headers (CSP-RO, HSTS, nosniff, Referrer, Permissions, XFO, COOP) | Working (Batch R1) | `securityHeadersMiddleware` in `src/start.ts` |
| SEO — robots.txt | Working (Batch R1) | `/api/robots.txt` |
| SEO — sitemap.xml | Working (Batch R1) | `/api/sitemap.xml` |
| SEO — JSON-LD (Organization + WebSite) | Working (Batch R1) | `__root.tsx` scripts |
| PWA — manifest (home-screen install) | Working (Batch R1) | `public/manifest.webmanifest` + link + apple-touch-icon |
| PWA — service worker / offline | Not implemented | Intentional per PWA skill (user has not asked for offline) |
| Brain runtime | Stub | `brain-v3.functions.ts` → `roadmap.service.ts` returns `NOT_IMPLEMENTED` |
| Founder dashboard | Stub | `founder-v2.functions.ts` 18 LOC; UI is `V2TabBody` |
| Business modules (CRM, ERP, HRMS, Manufacturing, Finance, Inventory) | Stub | Tables exist; UI routes are `V2TabBody` |
| Revenue Cloud (subscriptions, invoices, webhooks, customer portal) | Missing | No Stripe/Paddle enabled; only scaffold functions |
| Notifications runtime (email + push + in-app delivery) | Missing | `notifications` table exists; no send pipeline |
| Website / App / PWA / Android / iOS / Desktop Builders | Missing | 17-line `builder-v1.functions.ts`; no generator, no build pipeline |
| Marketplace (publish → review → approve → install → rate) | Stub | UI + functions exist; no pipeline, no scanner, no signing |
| Global Cloud, Edge, Multi-region, DevOps | Stub | UI + functions exist; no infrastructure |
| MCP host, AI Model Hub, Connector runtime | Stub | Functions exist; no runtime |
| Rate limiting | Missing | No middleware |
| Webhook signature verification helpers | Missing | Documented only |
| Accessibility sweep (icon-button labels, single `<main>`, `h-dvh`) | Partial | Avatar respects reduced-motion; sitewide sweep pending |
| Cross-platform builds (Android / iOS / Desktop) | Missing | No build pipeline, no store artifacts |
| 95+ auth pages rendering only `V2TabBody` | Placeholder | Deliberately kept as visible placeholders until real UI ships |

## What Batch R1 shipped (2026-07-15)

1. **Pricing key warning fixed** — `PricingExperience.tsx` fragment inside `.map` now has a `Fragment key`.
2. **Real audio-reactive lip-sync signal** — `useHappySpeech` routes TTS
   PCM through `GainNode → AnalyserNode → destination`; a 60 Hz RAF loop
   computes RMS and publishes it on a module-level bus consumed by
   `useSpeechAmplitude()`.
3. **Real amplitude-driven mouth overlay** — `HappyAvatar` accepts an
   `amplitude` prop and modulates the mouth-region glow's opacity + scale.
4. **Real audio-driven waveform** — `LiveWaveform` on the Digital Human
   page now reads live amplitude during speaking (ambient shimmer during
   listening/thinking).
5. **Security headers middleware** in `src/start.ts` — CSP
   (Report-Only), HSTS, nosniff, Referrer-Policy, Permissions-Policy,
   XFO (skipped inside Lovable preview), COOP.
6. **SEO minimum** — `/api/robots.txt`, `/api/sitemap.xml`, Organization
   + WebSite JSON-LD in root head.
7. **PWA manifest** — `public/manifest.webmanifest` + `<link rel="manifest">`
   + `<link rel="apple-touch-icon">` in root head. No service worker.
8. **This document** — the honest matrix.

## What Batch R1 explicitly did NOT do

- Did not replace any `V2TabBody` placeholder page.
- Did not implement any `NOT_IMPLEMENTED` service method.
- Did not enable Stripe/Paddle.
- Did not build a service worker or offline cache.
- Did not add a face rig — the portrait is a photo and the mouth region
  cannot morph. Amplitude modulates a glow overlay, not lip geometry.
  That is an honest signal; it is not the same as visemes.
- Did not claim any new "Production Certified" status.

## Next batches (see `.lovable/plan.md`)

- R2: replace `NOT_IMPLEMENTED` for Brain, Founder, Business, Analytics, Notifications backends.
- R3: replace `V2TabBody` on Founder / Brain / Business / Notifications pages with real UIs.
- R4: real Revenue runtime (Stripe seamless).
- R5: Notifications delivery pipeline.
- R6: Website Builder (real, minimal).
- R7: Marketplace real workflow.
- R8: Rate limiting + webhook hardening + a11y sweep.

The rest (native mobile builders, multi-region cloud, MCP runtime,
offline SW, full face rig) stays honestly labeled Missing until scoped
and built.
