# R183 Migration Guardrails

**Status:** Canonical. Permanent rule for every migration, refactor, and batch change in the HAPPY X repository. Repository is the source of truth.

---

## 1. Green repository is non-negotiable

- The Green repository has higher priority than coverage, velocity, or scope.
- A smaller Green repository always wins over a larger Red one.
- If the repository is Red, no new edits — only diagnosis and Founder instruction.

## 2. No repository-wide codemods

- No automated repo-wide rewrites.
- Every change is scoped, explicit, and reviewable.

## 3. Batch cap

- Maximum **20 handlers per batch**.
- A "batch" is one migration pass that must be independently verifiable.

## 4. Green gate between batches

Every batch must pass, in order, before the next batch begins:

1. Build
2. Typecheck
3. Tests

Any single failing gate blocks the next batch.

## 5. First failure = full stop

- On the first failure inside a batch: STOP.
- Do not continue to the next file.
- Do not continue to the next batch.
- Do not attempt heuristic repair.
- Report the failure and wait for Founder instruction.

## 6. Never edit a Red repository

- If the tree is not Green, edits are forbidden except for the minimum diagnostic reads needed to explain the failure.
- Restoring Green precedes all other work.

## 7. Reporting requirements

Every batch report must include:

- Files Created / Modified
- Public APIs touched
- Backward compatibility statement
- Evidence (Build/Typecheck/Test output references)
- Repository Health (Green/Red)
- Ready for next batch (yes/no)

## 8. Cross references

- [`docs/founder/FOUNDER_OPERATING_RULES.md`](./founder/FOUNDER_OPERATING_RULES.md)
- [`docs/MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md)
- [`docs/MASTER_ARCHITECTURE_LOCK.md`](./MASTER_ARCHITECTURE_LOCK.md)
- [`docs/founder/FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md)
