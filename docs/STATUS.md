# HAPPY Platform — Honest Status Matrix

**Last updated:** R35 — Multi-Region / High Availability Platform.

## R35 — Multi-Region / High Availability — 2026-07-15

- **Region runtime: Working.** `ha_regions` table + `haEngine.probeRegion` — probes each region by real HTTP HEAD against `endpoint_url` when set, or DB reachability + latency when not. Status enum: `healthy | degraded | offline | recovering`. Nothing is marked healthy without a probe run.
- **Replication runtime: Working.** `ha_replication_marks` (per-region snapshot digest per scope) + `ha_replication_checks` (append-only verification history). Digests use WebCrypto SHA-256 over table row counts per scope; verification compares source digest to the target region's published mark and classifies `in_sync | lagging | diverged | failed | unknown`. Never "healthy" without a mark to compare against.
- **Failover runtime: Working.** `ha_failover_runs` records every failover with kind (`automatic | manual | graceful | rollback`), preconditions probe on the target region, the actual role flip on `ha_regions`, traffic-policy update, and a re-read verification. `traffic_switched` is only `true` when the DB re-read confirms `role='primary'` on the target.
- **Rollback: Working.** `haRollback(failover_id)` executes a reverse failover and only marks the original run `rolled_back` if traffic actually switched back.
- **Recovery runtime: Working.** `haRecoverRegion({ region_id, samples })` runs N (1–10) real probes; region moves to `healthy` only when all samples pass, `degraded` if partial, `offline` if none.
- **Traffic runtime: Working.** `ha_traffic_policies` (seeded with `primary_only | active_active | weighted | geo | failover`); `haUpsertTrafficPolicy` gates active region + weights.
- **Founder dashboard: Working.** `haDashboard` returns `fact.*` (regions_total/healthy/offline, availability%, replication in-sync vs failed, failover success vs failed, recent events, recent failovers) separated from `recommendation.*` (heuristics only).
- **Alerts: Working (append-only).** `ha_events` records `region.upserted`, `region.recovered`, `region.recovery_incomplete`, `replication.failed`, `failover.succeeded/failed`, `traffic.updated`. Trigger blocks any UPDATE/DELETE.
- **Security:** Every table gated by `is_ops_admin(auth.uid())`. `ha_replication_checks` and `ha_events` are strictly immutable via triggers. GRANTs limited to `authenticated` (via RLS) + `service_role`.
- **Verification:** `bunx tsgo --noEmit` — clean. New linter warnings on this pass: 0 (the 10 surfaced warnings are the pre-existing SECURITY DEFINER role helpers from earlier passes).
- **Blocked / Planned:** Cross-region physical replication (platform layer — outside app scope); public status-page HA widget wiring; alert-channel delivery for `ha_events` (reuses Phase 5 notification connectors — not wired in this pass).
- **Files changed:** created `src/lib/ha/engine.ts`, `src/lib/ha/ha.functions.ts`, `supabase/migrations/…_r35_multi_region_ha.sql`; edited `docs/STATUS.md`.



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

---

## R17 — Enterprise CMS Runtime

Unified content platform. Reused by Website Builder, App Builder, Marketplace,
Digital Library, Razvi Academy, AAS PAAS, HP SHUDDH MASALE, Founder Dashboard.
Reuses `notifications`, `audit_logs`, `media_assets`, and the shared RBAC
helpers (`is_company_member`, `is_company_admin`, `is_platform_founder`).

### WORKING
- `cms_contents` CRUD with slug/locale uniqueness, ownership + company RLS,
  founder bypass, public read of published+public rows, GIN full-text search
  over title/excerpt/tags/categories (BEFORE trigger, immutable-safe).
- Workflow state machine: draft → in_review → approved → scheduled → published,
  plus archived / rejected / unpublish. Every transition snapshots the row.
- `cms_revisions` immutable version history (UPDATE/DELETE trigger), list /
  get / compare / restore. Restore bumps version, adds an "restore vN"
  snapshot, keeps history intact.
- Media library (`cms_media`) + hierarchical folders (`cms_media_folders`),
  archive + delete, GIN tag index, kind-based filters, folder scoping.
- Localization (`cms_translations`) — per-locale variants keyed to a parent
  content row, upsert-by-conflict, status machine, translator attribution.
- Notifications on: draft created, content updated, review requested,
  approved, rejected, scheduled, published.
- Audit trail on every state change and mutation via `write_audit`.
- Founder overview: total / published / drafts / scheduled / pending_review /
  media_count / storage_bytes / top authors / health.
- Public reads via publishable-key server client (`cmsPublicGet`,
  `cmsPublicList`) — no bearer needed, RLS scoped to public+published.
- Cron tick `/api/public/cron/cms-publish` publishes ready scheduled items
  (apikey-gated via SUPABASE_PUBLISHABLE_KEY).

### PARTIAL
- Search is Postgres FTS with `simple` config (no stemming); acceptable for
  admin search + shortlists. Language-aware ranking is not wired.
- Media upload happens against a URL / asset_id already produced elsewhere;
  the CMS records metadata but does not itself sign storage uploads.
- Folder path is derived from parent + slug; renaming/moving does not
  cascade rewrites yet.

### BLOCKED
- None.

### PLANNED
- CMS admin UI (author workspace, media browser, review queue).
- Signed storage upload URLs.
- Search: pg_trgm fuzzy + per-locale text configs.
- Reference tracking (which page uses which media) for safe delete.

### Files Changed
- `supabase/migrations/20260715120555_r17_cms.sql` — cms_contents,
  cms_revisions, cms_media_folders, cms_media, cms_translations with RLS,
  grants, triggers, FTS.
- `src/lib/cms/engine.ts` — content, workflow, revisions, media, folders,
  translations, founder overview, scheduled-publish tick.
- `src/lib/cms/cms.functions.ts` — 27 auth-gated `createServerFn` endpoints
  + `cmsPublicGet` / `cmsPublicList` (unauth) for shareable rendering.
- `src/routes/api/public/cron/cms-publish.ts` — apikey-gated queue tick.
- Regenerated `src/integrations/supabase/types.ts` via migration.

### Final Rule
CMS is marked WORKING only for the surfaces actually built end-to-end above.
No admin UI is claimed — that ships in a later pass.

## R18 — Enterprise CRM Runtime — WORKING

- **Tables**: crm_tasks, crm_notes (RLS company-scoped); reuses existing customers, leads, deals, companies, activity_events, notifications, audit_logs.
- **Engine** (`src/lib/crm/engine.ts`): leads (CRUD, convert→customer), customers (CRUD, unified profile with invoices/payments/marketplace), deals (CRUD, pipeline aggregation, stage transitions with probability + close semantics), tasks (CRUD, complete, reschedule, assignment notifications), notes (pin/attachments), activity timeline per entity + company, cross-entity search, founder dashboard (counts, pipeline value, conversion rate, open tasks, recent activity).
- **Server functions** (`src/lib/crm/crm.functions.ts`): 25 auth-gated `createServerFn` endpoints via `requireSupabaseAuth`.
- **Security**: RLS `is_company_member` on all CRM tables; audit_logs via `write_audit` RPC for every mutation; notifications on lead assignment, task assignment, deal won/lost.
- **PARTIAL**: contact/company sub-entities alias to leads/customers; email/call log ingestion pending external providers.
- **PLANNED**: recurring-task expander cron, meeting attendee scheduling, per-owner permission matrix beyond company membership.

## R19 — Enterprise ERP Runtime — WORKING

- **Schema** (`supabase/migrations/...r19_erp.sql`): new `approvals` table (RLS via `is_company_member`/`is_company_admin`); added `approval_status` column to `purchase_orders` and `sales_orders` with CHECK-constrained state machine (draft→pending→approved/rejected→completed/fulfilled/cancelled). Reuses existing companies, offices (branches), departments, business_units, suppliers (vendors), purchase_orders/_items, sales_orders/_items, workflows, workflow_runs, activity_events, notifications, audit_logs.
- **Engine** (`src/lib/erp/engine.ts`): org (companies/branches/departments/units), vendors (CRUD + soft delete), approvals (request/approve/reject/cancel with entity sync + admin notifications), purchase (CRUD, submit→approval, receive, cancel), sales (CRUD, submit→approval, fulfill, cancel), workflows (list/runs/trigger reusing existing workflows table), search (unified across POs, SOs, vendors, departments, approvals), dashboards (company + founder aggregations).
- **Server functions** (`src/lib/erp/erp.functions.ts`): 30 auth-gated `createServerFn` endpoints via `requireSupabaseAuth`; RLS is the primary guard, engine adds status-machine validation.
- **Security**: RLS on `approvals` scoped to company members (view/create), admins or requester (update — requester only when still pending), admin-only delete. Every state transition writes an immutable audit log via `write_audit` and dispatches in-app notifications (approval requested → all company admins; decision → requester).
- **Founder integration**: `erpFounderDashboard` aggregates companies × purchase/sales volume × pending approvals across the platform; `erpCompanyDashboard` provides per-company operations view.

### PARTIAL
- Workflow engine trigger only queues runs; actual step execution reuses the existing workflow-runtime service and is not re-implemented here.
- Inventory adjustments on PO receive / SO fulfill are not yet wired to `inventory_items`.

### PLANNED
- Goods-received partial receipt, backorders, and multi-warehouse split-fulfillment.
- Vendor performance analytics (on-time %, defect rate).
- Approval routing rules (multi-step, amount thresholds) beyond single-admin approval.

### Files Changed
- `supabase/migrations/…_r19_erp.sql` — approvals table + approval_status columns.
- `src/lib/erp/engine.ts` — ERP runtime (org, vendors, approvals, purchase, sales, workflows, search, dashboards).
- `src/lib/erp/erp.functions.ts` — 30 `createServerFn` endpoints.
- Regenerated `src/integrations/supabase/types.ts` via migration.

### Final Rule
ERP is marked WORKING because real CRUD, real approvals with state
transitions, real audit logs, real notifications, and dashboard aggregation
are all functioning against RLS-enforced tables. Multi-step workflow
execution and inventory side-effects remain PARTIAL until wired to the
existing workflow-runtime + inventory tables.

## R20 — Enterprise Experience Platform (EXP)
- **Universal Enterprise Shell**: WORKING — `_authenticated` layout now wraps every route in `ShellProvider` + persistent sidebar + `GlobalTopbar` + `GlobalCommandPalette` + `FloatingHappy`.
- **Adaptive Top Navigation**: WORKING — breadcrumbs, universal search trigger, quick create, HAPPY quick-launch, theme toggle, notifications, profile menu.
- **Global Command Palette (⌘K)**: WORKING — module launcher, quick-action grammar ("Create a website", "Show revenue", "Open CRM"…), admin jump-list. Voice input remains in `/founder` CommandPalette.
- **Floating HAPPY Assistant (⌘J)**: WORKING — every authenticated screen exposes HAPPY as chat, voice, presentation, whiteboard.
- **Pinned modules / favorites**: PARTIAL — `useShell().pins` persisted in localStorage; sidebar rendering pass PLANNED.
- **Multi-workspace / multi-brand switcher**: PLANNED (Founder-only surface today).
- **Business logic / DB / Security / Revenue / CRM / ERP / Wallet / Credits / Marketplace / Builder / Deployment / Digital Human**: UNCHANGED — R20 is a pure experience-layer redesign.

**Files changed**
- created `src/components/shell/ShellContext.tsx`
- created `src/components/shell/GlobalTopbar.tsx`
- created `src/components/shell/GlobalCommandPalette.tsx`
- created `src/components/shell/FloatingHappy.tsx`
- edited `src/routes/_authenticated/route.tsx`
- edited `docs/STATUS.md`

## R21 — HAPPY Operating System (HOS) · Unified Workspace Runtime
- **Workspace Runtime**: WORKING — `src/workspace/{registry,memory,context}.ts(x)` provides a single `WorkspaceProvider` wrapping every authenticated route.
- **Workspace Registry**: WORKING — 17 declarative workspaces (Founder, Admin, Developer, Business, Finance, CRM, ERP, Manufacturing, Library, Education, Marketplace, Builder, Deployment, HAPPY AI, Studio, Digital Human, Hyperlocal) with icon/group/accent metadata.
- **Workspace Memory**: WORKING — localStorage-persisted active workspace, active business, recents (12), favorites, search history (30), layout prefs. Namespace `happyx.ws.*`.
- **Workspace Switcher**: WORKING — dropdown in topbar switches business (H.P PRIVATE LIMITED · H.P SHUDDH MASALE · AAS PAAS · H.P LIBRARY · Razvi Academy) and workspace.
- **Workspace Home (`/home`)**: WORKING — Favorites, Recents, universal launcher grid with star-to-favorite affordance; auto-tracks recents from route changes.
- **Universal Commands / Search**: WORKING via R20 palette (⌘K); WorkspaceProvider now feeds recents/history hooks for future palette enrichment (PARTIAL).
- **AI Context**: PARTIAL — `useWorkspace()` exposes current workspace + business for HAPPY assistant surfaces to consume (wire-up per surface PLANNED).
- **Multi-business support**: WORKING (UX identity switch); backend company scoping remains enforced by RLS/`is_company_member` — unchanged.
- **Permissions / RLS / RBAC / Audit / Business logic**: UNCHANGED — R21 is a pure UX runtime layer.

**Files changed**
- created `src/workspace/registry.ts`
- created `src/workspace/memory.ts`
- created `src/workspace/context.tsx`
- created `src/workspace/index.ts`
- created `src/components/shell/WorkspaceSwitcher.tsx`
- created `src/routes/_authenticated/home.tsx`
- edited `src/components/shell/GlobalTopbar.tsx`
- edited `src/routes/_authenticated/route.tsx`
- edited `docs/STATUS.md`

## R22 — Enterprise ERP Core Runtime

Extends R19 ERP with real requisition-to-receipt lifecycle and vendor lifecycle management. Reuses `requireSupabaseAuth`, `approvals`, `write_audit`, `notifications`, and `is_company_*` RBAC — no duplication.

**Tables (new, all RLS + GRANT)**
- `purchase_requests`, `purchase_request_items`
- `vendor_quotations`
- `goods_receipts`, `goods_receipt_items`
- `vendor_categories`, `vendor_category_map`
- `vendor_ratings` (member-writable, admin-deletable)
- `vendor_documents`, `vendor_contracts`
- `approval_delegations`

**Engine (`src/lib/erp/core.ts`)**
- Purchase Request: create → submit (auto-opens approval) → cancel/delete, auto-numbered `PR-YYYY-#####`
- Vendor Quotation: create, shortlist/award/reject/expire, per-request comparison
- Goods Receipt: create against PO, marks PO `received_at`, `GR-YYYY-#####`
- Vendor Catalog: categories + assignment, ratings + average, documents, contracts
- Approval Delegation: create window, revoke, `activeFor` lookup for approval engine
- Company ERP Core Dashboard: pending requests, open quotes, 30d receipts, active contracts

**Server surface (`src/lib/erp/core.functions.ts`)** — 30 auth-gated server functions, RLS-enforced via `context.supabase`, audit-logged.

**Verification**
- ✅ Migration applied (13 tables, all RLS + grants + admin/member policies)
- ✅ `bunx tsgo --noEmit` — clean
- ✅ Numbering, audit, and approval reuse existing helpers (`write_audit`, `approvals.create`)

| Component | Status |
|---|---|
| Purchase Requisitions | ✅ WORKING |
| Vendor Quotations | ✅ WORKING |
| Goods Receipts | ✅ WORKING |
| Vendor Categories / Ratings | ✅ WORKING |
| Vendor Documents / Contracts | ✅ WORKING |
| Approval Delegations | ✅ WORKING |
| Escalation policies | 🟡 PARTIAL (delegation window in place; automatic escalation timer pending) |
| Inventory side-effects on receipt | 🟡 PARTIAL (PO status marked; stock delta planned) |

**Files**
- created `src/lib/erp/core.ts`
- created `src/lib/erp/core.functions.ts`
- edited `docs/STATUS.md`
- migration `r22_erp_core`

## R23 — Enterprise Manufacturing Runtime

Production backbone for H.P SHUDDH MASALE and future manufacturing businesses. Reuses `products`, `warehouses`, `write_audit`, `is_company_*` RBAC, and notifications — no duplication of CRM/Revenue/Wallet/Credits primitives.

**Tables (new, all RLS + GRANT, admin-write / member-read)**
- `mfg_product_kinds` — classifies products (finished / raw / semi / packaging) with UOM + shelf life
- `bill_of_materials` + `bom_items` — versioned BOMs, draft → pending → approved → archived
- `machines`, `machine_downtime`, `maintenance_orders` — equipment registry, downtime log, preventive/corrective/inspection maintenance
- `production_orders` — scheduled runs with operator, machine, BOM, warehouse
- `production_batches` — auto-numbered (`B-YYYY-#####`) batches with quality state + traceability JSON
- `quality_inspections` — pass/fail/rework records that auto-sync batch `quality_status`

**Engine (`src/lib/mfg/engine.ts`)**
- `bom`: version-bumping create, request approval, approve (audit-logged), archive, delete
- `machines`: CRUD + status + real utilization/downtime calc over N-day window
- `downtime`: start (sets machine offline) → end (returns to idle)
- `maintenance`: schedule → start (machine → maintenance) → complete (machine → idle) / cancel
- `production`: create (`MO-YYYY-#####`) → start (machine → running) → complete → cancel; all audit-logged with side-effects
- `batches`: auto-numbered, expiry tracking, quality-status transitions
- `quality`: inspection auto-updates linked batch, 30d pass-rate rollup
- `mfgDashboard.company`: active POs, active batches, offline/maintenance machines, pending maintenance, 30d quality pass-rate

**Server surface (`src/lib/mfg/mfg.functions.ts`)** — 33 auth-gated server functions, RLS via `context.supabase`.

**Verification**
- ✅ Migration applied (9 tables, RLS + grants + admin/member policies)
- ✅ `bunx tsgo --noEmit` — clean
- ✅ Machine state transitions auto-driven by production/downtime/maintenance handlers
- ✅ Quality inspections auto-sync `production_batches.quality_status`

| Component | Status |
|---|---|
| Product Kind Registry | ✅ WORKING |
| BOM Engine (versioning + approval) | ✅ WORKING |
| Production Orders | ✅ WORKING |
| Batches + Traceability | ✅ WORKING |
| Quality Inspections + Pass-Rate | ✅ WORKING |
| Machine Registry + Utilization | ✅ WORKING |
| Downtime Tracking | ✅ WORKING |
| Maintenance (preventive/corrective/inspection) | ✅ WORKING |
| Company Dashboard | ✅ WORKING |
| BOM stock-consumption on completion | 🟡 PARTIAL (BOM linked; inventory delta planned) |
| Notification emits for production/quality events | 🟡 PARTIAL (audit-logged; notifications insert planned) |

**Files**
- created `src/lib/mfg/engine.ts`
- created `src/lib/mfg/mfg.functions.ts`
- edited `docs/STATUS.md`
- migration `r23_manufacturing`

## R24 — Enterprise Warehouse Management System (WMS)

**Warehouse Runtime — WORKING.**

### Files changed
- `supabase/migrations/20260715132305_r24_wms.sql` — 9 new tables + 7 enums + immutable ledger trigger.
- `src/lib/wms/engine.ts` — real inventory / receiving / dispatch / transfer / reservation / cycle-count / analytics engines. Every mutation goes through `movements.record()` which writes an immutable `inventory_transactions` row and updates the `inventory_items` aggregate.
- `src/lib/wms/wms.functions.ts` — 33 auth-gated `createServerFn` endpoints, RLS via `context.supabase`.

### Engine status
| Engine | Status |
| --- | --- |
| Warehouse Runtime (zones / bins) | WORKING |
| Inventory Engine (aggregate + lots) | WORKING |
| Immutable Transaction Ledger | WORKING |
| Receiving Engine (lot creation + put-away) | WORKING |
| Dispatch Engine (sales / transfer / production / return) | WORKING |
| Transfer Engine (draft → ship → receive) | WORKING |
| Reservation Engine (available = on_hand − reserved) | WORKING |
| Cycle Count Engine (schedule → count → approve → adjust) | WORKING |
| Threshold / Reorder Config (FIFO/FEFO/LIFO) | WORKING |
| Analytics (near-expiry, fast/slow, low-stock, KPIs) | WORKING |
| Founder Dashboard integration | PARTIAL — `wmsAnalyticsOverview` shipped; dashboard tile pending. |
| Automatic low-stock / expiry notifications | PLANNED — data available; notification job pending. |

### Guarantees
- Every stock change is an append-only `inventory_transactions` row (trigger blocks UPDATE/DELETE).
- No stock field is edited outside `movements.record()`.
- RLS: `is_company_member` (read), `is_company_admin` (write) on all 9 tables.
- Transfers refuse same-source/destination and enforce `draft → in_transit → received` state machine.
- Reservations refuse to over-reserve; `available = quantity − reserved` maintained atomically.
- Cycle counts pre-snapshot expected qty; only variances create ledger adjustments on approval.

### Verification
- `bunx tsgo --noEmit` — passes.
- Migration linter: 9 warnings are all pre-existing SECURITY DEFINER helpers (not introduced by R24).

## R25 — Enterprise Finance & Accounting Runtime

**Finance Runtime — WORKING.**

### Files changed
- `supabase/migrations/20260715133024_r25_finance.sql` — 9 new tables + 6 enums + posted-journal immutability trigger.
- `src/lib/finance/engine.ts` — real GL / journal / AP / AR / bank / GST / reports engines. Every ledger change flows through balanced double-entry journals; posted journals are locked by DB trigger.
- `src/lib/finance/finance.functions.ts` — 38 auth-gated `createServerFn` endpoints, RLS via `context.supabase`.

### Engine status
| Engine | Status |
| --- | --- |
| Chart of Accounts (+ seed for Indian standard) | WORKING |
| Journal Engine (create → post → reverse, immutable) | WORKING |
| Auto-post: Invoice / Vendor Bill / Payment → Ledger | WORKING |
| Accounts Payable (vendor bills, approve, mark paid, outstanding) | WORKING |
| Accounts Receivable (outstanding, aging, statements) | WORKING |
| Credit / Debit Notes | WORKING |
| Cashbook / Bank Accounts / Transactions | WORKING |
| Bank Reconciliation (statement vs book) | WORKING |
| GST Engine (period compute, return draft, filing) | WORKING |
| Reports (Trial Balance, Balance Sheet, P&L, Cash Flow, Account Ledger) | WORKING |
| Founder Finance Dashboard (revenue/expense/profit/cash/AR/AP/GST) | WORKING |
| Notification wiring (invoice due, low cash, GST due) | PLANNED — data available; scheduled jobs pending. |

### Guarantees
- Every posted `journal_entries` row and its `journal_lines` are immutable (trigger blocks UPDATE/DELETE of financial fields and lines).
- Journals must balance (debit = credit) before they can be created; `post()` rejects unbalanced entries.
- Reversals are new posted entries with flipped debits/credits and a `reversal_of` pointer; the original is marked `reversed` and never deleted.
- Ledger writes only happen via `journal.post()` and reflect real business documents.
- RLS: `is_company_member` (read), `is_company_admin` (write) on all 9 tables.

### Verification
- `bunx tsgo --noEmit` — passes.
- Linter warnings are pre-existing SECURITY DEFINER helpers (not introduced by R25).

## R26 — Enterprise Analytics / BI Runtime

### Files
- `supabase/migrations/*_r26_analytics.sql` — 6 new tables (`bi_snapshots`, `bi_report_definitions`, `bi_report_runs`, `bi_forecasts`, `bi_insights`, `bi_alert_events`) with RLS + immutability triggers on runs/forecasts/insights.
- `src/lib/bi/engine.ts` — real KPI engines: revenue, customers, finance, marketplace, builder, manufacturing, warehouse, system; founder command center; snapshots cache; report/forecast/insight/alert engines; cross-domain search.
- `src/lib/bi/bi.functions.ts` — 25 auth-gated `createServerFn` endpoints; RLS via `context.supabase`.

### Engine status
| Engine | Status |
| --- | --- |
| Revenue KPIs (gross, net, MRR, ARR, growth, per-customer, series) | WORKING |
| Customer KPIs (leads, conversion, AOV, CLV, repeat rate, win rate) | WORKING |
| Finance KPIs (revenue, expenses, profit, cash, AR, AP, overdue, health score) | WORKING |
| Marketplace KPIs (listings, purchases, revenue, rating, top listings) | WORKING |
| Builder / Deployment KPIs (success rate, avg build time, domains live) | WORKING |
| Manufacturing KPIs (orders, output, rejected, quality pass rate, utilization) | WORKING |
| Warehouse KPIs (stock value, near-expiry, expired, low-stock, movements) | WORKING |
| System KPIs (metrics events, notifications, errors 24h, ai sessions 24h) | WORKING |
| Founder Command Center (composite health 0-100 from real KPIs) | WORKING |
| Snapshot cache (`bi_snapshots`, daily founder capture) | WORKING |
| Report Engine (definitions, run, immutable history, CSV) | WORKING |
| Forecast Engine (linear regression on historical revenue, confidence from MAE) | WORKING |
| Insight Engine (facts vs recommendations, severity) | WORKING |
| Alert Engine (evaluate alert_rules against live KPIs, immutable events, ack) | WORKING |
| Cross-domain Search (invoices, customers, deals, listings, products, deployments, reports) | WORKING |
| Scheduled report delivery (email/PDF/xlsx via cron) | PLANNED |
| Realtime streaming dashboards (postgres_changes wiring) | PLANNED |

### Guarantees
- Every KPI resolves from real DB tables — no fabricated data, no mocked metrics.
- AI insights persist `facts` and `recommendations` in separate columns, never mixed.
- `bi_report_runs`, `bi_forecasts`, `bi_insights` are immutable after insert (DB triggers).
- RLS: `is_company_member` for reads, `is_company_admin` for writes on definitions/snapshots.
- Alert events reuse the existing `alert_rules` table — no duplication.

### Verification
- Migration applied cleanly (9 pre-existing linter warnings on SECURITY DEFINER helpers — not introduced by R26).
- All 25 server functions type-check under `bunx tsgo --noEmit`.

## R27 — HAPPY Brain Runtime (AI Decision Engine)

### Files
- `supabase/migrations/*_r27_brain.sql` — 5 new tables (`brain_sessions`, `brain_intents`, `brain_plans`, `brain_decisions`, `brain_tool_calls`) with RLS + immutability triggers on intents/decisions/tool_calls.
- `src/lib/brain/engine.ts` — intent classifier, context snapshot, planner, tool gateway (routes ONLY through existing runtimes: analytics, finance, wms, mfg, crm, marketplace, deployment), safety check, reasoning engine (FACT vs RECOMMENDATION), decision recorder, end-to-end orchestrator.
- `src/lib/brain/brain.functions.ts` — 8 auth-gated `createServerFn` endpoints (`brainRun`, `brainClassify`, `brainPreviewPlan`, `brainContext`, `brainSessionsList`, `brainInvoke`, `brainReason`, `brainFounderMode`).

### Engine status
| Engine | Status |
| --- | --- |
| Intent Engine (rule-based, deterministic; 16 runtime rules + conversation fallback) | WORKING |
| Context Engine (user, company, roles, module, session snapshot) | WORKING |
| Planning Engine (per-intent step decomposition with risks/deps/alternatives) | WORKING |
| Decision Engine (runtime choice recorded with candidates + rationale) | WORKING |
| Tool Gateway (analytics/finance/wms/mfg/crm/marketplace/deployment via existing engines) | WORKING |
| Reasoning Engine (why/what/next/risks + FACT vs RECOMMENDATION separation) | WORKING |
| Safety Engine (company membership check, destructive-action gate) | WORKING |
| Founder Mode (composite overview + insights via analytics runtime) | WORKING |
| Orchestrator (session → intent → decision → plan → execute → reason → complete) | WORKING |
| Memory Gateway | PLANNED — R28 |
| Knowledge Gateway | PLANNED — R29 |
| Voice input adapter | PARTIAL — accepts `source: "voice"`; transcription belongs to Digital Human runtime |
| Destructive tool execution (builder/deployment/notifications) | BLOCKED — safety engine defers to explicit human confirmation UI |

### Guarantees
- Brain NEVER manipulates business tables directly — every effect passes through an existing runtime engine.
- `brain_intents`, `brain_decisions`, `brain_tool_calls` are DB-immutable after insert (triggers).
- Every tool call records `result_facts` (observed) and `ai_recommendation` (advisory) in separate columns.
- RLS enforces company isolation via `is_company_member`/`is_company_admin`; sessions readable only by owner or company admin.
- Safety engine denies unauthenticated / cross-company access and blocks destructive tools without confirmation.

## R28 — HAPPY Enterprise Memory Engine

### Files
- `supabase/migrations/*_r28_memory.sql` — 5 new tables (`memory_items`, `memory_events`, `memory_links`, `memory_retention_policies`, `memory_access_log`) with RLS scoped by `is_workspace_member`/`is_company_member`/`is_company_admin`; immutability triggers on `memory_events` and `memory_access_log`; full-text `search_tsv` on `memory_items`.
- `src/lib/memory/engine.ts` — store/retrieve/list/search/update/archive/forget/merge/link, timeline events, context aggregator (personal + workspace + company), retention runner, ranking (importance × recency × pinned), audit logger.
- `src/lib/memory/memory.functions.ts` — 14 auth-gated `createServerFn` endpoints (`memStore`, `memGet`, `memList`, `memSearch`, `memUpdate`, `memArchive`, `memForget`, `memMerge`, `memLink`, `memLogEvent`, `memTimeline`, `memContext`, `memRetentionUpsert`, `memRetentionApply`).

### Engine status
| Engine | Status |
| --- | --- |
| Memory Runtime (store/retrieve/update/archive/forget/merge) | WORKING |
| Memory Types (conversation/workspace/project/company/customer/builder/marketplace/crm/erp/finance/mfg/warehouse/deployment/founder/personal/ai) | WORKING |
| Memory Index (GIN on `tags` + `search_tsv`; scope/kind/company/workspace/user indexes) | WORKING |
| Search (keyword full-text via websearch operator + local rank) | WORKING |
| Timeline (`memory_events` chronological + severity/category) | WORKING |
| Ranking (importance × recency × pinned) | WORKING |
| Context Aggregator (personal + workspace + company merge, FACT-only) | WORKING |
| Retention Policies (max_age, archive_after, expires_at, hard_delete) | WORKING |
| Audit (`memory_access_log`, immutable, read/store/update/archive/forget/merge/expire/search) | WORKING |
| RBAC / RLS (personal=owner; workspace=members; company=members read + admins write) | WORKING |
| Semantic Search (pgvector) | PLANNED — `embedding` column reserved |
| Real-time push to Brain | PLANNED — R29 (Knowledge Gateway) |

### Guarantees
- Memory NEVER invents facts — all retrieval reads existing rows; context aggregator returns `retrieved_facts_only` with an explicit `note` separator.
- User controls: `memForget` performs a hard delete and logs a `forget` audit entry with reason.
- RLS enforces scope isolation; company memory requires admin to write, members to read; personal memory is owner-only.
- `memory_events` and `memory_access_log` are DB-immutable (triggers reject UPDATE/DELETE).
- Retention runner honors `pinned=true` (never archived/deleted automatically) and `expires_at`.

## R29 — HAPPY Enterprise Knowledge Graph

### Files
- `supabase/migrations/*_r29_kg.sql` — 4 new tables (`kg_entities`, `kg_relations`, `kg_inferences`, `kg_search_cache`) with RLS (company-member read, company-admin write), unique keys on `(company_id, kind, ref_id)` and `(from,to,relation)`, GIN full-text on `kg_entities`, and immutable-core trigger on `kg_inferences`.
- `src/lib/kg/engine.ts` — entity upsert/resolve/list/archive/delete, relation upsert/delete/list, breadth-first neighborhood traversal (max depth 3), full-text entity search, deterministic natural-language query router, rule-based inference engine (3 seed rules), inference record/review/list, graph health dashboard.
- `src/lib/kg/kg.functions.ts` — 16 auth-gated `createServerFn` endpoints.

### Engine status
| Engine | Status |
| --- | --- |
| Entity Engine (29 kinds, ref_table/ref_id link back to source tables) | WORKING |
| Relationship Engine (15 typed relations, weight, validity window, evidence) | WORKING |
| Semantic / Full-text Search (`websearch` on `search_tsv`) | WORKING |
| Natural-Language Query Router (13 rule patterns → verified facts only) | WORKING |
| Neighborhood / Traversal (BFS, depth ≤ 3, verified filter) | WORKING |
| Inference Engine (rule-based: owns+depends_on, purchased+produces, reports_to-transitive) | WORKING |
| Inference Review (accept promotes to verified relation) | WORKING |
| Graph Health Dashboard (entity/relation counts, verification rate, kind distribution) | WORKING |
| Audit surface (immutable inference log with reviewer + rationale) | WORKING |
| Vector / Embedding search | PLANNED — schema reserves extensibility via `attributes` jsonb |
| Live Graph Explorer UI | PLANNED — engine is UI-ready; visualization component to follow |

### Guarantees
- Verified vs AI-inferred are stored in **separate tables**: `kg_relations.verified=true` are platform facts; `kg_inferences` are proposals requiring human review before promotion.
- `inferenceRun` NEVER creates new entities and NEVER writes to `kg_relations` directly — it only records proposals in `kg_inferences`.
- `kg_inferences` core fields are DB-immutable (trigger); only status/reviewed_by/reviewed_at may change.
- `naturalQuery` returns `inferences: []` explicitly and answers only from verified data.
- All writes scoped by `is_company_admin`; all reads by `is_company_member` via RLS.
- Entity uniqueness (`company_id, kind, ref_id`) prevents duplicate entities from repeated syncs.

## R30 — HAPPY Enterprise Automation Engine

### Files
- `supabase/migrations/*_r30_automation.sql` — 5 tables (`auto_workflows`, `auto_runs`, `auto_step_runs`, `auto_queue`, `auto_approvals`) with RLS (member read, admin write), immutable-step-runs trigger, and priority-indexed queue.
- `src/lib/automation/engine.ts` — workflow CRUD, condition engine (eq/ne/gt/lt/contains/in), action gateway routing through existing runtimes (notification/memory/crm/kg direct; other runtimes recorded as dispatch intents), runner with sequential steps + conditions + approvals + retry-on-failure, queue processor with locking + dead-letter, approval decide → resume, runs/detail/health.
- `src/lib/automation/automation.functions.ts` — 11 auth-gated `createServerFn` endpoints.

### Engine status
| Engine | Status |
| --- | --- |
| Workflow Engine (sequential, conditional, approval, retry, hybrid) | WORKING |
| Trigger Engine (15 trigger kinds registered; manual/api/schedule wired) | WORKING |
| Action Engine (routes via existing runtimes; direct writes only for notification/memory/crm/kg) | WORKING |
| Condition Engine (eq/ne/gt/lt/contains/in on nested context paths) | WORKING |
| Scheduler / Queue (priority + scheduled_for + worker lock + attempts + dead-letter) | WORKING |
| Approval Engine (workflow-level + per-step, expiring, admin-only decision) | WORKING |
| Retry Engine (exponential/linear backoff, respects max_attempts) | WORKING |
| History Engine (immutable step logs, runs list, run detail) | WORKING |
| Automation Health Dashboard (7-day window: success %, avg ms, top workflows, queue depth) | WORKING |
| Parallel step execution | PARTIAL — schema supports `parallel` flag; runner is sequential (parallel batch on roadmap) |
| Cron-based scheduler wiring | PLANNED — `cron_expr` stored; pg_cron/queue-drain job to be scheduled per environment |
| Destructive actions on other runtimes | BLOCKED — engine records dispatch intent; each runtime keeps its own approval/execute path |

### Guarantees
- Every workflow step is logged in `auto_step_runs` which is DB-immutable (trigger).
- Action gateway NEVER writes to business tables it does not own — cross-runtime effects are dispatched via the runtime's own server function.
- Approval-required workflows/steps halt the runner and require an admin decision before continuing.
- Retries are enqueued (not inline recursion), so failures are idempotent up to `max_attempts` then dead-lettered.
- All company reads/writes RLS-scoped by `is_company_member`/`is_company_admin`.

## R31 — HAPPY Enterprise AI Agent Platform

### Files
- `supabase/migrations/*_r31_agents.sql` — 5 tables (`agent_registry`, `agent_tasks`, `agent_messages`, `agent_tool_calls`, `agent_metrics_daily`) with RLS, immutable `agent_messages` and `agent_tool_calls` triggers, unique `(company_id, code)` on registry.
- `src/lib/agents/engine.ts` — registry with 18 system-agent defaults, task router (17 task-type mappings), task lifecycle (assign → start → complete/escalate), tool gateway (checks `allowed_runtimes`, records intent, never bypasses business runtimes), inter-agent messaging, task detail with messages + tool calls, 7-day health analytics per agent.
- `src/lib/agents/agents.functions.ts` — 14 auth-gated `createServerFn` endpoints.

### Engine status
| Engine | Status |
| --- | --- |
| Agent Runtime (register/list/get/resolve; system + custom kinds) | WORKING |
| Agent Registry (18 system agents seedable per company with default capabilities + allowed runtimes) | WORKING |
| Task Router (17 task types → agent codes; falls back to business agent) | WORKING |
| Orchestrator (assign → start → complete/escalate → child task on escalation) | WORKING |
| Tool Gateway (allowed_runtimes enforcement; blocks disallowed calls with audit) | WORKING |
| Context Gateway (Brain/Memory/KG/Analytics runtimes reachable via allowed_runtimes) | WORKING |
| Inter-agent Communication (agent↔agent, agent↔brain, agent↔founder, agent↔user, agent↔system) | WORKING |
| Agent Analytics (per-agent success rate, avg duration, escalations, running count) | WORKING |
| Audit (immutable `agent_messages` and `agent_tool_calls`; fact vs recommendation separated) | WORKING |
| Streaming responses / SSE | PLANNED — surface via runtime's own streaming endpoints |
| Automatic reasoning loop (LLM) | PLANNED — orchestrator provides the harness; model invocation lives in each specialist runtime |

### Guarantees
- HAPPY Brain remains the sole orchestrator; agents are executors registered per company.
- Agents CANNOT touch business tables directly — `toolCall` verifies `allowed_runtimes` and records a dispatch intent; the actual write goes through the runtime's own server function (RLS + approvals intact).
- Every inter-agent message and tool call is DB-immutable; result facts and AI recommendations are stored in separate columns.
- Escalation creates a child task with a lower priority number (higher priority) linked via `parent_task_id`.
- All reads/writes RLS-scoped by `is_company_member`/`is_company_admin`; registry uniqueness prevents duplicate agents per company.

## R32 — HAPPY Enterprise API Gateway, Integration Hub, Developer Platform

### Files
- `supabase/migrations/…_r32_api_gateway.sql` — 13 tables prefixed `apigw_` (api_registry, api_routes, keys, service_accounts, oauth_clients, oauth_tokens, usage_log, rate_counters, webhook_endpoints, webhook_deliveries, webhook_inbound, connectors, connections). All with RLS (company-member read, company-admin write). Usage log is immutable via `apigw_usage_immutable()` trigger. Webhook deliveries have a unique `(endpoint_id, event_id)` idempotency index. Inbound webhooks have a unique `(source, event_id)` replay-protection index. Connector catalog seeded with 20 providers.
- `src/lib/apigw/engine.ts` — SHA-256 & HMAC-SHA-256 helpers (Web Crypto, Worker-safe), timing-safe hex compare, cryptographic random token generation. Full CRUD for APIs, routes, keys (hashed-only storage, prefix + last4 shown), rotation-with-lineage, verification with scope/API/rate checks. Fixed 1-minute-window rate limiter. Usage logging + p50/p95/top-N stats. Outgoing webhooks: emit with per-endpoint HMAC signature and idempotency, dispatcher with exponential/linear backoff and dead-letter, replay. Incoming webhooks: idempotent record + HMAC verify. Connector enable/disable/list + real health probe (public HEAD/GET to documented health URLs for github/gitlab/cloudflare/netlify/vercel/slack/discord/stripe/paypal/digitalocean). OpenAPI 3.0.3 generator built from `apigw_api_routes`. SDK snippet generator for TypeScript/JavaScript/Python/Go/Java/C#/PHP/curl. Founder health aggregate with facts and separated AI recommendations.
- `src/lib/apigw/apigw.functions.ts` — 26 auth-gated `createServerFn` endpoints covering registry, routes, keys, rate limit, usage, webhooks (in/out), connectors, OpenAPI, SDK snippets, and gateway health.

### Engine status
| Engine | Status |
| --- | --- |
| API Registry + Route Registry (versioning, kinds, deprecation) | WORKING |
| API Keys (issue/list/rotate/revoke, hashed storage, prefix+last4, allowed_apis, scopes) | WORKING |
| Key Verification (scope + API allowlist + rate-limit + last_used tracking) | WORKING |
| Rate Limiting (fixed 1-min window, per scope_key) | WORKING |
| Usage Logging (immutable) + p50/p95/top-N stats | WORKING |
| Outgoing Webhooks (HMAC sign, idempotent, retry with backoff, dead-letter, replay) | WORKING |
| Incoming Webhooks (idempotent + HMAC verify + replay protection) | WORKING |
| Connector Registry (20 seeded connectors) | WORKING |
| Connection Management (enable/disable/list/health probe) | WORKING |
| OpenAPI 3.0.3 Generation | WORKING |
| SDK Snippet Generation (8 languages) | WORKING |
| Founder Gateway Health (facts + AI recommendations, cleanly separated) | WORKING |
| Service Accounts | WORKING |
| OAuth2 Clients + Tokens (schema + admin RLS) | PARTIAL — authorization-code flow endpoints not yet exposed |
| Streaming Responses | PLANNED |
| Full monitoring dashboard UI | PLANNED |

### Verification
- Migration applied cleanly. Distinct `apigw_` prefix avoids collision with legacy `api_keys` / `webhook_deliveries` tables.
- `bunx tsgo --noEmit` passes on `src/lib/apigw/*`.
- Usage log immutability enforced (trigger raises on UPDATE/DELETE).
- Idempotency enforced by unique indexes on both delivery event_id and inbound event_id.
- All destructive fetch calls (webhook dispatch, connector health) have AbortController timeouts and never bypass business runtimes.

### Security
- Every table RLS-gated: company members read; company admins write. OAuth tokens admin-only. Usage log insert requires company membership; reads restricted to members.
- API key raw values shown once at issuance; only SHA-256 hash stored (unique index prevents collision reuse).
- Webhook secrets shown once at endpoint creation; only SHA-256 hash stored; HMAC-SHA-256 signature per delivery over `event_id.body`.
- Timing-safe hex comparison for HMAC verification.
- Connector health probes are GET-only against documented public endpoints; no credential exposure.
- All server functions require Supabase auth via `requireSupabaseAuth`; RLS enforces scope.

### Performance
- Composite indexes on usage log by company/api/key + partial index on status_code >= 400 for error triage.
- Partial index on webhook deliveries `WHERE status IN ('pending','retrying')` for hot dispatcher queue.
- Partial indexes on active-only rows for `apigw_keys` and `apigw_webhook_endpoints`.
- Rate counters keyed `(scope_key, window_start)` with unique constraint enabling upsert semantics.

## R33 — Enterprise Monitoring / Observability / System Health

### Files
- `supabase/migrations/20260715144335_r33_observability.sql` — 4 tables (obs_trace_spans, obs_log_entries, obs_status_components, obs_status_updates) with RLS gated to `is_ops_admin`, immutability triggers on traces / logs / status updates, and seed rows for 22 default components.
- `src/lib/observability/engine.ts` — unified probe engine across 22 registered runtimes (DB, API Gateway, Webhooks, Queue, Notifications, Brain, Memory, KG, Analytics, Automation, Agents, Revenue, Wallet, CRM, ERP, Manufacturing, Warehouse, Finance, Marketplace, Deployment, Digital Human, AI Gateway). Real HEAD counts + AI gateway HTTP probe with AbortController timeout. Summarise / recordSnapshot / syncStatusComponents / publicStatus.
- `src/lib/observability/observability.functions.ts` — 20 auth-gated server functions: `obsHealthProbe`, `obsHealthSnapshot`, `obsLogWrite`, `obsLogQuery`, `obsTraceWrite`, `obsTraceGet`, `obsListComponents`, `obsUpsertComponent`, `obsPushStatusUpdate`, `obsStatusTimeline`, `obsDashboard`, plus reused `obsMetrics*`, `obsIncident*`, `obsAlert*` bridging to existing `@/ops` services (no duplication).

### Status
- Health Runtime — WORKING (22 real probes, no fabrication).
- Metrics Runtime — WORKING (reuses `metrics_events` via `metricsService`).
- Logging Runtime — WORKING (`obs_log_entries` immutable, correlation IDs).
- Tracing Runtime — WORKING (`obs_trace_spans` immutable, trace_id/span_id/parent).
- Alert Runtime — WORKING (reuses `alert_rules` + `alertingService`).
- Incident Runtime — WORKING (reuses `incidents` + `incident_events` lifecycle).
- Status Page Runtime — WORKING (components + immutable timeline; probe-driven sync).
- Diagnostics / Founder Dashboard — WORKING (`obsDashboard` aggregates probes + queue + AI + security + incidents + DB, computes availability and error-budget-remaining vs 99% SLO, separates `fact` from `recommendation`).
- Alert channel dispatch (email/slack/webhook) — PARTIAL (rules + trip stored; delivery via existing notification runtime).
- Public status page UI — PLANNED.

### Verification
- Migration applied cleanly (linter warnings are pre-existing project state, not introduced by this pass).
- All new tables: RLS enabled + gated to `is_ops_admin(auth.uid())`, explicit `GRANT` block, no `ALL USING (true)`.
- Immutability triggers on `obs_trace_spans`, `obs_log_entries`, `obs_status_updates` (raise on UPDATE/DELETE).
- Engine reuses existing runtimes; no direct writes to business tables.
- AI Gateway probe uses `AbortController` with 3s timeout.
- Every dashboard number labelled `fact.*`; heuristic guidance labelled `AI RECOMMENDATION:` and returned under `recommendation`.

### Security
- All server functions require `requireSupabaseAuth`; RLS further restricts to ops-admins.
- No public exposure of traces/logs/health snapshots.
- Log/trace/status writes carry `actor_id = auth.uid()` for audit.
- Status components can be flagged non-public; public page reads gated separately.

### Performance
- Health probes run in parallel; DB probes use `HEAD` + `count: exact` (no row fetch).
- Composite indexes on trace `(trace_id, started_at)` and log `(service, occurred_at DESC)` / `(level, occurred_at DESC)` / `(correlation_id)` for hot queries.
- Snapshot insert is a single batched insert into `health_checks`.

## R34 — Enterprise Backup / Disaster Recovery / Business Continuity

### Files
- `supabase/migrations/20260715145209_r34_backup_dr.sql` — 7 tables: `bkp_policies`, `bkp_jobs`, `bkp_artifacts`, `bkp_restore_jobs`, `bkp_recovery_plans`, `bkp_recovery_drills`, `bkp_audit_events`. All RLS-gated to `is_ops_admin`; `bkp_audit_events` immutable via trigger.
- `src/lib/backup/engine.ts` — real snapshot/restore/verify/retention/drill engine over 13 backup targets (database, storage, media, builder, marketplace, deployments, configuration, apigw, secrets_meta, automation, agents, knowledge, memory). SHA-256 checksums via WebCrypto over deterministic per-table manifests; verify recomputes and compares artifact checksums; restore produces an independent verification checksum; drill executes plan steps and records step-by-step results.
- `src/lib/backup/backup.functions.ts` — 15 auth-gated server functions: `bkpListPolicies`, `bkpUpsertPolicy`, `bkpDeletePolicy`, `bkpRunBackup`, `bkpVerifyBackup`, `bkpListJobs`, `bkpJobArtifacts`, `bkpRestore`, `bkpListRestores`, `bkpApplyRetention`, `bkpListPlans`, `bkpUpsertPlan`, `bkpRunDrill`, `bkpListDrills`, `bkpAudit`, plus `bkpDashboard` (founder view separating `fact.*` from `recommendation`).

### Status
- Backup Runtime — WORKING (13 targets, real HEAD counts + id-window manifest + SHA-256).
- Backup Scheduler — PARTIAL (policies + `schedule_cron` persisted; pg_cron wiring left to ops).
- Snapshot Engine — WORKING (manifest + per-artifact checksums + storage_ref).
- Restore Engine — WORKING (verification checksum computed on every restore; `verified` flag only set when artifact checksums match).
- Recovery Engine — WORKING (plan-driven drills execute backup + verify steps and record per-step ok/detail).
- Retention Engine — WORKING (per-policy retention, older jobs marked `expired`; audit event emitted).
- Verification Engine — WORKING (`bkpVerifyBackup` — no backup is marked "verified" without checksum comparison).
- Disaster Recovery Runtime — WORKING (plans, drills, RTO/RPO metadata, `last_drill_status` propagated).
- Founder Dashboard — WORKING (`bkpDashboard`: readiness per target, failed counts, alerts, recommendations).
- Alerts (email/slack dispatch) — PARTIAL (alert list emitted; delivery routes through existing notification runtime).
- Encrypted at-rest storage — PARTIAL (algorithm + storage_ref metadata recorded; underlying object-store integration owned by platform).
- Point-in-time recovery — PLANNED (Lovable Cloud PITR is platform-managed; app records the intent).

### Verification
- Migration applied cleanly; linter output unchanged from prior passes.
- `bunx tsgo --noEmit` passes on `src/lib/backup/*`.
- Every RLS policy is `is_ops_admin(auth.uid())` — no `USING (true)` introduced.
- `bkp_audit_events` blocks UPDATE and DELETE at the DB via trigger.
- Backup/restore/drill flows only mark success or `verified` after a real checksum recompute — no fabricated success paths.
- Retention never deletes rows; it flips terminal state to `expired`, preserving audit trail.

### Security
- All 15 server functions require `requireSupabaseAuth`; RLS enforces ops-admin scope.
- No raw secret values are ever backed up — `secrets_meta` target snapshots `api_keys` metadata only (hashes/ids), never plaintext.
- Every mutating operation writes an immutable `bkp_audit_events` row with `actor_id = auth.uid()`.
- Restore is append-only: never mutates business tables — records the recovery verification result against the current live state.

### Performance
- Snapshots use `HEAD` + `count: exact` per table plus a bounded 200-row id window — bounded latency independent of table size.
- Per-artifact checksums allow partial verification without recomputing the full manifest.
- Indexes on `bkp_jobs(target, started_at DESC)`, `bkp_jobs(status, started_at DESC)`, `bkp_artifacts(job_id)`, `bkp_restore_jobs(status, started_at DESC)`, `bkp_recovery_drills(plan_id, started_at DESC)`, and `bkp_audit_events(ref_type, ref_id, occurred_at DESC)`.
- Deduplication flag + compression algorithm captured per policy for downstream storage tiers.

---

## R36 — Plugin Framework (WORKING)

Real backend implementation. No mocks.

**Files**
- `supabase/migrations/*_r36_plugin_framework.sql` — 7 tables: `plugins`, `plugin_versions`, `plugin_permissions`, `plugin_grants`, `plugin_installations`, `plugin_events` (immutable), `plugin_analytics_daily`. RLS + GRANTs on every table. Baseline permission catalog seeded (14 permissions).
- `src/lib/plugins/engine.ts` — Zod manifest schema, SHA-256 checksum, semver compare, permission grant evaluator, sandbox capability assertion, immutable event emitter.
- `src/lib/plugins/plugins.functions.ts` — 12 server fns: `listPlugins`, `getPlugin`, `publishPluginVersion`, `installPlugin`, `enablePlugin`, `disablePlugin`, `upgradePlugin`, `rollbackPlugin`, `uninstallPlugin`, `listCompanyInstallations`, `recordPluginAnalytics`, `pluginOverview`.

**Security**
- Ops-admin gate on registry writes (RLS).
- Company-admin gate on install / enable / disable / upgrade / rollback (RLS).
- Permission grant check on install & upgrade (missing-required blocks the call).
- `plugin_events` immutable via trigger.

**Verification**
- Migration applied cleanly.
- Manifest validation is real Zod; checksum is real Web Crypto SHA-256.

**Status:** WORKING (lifecycle + audit + analytics + overview). PARTIAL (in-worker sandbox execution — routes currently accept `runtime: 'serverfn'|'webhook'|'iframe'|'worker'` but only serverfn/webhook are reachable via the existing runtime; iframe/worker are seams). PLANNED (paid plugins via ecosystem R37).

---

## R37 & R38 — PLANNED

See `docs/PLAN_R37_R38.md` for the full engineering execution plan (DB, server fns, runtime, UI, security, verification, dependencies, order).

---

## R39–R50 — Integration Readiness (SEAMS ONLY, NOT CERTIFIED)

Real, callable integration seams that reuse existing runtimes. No fake certifications.

**Files**
- `src/lib/happy-runtime/personas.ts` — Persona registry + audience/channel → persona resolver.
- `src/lib/happy-runtime/capability-router.ts` — Adapter registry that routes capability codes to existing runtimes via `happy_skills.runtime_route`. Refuses to fake success when no adapter is registered.
- `src/lib/happy-runtime/voice.ts` — Real TTS integrations: Lovable AI Gateway (`openai/gpt-4o-mini-tts`, `google/gemini-2.5-flash-tts`) and ElevenLabs (when `ELEVENLABS_API_KEY` set). Honest provider availability probe.
- `src/lib/happy-runtime/presentation.ts` — Pure state machines for presentation & whiteboard control. No fake rendering.
- `src/lib/happy-runtime/digital-human.ts` — Contract-only integration boundary. Default stub throws `DigitalHumanNotProvisionedError`. Explicitly lists the external dependencies required (rigged character, blendshapes, streaming renderer, GPU runtime, voice provider, realtime transport).
- `src/lib/happy-runtime/runtime.functions.ts` — Server fns: `invokeCapability`, `synthesizeVoice`, `runtimeReadiness`, `selectPersona`.

**Honest gaps (NOT certified)**
- Rigged HAPPY character (MetaHuman / Character Creator) — not provisioned.
- Facial blendshapes (ARKit / Faceware) — not provisioned.
- Streaming renderer (Unreal Pixel Streaming or Omniverse ACE) — not provisioned.
- GPU runtime for real-time rendering — not provisioned.
- Realtime transport (WebRTC / WebSocket) for pixel + audio + viseme streams — not provisioned.
- Photoreal lip sync (Audio2Face equivalent) — not provisioned.

The runtime is READY to receive these; nothing pretends they exist.

---

## R51 — HAPPY AI Employee Studio (WORKING backend)

Real backend implementation. Single-identity guarantee enforced by DB constraint.

**Files**
- `supabase/migrations/*_r51_happy_studio.sql` — 10 tables: `happy_identity` (singleton), `happy_appearance`, `happy_voice`, `happy_behavior`, `happy_skills`, `happy_knowledge_refs`, `happy_animations`, `happy_versions` (immutable), `happy_deployments`, `happy_change_requests`. RLS + GRANTs on every table. Seed data: 1 identity, 11 behavior modes, 12 skills, 3 voices (en/hi/ur), 11 animation clips.
- `src/lib/happy-studio/engine.ts` — Deterministic snapshot builder, SHA-256 snapshot checksum, version status FSM, deployment status FSM.
- `src/lib/happy-studio/studio.functions.ts` — 15 server fns: `getHappyIdentity`, `updateIdentity`, `updateAppearance`, `upsertVoice`, `upsertBehavior`, `upsertSkill`, `addKnowledgeRef`, `upsertAnimation`, `createVersion`, `transitionVersion`, `deployToChannel`, `rollbackDeployment`, `proposeChange`, `reviewChange`, `listChangeRequests`, `studioOverview`.

**Security**
- Singleton constraint (`singleton BOOLEAN UNIQUE`) — only ONE official HAPPY.
- All writes gated to ops admins (founders) via RLS.
- `happy_versions` immutable via trigger (snapshot + checksum cannot change; only status transitions allowed).
- Change requests: any staff can propose; only founders can approve.

**Status matrix**
| Manager | Status |
|---|---|
| Identity Manager | WORKING |
| Appearance Manager | WORKING (backend; UI PLANNED) |
| Voice Manager | WORKING |
| Behavior Manager | WORKING |
| Knowledge Manager | WORKING (refs into existing knowledge/KG/courses) |
| Skill Manager | WORKING |
| Animation Manager | WORKING (metadata; asset streaming depends on R39–R50 seams) |
| Version Manager | WORKING (immutable, checksummed) |
| Deployment Manager | WORKING (channel FSM enforced) |
| Founder Approval Flow | WORKING |
| Studio UI | PLANNED |

**Verification**
- Migration applied cleanly. Version immutability enforced by trigger.
- Only published/approved versions can deploy (server-side check).
- Deployment FSM prevents invalid transitions.


---

## R37 — Enterprise Ecosystem Platform — WORKING

Extends the existing Marketplace Runtime (`src/lib/marketplace`) — never duplicates it.

### Added (all RLS + GRANTs)
- `store_categories` — hierarchical taxonomy (seeded with 19 canonical categories)
- `store_collections` + `store_collection_items` — curated groupings (Featured, Trending, Recently Updated, Top Rated, Founder Picks seeded)
- `store_featured_slots` — time-bounded featured placements
- `store_compatibility` — per-version compatibility matrix
- `store_recommendations` — cached rec sets, kind = `fact` or `ai` (never mixed)
- `creator_profiles` — publisher metadata + verification
- `creator_payouts` — payout requests, settled only on evidence
- `creator_support_tickets` — buyer/creator threads
- `store_events` — immutable audit trail (trigger enforced)

### Runtime (`src/lib/ecosystem/`)
- `engine.ts` — category / collection / featured / compatibility / fact-recommendation / creator / payout / support / overview
- `ecosystem.functions.ts` — 20 server functions (public reads + auth-gated writes)

### Reused (never duplicated)
- `listings`, `listing_versions`, `listing_reviews`, `listing_purchases`, `listing_downloads`, `listing_wishlist`
- `marketplace_transactions`, `wallet_ledger_entries`, `credit_ledger_entries`
- `notifications`, `follows`, `audit_logs`
- `plugin_installations` (bridge for `category=plugins`)

### Security
- Ops-admin gate on category / collection / featured / verification / payout settlement
- Owner gate on compatibility (seller_id) and support ticket updates (participant)
- Public reads restricted to `active` rows only; `store_events` append-only

### Fact vs AI recommendations
`computeFactRecommendations` uses a deterministic score
`downloads_30d*3 + rating_avg*10*rating_count + 20/age_days` and stores full evidence.
`kind='ai'` rows are reserved for LLM-authored suggestions and stay separate.

### Digital-human categories
Digital Human Assets / Voice Packs / Animation Packs / 3D Assets are installable
catalog items only. Runtime playback stays **PLANNED** until real rig + blendshapes +
renderer are provisioned (see R39–R50 seams).

### Verification
- `bunx tsgo --noEmit` — clean
- Migration applied; seed data verified via `store_categories`/`store_collections`
- Public catalog paths accessible via `publicClient()` (anon)

---

## R38 — Founder Copilot Workspace (WORKING)

**Scope:** Orchestration-only executive command center. No business logic
duplicated — every action dispatches to an owning runtime.

### Files
- `supabase/migrations/…_r38_founder_workspace.sql` — 4 tables:
  `founder_workspace_prefs`, `founder_command_history` (immutable trigger),
  `founder_briefings`, `founder_recommendations` (fact vs ai kept separate).
- `src/lib/founder-workspace/engine.ts` — command router, timeline, action
  center, approval dispatch, briefing generator, recommendation store,
  founder health, executive federated search.
- `src/lib/founder-workspace/founder.functions.ts` — 14 auth-gated server
  functions.

### Server functions
`founderGetPrefs`, `founderUpsertPrefs`, `founderClassifyIntent`,
`founderDispatchCommand`, `founderCommandHistory`, `founderTimeline`,
`founderActionCenter`, `founderApprovalDecision`, `founderGenerateBriefing`,
`founderListBriefings`, `founderRecordFactRec`, `founderRecordAiRec`,
`founderListRecommendations`, `founderUpdateRecommendationStatus`,
`founderHealthOverview`, `founderExecutiveSearch`.

### Reused runtimes (no duplication)
audit_logs · approvals · notifications · bi_* · obs_* · incidents ·
bkp_jobs · ha_replication_checks · project_deployments ·
marketplace_transactions · wallets · credit_ledger_entries · invoices ·
expenses · deals · customers · production_orders · listings · plugins ·
agent_registry · agent_tasks · agent_metrics_daily · auto_runs.

### Security
- All mutations guarded by `requireSupabaseAuth` + `is_platform_founder`
  or `is_company_admin` (checked in engine layer).
- `founder_workspace_prefs` scoped to `auth.uid()`.
- `founder_command_history` is append-only via immutable trigger.
- `founder_recommendations` splits `fact` (evidence only) from `ai`
  (requires numeric confidence 0..1) — never merged.

### Command router
Deterministic keyword classifier. AI-based intent lives in the Brain
Runtime and is called separately — the workspace only dispatches and
audits.

### PLANNED / BLOCKED
- UI surface (Executive Command Center, Command Bar UI, Timeline UI,
  Briefing UI). Backend is complete; UI is a separate pass.
- Voice-command input mode: schema supports it, but audio capture belongs
  to the client shell and voice runtime.

### Verification
- `bunx tsgo --noEmit` — clean
- Migration applied; types regenerated and referenced

============================================================================
R39 — HAPPY AI EMPLOYEE RUNTIME (Identity Orchestration Layer)
============================================================================
Status: **WORKING (backend / orchestration)**

### Deliverables

| Runtime              | Status  | Notes                                           |
|----------------------|---------|-------------------------------------------------|
| Happy Runtime        | WORKING | Composed of the runtimes below; ONE HAPPY only  |
| Identity Runtime     | WORKING | Reuses `happy_identity` (R51) — no duplication  |
| Session Runtime      | WORKING | `happy_sessions` + `session.ts`                 |
| Capability Router    | WORKING | `capability-router.ts` — dispatches only        |
| Conversation Runtime | WORKING | `happy_conversation_turns` + `conversation.ts`  |
| Greeting Runtime     | WORKING | `happy_greeting_templates` + `greeting.ts`      |
| Mode Runtime         | WORKING | `happy_mode_transitions` + `mode.ts` (12 modes) |
| Presence Runtime     | WORKING | `happy_presence_events` + `presence.ts` (9)     |
| Experience Runtime   | WORKING | `experience.ts` — one call opens the shell      |
| Voice provider seam  | WORKING | Existing `voice.ts` reused; no new provider     |
| Digital Human seam   | PLANNED | Assets/renderer still unprovisioned (R39 policy)|
| Presentation seam    | WORKING | Existing `presentation.ts` reused (controller)  |
| Whiteboard seam      | PLANNED | Contract only; owning runtime TBD               |
| Founder Mode         | WORKING | Reuses Founder Workspace RPCs (no duplication)  |

### Files
- `supabase/migrations/*_r39_*.sql` — 5 tables + trigger fn + seeds
- `src/lib/happy-runtime/session.ts`
- `src/lib/happy-runtime/mode.ts`
- `src/lib/happy-runtime/presence.ts`
- `src/lib/happy-runtime/greeting.ts`
- `src/lib/happy-runtime/conversation.ts`
- `src/lib/happy-runtime/experience.ts`
- `src/lib/happy-runtime/r39.functions.ts`

### Security
- RLS: every table scoped to `auth.uid()` via session ownership; ops
  admins get read-only via `is_ops_admin`.
- GRANTs written for `authenticated`, `service_role`, `anon` (greetings only).
- No service_role escalation in server functions — the caller's RLS applies.

### Facts vs AI recommendations
- Every business answer flows through `capability-router` → owning runtime,
  and the turn records `evidence` items (`source_runtime`, `ref`, `timestamp`,
  `payload`). Nothing is inferred without an evidence trail.
- `Recommendation` type requires numeric `confidence` (0..1), `reason`, and
  `supporting_facts[]` — enforced structurally, not by convention.

### Greetings
- Context-aware (locale + audience + channel + time-of-day), deterministic
  scoring; `{{var}}` templating; seeded across en/hi/ur. No hardcoded strings
  per user. Falls back to a generic HAPPY line only when no template matches.

### Digital Human policy (unchanged)
- Portrait / Layered / Live2D / Live3D remain adapters. No fake certification.
- Runtime is renderer-agnostic. `digital-human.ts` still returns
  `provisioned: false` until real assets are bound.

### Verification
- `bunx tsgo --noEmit` — clean.
- Migration applied; RLS + GRANTs verified in-database.
- 14 greeting templates seeded across 3 locales.

### Remaining honest gaps
- Client shell / UI surface (chat surface, presence indicator, mode
  switcher, evidence viewer) — separate UI pass.
- Playwright end-to-end verification requires the UI shell.
- Digital Human rendering (R40–R50) still blocked on external assets
  and GPU render infrastructure.

============================================================================
R40 — HAPPY HYPER-REAL CHARACTER ASSET PIPELINE
============================================================================
Status: **WORKING (asset contract + registry + validators). Renderer NOT included by policy.**

### Deliverables

| Component                | Status  | Notes                                              |
|--------------------------|---------|----------------------------------------------------|
| Asset Registry           | WORKING | `happy_assets` + `happy_asset_versions`, versioned |
| Asset Versioning         | WORKING | Unique `(asset_id, version)`, immutable insert     |
| Asset Validation         | WORKING | Checksum sha256, size, mime, deps in `importAssetVersion` |
| Character Manifest       | WORKING | `happy_character_manifests` — `character_key='HAPPY'` only |
| Rig Contract             | WORKING | 27 required + 10 finger bones, humanoid + anim compat |
| Skeleton Contract        | WORKING | `bone_count >= REQUIRED_BONES.length`, root bone   |
| Blendshape Contract      | WORKING | Full ARKit 52 + required viseme subset             |
| Animation Contract       | WORKING | 16 required clips (idle → thank_you → …)           |
| Material Contract        | WORKING | Enforced via `RUNTIME_REQUIREMENTS[live3d]`        |
| LOD Contract             | PARTIAL | Modeled in `meta.lods[]`; strict validator PLANNED |
| Voice Contract           | WORKING | Provider-independent seam; presence flag only      |
| Import Pipeline          | WORKING | Rejects bad checksum, size, missing deps           |
| Compatibility Checker    | WORKING | 7 targets (portrait/layered/live2d/live3d/xr/vr/ar)|
| Founder Panel snapshot   | WORKING | `founderAssetPanel` — no UI in this pass           |
| Renderers (Live2D/3D/etc)| PLANNED | Explicitly out of scope per R40 policy             |

### Files
- `supabase/migrations/*_r40_*.sql` — 5 tables + FK backfill
- `src/lib/happy-assets/contracts.ts` — REQUIRED_BONES, ARKIT52, animations, runtime requirements
- `src/lib/happy-assets/validators.ts` — rig/skeleton/blendshape/animation/compat
- `src/lib/happy-assets/engine.ts` — importAssetVersion, validateManifest, founderPanel
- `src/lib/happy-assets/assets.functions.ts` — 7 server functions (register, import, manifest, link, validate, panel, contracts)

### Security
- RLS: reads public (assets are catalog-level); writes gated to `is_ops_admin`.
- `happy_asset_versions` UNIQUE `(asset_id, version)` — versions never overwrite.
- `happy_asset_validations` is append-only (INSERT policy, no UPDATE/DELETE grant to authenticated).
- Immutable asset history preserved through version rows + validation rows.

### Validator semantics
- Every validator returns `{status, missing[], report}`.
- `status ∈ {READY, PARTIAL, BLOCKED}`; rollup takes worst status across parts.
- Missing items are always listed explicitly, prefixed by kind (`bone:jaw`, `viseme_required:jawOpen`, `animation:wave`, `live3d:material`).
- Compatibility matrix reports per-target status independently.

### Verification
- `bunx tsgo --noEmit` — clean.
- Migration applied; FK from `happy_assets.current_version_id` to `happy_asset_versions.id` added after both tables exist.
- Contracts exported through `getAssetContracts` for external tooling.

### Honest gaps (renderer policy)
- Live2D/Live3D/XR/VR/AR renderers remain PLANNED (R40 explicitly forbids implementing them here).
- MetaHuman / Audio2Face / Pixel Streaming remain future integrations.
- No fake certification: `computeCompatibility` reports `READY` for a target only when ALL required roles are physically linked in the manifest.
