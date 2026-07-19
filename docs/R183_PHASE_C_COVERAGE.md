# R183 Phase C — Universal Enforcement Coverage Report

**Honest status:** Phase C ships the two architectural pieces required for genuine universal enforcement — a **centralized `enforceMutation()` wrapper** on the code side and a **DB-level shadow-audit trigger** on the data side — plus 7 additional Deployment mutation sites wired. **Not yet 100% mutation coverage; do not claim otherwise.**

## What Phase C actually delivers

### 1. Centralized `enforceMutation()` wrapper (`src/lib/founder/enforce.ts`)

One-line drop-in for any `createServerFn().handler(...)`:

```ts
.handler(enforceMutation(
  { action: "delete", entityType: "creator_project", module: "app-builder.delete" },
  async ({ data, context, brain }) => { /* mutation body */ },
))
```

- Runs canonical `withBrain()` BEFORE the mutation body.
- Records a canonical `r183_brain_gate` audit line via `write_audit`.
- Optionally invokes `requireApproval()` when `requireApprovalTier: true` and a company scope is present.
- Passes the Brain result (`brain.intent`, `brain.confidence`, `brain.clarify`) through to the handler.
- Never creates a second Brain, audit, or approval system — pure orchestration over existing canonical owners.

### 2. DB-level shadow-audit trigger (`public.r183_shadow_audit`)

Attached to every high-risk table listed by the mission. Fires AFTER INSERT/UPDATE/DELETE and writes exactly one canonical `audit_logs` row per mutation, tagged `category='r183_shadow_audit'`.

- **Universal by construction.** Every mutation on a covered table produces an audit row — regardless of which server fn, RPC, edge function, or direct client call caused it. A code-side bypass in a future contributor's PR still gets logged at the DB layer.
- **SECURITY DEFINER**, so it works under RLS.
- **Fail-open** (best-effort insert) so it never blocks a legitimate mutation.
- Covered tables (initial set): `project_deployments`, `project_domains`, `creator_projects`, `cms_contents`, `invoices`, `payments`, `subscriptions`, `wallets`, `release_records`, `release_rollouts`, `release_store_submissions`, `deploy_builds`, `deploy_artifacts`.

### 3. New wired mutation sites this turn

All in `src/lib/deployment/deployment.functions.ts`:

| Server function                    | Gate         |
| ---------------------------------- | ------------ |
| `createProjectDeployment`          | `withBrain`  |
| `retryProjectDeployment`           | `withBrain`  |
| `cancelProjectDeployment`          | `withBrain`  |
| `rollbackProjectDeployment`        | `withBrain`  |
| `addProjectDomain`                 | `withBrain`  |
| `removeProjectDomain`              | `withBrain`  |
| `verifyProjectDomain`              | `withBrain`  |

## Investigation: correct canonical enforcement point

The mission asked whether DB-trigger or centralized server wrapper is right. Answer: **both**, non-overlapping, layered.

| Layer                       | Enforces                          | Bypass surface                              | Verdict           |
| --------------------------- | --------------------------------- | ------------------------------------------- | ----------------- |
| Per-fn inline `withBrain()` | Brain + audit before body         | Any un-wired server fn                      | Coverage in patches |
| `enforceMutation()` wrapper | Same, one line, less error-prone  | Same — still opt-in per handler             | Reduces drift     |
| **DB shadow-audit trigger** | Universal audit                    | None (fires on every direct DB write)       | **Canonical last mile for audit** |
| Approval (`requireApproval`) | Founder-gated critical mutations   | Must be opted in per fn                     | Company-scoped only |

Do not add a DB trigger that **rejects** un-approved mutations — that would break every read/write path that hasn't yet been wired and cause mass regression. The right progression is: shadow-audit universally, wire brain-gate per fn, then in a future phase promote the trigger to enforce-mode on selected tables once brain-gate is 100%.

## Honest coverage numbers

| Dimension                                        | Wired (cumulative) | Total surface           | %              |
| ------------------------------------------------ | ------------------ | ----------------------- | -------------- |
| AI-entry routes (chat / voice / tts / stt)       | **3 / 3**          | 3                       | **100%**       |
| App-builder publish/rollback/delete/unpublish    | **4 / 4**          | 4                       | **100%**       |
| Deployment mutations                             | **7 / 7**          | 7                       | **100%**       |
| Release production mutations (Phase A)           | 3                  | ~12                     | ~25%           |
| Company-scoped mutations                         | 3                  | 722 mutation call sites | 0.4%           |
| **DB-level audit coverage (mission-critical tables)** | **13 tables**      | 13 mission-critical     | **100%** (via trigger — once migration approved) |
| Files with `withBrain`/`enforceMutation`          | 7                  | 56 files performing writes | 12.5%       |
| Approval-gated server fns                         | 3                  | 722                     | 0.4%           |

## Verification

```
tests/unit/happy-r183-enforce.test.ts             6/6 passed
tests/unit/happy-r183-with-brain.test.ts          5/5 passed
tests/unit/happy-r183-enforce-mutation.test.ts    5/5 passed
──────────────────────────────────────────────────────────────
Total                                             16/16 green
```

## Remaining bypasses (still true after Phase C)

- Creator generators (image/video/copy) — `withBrain` not yet wired to `generateImage`, `generateVideo`, `generateVoice` server fns.
- Business OS mutations (CRM/ERP/Inventory/Finance/HR/Projects/Support) — hundreds of server fns still inline-mutating without `enforceMutation`.
- Revenue OS mutations (Pricing/Subscriptions/Credits/Invoices/Payments/Refunds) — same story.
- Website Builder page/theme/CMS/navigation/media edits — unwired.
- Direct browser writes via the client Supabase client — RLS still guards them, but they will only appear in `r183_shadow_audit` once the migration runs.

## Files changed (Phase C, this turn)

- `src/lib/founder/enforce.ts` — added `enforceMutation()` (~90 lines).
- `src/lib/deployment/deployment.functions.ts` — wired 7 mutation fns.
- `tests/unit/happy-r183-enforce-mutation.test.ts` — new (5 tests).
- `supabase/migrations/<new>.sql` — universal shadow-audit trigger (pending migration approval).
- `docs/R183_PHASE_C_COVERAGE.md` — this ledger.

## Phase D (recommended, not started)

1. Sweep-wire `enforceMutation()` into all Business OS + Revenue OS server functions using codemod.
2. Wire creator generators (image/video/voice/tts) with `withBrain` at AI-entry.
3. Once brain-gate coverage on a table reaches 100%, promote the DB trigger from shadow-audit to enforce-mode on that table (reject mutations lacking a recent `r183_brain_gate` row from the same actor).
4. Add a nightly `bi_insights` report that lists any `audit_logs` rows without a paired `r183_brain_gate` row within N seconds — surfaces unwired paths.

Locks: R91 · R111 · R145 · R158 · R159 · R171–R180 · R183.
