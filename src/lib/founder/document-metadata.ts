/**
 * R184 Batch 1 — Document Metadata Schema
 *
 * Canonical metadata every Founder-generated document/asset MUST
 * carry. Unknown values are represented by the sentinel `TODO`
 * (never fabricated, never silently defaulted).
 *
 * FOUNDATION ONLY. No persistence, no handlers, no runtime.
 */

import type { DocumentCategory, DocumentFormat } from "./document-types";
import type { DocumentStatus } from "./document-status";

/**
 * Sentinel for unknown/pending values.
 * Producers must emit `TODO` rather than fabricating data.
 */
export const TODO = "TODO" as const;
export type Todo = typeof TODO;

/**
 * A value that is either known or explicitly marked unknown.
 */
export type Known<T> = T | Todo;

/**
 * Canonical origin describing how a document came into existence.
 * Reuse-only — must reference existing engines, never new ones.
 */
export type DocumentGeneratorSource =
  | "founder_manual"
  | "happy_creator"
  | "happy_brain"
  | "workspace_template"
  | "knowledge_import"
  | "publishing_pipeline";

/**
 * Reference to a location inside the canonical Workspace.
 * The workspace layer owns the actual storage; this is only a pointer.
 */
export interface WorkspaceLocationRef {
  readonly workspaceId: string;
  readonly folderPath: string;
  readonly assetId: Known<string>;
}

/**
 * Semantic version string (e.g. "1.0.0"). Versioning-only policy:
 * every regeneration produces a new version, never overwrites.
 */
export type DocumentVersion = string;

/**
 * Audit trail identifiers. `auditId` links to the canonical audit
 * log. `approvalId` references an R158 Founder approval record —
 * NEVER a new approval table.
 */
export interface DocumentAuditRefs {
  readonly auditId: Known<string>;
  readonly approvalId: Known<string>;
}

/**
 * Complete metadata envelope for any Founder-generated asset.
 * This shape is the canonical contract shared by Workspace, Creator,
 * Knowledge, Publishing, Search, and the Founder Dashboard.
 */
export interface DocumentMetadata {
  readonly id: string;
  readonly version: DocumentVersion;
  readonly owner: string;
  readonly createdBy: string;
  readonly template: Known<string>;
  readonly workspaceLocation: WorkspaceLocationRef;
  readonly knowledgeTags: readonly string[];
  readonly audit: DocumentAuditRefs;
  readonly generator: DocumentGeneratorSource;
  readonly source: Known<string>;
  readonly category: DocumentCategory;
  readonly format: DocumentFormat;
  readonly status: DocumentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly previousVersionId: Known<string>;
}

/**
 * Type guard: value is the TODO sentinel.
 */
export const isTodo = (value: unknown): value is Todo => value === TODO;

/**
 * Convenience helper for producers: return `TODO` when a value is
 * missing or explicitly unknown. Never coerce falsy values silently.
 */
export const knownOrTodo = <T>(value: T | null | undefined): Known<T> =>
  value === null || value === undefined ? TODO : value;
