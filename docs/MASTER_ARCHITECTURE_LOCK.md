# MASTER ARCHITECTURE LOCK — R111

**Status:** LOCKED
**Effective:** immediately, permanent
**Supersedes:** any prior implicit convention
**Companion:** `docs/MASTER_CORE_VISION_LOCK.md` (R91 vision lock)

The current architecture is now the **HAPPY BASELINE**. Every future change
MUST extend it. Nothing new may be built in parallel to something that
already exists.

---

## 1. Global Prohibitions (never violate)

Do NOT create any of the following under any circumstances:

1. **No new runtime.** One HAPPY runtime — `src/lib/happy-runtime/`
   + `src/lib/happy-r80..r89/` + `src/lib/happy-cinematic/`
   + `src/lib/happy-living/`. Never add a second runtime, second engine,
   second orchestrator, second conversation loop, second event bus.
2. **No duplicate AI.** One chat surface (`src/lib/happy-chat.functions.ts`
   + `src/routes/api/happy-chat.ts` SSE). One TTS (`/api/dh/tts`). One STT
   (`/api/happy-stt`). One gateway (Lovable AI Gateway via
   `LOVABLE_API_KEY`). Never introduce a second AI provider, second chat
   endpoint, second streaming route.
3. **No duplicate Memory.** One memory system: tables `memory_items`,
   `memory_events`, `memory_links`, `memory_retention_policies`,
   `memory_access_log`, `ai_memories`, `brain_*`, `kg_*`. Never create a
   second memory table, second brain, second knowledge graph.
4. **No duplicate Workspace.** One workspace model: `workspaces`,
   `workspace_memberships`, `companies`, `brands`, `departments`,
   `business_units`, `offices`, `teams`. Never add a parallel tenancy
   model.
5. **No duplicate Avatar / Digital Human.** One mount:
   `src/components/happy-desk/HappyDesk.tsx` in `src/routes/__root.tsx`.
   Renderers under `src/components/digital-human/` (`HappyVRM`,
   `HappyAvatar`, renderer registry). Never mount a second Digital Human,
   second VRM viewer, second avatar canvas.
6. **No duplicate Builder.** One builder stack: `src/lib/app-builder/`,
   `app-builder-v1.functions.ts`, `builder-v1.functions.ts`, routes under
   `_authenticated/builder.tsx` and `apps.tsx`. Extend these — never fork.
7. **No duplicate Dashboard.** One founder dashboard, one company
   dashboard, one workspace dashboard. `dashboard-runtime-v3` +
   `dashboard-v2` are the owners. Founder surfaces live under
   `src/components/founder/` and `_authenticated/founder-*`. Never build
   a second dashboard shell.
8. **No duplicate Database Table.** If a concept exists in the schema
   (customer, invoice, memory, session, agent, listing, wallet), extend
   the existing table. Never create `customers_v2`, `invoices_new`,
   `memory_items2`, etc. New columns / new tables that reference the
   existing entity are fine; parallel copies are not.
9. **No duplicate API.** One endpoint per concern. Reuse existing
   `createServerFn` in `src/lib/*.functions.ts` and existing routes in
   `src/routes/api/`. Never publish a second endpoint that returns the
   same resource.

---

## 2. Extension Rules (how to add anything new)

Before writing a single line of code:

**R-EXT-1. Search before creating.**
`grep`/`rg` the repo for the concept (module, table, route, hook,
component). If it exists, extend it. If unsure whether it exists, assume
it does and search harder.

**R-EXT-2. Extend, do not fork.**
Add a method, a column, a prop, a variant. Never copy a file to
`*-v{N+1}.functions.ts` or `*New.tsx` to add behavior. The `-vN` naming
convention is **frozen** — no new versioned siblings.

**R-EXT-3. Facade rule.**
For every domain that has multiple `-vN` files today (see Consolidation
Registry §5), all NEW callers must import from the domain's canonical
owner (see §4). Do not import from deprecated siblings.

**R-EXT-4. One Owner per Concern.**
Every capability has exactly one owner file/folder listed in §4. Changes
to the capability MUST land in that owner. No shadow implementations
elsewhere.

**R-EXT-5. Route Rule.**
Never add a top-level slug that duplicates an existing semantic path.
Use alias redirects (see R100 pattern) if a shorter URL is required.

**R-EXT-6. Server Function Rule.**
New server-side logic goes into an existing `*.functions.ts` file for
its domain. Only create a new file when a genuinely new domain appears
(and it MUST be registered in §4 in the same PR).

**R-EXT-7. Migration Rule.**
Every migration MUST: `CREATE TABLE` → `GRANT` → `ENABLE RLS` →
`CREATE POLICY`. Every new public-schema table needs `service_role`
grant + `authenticated` grants scoped to policies. No `ALTER DATABASE`.

**R-EXT-8. Security Rule.**
Never add a `SECURITY DEFINER` function callable by `authenticated`
without an explicit `REVOKE EXECUTE FROM authenticated` + selective
`GRANT EXECUTE`. Never introduce a new unauthenticated `createServerFn`.
Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Never import
`@/integrations/supabase/client.server` at module scope of
`*.functions.ts`.

**R-EXT-9. Storage Rule.**
All uploads route through the (future) canonical buckets
`creator-assets`, `cms-media`, `vrm-assets`, `happy-assets`. Never
create ad-hoc buckets.

**R-EXT-10. Test Rule.**
Every new capability MUST land with unit tests in `tests/unit/`.
Existing 411 tests must continue to pass.

**R-EXT-11. Duplication PR Block.**
A PR that introduces any of the following is REJECTED without review:
- a second file with `-v{N+1}` naming
- a second mount of `HappyDesk` / `HappyVRM` / `HappyAvatar`
- a table whose columns overlap ≥60% with an existing table
- a new `/api/*` route whose response overlaps an existing endpoint
- a new page route that renders an existing feature under a new slug
  (aliases via redirect are allowed)

---

## 3. Runtime & Framework Lock

- **Framework:** TanStack Start v1 + Vite 7 + React 19 + Tailwind v4.
- **Backend:** Supabase (Lovable Cloud). No edge functions — use
  `createServerFn` for app logic, `src/routes/api/` for HTTP endpoints,
  `src/routes/api/public/*` for external callers.
- **Auth:** Supabase auth + `_authenticated/route.tsx` gate + Google
  OAuth via `lovable.auth.signInWithOAuth`.
- **AI:** Lovable AI Gateway (`LOVABLE_API_KEY`) — one client, one key.
- **Testing:** Vitest for unit, Playwright for E2E.
- **Types:** Strict TypeScript. `tsgo` for typechecks.

Changing any item above requires a new Founder Directive that supersedes
this lock explicitly.

---

## 4. Canonical Owners (single source of truth per capability)

| Capability | Owner |
|---|---|
| HAPPY mount | `src/components/happy-desk/HappyDesk.tsx` |
| HAPPY runtime | `src/lib/happy-runtime/` + `happy-r80..r89/` |
| Digital Human renderer | `src/components/digital-human/HappyVRM.tsx`, `HappyAvatar.tsx` |
| Renderer registry | `src/components/digital-human/renderers/` |
| Conversation engine | `src/components/digital-human/conversation-engine.ts` |
| Voice input | `src/components/digital-human/useVoiceInput.ts` |
| Speech / TTS | `src/components/digital-human/useHappySpeech.ts` + `src/routes/api/dh.tts.ts` |
| STT fallback | `src/routes/api/happy-stt.ts` |
| Chat | `src/lib/happy-chat.functions.ts` + `src/routes/api/happy-chat.ts` |
| Streaming parser | `src/lib/happy-stream.ts` |
| Memory / Brain | `src/lib/brain/`, `brain-v4.functions.ts`, `memory-v*` (see §5 for consolidation) |
| Workspace / tenancy | `workspaces`, `workspace_memberships`, `companies` |
| Builder | `src/lib/app-builder/` + `builder-v1.functions.ts` + `app-builder-v1.functions.ts` |
| Creator Studio | `src/lib/creator-v1.functions.ts` + `src/components/creator/` |
| CRM | `src/lib/crm/` + `crm-*.functions.ts` + `_authenticated/business.crm.tsx` |
| ERP (finance/inventory/mfg) | `business-v1.functions.ts` + `_authenticated/business.*.tsx` |
| HRMS | `_authenticated/business.hr.tsx` + `employees` table |
| Credits | `src/lib/credits/` + `credit_ledger_entries` (immutable) |
| Subscriptions | `subscriptions` + `subscription_events` (immutable) |
| Cron | `src/routes/api/public/cron/*` + `CRON_SHARED_SECRET` |
| Webhooks | `src/routes/api/public/webhooks/*` |
| Security helpers | `src/lib/security/` |
| Adapters (external) | `src/lib/happy-adapters/` |

Any capability not listed here MUST be added to this table in the same
PR that introduces it.

---

## 5. Consolidation Registry (technical debt, must not grow)

The following domains currently have multiple `-vN` siblings. This is
**frozen debt** — no new versions may be added. New callers MUST import
the canonical owner (highest version). Older versions are deprecated in
place and only removed via an explicit consolidation PR.

| Domain | Canonical | Deprecated (do not extend) |
|---|---|---|
| brain | `brain-v4.functions.ts` | `brain-v3.functions.ts` |
| billing | `billing-v5.functions.ts` | `billing-v4.functions.ts` |
| cloud | `cloud-v5.functions.ts` | `cloud-v4.functions.ts` |
| analytics | `analytics-v7.functions.ts` | `analytics-v5.functions.ts` |
| communication(s) | `communications-v16.functions.ts` | `communication-v6/v15` |
| collaboration | `collaboration-v13.functions.ts` | `collaboration-v2/v12`, `collaboration-runtime-v3` (runtime kept for runtime concerns only) |
| ecosystem (×5), theme/search/observability/intelligence/experience (×3 each), workspace/workflow/supplychain/skills/research/personalization/orchestration/network/multimodal/memory/memory-network/manufacturing/governance/education/digital-twin/developer/deployment/decision (×2 each) | highest `-vN` | all lower `-vN` |

Adding a new `-vN` to any of the above is a **hard block**.

---

## 6. Founder-Approval-Required Actions

The following require an explicit new Founder Directive:
- Adding a new top-level `src/lib/*` domain not in §4
- Adding a new `/api/*` route family
- Adding a new database table for a concept that already exists
- Changing the framework, auth provider, or AI gateway
- Removing or deprecating any Foundation module (R1–R91)
- Mounting a second HAPPY instance for any reason
- Deleting or rewriting any `-vN` file (must be a consolidation PR)

---

## 7. Enforcement

- Every PR description MUST state: "Extends `<owner>` — no duplication."
- Reviewers reject PRs that violate §1, §2, §5, or §6.
- `docs/MASTER_CORE_VISION_LOCK.md` (R91) + this file (R111) together
  form the permanent engineering contract.
- When rules here conflict with an older doc, this file wins.

---

**End of R111 Architecture Lock.**

---

## Addendum R153 — Founder Unlimited Privileges™

Canonical governance helper: `src/lib/founder/unlimited-policy.ts`. Consumed
by the existing Credits / Subscription / Wallet / Revenue OS / Payment
Runtime / Permissions owners. No new runtime, no V2 of billing, credits,
subscription, wallet, or founder runtime. Founder identity comes exclusively
from the canonical `public.is_platform_founder` function + `user_roles.role='founder'`.
Full record: `docs/founder/R153_FOUNDER_UNLIMITED_PRIVILEGES.md`.

---

## Addendum R156 — Founder Identity Fortress™

Canonical governance helper: `src/lib/founder/identity-fortress.ts`. Consumed
by existing Happy ID owners (`src/lib/happy-id.functions.ts`, `src/lib/happy-id/*`),
canonical RBAC (`public.user_roles` + `public.is_platform_founder`), and
`write_audit(...)`. No new auth runtime, no duplicate OTP/session/identity
module. Founder role is UI-immutable — only the Happy ID Founder-verified
recovery flow may update Founder identity. Full record:
`docs/founder/R156_FOUNDER_IDENTITY_FORTRESS.md`.
