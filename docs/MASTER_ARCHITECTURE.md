# HAPPY — Master Architecture

## Stack

- **Framework:** TanStack Start v1 (SSR + file-based routing) on **React 19**
- **Build:** Vite 7, Tailwind CSS v4 (`src/styles.css`, no `tailwind.config.js`)
- **Runtime target:** Cloudflare Workers (workerd) with `nodejs_compat`
- **Backend:** Lovable Cloud (Supabase — Postgres, Auth, Storage, Realtime)
- **State/data:** TanStack Query (loader + `useSuspenseQuery` pattern)
- **Client SDK:** `@/integrations/supabase/client` (browser, publishable key)
- **Server auth middleware:** `@/integrations/supabase/auth-middleware` (`requireSupabaseAuth`)
- **Admin server client:** `@/integrations/supabase/client.server` (`supabaseAdmin`, service role, RLS bypass — webhooks/admin only)
- **Bearer attacher:** `@/integrations/supabase/auth-attacher` registered in `src/start.ts` `functionMiddleware`

## Routing

- `src/routes/__root.tsx` — shell (head, JSON-LD, manifest link)
- `src/routes/index.tsx` — public home
- `src/routes/_authenticated/` — 391 gated route files (dot-nested flat naming)
- `src/routes/api/*.ts` — HTTP endpoints (raw Response)
  - `dh.tts.ts` — Digital Human TTS
  - `robots[.]txt.ts`, `sitemap[.]xml.ts` — SEO
  - `public/v1/*` — external-callable public API (verify signature/secret inside handler)
- `_authenticated/route.tsx` — auth gate redirects unauthenticated → `/auth`

## Server functions (RPC)

- Location: `src/lib/*.functions.ts` (233 modules)
- Pattern: `createServerFn({ method }).inputValidator(zod).middleware([requireSupabaseAuth]).handler(...)`
- Handlers may read `process.env.*` only inside `.handler()`
- Client calls via `useServerFn` inside `useQuery`/`useMutation` — never in loaders on public routes
- Server-only leaves: `*.server.ts` (e.g. `happy-tools.server.ts`, `client.server.ts`) — never imported from client modules

## Services (domain layer)

Path `src/services/domain/*.service.ts` (20 services). UI code never touches Supabase directly — always through a server function that delegates to a service:

`platform, authz, company, brand, workspace, user, settings, notification, audit, ai, conversation, search, analytics, feature-flag, localization, integration, jobs, revenue, financial, roadmap` (roadmap intentionally returns `NOT_IMPLEMENTED` for reserved v2→v6 surfaces).

## Data flow

```text
UI component
  ↓ useSuspenseQuery(queryOptions)
Route loader
  ↓ context.queryClient.ensureQueryData(queryOptions)
useServerFn(serverFnFromLib)
  ↓ createServerFn (+ requireSupabaseAuth middleware attaches bearer)
Domain service (services/domain/*.service.ts)
  ↓
supabase (RLS as caller) | supabaseAdmin (webhook only)
  ↓
Postgres (public schema — GRANTs + RLS enforced)
```

## Security

- **RLS on every public table**, `GRANT` blocks in the same migration
- **Roles** in a separate `user_roles` table + `has_role()` security definer function (never on `profiles`)
- **Security headers** (CSP-RO, HSTS, nosniff, Referrer-Policy, Permissions-Policy, XFO, COOP) applied in `src/start.ts` `requestMiddleware`
- **Immutable ledgers** — triggers block `UPDATE` / `DELETE` on `wallet_ledger_entries`, `credit_ledger_entries`, `subscription_events`
- **Views set `security_invoker=on`** so `v_wallet_balances` / `v_credit_balances` respect the caller's RLS
- **Public API prefix `/api/public/*`** — bypasses auth; handler MUST verify signature/secret

## Digital Human runtime

- `HappyAvatar.tsx` — portrait SVG with amplitude/expression/blink/gaze
- `audio-bus.ts` — shared `useSyncExternalStore` bus for `speech` and `mic` `{rms, centroid}`
- `useHappySpeech.ts` — TTS → GainNode → AnalyserNode → destination + 60Hz RAF publishes RMS to bus
- `useVoiceInput.ts` — mic VAD, publishes RMS to bus
- `renderers/index.ts` — registry: `portrait`, `layered-portrait` ready; `live2d`, `live3d` throw `BLOCKED_ASSET_REQUIRED`
- `DigitalHumanContext.tsx` — merges OS `prefers-reduced-motion` into prefs
- `dhSpeak` (`digital-human-v1.functions.ts`) — multi-turn tool loop against `HAPPY_TOOLS` (see `happy-tools.server.ts`) using `google/gemini-2.5-flash` via Lovable AI Gateway
- Tool `client_actions` executed on `/digital-human` (navigate / invalidate / toast) with 250ms buffer for speech tail

## HAPPY tools

Registered in `src/lib/happy-tools.server.ts`:
`platform_overview`, `platform_health`, `queue_stats`, `deployment_stats`, `security_summary`, `unread_notifications_count`, `list_notifications`, `mark_all_notifications_read`, `open_route`. All execute under caller's RLS.

## Notification runtime

- Storage: `notifications` table + realtime via `postgres_changes` on `user_id`
- Delivery: in-app only (working). Email/SMS/push transports NOT implemented.
- Preferences: `notification_preferences` (kind × channel — `in_app`/`email`/`push`)
- Server API: `src/lib/notification-center.functions.ts` — all `requireSupabaseAuth`

## Financial runtime

See `docs/architecture/financial-foundation.md`. Ledger-first: state derives from immutable append-only entries; provider-agnostic (`subscriptions.provider`, `wallet_ledger_entries.metadata.provider`).

## SEO / PWA

- Per-route `head()` sets unique title/description/OG/Twitter
- `og:image` only at leaf routes with a real image (never `__root`)
- JSON-LD (Organization + WebSite) in root head
- PWA: `public/manifest.webmanifest`, apple-touch-icon; **no service worker** (intentional)
