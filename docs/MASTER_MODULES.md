# HAPPY — Master Modules

Every product surface, grouped. Route counts and file names are authoritative; status is a pointer — read `MASTER_STATUS.md` for shipping state.

## 1. HAPPY Core (AI • Brain • OS • Digital Human)

- **HAPPY AI / Assistant** — `/assistant`, `src/lib/happyx-chat.functions.ts`
- **HAPPY Brain** — `/brain*` (10 routes), `src/lib/brain-v3.functions.ts`, `brain-v4.functions.ts`
- **HAPPY OS (unified surface)** — `/unified-os`, `src/lib/unified-os-v12.functions.ts`
- **Digital Human** — `/digital-human*` (8 routes) + `src/components/digital-human/*` + `src/lib/digital-human-v1.functions.ts` + `src/routes/api/dh.tts.ts` + `src/lib/happy-tools.server.ts`
- **Memory Engine** — `/memory*` (5 routes)
- **Knowledge Engine** — `/knowledge*` (7 routes), `src/lib/*knowledge*`, `knowledge-*-v*.functions.ts`
- **Conversation / Voice Engine** — `useHappySpeech`, `useVoiceInput`, `audio-bus.ts`
- **Skills / Plugins / Tools / Agents** — `/skills*`, `/plugins*`, `/tools*`, `/agents*` (20+ routes)

## 2. Founder Command Center

- **Founder Dashboard** — `/founder` (index), `src/routes/_authenticated/founder.index.tsx`, `src/lib/founder-v2.functions.ts`
- **Sub-pages** — `/founder/{users,companies,ops,security,analytics,ai,system}`

## 3. Revenue Cloud + Financial Foundation

- **Billing / Invoices / Transactions** — `/billing`, `revenue.service.ts`, `revenue-v1.functions.ts`
- **Plans, Subscriptions, Wallet, Credits** — `financial.service.ts`, `financial-v1.functions.ts`
- **Banking / Payments** — `/banking`, `/payments`, `banking-v7.functions.ts`, `payments-v7.functions.ts`

## 4. Notification Platform

- **Inbox / Preferences / Categories / History / Archive / Analytics / Reminders / Announcements / Templates / Automation** — `notifications*.tsx` (12 routes) + `src/lib/notification-center.functions.ts`

## 5. Enterprise Business OS (Business apps)

- CRM, ERP, HRMS, Finance, Manufacturing, Warehouse, Inventory, Purchase, Sales, Projects, Analytics, Automation, AI — `/business*` (14 routes), `business-v1.functions.ts`
- Customers, Vendors, Suppliers, Partners, Employees, Workforce, Investors, Dealers, Distributors — dedicated routes each
- POS / Commerce — `/commerce`, `commerce-v7.functions.ts`
- Ecosystem / Enterprise Structure / Governance — `/enterprise*` (11 routes)

## 6. Cloud / Developer / DevOps

- Cloud Platform — `/cloud*` (9 routes), `cloud-v4.functions.ts`, `cloud-v5.functions.ts`
- Deployments — `/deploy`, `deployment-v1/v5.functions.ts`
- Developer Platform — `/developer*` (5 routes), APIs / SDK / Docs / Webhooks
- Domains / Hosting — `/domains*`, `/hosting`
- Observability / Monitoring / Logging — `/observability*`, `/monitoring`, `telemetry-v11.functions.ts`
- Service Mesh / Data Fabric / API Fabric / Connectors — corresponding routes + `-v1x.functions.ts`

## 7. Creator / Studio / Builder

- Studio — `/studio*` (10 routes), image/voice/copy/brand/marketing/presentation/exports
- Universal Builder — `/builder`, `builder-v1.functions.ts`
- Website / App Builder — `website-builder-v1.functions.ts`, `app-builder-v1.functions.ts`
- Themes / Wallpapers / Marketplace — `/themes`, `/theme-marketplace`, `/wallpaper-marketplace`, `settings-{theme,wallpapers,background,appearance}`

## 8. Marketplace + Plugins + Templates

- `/marketplace*` (5 routes), `/marketplace-hub`
- `/plugins*` (5 routes) — `plugin-v2.functions.ts`, `plugin-market-v2.functions.ts`, `plugin-runtime-v3.functions.ts`
- `/templates`

## 9. Education (Razvi Academy)

- `/education*` (13 routes) — Library, My, Tutor, Notes, Plans, Flashcards, Certificates, Exams, Search, Analytics, Creator
- `/coach`, `/achievements`, `/streaks`

## 10. Community / Content / Media

- `/community*` (4 routes), `/messages*`, `/collaboration`, `/content`, `/documents`, `/assets`

## 11. Hyperlocal OS

- `/hyperlocal*` (10 routes) — Discover, Alerts, Ask, Businesses, Events, Jobs, Manage, Map, Settings

## 12. Government / Healthcare / Public Sector

- `/government`, `/citizens`, `/national`, `/smart-city`, `/public-safety`, `/public-health`, `/public-education`, `/rural`
- `/healthcare`, `/hospitals`, `/telemedicine`, `/pharmacy`, `/patients`, `/medical-research`, `/wellness`

## 13. Industrial / IoT / Robotics / Energy / Utilities / Transport

- `/industry`, `/factory`, `/manufacturing`, `/quality`, `/supply-chain`, `/energy`, `/utilities`, `/transport`, `/fleet`, `/iot*`, `/iot-runtime`, `/robotics`, `/robots`, `/devices`, `/edge`

## 14. Intelligence / Runtime / Autonomous / Decision / Simulation

- `/intelligence*` (13 routes), `/runtime*` (40+ routes), `/autonomous`, `/decision*`, `/simulation`, `/predictions`, `/vision`, `/multimodal`

## 15. Governance / Security / Identity / Compliance

- `/security`, `/identity`, `/governance*`, `/trust`, `/organizations`, `/roles` (RBAC via `user_roles`)
- Auth: `/auth`, `/login`, `/register`, `/forgot-password`, `/reset-password`

## 16. Settings / Personalization / Accessibility / Native

- `/settings*` (6 routes) — Theme, Appearance, Wallpapers, Background, Accessibility
- `/native`, `/widgets`, `/icons`, `/focus`, `/zen`, `/live-island`, `/live-3d`

## 17. Company / Business brand surfaces

- H.P PRIVATE LIMITED, H.P SHUDDH MASALE, AAS PAAS, Razvi Academy, H.P Library, Digital Library — surfaced via `companies` + `brands` tables and `/companies`, `/organizations`, `/business.crm`, `/education.library`.

## 18. Public routes (unauth)

`index`, `auth`, `login`, `register`, `forgot-password`, `reset-password`, `design`, `status`, `trust` + `/api/{robots.txt,sitemap.xml,dh.tts}` and `/api/public/v1/*`.

## Counts snapshot

- 391 `_authenticated` route files
- 20 domain services
- 233 `*.functions.ts` server-function modules
- 15 migrations
- 56 architecture cards
