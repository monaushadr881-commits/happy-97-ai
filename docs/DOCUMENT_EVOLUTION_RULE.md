# Document Evolution Rule

**Status:** Canonical. Permanent. Repository is the source of truth — no hidden memory.

Governs the lifecycle of every document, file, and asset produced under [`FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./FOUNDER_DOCUMENT_GENERATION_POLICY.md).

---

## 1. Core principles

- A document is **never replaced**.
- A document is **never overwritten**.
- A document **evolves only through versions**.

Any change to content, metadata, or approval state produces a **new version** of the same logical document — the prior version remains intact and reachable.

## 2. Version preservation

Every version MUST preserve, unaltered, its links to:

| Link | Canonical source |
|---|---|
| Metadata | `DocumentMetadata` in `src/lib/founder/document-metadata.ts` |
| Audit | `DocumentAuditRefs.auditId` — canonical audit log |
| Approval | `DocumentAuditRefs.approvalId` — R158 approval, never a new table |
| History | `previousVersionId` chain back to the first version |
| Workspace Link | `workspaceLocation` — canonical Workspace |
| Knowledge Link | `knowledgeTags` — canonical Knowledge + Search |
| Publishing Link | Publishing catalog reference when applicable (`src/lib/founder/publishing-catalog.ts`) |
| Creator Link | Canonical HAPPY Creator generation reference when applicable |
| Founder Link | `owner` / `createdBy` and any Founder approval reference |

A new version that drops or forges any of these links is a violation, even if it typechecks.

## 3. Searchability is permanent

- Every generated document remains searchable **forever** inside Workspace, Knowledge, Search, and the Founder Dashboard.
- Archived and superseded versions remain indexed. Search results must be able to surface them with a version indicator.
- Producers must populate `knowledgeTags` and `workspaceLocation` on every version so downstream indexers attach without special-casing.

## 4. Deletion is logical

- Deletion is performed by transitioning `status` to `archived` (see `DOCUMENT_STATUS_TRANSITIONS` in `src/lib/founder/document-status.ts`).
- Logical deletion preserves all links, all history, and full searchability.
- No code path may hard-delete a document row, blob, or index entry as part of normal operation.

## 5. Physical deletion requires Founder approval

- Physical deletion (removing rows, blobs, or index entries) is a Founder-approval-required action.
- Approval always flows through **R158** via `src/lib/founder/enforce.ts` — never a new approval system.
- A physical deletion request must record:
  - Document `id` and every affected `version`
  - Reason for physical deletion
  - R158 `approvalId`
  - Audit entry marking the deletion as physical, not logical

Without a valid R158 approval, physical deletion is prohibited.

## 6. Prohibitions

- Never overwrite an existing version's bytes.
- Never mutate an existing version's metadata after it is written (except to update `updatedAt` on status transitions, which itself produces an audit entry).
- Never remove a version from search or workspace listing outside the Founder-approved physical deletion path.
- Never break the `previousVersionId` chain.

## 7. Cross references

- [`founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md`](./founder/FOUNDER_DOCUMENT_GENERATION_POLICY.md) — Generation workflow + metadata schema
- [`founder/FOUNDER_OPERATING_RULES.md`](./founder/FOUNDER_OPERATING_RULES.md) — Consolidated operating rules
- [`founder/FOUNDER_CONSTITUTION.md`](./founder/FOUNDER_CONSTITUTION.md) — Registries + governance
- [`MASTER_CORE_VISION_LOCK.md`](./MASTER_CORE_VISION_LOCK.md) — R91 Foundation Lock
- [`MASTER_ARCHITECTURE_LOCK.md`](./MASTER_ARCHITECTURE_LOCK.md) — R111 Architecture Lock
- [`PROJECT_EVOLUTION_RULE.md`](./PROJECT_EVOLUTION_RULE.md) — Ten-requirement change rule
- [`R183_MIGRATION_GUARDRAILS.md`](./R183_MIGRATION_GUARDRAILS.md) — Migration guardrails
