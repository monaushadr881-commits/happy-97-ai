/**
 * R183 Phase A — Founder Foundation Public API
 *
 * The ONLY sanctioned import surface for the Founder enforcement
 * primitive and Brain wrapper. Downstream phases must import from
 * "@/lib/founder" — never reach into internal files.
 */

export {
  ApprovalRequiredError,
  isApprovalRequiredError,
  type ApprovalRequiredReason,
} from "./errors";

export {
  enforceFounderApproval,
  evaluateFounderApproval,
} from "./enforce";

export { withBrain, type WithBrainOptions } from "./with-brain";

export type {
  BrainHandler,
  BrainRequest,
  BrainResult,
  FounderApprovalContext,
  FounderApprovalDecision,
  FounderApprovalRequest,
  FounderCapability,
} from "./types";

// R184 Batch 1 — Founder Document & Publishing Studio (foundation only).
export {
  DOCUMENT_FORMATS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_FORMAT_MIME,
  DOCUMENT_FORMAT_EXTENSION,
  isDocumentFormat,
  isDocumentCategory,
  type DocumentFormat,
  type DocumentCategory,
} from "./document-types";

export {
  DOCUMENT_STATUSES,
  TERMINAL_DOCUMENT_STATUSES,
  DOCUMENT_STATUS_TRANSITIONS,
  isDocumentStatus,
  isTerminalDocumentStatus,
  canTransitionDocumentStatus,
  type DocumentStatus,
} from "./document-status";

export {
  TODO,
  isTodo,
  knownOrTodo,
  type Todo,
  type Known,
  type DocumentGeneratorSource,
  type WorkspaceLocationRef,
  type DocumentVersion,
  type DocumentAuditRefs,
  type DocumentMetadata,
} from "./document-metadata";

export {
  TEMPLATE_REGISTRY,
  listTemplates,
  getTemplate,
  listTemplatesByCategory,
  type TemplateId,
  type TemplateField,
  type TemplateDefinition,
} from "./template-registry";

export {
  STORE_TARGETS,
  PUBLISHING_ASSET_KINDS,
  PUBLISHING_CATALOG,
  listPublishingAssets,
  getPublishingAsset,
  isStoreTarget,
  isPublishingAssetKind,
  type StoreTarget,
  type PublishingAssetKind,
  type PublishingAssetDefinition,
} from "./publishing-catalog";

// R183 Batch A — Canonical Audit Writer (thin re-export of auditRepo).
export {
  writeCanonicalAudit,
  type CanonicalAuditEntry,
  type CanonicalAuditSeverity,
} from "./audit";
