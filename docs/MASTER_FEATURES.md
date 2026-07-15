# HAPPY — Master Features

Feature inventory grouped by product surface. Each item is either **implemented** (source pointer), **scaffolded** (route exists but placeholder), or **spec-only** (architecture doc, no runtime).

## Digital Human

Implemented: portrait avatar, blink, gaze, drift, breathing halo, TTS pipeline, dictation/VAD, RMS→amplitude lip signal, live waveform (speech + mic), SVG eyelids, mouth-shape variation via centroid (overlay), 12-token expression blend, greeting on first mount, shared audio bus, `prefers-reduced-motion` respect, SR live-region announcer, tool-calling loop (`dhSpeak` + 9 HAPPY tools + client_actions), presentation/whiteboard/classroom/boardroom routes, settings, sessions.
Blocked: Live2D, Live3D (see BLOCKED assets in `MASTER_STATUS.md`).
Missing: face rig (visemes/phonemes/mesh morph), emotion state machine, hand/gesture rig, master RAF scheduler.

## Founder Command Center

Implemented: real Supabase counts (users, companies, workspaces), live ops (health, queue, deploys, security, audit), revenue tiles (MRR 30d, ARR est., Payments 30d, Refunds 30d, Open/Overdue invoices), financial tiles (Wallet Volume, Credits Outstanding, Active Subs, Trials, Renewals 30d).
Scaffolded: `/founder/{users,companies,ops,security,analytics,ai,system}` sub-pages (legacy).

## Notification Platform

Implemented: inbox, filters (all/unread/read), category sidebar with per-kind counts, mark read/unread/all, delete, unread badge, realtime via `postgres_changes`, ARIA live region, keyboard-operable buttons, preferences (kind × channel), dev-only sample seeder.
Missing: email/SMS/push transports, delivery runtime, templates engine (routes exist), automation runtime.

## Revenue Cloud

Implemented: invoices table, payments/transactions table, MRR/ARR (30d/365d), refunds, timeseries + sparkline, per-invoice tax display.
Missing: tax engine (GST/VAT), Stripe/Paddle/Razorpay/Cashfree/PayPal adapters, webhooks (`/api/public/webhooks/*`), customer billing portal.

## Financial Foundation

Implemented: plans catalog (5 seeded tiers), subscriptions + immutable `subscription_events`, wallet + immutable `wallet_ledger_entries`, credits ledger with expiry, balance views (`v_wallet_balances`, `v_credit_balances`), auto-provision user wallet, provider-agnostic model.
Missing: provider adapters, coupons/promo engine.

## Enterprise Business OS

Scaffolded: `/business.{crm,erp,hr,finance,inventory,manufacturing,warehouse,purchase,sales,projects,analytics,automation,ai,search}`. Tables exist; UIs are `V2TabBody`.
Note: full modules (POS, GST, e-invoicing, HRMS payroll, MRP) all MISSING.

## Cloud / DevOps

Scaffolded: `/cloud.{projects,deployments,storage,models,billing,marketplace,analytics,compliance}`, `/deploy`, `/observability`, `/monitoring`, `/service-mesh`, `/api-fabric`, `/data-fabric`, `/connectors`, `/hosting`, `/domains`, `/edge`, `/iot-runtime`.
Missing: real infra, actual multi-region, cost engine.

## Creator / Studio / Builder

Scaffolded: `/studio.{index,image,voice,copy,brand,marketing,presentation,exports,projects,assets}`, `/builder`, `/websites`, `/apps`, `/native`, `/white-label`, `/themes`, `/theme-marketplace`, `/wallpaper-marketplace`.
Missing: real generators, build pipelines, publish workflows.

## Marketplace + Plugins + Templates

Scaffolded: `/marketplace.{index,orders,sales,seller}`, `/plugins.{store,installed,manage,reviews,settings}`, `/skills.{store,installed,categories,settings}`, `/templates`.
Missing: publish → review → approve → install → rate pipeline, scanner, signing.

## Education (Razvi Academy / H.P Library)

Scaffolded: `/education.{index,library,my,tutor,notes,plans,flashcards,certificates,exams,search,analytics,creator}`, `/coach`, `/achievements`, `/streaks`.
Backing tables: `courses`, `lessons`, `assignments`, `quizzes`, `certificates`, study_*. UI wiring pending.

## Community / Content

Scaffolded: `/community.{index,mine,groups,following}`, `/messages`, `/collaboration`, `/content`, `/documents`, `/assets`.

## Hyperlocal OS (AAS PAAS)

Scaffolded: `/hyperlocal.{index,discover,ask,alerts,businesses,events,jobs,manage,map,settings}`. Backing tables `hl_*` exist. UI queries pending.

## Government / Healthcare / Public Sector

Scaffolded: `/government`, `/citizens`, `/national`, `/smart-city`, `/public-safety`, `/public-health`, `/public-education`, `/rural`; `/healthcare`, `/hospitals`, `/telemedicine`, `/pharmacy`, `/patients`, `/medical-research`, `/wellness`.

## Industrial / IoT / Robotics / Energy

Scaffolded: `/industry`, `/factory`, `/manufacturing`, `/quality`, `/supply-chain`, `/energy`, `/utilities`, `/transport`, `/fleet`, `/iot`, `/robotics`, `/robots`, `/devices`, `/edge`.

## Intelligence / Runtime / Autonomous

Scaffolded: `/intelligence.*` (13), `/runtime.*` (40+), `/autonomous`, `/decision.*`, `/simulation`, `/predictions`, `/vision`, `/multimodal`.

## Governance / Security / Identity

Implemented: RLS, roles via `user_roles` + `has_role()`, security headers, audit_logs, consents, data_requests.
Scaffolded: `/security`, `/identity`, `/governance`, `/trust`, `/organizations`.
Missing: SSO/SAML, SCIM, rate limiting, webhook signing helpers.

## Settings / Personalization / Native

Implemented: theme/appearance/wallpaper/background settings scaffolds, `prefers-reduced-motion` propagation, accessibility settings route.
Scaffolded: `/native`, `/widgets`, `/icons`, `/focus`, `/zen`, `/live-island`.

## SEO / PWA / Public

Implemented: robots.txt, sitemap.xml, JSON-LD (Organization + WebSite), per-route heads, PWA manifest, apple-touch-icon.
Missing: service worker/offline, dynamic OG image generator.

## Company brands (surfaced)

H.P PRIVATE LIMITED, H.P SHUDDH MASALE, AAS PAAS (Hyperlocal), Razvi Academy (Education), H.P Library (Knowledge), Digital Library — tenanted via `companies` + `brands` tables.
