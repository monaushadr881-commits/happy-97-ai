# R37 — Enterprise Ecosystem  &  R38 — Founder Copilot Workspace
## Engineering Execution Plan (not yet implemented)

Status: **PLANNED**. This is the concrete plan; no code has been written for R37/R38.

---

## R37 — Enterprise Ecosystem

Extends the existing `listings` / `marketplace_transactions` / `plugins` foundation into typed stores with publishing workflow, versioning, reviews, and revenue.

### 1. Database

New tables (all in `public`, all with RLS + GRANTs):

| Table | Purpose | Key fields |
|---|---|---|
| `store_categories` | Typed store namespaces | `code` (`app`,`template`,`plugin`,`theme`,`agent`,`widget`,`business_pack`,`industry_pack`,`asset`), `label`, `parent_id` |
| `store_products` | Catalog entry per publishable item | `slug`, `category_code`, `publisher_id (company)`, `plugin_id?`, `template_id?`, `theme_id?`, `agent_id?`, `status` (draft/review/published/suspended) |
| `store_product_versions` | Immutable version snapshots | `product_id`, `version` (semver), `manifest JSONB`, `checksum`, `changelog`, `published_at` |
| `store_reviews` | Verified-purchase reviews | `product_id`, `reviewer_id`, `rating 1–5`, `body`, `verified_purchase BOOLEAN` |
| `store_purchases` | Fulfilled purchases | `product_version_id`, `buyer_company_id`, `price_cents`, `currency`, `payment_ref`, `entitlement_expires_at?` |
| `store_publisher_profiles` | Publisher trust metadata | `company_id`, `display_name`, `verified BOOLEAN`, `payout_currency`, `stripe_account_id?` |
| `store_moderation_events` | Immutable moderation log | `product_id`, `event_type`, `moderator_id`, `notes` |

RLS:
- `store_categories`, `store_products` (published only), `store_product_versions` (of published products), `store_reviews` — public read (`TO anon`).
- Ops admins manage categories & moderate products.
- Company admins publish/edit their own products & versions.
- Buyers see their own purchases; publishers see aggregates on their own products.
- `store_moderation_events` immutable via trigger.

### 2. Server functions (`src/lib/ecosystem/`)

- `listStores`, `listProducts({category, publisher, search, tag})`, `getProduct({slug})`
- `publishProductVersion({manifest})`
- `submitForReview`, `approveProduct`, `suspendProduct`, `unpublishProduct` (ops)
- `purchaseProduct` (integrates with existing `marketplace_transactions` + `payments`)
- `installFromStore` (bridges to `plugin_installations` when category=plugin)
- `reviewProduct`, `moderateReview`
- `publisherProfile.upsert`, `publisherOverview`
- `ecosystemOverview` → fact/recommendation dashboard

### 3. Runtime

- Reuse existing `plugins` engine for plugin category.
- Extend `template.functions.ts` / `theme-*.functions.ts` for template/theme install.
- Purchases route through existing `payments` module (Stripe/Paddle) — never reimplement charging.

### 4. UI

- `/marketplace` — public store home (per-category tabs).
- `/marketplace/:category` — category listing (filters, sort).
- `/marketplace/product/:slug` — product page (versions, reviews, install/purchase CTA).
- `/publisher` — publisher dashboard (`_authenticated`).
- `/admin/store-moderation` — ops queue (`_authenticated`, ops-only).

### 5. Security

- Signature-verified manifests (SHA-256, matches plugin framework).
- Purchase entitlement enforced server-side before install.
- Moderation events immutable.
- Only verified publishers can list paid products.

### 6. Verification

- `bun run typecheck`
- Unit tests for grant/entitlement matrix.
- Playwright: browse → purchase → install → review round-trip.

### 7. Dependencies

- R36 (plugin framework)
- Existing `payments/` module
- Existing `listings/` + `marketplace_transactions` (migration path)

### 8. Estimated order

1. Migration + GRANTs + RLS
2. `ecosystem/engine.ts` + `ecosystem/functions.ts`
3. Publisher & product lifecycle
4. Purchase + install bridge (plugins)
5. Public routes & product page
6. Reviews & moderation
7. Ecosystem overview dashboard
8. Playwright coverage

---

## R38 — Founder Copilot Workspace

A command center for the founder. Reuses every existing runtime; adds NO new business logic.

### 1. Database

Minimal — the workspace mostly aggregates existing tables. New tables:

| Table | Purpose |
|---|---|
| `copilot_workspaces` | One row per founder (config, layout, pinned metrics) |
| `copilot_commands` | Command history: `intent`, `parsed`, `runtime_route`, `status`, `result_summary`, `latency_ms` |
| `copilot_pins` | Founder-pinned entities (deal, invoice, insight, task) with `entity_type`, `entity_id`, `label` |
| `copilot_briefings` | Generated executive briefings (daily/weekly), `period`, `snapshot JSONB`, `sources[]` |

RLS: workspace / commands / pins scoped to `owner_id = auth.uid()`. Briefings viewable by founder and platform ops.

### 2. Server functions (`src/lib/copilot/`)

- `getWorkspace`, `updateWorkspace`
- `parseCommand({text})` — Lovable AI Gateway (google/gemini-2.5-flash), returns `{ intent, capability, args }`
- `executeCommand({text|capability, args})` — calls `routeCapability` from `happy-runtime/capability-router`
- `pinEntity`, `unpinEntity`, `listPins`
- `generateBriefing({period})` — aggregates:
  - Finance: revenue, AR aging, cash position (from `journal_entries`, `invoices`, `bank_accounts`)
  - CRM: pipeline, deals-by-stage (from `deals`)
  - Ops: production, WMS, inventory alerts
  - Observability: incidents, error rate
  - Backup/HA: verified availability
- `founderActionCenter` — pulls `approvals` (pending) + `agent_tasks` (queued for founder) + `happy_change_requests` (pending)
- `copilotOverview` → fact/recommendation

### 3. Runtime

Every capability the copilot exposes is a call to `routeCapability(...)`. Registered adapters point at existing `*.functions.ts` modules. The copilot NEVER duplicates the underlying logic.

### 4. UI

- `/_authenticated/copilot` — command bar + pinned tiles + action center.
- `/_authenticated/copilot/briefings` — daily/weekly briefing archive.
- `/_authenticated/copilot/history` — command history & audit trail.

### 5. Security

- All server fns use `requireSupabaseAuth`; RLS restricts to owner.
- Command execution respects the caller's RBAC (adapter calls run as the user).
- Every `copilot_commands` row is a durable audit record.

### 6. Verification

- Typecheck.
- Command-parser tests (deterministic mapping from a set of intents to capabilities).
- Playwright: sign in → open copilot → run natural-language command → verify audit row.

### 7. Dependencies

- R36 (plugins) — for capability discovery.
- R51 (happy studio) — for `happy_skills` registry.
- Every business runtime it aggregates (CRM/ERP/Finance/BI/Observability/Backup).

### 8. Estimated order

1. Migration + RLS + GRANTs
2. `copilot/engine.ts` (parser, aggregator)
3. Server fns
4. Adapter registrations against existing runtimes
5. Command bar route + action center
6. Briefing generator
7. Overview dashboard
8. Playwright coverage
