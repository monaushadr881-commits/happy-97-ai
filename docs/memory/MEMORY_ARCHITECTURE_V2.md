# MEMORY_ARCHITECTURE_V2 (R116)

Status: **DRAFT v1** · Extends (does NOT replace) the canonical owner `src/lib/memory/engine.ts`.
Locks: R91, R111, R113, R115. **Rule zero: ONE Memory. ONE Engine. ONE Set of Tables.**

## 1. Layered Model

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Callers: runBrain(), UI surfaces, agents, automations, jobs               │
├───────────────────────────────────────────────────────────────────────────┤
│ src/lib/memory/memory.functions.ts   (typed RPC — createServerFn only)    │
├───────────────────────────────────────────────────────────────────────────┤
│ src/lib/memory/engine.ts             (canonical owner — read/write/retain)│
│   ├─ memoryStore / Get / List / Search / Update / Archive / Forget / Merge│
│   ├─ memoryLogEvent / Timeline                                            │
│   ├─ memoryRetentionUpsert / Apply                                        │
│   ├─ memoryContext (fan-out recall)                                       │
│   └─ memoryLink                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│ src/lib/memory/intelligence.ts       (R116 pure helpers — no DB writes)   │
│   classify · prioritize · autoTag · summarize · dedupeCandidates          │
│   detectConflicts · confidenceScore · assertPermission · recallPlan       │
│   groupTimeline · analyticsSnapshot · influenceDigitalHuman               │
├───────────────────────────────────────────────────────────────────────────┤
│ Tables (existing, unchanged): memory_items, memory_events, memory_links,  │
│         memory_retention_policies, memory_access_log                      │
└───────────────────────────────────────────────────────────────────────────┘
```

## 2. Memory Flow (write path)

```
input ─▶ classify(kind, scope) ─▶ autoTag ─▶ prioritize (importance 1..5)
      ─▶ summarize (title/summary caps) ─▶ dedupeCandidates(recent list)
      ─▶ assertPermission(scope, actor) ─▶ memoryStore()
      ─▶ post-write: link related, log event, tick analytics
```

## 3. Recall Flow (read path)

```
intent + persona + scopes ─▶ recallPlan()  (chooses categories + limits)
                          ─▶ memoryContext / memorySearch (existing owner)
                          ─▶ rank (recency + importance + pinned + hit-rate)
                          ─▶ influenceDigitalHuman(greeting/emotion/roadmap)
```

## 4. Permission Flow

Assertion is *in addition to* RLS, never a replacement:

| scope       | writable by                        | readable by                          |
|-------------|------------------------------------|--------------------------------------|
| personal    | owner user                         | owner user                           |
| workspace   | active workspace member            | active workspace member              |
| company     | company member (RLS `is_company_member`) | same                            |
| founder     | platform founder role              | platform founder role                |
| shared      | scope owner + link recipients      | recipients w/ active link            |
| public      | explicit `sensitivity='public'`    | any authenticated (still RLS-scoped) |

## 5. Retention / Expiration / Versioning

- Retention: `memory_retention_policies` (existing) — `max_age_days`, `archive_after_days`, `hard_delete`.
- Expiration: `expires_at` per row + `memoryRetentionApply` sweeps.
- Versioning: mutation preserves history via `memory_links(kind='supersedes')`; no in-row edit history.
- **Never delete Founder knowledge** — enforced by `assertForget()` guard.

## 6. Intelligence Contract (pure)

All intelligence helpers are pure functions on `MemoryStoreInput`/rows. They:

- do **not** open the database
- do **not** know about `SupabaseClient`
- produce deterministic classifications, tags, summaries, and confidence

This keeps the canonical engine unchanged and lets `runBrain()` compose them.

## 7. Analytics

`analyticsSnapshot(rows, events)` returns:

- hits, misses, recall accuracy (hit/(hit+miss))
- duplicate rate, conflict rate
- memory growth (rows/day)
- average recall latency (from `metadata.latency_ms`)

Emitted as regular events into `memory_events` (event_type = `memory.metrics`).

## 8. Digital Human Integration (Phase 11)

`influenceDigitalHuman(rows, persona)` returns:

```
{
  greeting: string,          // built from most-recent conversation/personal memory
  emotion: EmotionCue,       // biased by relationship + recent conflict
  gestureHint: GestureCue,   // 'wave' first-meet vs 'nod' returning
  roadmapSeed?: string[],    // pinned project memory titles
  suggestions: string[]      // high-importance unresolved items
}
```

**Never fabricates memories.** Empty inputs → empty suggestions.

## 9. Brain Integration (Phase 12)

```
runBrain() Stage 4 (LOAD MEMORY):
  recallPlan(intent) ─▶ memoryContext ─▶ prioritize ─▶ dedupe

runBrain() Stage 12 (SAVE MEMORY):
  classify + autoTag + summarize + assertPermission ─▶ memoryStore

runBrain() Stage 13 (LEARN):
  analyticsSnapshot ─▶ memoryLogEvent('memory.metrics')
```

## 10. Non-duplication contract

- No file may be named `memory-v2`, `memory-vN`, `memory-engine-2`, etc.
- No new tables. All eleven Phase 3 categories reuse `memory_items` columns.
- No new APIs. All calls go through the existing `mem*` server functions.
