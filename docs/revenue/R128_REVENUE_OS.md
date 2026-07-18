# R128 — HAPPY Revenue OS Intelligence™

**Status:** Shipped (extension only; zero duplicate runtime).
**Locks:** R91 Vision · R111 Architecture · R113 Founder Constitution.

## Canonical Owners (extended, never replaced)

| Concern              | Canonical Owner |
|----------------------|-----------------|
| Credits Engine       | `src/lib/credits/engine.ts` + `credits.functions.ts` |
| Subscription Engine  | `src/lib/subscriptions/lifecycle.ts` + `.functions.ts` |
| Wallet Engine        | `src/lib/wallet/engine.ts` + `wallet.functions.ts` |
| Payment Runtime      | `src/lib/payments/*` (adapters, business-processor, webhook-runtime) |
| Billing surface      | `src/lib/billing-v5.functions.ts` |
| Revenue surface      | `src/lib/revenue-v1.functions.ts` |
| Communication        | R127 (billing/receipt notifications) |
| Brain / Memory / Workspace / Search / Files / DH | R115–R120 |

R128 adds one file — `src/lib/happy-r128/revenue-intelligence.ts` — plus tests
and this doc. No new tables, APIs, routes, or runtimes.

## Gap Report → Fixes

| Gap                                                | Resolution |
|----------------------------------------------------|------------|
| Ad-hoc float money math scattered per surface      | `toMinor` / `toMajor` (integer minor units, JPY-aware) |
| Credit ledger arithmetic duplicated                | `creditBalance`, `expiringSoon`, `computeExpiry` per kind |
| Coupon validation reimplemented per checkout       | `validateCoupon`, `applyCoupon` (percent/amount/credits) |
| GST/VAT logic missing / inconsistent               | `computeTax` (IN CGST/SGST/IGST, EU VAT + reverse charge) |
| Invoice building not centralized                   | `buildInvoice`, `creditNote` |
| Plan change/proration ungoverned                   | `planUpgradePath`, `prorate`, `nextRenewal` |
| Wallet balance mixed currencies                    | `walletBalance` (per-currency isolation) |
| Usage metering not aggregated                      | `meterUsage` with per-kind default unit cost |
| Revenue KPIs computed per dashboard                | `mrr`, `arr`, `churnRate`, `retentionRate`, `ltv`, `forecastRevenue` |
| Upgrade suggestion missing                         | `upgradeSuggestion` (compare over-plan spend vs price) |
| Refund policy checks scattered                     | `eligibleForRefund` (window + already-refunded) |
| Brain had no revenue resolver                      | `classifyRevenueIntent` + `resolveForBrain` (13 intents) |
| DH had no revenue preset                           | `pickDhRevenueMode` (billing/subscription/sales/founder/support) |
| Roles ungoverned                                   | 6×10 `revenueCan(role, cap)` matrix |

## Payment Providers (architecture-ready)

6 providers modelled — `stripe`, `paddle`, `razorpay`, `cashfree`, `paypal`,
`manual`. Provider SDKs and webhooks remain **BLOCKED-EXTERNAL** and activate
through the existing payment runtime (`src/lib/payments/*`) the moment
credentials are supplied.

## Impact

- **Database:** none.
- **APIs:** none (extension helpers only).
- **Security:** integer minor-unit math prevents float drift; refund policy
  window prevents replay of stale charges; permissions matrix gates every
  destructive capability.
- **Performance:** pure functions, O(n) worst case, deterministic.
- **Backward compatibility:** 100%.

## Tests

`tests/unit/happy-r128.test.ts` — money math, credit ledger + expiry, coupons,
GST/VAT + reverse charge, invoices + credit notes, plan upgrade/prorate/renewal,
wallet, usage metering, MRR/ARR/churn/retention/LTV/forecast/upgrade suggestion,
refund eligibility, brain resolver, DH modes, permissions, snapshot.

## Known Limitations / Remaining Work

- PSP SDKs (Stripe / Paddle / Razorpay / Cashfree / PayPal) and webhook signing
  keys remain **BLOCKED-EXTERNAL** until Founder supplies credentials.
- Native tax filing/remittance stays with the merchant of record; this layer
  only calculates.
