# Phase 12 — HAPPY X Community, Marketplace & Commerce OS (CMOS)

CMOS unifies community, marketplace, commerce, and messaging on the HAPPY X
service layer. No feature bypasses the AI Gateway, service layer, or
Enterprise Foundation. All rows are RLS-scoped; every mutation runs through
`requireSupabaseAuth`.

## Community Architecture

- **Feed** (`/community`) — public posts with reactions, comments, share.
- **Following** (`/community/following`) — feed filtered to followed authors.
- **Groups** (`/community/groups`) — public / private / verified / business /
  education / founder / local / organization / interest / invite-only spaces.
- **My Posts** (`/community/mine`) — user-owned posts, soft-deletable.
- Post types supported by the `posts` table: posts, articles, threads,
  polls (media JSON), questions, announcements, media posts.
- Comments, reactions (`like`, `love`, `insightful`, `celebrate`, `curious`),
  follows and moderation via `record_status`.

## Marketplace Architecture

- **Browse** (`/marketplace`) — search & discover listings across digital
  products, courses, templates, AI agents, prompts, plugins, brand assets,
  subscriptions, services, and (via `products` table) physical goods.
- **Seller Center** (`/marketplace/seller`) — catalog, draft → publish
  workflow, KPIs (listings, active, orders, gross).
- **Buyer Center** (`/marketplace/orders`) — auditable order history.
- **Sales** (`/marketplace/sales`) — seller payouts overview.

## Commerce Architecture

- Purchase intents write to `marketplace_transactions` with
  `status = 'pending'` and an audit log entry (`commerce.purchase.intent`).
- Providers: `mock` (default, safe for dev), `stripe`, `paddle`, `razorpay`.
- Fulfillment (payment capture / refund / GST / invoice) is handled by the
  existing Business OS payments module and provider webhooks.

## Messaging Summary

- `/messages` — thread list + inline chat.
- Backed by user-owned `conversations` + `messages` (RLS: `auth.uid = user_id`).
- Streaming-ready: layout supports future SSE upgrade; input handles Enter.

## Module Inventory

| Module              | Route                       | Server API                                 |
|---------------------|-----------------------------|--------------------------------------------|
| Community feed      | `/community`                | `communityFeed`, `communityCreatePost`     |
| Following           | `/community/following`      | `communityFeed({scope:'following'})`       |
| My posts            | `/community/mine`           | `communityFeed({scope:'mine'})`, delete    |
| Groups              | `/community/groups`         | `communityListGroups`                      |
| Marketplace browse  | `/marketplace`              | `marketBrowse`, `commercePurchase`         |
| Seller Center       | `/marketplace/seller`       | `marketMyListings`, `marketCreateListing`  |
| Buyer orders        | `/marketplace/orders`       | `commerceMyOrders`                         |
| Seller sales        | `/marketplace/sales`        | `commerceMySales`                          |
| Messaging           | `/messages`                 | `msgListConversations`, `msgSend`          |

## API Inventory (`src/lib/cmos-v1.functions.ts`)

Community: `communityFeed`, `communityCreatePost`, `communityDeletePost`,
`communityListComments`, `communityAddComment`, `communityReact`,
`communityFollow`, `communityListGroups`.

Marketplace: `marketBrowse`, `marketGetListing`, `marketCreateListing`,
`marketUpdateListing`, `marketMyListings`, `marketAddReview`.

Commerce: `commercePurchase`, `commerceMyOrders`, `commerceMySales`,
`commerceSellerStats`.

Messaging: `msgListConversations`, `msgCreateConversation`,
`msgListMessages`, `msgSend`.

Dashboard: `cmosDashboard`.

## Security Summary

- RLS enforced on `posts`, `comments`, `reactions`, `follows`, `groups`,
  `listings`, `listing_reviews`, `marketplace_transactions`,
  `conversations`, `messages` (see database).
- Every mutation validates inputs with Zod; string lengths bounded.
- Follow rejects self-follows; purchase rejects self-purchase.
- Every `commerce.purchase.intent` writes an `audit_logs` row.
- Content moderation hooks: `record_status` transitions + soft delete +
  audit; human review can consume `posts.status` and `comments.status`.
- Tenant isolation: `posts.company_id`, `listings.company_id` scope rows
  when set; user-owned rows use `auth.uid()`.

## Performance Summary

- Feed uses cursor pagination via `created_at`.
- All queries `.limit()` bounded (feed 20, browse 24, sales 100, messages 500).
- Indexed reads: `posts(created_at DESC)`, `messages(conversation_id, created_at)`.
- React Query caches keyed per surface, invalidated on mutation.
- Ready for realtime overlay (existing supabase channels) without schema change.

## Testing Summary

- Server functions: input validators (Zod) — invalid payloads rejected at
  the edge; RLS proves ownership at the database.
- UI happy paths verified for feed, seller create, purchase, messaging.
- E2E TODO (Playwright): create post → react → comment; create listing →
  publish → purchase → order appears.

## Documentation Summary

This doc is the source of truth for Phase 12. Follow-ups (Phase 13+) can
extend CMOS by adding modules under `src/routes/_authenticated/community.*`,
`marketplace.*`, `messages.*` and RPCs in `src/lib/cmos-v1.functions.ts`.
Never bypass the Gateway, service layer, or Foundation.
