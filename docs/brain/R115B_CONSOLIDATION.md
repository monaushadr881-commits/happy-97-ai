# R115.b — Canonical Brain Consolidation

Status: **Complete (repo-side)** — precedes R115.a `runBrain()` rollout.
Governance: extends R91 Vision Lock + R111 Architecture Lock. Nothing removed.

## 1. Canonical Owners (one per capability)

| Capability   | Canonical Owner                                     | Server Surface                              |
|--------------|-----------------------------------------------------|---------------------------------------------|
| Brain        | `src/lib/brain/engine.ts`                           | `src/lib/brain/brain.functions.ts`          |
| Memory       | `src/lib/memory/engine.ts`                          | `src/lib/memory/memory.functions.ts`        |
| Knowledge    | `src/lib/kg/engine.ts`                              | `src/lib/kg/kg.functions.ts`                |
| Planner      | `src/lib/brain/engine.ts` (`planner`)               | `brainPreviewPlan` in brain.functions.ts    |
| Conversation | `src/components/happy-desk/HappyDesk.tsx` + `src/lib/happy-chat.functions.ts` | `chatWithHappy`, `/api/happy-chat` SSE |
| Workspace    | `src/lib/workspace-runtime/*`                       | existing workspace server fns               |
| Automation   | `src/lib/automation/engine.ts`                      | `src/lib/automation/automation.functions.ts`|
| Builder      | `src/lib/happy-builder/*`                           | existing builder server fns                 |

## 2. Sibling Classification

All 19 versioned `*-vN.functions.ts` files under `src/lib/` are **Compatibility Shims**.
They already delegate through `src/services/domain/roadmap.service.ts` — no local
business logic. Every file was tagged with a top-of-file `@deprecated` JSDoc
pointing to its canonical owner (see list below). No file was deleted; every
public import path continues to work.

### Compatibility Shim list (marked @deprecated → canonical owner)

- `brain-v3.functions.ts`, `brain-v4.functions.ts` → **Brain**
- `memory-v2.functions.ts`, `memory-v4.functions.ts`, `memory-network-v12.functions.ts`, `memory-network-v13.functions.ts`, `memory-runtime-v3.functions.ts` → **Memory**
- `knowledge-v1.functions.ts`, `knowledge-graph-v12.functions.ts`, `knowledge-fabric-v13.functions.ts`, `knowledge-exchange-v14.functions.ts`, `knowledge-network-v16.functions.ts` → **Knowledge**
- `planner-runtime-v3.functions.ts` → **Brain (Planner)**
- `workspace-v5.functions.ts`, `workspace-v16.functions.ts` → **Workspace**
- `builder-v1.functions.ts` → **Builder**
- `automation-runtime-v3.functions.ts`, `automation-v6.functions.ts`, `automation-network-v13.functions.ts` → **Automation**

### Deprecated / Remove-candidate

None. Per Founder rule "DO NOT delete working code", every shim is retained
until an explicit migration ticket retires each import path.

### Experimental

`src/brain/*` (16-file kernel used by `roadmap.service::brainService`) — retained
as internal auxiliary kernel; new code MUST call the canonical `runBrain()` in
`src/lib/brain/engine.ts`, not `src/brain/kernel.ts` directly.

## 3. Compatibility Map (import paths)

All previously working imports remain unchanged:

- `@/lib/brain-v3.functions` → still exports `apiBrainStatus`, `apiBrainProcess`, …
- `@/lib/memory-v2.functions` → still exports `apiMemoryList`, `apiMemoryRecall`, …
- `@/lib/kg/kg.functions`, `@/lib/memory/memory.functions`, `@/lib/brain/brain.functions` → unchanged plus new `brainRunBrain`.

## 4. runBrain() Pipeline (R115.a implemented here)

Defined once in `src/lib/brain/engine.ts` as `runBrain()` and exposed as the
`brainRunBrain` server function. Stages:

```
LISTEN → UNDERSTAND → MIRROR → LOAD MEMORY → LOAD KNOWLEDGE →
LOAD WORKSPACE → REASON → PLAN → SELECT AGENTS → RESPOND →
DIGITAL HUMAN → SAVE MEMORY → LEARN
```

Each stage composes an existing owner — zero duplicated logic:
- `intent.classify` (this file)
- `brainPipeline.mirror` (this file, new helper)
- `memoryContext` / `memoryStore` / `memoryLogEvent` (canonical Memory)
- `naturalQuery` (canonical KG)
- `contextEngine.snapshot` (this file — workspace context)
- `orchestrator.run` (existing Brain orchestrator — reason/plan/execute)
- `brainPipeline.selectAgents` / `toDigitalHuman` (this file, new helpers)

Returns a Digital Human Response Envelope (`text`, `emotion`, `gesture`,
`eyeContact`, optional whiteboard ops) so the DH renderer can consume it
directly.

## 5. Files Changed

- **Modified:** `src/lib/brain/engine.ts` (+~150 lines — `runBrain` + helpers).
- **Modified:** `src/lib/brain/brain.functions.ts` (+1 export `brainRunBrain`).
- **Modified (headers only):** 19 versioned shim files under `src/lib/`.
- **New:** `docs/brain/R115B_CONSOLIDATION.md` (this file).
- **New:** `tests/unit/happy-r115b.test.ts` (pipeline unit tests).

## 6. Architecture Impact

- Enforces R91/R111: one canonical owner per capability, no new runtime.
- All future brain callers must import `runBrain` / `brainRunBrain`.
- Zero breaking changes; every public import path preserved.

## 7. Performance Impact

- No new hot path — `runBrain` composes existing awaited calls; adds two
  best-effort `.catch(() => null)` memory writes at the tail (fire-and-forget
  in effect).
- No duplicated DB roundtrips: memory context, KG lookup, and workspace
  snapshot are single queries each.

## 8. Evidence

- `runBrain` grep confirmed no prior definition existed.
- All 19 shim files begin with `@deprecated` header pointing to canonical owner.
- Unit tests in `tests/unit/happy-r115b.test.ts` cover `brainPipeline.mirror`,
  `selectAgents`, and `toDigitalHuman`.
