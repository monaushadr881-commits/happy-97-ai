# HAPPY Platform — Honest Status Matrix

**Last updated:** Batch R5 (Revenue Cloud + Founder integration).

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
| Digital Human audio-reactive lip signal | Working (R1) | Analyser on TTS + amplitude prop on avatar |
| Digital Human live waveform (speaking + listening) | Working (R2-DH) | Real speech-RMS + mic-RMS drive bars |
| Digital Human SVG eyelids (real close, not full veil) | Working (R2-DH) | Two SVG lids scale on `blink` at eye Y |
| Digital Human mouth-shape variation (A/E/O/U via centroid) | Partial (R2-DH) | Overlay width/height blends by centroid; photo cannot morph |
| Digital Human expression blend layer (12 tokens) | Working (R2-DH) | Weighted opacity crossfade — no hard switch |
| Digital Human greeting on first mount | Working (R2-DH) | Smile + "Hi, I'm HAPPY." spoken via TTS |
| Digital Human shared audio-signal bus (`audio-bus.ts`) | Working (R2-DH) | Speech + mic on one useSyncExternalStore bus |
| Digital Human Live2D runtime | Blocked (asset) | `renderers/index.ts` throws BLOCKED_ASSET_REQUIRED |
| Digital Human Live3D runtime | Blocked (asset) | `renderers/index.ts` throws BLOCKED_ASSET_REQUIRED |
| Digital Human real face rig (visemes / phonemes / mesh morph / chest / shoulders) | Missing | Portrait is a photo; requires Live2D or GLB asset |
| Digital Human emotion state machine | Missing | Only 12 expression tokens; no state machine |
| Pricing page render warning | Working (Batch R1) | Fragment key added |
| Security headers (CSP-RO, HSTS, nosniff, Referrer, Permissions, XFO, COOP) | Working (Batch R1) | `securityHeadersMiddleware` in `src/start.ts` |
| SEO — robots.txt | Working (Batch R1) | `/api/robots.txt` |
| SEO — sitemap.xml | Working (Batch R1) | `/api/sitemap.xml` |
| SEO — JSON-LD (Organization + WebSite) | Working (Batch R1) | `__root.tsx` scripts |
| PWA — manifest (home-screen install) | Working (Batch R1) | `public/manifest.webmanifest` + link + apple-touch-icon |
| PWA — service worker / offline | Not implemented | Intentional per PWA skill (user has not asked for offline) |
| Brain runtime | Stub | `brain-v3.functions.ts` → `roadmap.service.ts` returns `NOT_IMPLEMENTED` |
| Founder Command Center (`/founder`) | Working (R3-CC) | Real Supabase counts (companies, users, workspaces, brands, ai_sessions, conversations, deployments, notifications), live ops health probes, queue stats, deployment analytics, security snapshot, audit feed — with Loading/Error/Empty/Retry per panel. Metrics without a backend render as "Not Available Yet" (Revenue MRR, Credits Consumed, Wallet Balance). `analytics.service.ts` platformOverview expanded; health/queue field-name bugs fixed. |
| Founder sub-pages (Users, Companies, Ops, Security, Analytics, AI, System) | Partial | Legacy routes, not audited this pass |
| Digital Human — OS `prefers-reduced-motion` respected | Working (R3-CC) | `DigitalHumanContext.usePrefersReducedMotion` merges into `prefs.reduced_motion` |
| Digital Human — SR live-region status announcer | Working (R3-CC) | `role=status aria-live=polite` in `digital-human.index.tsx` announces state transitions |
| Business modules (CRM, ERP, HRMS, Manufacturing, Finance, Inventory) | Stub | Tables exist; UI routes are `V2TabBody` |
| Revenue Cloud (subscriptions, invoices, webhooks, customer portal) | Missing | No Stripe/Paddle enabled; only scaffold functions |
| Notification Center (`/notifications`) | Working (R4) | Real inbox on `public.notifications`: filter all/unread/read, category sidebar with per-kind unread counts, mark read / mark unread / mark all read / delete, unread badge, realtime via `postgres_changes` on `user_id`, ARIA live region, keyboard-operable buttons. Preferences panel toggles per-kind × per-channel (`in_app`/`email`/`push`) upserts into `public.notification_preferences`. Dev-only sample seeder. Server fns in `src/lib/notification-center.functions.ts`, all `.middleware([requireSupabaseAuth])`. |
| Notifications delivery runtime (email + push out-of-app) | Missing | In-app delivery works; no email/SMS/push transport wired yet. |
| HAPPY ↔ Platform tool-calling (R4) | Working | `dhSpeak` now runs an OpenAI-compatible tool loop over `HAPPY_TOOLS` (`src/lib/happy-tools.server.ts`). Tools call real services under the caller's RLS: `platform_overview`, `platform_health`, `queue_stats`, `deployment_stats`, `security_summary`, `unread_notifications_count`, `list_notifications`, `mark_all_notifications_read`, `open_route`. Tools return `client_actions` (navigate/invalidate/toast) which the DH page executes via `useNavigate`, `queryClient.invalidateQueries`, and `sonner`. |
| Website / App / PWA / Android / iOS / Desktop Builders | Missing | 17-line `builder-v1.functions.ts`; no generator, no build pipeline |
| Marketplace (publish → review → approve → install → rate) | Stub | UI + functions exist; no pipeline, no scanner, no signing |
| Global Cloud, Edge, Multi-region, DevOps | Stub | UI + functions exist; no infrastructure |
| MCP host, AI Model Hub, Connector runtime | Stub | Functions exist; no runtime |
| Rate limiting | Missing | No middleware |
| Webhook signature verification helpers | Missing | Documented only |
| Accessibility sweep (icon-button labels, single `<main>`, `h-dvh`) | Partial | Avatar respects reduced-motion; sitewide sweep pending |
| Cross-platform builds (Android / iOS / Desktop) | Missing | No build pipeline, no store artifacts |
| 95+ auth pages rendering only `V2TabBody` | Placeholder | Deliberately kept as visible placeholders until real UI ships |

## What Batch R2-DH shipped (2026-07-15)

1. **Shared audio-signal bus** — `src/components/digital-human/audio-bus.ts`
   publishes both `speech` and `mic` `{ rms, centroid }` on a single
   `useSyncExternalStore`. Speech is written by `useHappySpeech`, mic by
   `useVoiceInput`. No fake fallback path.
2. **Mic-driven waveform** — `LiveWaveform` on `/digital-human` reads live
   mic RMS during `listening` (not a generated sine). Speaking still reads
   speech RMS. Thinking is a labelled idle shimmer only.
3. **SVG eyelids** — replaced the full-screen "blink veil" with two SVG
   rects at the approximate eye row (viewBox 100×100, y=28). Each lid
   scales vertically on `blink`, honestly darkening only the eye row.
4. **Mouth-shape variation** — mouth overlay now blends a "wide" (E/AI)
   and "round" (O/U) radial gradient by spectral-centroid weight, with
   amplitude driving size and opacity. Portrait is a photo, so this is
   a real signal-driven overlay, not a rig morph.
5. **Expression layer (12 tokens)** — new `ExpressionLayer` component
   weights five tint layers (smile, brow, warmth, focus, gold) per
   expression with a 700ms crossfade. Added `confidence`, `empathy`,
   `teaching`, `business`, `founder` to `AvatarExpression`.
6. **Greeting engine** — first mount of `/digital-human` triggers a
   smile + spoken "Hi, I'm HAPPY." then returns to idle. Skipped under
   mute or reduced-motion.
7. **Renderer registry** — `src/components/digital-human/renderers/index.ts`
   catalogues `portrait`, `layered-portrait` (ready) and `live2d`,
   `live3d` (`BLOCKED_ASSET_REQUIRED`). `selectRuntime()` throws with the
   exact missing-asset list when a blocked runtime is requested.

## What Batch R2-DH did NOT do

- Did not create a Live2D runtime (asset + SDK licence required).
- Did not create a Live3D runtime (rigged GLB required).
- Did not add a phoneme aligner (Rhubarb/Gentle/Azure Viseme).
- Did not implement a hand/gesture rig (no bone data available).
- Did not merge the RAF loops into one master scheduler (current loops
  are cheap and independent — deferred to a later batch).
- Did not enable any payment provider or backend module.

## Blocked-on-asset — exact requirements

**Live2D runtime**
- Live2D Cubism SDK licence (proprietary, per-seat)
- `public/happy-live2d/model.model3.json`
- `public/happy-live2d/model.moc3`
- `public/happy-live2d/textures/*.png`
- `public/happy-live2d/physics3.json`
- `public/happy-live2d/expressions/*.exp3.json`
- `public/happy-live2d/motions/*.motion3.json`

**Live3D runtime**
- `public/happy-live3d/happy.glb` (rigged mesh with humanoid skeleton)
- ARKit 52 blendshapes on the head mesh
- Hand rig with finger bones
- `public/happy-live3d/animations/*.glb` (idle, gesture, greet)
- `public/happy-live3d/env.hdr` for IBL lighting



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
