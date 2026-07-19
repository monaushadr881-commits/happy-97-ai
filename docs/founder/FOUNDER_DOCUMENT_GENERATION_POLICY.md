# Founder Document Generation Policy

**Status:** Canonical. Permanent rule for every Founder-requested document, file, or asset. Repository is the source of truth — no hidden memory.

Applies whenever the Founder requests any document, file, asset, publishing material, legal document, business document, marketing material, or store submission material.

---

## 1. Mandatory workflow

Every generation request must follow this pipeline in order:

```text
Founder Request
  → Understand
  → Brain (src/lib/founder/with-brain.ts)
  → Check existing Workspace
  → Check existing Templates (src/lib/founder/template-registry.ts)
  → Check Founder Memory (repository docs only)
  → Reuse existing assets if available
  → Generate Preview
  → Founder Review
  → Founder Approval (R158 — src/lib/founder/enforce.ts)
  → Generate Final File
  → Store in canonical Workspace
  → Version it
  → Audit it
  → Publish ONLY after Founder approval
```

No step may be skipped. No shortcut path.

## 2. Reuse-only architecture

- Reuse the canonical Workspace, Creator, Knowledge, Publishing, Search, and File Engine.
- No new file engine.
- No new document engine.
- No new creator.
- No new approval system.
- No v2 of any of the above.
- New document types are added by extending `TEMPLATE_REGISTRY` in `src/lib/founder/template-registry.ts`, never by inventing a parallel registry.

## 3. Required metadata

Every generated file must carry the full metadata envelope defined in `src/lib/founder/document-metadata.ts` (`DocumentMetadata`):

| Field | Meaning |
|---|---|
| `id` | Canonical document identifier |
| `version` | Semantic version. Versioning-only — never overwrite |
| `owner` | Human/entity that owns the document |
| `createdBy` | Actor that produced this version |
| `template` | `TemplateId` used, or `TODO` |
| `workspaceLocation` | Pointer into canonical Workspace |
| `knowledgeTags` | Searchable tags for Knowledge + Search |
| `audit.auditId` | Canonical audit log reference |
| `audit.approvalId` | R158 approval reference — never a new table |
| `generator` | Canonical `DocumentGeneratorSource` |
| `source` | Origin request/reference, or `TODO` |
| `category` | Canonical `DocumentCategory` |
| `format` | Canonical `DocumentFormat` |
| `status` | Canonical `DocumentStatus` |
| `createdAt` / `updatedAt` | ISO timestamps |
| `previousVersionId` | Prior version, or `TODO` for the first |

Unknown values must be written as `TODO` (see `TODO` sentinel in `document-metadata.ts`). Never fabricate.

## 4. Status model

Canonical lifecycle (`src/lib/founder/document-status.ts`):

```text
draft → preview → waiting_approval → approved → generated → published
```

Terminal branches: `archived`, `rejected`. Transitions are declared in `DOCUMENT_STATUS_TRANSITIONS`; enforcement flows through R158 for `waiting_approval → approved`.

## 5. Prohibitions

- Never auto-publish.
- Never auto-submit to any store.
- Never overwrite an existing version. New content = new version.
- Never generate duplicate documents. Reuse existing assets when found.
- Never fabricate data. Unknown = `TODO`.
- Never store credentials or live submission payloads. Store submissions themselves remain external/BLOCKED per the Core Vision Lock.

## 6. Discoverability

Every generated file must become searchable inside:

- Workspace
- Knowledge
- Search
- Founder Dashboard

Producers must populate `knowledgeTags` and register the `workspaceLocation` so downstream indexers can attach without special-casing.

## 7. Publishing catalog

Publishing materials for Google Play and Apple App Store are declared in `src/lib/founder/publishing-catalog.ts`. This catalog defines materials only — never credentials, never live submission. Every publishing asset requires Founder approval.

## 8. Cross references

- [`FOUNDER_OPERATING_RULES.md`](./FOUNDER_OPERATING_RULES.md)
- [`FOUNDER_CONSTITUTION.md`](./FOUNDER_CONSTITUTION.md)
- [`../MASTER_CORE_VISION_LOCK.md`](../MASTER_CORE_VISION_LOCK.md)
- [`../MASTER_ARCHITECTURE_LOCK.md`](../MASTER_ARCHITECTURE_LOCK.md)
- [`../R183_MIGRATION_GUARDRAILS.md`](../R183_MIGRATION_GUARDRAILS.md)
- Code surface: `src/lib/founder/index.ts` (only sanctioned import path)
