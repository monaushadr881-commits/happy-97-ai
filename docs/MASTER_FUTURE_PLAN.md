# HAPPY — Master Future Plan

Execution plan after R6. All items are scoped to REAL implementation only (no doc/roadmap passes). Priority high → low.

## P0 — Unblock verification

- **Authenticated Playwright harness**: mint a preview session so R4/R5/R6 flows (`/founder`, `/notifications`, `/billing`, `/digital-human`) can be end-to-end verified. Without this every certification remains "code-inspection only".

## P1 — Payment provider adapter (R11)

- Provider-agnostic already (`subscriptions.provider`, `wallet_ledger_entries.metadata.provider`)
- Ship in order: Stripe → Razorpay → Paddle → Cashfree → PayPal
- Deliverables:
  - `/api/public/webhooks/stripe` route with signature verification (never bypass)
  - `stripeService.createCheckout / createPortalSession / cancel / refund`
  - Ledger writers on `payment_intent.succeeded` and `charge.refunded`
  - Idempotency table keyed on `provider_event_id`

## P2 — Notifications delivery (R10)

- Email transport first via Lovable AI Gateway / SMTP integration
- Templating on top of existing `notifications` + a `notification_templates` table
- Respect `notification_preferences.channel = 'email'`
- Bounce/suppression list

## P3 — Business OS UIs (R12)

Wire real UIs onto existing tables. Order:
1. **CRM**: leads / deals / customers pipeline board (already have tables)
2. **HRMS**: employees, departments, offices, teams
3. **Inventory / Warehouse**: `inventory_items`, `warehouses`, `suppliers`, `purchase_orders`
4. **Finance**: `chart_of_accounts`, `ledger_entries`, `expenses`, `invoice_items`

## P4 — Marketplace real workflow (R7)

Publish → automated scanner → human review queue → approve → sign → install → rate.
- New: `marketplace_submissions`, `marketplace_review_events`
- Signing key rotation
- Install pipeline into `plugins`/`skills`

## P5 — Rate limiting + webhook hardening + a11y sweep (R8)

- Token-bucket rate limiter in `src/start.ts` request pipeline (per-IP, per-user)
- Reusable `verifyWebhookSignature(secret, request)` helper
- Sitewide a11y sweep: icon-button labels, single `<main>`, `h-dvh`, focus rings, tab order

## P6 — Website Builder v1 (R9)

- Real minimal generator: sections → JSON → server-render to static HTML for preview
- Publish to `public.deployments` with a preview URL
- No app/native builders in this batch — website only

## P7 — Digital Human real face rig

- Requires assets (see BLOCKED list in `MASTER_STATUS.md`)
- When Live3D GLB lands: viseme mapping (14 mouth shapes), ARKit blendshape driver, phoneme aligner
- Emotion state machine on top of 12-token blend

## P8 — Coupons / promo engine

- `coupons`, `coupon_redemptions`, `promotions`
- Ledger-integrated discount entries

## P9 — Customer billing portal

- Provider-portal proxy OR bespoke `/billing/portal` surface once provider adapters exist

## Non-goals (do NOT do)

- Do not expand roadmap/version cards (v2 → v17) without shipping code alongside
- Do not add native mobile / desktop builders until the website builder ships
- Do not enable a service worker (not requested)
- Do not certify the platform as a whole — only per-surface certification

## Definition of Done (per batch)

A batch is DONE only when all of:
1. Real code merged; no `NOT_IMPLEMENTED`, no `V2TabBody`, no placeholder counters on the affected surface
2. Typecheck clean
3. RLS + GRANTs verified on any new table
4. Playwright verified under an authenticated session (or explicitly recorded as BLOCKED with reason)
5. `docs/STATUS.md` updated with WORKING / PARTIAL / MISSING for the changed area
6. `MASTER_AUDITS.md` gets a new R# entry
