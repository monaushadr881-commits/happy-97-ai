# HAPPY Presence Engine (HPE) v1.0

Expansion-only, adds a Living AI experience on top of HAPPY without modifying
Architecture, Database, RBAC, Security, Business Logic, Credits, Pricing,
Notification Platform, Authentication, Digital Human Identity, Design System,
Services or existing APIs.

## Tables (new, RLS + GRANTs)
- `happy_presence_sessions` — one row per (user, session_key); heartbeat + state.
- `happy_relationship_prefs` — one row per user; tone/language/theme/etc.
- `happy_language_profile` — auto-detected language + confidence + samples.
- `happy_live_events` — append-only stream (context updates, activity).
- `happy_proactive_messages` — HAPPY-initiated messages (rate-limited 1/min/kind).
- `happy_founder_briefs` — morning/evening/night briefings.

All tables: user-scoped via `auth.uid()`, admin fallback via `has_role`.
Live events + founder briefs are append-only (trigger-enforced).

## Server functions (`src/lib/happy-presence/`)
- `presence-engine.functions.ts` — `upsertPresence`, `heartbeat`, `goOffline`, `getMyPresence`.
- `live-context.functions.ts` — `recordContext`, `getCurrentContext`, `listRecentEvents`.
- `relationship.functions.ts` — `get/update/reset/exportRelationship`.
- `language-engine.functions.ts` — `detectAndRecordLanguage`, `getLanguageProfile`.
- `proactive-ai.functions.ts` — `scheduleProactive`, `listProactive`, `markProactiveSeen`.
- `live-notification.functions.ts` — `humanNotification`.
- `founder-briefing.functions.ts` — `generateBrief`, `listBriefs`.
- `presence-dashboard.functions.ts` — admin-only aggregator.

All server functions require Supabase auth. Admin-only endpoints call `requireHpeAdmin` (`has_role('admin')`).

## Routes (`/live/*`)
`dashboard`, `presence`, `context`, `relationship`, `activity`, `language`,
`home`, `founder`, `settings`, plus `route.tsx` layout and `index.tsx` redirect.
All under `_authenticated/` so the existing auth gate applies.

## Language engine
Script-based heuristic detector for 22 languages incl. Hindi, English, Hinglish,
Urdu, Arabic, French, Spanish, German, Russian, Chinese, Japanese, Korean,
Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Bangla, Odia,
Assamese. Zero external dependencies. Never modifies existing NLU.

## Relationship engine
Stores tone, greeting style, working hours, favorites, theme, voice,
notification style, writing style. Users can reset, export, or disable
personalization from the Relationship tab.

## Proactive AI
1-message-per-kind-per-minute rate limit prevents spam. Messages are
user-scoped and never bypass consent (`personalization_enabled`).

## Founder AI
Aggregates release/build/rollout signals into brief documents (morning,
evening, night, weekly, monthly, revenue, health, security, competitor,
tasks, deployment, release, notification summary). Missing tables degrade
gracefully — briefs still emit with best-effort data.

## Realtime
Reuses Supabase Realtime infrastructure (see `cloud-realtime`). Frontend
polling (10–30s) is used on the shell; long-lived Realtime subscriptions
can be layered without schema change.

## Security
- No new auth surface. All routes are under `_authenticated/`.
- RLS: users see only their own rows; admins can read all via `has_role`.
- No secrets required. LOVABLE_AI_GATEWAY is available for future
  generative brief expansion.

## Performance
- Heartbeat interval: 25s. Stale threshold: 90s.
- Dashboard refetch: 15s.
- Server functions cast `sb: any` to keep TS inference cheap.
- No blocking calls in loaders — every read runs in `useQuery`.

## Responsive
Every Live surface uses `Container` + tab bar with `flex flex-wrap` and
grid columns that collapse on mobile. StatCards degrade to 2 columns.

## Accessibility
- Semantic `<nav aria-label>` on the tab bar.
- All controls keyboard-reachable; native inputs/buttons.
- No motion added; reduced-motion safe.

## Deployment
No new secrets, no new cron jobs, no new external services. Ship with the
migration and route additions. Existing RBAC, credits, notification and
Digital Human systems are unchanged.
