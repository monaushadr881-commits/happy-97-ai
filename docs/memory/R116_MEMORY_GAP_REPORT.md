# R116 — HAPPY Memory Intelligence · Gap Report (Phase 1)

Status: **Audit complete** · Locks: R91 (Vision), R111 (Architecture), R113 (Registries), R115 (Brain).
Rule zero: **ONE Memory owner.** Every gap below is closed by extending the canonical
owner `src/lib/memory/engine.ts` — never by a v2 engine, v2 table, or v2 API.

## 1. Canonical owner (locked)

| Concern                     | Canonical owner                                        |
|-----------------------------|--------------------------------------------------------|
| Long-term memory (all tiers)| `src/lib/memory/engine.ts`                             |
| Memory RPC surface          | `src/lib/memory/memory.functions.ts`                   |
| Tables                      | `memory_items`, `memory_events`, `memory_links`, `memory_retention_policies`, `memory_access_log` |
| Brain memory access         | `runBrain()` in `src/lib/brain/engine.ts` (Stage 4 + 12) |
| Workspace memory bridge     | `src/workspace/memory.ts` (thin, delegates)            |
| AI/agent memory             | Rows in `memory_items` with `kind='ai'`                |

## 2. Category coverage (Phase 3 checklist)

| Category               | Coverage                                                       | Gap |
|------------------------|----------------------------------------------------------------|-----|
| Personal Memory        | `scope='personal'` + `kind='personal'`                         | — |
| Conversation Memory    | `kind='conversation'` (written by `runBrain` Stage 12)         | — |
| Workspace Memory       | `scope='workspace'` + `workspace_id`                           | — |
| Company Memory         | `scope='company'` + `company_id`                               | — |
| Project Memory         | `kind='project'` + `entity_type='project'`                     | — |
| Brand Memory           | `kind='marketplace'`/`crm` w/ `tags:['brand']` — **needs first-class tag pathway** | Add `kind='brand'` to MemoryKind (backward-compatible: extends union). |
| Learning Memory        | `kind='ai'` + `metadata.learning=true` written from `Brain.learn` | Formalize a `learning` tag + surface via recall. |
| Founder Memory         | `kind='founder'`                                               | — |
| Knowledge Memory       | Lives in `kg_*` tables (separate canonical owner)              | Bridge only: memory→kg link, not a duplicate store. |
| AI Memory              | `kind='ai'` + `ai_memories` legacy table (kept for RLS parity) | Use `memory_items` for new writes; `ai_memories` frozen. |
| Shared Memory          | `scope='workspace'` + link visibility policy                   | — |
| Temporary Memory       | `expires_at` present + retention                               | — |
| Archived Memory        | `archived=true`                                                | — |

**No new tables are required.** All eleven categories map onto existing columns.

## 3. Duplicate detection

| Sibling / Candidate            | Verdict                     | Action |
|--------------------------------|-----------------------------|--------|
| `ai_memories` (legacy)         | Duplicate of `memory_items` for `kind='ai'` | Freeze writes; readers keep working. |
| `faios_memory`                 | Domain-specific scratchpad, not a generic memory store | Keep — not a duplicate. |
| `src/brain/memory.ts`          | In-memory ring buffer for the `brain/` façade | Keep — process-local cache, not persistent memory. |
| `src/workspace/memory.ts`      | Thin bridge to canonical owner | Keep — delegates. |
| Any `memory-v*.functions.ts`   | If present, must be shims per R115.b | Remain deprecated re-exports. |

No new engine/runtime is added by R116.

## 4. Performance risks

- `memoryContext` fans out three parallel `memoryList` calls per turn. **Bounded** at 20/20/30 rows.
- Full-text search uses the existing `search_tsv` index; no additional index needed.
- Ranker is O(n) on already-bounded lists.
- **Mitigation added by R116:** in-turn dedupe + prioritization in a pure helper (no extra DB calls).

## 5. Security risks

- All reads/writes go through RLS via `requireSupabaseAuth`. No memory helper opens `supabaseAdmin`.
- `memory_access_log` is immutable (trigger).
- **New permission gate** (`assertMemoryPermission`) is a *policy assertion in code* — it never
  replaces RLS; it prevents accidental cross-scope writes at the call site.

## 6. Scalability risks

- Retention policy uses `memory_retention_policies`. Already indexed by `(company_id, scope, kind)`.
- Timeline reads capped at 500. Add pagination cursor before crossing 100k events / tenant.
- Embedding column exists on `memory_items` but is unused; embedding pipeline is a **future phase**
  and **must land inside the canonical owner**, never a v2.

## 7. Founder rules — compliance

- [x] No Memory V2
- [x] No new engine
- [x] No duplicate Conversation/Workspace/Personal memory
- [x] All 11 categories reuse `memory_items` columns
- [x] Backward compatibility preserved (`MemoryKind` union widened, not replaced)
