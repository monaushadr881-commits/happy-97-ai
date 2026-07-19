# Master Architecture Lock (R111)

**Status:** Canonical. Permanent Architecture Lock. Repository is the source of truth — no hidden memory.

---

## 1. Global prohibitions

- No new runtime.
- No duplicate AI, Memory, Workspace, Avatar, Builder, Dashboard, Table, or API.
- Versioned sibling naming (`-v2`, `-v3`, …) is frozen. No new versioned siblings.
- No new file engine, document engine, creator, or approval system introduced by later phases.

## 2. Extension rule

Every change must state which canonical owner it extends:

> *"Extends `<owner>` — no duplication."*

If no owner exists, escalate before creating one — new capabilities require Founder approval and a Constitution entry, not a fresh module.

## 3. Approval flow (R158)

- Founder approval always flows through R158.
- The sanctioned enforcement surface is `src/lib/founder/` via `src/lib/founder/index.ts`:
  - `enforceFounderApproval`
  - `withBrain`
  - `ApprovalRequiredError`
- No new approval table. No parallel approval subsystem.

## 4. Canonical owners per capability

Consult the Founder Constitution and Technical Registry for the current mapping. New work MUST extend the owner listed there:

- AI runtime → `src/lib/happy-runtime/`
- Digital Human → `src/components/digital-human/`
- Memory / Conversation → `src/lib/happy-r8x/` (existing owner per Constitution)
- Workspace / Founder capabilities → `src/lib/founder/`
- Document / File / Asset generation → `src/lib/founder/` + canonical Creator, Workspace, Knowledge, Publishing, Search, File Engine
- Approvals → R158 via `src/lib/founder/enforce.ts`

If the owner for a new capability is unclear, stop and consult the Constitution before creating anything. Every change MUST first perform the [Canonical Scan Rule](./CANONICAL_SCAN_RULE.md).

## 5. Consolidation registry

Any suspected duplicate must be consolidated into its canonical owner. A duplicate cannot be shipped even if it typechecks.

## 6. Founder-approval-required actions

- Introducing a new top-level module under `src/`.
- Introducing a new database table outside an existing migration lineage.
- Introducing a new external dependency.
- Any deviation from the guardrails in [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md).

## 7. Cross references

- [`MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md) — R91 Foundation Lock
- [`founder/FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md) — Registries + governance
- [`founder/FOUNDER_OPERATING_RULES.md`](./founder/FOUNDER_OPERATING_RULES.md) — Consolidated operating rules
- [`founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md) — R184 workflow
- [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md) — Migration guardrails
- [`CANONICAL_SCAN_RULE.md`](./CANONICAL_SCAN_RULE.md) — R185 pre-change scan procedure
