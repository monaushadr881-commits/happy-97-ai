/**
 * R184 Batch 1 — Template Registry (Definitions Only)
 *
 * Canonical registry of document/asset templates HAPPY may compose
 * on the Founder's behalf. FOUNDATION ONLY:
 *   - No template files.
 *   - No generation code.
 *   - No runtime.
 *
 * Later batches attach composers/handlers keyed by `TemplateId`.
 * Reuse-only: any new document type must land here first.
 */

import type { DocumentCategory, DocumentFormat } from "./document-types";

/**
 * Stable identifier for a template. Namespaced by category to avoid
 * collisions across domains (e.g. "legal.nda.mutual.v1").
 */
export type TemplateId = string;

/**
 * A field the template needs the Founder (or Brain) to provide.
 * Unknown values must become `TODO` per the metadata contract.
 */
export interface TemplateField {
  readonly key: string;
  readonly label: string;
  readonly required: boolean;
  readonly description?: string;
}

/**
 * A canonical template definition. Purely declarative.
 */
export interface TemplateDefinition {
  readonly id: TemplateId;
  readonly category: DocumentCategory;
  readonly title: string;
  readonly description: string;
  readonly formats: readonly DocumentFormat[];
  readonly fields: readonly TemplateField[];
  /**
   * Whether Founder approval is REQUIRED before generating the final
   * asset. Approval always flows through R158 — never a new system.
   */
  readonly requiresFounderApproval: boolean;
}

/**
 * Canonical template catalog. Kept intentionally small in Batch 1 —
 * one representative template per category — so later batches extend
 * this registry rather than create parallel ones.
 */
export const TEMPLATE_REGISTRY: Readonly<Record<TemplateId, TemplateDefinition>> = {
  "business.one_pager.v1": {
    id: "business.one_pager.v1",
    category: "business",
    title: "Business One-Pager",
    description: "Executive summary of a business, product, or initiative.",
    formats: ["pdf", "docx", "markdown"],
    fields: [
      { key: "company_name", label: "Company Name", required: true },
      { key: "tagline", label: "Tagline", required: false },
      { key: "problem", label: "Problem", required: true },
      { key: "solution", label: "Solution", required: true },
    ],
    requiresFounderApproval: true,
  },
  "legal.nda.mutual.v1": {
    id: "legal.nda.mutual.v1",
    category: "legal",
    title: "Mutual Non-Disclosure Agreement",
    description: "Two-party mutual NDA. Founder approval mandatory.",
    formats: ["pdf", "docx"],
    fields: [
      { key: "party_a", label: "Party A", required: true },
      { key: "party_b", label: "Party B", required: true },
      { key: "effective_date", label: "Effective Date", required: true },
      { key: "governing_law", label: "Governing Law", required: true },
    ],
    requiresFounderApproval: true,
  },
  "marketing.launch_email.v1": {
    id: "marketing.launch_email.v1",
    category: "marketing",
    title: "Launch Announcement Email",
    description: "Email announcing a product or feature launch.",
    formats: ["markdown", "txt", "rtf"],
    fields: [
      { key: "subject", label: "Subject", required: true },
      { key: "audience", label: "Audience", required: true },
      { key: "call_to_action", label: "Call To Action", required: true },
    ],
    requiresFounderApproval: true,
  },
  "publishing.press_release.v1": {
    id: "publishing.press_release.v1",
    category: "publishing",
    title: "Press Release",
    description: "Standard press release for external distribution.",
    formats: ["pdf", "docx", "markdown"],
    fields: [
      { key: "headline", label: "Headline", required: true },
      { key: "dateline", label: "Dateline", required: true },
      { key: "body", label: "Body", required: true },
    ],
    requiresFounderApproval: true,
  },
  "finance.invoice.v1": {
    id: "finance.invoice.v1",
    category: "finance",
    title: "Invoice",
    description: "Standard customer invoice.",
    formats: ["pdf", "xlsx"],
    fields: [
      { key: "customer", label: "Customer", required: true },
      { key: "line_items", label: "Line Items", required: true },
      { key: "due_date", label: "Due Date", required: true },
    ],
    requiresFounderApproval: true,
  },
  "hr.offer_letter.v1": {
    id: "hr.offer_letter.v1",
    category: "hr",
    title: "Offer Letter",
    description: "Employment offer letter.",
    formats: ["pdf", "docx"],
    fields: [
      { key: "candidate_name", label: "Candidate Name", required: true },
      { key: "role", label: "Role", required: true },
      { key: "compensation", label: "Compensation", required: true },
      { key: "start_date", label: "Start Date", required: true },
    ],
    requiresFounderApproval: true,
  },
  "operations.runbook.v1": {
    id: "operations.runbook.v1",
    category: "operations",
    title: "Operational Runbook",
    description: "Step-by-step runbook for an operational procedure.",
    formats: ["markdown", "pdf"],
    fields: [
      { key: "procedure_name", label: "Procedure Name", required: true },
      { key: "owner", label: "Owner", required: true },
    ],
    requiresFounderApproval: false,
  },
  "government.compliance_summary.v1": {
    id: "government.compliance_summary.v1",
    category: "government",
    title: "Compliance Summary",
    description: "Summary of regulatory compliance posture.",
    formats: ["pdf", "docx"],
    fields: [
      { key: "jurisdiction", label: "Jurisdiction", required: true },
      { key: "framework", label: "Framework", required: true },
    ],
    requiresFounderApproval: true,
  },
  "founder.memo.v1": {
    id: "founder.memo.v1",
    category: "founder",
    title: "Founder Memo",
    description: "Internal memo authored on behalf of the Founder.",
    formats: ["markdown", "pdf", "docx"],
    fields: [
      { key: "subject", label: "Subject", required: true },
      { key: "audience", label: "Audience", required: true },
    ],
    requiresFounderApproval: true,
  },
  "creator.brand_brief.v1": {
    id: "creator.brand_brief.v1",
    category: "creator",
    title: "Brand Brief",
    description: "Creative brief for HAPPY Creator generations.",
    formats: ["markdown", "json"],
    fields: [
      { key: "brand", label: "Brand", required: true },
      { key: "tone", label: "Tone", required: true },
    ],
    requiresFounderApproval: false,
  },
  "website.landing_copy.v1": {
    id: "website.landing_copy.v1",
    category: "website",
    title: "Landing Page Copy",
    description: "Copy blocks for a marketing landing page.",
    formats: ["markdown", "json"],
    fields: [
      { key: "product", label: "Product", required: true },
      { key: "hero_headline", label: "Hero Headline", required: true },
    ],
    requiresFounderApproval: true,
  },
  "reports.weekly_status.v1": {
    id: "reports.weekly_status.v1",
    category: "reports",
    title: "Weekly Status Report",
    description: "Weekly status summary for stakeholders.",
    formats: ["pdf", "markdown", "docx"],
    fields: [
      { key: "week_ending", label: "Week Ending", required: true },
      { key: "highlights", label: "Highlights", required: true },
    ],
    requiresFounderApproval: false,
  },
};

export const listTemplates = (): readonly TemplateDefinition[] =>
  Object.values(TEMPLATE_REGISTRY);

export const getTemplate = (id: TemplateId): TemplateDefinition | undefined =>
  TEMPLATE_REGISTRY[id];

export const listTemplatesByCategory = (
  category: DocumentCategory,
): readonly TemplateDefinition[] =>
  listTemplates().filter((t) => t.category === category);
