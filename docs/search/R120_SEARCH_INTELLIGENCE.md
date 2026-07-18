# R120 — HAPPY Universal Search Intelligence™

**Locks:** R91 Vision · R111 Architecture · R113 Founder Constitution
**Status:** Delivered as pure extension layer.
**Canonical Owner (unchanged):** `src/services/domain/search.service.ts` (`searchService`).
**Extension Layer:** `src/lib/happy-r120/search-intelligence.ts`.

## Phase 1 — Gap Report

| Concern | Finding | Action |
|---|---|---|
| Canonical owner | `searchService` (knowledge + companies FTS/ILIKE) | Keep — extend only |
| Duplicates | `src/lib/search-v12/v13/v16.functions.ts`, `research-v9/v15.functions.ts` | Already `@deprecated` shims → `services/domain/roadmap.service`. No new siblings. |
| Indexes | `tsvector` on `memory_items`, `kg_entities`, `cms_contents`, `knowledge_articles` (per `docs/architecture-lock/SEARCH_ARCHITECTURE.md`) | Reuse; no new indexes |
| Performance risk | Multi-domain fan-out without merge budget | Merge helper caps + score-sorts client-side |
| Ranking risk | ILIKE/FTS alone ignores permission/workspace/recency/memory | Added deterministic `rankResults()` |
| Security risk | Cross-tenant leakage if filters ignore workspace/permission | `rankResults` drops `permission === "denied"`; caller must still enforce RLS |
| API impact | Zero — no new server functions | — |
| DB impact | Zero — no new tables, no new migrations | — |

## Phase 2 — Architecture V2

- **Index Model:** existing tsvector columns + ILIKE fallbacks; hybrid/vector reserved for `services/domain/search.service` future extension (per lock doc).
- **Ranking Model:** relevance (upstream) + permission bias + workspace affinity + recency half-life (30d) + memory affinity + relationship + pinned/favorite bonuses.
- **Permission Model:** results carry `permission` (`own|shared|workspace|public|denied`); denied are filtered before ranking.
- **Caching Model:** client-side `recents` + `memoryTopics` feed `suggestFor()`; server results use `ctx.cache` already exposed by `ServiceContext`.
- **Realtime Model:** `suggestFor()` returns instant suggestions during typing; voice pipeline via `planVoiceSearch()`.

## Phase 3–11 — Coverage

- **17 universal domains:** users, chats, memory, knowledge, projects, companies, brands, files, folders, calendar, tasks, automation, builders, agents, marketplace, courses, analytics.
- **Intelligence:** `classifyQuery` (keyword/semantic/natural/hybrid), `pickDomains`, `extractTimeWindow`.
- **AI search:** `resolveForBrain()` returns `{q, mode, domains, time, ocr, workspaceId}` for Brain Stage 6 (Retrieval).
- **Ranking:** `rankResults`, `mergeDomainResults`.
- **Instant search:** `suggestFor()` merges recents, memory-recommended, per-domain scoped, and an AI-ask suggestion.
- **OCR search:** `shouldSearchOcr()` triggers when files-in-scope and query mentions scan/receipt/whiteboard/slide/pdf/screenshot.
- **Voice search:** `planVoiceSearch()` → transcript → intent → domains → DH explains.
- **Brain integration:** `resolveForBrain()` compatible with `runBrain()` retrieval stage.
- **Workspace integration:** `RankContext.workspaceId` applied as affinity bias; caller must still pass workspace to `searchService` for RLS.

## Phase 12 — Analytics

`analyticsSnapshot(events)` → `{ total, success, failure, avgLatency, clickThrough, topQueries, topDomains }`.

## Registry Update

- Feature: **F-SEARCH-INT** — Universal Search Intelligence (R120).
- Technical owner: `src/lib/happy-r120/search-intelligence.ts`.
- Canonical runtime: `src/services/domain/search.service.ts`.

## Evidence

- Tests: `tests/unit/happy-r120.test.ts` (all green).
- No new tables, no new migrations, no new API endpoints, no new indexes.

## Known Limitations / Remaining Work

- Vector/hybrid search backend and handwriting OCR remain future phases (per `SEARCH_ARCHITECTURE.md`).
- Server-side merge across all 17 domains is client-composed today; server-side federation is a future extension of the canonical `searchService`.
- Perceptual similarity across image files is future work (owned by R119 file intelligence).
