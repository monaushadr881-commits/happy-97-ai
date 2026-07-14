# Phase 14 — HAPPY Hyperlocal Intelligence Operating System (HIOS)

## Mission
One unified hyperlocal platform (AAS PAAS) where people, businesses,
services, organizations and communities connect through HAPPY AI.

## Architecture

- **Routes** — `/hyperlocal` layout with 10 sub-surfaces:
  Dashboard, Discover, Businesses, Jobs, Events, Alerts, Ask HAPPY, Map,
  My Listings, Privacy.
- **API v1** — `src/lib/hyperlocal-v1.functions.ts`. Every function goes
  through `requireSupabaseAuth`; RLS enforces ownership.
- **AI** — Only via the Lovable AI Gateway (`google/gemini-2.5-flash`).
  `hlAskHappy` retrieves bounded nearby signal, cites items and never
  implies endorsement.
- **Location** — Haversine-based nearby filter on top of city/pincode
  DB filters. No PostGIS dependency; ready to swap for `earthdistance`
  or a maps provider later.
- **Business OS integration** — `hl_businesses.company_id` links to
  `companies`; jobs / events can attach to a business.

## Module Inventory

| Surface | File | Purpose |
| --- | --- | --- |
| Dashboard | `hyperlocal.index.tsx` | KPIs + surface index |
| Discover | `hyperlocal.discover.tsx` | Universal hyperlocal search |
| Businesses | `hyperlocal.businesses.tsx` | Verified nearby businesses |
| Jobs | `hyperlocal.jobs.tsx` | Nearby jobs |
| Events | `hyperlocal.events.tsx` | Upcoming local events |
| Alerts | `hyperlocal.alerts.tsx` | Community & emergency alerts |
| Ask HAPPY | `hyperlocal.ask.tsx` | AI hyperlocal assistant |
| Map | `hyperlocal.map.tsx` | Cluster view + maps hook |
| My Listings | `hyperlocal.manage.tsx` | Owner-only CRUD + verification |
| Privacy | `hyperlocal.settings.tsx` | Location consent controls |

## Database (new)

- `hl_places` — location directory (country → locality, pincode, geo).
- `hl_businesses` — verified business profiles with hours, media, ratings.
- `hl_jobs` — hyperlocal jobs (full_time / part_time / internship /
  daily_wage / apprenticeship).
- `hl_events` — local events across categories.
- `hl_alerts` — community, emergency, offer, announcement alerts.
- `hl_reviews` — 1–5 star reviews per (business, user), unique.
- `hl_user_location` — per-user opt-in privacy preferences.

All tables: RLS enabled, owner-only writes, member reads on active rows,
service_role full access. GIN/BTREE indexes on `latitude,longitude`,
`city`, `pincode`, `category`. `_hxp_attach_touch` maintains `updated_at`.

## API Inventory

**Location** `hlGetMyLocation`, `hlSetMyLocation`, `hlListPlaces`,
`hlCreatePlace`.
**Businesses** `hlSearchBusinesses`, `hlGetBusiness`, `hlUpsertBusiness`,
`hlListMyBusinesses`, `hlRequestVerification`.
**Jobs** `hlSearchJobs`, `hlUpsertJob`.
**Events** `hlSearchEvents`, `hlUpsertEvent`.
**Alerts** `hlSearchAlerts`, `hlCreateAlert`.
**Reviews** `hlListReviews`, `hlUpsertReview` (recomputes aggregate).
**AI** `hlAskHappy` (retrieval + Gateway + citations).
**Dashboard** `hlDashboard` (KPI counts).

## Navigation Tree

```
/hyperlocal
├── /             Dashboard
├── /discover     Universal search
├── /businesses   Verified businesses
├── /jobs         Nearby jobs
├── /events       Upcoming events
├── /alerts       Community/emergency alerts
├── /ask          AI hyperlocal assistant
├── /map          Cluster / map view
├── /manage       My listings + verification request
└── /settings     Privacy & location consent
```

Also added to the primary sidebar under Modules.

## Business Integration Summary

- Businesses may reference `companies.id` to unlock Business OS features
  (inventory, orders, CRM, invoices, payments, analytics) for verified
  merchants — surfaced through existing `/business` module.
- Jobs and events can attach to a `hl_business`, giving Business OS
  users a hyperlocal lead / attendance funnel without duplicated logic.
- Reviews mutate `rating_avg` / `rating_count` on the parent business so
  Business OS analytics can consume the same aggregates.

## Security Summary

- Every write path is guarded by `requireSupabaseAuth` + RLS
  (`auth.uid() = owner_id / posted_by / organizer_id / user_id`).
- **HYPERLOCAL RULE enforced in code**:
  - Precise coords are dropped server-side when `allow_precise = false`.
  - Background permission gated behind precise permission in UI.
  - Businesses cannot edit other owners' listings.
  - AI responses instructed to be transparent (no implied endorsement).
- Zod validates every input (title lengths, lat/lng ranges, ratings 1–5,
  URLs, emails, enum types).
- No client key exposure; AI Gateway invoked server-side only.
- Public/anon reads are NOT granted — HIOS is authenticated-only surface.

## Performance Summary

- Cursor-friendly `.limit()` + ordered pulls (bounded to `limit * 3`
  server-side before Haversine filter).
- BTREE indexes on `city`, `pincode`, `category`, `(latitude, longitude)`
  keep DB scan cheap; distance filter runs in JS on the bounded batch.
- Ready for realtime: `hl_alerts` / `hl_events` are candidates for
  Supabase realtime channels without schema changes.
- Map surface designed to plug into a provider (Google Maps, MapLibre)
  without refactoring data model.

## Testing Summary

- Manual: create business → appears in Discover, Businesses, Map cluster;
  request verification flips to Pending; post job/event/alert scoped to
  city; Ask HAPPY returns cited nearby answers.
- Type safety: Supabase types regenerate after migration; all functions
  are strongly typed through Zod validators.
- RLS: authenticated cross-user writes rejected; anon reads rejected.

## Documentation Summary

- This document covers architecture, module inventory, API surface,
  navigation, integrations, security, performance and testing.
- Governance rules (HYPERLOCAL RULE) documented at top of
  `src/lib/hyperlocal-v1.functions.ts`.
