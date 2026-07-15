# HAPPY Enterprise Financial Foundation (R6)

Single source of truth for every monetizable surface in HAPPY:
subscriptions, wallets, credits, marketplace revenue, builder revenue,
AI usage, future SaaS billing.

Frozen contracts (architecture, authentication, RBAC, RLS, existing
revenue analytics, existing billing UI structure, Digital Human, Brain,
Notifications, Theme Engine) are unchanged. This document describes the
expansion-only R6 layer.

## Financial Domain Model

| Table | Purpose | Owner |
|---|---|---|
| `plans` | Catalog of billable plans (Free → Enterprise, Custom). | Platform |
| `subscriptions` | One row per company subscription lifecycle. | Company |
| `subscription_events` | **Immutable** lifecycle audit trail. | Company |
| `wallets` | One wallet per `(owner_type, owner_id, currency)`. | User / Company |
| `wallet_ledger_entries` | **Immutable** money journal. | Wallet owner |
| `credit_ledger_entries` | **Immutable** universal HAPPY Credits journal. | User / Company |
| `v_wallet_balances` | Derived balance view (security_invoker). | View |
| `v_credit_balances` | Derived credit balance view (security_invoker). | View |

Balances are **never** stored on wallet rows. They are always derived
from the ledger via the two views. This is the ledger-integrity rule.

## Ledger Design

Both ledgers follow the same shape:

- Append-only. `UPDATE`/`DELETE` are blocked by an immutability trigger.
- `direction ∈ {credit, debit}` + positive `amount` (`amount_cents` for
  wallets, `amount` units for credits). Balance = `Σcredit − Σdebit`.
- `entry_type` classifies the movement (purchase, refund, reward,
  referral, adjustment, marketplace_earning, builder_earning, consume,
  payout, chargeback / purchase, consume, refund, expire, transfer_in,
  transfer_out, bonus, referral, admin_grant, marketplace_usage,
  ai_usage, builder_usage, automation_usage).
- `reference_type` + `reference_id` link to the originating entity
  (invoice, order, marketplace listing, AI session, builder run…).
- `metadata JSONB` is free-form; keep provider payloads there.
- `created_by` captures the acting user for audit.

Adjustments (`entry_type = 'adjustment'`) and grant-type credit entries
(`admin_grant`, `bonus`, `referral`) require `public.is_ops_admin` and
are enforced by RLS `WITH CHECK`.

## Subscription Lifecycle

```
trial ──▶ active ──▶ paused ──▶ active
             │           │
             ├──▶ past_due ──▶ cancelled
             └──▶ cancelled ──▶ expired
```

Every transition writes an immutable `subscription_events` row (
`created`, `trial_started`, `activated`, `renewed`, `upgraded`,
`downgraded`, `paused`, `resumed`, `cancelled`, `expired`,
`payment_failed`). `from_plan_id` / `to_plan_id` on upgrade / downgrade
carry the plan-change history required by the spec.

Cadences supported today: `month`, `quarter`, `half_year`, `year`,
`three_year`, `five_year`, `lifetime`. Grace period is derived from
`current_period_end + trial_days`.

Only `is_company_admin(company_id)` (or ops admin) may mutate a
subscription; every member may read.

## Wallet Lifecycle

1. Client calls `finEnsureUserWallet` (or company-scoped equivalent).
   Idempotent — a `SELECT` on `(owner_type, owner_id, currency)` returns
   the existing wallet or inserts one.
2. Movements are posted via `financialService.postWalletEntry` (server
   only). Direction and `entry_type` classify the movement; the wallet
   balance updates in the view instantly.
3. Refunds and chargebacks post an opposite-direction entry that
   references the original entry through `reference_type/reference_id`.

## Credit Lifecycle

Universal HAPPY Credits fund every AI-powered surface. Credits have
optional `expires_at` — expired credits fall out of `v_credit_balances`
automatically. Consumption (`ai_usage`, `builder_usage`,
`automation_usage`, `marketplace_usage`) is a debit; purchase, bonus,
referral, admin_grant are credits.

Transfers between wallets are recorded as a paired
(`transfer_out`, `transfer_in`) entry set.

## Provider Abstraction

The database is intentionally provider-agnostic. `subscriptions.provider`
+ `provider_ref` and `wallet_ledger_entries.metadata.provider` are the
integration seams. Stripe / Razorpay / Paddle / Cashfree / PayPal
adapters (not implemented) will:

1. Receive a signed webhook at `/api/public/webhooks/<provider>`.
2. Verify signature (`crypto.timingSafeEqual`) using a
   provider-specific secret.
3. Load `subscriptions` / `invoices` by `provider_ref`.
4. Post the ledger entry and, where relevant, transition the
   subscription with a matching `subscription_events` row.

No provider adapter has been wired in R6. The abstraction is the
absence of provider-specific columns from every table.

## Webhook Flow (planned)

```
Provider ──▶ /api/public/webhooks/<p>  (raw body, HMAC verify)
              └─▶ dispatchProviderEvent(event)
                    ├─▶ subscription state transition
                    ├─▶ wallet ledger entry (paid / refunded)
                    ├─▶ credit ledger entry (if plan includes credits)
                    └─▶ notification (via existing notification platform)
```

Handlers must be idempotent (dedupe on provider event id in
`wallet_ledger_entries.metadata.provider_event_id`).

## Security

- RLS enforced on every table. Users read their own wallets/credits;
  company members read company-scoped wallets/credits; ops admins see
  all.
- Ledgers are **immutable** via triggers. No API path can rewrite
  history.
- No client-side balance state — always derived on the server via
  views, which are `security_invoker = on`.
- Adjustments require ops admin.
- All movements audit-trailable via `created_by`, `metadata`,
  `reference_type/id`.

## Performance

- Indexes on `(wallet_id, created_at DESC)`,
  `(owner_type, owner_id, created_at DESC)`,
  `(reference_type, reference_id)`, `(company_id)`,
  `(status)`, `(current_period_end)`.
- Views use aggregates — fine at platform scale until per-owner ledger
  size crosses ~1M rows, at which point a materialized snapshot per
  wallet is the next step.
- Server functions return bounded pages (max 200) and refresh at
  30–60s intervals; no realtime subscriptions yet.

## Accessibility

Every panel in `/billing` exposes:
- ARIA `role="tabpanel"` / `role="tab"` with `aria-selected`,
  `aria-controls`.
- `role="status" aria-live="polite"` on loading rows.
- `role="alert"` on error rows with a keyboard-accessible Retry.
- Semantic tables with `<caption class="sr-only">` and `scope="col"`.

## Future Expansion

- Payment provider adapters (Stripe / Razorpay / Paddle / Cashfree /
  PayPal) via `/api/public/webhooks/*`.
- Coupon and promo engine — new `coupons` table + `discount_cents` on
  ledger entries.
- Marketplace earnings settlement (payouts) — new payout status field
  driven by `entry_type = 'payout'`.
- Materialized per-wallet snapshots when ledger scale demands it.
- Multi-currency FX rates via existing `currencies` table.

## Reports

- Schema: 6 new tables, 6 enums, 2 views, seed data for 5 plans.
- Service: `financialService` with 12 methods.
- RPC: 8 authenticated server functions.
- UI: `/billing` now renders real Subscriptions and Wallet/Credits.
- Founder Dashboard: +5 live tiles (Wallet Volume, Credits
  Outstanding, Active Subs, Trials, Renewals 30d).
- No frozen contract modified.
