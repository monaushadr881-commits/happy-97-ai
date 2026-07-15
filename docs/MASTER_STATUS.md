# HAPPY — Master Status (Honest)

Canonical shipping state as of Batch **R6**. This file mirrors `docs/STATUS.md`; when they diverge, `STATUS.md` wins.

Legend: **WORKING** (end-to-end verifiable) · **PARTIAL** (some real code, gaps) · **STUB** (route/file exists, no logic) · **MISSING** (nothing in repo) · **BLOCKED** (needs external asset/licence)

## Certified WORKING after R6

| Area | Evidence |
|---|---|
| TanStack Start scaffold + SSR + routing | 391 auth + 10 public routes |
| Supabase schema + RLS + roles | 15 migrations, ~115 tables |
| Auth (email + OAuth via Lovable Cloud) | `_authenticated` gate + bearer attacher |
| Founder Command Center (`/founder`) | Real Supabase counts + live ops + revenue tiles + financial tiles |
| Notification Center (`/notifications`) | Real inbox on `public.notifications`, realtime, preferences per kind × channel |
| HAPPY ↔ Platform tool-calling | `dhSpeak` tool loop over `HAPPY_TOOLS` (9 tools) |
| Revenue Cloud (invoices, payments, MRR/ARR, timeseries, sparkline) | `revenueService` over `invoices` + `payments` |
| Financial Foundation — plans catalog (5 seeded tiers) | `plans` table + `/billing → Subscriptions` |
| Financial Foundation — subscriptions + immutable lifecycle events | `subscriptions` + `subscription_events` |
| Financial Foundation — wallet + immutable ledger + derived balance | `wallets` + `wallet_ledger_entries` + `v_wallet_balances` |
| Financial Foundation — credits ledger (consume / purchase / grant / referral, expiry) | `credit_ledger_entries` + `v_credit_balances` |
| Digital Human portrait avatar (blink, drift, gaze, breathing halo) | `HappyAvatar.tsx` |
| Digital Human TTS pipeline | `api/dh.tts.ts` + `useHappySpeech.ts` |
| Digital Human voice input (VAD + dictation) | `useVoiceInput.ts` |
| Digital Human audio-reactive lip signal (RMS→amplitude) | Analyser on TTS + amplitude prop |
| Digital Human shared audio-signal bus | `audio-bus.ts` (speech + mic) |
| Digital Human live waveform (speaking + listening) | Real speech-RMS + mic-RMS |
| Digital Human SVG eyelids | Real SVG close, not veil |
| Digital Human expression blend layer (12 tokens) | Weighted opacity crossfade |
| Digital Human greeting on first mount | Smile + spoken "Hi, I'm HAPPY." |
| OS `prefers-reduced-motion` respected | `DigitalHumanContext` merge |
| SR live-region status announcer | `role=status aria-live=polite` |
| Security headers (CSP-RO, HSTS, nosniff, Referrer, Permissions, XFO, COOP) | `securityHeadersMiddleware` |
| SEO — robots.txt + sitemap.xml + JSON-LD (Org + WebSite) | `/api/robots.txt`, `/api/sitemap.xml`, `__root.tsx` |
| PWA — manifest + apple-touch-icon | `public/manifest.webmanifest` |

## PARTIAL

| Area | Gap |
|---|---|
| Digital Human mouth-shape variation (A/E/O/U) | Overlay blend only — portrait cannot morph |
| Revenue Cloud — GST / tax invoices | Per-invoice `tax_cents` displayed; no tax engine |
| Founder sub-pages (Users/Companies/Ops/Security/Analytics/AI/System) | Legacy routes, not re-audited this pass |
| Accessibility sweep (icon-button labels, single `<main>`, `h-dvh`) | Sitewide sweep pending |

## STUB

| Area | Location |
|---|---|
| Brain runtime | `brain-v3.functions.ts` → `roadmap.service.ts` `NOT_IMPLEMENTED` |
| Business modules UI (CRM/ERP/HRMS/Manufacturing/Finance/Inventory) | Tables exist; routes are `V2TabBody` |
| Marketplace pipeline (publish → review → approve → install → rate) | UI + functions exist; no pipeline/scanner/signing |
| Global Cloud / Edge / Multi-region / DevOps | UI + functions exist; no infra |
| MCP host / AI Model Hub / Connector runtime | Functions exist; no runtime |
| ~95 auth pages rendering only `V2TabBody` | Deliberate placeholders |

## MISSING

- Payment provider integrations (Stripe / Razorpay / Paddle / Cashfree / PayPal) — provider-agnostic model in place; no adapters, no `/api/public/webhooks/*`
- Coupons / promo engine
- Notifications delivery runtime (email / SMS / push out-of-app)
- Website / App / PWA / Android / iOS / Desktop builders (real generators)
- Customer billing portal
- Rate limiting middleware
- Webhook signature verification helpers
- Cross-platform builds (Android / iOS / Desktop)
- Digital Human real face rig (visemes / phonemes / mesh morph / chest / shoulders)
- Digital Human emotion state machine
- Service worker / offline cache (intentional; not requested)

## BLOCKED (external assets required)

- **Live2D runtime** — Cubism SDK licence + `public/happy-live2d/{model.model3.json, model.moc3, textures/*, physics3.json, expressions/*, motions/*}`
- **Live3D runtime** — `public/happy-live3d/happy.glb` (rigged, ARKit 52 blendshapes, hand rig) + animations + `env.hdr`

## Certification rule

The platform is **NOT** certified as a whole. Only the areas listed under "Certified WORKING after R6" are certified. Everything else must be treated as PARTIAL / STUB / MISSING / BLOCKED per this matrix.
