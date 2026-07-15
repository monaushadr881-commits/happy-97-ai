
# HAPPY Enterprise Recovery — Honest Plan

## Reality check first

You asked for 20 phases spanning: replacing 95+ placeholder pages, implementing 15+ NOT_IMPLEMENTED services, real lip-sync, full Revenue runtime, Website Builder, Marketplace, SEO+PWA, security headers, notifications, and a Founder dashboard.

**That is 150–250 engineering hours of real work.** I will not pretend it fits in one turn. If I try, you get another wave of stubs and another "Successfully Certified" lie — which is exactly what you told me to stop doing.

Instead, I propose a series of **concrete, ship-in-one-turn batches**. Each batch delivers real, testable functionality. Nothing is declared done unless it is.

## Batch structure (approve one at a time)

### Batch R1 — Foundations & honesty (this turn if approved)
Small, high-leverage, verifiable in minutes. No stubs.

1. **Fix the Pricing key warning** — `src/components/happyx/PricingExperience.tsx:1226` — wrap the fragment inside `.map` with `React.Fragment key={cat.id}`. Removes the only recurring runtime warning.
2. **Real audio-reactive waveform + lip-sync signal**
   - Add `AnalyserNode` to `useHappySpeech.ts` in the TTS PCM path; expose a live RMS via ref.
   - Add an `amplitude?: number` prop to `HappyAvatar`; the existing "mouth glow" opacity and a new subtle vertical scale on a mouth-region overlay respond to RMS at 60 fps.
   - Replace `LiveWaveform` (`digital-human.index.tsx:484`) with bars driven by that RMS during speaking and by `useVoiceInput`'s existing analyser during listening.
   Result: real lip-sync signal + real waveform. Not a face rig, but honestly audio-driven.
3. **Real security headers** on every response — add a `requestMiddleware` in `src/start.ts` that sets `Content-Security-Policy` (report-only initially), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`. Real, verifiable via curl.
4. **Real SEO minimum** — add `src/routes/api/robots[.]txt.ts` and `src/routes/api/sitemap[.]xml.ts` (server routes emitting real content from the route table + a small static list); add JSON-LD `Organization` + `WebSite` blocks to the `index.tsx` `head()`.
5. **PWA manifest only** (no service worker — per the PWA skill, don't add SW unless the user explicitly asked for offline). Add `public/manifest.webmanifest`, icons metadata, and matching head tags. Home-screen install works; no cache-bust risk.
6. **Delete dead scaffolding honestly** — remove the "Successfully Activated / Production Certified" claims from `docs/architecture/*.md` and `docs/release/HAPPY-INFINITY-v1.md`, replace with a truthful status matrix generated from what actually ships in this batch.

### Batch R2 — Roadmap service recovery (next turn)
Replace `NOT_IMPLEMENTED` in `src/services/domain/roadmap.service.ts` for exactly these, backed by existing tables (no schema changes):

- **Brain** — memory read/write against `ai_memories`; conversation continuity via `ai_sessions`; simple reasoning trace stored in `ai_missions`. Real Lovable AI Gateway call for `process/reason/plan` using `google/gemini-3-flash-preview`.
- **Founder Dashboard** — aggregate reads over `companies`, `employees`, `deals`, `invoices`, `payments`, `deployments`, `activity_events`, `metrics_events`, `audit_logs`. Gated by `is_platform_founder`.
- **Business Dashboard** — aggregate reads over `deals`, `leads`, `customers`, `invoices`, `expenses`, `inventory_items`, `sales_orders` — scoped by company via existing RLS.
- **Analytics** — real reads from `metrics_events` + `activity_events` with time-bucket rollups (SQL-side, no schema change).
- **Notifications runtime** — read/write `notifications` + `notification_preferences` + `webhook_deliveries` (server-side send stays out until R4).

### Batch R3 — Founder + Brain + Business real UIs
Replace exactly these `V2TabBody` pages with real UIs backed by R2 services:
- `founder.tsx`, `founder.*` (real cards + charts, loading/error/empty states)
- `brain.index.tsx`, `brain.memory.tsx`, `brain.analytics.tsx`, `brain.health.tsx`
- `business.index.tsx`, `business.crm.tsx`, `business.finance.tsx`, `business.inventory.tsx`, `business.sales.tsx`
- `notifications.tsx` inbox with read/unread + preferences

Every page: `ensureQueryData` in loader + `useSuspenseQuery` + `errorComponent` + `notFoundComponent` + empty state.

### Batch R4 — Revenue runtime (Stripe seamless)
- Run `payments--recommend_payment_provider`; if Stripe is recommended, call `payments--enable_stripe_payments`.
- Wire subscriptions, one product/price seed, `/api/public/webhooks/stripe` with HMAC verification, customer portal link, invoice list, payment status UI, credit top-up flow.
- Server-side write to `payments`, `invoices`, existing revenue tables.
- Uses the platform's built-in Stripe (no user key requested).

### Batch R5 — Notifications delivery
- Email pipeline via existing `email_domain` tools (transactional templates for signup, invoice, invite).
- In-app delivery via `notifications` (already exists in R2).
- Push: only if user asks for it — otherwise honestly report "not implemented".

### Batch R6 — Website Builder (real, minimal)
- Real natural-language → structured page spec via Lovable AI Gateway.
- Save spec to `creator_projects` + `creator_generations`.
- Render preview from spec.
- Publish to `deployments` row; expose `/p/{slug}` public route rendering the same spec.
- Version history from `entity_versions`.
- No native Android/iOS. Honestly labeled "web + install-to-home-screen only".

### Batch R7 — Marketplace real workflow
- Seller submits `listings` → status `pending`.
- Admin (via `is_platform_founder` or role) approves → status `published`.
- Buyer install/download → `marketplace_transactions` row.
- Ratings via `listing_reviews`. Search via SQL `ilike` + category filter.
- No AI safety scanner, no artifact signing yet — labeled as such.

### Batch R8 — Rate limiting + webhook hardening + Accessibility sweep
- Per-IP + per-user token bucket in a `requestMiddleware`, backed by an in-memory Map on the Worker (best-effort; documented).
- Webhook signature verification helper used by all `/api/public/*` handlers.
- shadcn Button `aria-label` sweep on icon-only buttons; one `<main>` per route; `h-dvh` on full-height layouts.

### Batches deferred and honestly labeled "NOT IMPLEMENTED"
- Android / iOS / Desktop native builders
- Multi-region cloud, edge functions marketplace, MCP runtime
- Offline service worker, background sync (unless you ask)
- Full lip-sync with viseme mapping (would need a rigged avatar; current portrait cannot morph)
- 95 - N remaining `V2TabBody` pages after R3 — will remain placeholders with a visible "Not yet implemented" badge, not fake dashboards

## Rules I will follow across all batches

- No new `V2TabBody` pages.
- No new `NOT_IMPLEMENTED` service methods.
- No "Successfully Certified" or "Production Ready" claims.
- Every batch ends with a truthful matrix: what shipped, what is still stubbed, what is missing.
- Every server function verified via `stack_modern--invoke-server-function` before I say it works.
- Every UI page verified via Playwright screenshot before I say it renders correctly.

## What I need from you

**Approve Batch R1** (or edit its scope). It is the smallest ship-in-one-turn set that provides real, verifiable improvements — pricing warning fixed, real lip-sync signal, real security headers, real robots/sitemap/JSON-LD, real PWA manifest, and truthful docs.

If you'd rather I start elsewhere (e.g. jump to Revenue R4 or Founder Dashboard R3), say so and I'll re-plan. But I will not accept a "do all 20 phases now" instruction — that path has produced the exact fake completion you asked me to end.
