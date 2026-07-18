# BRAIN_ARCHITECTURE_V2 (R115 Phase 2)

Status: **DRAFT v1** · Supersedes: implicit v1 spread across `brain-v3/v4` (deprecated).
Locked by: R91 (Vision), R111 (Architecture), R113 (Registries), R115 (this doc).

**Rule zero: ONE Brain. ONE Memory. ONE Conversation runtime.** Every capability below extends the
existing canonical owner named in the R115 Gap Report §1. No new runtime, no `-vN` sibling.

---

## 1. Layered Model

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Conversation Surface     (HappyDesk, Voice, VRM, Whiteboard)            │
├──────────────────────────────────────────────────────────────────────────┤
│  runBrain() ── canonical entrypoint (src/lib/brain/brain.functions.ts)   │
│    │                                                                     │
│    ├─ Listen        (raw input capture, provenance stamp)                │
│    ├─ Understand    (intent + entities via specialist router)            │
│    ├─ Mirror        (self-summary; verifies intent before spending tokens│
│    │                 on Reason — the "think twice, speak once" gate)     │
│    ├─ ContextResolver (9-scope Memory pull, parallel, budgeted)          │
│    ├─ Knowledge     (KG + Knowledge fabric lookup, top-K, ranked)        │
│    ├─ Reason        (Thinking-mode aware; streams tokens)                │
│    ├─ Plan          (Planner façade → Roadmap/Todo/Workflow intents)    │
│    ├─ Verify        (guardrails; hallucination check; risk gate)         │
│    ├─ Respond       (typed BrainResponse envelope, streamed)             │
│    ├─ Execute       (side-effects: tools, automations, DH gestures)      │
│    └─ Learn         (post-turn evaluator → memory + telemetry write)     │
├──────────────────────────────────────────────────────────────────────────┤
│  Canonical owners (unchanged)                                            │
│    Memory:      src/lib/memory/memory.functions.ts                       │
│    Knowledge:   src/lib/kg/kg.functions.ts                               │
│    Specialists: src/lib/specialist-runtime/router.ts                     │
│    Conversation:src/lib/happy-runtime/conversation.ts                    │
│    Learning:    src/lib/learning-runtime/learning.functions.ts           │
│    Digital Hu.: src/components/digital-human/HappyVRM.tsx + bus          │
├──────────────────────────────────────────────────────────────────────────┤
│  AI Gateway    (LOVABLE_API_KEY, single credential path)                 │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. Thinking Pipeline (Phase 5)

Every turn walks the same stages. Each stage is a **pure function or async helper**; only `runBrain()`
composes them. Stages emit `brainTelemetry` spans (immutable `obs_trace_spans`).

| Stage | Input | Output | Failure mode |
|---|---|---|---|
| Listen | `{ userId, text, audioUrl?, surface }` | `RawTurn` | Reject empty/oversize input |
| Understand | `RawTurn` | `{ intent, entities, confidence }` | Fallback to `general` intent |
| Mirror | above + short memory | `MirrorNote` (internal summary) | Skip when confidence ≥ 0.9 |
| ContextResolver | userId + intent | `BrainContext` (9 scopes) | Return partial; log missing |
| Knowledge | intent + context | `KnowledgeHits[]` (top-K, budgeted) | Empty array on miss |
| Reason | all above + `ThinkingMode` | `TokenStream` | Retry once, then degrade |
| Plan | reasoned output | `PlanIntents[]` | Emit empty plan |
| Verify | reasoned + plan | `VerifyReport` | Downgrade or refuse response |
| Respond | verified | `BrainResponse` envelope | Always sends *some* envelope |
| Execute | envelope + user consent | `ExecutionReceipt[]` | Never blocks response |
| Learn | full turn | `LearningWrite` (guarded) | Never throws |

## 3. Mirror Engine (Phase 6)

Before any response over `mirror_threshold_tokens` (default 200) OR when intent confidence < 0.9,
the Mirror stage:

1. Summarizes the user's request in one sentence.
2. Restates the goal in HAPPY's own words.
3. Lists what will be checked in Memory + Knowledge + Workspace.
4. Records the mirror as an internal (not visible) `brain_intents` row.

The mirror is a **cheap** call (short prompt, small model, cap 150 tokens). It is skipped when the
budget stage indicates fast-path (single-turn greeting, deterministic tool call, etc.).

## 4. Thinking Engine (Phase 7)

Selected by `pickThinkingMode({ persona, intent, complexity })`. Pure function.

| Mode | Model preference | Token budget | Notes |
|---|---|---|---|
| Fast | `google/gemini-3-flash-preview` | 800 | Default. |
| Deep | Best available reasoning model | 4000 | Multi-step, tool-enabled. |
| Founder | Deep + founder memory scope | 6000 | Only if `is_platform_founder`. |
| Research | Deep + web/kg search tools | 6000 | Auto-cites sources. |
| Business | Deep + BI/ERP/CRM tool set | 3000 | |
| Education | Fast + safety guard | 1500 | Age-appropriate filter. |
| Developer | Deep + code + repo tools | 4000 | |

## 5. Memory Model (Phase 4)

**One canonical Memory owner**, addressed by `scope`. No new table per scope — reuse `memory_items`
with a `scope` column (already present) and RLS on `user_id`/`company_id`/`workspace_id`.

Scopes (all read through `resolveContext(userId, intent)`):

- **long** — persistent user facts
- **short** — last N turns in current conversation (in-memory + last-hour DB tail)
- **workspace** — collaborative notes scoped to `workspaces.id`
- **company** — enterprise-scope facts
- **brand** — brand voice + assets
- **founder** — founder-only strategic memory (RLS: `is_platform_founder`)
- **project** — project-scoped tasks/decisions
- **learning** — model-derived improvements (write path guarded)
- **conversation** — the current conversation transcript

Write path: `memory.functions.ts::writeMemory({ scope, ... })` — the only writer. `runBrain().Learn`
is the only caller for auto-writes; explicit user "remember this" calls the same fn from UI.

## 6. Digital Human Envelope (Phase 9)

`BrainResponse` typed shape sent to `conversation-engine.ts` bus (single existing bus):

```ts
type BrainResponse = {
  text: string;                    // streamed
  emotion: EmotionCue;             // reuses existing EmotionCue map
  gesture: GestureCue;             // reuses R110 GestureCue
  eyeContact: "user"|"whiteboard"|"away";
  voice: { rate: number; pitch: number; ssml?: string };
  expressions: VisemeSchedule[];   // synced to TTS
  roadmap?: RoadmapCard;           // rendered in Whiteboard panel
  whiteboard?: WhiteboardOps[];    // additive ops only
};
```

Digital Human consumers subscribe to the bus and animate. R115 does NOT introduce a second bus.

## 7. Planner Façade (Phase 8)

`brain/planner.ts::plan(context, reasonedOutput)` merges `planner-runtime-v3` + `planning-runtime-v3`
into one pure interface, emitting typed `PlanIntent[]`:

- `roadmap_add`, `todo_add`, `project_create`, `workflow_start`, `automation_arm`.

Downstream handlers already exist in `automation-runtime-v3`, `builder-v1`, `founder-executive`.
Planner does NOT execute — it emits intents that `Execute` stage dispatches after consent gate.

## 8. Learning Loop (Phase 10)

After each turn, `Learn` stage runs (async, non-blocking):

1. **Evaluate** — score turn on {helpfulness, correctness, latency, tool success}.
2. **Improve** — if score < threshold, spawn a background improvement note into `memory.scope=learning`.
3. **Remember** — persist salient facts to `memory.scope=long` (only with consent flag).
4. **Forget** — apply pending user "forget" directives (respects `forget_at` timestamps).

Consent flags live on `profiles.brain_prefs` (JSONB, new column in R115.c migration).

## 9. Non-Duplication Contract

- No file may be named `brain-v5`, `memory-v5`, `runtime-v4`, etc. Any PR proposing one is rejected.
- Every consolidated sibling becomes a re-export shim with a `@deprecated` JSDoc pointing at the
  canonical owner. Removal comes in R120+ once import sites are migrated.
- Every new file inside `src/lib/brain/` must be a **pure helper** or a **typed contract**. Only
  `brain.functions.ts` may `createServerFn`.

## 10. Rollout

R115.a — pipeline skeleton + Mirror + ThinkingMode + ContextResolver + Response envelope + tests.
R115.b — planner façade + learning writer + telemetry spans + Digital Human envelope wiring.
R115.c — sibling deprecation shims + migration of import sites.

Each sub-milestone independently green (tests + typecheck) before the next begins.
