# Payments Checklist

## Rule (both stores)
Digital goods consumed inside the app **must** use native billing:
- Android → **Google Play Billing**
- iOS → **Apple In-App Purchase**

External payment providers (Stripe, Paddle, etc.) are allowed only for physical goods or services consumed outside the app.

## Current State
- Repository-level payments providers wired: see `docs/MASTER_APIS.md` and adapters in `src/lib/happy-adapters/`
- Native billing plugins: TODO — install `@capacitor-community/in-app-purchases` or `revenuecat` when native projects are initialized

## Product Catalog (TODO — Founder defines)

| Product ID | Type | Store | Price Tier | Description |
|---|---|---|---|---|
| `happy.credits.100` | Consumable | Both | TODO | 100 HAPPY credits |
| `happy.credits.1000` | Consumable | Both | TODO | 1000 HAPPY credits |
| `happy.pro.monthly` | Subscription | Both | TODO | HAPPY Pro monthly |
| `happy.pro.yearly` | Subscription | Both | TODO | HAPPY Pro yearly |
| `happy.enterprise` | Subscription | Both | TODO | Enterprise tier |

## Required Flows
- [ ] Purchase flow (buy)
- [ ] **Restore purchases** (required by both stores)
- [ ] Server-side receipt validation
  - Google: `androidpublisher.purchases.subscriptions.get`
  - Apple: App Store Server API `/inApps/v1/transactions/{id}`
- [ ] Refund handling (Play RTDN + Apple Server Notifications v2)
- [ ] Grace period + billing retry states
- [ ] Introductory pricing / free trial (if offered)
- [ ] Family Sharing declaration (Apple)

## Credits Model (R128 alignment)
- **Daily credits**: awarded server-side by scheduled job (R128) — no purchase
- **Purchased credits**: awarded only after server-side receipt validation
- Never trust a client-only purchase result

## Store-Facing Result
- **Blocked** until native billing plugin is chosen + wired + tested on device
