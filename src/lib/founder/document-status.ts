/**
 * R184 Batch 1 — Document Status Model
 *
 * Canonical lifecycle for any Founder-requested document/asset.
 * The workflow is:
 *   draft → preview → waiting_approval → approved → generated → published
 * with `archived` and `rejected` as terminal branches.
 *
 * Reuse-only: no runtime, no state machine implementation here.
 * Consumers must map their internal status to these identifiers.
 */

export const DOCUMENT_STATUSES = [
  "draft",
  "preview",
  "waiting_approval",
  "approved",
  "generated",
  "published",
  "archived",
  "rejected",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/**
 * Terminal statuses — no further transitions allowed without a new
 * document version (versioning-only policy).
 */
export const TERMINAL_DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  "published",
  "archived",
  "rejected",
];

/**
 * Canonical allowed transitions. This is a declarative map only;
 * enforcement lives in a later batch (handler layer) and must reuse
 * R158 approval for `waiting_approval → approved`.
 */
export const DOCUMENT_STATUS_TRANSITIONS: Readonly<
  Record<DocumentStatus, readonly DocumentStatus[]>
> = {
  draft: ["preview", "archived", "rejected"],
  preview: ["waiting_approval", "draft", "archived", "rejected"],
  waiting_approval: ["approved", "rejected", "draft"],
  approved: ["generated", "archived"],
  generated: ["published", "archived"],
  published: ["archived"],
  archived: [],
  rejected: [],
};

export const isDocumentStatus = (value: unknown): value is DocumentStatus =>
  typeof value === "string" && (DOCUMENT_STATUSES as readonly string[]).includes(value);

export const isTerminalDocumentStatus = (status: DocumentStatus): boolean =>
  TERMINAL_DOCUMENT_STATUSES.includes(status);

export const canTransitionDocumentStatus = (
  from: DocumentStatus,
  to: DocumentStatus,
): boolean => DOCUMENT_STATUS_TRANSITIONS[from].includes(to);
