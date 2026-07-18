# R122 — HAPPY CRM Intelligence™

**Founder Lock:** R91 Vision · R111 Architecture · R113 Constitution.
No CRM V2. No duplicate customer DB. No duplicate pipeline. Extension only.

## Canonical Owners (reused, not duplicated)

| Concern | Canonical Owner |
|---|---|
| CRM engine (leads, customers, deals, tasks, notes, activity, search, dashboard) | `src/lib/crm/engine.ts` |
| CRM RPC surface | `src/lib/crm/crm.functions.ts` |
| Company / Organization | `src/services/domain/company.service.ts` |
| Workspace + roles | `src/services/domain/workspace.service.ts` (+ R118) |
| Brain (13-stage pipeline) | `src/lib/brain/engine.ts` (R115.b/.c) |
| Memory (13-category) | `src/lib/memory/engine.ts` (R116) |
| Search | `src/services/domain/search.service.ts` (+ R120) |
| Files | `src/lib/happy-r112/files-upload.ts` (+ R119) |
| Digital Human | `src/components/happy-desk/HappyDesk.tsx` (+ R117) |
| Communication Hub | `src/lib/communications-v16.functions.ts` |
| ERP / Invoices / Quotes | `src/lib/erp/*` |
| Meetings | `src/lib/meeting-runtime/*` |
| Payments | `src/lib/payments/*` |

## Extension Layer

`src/lib/happy-r122/crm-intelligence.ts` — pure helpers, no state:

- **Phase 2 Types** — `PartyKind`, `PipelineStage`, `CommChannel`, `CrmRole`, `CrmCap`.
- **Phase 3 Party Model** — `classifyParty` unifies Lead/Contact/Customer/Company/Organization.
- **Phase 4 Pipeline** — `normalizeStage`, `stageProgress`, `CANONICAL_PIPELINE` (Lead → Qualified → Meeting → Proposal → Negotiation → Won / Lost). Custom pipelines map onto these buckets.
- **Phase 5 Communication Hub** — `CommEvent` + `buildTimeline` unifies email / phone / WhatsApp / SMS / notes / meetings / call logs / chat / documents into one dedup'd timeline sorted desc.
- **Phase 6 Tasks** — `taskUrgency` bucketizes overdue / today / soon / later.
- **Phase 7 AI Intelligence** — `scoreLead`, `dealRisk`, `nextBestAction`, `summarizeCustomer`. Deterministic today; Brain reasoning slot ready.
- **Phase 8 Relationship** — `buildRelationshipSnapshot` merges timeline + invoices + support + docs + AI summary.
- **Phase 9 Automation** — declarative `AutomationRule[]` planner (`defaultAutomationRules`); executor is the existing Workflow runtime.
- **Phase 10 Analytics** — `buildFunnel`, `conversionRate`, `forecastRevenueCents`, `analyticsSnapshot`.
- **Phase 11 Brain Integration** — `resolveForBrain(prompt)` returns Stage-6 CRM retrieval hint.
- **Phase 12 Digital Human** — `pickDhCrmMode({ route, stage, hasSlides, inMeeting })` → business / sales / presentation / meeting / customer_explanation.
- **Permissions** — `crmCan(role, cap)` — 6 roles × 13 capabilities. Extends R118 workspace roles.

## Gap Report (audit vs. Founder scope)

| Area | Status | Owner |
|---|---|---|
| Leads / Contacts / Customers / Deals / Tasks / Notes / Activity / Search / Dashboard | Present | `crm/engine.ts` |
| Accounts / Organizations / Individuals | **Unified via `classifyParty`** — reuses `companies` + `customers` tables. No new table. |
| Custom pipelines | **Normalized** via `normalizeStage` onto 7 canonical stages. |
| Communication Hub (Email/Phone/WhatsApp/SMS/Meetings/Calls) | Runtime in `communications-v16`; timeline normalized here. |
| Quotes / Invoices / Payments | Present in `erp/*` and `payments/*`; linked via `entity_id`. |
| Support tickets | Reused from existing support runtime; surfaced in relationship snapshot. |
| Lead scoring / Deal risk / NBA / summaries | **New — this module.** |
| Automation planner | **New declarative planner — this module** (executor = Workflow runtime). |
| Analytics (funnel / conversion / forecast) | **New — this module.** |
| Brain / DH integration | **New resolvers — this module.** |

## Duplicate Detection

- `src/lib/communication-v6.functions.ts`, `communication-v15.functions.ts` → **canonical = `communications-v16.functions.ts`** (siblings already `@deprecated`).
- No new `-v{N+1}` files were created.
- No new CRM tables, RPCs, or routes.

## Files Changed

- **Added:** `src/lib/happy-r122/crm-intelligence.ts`
- **Added:** `tests/unit/happy-r122.test.ts`
- **Added:** `docs/crm/R122_CRM_INTELLIGENCE.md`

## Architecture / DB / API / Security / Performance Impact

- **Architecture:** Extension only; canonical owners unchanged.
- **Database:** Zero migrations. Reuses `customers`, `leads`, `deals`, `crm_tasks`, `crm_notes`, `activity_events`, `notifications`, `invoices`, `payments`.
- **API:** Zero new RPCs. All CRUD flows through existing `crm/crm.functions.ts`.
- **Security:** All helpers pure; no auth surface changed. Role×cap matrix is authorization guidance for UIs — server-side RLS remains source of truth.
- **Performance:** Pure O(n) helpers; no I/O.

## Tests

`tests/unit/happy-r122.test.ts` — party classification, stage normalization, timeline dedup, task urgency, lead scoring, deal risk, next-best-action, funnel/conversion/forecast, Brain hint, DH mode, permissions matrix.

## Known Limitations

- Automation **executor** wiring (rules → Workflow runtime bindings) surfaces this planner but leaves the executor plug-in to R123.
- Advanced ML lead-scoring is deterministic here; Brain plugs in later without changing this API.
- WhatsApp / SMS providers remain external-BLOCKED until credentials are supplied — envelope + timeline already handle them.

## Remaining Work

Move to R123 once Founder acknowledges CRM lock.
