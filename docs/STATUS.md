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

---

## R11 — Enterprise Credits Engine (2026-07-15)

Credits are **platform usage units**, not money. Wallet and Credits remain
independent — no cross-posting, no shared balance.

### Runtime
- `src/lib/credits/engine.ts` — grant / consume / refund / transfer / expire
  - Immutable ledger (existing `credit_ledger_immutable` trigger)
  - Derived balance from `v_credit_balances` (excludes expired grants)
  - Idempotent via unique `(reference_type, reference_id, entry_type)` index
  - Overdraft protection on `consume` and `transfer`
  - Compensating reversal on failed transfer half
  - Low-balance notification when remaining < 100 units
- `src/lib/credits/credits.functions.ts` — auth-gated server functions
  - Ownership: user owns / company admin / ops admin
  - `admin_grant` / `bonus` / `referral` / `refund` require ops-admin
- `src/routes/api/public/cron/credits-expire.ts` — sweep expired grants
- Analytics view `v_credit_totals` (issued / consumed / expired / refunded)

### Status Matrix

| Capability              | Status  | Notes |
|-------------------------|---------|-------|
| Grant credits           | WORKING | purchase / bonus / referral / admin_grant |
| Consume credits         | WORKING | ai / builder / marketplace / automation / generic |
| Refund credits          | WORKING | ops-admin, idempotent by reference |
| Transfer credits        | WORKING | paired ledger entries, reversal on failure |
| Expire credits          | WORKING | cron sweep, idempotent per source entry |
| Duplicate protection    | WORKING | unique index on reference triple |
| Founder overview        | WORKING | `getCreditsOverview` server fn |
| Low-balance alerts      | WORKING | in_app notification |
| Payment → credits auto  | BLOCKED | no product-to-credits mapping table yet |
| Founder dashboard UI    | PLANNED | server fn ready, UI to consume it |
| Multi-currency FX       | N/A     | credits are unitless usage points |

### Files changed
- Migration `20260715_credits_engine_r11` — idempotency + expiry index, `v_credit_totals`
- Added `src/lib/credits/engine.ts`
- Added `src/lib/credits/credits.functions.ts`
- Added `src/routes/api/public/cron/credits-expire.ts`

---

## R12 — AI Website Builder Runtime (2026-07-15)

Website Builder foundation. Server-side runtime only in this pass —
visual editor UI is intentionally out of scope and follows in a later
pass that consumes this API.

### Runtime
- `src/lib/website-builder/schema.ts` — Zod-validated `SiteTree` (theme,
  seo, navigation, recursive sections, 11 project kinds, 19 section types)
- `src/lib/website-builder/engine.ts` — CRUD on `creator_projects`
  (kind=`website`), autosave, version snapshots into `entity_versions`,
  rollback, archive/restore, publish state
- `src/lib/website-builder/ai-generator.ts` — real Lovable AI Gateway
  call (`google/gemini-3-flash-preview` by default), JSON-mode, salvage +
  Zod validate; propagates 402/429 truthfully — no template fallback
- `src/lib/website-builder/builder.functions.ts` — 14 auth-gated server
  functions + founder overview

### Status Matrix

| Capability                       | Status  | Notes |
|----------------------------------|---------|-------|
| Project CRUD (create/open/rename/duplicate/archive/delete/restore) | WORKING | reuses `creator_projects` + RLS |
| Autosave (persist tree)          | WORKING | tracks `autosavedAt`, no snapshot per keystroke |
| Version history + rollback       | WORKING | `entity_versions`, append-only |
| AI natural-language generation   | WORKING | real Lovable AI, strict Zod validation, generation audit trail in `creator_generations` |
| Publish / unpublish              | PARTIAL | records state + audit + notification; no live hosting build pipeline yet |
| Custom domain wiring             | BLOCKED | needs hosting integration |
| Deployment history               | PARTIAL | audit trail exists; dedicated `deployments` link is future work |
| Media library reuse              | REUSED  | via `creator_assets` (existing) |
| Brand kit reuse                  | REUSED  | via `creator_brand_kits` (existing) |
| Founder overview server fn       | WORKING | `getWebsiteBuilderOverview` (ops-admin) |
| Notifications                    | WORKING | project_created, deployment_success on publish |
| Visual editor UI (drag/drop, tree, props panel, preview) | PLANNED | dedicated UI pass consumes these fns |
| App Builder                      | OUT_OF_SCOPE | must reuse this runtime in a later pass — do not build inside R12 |

### Security
- All server fns require auth (`requireSupabaseAuth`)
- Ownership check on every mutation (RLS + explicit `assertOwns`)
- Ops-admin bypass for founder tooling only
- AI generation logged with prompt + status + error in `creator_generations`
- Site trees validated with Zod before persist — malformed AI output rejected

### Files added
- `src/lib/website-builder/schema.ts`
- `src/lib/website-builder/engine.ts`
- `src/lib/website-builder/ai-generator.ts`
- `src/lib/website-builder/builder.functions.ts`

---

## R13 — Universal App Builder Runtime

### Summary
Universal App Builder built on top of the Website Builder foundation. Reuses
`creator_projects` (with `kind='app'`), `entity_versions`, `creator_generations`,
`notifications`, and `audit_logs` — no duplicate business logic, no duplicate
migrations.

### App Builder Runtime — WORKING
- `AppTree` schema: kind, theme, auth, dataModel, navigation, screens,
  actions, apiCalls, assets, build (Zod-validated, versioned).
- Project runtime: create / open / rename / duplicate / archive / restore /
  delete / autosave / version history / rollback.
- Starter templates for ecommerce, education, restaurant, marketplace,
  social — honest starting points, not demo data.
- Server functions: 14 auth-gated createServerFn endpoints via
  `requireSupabaseAuth`. Ownership enforced at RLS AND re-checked in-code.
  `is_ops_admin` gate on the founder overview.
- All mutations audited via `write_audit`; owners notified via in-app
  `notifications` (`app_builder.*` kinds).

### AI Generation — WORKING
- Real Lovable AI Gateway call (`google/gemini-3-flash-preview` default).
- Strict `appTreeSchema.safeParse` on model output — malformed generations
  fail loudly instead of persisting corrupt trees.
- Every attempt logged to `creator_generations` (studio=`app_builder`,
  operation=`generate_app_tree`) with status, model, duration, error.
- Save modes: create-new-project or replace-existing (snapshotted).

### Build Pipeline — PARTIAL
- `web` and `pwa`: real deterministic manifest generation, recorded in
  `metadata.buildHistory`, marks `lastBuildStatus=ready`.
- `android`, `android_tv`, `wear_os`, `ios`, `ipados`, `windows`, `macos`,
  `linux`: PLANNED — `runBuild` explicitly rejects with a build record
  marked `failed` and a truthful message. No fake APK/IPA/EXE/DMG.
- Publish gated on `lastBuildStatus === 'ready'` — cannot publish an app
  that has never generated an artifact.

### Visual Editor — PLANNED
- Server-side runtime and schema are complete and ready to back an editor,
  but no editor UI is shipped in this pass. Marked PLANNED honestly.

### Founder Dashboard Integration — WORKING (data), PARTIAL (UI)
- `getAppBuilderOverview` returns: totalProjects, drafts, published,
  buildReady, buildFailed, generation count/success/failure, avg latency,
  supported vs planned targets, 20 most-recent projects.
- Consumable by an existing founder dashboard; no dedicated screen added.

### Notifications — WORKING
- `project_created`, `publish_completed`, `build_ready`, `build_failed`
  written to `notifications` for the project owner.

### Security
- All server fns behind `requireSupabaseAuth`.
- `assertOwns` re-verifies ownership per request; ops-admins bypass via
  `is_ops_admin`.
- `assertOpsAdmin` gates founder overview.
- RLS on `creator_projects`, `entity_versions`, `creator_generations`,
  `notifications` continues to apply.

### Files added
- `src/lib/app-builder/schema.ts`
- `src/lib/app-builder/templates.ts`
- `src/lib/app-builder/ai-generator.ts`
- `src/lib/app-builder/engine.ts`
- `src/lib/app-builder/app-builder.functions.ts`

### Files edited
- `docs/STATUS.md`

### Verification
- Typecheck: passing after schema-aligned fixes to `creator_generations`
  columns (`studio`/`operation`/`duration_ms`, no `latency_ms`/`kind`).
- No new migrations — Website Builder tables reused as designed.

---

## R14 — Deployment & Hosting Runtime

### Summary
A reusable deployment platform used by the Website Builder, App Builder, and
any future project-kind that lives in `creator_projects`. All queue state,
history, artifacts, and per-step logs live in the platform's own tables;
builder logic is not duplicated.

### Deployment Runtime — WORKING
- New tables: `project_deployments`, `project_deployment_events` (immutable),
  `project_domains`. All RLS-gated; owners manage their own rows, ops admins
  manage everything.
- Enums: `project_deployment_env` (development/preview/staging/production),
  `project_deployment_target` (web/pwa/static_export/cloudflare/netlify/
  vercel/custom), `project_deployment_state` (queued/building/deploying/
  succeeded/failed/cancelled/rolled_back), `project_domain_status`.
- `src/lib/deployment/engine.ts`: create/cancel/retry/run/rollback,
  deterministic manifest generation for web/pwa/static_export, atomic
  status-guarded row claim so parallel workers never double-process.
- Every mutation writes to `audit_logs` via `write_audit` and inserts a
  step log row into `project_deployment_events`.

### Queue & Cron — WORKING
- `src/routes/api/public/cron/deployments-tick.ts`: idempotent tick that
  claims and executes up to 10 queued deployments per invocation, gated by
  the Supabase publishable `apikey` header per the schedule-jobs pattern.

### Hosting — PARTIAL
- `web`, `pwa`, `static_export`: real deterministic manifest artifact, real
  deployed URL, real success/failure recorded.
- `cloudflare`, `netlify`, `vercel`, `custom`: PLANNED. The engine explicitly
  rejects these targets with `target_planned_not_implemented:<target>` — no
  fake success is ever recorded for an unimplemented provider.

### Domain Management — PARTIAL
- Add / list / remove custom domains and subdomains with generated TXT + CNAME
  DNS records for verification.
- `attemptDomainVerification` records a check attempt and transitions status
  to `verifying`; automatic DNS polling + ACME/SSL provisioning are honestly
  PLANNED until an integration exists — SSL status stays `pending` and is
  never claimed as issued.

### Rollback — WORKING
- `rollbackDeployment` creates a new deployment linked via `rolled_back_from`
  to the target, executes it, and marks the target as `rolled_back` on
  success. Notifies the actor with `rollback_complete`.

### Release Manager / Analytics — WORKING
- Every deployment has `version`, `release_notes`, `deployed_url`,
  `artifact_path`, `duration_ms`, and a full event log for release history.
- `deploymentOverview` provides ops-only counts (succeeded/failed/cancelled/
  rolled_back/in-flight), average build ms, success rate, supported vs
  planned targets, and the 20 most-recent deployments.

### Notifications — WORKING
- `deployment.build_started`, `deployment.build_succeeded`,
  `deployment.build_failed`, `deployment.deployment_complete`,
  `deployment.rollback_complete` written to `notifications`.

### Server Functions
- `listProjectDeployments`, `getProjectDeployment`, `getDeploymentLogs`,
  `createProjectDeployment` (auto-runs inline unless `autoRun=false`),
  `retryProjectDeployment`, `cancelProjectDeployment`,
  `rollbackProjectDeployment`, `listProjectDomains`, `addProjectDomain`,
  `removeProjectDomain`, `verifyProjectDomain`, `getDeploymentOverview`.
- All behind `requireSupabaseAuth`. Ownership re-checked via project
  `user_id`; ops admins bypass via `is_ops_admin`.

### Security
- RLS on all three new tables. Owners can only see their own deployments,
  events, and domains. Ops admins can see everything.
- `project_deployment_events` is DB-enforced immutable (BEFORE UPDATE/DELETE
  trigger raises).
- `deployments-tick` requires the Supabase publishable key in an `apikey`
  header — no custom shared secrets, no unauth writes.

### Files added
- `supabase/migrations/<R14>.sql`
- `src/lib/deployment/engine.ts`
- `src/lib/deployment/deployment.functions.ts`
- `src/routes/api/public/cron/deployments-tick.ts`

### Files edited
- `docs/STATUS.md`

### Verification
- Typecheck: passing after tightening JSON-object types on server-fn return
  shapes (`Record<string, unknown>` → `JsonObject`) to satisfy TanStack's
  strict RPC serializability check.
- Deployments only marked WORKING for targets that produce a real artifact
  and honest URL. All external hosting providers stay PLANNED.

## R15 — Domain & SSL Management Runtime

### WORKING
- Domain lifecycle: `pending → verification_required → verifying → verified
  → active → suspended | expired | failed`, persisted on `project_domains`
  with CHECK constraint enforcement.
- Real DNS verification via DNS-over-HTTPS (Cloudflare 1.1.1.1). Checks
  the `_hxp-verify.<host>` TXT token AND the `<host>` CNAME → platform
  target. Marks `verified` only when both records match.
- Immutable domain audit trail in `project_domain_events` (BEFORE
  UPDATE/DELETE trigger). Every add / remove / verify / SSL request /
  suspend / redirect update writes an event.
- Certificate store `project_domain_certificates` with lifecycle state
  (`pending / issued / active / renewing / expired / failed`) and renewal
  chain via `renewed_from`.
- Primary domain enforcement (single primary per project, requires
  verified/active status).
- Redirect rule storage (`redirect_rules` jsonb, validated 301/302).
- Founder overview via `getDomainOverview`: counts by domain state, SSL
  state, expiring-soon (< 30d), latest 25.
- All 14 server functions behind `requireSupabaseAuth` with in-code
  ownership re-checks; `getDomainOverview` and `suspendProjectDomain`
  gated by `is_ops_admin`.
- Notifications on `domain.added / verified / verification_failed /
  removed / primary_set / suspended / ssl_requested / ssl_renewal_started`.

### PARTIAL
- DNS check only queries Cloudflare DoH. Multi-resolver quorum (Google,
  Quad9) not yet implemented.

### PLANNED (honest, not faked)
- Real ACME/SSL provisioning (Let's Encrypt, ZeroSSL, Cloudflare). SSL is
  recorded as `pending` and NEVER marked `active` without a real
  certificate. `requestSsl` and `renewSsl` record intent + audit; no
  fabricated `active` state, no fake serials.
- Provider-specific DNS automation (Cloudflare/Route53/GoDaddy API).
- Automatic renewal cron (safe to add once issuance is real).

### Security
- RLS on `project_domain_certificates` and `project_domain_events` scoped
  by parent `project_domains.user_id` OR `is_ops_admin`.
- Events are DB-immutable (trigger raises on UPDATE/DELETE).
- Suspension is founder-only.
- Only verified/active domains can be set primary or request SSL.

### Files added
- `supabase/migrations/<R15 columns + tables + events immutable>.sql`
- `supabase/migrations/<R15 status widening>.sql`
- `src/lib/domains/engine.ts`
- `src/lib/domains/domains.functions.ts`

### Files edited
- `docs/STATUS.md`
- `src/integrations/supabase/types.ts` (regenerated)

### Final rule adherence
- Domains marked `verified` only after real DNS-over-HTTPS confirmation
  of the expected TXT + CNAME records.
- SSL `active` state is unreachable without a real certificate; provider
  integration remains PLANNED and is labelled as such in every code path
  and notification body.

## R16 — Enterprise Marketplace Runtime

### WORKING
- Listing lifecycle state machine on `listings.review_status`:
  `draft → pending_review → approved → published → hidden | rejected | archived`,
  enforced by CHECK constraint. `review_status` and `status` are kept in
  sync (published → active; hidden → suspended; archived → archived).
- 19 asset types + 6 purchase types (`free`, `one_time`, `subscription`,
  `credits`, `wallet`, `enterprise`), CHECK-constrained.
- Listing versioning via `listing_versions`; publishing a new version
  bumps `listings.current_version` and notifies every buyer with an
  active entitlement (`update_available`).
- Purchase engine (`purchaseListing`) — real settlement paths:
  - `free`  → instant entitlement.
  - `credits` → `credits.consume` debit (idempotent by
    `reference_type=listing`, `reference_id=listing_id`).
  - `wallet`  → `wallet.postLedgerEntry` debit buyer / credit seller
    (`marketplace_earning`), same-ref idempotent.
  - `one_time` / `subscription` / `enterprise` → creates a PENDING
    `marketplace_transactions` row. Entitlement only lands via
    `settleMarketplacePurchase(transactionId)` when the transaction row
    is `succeeded`. We never fabricate settled revenue.
- Entitlement uniqueness: `UNIQUE (listing_id, buyer_id, version_at_purchase)`
  guarantees a buyer can't be double-charged for the same version.
- Download engine (`authorizeDownload`) — refuses without an active
  purchase (seller and ops-admin exempt), writes an immutable
  `listing_downloads` row (BEFORE UPDATE/DELETE trigger), increments
  `download_count`. IP is stored as a day-bucketed hash — no raw IP PII.
- Review engine — reviewer must have an active purchase; rating recomputes
  `rating_avg` + `rating_count`; seller notified.
- Approval flow (`submitForReview` → `approveListing` /
  `rejectListing` / `hideListing`) — approval is ops-admin only, stamps
  `approved_by`, `approved_at`, `published_at`; rejection stores
  `rejected_reason`; seller notified on every transition.
- Wishlist (`toggleWishlist`, `listWishlist`) with maintained
  `favorite_count`.
- Founder overview (`getMarketplaceOverview`) — counts by review state,
  gross settled revenue in cents, purchase count, download count, top 10
  by downloads, supported asset/purchase-type catalogs.
- Notifications: `marketplace.listing_submitted / listing_approved /
  listing_rejected / listing_hidden / purchase_pending / purchase_complete /
  sale_complete / refund / refund_issued / update_available / review_received`.
- Full RLS: buyers see only their purchases/downloads/wishlist; sellers
  see their own listings + their sales; ops admin sees everything.
  `listing_downloads` is DB-immutable.
- Public catalog reads (`browseCatalog`, `getListing`) use the
  publishable-key server client so shareable listing URLs work
  unauthenticated — filtered strictly to `review_status = 'published'`.

### PARTIAL
- Subscription-priced listings capture the plan reference at listing time
  but currently settle through the same PENDING-transaction path as
  one_time; recurring lifecycle events land via the R9 subscription
  engine — enrollment is not yet auto-bound to a listing purchase.
- Storage-signed download URL: `authorizeDownload` returns the logical
  `artifact_path`; a signed-URL step lands when the marketplace bucket
  is provisioned.

### PLANNED (honest, not faked)
- Payment provider webhooks bridging to `settlePendingPurchase` for real
  card / gateway settlement (Stripe/Razorpay/Paddle/Cashfree/PayPal
  adapters remain PLANNED as documented in MASTER_STATUS).
- Automated content scanning of uploaded artifacts before approval.
- AI-driven "recommended listings" — surface exists in the founder
  overview `topByDownloads`, but personalised recommendations are not
  yet computed and are NOT faked.

### Security
- Buyers cannot access another buyer's purchase / download / wishlist —
  RLS scoped by `auth.uid()`.
- Download authorization double-enforced: RLS on `listing_downloads` +
  `no_active_entitlement` in-code check.
- Reviews require a real active purchase server-side.
- Sellers cannot buy their own listing (in-code guard).
- Ops-admin surfaces (`approveListingByFounder`, `rejectListingByFounder`,
  `hideListingByFounder`, `getMarketplaceOverview`,
  `refundListingPurchase`, `settleMarketplacePurchase`) gated by
  `is_ops_admin`.
- Marketplace revenue only counted when `listing_purchases.status =
  'active'` — the pending-transaction path can NOT inflate revenue.

### Files added
- `supabase/migrations/<R16 marketplace>.sql`
- `src/lib/marketplace/engine.ts`
- `src/lib/marketplace/marketplace.functions.ts`

### Files edited
- `docs/STATUS.md`
- `src/integrations/supabase/types.ts` (regenerated)

### Final rule adherence
- Real listings, real approvals, real free/credits/wallet purchases, real
  downloads, real reviews — all persisted and RLS-scoped.
- Payment-provider settlement is NOT certified as WORKING; the pending →
  settle path exists and only flips a purchase to `active` after the
  `marketplace_transactions` row is `succeeded` (which today only comes
  from the R9 payments processor, not from a live provider webhook).
- No fabricated recommendations, no fake balances, no mock listings.
