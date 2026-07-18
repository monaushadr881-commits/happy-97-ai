# FOUNDER GAP MASTER LIST — R133

**Status:** Official execution plan for 100% Founder Vision completion.
**Source of truth:** `docs/MASTER_AUDIT_R132.md`.
**Rule:** Extend canonical owners only. No V2, no new runtimes, no duplicate builders/brain/memory/workspace/search.
**Scope of this document:** Planning only. No code changes in this pass.

---

## 0. Evidence Ledger (verified 2026-07-18)

| Metric | Value |
|---|---:|
| Extension rings (`happy-rNNN/`) | 22 |
| Versioned siblings (`*-v{N}.functions.ts`) | 224 |
| Route files (authenticated) | 481 |
| Routes using `ModulePlaceholder` / `V2TabBody` | **261** |
| Server functions | 348 |
| Supabase tables | 315 |
| Migrations | 64 |
| Unit tests pass / total | 617 / 627 |
| Failing tests | 10 (4 files: r94, r95, r96, r126) |

---

## 1. Master Gap List

Format: `ID · Priority · Module · Feature · Reason · Current Status · Required Work · Impact · Canonical Owner · Evidence`.

### Priority 1 — Critical (blocks "production ready")

| ID | Module | Feature | Reason | Status | Required Work | Impact | Canonical Owner | Evidence |
|---|---|---|---|---|---|---|---|---|
| P1-01 | Test Health | 10 failing unit tests | Regex + fetch/SSE mock drift after R94–R96 hardening | FAILING | Fix mocks + creator regex (see §4) | Unblocks "green build" claim | `tests/unit/happy-r94/95/96/126.test.ts` | vitest run |
| P1-02 | UI Coverage | 261 placeholder routes | `ModulePlaceholder`/`V2TabBody` still shipped as pages | PARTIAL | Replace with real screens tied to canonical services (see §6) | Removes "logic-only" gap | `src/routes/_authenticated/**` | `grep` count 261 |
| P1-03 | Architecture | 224 versioned siblings | R111 lock forbids new versions; existing debt must be consolidated | HIGH DEBT | KEEP/MERGE/SHIM classification (see §5) | Cuts maintenance surface | `src/lib/*-v{N}.functions.ts` | ls count |
| P1-04 | Files | Universal Import/Export | No generic exporter/importer | MISSING | Extend `happy-r112/files-upload.ts` with import + export adapters | Founder vision item | `src/lib/happy-r112/*` | R132 §F |
| P1-05 | Search | Semantic vector backing | Only FTS present; no `pgvector` column/index | PARTIAL | Add `embedding vector(1536)` on `memory_items`, `kg_entities`, `cms_contents`, `knowledge_articles`; extend `search.service.ts` hybrid ranker | Fulfils "Semantic Search" | `services/domain/search.service.ts` + R120 | R132 §F |
| P1-06 | Founder Dashboard | UI shell | Logic complete, screens placeholder-heavy | PARTIAL | Bind R130 helpers into `/founder/*` routes (real cards, trend charts, briefing feed) | Signature founder experience | `src/lib/happy-r130/*`, `src/routes/_authenticated/founder/*` | R132 §B |
| P1-07 | Brain | UI surface | `/brain` uses `V2TabBody` | PARTIAL | Real inspector: pipeline stages, last runs, confidence, mode picker | Makes 13-stage pipeline visible | `src/lib/brain/engine.ts` | route file |
| P1-08 | Digital Human | Animation clip binding | Walking / cinematic entry logic present, no clips wired | PARTIAL | Wire placeholder VRM clips + fallback IK sequence; keep real clips BLOCKED | Enables walk/entry without external asset | `HappyVRM.tsx` | R132 §C |

### Priority 2 — High (blocks "vision complete")

| ID | Module | Feature | Status | Required Work | Owner |
|---|---|---|---|---|---|
| P2-01 | Builders (10) | Full UI editors for Workflow / Database / API / Dashboard / Theme / Template | PARTIAL UI | Extend `app-builder` with 6 editor screens, no new runtime | `src/lib/app-builder/*` |
| P2-02 | CRM UI | Pipeline board, lead scoring surface, deal risk | PARTIAL | Real screens over R122 helpers | `happy-r122` + `deals/leads` |
| P2-03 | ERP UI | GL, journal entries, 3-way match, BOM explorer | PARTIAL | Real screens over R123 helpers | `happy-r123` |
| P2-04 | HRMS UI | Employee lifecycle, payroll, attrition dashboard | PARTIAL | Real screens over R124 helpers | `happy-r124` |
| P2-05 | Inventory UI | Bins, FEFO pick path, ROP/safety stock alerts | PARTIAL | Real screens over R125 helpers | `happy-r125` |
| P2-06 | Creator Studio UI | Timeline editor, subtitle editor, render queue, brand kit | PARTIAL | Real screens over R126 helpers | `happy-r126` |
| P2-07 | Revenue UI | Billing history, plan switcher w/ proration, refund window, invoices, tax preview | PARTIAL | Real screens over R128 helpers | `happy-r128` + `credits/subscriptions` |
| P2-08 | Enterprise Control UI | Org tree, RBAC editor, audit chain viewer, SLI/SLO board | PARTIAL | Real screens over R129 helpers | `happy-r129` |
| P2-09 | Files Runtime | OCR + Vision binding | STUB | Wire `AI Gateway` vision endpoint into R119 preview matrix | `happy-r119` |
| P2-10 | Registry | Level-2 modules / subsystems / 20k features not enumerated | MISSING enumeration | Extend `docs/founder/FOUNDER_REGISTRY.md` with L2 + subsystem + feature rows (scripted scan) | Founder Registry |
| P2-11 | AI Engines | 150+ target vs ~30–50 actual | PARTIAL | Enumerate engines under `src/brain/*`, `src/services/domain/*`, `src/lib/happy-r*` and register formally | Founder Registry |
| P2-12 | Roles | 50+ vs 6 seeded | PARTIAL | Seed 44+ additional roles into `roles` table via migration + RBAC mapping | `roles`, `role_permissions` |

### Priority 3 — Medium (external, credential-gated)

| ID | Module | Feature | Status | Required Work | Owner |
|---|---|---|---|---|---|
| P3-01 | Communication | Email provider | BLOCKED | Wire Resend/SendGrid adapter once secret added; extend `notification.service.ts` | canonical notif |
| P3-02 | Communication | SMS provider | BLOCKED | Twilio adapter | canonical notif |
| P3-03 | Communication | WhatsApp | BLOCKED | WA Cloud API adapter | canonical notif |
| P3-04 | Communication | Push (web/native) | BLOCKED | Web Push + FCM/APNs adapters | canonical notif |
| P3-05 | Revenue | Live Stripe/Paddle/Razorpay/Cashfree/PayPal | BLOCKED | Extend `payments/*` provider slots; verify webhooks route | `src/lib/payments/*` + `payment_webhook_events` |
| P3-06 | Platforms | Android build | BLOCKED | `cap add android` requires Android Studio | capacitor |
| P3-07 | Platforms | iOS build | BLOCKED | `cap add ios` requires Xcode | capacitor |
| P3-08 | Platforms | Desktop | BLOCKED | Tauri native toolchain | src-tauri |
| P3-09 | DH Assets | Real VRM anim clips + ElevenLabs voice | BLOCKED | Ingest supplied assets | HappyVRM |
| P3-10 | Live2D bridge | External SDK | BLOCKED | Adapter shell only | `happy-adapters` |

### Priority 4 — Low (polish & governance)

| ID | Item | Required Work |
|---|---|---|
| P4-01 | Retire `V2Module` component once all pages replaced | Delete after P1-02 completes |
| P4-02 | Registry auto-scan CI | Fail build when a module row lacks file/owner/test bindings |
| P4-03 | Remove dead versioned siblings after MERGE/SHIM (never delete before flag) | Follow §5 workflow |
| P4-04 | Legacy voice fallback test modernization | After P1-01 |
| P4-05 | Docs: unify `docs/architecture-lock/*` stubs into `MASTER_ARCHITECTURE.md` diagrams | Docs-only |

---

## 2. Implementation Order (Lowest Risk → Highest Impact)

Ring-based; each ring is safe to merge independently.

- **R134 — Test Green Restoration** · Fix P1-01. Tiny blast radius, unblocks CI signal.
- **R135 — Versioned Sibling Classification** · Execute §5 audit → KEEP/MERGE/SHIM labels only. Zero deletions.
- **R136 — Registry Enumeration Pass** · P2-10, P2-11, P2-12. Docs + one migration for roles.
- **R137 — Search Semantic Backing** · P1-05 migration + `search.service.ts` extension.
- **R138 — Files Import/Export + OCR/Vision** · P1-04, P2-09.
- **R139 — Founder Dashboard UI** · P1-06 (highest-visibility founder win).
- **R140 — Brain Inspector UI** · P1-07.
- **R141 — Business OS UI Pass (CRM/ERP/HRMS/Inventory)** · P2-02..P2-05.
- **R142 — Creator + Revenue + Enterprise UI Pass** · P2-06..P2-08.
- **R143 — Builder Editor Pass** · P2-01.
- **R144 — DH Animation Placeholder Clips** · P1-08.
- **R145 — Sibling Consolidation Execution (MERGE)** · Deferred merges from R135, with shims.
- **R146 — Cleanup: retire `V2Module`, registry CI (P4-01, P4-02).**
- **R147+ — External Provider Wiring** · P3-01..P3-10 as credentials/assets arrive.

Rationale: green tests → clean maps → foundations (search, files, roles) → high-visibility UI (founder, brain) → business-OS UI → builder editors → DH polish → consolidation → external.

---

## 3. Per-Gap Delivery Matrix

For each Priority 1 & 2 gap, the required tracks:

| ID | Code | Database | API | UI | External | Docs | Testing |
|---|---|---|---|---|---|---|---|
| P1-01 | Fix mocks in 4 test files | — | — | — | — | Update R132/R131 status | Re-run vitest → 627/627 |
| P1-02 | Replace 261 route bodies | — | Reuse existing `.functions.ts` | 261 screens | — | Route inventory in registry | Playwright smoke per module |
| P1-03 | Add classification headers | — | — | — | — | `docs/consolidation/R135.md` | — |
| P1-04 | Extend `files-upload.ts` | Add `content_uploads.export_manifest` col | New `files.import` / `files.export` server fns | Uploader dialog + export tray | — | R119 update | Unit + e2e |
| P1-05 | Extend `search.service.ts` hybrid | Migration: `pgvector` + `embedding` cols + IVFFLAT idx | Extend existing `search` fn | Search bar chips | — | R120 update | Unit ranking test |
| P1-06 | Bind R130 → UI | — | Existing fns | 6 founder screens | — | R130 update | Playwright |
| P1-07 | Bind brain engine → UI | — | Existing `brain-v4` fn | `/brain` inspector | — | R115B update | Unit for selectors |
| P1-08 | Wire placeholder clips in HappyVRM | — | — | — | Real clips remain BLOCKED | DH docs | Unit for clip picker |
| P2-01 | Extend `app-builder` editors | — | Existing builder fns | 6 editor screens | — | R121 update | Unit + e2e |
| P2-02..P2-08 | UI only over existing services | Only if a column missing | Existing fns | Real screens | — | Ring docs | Playwright |
| P2-09 | Extend R119 with vision call | — | AI Gateway | Preview matrix upgrade | — | R119 update | Unit |
| P2-10 | Docs script | — | — | — | — | Registry files | Registry lint |
| P2-11 | Docs + engine index | — | — | — | — | Registry files | — |
| P2-12 | Roles seed migration | INSERT 44 roles + policies | — | Roles admin screen (P2-08) | — | R129 update | Unit RLS |

---

## 4. Master Test Recovery Plan

10 failures across 4 files. All are mock-drift, not runtime regressions.

| Test file | Failing cases | Root cause | Fix plan | Owner |
|---|---|---|---|---|
| `tests/unit/happy-r94.test.ts` | 3: SSE accumulation, 429/402 mapping, abort partial | `fetch` mock returns `Response` without stream reader shape expected by post-R109 client | Replace `Response(body)` mock with `ReadableStream`-based mock; align error-code branch | happy-chat/r94 |
| `tests/unit/happy-r95.test.ts` | 5: API-key missing, non-multipart, missing file, forward+transcript, rate/credit mapping | `happy-stt` route now imports env inside handler; test mocked at module scope | Refactor tests to inject env via `process.env` per test + provide `FormData` polyfill | happy-stt/r95 |
| `tests/unit/happy-r96.test.ts` | 1: multipart audio → transcript | Depends on r95 fix + `transcribeBlob` signature after R107 | Update to new fetch signature | voice-fallback/r96 |
| `tests/unit/happy-r126.test.ts` | 1: brain intent → studio resolver | Regex added in R126 too strict for lowercased input | Anchor regex + normalise input; add case-insensitive flag | happy-r126 |

**Exit criteria:** `bunx vitest run` reports **627/627 pass**. Ring: R134. No production code changes required beyond the 4 test files + 1 regex.

---

## 5. Versioned Siblings — 224 files

**Rule:** NEVER DELETE. Every file gets a label; deletions occur only after MERGE completes and a shim proves zero call-sites.

### Classification workflow
1. `rg -l "from ['\"]@/lib/<name>-v<N>" src/` → live call-sites.
2. If **zero call-sites** and superseded ring exists → **REMOVE CANDIDATE** (defer to R145).
3. If **called** and functionality already covered by a newer sibling / canonical owner → **MERGE** into canonical, keep file as **SHIM** re-exporting.
4. If **called** and unique → **KEEP** and register under canonical owner in `MASTER_ARCHITECTURE_LOCK.md §4`.

### Initial bucket estimates (to be finalised in R135)
- Expected **KEEP**: canonical entry per capability (~60 files).
- Expected **SHIM** (thin re-export to canonical owner): ~90 files.
- Expected **MERGE** (fold logic into canonical, leave shim): ~55 files.
- Expected **REMOVE CANDIDATE** (parked, not deleted): ~19 files.

### Deliverable (R135)
`docs/consolidation/R135_SIBLING_CLASSIFICATION.md` — table with columns: File · Canonical Owner · Call-sites · Label · Target Ring.

---

## 6. Master UI Plan

- **Inventory:** 481 authenticated routes, **261 placeholders**.
- **Target:** 0 placeholders. Every route renders real data from an existing canonical service.
- **Method:** No new runtimes. Bind each screen to the ring's helper (`resolveForBrain`, `pickDh*Mode`, service fns).
- **Design system:** Reuse `src/design-system/primitives`, tokens from `src/design-system/tokens.ts`, no hardcoded colors.
- **Order:** Founder Dashboard → Brain → Business OS (CRM/ERP/HRMS/Inventory) → Creator/Revenue/Enterprise → Builder editors.
- **Definition of Done per screen:** real query, empty state, loading state, error state, primary action(s), Playwright smoke test.

---

## 7. Master Backend Plan

- Extend, never fork. Every new server fn lands next to its canonical owner.
- Migrations required (each in its own file, with GRANT + RLS in same file):
  - `pgvector` + `embedding` columns + IVFFLAT indexes (P1-05).
  - Roles seed (P2-12).
  - Optional `content_uploads.export_manifest` col (P1-04).
- No new tables unless a P2 gap proves impossibility.
- Server fns: harden env-inside-handler pattern (already required); add integration tests via `stack_modern--invoke-server-function` in test rings.

---

## 8. Master Database Plan

Verified 315 tables. Categorisation exercise (R135 companion):

| Bucket | Definition | Action |
|---|---|---|
| **Live** | Referenced in ≥1 server fn + ≥1 policy hits in code | Keep, ensure RLS + GRANT |
| **Registry-referenced future-reserved** | In Founder Registry roadmap, no code yet | Keep, mark `-- reserved` in comment |
| **Unused (dead)** | Zero code refs, not in registry | Add `MISSING OWNER` flag → propose owner in R135 (never drop) |
| **Suspected duplicate** | Two tables cover same concern | Merge column set into canonical owner via new migration; keep old with view forwarder |

Deliverable (R135): `docs/database/R135_TABLE_INVENTORY.md`.

---

## 9. Master External Plan

Every P3 item is credential- or asset-gated. Standing procedure:

1. Founder provides secret via `secrets--add_secret` or asset upload.
2. Ring picks up adapter shell already present in `src/lib/happy-adapters/` or `src/lib/payments/`, `src/lib/notifications/`.
3. Adapter passes Playwright happy-path test in sandbox.
4. Ring closes P3 gap; docs updated; status `COMPLETE`.

Until then: **BLOCKED, not MISSING** — planner-only shells acceptable per Founder Directive since external dependencies are the only permitted exception.

---

## 10. Master Production Plan

Gate to declare "Production Ready":

- [ ] R134 green (627/627)
- [ ] R135 classification labels attached to all 224 siblings
- [ ] R136 registries enumerated
- [ ] R137 semantic search live
- [ ] R138 import/export + OCR wired
- [ ] R139–R143 UI rings replace all 261 placeholders
- [ ] R144 DH animation placeholders wired
- [ ] R145 SHIMs live, MERGEs applied
- [ ] R146 cleanup + registry CI
- [ ] All P3 items either COMPLETE or explicitly BLOCKED with named external dependency
- [ ] Security scan re-run → no high/critical findings
- [ ] Perf budget: LCP < 2.5s on `/`, `/founder`, `/brain`, `/creator` per Playwright

Only when every box is checked may the audit score be re-computed and a COMPLETE claim be made.

---

## 11. Change-Control Discipline

Every PR from R134 onward must state, in the description:

> **Extends `<canonical owner>` — no duplication.**
> **Gaps closed:** `<P#-##>` list from this file.
> **Founder invariants preserved:** ONE Brain / Memory / DH / Workspace / Search / File Engine / Builder / Business OS.

Any PR that cannot make these three statements is rejected on principle, regardless of what it implements.

---

**This document is the official execution plan for the remainder of the project.**
No implementation performed in R133. Next action = R134 Test Green Restoration.
