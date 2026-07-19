/**
 * R184 Batch 1 — Publishing Catalog (Definitions Only)
 *
 * Canonical catalog of store submission asset types. This file defines
 * WHAT the Founder can request for store publishing; it does not
 * generate, submit, or transmit anything. Actual store submission is
 * BLOCKED external work per the Core Vision Lock (native store
 * credentials remain external).
 */

import type { DocumentFormat } from "./document-types";

/**
 * Canonical store targets supported by the Publishing catalog.
 */
export const STORE_TARGETS = ["google_play", "apple_app_store"] as const;
export type StoreTarget = (typeof STORE_TARGETS)[number];

/**
 * Canonical publishing asset kinds. Materials only — never credentials,
 * never live submission payloads.
 */
export const PUBLISHING_ASSET_KINDS = [
  "metadata",
  "release_notes",
  "privacy_policy",
  "data_safety",
  "review_notes",
  "screenshots",
  "assets",
] as const;
export type PublishingAssetKind = (typeof PUBLISHING_ASSET_KINDS)[number];

/**
 * A single publishable asset definition scoped to a store target.
 * Purely declarative — later batches attach composers.
 */
export interface PublishingAssetDefinition {
  readonly kind: PublishingAssetKind;
  readonly title: string;
  readonly description: string;
  readonly formats: readonly DocumentFormat[];
  readonly requiresFounderApproval: true;
}

/**
 * The full publishing catalog per store. Store submission itself is
 * NOT part of this system — only the materials the Founder needs.
 */
export const PUBLISHING_CATALOG: Readonly<
  Record<StoreTarget, Readonly<Record<PublishingAssetKind, PublishingAssetDefinition>>>
> = {
  google_play: {
    metadata: {
      kind: "metadata",
      title: "Google Play — Store Listing Metadata",
      description: "Title, short/long description, category, contact info.",
      formats: ["json", "yaml", "markdown"],
      requiresFounderApproval: true,
    },
    release_notes: {
      kind: "release_notes",
      title: "Google Play — Release Notes",
      description: "Per-release changelog copy for the Play listing.",
      formats: ["markdown", "txt"],
      requiresFounderApproval: true,
    },
    privacy_policy: {
      kind: "privacy_policy",
      title: "Google Play — Privacy Policy",
      description: "Public privacy policy document referenced by the listing.",
      formats: ["pdf", "markdown", "docx"],
      requiresFounderApproval: true,
    },
    data_safety: {
      kind: "data_safety",
      title: "Google Play — Data Safety Form",
      description: "Structured data safety disclosures.",
      formats: ["json", "yaml"],
      requiresFounderApproval: true,
    },
    review_notes: {
      kind: "review_notes",
      title: "Google Play — Reviewer Notes",
      description: "Notes for the Play review team (credentials excluded).",
      formats: ["markdown", "txt"],
      requiresFounderApproval: true,
    },
    screenshots: {
      kind: "screenshots",
      title: "Google Play — Screenshot Set",
      description: "Screenshot manifest and captions (binaries stored in Workspace).",
      formats: ["json", "yaml"],
      requiresFounderApproval: true,
    },
    assets: {
      kind: "assets",
      title: "Google Play — Store Assets",
      description: "Icon, feature graphic, promo assets manifest.",
      formats: ["json", "yaml"],
      requiresFounderApproval: true,
    },
  },
  apple_app_store: {
    metadata: {
      kind: "metadata",
      title: "Apple App Store — Store Listing Metadata",
      description: "Name, subtitle, description, keywords, categories.",
      formats: ["json", "yaml", "markdown"],
      requiresFounderApproval: true,
    },
    release_notes: {
      kind: "release_notes",
      title: "Apple App Store — What's New",
      description: "Per-version what's new copy.",
      formats: ["markdown", "txt"],
      requiresFounderApproval: true,
    },
    privacy_policy: {
      kind: "privacy_policy",
      title: "Apple App Store — Privacy Policy",
      description: "Public privacy policy referenced by the listing.",
      formats: ["pdf", "markdown", "docx"],
      requiresFounderApproval: true,
    },
    data_safety: {
      kind: "data_safety",
      title: "Apple App Store — App Privacy Nutrition Labels",
      description: "Structured privacy label disclosures.",
      formats: ["json", "yaml"],
      requiresFounderApproval: true,
    },
    review_notes: {
      kind: "review_notes",
      title: "Apple App Store — Review Notes",
      description: "Notes for App Review (demo instructions, no credentials).",
      formats: ["markdown", "txt"],
      requiresFounderApproval: true,
    },
    screenshots: {
      kind: "screenshots",
      title: "Apple App Store — Screenshot Set",
      description: "Screenshot manifest per device class.",
      formats: ["json", "yaml"],
      requiresFounderApproval: true,
    },
    assets: {
      kind: "assets",
      title: "Apple App Store — Store Assets",
      description: "App icon, marketing assets manifest.",
      formats: ["json", "yaml"],
      requiresFounderApproval: true,
    },
  },
};

export const listPublishingAssets = (
  target: StoreTarget,
): readonly PublishingAssetDefinition[] =>
  Object.values(PUBLISHING_CATALOG[target]);

export const getPublishingAsset = (
  target: StoreTarget,
  kind: PublishingAssetKind,
): PublishingAssetDefinition | undefined => PUBLISHING_CATALOG[target]?.[kind];

export const isStoreTarget = (value: unknown): value is StoreTarget =>
  typeof value === "string" && (STORE_TARGETS as readonly string[]).includes(value);

export const isPublishingAssetKind = (value: unknown): value is PublishingAssetKind =>
  typeof value === "string" &&
  (PUBLISHING_ASSET_KINDS as readonly string[]).includes(value);
