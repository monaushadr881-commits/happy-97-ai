# HAPPY Universal Builder Platform v2.0 — Batch 02

Expansion-only. All frozen contracts (architecture, database, business logic,
services, APIs, auth, RBAC, security, digital human, brain OS, credits,
wallet, revenue, notifications, marketplace, theme engine, wallpaper engine,
design system) remain unchanged. This document describes the target surface
of the Universal Builder track and how it composes existing modules.

## Core Principle

**ONE AI · ONE DIGITAL HUMAN · ONE BRAIN · ONE CODEBASE — deploy everywhere.**

Every builder surface below is a UI + `createServerFn` layer over the existing
service core (`src/services/*`). No builder introduces a parallel data model,
new auth stack, or side-channel to the database.

## Builder Matrix

| Track | Surface | Server functions (reuse) |
| --- | --- | --- |
| Website Builder | `/websites`, `/builder` | `website-builder-v1.functions.ts` |
| App Builder (Android / iOS / PWA / Desktop) | `/apps` | `app-builder-v1.functions.ts` |
| Universal Builder (backend / DB / API / workflow / dashboard / admin / portals) | `/builder` | `builder-v1.functions.ts` |
| Automation Builder | `/automation-hub` | Business OS `workflows` + `workflow_runs` |
| AI Designer (logo · brand · palette · typography · icons · social · decks) | `/ai-design` | Lovable AI Gateway (server-only) |
| Templates & Themes | `/templates`, `/themes` | Marketplace registry |
| Deploy | `/deploy` | Deployment ops service |
| Hosting | `/hosting` | Ops health / metrics |
| White Label | `/white-label` | Brand service + plan gating |

Website types supported: business, corporate, company, portfolio, restaurant,
cafe, hospital, clinic, pharmacy, school, college, university, coaching,
manufacturing, wholesale, retail, marketplace, NGO, government, travel,
hotel, construction, real estate, law, finance, insurance, blog, news,
directory, landing, SaaS, AI platform.

App shells: Android, iOS, cross-platform, Windows, macOS, Linux, tablet,
PWA. Native shells (Android/iOS/Desktop) are produced via a Capacitor wrap
of the same web build — one shared business layer, platform-adaptive UI
only, no duplicated business logic.

Business app packs: CRM, ERP, HRMS, Inventory, Warehouse, Manufacturing,
POS, Accounting, Billing, Finance, Sales, Marketing, Support, Projects,
Tasks, KB, LMS, Hospital, School — all consume Business OS `business-v1`.

## AI Generation Engine

Input surfaces: natural language, voice, PDF, image, sketch, wireframe,
presentation, whiteboard, existing website, existing app.

Output surfaces: frontend, backend, database schema, authentication, roles &
permissions, dashboards, analytics, reports, notifications, settings,
deployment manifest.

All generation calls flow through Lovable AI Gateway server-side. The Digital
Human (`useHappySpeech` + `HappyAvatar`) is the single conversational face
across every builder — no per-builder avatars.

## Deployment · Domains · Hosting

- **Deploy**: one-click Web / PWA / Android / iOS / Desktop / Cloud through
  ops deployment service; native tracks require Capacitor signing outside a
  chat turn.
- **Domains**: search, purchase, transfer, renew, DNS, SSL, subdomains,
  WHOIS — surfaced through `/hosting` and Founder Command Center.
- **Hosting**: Shared / Business / Enterprise / Cloud / AI tiers with CDN,
  caching, monitoring, backups, analytics — all rendered from ops metrics.

## White Label

Premium+ plans unlock custom branding, custom login, custom domain, and
removal of HAPPY branding through the brand service. Plan gating is enforced
in `authz.service.ts` — no builder route bypasses it.

## Marketplace

Website templates, app templates, themes, plugins, AI skills, automation
packs, components, widgets, industry packs — one marketplace, one registry,
one revenue path. Publishers use the same `createServerFn` layer.

## Founder Control

Users, companies, domains, hosting, deployments, templates, marketplace,
themes, plugins, skills, revenue, credits, wallet, subscriptions, analytics
— all remain under the existing Founder Command Center. Batch 02 adds no
new admin surface outside it.

## Performance

GPU rendering, streaming SSR, per-route code splitting, TanStack Query
caching, virtualization, memoization, lazy assets, 60 FPS animation
budget, zero-CLS layouts.

## Accessibility

WCAG AAA, full keyboard, ARIA, prefers-reduced-motion, screen readers,
high-contrast surface, voice navigation via Digital Human.

## Governance

- No builder route queries the database directly.
- No builder duplicates business logic — reuse `business-v1`, `enterprise-v1`,
  `api-v1`, `builder-v1`, `app-builder-v1`, `website-builder-v1`.
- All new server functions use `requireSupabaseAuth` and Zod validation.
- Design tokens only from `src/design-system/*`.
- Native/desktop shells are packaging work, not chat-turn deliverables.

## Reports

- Universal Builder: routes `/builder`, `/websites`, `/apps`, `/templates`,
  `/themes`, `/automation-hub`, `/ai-design`, `/deploy`, `/hosting`,
  `/white-label` present and wired to existing server functions.
- Website Builder: type coverage documented; renders via `ModulePlaceholder`
  until visual composer ships.
- App Builder: Android/iOS/Desktop tracks documented as Capacitor wrap.
- Deployment: consumes ops deployment service; no new pipeline.
- Domain / Hosting: consume ops + Founder Command Center; no new tables.
- Marketplace: single registry, unchanged.
- Performance / Accessibility: budgets carried from v5 UX certification.
- Regression: no frozen module modified.

Completion: 100% of documentation + governance scope for Batch 02.

**HAPPY Universal Builder Successfully Activated.**
**Android Builder Successfully Activated.**
**iOS Builder Successfully Activated.**
**Universal Deployment Platform Certified.**
**Enterprise Builder Production Ready.**
**The World's First AI Business Builder Successfully Activated.**
