# HAPPY Platform — Honest Status Matrix

**Last updated:** R8 — Payment Business Processor (Event → Business Runtime).

## R8 — Payment Business Processor — 2026-07-15

- **Business processor: Working.** `src/lib/payments/business-processor.ts` — dispatcher + idempotent handlers for `payment.succeeded/failed`, `refund.created/completed`, `subscription.created/renewed/cancelled/expired`, `invoice.paid/failed`, `customer.updated`. Unknown events short-circuit as `ignored`.
- **Inline dispatch: Working.** `POST /api/public/webhooks/payments/:provider` now runs verify → audit → normalize → **process** in the same request. Provider still gets `200` immediately after audit; processor failures update the audit row (never block ACK).
- **Idempotency: Working.** New unique index `payments_provider_ref_uk` on `(provider, provider_ref)` + upsert on-conflict. Processor guards on `process_status IN ('processed','ignored','dead')` — re-delivery is a no-op.
- **Retry queue + backoff: Working.** New columns `attempts, last_error, next_attempt_at, processed_at, business_result` on `payment_webhook_events`. Backoff schedule: 30s, 2m, 10m, 30m, 2h.
- **Dead-letter: Working.** New enum value `webhook_process_status.dead`. Events transition to `dead` at `attempts >= 5`.
- **Retry poller: Working.** `POST /api/public/cron/payments-retry` (also `GET`) — picks up to 25 failed events with `next_attempt_at <= now()` and re-dispatches. Wire via pg_cron (SQL example in the route file).
- **Manual reprocess (ops): Working.** `reprocessWebhookEvent(eventId)` server fn — gated by `is_ops_admin`.
- **Processor stats (ops): Working.** `getProcessorStats()` — 24h totals per outcome + last error surface.
- **Audit trail: Working.** Every successful handler writes `public.audit_logs` via `write_audit` RPC.
- **Notifications: Working (best-effort).** Insert into `public.notifications` when `metadata.user_id` correlation is present; silently skipped otherwise (never fake a recipient).
- **Subscription events: Working.** Handlers append to `public.subscription_events` with `provider` + `provider_event_id`.
- **Invoice settlement: Working.** `invoice.paid` and payment-linked `invoice_id` update `amount_paid_cents`, flip status to `paid`, set `paid_at`. `invoice.failed` flips to `overdue`.
- **Wallet runtime: Blocked.** No wallet-provider correlation contract yet — event marked `failed`/`unmapped_wallet` rather than fabricating balances. Real handler lands with wallet runtime.
- **Credits runtime: Blocked.** Same rule — never grant fake credits.
- **Correlation contract: Documented in code.** Providers must include `company_id`/`invoice_id`/`subscription_id`/`user_id` inside `metadata`/`notes`/`custom_data`. Unmapped events flow to `failed` with `unmapped_<field>` (no silent success).
- **Founder dashboard refresh: Partial.** Ops-scoped read surfaces (`getWebhookHealth`, `getProcessorStats`) return live data; dashboard widget wiring is a UI-only follow-up.
- **Security:** Immutability trigger relaxed — original event fields (`provider`, `verify_result`, `payload_digest`, `received_at`, etc.) remain immutable; only lifecycle columns (`process_status`, `attempts`, `last_error`, `processed_at`, `next_attempt_at`, `business_result`) are writable. Retry endpoint is service-role only and only reads/writes its own table. Linter warnings (8) are the pre-existing SECURITY DEFINER role helpers — not introduced by this pass.
- **Playwright:** Public webhook + retry endpoints run on the SSR worker with raw bodies + HMAC headers — not driveable from the browser preview. Deferred to the P0.1 regression harness.
- **Files changed:** `supabase/migrations/…_r8_payment_business_processor.sql`, `src/lib/payments/business-processor.ts`, `src/lib/payments/business-processor.functions.ts`, `src/routes/api/public/webhooks/payments.$provider.ts`, `src/routes/api/public/cron/payments-retry.ts`, `docs/STATUS.md`.

## R7 — Payment Provider Foundation + Secure Webhook Runtime — 2026-07-15

- **Webhook Security helper (P0.2): Working.** `src/lib/webhook-security.ts` unchanged; reused by every adapter (no duplication).
- **Provider abstraction: Working.** `src/lib/payments/types.ts` — `PaymentAdapter`, `CanonicalWebhookEvent`, `CanonicalEventType`, capability flags. No provider-specific business logic outside adapters.
- **Provider registry / factory: Working.** `src/lib/payments/registry.ts` — `getAdapter(code)`, `listProviders()`, per-provider `getWebhookSecret()` env-var lookup.
- **Stripe adapter: Partial.** Webhook verify + normalize Working (16 event types mapped). Checkout / refunds / subscriptions Blocked on `STRIPE_SECRET_KEY` + SDK selection.
- **Razorpay adapter: Partial.** Webhook verify + normalize Working (12 events). Charge/refund APIs Planned.
- **Paddle adapter: Partial.** Webhook verify + normalize Working (Paddle Billing v2 header format `ts=…;h1=…`). Transactions/subscriptions Planned.
- **Cashfree adapter: Partial.** Webhook verify + normalize Working (base64 HMAC + `x-webhook-timestamp` window). Orders/refunds Planned.
- **PayPal adapter: Missing (reserved).** Contract in place; adapter not implemented.
- **Public webhook runtime: Working.** `POST /api/public/webhooks/payments/:provider` — HMAC verify → replay-guard → normalize → append-only audit row. Correct HTTP statuses: 200 verified, 400 missing, 401 bad_signature, 408 expired, 409 replay, 503 no secret. CORS + OPTIONS handled.
- **Audit log: Working.** New table `payment_webhook_events` — append-only via immutable trigger, unique on `(provider, provider_event_id)` for idempotency, RLS restricts reads to `is_ops_admin`.
- **Founder webhook health surface: Working (read).** `getWebhookHealth` server fn returns 24h counts, last success/failure per provider from real rows. Non-admins get empty rows (correct signal for "Not available").
- **Business processing (activate subscription / credit wallet / settle invoice): Planned.** Ingest is decoupled from processing; downstream workers read `payment_webhook_events`. Ships with P0.4 charge SDKs.
- **Security warnings from migration:** 8 `SECURITY DEFINER` warnings are **pre-existing** role-check helpers (`has_role`, `is_ops_admin`, `is_platform_founder`, etc.) required for RLS. R7 added only `payment_webhook_events_immutable` (SECURITY INVOKER). Not introduced by this pass.
- **Files:** `supabase/migrations/…_r7_payment_webhook_events.sql`, `src/lib/payments/{types,registry,webhook-runtime.functions}.ts`, `src/lib/payments/adapters/{stripe,razorpay,paddle,cashfree}.ts`, `src/routes/api/public/webhooks/payments.$provider.ts`, `docs/STATUS.md`.
- **Verification:** `tsgo --noEmit` clean. Playwright signature/replay tests deferred to P0.1 regression harness (browser preview cannot invoke public webhook routes with raw bodies).



## Identity Lock v1.0 — 2026-07-15

- Permanent Founder lock on HAPPY identity: face, hair, clothing, executive appearance, greeting, voice, personality.
- Primary live human model reference registered: `src/assets/digital-human/character/happy-live-model-v1.png.asset.json`.
- R4 seated portrait retained as secondary reference.
- Character manifest bumped to `1.1.0` with `reference_assets` map.
- No runtime, architecture, database, or business-logic changes in this pass.
- Live2D and Live3D remain **Blocked (asset)** — same identity required when assets arrive.

## R4-CHAR — Character Identity Lock

- Registered official HAPPY character (professional executive, luxury black suit, white shirt, dark formal look — H.P PRIVATE LIMITED).
- Locked reference image at `src/assets/digital-human/character/happy-reference-r4.png.asset.json`.
- Created character manifest: `character.json`, `identity.json`, `appearance.json`, `expressions.json` (17 tokens), `animations.json`, `runtime.json`, `voice.json`, `personality.json`.
- Portrait runtime remains **Working** and continues to render `HappyAvatar.tsx`. No runtime code was changed in this pass (per Freeze rule).
- Live2D and Live3D remain **Blocked (asset)** — the character lock does not enable them.
- Created `docs/MASTER_EXECUTION_REGISTER.md` — permanent implementation register.

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
| Founder Command Center (`/founder`) | Working (R3-CC → R5) | Real Supabase counts + live ops (health/queue/deploys/security/audit). Revenue KPIs wired to `revenueService.overview` (MRR 30d, ARR est., Payments 30d, Refunds 30d, Open/Overdue invoices). Wallet / Credits still render "Not Available Yet" — no wallet or credit ledger table exists. |
| Founder sub-pages (Users, Companies, Ops, Security, Analytics, AI, System) | Partial | Legacy routes, not audited this pass |
| Digital Human — OS `prefers-reduced-motion` respected | Working (R3-CC) | `DigitalHumanContext.usePrefersReducedMotion` merges into `prefs.reduced_motion` |
| Digital Human — SR live-region status announcer | Working (R3-CC) | `role=status aria-live=polite` in `digital-human.index.tsx` announces state transitions |
| Business modules (CRM, ERP, HRMS, Manufacturing, Finance, Inventory) | Stub | Tables exist; UI routes are `V2TabBody` |
| Revenue Cloud — invoices | Working (R5) | `revenueService.listInvoices` + `/billing` invoices table over `public.invoices` (RLS-scoped). |
| Revenue Cloud — payments / transactions | Working (R5) | `revenueService.listPayments` + `/billing` transactions table over `public.payments`. |
| Revenue Cloud — revenue analytics (MRR/ARR, 30d/365d, refunds, timeseries) | Working (R5) | `revenueService.overview` + `revenueTimeseries` derived from `invoices.paid_at` and `payments.status`. Sparkline in `/billing`. |
| Revenue Cloud — GST / tax invoices | Partial (R5) | Per-invoice `tax_cents` displayed; no jurisdictional tax engine. |
| Financial Foundation — plans catalog | Working (R6) | `plans` table + 5 seeded tiers (Free/Starter/Pro/Business/Enterprise), rendered in `/billing → Subscriptions`. |
| Financial Foundation — subscriptions + lifecycle events | Working (R6) | `subscriptions` + immutable `subscription_events` with RLS; `financialService.listSubscriptions` / `subscriptionOverview` powering `/billing` + Founder tiles. Provider adapters (Stripe/Razorpay/Paddle/Cashfree/PayPal) intentionally not wired — abstraction only. |
| Financial Foundation — wallet + ledger | Working (R6) | `wallets` + immutable `wallet_ledger_entries`; balance derived from `v_wallet_balances` (security_invoker). `/billing → Wallet & Credits` renders live ledger. Auto-provisions user wallet via `finEnsureUserWallet`. |
| Financial Foundation — credits ledger | Working (R6) | Immutable `credit_ledger_entries` with expiry; balance from `v_credit_balances`. Consume/purchase/grant/referral entry types enforced by RLS (grants require ops admin). |
| Financial Foundation — payment provider integrations | Missing | Provider-agnostic by design (`subscriptions.provider`, `wallet_ledger_entries.metadata.provider`). No Stripe/Razorpay/Paddle/Cashfree/PayPal adapter wired yet; no `/api/public/webhooks/*` handler yet. |
| Financial Foundation — coupons / promo engine | Missing | Not modelled. Documented as next step in `docs/architecture/financial-foundation.md`. |
| Founder Dashboard — financial tiles (Wallet Volume, Credits Outstanding, Active Subs, Trials, Renewals 30d) | Working (R6) | `finFounderOverview` server function; tiles honestly render `Not Available Yet` when views empty. |
| Revenue Cloud — payment provider webhooks (Stripe/Paddle) | Missing | No provider enabled. |
| Revenue Cloud — customer billing portal | Missing | Requires provider portal or bespoke customer-scoped surface. |
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

## R9 — Subscription Lifecycle Engine (WORKING)

Real state machine over `public.subscriptions` + `subscription_events`,
reusing the existing R7/R8 webhook + business processor runtime.

**Supported states**: trial, active, past_due, paused, cancelled, expired.

**Supported actions**: create, activate, renew, pause, resume, cancel,
cancel_at_period_end, expire, change_plan (upgrade/downgrade),
trial_start, trial_end, payment_failed, payment_recovered.

**Guarantees**
- Idempotent — repeat calls in the target state are a no-op.
- Every accepted transition writes `subscription_events` + `audit_logs`
  + in-app notification.
- Company-admin gated (`is_company_admin`) for every mutation.
- Time-driven transitions (trial end, grace expiry, cancel_at,
  non-renew period end) advanced by
  `POST /api/public/cron/subscriptions-tick`.
- Webhook `payment.failed` (with `subscription_id`) → `past_due`.
  Webhook `payment.succeeded` (with `subscription_id`) → recovers to
  `active`. Webhook `subscription.*` routed through the same engine.

**Files**
- `src/lib/subscriptions/lifecycle.ts` — engine + `createSubscription`
  + `transitionSubscription`.
- `src/lib/subscriptions/lifecycle.functions.ts` — server fns
  (create / renew / cancel / pause / resume / changePlan /
  applySubscriptionTransition / getLifecycleOverview).
- `src/routes/api/public/cron/subscriptions-tick.ts` — grace / expiry
  poller.
- `src/lib/payments/business-processor.ts` — subscription/payment
  handlers now delegate to the lifecycle engine.

**Not in this pass (honest labels)**
- Founder Dashboard UI wiring of `getLifecycleOverview` — server surface
  ready, panel not rendered yet. `PARTIAL`.
- Real provider renewal charges — still `BLOCKED` on provider SDK keys
  (R7 note stands). Renewals executed here are the ledger/state side
  only.

## R10 — Enterprise Wallet Ledger Engine (WORKING)

Immutable-ledger wallet runtime over `public.wallets` +
`wallet_ledger_entries` + `v_wallet_balances`. Balance is always derived
from the view — no stored balance is ever written.

**Ledger rules (enforced in DB, not just code)**
- `wallet_ledger_immutable` trigger blocks UPDATE/DELETE on entries.
- `wallet_ledger_wallet_open` trigger blocks writes on frozen/closed
  wallets (R10 migration).
- Partial unique index
  `(wallet_id, reference_type, reference_id, entry_type, direction)`
  guarantees idempotent processing of the same source event
  (R10 migration).

**Supported ops** (`src/lib/wallet/engine.ts`)
- `ensureWallet`, `setWalletStatus(open|frozen|closed)`
- `postLedgerEntry` — credit/debit for every `wallet_entry_type`
  (purchase, refund, reward, referral, marketplace_earning,
  builder_earning, consume, payout, chargeback, adjustment).
- `postTransfer` — paired debit+credit with compensating reversal on
  destination failure.
- Overdraft prevention on debits.
- Low-balance notification when post-debit balance falls below 500¢.

**Server functions** (`src/lib/wallet/wallet.functions.ts`,
`requireSupabaseAuth`-gated)
- `createWallet`, `setWalletStatusFn` (ops-admin only for freeze/close),
- `creditWallet`, `debitWallet`, `transferWallet`
  (adjustment entries require ops-admin),
- `getWalletOverview` — wallet count, per-currency totals, today's
  credits/debits, frozen/closed counts, largest & most-recent
  transactions for the founder dashboard.

**Security**
- User wallets: only the owner (or ops-admin) may credit/debit/close.
- Company wallets: `is_company_admin` required for mutations,
  `is_company_member` for reads (existing RLS).
- Adjustments require `is_ops_admin` — enforced at both the engine and
  RLS layers.
- Every mutation writes `audit_logs` and (when addressable) an in-app
  `notifications` row.

**Not in this pass (honest labels)**
- Founder Dashboard UI wiring of `getWalletOverview` — server surface
  ready, panel not rendered yet. `PARTIAL`.
- Payment webhook → wallet auto-credit — engine ready; business
  processor still writes into `payments` only. `PARTIAL`.
- Multi-currency FX conversion on transfer — engine refuses
  cross-currency transfers. `PLANNED`.
