# R183 Phase B — Universal HAPPY Brain™ Coverage Report

**Status:** Phase B primitive **shipped and green** (11/11 tests). Coverage rollout **in progress** — this document is the honest ledger, not a completion claim.

## What Phase B actually delivers

`withBrain()` in `src/lib/founder/enforce.ts` is the ONE canonical Brain gate for every AI entry point in the app. It:

1. Calls the canonical R115.b `runBrain()` when a supabase client + `company_id` are in scope.
2. Falls back to the pure `intent.classify` module otherwise — so the **Understand** stage runs on 100% of AI entries, including anonymous/public routes.
3. Writes exactly ONE canonical audit line (`category='r183_brain_gate'`, action=`ai_entry.<source>`) via the existing `write_audit` RPC.
4. Surfaces Mirror clarification requests so callers can short-circuit before contacting the LLM.
5. Attaches the full R171–R180 Executive Board snapshot to the result for downstream audit joins.
6. **Never throws** — AI entries stay resilient; Brain/audit are best-effort by design.

There is no second Brain, no second audit table, no second runtime. Every capability reuses the canonical owner.

## Wired sites this turn

| Entry point                                          | File                                             | Gate         | Notes                                             |
| ---------------------------------------------------- | ------------------------------------------------ | ------------ | ------------------------------------------------- |
| `/api/happy-chat` (streaming chat)                   | `src/routes/api/happy-chat.ts`                   | `withBrain`  | Clarification short-circuits as SSE reply         |
| `/api/dh/tts` (Digital Human voice out)              | `src/routes/api/dh.tts.ts`                       | `withBrain`  | Replaces old ad-hoc audit insert                  |
| `/api/happy-stt` (voice in → transcript)             | `src/routes/api/happy-stt.ts`                    | `withBrain`  | Returns intent/confidence to caller               |
| `publishApp`                                         | `src/lib/app-builder/app-builder.functions.ts`   | `withBrain`  | Personal creator scope (no company approval)      |
| `unpublishApp`                                       | `src/lib/app-builder/app-builder.functions.ts`   | `withBrain`  | Personal creator scope                            |
| `deleteApp`                                          | `src/lib/app-builder/app-builder.functions.ts`   | `withBrain`  | Personal creator scope                            |
| `rollbackApp`                                        | `src/lib/app-builder/app-builder.functions.ts`   | `withBrain`  | Personal creator scope                            |

Retained from Phase A (`requireApproval`, company-scoped):

| Company-scoped mutation                             | File                                                    |
| --------------------------------------------------- | ------------------------------------------------------- |
| `submitToStore`                                     | `src/lib/release-r64/publish-r64.functions.ts`          |
| `createRollout`                                     | `src/lib/release-r64/rollout-r64.functions.ts`          |
| `transitionRollout` (destructive transitions only)  | `src/lib/release-r64/rollout-r64.functions.ts`          |

## Honest coverage numbers

| Dimension                                        | Wired       | Total surface                | %            |
| ------------------------------------------------ | ----------- | ---------------------------- | ------------ |
| AI-entry routes (chat / voice / tts / stt)       | **3 / 3**   | 3                            | **100%**     |
| App-builder publish/rollback/delete mutations    | **4 / 4**   | 4                            | **100%**     |
| Company-scoped production release mutations      | **3 / ~12** | release-r64 targets          | ~25%         |
| Files performing DB writes (repo-wide)           | 5           | 56                           | 8.9%         |
| `requireApproval`-gated server fns (approval)    | 3           | 722 mutation call sites      | 0.4%         |
| Audit coverage (any `write_audit` in mutation)   | rising      | 722                          | not measured |

## What is NOT yet true (do not claim otherwise)

- **Not 100% mutation coverage.** 722 mutation call sites still exist; Phase B intentionally focused on the AI-entry mandate ("every AI request runs Brain first") plus the highest-consequence Builder publish/rollback/delete paths. The remaining company-scoped mutations across R60–R138 must be wired iteratively.
- **Approval is not universal.** Approval only fires for company-scoped release mutations. Personal creator actions use `withBrain` (Brain + audit) but not `requireApproval` — because the user IS the project owner, per RLS. Company/production mutations should be extended to `requireApproval` next.
- **No enforcement of a "brain-ran" invariant at the RLS/edge layer.** Coverage is source-level. A future phase should add a DB trigger that rejects mutations lacking a matching `r183_brain_gate` audit row.

## Verification

```
tests/unit/happy-r183-enforce.test.ts     6 passed
tests/unit/happy-r183-with-brain.test.ts  5 passed
──────────────────────────────────────────────────
Total                                     11/11 green
```

## Phase C (recommended, not started)

1. Wire `requireApproval` into `deployment.functions.ts` mutations (`createProjectDeployment`, `rollbackProjectDeployment`, `addProjectDomain`, `removeProjectDomain`) — these are the true production release path.
2. Wire `withBrain` into remaining AI entries: `/api/happy-voice`, creator generators (image/video/copy), Builder AI generators, automation runners.
3. Add DB trigger that requires the matching `r183_brain_gate` audit row before allowing mutations on high-risk tables.
4. Extend approval requirement to `deleteApp`, `publishApp` when project is a company workspace project.

Locks: R91 · R111 · R145 · R158 · R159 · R171–R180 · R183.
