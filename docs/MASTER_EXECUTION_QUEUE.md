# HAPPY — MASTER EXECUTION QUEUE

**Version:** 1.0 · Ordered work queue. Implement top-down. One module
at a time. Verify + document each before moving on.

Governed by `MASTER_CONSTITUTION.md` and `MASTER_RELEASE_POLICY.md`.
Every completed item requires the four doc updates in Constitution §8.

## Rules

1. Implement ONLY from this queue. No new roadmap expansion until the
   queue is reduced.
2. Complete one item → verify → update `MASTER_STATUS.md`,
   `MASTER_IMPLEMENTATION_STATUS.md`, `MASTER_FEATURES.md`,
   `MASTER_AUDITS.md` → then start the next.
3. If an item becomes BLOCKED mid-flight, record the exact external
   dependency in `MASTER_DEPENDENCIES.md` §12 and skip to the next
   unblocked item.

## P0 — Certify what already ships

Prevent regressions before adding surface.

| # | Item | Why now | Verify |
|---|---|---|---|
| P0.1 | Regression suite for Founder + Notifications + Revenue + Financial + DH-core | Locks R1–R6 certifications | Typecheck + Playwright (once session available) |
| P0.2 | Webhook HMAC + replay-guard helper (15.6) | Prerequisite for every provider integration | Unit tests |
| P0.3 | Rate limiting middleware (15.5) | Required before public webhooks/APIs | Load test |
| P0.4 | Payment provider adapters — Stripe first (3.9) | Unblocks Commerce, Marketplace, Portal | Sandbox charge + webhook |
| P0.5 | Public webhook routes under `/api/public/webhooks/*` | Depends on P0.2, P0.4 | Signed test payload |

## P1 — Complete the Core

| # | Item | Depends on | Deliverable |
|---|---|---|---|
| P1.1 | Founder sub-pages re-audit (2.2) | — | Each sub-page reads real data |
| P1.2 | Founder Audit trail viewer (2.4) | — | `/founder/audit` reads `audit_events` |
| P1.3 | HAPPY Memory persistent store (1.11) | Schema | `memory_items` + recall in `dhSpeak` |
| P1.4 | Streaming chat + attachments for `/assistant` (1.1) | — | SSE stream, file input |
| P1.5 | Customer billing portal (3.10) | 3.5–3.7 | Self-serve invoice/sub/wallet |
| P1.6 | GST engine (3.8) | HSN dataset | Tax calc + GSTIN validation |
| P1.7 | Email delivery for Notifications (4.4) | Provider key | Verified email + suppression |
| P1.8 | CRM real UI (5.2) | Business shell WORKING | Leads/contacts/deals CRUD + pipeline |
| P1.9 | Deployments wired to provider (6.2) | Provider creds | Real deploy + rollback |
| P1.10 | Developer Platform — API keys + docs (6.3) | — | Key issuance + docs generator |
| P1.11 | Website Builder — page schema + SSR renderer + publish (7.2) | 6.2 | End-to-end publish flow |
| P1.12 | Marketplace pipeline (8.1) | 3.9 | Publish → approve → install → rate |
| P1.13 | Plugins sandbox runtime (8.2) | 1.17 | Execute plugin with capability grant |
| P1.14 | Accessibility sweep (18.3) | — | Full checklist across Founder/Billing/DH/Notifications |
| P1.15 | CI pipeline (18.7) | Repo host | Typecheck + lint + tests on PR |
| P1.16 | H.P PRIVATE LIMITED governance page (17.1) | — | Real org page |

## P2 — Business OS + Cloud + Personalization

| # | Item | Depends on |
|---|---|---|
| P2.1 | ERP orders (5.3) | 5.1 |
| P2.2 | HRMS payroll (5.4) | 5.1 |
| P2.3 | Finance GL (5.5) | 5.1 |
| P2.4 | Warehouse/Inventory (5.7) | 5.1 |
| P2.5 | Purchase/Sales (5.9) | 5.1 |
| P2.6 | Commerce storefront + checkout (5.13) | 3.9 |
| P2.7 | Customer360 UI (5.14) | 5.2 |
| P2.8 | Business Analytics dashboards (5.11) | per module |
| P2.9 | Business Automation triggers (5.12) | 1.17 |
| P2.10 | Cloud Platform resource inventory (6.1) | — |
| P2.11 | Domains + Hosting (6.4) | Registrar |
| P2.12 | Observability ingest + dashboards (6.5) | — |
| P2.13 | Connectors runtime (6.7) | — |
| P2.14 | Studio real generators (7.1) | AI gateway |
| P2.15 | White-label tenant theming (7.8) | 6.4 |
| P2.16 | Theme + Wallpaper marketplaces (8.4, 8.5) | 8.1 |
| P2.17 | Enterprise CMS (8.6) | — |
| P2.18 | Razvi Academy content + progress (9.1) | — |
| P2.19 | Trust/Governance/Compliance pages (15.7) | Policy content |
| P2.20 | Settings persist per-user + org (16.1) | — |
| P2.21 | Runtime engine wired to Brain (14.1) | 1.2 |
| P2.22 | Notification Templates + Automation (4.7) | 4.4 |
| P2.23 | Coupons / promo engine (3.11) | 3.9 |
| P2.24 | Marketplace payouts / Affiliate / Agency (3.12) | 3.9 |
| P2.25 | Digital Human emotion FSM (1.7) | 1.6 |
| P2.26 | Knowledge Engine retrieval (1.12) | 1.11 |
| P2.27 | Conversation persistence + realtime sync (1.13) | — |
| P2.28 | Whiteboard persistence + presence (1.16) | — |
| P2.29 | App Builder (7.3) | 7.2 |
| P2.30 | PWA build per site (7.4) | 7.2 |
| P2.31 | H.P SHUDDH MASALE catalog (17.2) | 5.13 |
| P2.32 | Monitoring/Logging (18.6) | 6.5 |
| P2.33 | Performance budgets (18.8) | 18.6 |

## P3 — Extended surface

| # | Item |
|---|---|
| P3.1 | Presentation generator (1.15) |
| P3.2 | Voice provider fallback + language matrix (1.14) |
| P3.3 | SMS delivery (4.5) |
| P3.4 | Push delivery web + native (4.6) |
| P3.5 | Manufacturing MRP (5.6) |
| P3.6 | POS register (5.8) |
| P3.7 | Projects module (5.10) |
| P3.8 | Banking reconciliation (5.15) |
| P3.9 | Partners/Vendors/Suppliers/Dealers/Distributors/Investors (5.16) |
| P3.10 | Workforce ops UI (5.17) |
| P3.11 | Hyperlocal geo + local content (11.1) |
| P3.12 | AAS PAAS storefront (11.2, 17.3) |
| P3.13 | Digital Library + H.P Library (9.2, 9.3, 17.5) |
| P3.14 | Coach / Achievements / Streaks event stream (9.4) |
| P3.15 | Community / Messages / Collaboration / Documents / Assets (§10) |
| P3.16 | Autonomous / Decision / Simulation / Predictions / Vision / Multimodal (14.2) |
| P3.17 | SSO / SAML (15.8) |
| P3.18 | Native shells + widgets (16.2) |
| P3.19 | Android build (7.5) |
| P3.20 | iOS build (7.6) |

## P4 — Vertical + Infra long-tail

| # | Item |
|---|---|
| P4.1 | Government / Citizens / National / Smart City / Public Safety / Public Health / Public Education / Rural (12.1) |
| P4.2 | Healthcare / Hospitals / Telemedicine / Pharmacy / Patients / Medical Research / Wellness (12.2) |
| P4.3 | Industry / Factory / Manufacturing / Quality / Supply Chain (13.1) |
| P4.4 | Energy / Utilities / Transport / Fleet (13.2) |
| P4.5 | IoT / Edge / Devices / Robotics / Robots (13.3) |
| P4.6 | Service Mesh / Data Fabric / API Fabric (6.6) |
| P4.7 | Desktop builds — Windows / macOS / Linux (7.7) |

## Blocked (external only)

Kept visible so nothing "disappears".

| # | Item | Unblocker |
|---|---|---|
| B.1 | Live2D runtime (1.9) | Cubism SDK licence + assets |
| B.2 | Live3D runtime (1.10) | Rigged `happy.glb` + env.hdr |
| B.3 | Playwright authenticated verification (18.2) | Live preview Supabase session |

## Working queue rule

At any moment the "current focus" is the **lowest-numbered non-BLOCKED,
non-WORKING** item in this file. If a Founder request overrides that
order, the override MUST be recorded as a new round in
`MASTER_AUDITS.md` with rationale.
