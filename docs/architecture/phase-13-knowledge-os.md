# Phase 13 — HAPPY Global Knowledge, Research, Religion & Culture OS (WKOS)

WKOS is the central knowledge intelligence layer for the HAPPY X ecosystem.
Every knowledge surface (HAPPY, Education, Business, Creator, Digital Human,
Community, Marketplace, Enterprise) consumes it. No feature bypasses the
Knowledge Engine, the AI Gateway, or the service layer.

## Knowledge Architecture

- **Categories** — `knowledge_categories` (nested via `parent_id`), global or
  company-scoped.
- **Articles** — `knowledge_articles` with `is_public` flag, `status`
  (`draft` → `active`), a stored `search_vector` (Postgres tsvector) for
  full-text search and `language` for multilingual support.
- **References** — `knowledge_references` per article (label + URL) preserves
  source attribution as a permanent requirement.
- **Sources** — `ai_knowledge_documents` + `ai_knowledge_chunks` back the
  RAG substrate (books, research papers, policies, manuals, uploads).
- **Isolation** — RLS: company knowledge is readable only by company members
  and writable only by company admins; public knowledge requires
  `is_public AND status='active'`. Enforces the KNOWLEDGE RULE.

## Knowledge Graph Summary

- Entity / topic edges: `knowledge_articles.category_id → knowledge_categories`
  (topic tree), plus `parent_id` on categories (subtopic tree).
- Citation graph: `knowledge_references.article_id → knowledge_articles`.
- Source graph: `ai_knowledge_chunks.document_id → ai_knowledge_documents`.
- Tenant graph: `company_id` links every knowledge node to its owner.
- Timeline: `created_at` / `updated_at` provide versioning; `version` and
  soft `deleted_at` give history-aware queries.
- Cross-references between articles surface via categories today and can be
  extended with a link table (Phase 14+) without schema breaks.

## Research Engine Summary

- **Search** — `kbSearchArticles` supports scope (`public` / `company` /
  `all`), category, language, and free-text (ilike over title/summary). The
  `search_vector` GIN index is ready for tsvector ranking upgrades.
- **Vector / semantic search** — the `ai_knowledge_chunks` table is ready
  for pgvector embeddings; `kbAskHappy` retrieval swaps in cleanly.
- **Ranking / citation** — every retrieved source is returned to the client
  with a stable list index and reused in HAPPY's answer citations `[1]`,
  `[2]`, `[3]`.
- **Reading paths, topic summaries, related topics** — derived from category
  tree + citation graph.

## Knowledge API Inventory (`src/lib/knowledge-v1.functions.ts`)

| Function | Purpose |
| --- | --- |
| `kbListCategories` | Categories (topic tree). |
| `kbSearchArticles` | Search articles by scope / category / language / q. |
| `kbGetArticle` | Article + attributed references. |
| `kbCreateArticle` | Create draft (company admin). |
| `kbUpdateArticle` | Edit article. |
| `kbPublish` | Publish company-wide or public (audit-logged). |
| `kbAddReference` | Attach source attribution. |
| `kbListDocuments` | Source documents library. |
| `kbAddDocument` | Register a new source. |
| `kbDashboard` | Aggregate KPIs. |
| `kbAskHappy` | RAG-lite answer via Lovable AI Gateway with cited sources. |

## Navigation Tree

```
/knowledge                          → Dashboard
/knowledge/search                   → Universal search
/knowledge/library                  → Public library + category rail
/knowledge/ask                      → HAPPY knowledge assistant
/knowledge/sources                  → Source documents
/knowledge/religion-culture         → Respectful, multi-viewpoint index
/knowledge/moderation               → Draft / approve / publish
```

## Security Summary

- Every mutation goes through `requireSupabaseAuth`.
- RLS on `knowledge_articles`, `knowledge_categories`, `knowledge_references`,
  `ai_knowledge_documents`, `ai_knowledge_chunks` enforces:
  - company members read → member-scoped `is_company_member(uid, company_id)`.
  - company admins write → `is_company_admin(uid, company_id)`.
  - public read → `is_public AND status='active'`.
- Zod validators bound every string / uuid input.
- `slug` is regex-validated (`^[a-z0-9-]+$`).
- `kbPublish` writes an `audit_logs` row (`knowledge.publish.*`).
- `LOVABLE_API_KEY` is read only inside the handler; never exposed to the
  client. AI Gateway response errors (429 / 402) are surfaced with clear
  copy.

## Performance Summary

- `knowledge_articles.search_vector` is `GIN`-indexed for fast full-text.
- `idx_ai_kd_company` narrows document reads to the current tenant.
- All list queries are bounded (`limit(24…100)`) and ordered on `updated_at`.
- Retrieval for `kbAskHappy` capped at `top_k ≤ 8` and short prompt window.
- React Query caches keyed per surface with targeted invalidation on publish.

## Testing Summary

- Zod at the edge; RLS at the database prove ownership.
- Manual verification: dashboard KPIs, article search, publish → visibility
  toggle, HAPPY answer includes source list when matches exist.
- Follow-up (Phase 14+): Playwright E2E for create → publish → answer flow;
  pgvector semantic retrieval swap and eval harness.

## Documentation Summary

This document is the source of truth for Phase 13. Extensions must go
through the Knowledge Engine — never duplicate knowledge, never bypass the
AI Gateway or service layer, and always preserve source attribution.
