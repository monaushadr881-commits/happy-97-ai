/**
 * R184 Batch 1 — Founder Document & Publishing Studio
 * Canonical document format + category type definitions.
 *
 * FOUNDATION ONLY. No runtime. No handlers. No generation.
 * Reuse-only architecture: any producer of documents must map to
 * these canonical identifiers instead of inventing new ones.
 */

/**
 * Canonical file formats HAPPY may generate on behalf of the Founder.
 * Extending this list requires Founder approval (R158) and a template
 * registry entry.
 */
export const DOCUMENT_FORMATS = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "txt",
  "csv",
  "json",
  "xml",
  "yaml",
  "rtf",
  "markdown",
] as const;

export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number];

/**
 * Canonical document domains. Every generated file must declare
 * exactly one category so it can be routed to the correct workspace,
 * knowledge tag, and approval channel.
 */
export const DOCUMENT_CATEGORIES = [
  "business",
  "legal",
  "marketing",
  "publishing",
  "finance",
  "hr",
  "operations",
  "government",
  "founder",
  "creator",
  "website",
  "store",
  "reports",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/**
 * MIME hint per canonical format. Consumers (Creator, File Engine,
 * Publishing) must use these values instead of hardcoding strings.
 */
export const DOCUMENT_FORMAT_MIME: Readonly<Record<DocumentFormat, string>> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  xml: "application/xml",
  yaml: "application/yaml",
  rtf: "application/rtf",
  markdown: "text/markdown",
};

/**
 * Canonical file extension per format (no leading dot).
 */
export const DOCUMENT_FORMAT_EXTENSION: Readonly<Record<DocumentFormat, string>> = {
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  pptx: "pptx",
  txt: "txt",
  csv: "csv",
  json: "json",
  xml: "xml",
  yaml: "yaml",
  rtf: "rtf",
  markdown: "md",
};

export const isDocumentFormat = (value: unknown): value is DocumentFormat =>
  typeof value === "string" && (DOCUMENT_FORMATS as readonly string[]).includes(value);

export const isDocumentCategory = (value: unknown): value is DocumentCategory =>
  typeof value === "string" && (DOCUMENT_CATEGORIES as readonly string[]).includes(value);
