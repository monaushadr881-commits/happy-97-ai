# Canonical Document Rule

**Status:** Canonical. Permanent. Repository is the source of truth — no hidden memory.

Every permanent feature in HAPPY X must update at least one canonical document in `docs/`. Documentation is not follow-up work — it is part of the feature.

---

## 1. Rule

- Every new permanent feature MUST update at least one canonical document in the same change.
- No permanent feature is considered **complete** until its canonical documentation is updated.
- A change that ships code without updating the corresponding canonical document is a violation, even if it typechecks and passes tests.

## 2. Required document per change type

| If the feature changes… | You MUST update |
|---|---|
| Architecture (owners, runtimes, APIs, tables, dashboards, extension rules) | [`MASTER_ARCHITECTURE_LOCK.md`](./MASTER_ARCHITECTURE_LOCK.md) |
| Founder workflow (how the Founder operates, approves, or is served) | [`founder/FOUNDER_OPERATING_RULES.md`](./founder/FOUNDER_OPERATING_RULES.md) |
| Project evolution (how features are added, versioned, or gated) | [`PROJECT_EVOLUTION_RULE.md`](./PROJECT_EVOLUTION_RULE.md) |
| Document / file / asset generation workflow | [`founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md) |
| Document lifecycle (versioning, links, deletion) | [`DOCUMENT_EVOLUTION_RULE.md`](./DOCUMENT_EVOLUTION_RULE.md) |
| Foundation scope, ONE HAPPY invariants, external BLOCKED integrations | [`MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md) |
| Registries, governance, extension order | [`founder/FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md) |
| Migration process, batching, gates | [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md) |

Multiple categories = multiple documents updated in the same change.

## 3. Required change statement

Every change description must state:

> Canonical documents updated: `<paths>`
> Reason: `<what changed in each>`

If **no** canonical document was updated, the change statement must justify why the feature is not permanent (e.g. temporary spike, docs-only reword) — silence is treated as a violation.

## 4. Interaction with the Project Evolution Rule

- This rule reinforces requirement **7** ("Documentation must be updated in the same change") and requirement **8** ("Architecture registry must be updated") of [`PROJECT_EVOLUTION_RULE.md`](./PROJECT_EVOLUTION_RULE.md).
- Satisfying this rule is necessary but not sufficient — all ten Project Evolution requirements still apply.

## 5. Prohibitions

- No "docs to follow" merges for permanent features.
- No burying architectural changes in registry files without updating the Architecture Lock.
- No updating memory, chat, or session notes in place of the canonical document.
- No stale cross-references — updates must keep the cross-reference sections of related documents accurate.

## 6. Cross references

- [`MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md)
- [`MASTER_ARCHITECTURE_LOCK.md`](./MASTER_ARCHITECTURE_LOCK.md)
- [`PROJECT_EVOLUTION_RULE.md`](./PROJECT_EVOLUTION_RULE.md)
- [`DOCUMENT_EVOLUTION_RULE.md`](./DOCUMENT_EVOLUTION_RULE.md)
- [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md)
- [`founder/FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md)
- [`founder/FOUNDER_OPERATING_RULES.md`](./founder/FOUNDER_OPERATING_RULES.md)
- [`founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md)
