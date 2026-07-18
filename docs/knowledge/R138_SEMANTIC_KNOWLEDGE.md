# R138 — Universal Semantic Knowledge Intelligence™

**Locks:** R91 Vision · R111 Architecture · R113 Founder Constitution · R133 Scope Lock
**Status:** Delivered as pure extension layer.
**Canonical Owners (unchanged):**
- Search: `src/services/domain/search.service.ts`
- Brain: `src/brain/kernel.ts`
- Memory: `src/lib/memory/intelligence.ts`
- Files: `src/lib/happy-r119/file-intelligence.ts`
- Workspace: `src/services/domain/workspace.service.ts`
- Knowledge: `knowledge_articles` via `services/domain` (`kb*`)

**Extension Layer:** `src/lib/happy-r138/semantic-knowledge.ts`

## Objective
Close the Semantic Knowledge gap identified in R132 without duplicating any
runtime. Provide deterministic hybrid-search planning and cross-domain
resolvers that Brain Stage 6 (Retrieval) composes over canonical owners.

## Files Changed
- **Added:** `src/lib/happy-r138/semantic-knowledge.ts` (extension only)
- **Added:** `tests/unit/happy-r138.test.ts`
- **Added:** `docs/knowledge/R138_SEMANTIC_KNOWLEDGE.md`
- **Unchanged:** all canonical owners (Search / Brain / Memory / Files / Workspace / Knowledge)

## Functions Added
- `planHybridSearch(q, ctx)` — keyword + optional vector plan
- `planVectorSearch(domain, ctx)` — pgvector-ready descriptor, `ready:false` until column exists
- `fuseRanks(keyword, vector, k=60)` — Reciprocal Rank Fusion
- Resolvers: `resolveSemantic`, `resolveKnowledge`, `resolveMemory`,
  `resolveWorkspace`, `resolveConversation`, `resolveFiles`,
  `resolveEntities`, `resolveRelationships`, `resolveContext`
- `resolveForBrain(q, ctx)` — retrieval hint for Brain Stage 6
- `isSingleOwner()` — invariant probe listing canonical owners

## Architecture Impact
- Zero new runtimes, tables, indexes, or APIs.
- Vector integration is architecture-ready: `planVectorSearch` returns a
  typed descriptor (`table`, `column`, `metric`, `topK`, `filter`) with
  `ready:false`. Wiring only requires adding a `vector(embedding)` column
  + HNSW index to `memory_items` / `knowledge_articles` per
  `docs/architecture-lock/SEARCH_ARCHITECTURE.md`, then flipping `ready`.
- Keyword FTS (websearch/ilike) remains the primary path — backward
  compatible.

## Security Impact
- Resolvers stay permission-neutral; every call still routes through
  `searchService` / RLS on the canonical owners. No new surface area.
- Workspace/company IDs propagate into vector `filter` so eventual
  pgvector queries are tenant-scoped from day one.

## Performance Impact
- All planners are O(n) over query length; no I/O.
- RRF fusion is O(k) and cap-bounded by upstream `topK`.

## Tests
- `tests/unit/happy-r138.test.ts` (8 cases): planning, vector plan,
  RRF fusion, all seven resolvers, single-owner invariant.

## Registry Update
- Feature: **F-KNOW-SEMANTIC** — Universal Semantic Knowledge (R138).
- Technical owner: `src/lib/happy-r138/semantic-knowledge.ts`.
- Canonical runtimes: unchanged.

## Evidence
- No new tables, no migrations, no new API endpoints, no `-vN` siblings.
- Vector plan explicitly marked `ready:false` to prevent premature use.

## Known Limitations
- Vector recall inactive until `pgvector` column + HNSW index are added
  on `memory_items` / `knowledge_articles` (future migration, tracked in
  `SEARCH_ARCHITECTURE.md`).
- Entity resolver uses capitalized-token heuristic; deeper NER remains a
  Brain extension.

## Remaining Gaps
- Live pgvector migration + embedding pipeline (external OP).
- Handwriting/image-perceptual retrieval (owned by R119 future phase).
