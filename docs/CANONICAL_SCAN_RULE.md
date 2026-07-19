# Canonical Scan Rule (R185)

**Status:** PERMANENT — applies to every change, every phase, every agent.

Before creating **any** new:

- table (schema, view, enum, trigger)
- runtime (server function, edge function, worker, background job)
- folder (`src/**`, `docs/**`, `supabase/**`)
- module (service, provider, hook, route, component library, API surface)

the agent MUST first perform a **Repository Canonical Scan**.

---

## 1. Scan procedure

1. Grep the repository for the capability keyword across:
   - `src/lib/**` (server functions, domain composers)
   - `src/services/**` (domain services)
   - `src/ops/**` (operational services)
   - `src/routes/**` (page + api routes)
   - `src/components/**` (UI owners, especially `happy-desk`, `digital-human`)
   - `supabase/migrations/**` (existing tables/policies)
2. Consult the canonical registries in the repository (the ONLY source of truth):
   - `docs/MASTER_ARCHITECTURE_LOCK.md` §4 — canonical owners per capability
   - `docs/founder/FOUNDER_CONSTITUTION.md` — 502 founder modules
   - `docs/MASTER_CORE_VISION_LOCK.md` — locked foundation modules (R1–R91)
   - `docs/PROJECT_EVOLUTION_RULE.md` — ten evolution requirements
3. Do NOT rely on any hidden, persistent, or session AI memory. The repository is the sole source of truth; any rule not written in `docs/` does not exist.

## 2. Decision matrix

| Scan result | Required action |
|---|---|
| Canonical owner **exists** | **Reuse or extend** the owner in place. No new file. |
| Owner exists but is **misplaced / duplicated** | Consolidate into the canonical owner. Do not add a third. |
| **No** canonical owner exists | Propose a new artifact **with justification**, wait for Founder approval, then create. |

## 3. Change statement (mandatory)

Every code change MUST include, in the response:

> **Canonical scan:** searched `<paths/keywords>`.
> **Owner found:** `<path>` — *reusing/extending*.
> — or —
> **Owner found:** none — *new artifact justified because <reason>, approval requested*.

Missing this statement = the change is rejected under the Project Evolution Rule (requirement 1: reuse canonical owner).

## 4. Prohibited without scan

- New `createServerFn` file
- New `supabase/migrations/*.sql`
- New folder under `src/`
- New route tree
- New provider / context / hook that overlaps an existing one
- New dashboard, table, API version, or runtime

## 5. Relationship to other rules

- Feeds **Project Evolution Rule** requirement 1 (reuse canonical owner) and requirements 2–5 (no duplicate runtime/API/table/dashboard).
- Feeds **Canonical Document Rule** — the scan itself must be recorded.
- Overrides speed: a slower, honest reuse always beats a faster duplicate.

---

**Ratified:** R185. Applies retroactively to every future batch, including
remaining R183 / R184 work.
