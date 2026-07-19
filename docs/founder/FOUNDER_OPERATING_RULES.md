# Founder Operating Rules

**Status:** Canonical. Repository is the source of truth. Do not rely on hidden AI memory, persistent memory, or conversation memory.

This document records the permanent operating rules that govern every HAPPY X change. Any new developer or AI agent must be able to read this file and operate correctly without access to prior conversations.

---

## 1. Repository is the only canonical memory

- The repository — code, migrations, and files under `docs/` — is the sole source of truth.
- Rules do not exist unless they are written into the repository.
- No agent may claim "saved to persistent memory" as a substitute for repository documentation.
- Any rule discovered outside the repository must be committed to `docs/` before it is acted on.

## 2. ONE HAPPY

- Exactly one HAPPY assistant. Single mount: `src/components/happy-desk/HappyDesk.tsx` in `src/routes/__root.tsx`.
- No second assistant, second runtime, second memory system, second conversation engine, or second Digital Human.
- Behaviour lives under `src/lib/happy-r80/` … `src/lib/happy-r89/`, `src/lib/happy-runtime/`, `src/lib/happy-cinematic/`, `src/lib/happy-living/`, `src/components/digital-human/`.
- Before adding new logic for any Foundation capability, grep the paths above and extend the canonical owner.

## 3. Foundation Lock (R91)

- Every module produced in R1 – R90 plus the R91 conversation is permanent Foundation.
- Foundation may be improved, extended, or integrated. It may not be removed, downgraded, rewritten from scratch, or duplicated.
- See [`MASTER_CORE_VISION_LOCK.md`](../MASTER_CORE_VISION_LOCK.md).

## 4. Architecture Lock (R111)

- No new runtime.
- No duplicate AI, Memory, Workspace, Avatar, Builder, Dashboard, Table, or API.
- Extend the canonical owner listed in the Architecture Lock §4.
- Versioned sibling naming (`-v2`, `-v3`, …) is frozen. No new versioned siblings.
- Every change must state which canonical owner it extends: *"Extends `<owner>` — no duplication."*
- See [`../MASTER_ARCHITECTURE_LOCK.md`](../MASTER_ARCHITECTURE_LOCK.md).

## 5. Registries (R113)

- **Founder Registry** — 502 Founder Modules in `docs/founder/FOUNDER_REGISTRY.md`. Business-owned, never auto-generated.
- **Technical Registry** — auto-scanned under `docs/technical/`.
- **Feature Registry** — bridges Founder + Technical under `docs/features/`.
- Governance is defined in [`FOUNDER_CONSTITUTION.md`](./FOUNDER_CONSTITUTION.md).
- Extension order R114 – R130 lives in `docs/IMPLEMENTATION_ROADMAP.md`.

## 6. Truthful reporting

- Never claim "100%", "Production Ready", "Certified", or "Complete" unless verified by tests in the repository.
- Only external dependencies (Live2D, MetaHuman, Audio2Face, NVIDIA ACE, Vision Pro, streaming voice, rigged avatar assets, native store credentials, payment/email/push providers) may remain BLOCKED.
- Never fabricate values. Unknown values must be written as `TODO`.

## 7. Founder file & asset generation

- Every Founder-requested document, file, or asset follows the workflow in [`FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./FOUNDER_DOCUMENT_GENERATION_POLICY.md).
- Never auto-publish. Never auto-submit. Never overwrite versions.
- Reuse only the canonical Workspace, Creator, Knowledge, Publishing, Search, and File Engine. No new file engine, document engine, creator, or approval system. No v2.

## 8. Migration guardrails (R183)

- Full text: [`../R183_MIGRATION_GUARDRAILS.md`](../R183_MIGRATION_GUARDRAILS.md).
- No repository-wide codemods.
- Maximum 20 handlers per batch.
- Every batch must pass Build + Typecheck + Tests before the next batch begins.
- First failure = full stop. No heuristic repair. Never edit a red repository.
- Green repository > coverage, always.

## 9. Approval flow (R158)

- Founder approval always flows through R158.
- No new approval tables, no new approval subsystem.
- The Phase A primitives in `src/lib/founder/` (`enforceFounderApproval`, `withBrain`, `ApprovalRequiredError`) are the only sanctioned enforcement surface.

## 10. Project Evolution Rule

- Every new feature must satisfy all ten requirements in [`../PROJECT_EVOLUTION_RULE.md`](../PROJECT_EVOLUTION_RULE.md).
- Silent omission of any requirement is a violation.

## 11. Cross references

- [`MASTER_CORE_VISION_LOCK.md`](../MASTER_CORE_VISION_LOCK.md)
- [`MASTER_ARCHITECTURE_LOCK.md`](../MASTER_ARCHITECTURE_LOCK.md)
- [`FOUNDER_CONSTITUTION.md`](./FOUNDER_CONSTITUTION.md)
- [`FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./FOUNDER_DOCUMENT_GENERATION_POLICY.md)
- [`../R183_MIGRATION_GUARDRAILS.md`](../R183_MIGRATION_GUARDRAILS.md)
- [`../PROJECT_EVOLUTION_RULE.md`](../PROJECT_EVOLUTION_RULE.md)
