# R115 — HAPPY Brain Gap Report (Phase 1)

Status: **DRAFT v1** · Owner: Founder + Brain WG · Governs: R115 implementation
Governing locks: R91 (Vision Lock), R111 (Architecture Lock), R113 (Registries).

---

## 1. Current Architecture (what actually exists)

Canonical owners already present in the repo (R111 §4):

| Capability | Canonical owner | Notes |
|---|---|---|
| Brain (thinking / reasoning entrypoint) | `src/lib/brain/` (`brain.functions.ts`, `engine.ts`) + `src/lib/brain-v3.functions.ts` + `src/lib/brain-v4.functions.ts` | THREE surfaces — v3 & v4 are R111 violations. |
| Memory | `src/lib/memory/` (`memory.functions.ts`, `engine.ts`) + `memory-v2/v4`, `memory-network-v12/v13`, `memory-runtime-v3` | 6 sibling files — hard violation. |
| Knowledge Graph | `src/lib/kg/` (`kg.functions.ts`, `engine.ts`) | Canonical, single owner ✅ |
| Knowledge (docs/facts) | `knowledge-v1`, `knowledge-fabric-v13`, `knowledge-graph-v12`, `knowledge-network-v16`, `knowledge-exchange-v14` | 5 siblings — violation. |
| Conversation runtime | `src/lib/happy-runtime/conversation.ts` + `happy-chat.functions.ts` + `happyx-chat.functions.ts` + `runtime-v3` + `runtime-engine-v3` | Multiple entrypoints. |
| Streaming chat transport | `src/routes/api/happy-chat.ts` (SSE) | Canonical ✅ |
| Voice STT | `src/routes/api/happy-stt.ts` + `src/lib/voice-runtime/` + `useVoiceInput.ts` | Canonical ✅ |
| Digital Human | `src/components/digital-human/HappyVRM.tsx` (+ `HappyAvatar`, `conversation-engine.ts`, `useHappySpeech`) | Canonical ✅ |
| Planner | `planner-runtime-v3` + `planning-runtime-v3` | Two siblings — violation. |
| Specialist / agent routing | `src/lib/specialist-runtime/` (`router.ts`, `engine.ts`) + `src/lib/agents/` + `agents-v4` + `agent-runtime-v2` | Fragmented. |
| Learning loop | `src/lib/learning-runtime/learning.functions.ts` | Canonical ✅ (but isolated — no writer path). |
| Workspace / Company / Brand | `workspace-v5`, `workspace-v16`, `founder-workspace`, `founder-executive`, `founder-v2` | Fragmented. |
| Builder / Automation | `builder-v1`, `app-builder`, `website-builder`, `automation-v6`, `automation-runtime-v3`, `automation-network-v13`, `workflow-runtime-v2/v3` | Heavy fragmentation. |
| AI models bridge | `LOVABLE_API_KEY` via `happy-chat.functions.ts` (SSE) | Single credential path ✅ |

## 2. Duplicate Detection (R91/R111 violations)

**Must consolidate under R115** — no new files, no `-vN` naming:

| Domain | Canonical owner | Siblings to fold in |
|---|---|---|
| Brain | `src/lib/brain/brain.functions.ts` | `brain-v3.functions.ts`, `brain-v4.functions.ts` |
| Memory | `src/lib/memory/memory.functions.ts` | `memory-v2`, `memory-v4`, `memory-runtime-v3`, `memory-network-v12`, `memory-network-v13` |
| Knowledge | `src/lib/kg/kg.functions.ts` | `knowledge-v1`, `knowledge-graph-v12`, `knowledge-fabric-v13`, `knowledge-network-v16`, `knowledge-exchange-v14` |
| Planner | `src/lib/brain/` (new `planner.ts` under Brain) | `planner-runtime-v3`, `planning-runtime-v3` |
| Conversation | `src/lib/happy-runtime/conversation.ts` | `runtime-v3`, `runtime-engine-v3`, `happyx-chat.functions.ts` |
| Specialists / agents | `src/lib/specialist-runtime/` | `agents-v4`, `agent-runtime-v2`, `src/lib/agents/*` |
| Workspace | `workspace-v16` (highest revision) | `workspace-v5`, `founder-workspace`, `founder-executive`, `founder-v2` |
| Builder / Automation | `builder-v1` + `automation-runtime-v3` | `app-builder`, `website-builder`, `automation-v6`, `automation-network-v13`, `workflow-runtime-v2/v3` |

Consolidation policy: **do not delete** the sibling file source (audit trail per R91). Instead:
1. Convert each sibling to a `deprecated` re-export shim pointing at the canonical owner.
2. Move any unique logic INTO the canonical owner first, verified by tests.
3. Grep every import site and migrate to the canonical import in the same PR.

## 3. Missing Links (what R115 must add)

The pieces that DO NOT exist yet and must be built inside the canonical Brain owner (no new runtime):

1. **Mirror Engine** — pre-response internal summary (intent + memory + knowledge + workspace check).
2. **Thinking Modes registry** — Fast, Deep, Founder, Research, Business, Education, Developer (pure selector, no new runtime).
3. **Unified Context Resolver** — one function that pulls Long / Short / Workspace / Company / Brand / Founder / Project / Learning / Conversation memory into a single typed `BrainContext`.
4. **Reasoning Pipeline orchestrator** — `Listen → Understand → Mirror → Check Memory → Check Knowledge → Reason → Plan → Verify → Respond → Execute → Learn` as a single `runBrain()` entrypoint on top of existing owners.
5. **Planner façade** — merges `planner-runtime-v3` + `planning-runtime-v3` into `brain/planner.ts`; emits Roadmap / Todo / Project / Workflow / Automation intents.
6. **Response envelope** — one typed shape carrying `text`, `emotion`, `gesture`, `eyeContact`, `voice`, `expressions`, `roadmap`, `whiteboard` for the Digital Human bus.
7. **Learning writer** — after every conversation: evaluate → improve → remember → forget (permission based). Owner: `learning-runtime` gets a `recordConversation()` fn wired from `runBrain()`.
8. **Analytics bridge** — one `brainTelemetry.emit()` call per pipeline stage (no new analytics runtime; reuses `obs_trace_spans` immutability trigger already in DB).

## 4. Performance Risks

- **Cold-start fan-out**: pulling 9 memory scopes on every turn will thrash Postgres. Mitigation: parallelize with `Promise.all`, cap top-K per scope, cache by conversation id for the session's lifetime.
- **Streaming buffering**: current `happy-chat.ts` SSE proxy is fine, but `runBrain()` must yield tokens as soon as the reasoning stage completes — Mirror must NOT block first token beyond ~200ms budget.
- **RLS query multiplication**: every memory table read is one RLS-scoped SELECT. Consolidate into a single RPC (`brain_context_bundle`) later once shapes stabilize.
- **Large context prompts**: with 9 memory scopes we risk >32k tokens. Enforce a hard budget per scope + summarizer pass on overflow.

## 5. Memory Risks

- **Duplicate writes**: `memory-v2`, `memory-v4`, and `memory-network-v13` all currently accept writes. Until consolidation lands, `runBrain()` writes ONLY through canonical `memory.functions.ts`.
- **Forget-permission drift**: no user-facing "forget" UI exists. Ship logic-only in R115; UI in R116.
- **Learning contamination**: risk of writing failed/aborted turns into long-term memory. Guard: only persist when `runBrain()` completes AND user did not immediately regenerate.

## 6. Conversation Risks

- **Two chat entrypoints** (`happy-chat.functions.ts` + `happyx-chat.functions.ts`) — divergent prompts today. R115 forces `runBrain()` as the sole entry; the older fn becomes a shim.
- **Digital Human bus**: `conversation-engine.ts` already ships gesture/posture cues. R115 wires the response envelope into it — do not add a second bus.

## 7. Future Risks

- Adding **multi-specialist parallel reasoning** (R117+) will require a coordinator. Design the pipeline so `Reason` stage can fan out to N specialists without changing surrounding stages.
- **Founder-only thinking mode** must respect the `is_platform_founder(auth.uid())` RLS helper — never a client flag.
- External voice/vision (Vision Pro, ACE) remain BLOCKED per R91 — the response envelope must include capability hooks but never require them.

---

## 8. Recommendation

Proceed to Phase 2 (Architecture v2) and Phase 3 (Pipeline wiring) in a **single canonical entrypoint** at
`src/lib/brain/brain.functions.ts::runBrain()`, backed by pure helpers in `src/lib/brain/`.
All Phase 4–10 features attach to that entrypoint; NO new runtime, NO new memory system, NO new bus.

Deprecation of the 20+ sibling files is a separate R115.b sub-milestone, gated on green tests, to avoid a big-bang breakage.
