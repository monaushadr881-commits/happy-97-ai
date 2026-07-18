# `_archive/vN` — Legacy Ring Dumps (R145 Wave C)

**Do not import from this directory.**

These 194 files are legacy `-vN.functions.ts` ring dumps that had **zero
external references** at the R135 audit and were physically relocated in
R145 Wave C to end the visual noise in `src/lib/`. They remain on disk per
the Founder Lock (`R91` / `R111`): no file is ever deleted.

## Rules

- **Import ban:** Nothing under `src/` imports from `src/lib/_archive/**`.
  Any new import from this path is a build/lint failure.
- **No edits:** Files here are frozen. If a capability from an archived
  file is needed again, port it into the canonical owner listed in
  `docs/R135_SIBLING_CLASSIFICATION.md`.
- **Scanner ignore:** Registries (`docs/technical/`), duplication scans,
  and the R144 `scanForDuplicateRuntimes` helper skip this directory.

## Restoration procedure (Founder-approved only)

1. Copy — do not move — the relevant symbols into the canonical owner.
2. Add tests that exercise the ported behaviour.
3. Leave the archived file untouched.

## Provenance

Classification rationale, external-ref counts, and canonical-owner mapping
per file: `docs/R135_SIBLING_CLASSIFICATION.md` §7B.
Execution log: `docs/R145_CONSOLIDATION_EXECUTION.md`.
