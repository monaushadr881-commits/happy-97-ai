# HAPPY — MASTER DEPENDENCIES

**Version:** 1.0 · Map of what blocks what. Read alongside
`MASTER_IMPLEMENTATION_BACKLOG.md`.

Format: `<downstream>  ⟵  <upstream it depends on>`. A module cannot
reach WORKING until every upstream is at least PARTIAL with the required
surface exposed.

## 1. Foundation (already WORKING)

- Auth (15.1)  ⟵  Supabase Auth (managed)
- RBAC (15.2)  ⟵  `user_roles` + `has_role()`
- RLS + GRANTs (15.3)  ⟵  Every migration
- Security headers (15.4)  ⟵  `src/start.ts` `requestMiddleware`
- Bearer attacher  ⟵  `src/start.ts` `functionMiddleware`

Everything below assumes the foundation stays WORKING.

## 2. HAPPY Core dependencies

- Brain kernel (1.2)  ⟵  Memory (1.11), AI gateway
- Digital Human tool loop (1.6)  ⟵  `happy-tools.server.ts`, Auth, RLS
- Expression FSM (1.7)  ⟵  1.6, sentiment signal
- Mouth shapes A/E/O/U (1.8)  ⟵  Live2D (1.9) OR Live3D (1.10)
- Live2D runtime (1.9)  ⟵  **BLOCKED** on Cubism SDK licence + assets
- Live3D runtime (1.10)  ⟵  **BLOCKED** on rigged `happy.glb` + env.hdr
- Memory (1.11)  ⟵  `memory_items` schema (missing)
- Knowledge (1.12)  ⟵  index storage + Brain (1.2)
- Skills/Plugins/Agents runtime (1.17)  ⟵  Brain (1.2), sandbox

## 3. Revenue + Financial dependencies

- Payment providers (3.9)  ⟵  Provider secrets, `/api/public/webhooks/*`, HMAC helper (15.6)
- GST engine (3.8)  ⟵  HSN/SAC dataset, GSTIN validator
- Customer billing portal (3.10)  ⟵  3.5, 3.6, 3.7
- Coupons (3.11)  ⟵  Schema addition
- Payouts/Affiliate/Agency (3.12)  ⟵  3.9, split ledger schema

## 4. Notification dependencies

- Email (4.4)  ⟵  Provider (Resend/SES), template renderer, suppression list
- SMS (4.5)  ⟵  Provider, opt-in schema
- Push web/native (4.6)  ⟵  VAPID keys, APNs cert, FCM key
- Templates/Automation (4.7)  ⟵  Template schema + scheduler

## 5. Business OS dependencies

- Business OS shell (5.1)  ⟵  Company context (WORKING)
- CRM (5.2)  ⟵  5.1, existing CRM tables
- ERP / HRMS / Manufacturing / Warehouse (5.3–5.7)  ⟵  5.1, dedicated schemas
- POS (5.8)  ⟵  Inventory (5.7), Commerce (5.13)
- Business Analytics (5.11)  ⟵  Analytics service + per-module data
- Business Automation (5.12)  ⟵  Trigger runtime + Skills runtime (1.17)
- Commerce (5.13)  ⟵  Payment providers (3.9), Inventory (5.7)
- Customer360 (5.14)  ⟵  CRM (5.2), Notifications (§4)
- Banking (5.15)  ⟵  Banking provider link

## 6. Cloud / DevOps dependencies

- Deployments (6.2)  ⟵  Deployment provider credentials
- Developer Platform (6.3)  ⟵  API keys schema, docs generator
- Domains/Hosting (6.4)  ⟵  Registrar API, DNS provider
- Observability (6.5)  ⟵  Log/metric ingest endpoint
- Connectors (6.7)  ⟵  Credential vault

## 7. Creator / Builders dependencies

- Website Builder (7.2)  ⟵  Page schema, SSR renderer, Deployments (6.2)
- App Builder (7.3)  ⟵  7.2, component library
- PWA build (7.4)  ⟵  7.2
- Android (7.5) / iOS (7.6)  ⟵  7.2/7.3 + Capacitor wrappers + store creds
- Desktop (7.7)  ⟵  Tauri/Electron wrapper
- White-label (7.8)  ⟵  Tenant model + Domains (6.4)

## 8. Marketplace / Plugins dependencies

- Marketplace pipeline (8.1)  ⟵  Review queue, Payments (3.9), signing keys
- Plugins runtime (8.2)  ⟵  Sandbox executor, Skills runtime (1.17)
- Templates library (8.3)  ⟵  Template schema + Website Builder (7.2)
- Enterprise CMS (8.6)  ⟵  Content schema + Auth roles

## 9. Education / Libraries dependencies

- Razvi Academy (9.1)  ⟵  Content model, progress tables
- Digital Library (9.2)  ⟵  9.1, storage
- H.P Library (9.3)  ⟵  Inventory schema, membership schema
- Coach / Achievements / Streaks (9.4)  ⟵  Event stream + Notifications

## 10. Governance / Security dependencies

- Rate limiting (15.5)  ⟵  Edge counter store (KV/Redis)
- Webhook helpers (15.6)  ⟵  none — pure code
- Trust/Governance pages (15.7)  ⟵  Policy content
- SSO/SAML (15.8)  ⟵  Auth provider config, IdP metadata

## 11. Cross-cutting

- Playwright auth verification (18.2)  ⟵  Live preview Supabase session
- Accessibility sweep (18.3)  ⟵  none — engineering time
- Monitoring/Logging (18.6)  ⟵  6.5
- CI pipeline (18.7)  ⟵  Repo hosting CI config
- Performance budgets (18.8)  ⟵  Monitoring (6.5) or Lighthouse CI

## 12. External / Vendor blockers (single list)

- Cubism Live2D SDK licence + model → 1.8, 1.9
- Rigged `happy.glb` + env.hdr → 1.8, 1.10
- Payment provider accounts + secrets → 3.9 (and downstream 3.10/3.11/3.12, 5.13, 8.1)
- Email provider (Resend/SES) API key → 4.4
- SMS provider API key → 4.5
- Push credentials (VAPID/APNs/FCM) → 4.6
- Deployment provider credentials → 6.2
- Domain registrar + DNS provider → 6.4
- Store credentials (Play/App Store) → 7.5, 7.6
- Edge KV/Redis (rate limit store) → 15.5
- Live preview auth session (sandbox) → 18.2

Anything in this list without credentials remains **BLOCKED**, per
`MASTER_CONSTITUTION.md` §3 and §9.
