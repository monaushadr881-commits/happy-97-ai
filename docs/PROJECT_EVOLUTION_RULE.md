# Project Evolution Rule

**Status:** Canonical. Permanent. Repository is the source of truth — no hidden memory.

Every new feature in HAPPY X must satisfy **ALL ten** of the requirements below. A change that fails any one requirement must not be merged, even if it typechecks.

---

## The ten requirements

1. **Reuse existing canonical owner.** Perform a [Canonical Scan](./CANONICAL_SCAN_RULE.md) first, then extend the owner listed in [`MASTER_ARCHITECTURE_LOCK.md`](./MASTER_ARCHITECTURE_LOCK.md) §4. If no owner exists, stop and escalate — do not invent one.
2. **Never create duplicate runtime.** One HAPPY, one runtime. See [`MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md).
3. **Never create duplicate API.** Extend the existing `*-v1.functions.ts` surface or its canonical successor. No parallel API layer.
4. **Never create duplicate database table.** Extend the existing table lineage; new tables require Founder approval and a Constitution entry.
5. **Never create duplicate dashboard.** Extend the existing dashboard route/module. No parallel Founder / Ops / Business dashboards.
6. **Never create V2 unless Founder explicitly approves.** Versioned sibling naming (`-v2`, `-v3`, …) is frozen per the Architecture Lock. Explicit written Founder approval is required to unfreeze it.
7. **Documentation must be updated in the same change.** Any behaviour, rule, owner, or contract change updates the relevant file(s) in `docs/` in the same commit as the code.
8. **Architecture registry must be updated.** Reflect the change in the appropriate registry — Founder Registry (`docs/founder/FOUNDER_REGISTRY.md`), Technical Registry (`docs/technical/`), or Feature Registry (`docs/features/`) — per [`FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md).
9. **Founder Dashboard visibility must be verified.** Every operational surface the Founder needs to observe must be reachable from the Founder Command Center. Verify before declaring the change complete.
10. **Build + Typecheck must remain GREEN.** Non-negotiable. See [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md) — Green > coverage, first failure = full stop.

## Canonical document update (required)

Requirement 7 is enforced by the [Canonical Document Rule](./CANONICAL_DOCUMENT_RULE.md): every permanent feature MUST update at least one canonical document in the same change, and the change description MUST list which documents were updated and why. No permanent feature is complete until its canonical documentation is updated.

## Required PR / change statement

Every change must include the following statement in its description:

> Extends `<canonical owner>` — no duplication.
> Requirements satisfied: 1 2 3 4 5 6 7 8 9 10.

If any requirement is inapplicable, state why explicitly. Silent omissions are treated as violations.

## Cross references

- [`MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md) — R91 Foundation Lock
- [`MASTER_ARCHITECTURE_LOCK.md`](./MASTER_ARCHITECTURE_LOCK.md) — R111 Architecture Lock
- [`founder/FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md) — R113 Registries + governance
- [`founder/FOUNDER_OPERATING_RULES.md`](./founder/FOUNDER_OPERATING_RULES.md) — Consolidated operating rules
- [`founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md) — R184 permanent workflow
- [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md) — Migration guardrails
