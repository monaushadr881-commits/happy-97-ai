/**
 * R12 — Website Builder Site Tree Schema
 *
 * A site tree is the full serialised form of a website project:
 * theme + seo + navigation + pages + sections. It is persisted inside
 * `creator_projects.metadata.tree`. Every mutation snapshots into
 * `entity_versions` for history + rollback.
 *
 * NOTE: Any breaking change must bump SITE_TREE_VERSION and provide a
 * migration in `migrateSiteTree()` — the AI generator, editor UI, and
 * renderer all rely on this shape.
 */
import { z } from "zod";

export const SITE_TREE_VERSION = 1;

export const PROJECT_KINDS = [
  "corporate", "business", "portfolio", "landing", "restaurant",
  "education", "healthcare", "ngo", "ecommerce", "blog", "custom",
] as const;
export type WebsiteProjectKind = typeof PROJECT_KINDS[number];

export const SECTION_TYPES = [
  "hero", "navbar", "footer", "features", "cards", "pricing",
  "gallery", "faq", "testimonials", "contact_form", "map", "video",
  "cta", "text", "image", "columns", "table", "chart", "custom",
] as const;
export type SectionType = typeof SECTION_TYPES[number];

/* ------------------------------------------------------------------ */
/* Zod schema — the single source of truth for validation             */
/* ------------------------------------------------------------------ */

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeSchema = z.object({
  mode: z.enum(["light", "dark", "aurora", "corporate", "luxury", "custom"]).default("light"),
  primary: HexColor.default("#0f172a"),
  secondary: HexColor.default("#64748b"),
  accent: HexColor.default("#f59e0b"),
  background: HexColor.default("#ffffff"),
  foreground: HexColor.default("#0f172a"),
  headingFont: z.string().min(1).max(64).default("Inter"),
  bodyFont: z.string().min(1).max(64).default("Inter"),
  radius: z.number().min(0).max(32).default(8),
});
export type Theme = z.infer<typeof themeSchema>;

export const seoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).default(""),
  ogImage: z.string().url().nullable().optional(),
  keywords: z.array(z.string().min(1).max(60)).max(20).default([]),
  canonical: z.string().url().nullable().optional(),
  twitterCard: z.enum(["summary", "summary_large_image"]).default("summary_large_image"),
});
export type Seo = z.infer<typeof seoSchema>;

// Sections are recursive (columns can contain sections).
export type Section = {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
  children?: Section[];
};
export const sectionSchema: z.ZodType<Section> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(64),
    type: z.enum(SECTION_TYPES),
    props: z.record(z.string(), z.unknown()).default({}),
    children: z.array(sectionSchema).max(64).optional(),
  }),
);

export const pageSchema = z.object({
  id: z.string().min(1).max(64),
  path: z.string().regex(/^\/[a-z0-9\-/]*$/, "Path must start with '/' and be kebab-case"),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  seo: seoSchema.partial().optional(),
  sections: z.array(sectionSchema).max(200).default([]),
});
export type Page = z.infer<typeof pageSchema>;

export const navItemSchema = z.object({
  label: z.string().min(1).max(64),
  href: z.string().min(1).max(200),
  external: z.boolean().optional(),
});
export type NavItem = z.infer<typeof navItemSchema>;

export const siteTreeSchema = z.object({
  version: z.literal(SITE_TREE_VERSION),
  theme: themeSchema,
  seo: seoSchema,
  navigation: z.array(navItemSchema).max(20).default([]),
  pages: z.array(pageSchema).min(1).max(50),
});
export type SiteTree = z.infer<typeof siteTreeSchema>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function emptySiteTree(name: string): SiteTree {
  return {
    version: SITE_TREE_VERSION,
    theme: themeSchema.parse({}),
    seo: seoSchema.parse({ title: name, description: "" }),
    navigation: [{ label: "Home", href: "/" }],
    pages: [{
      id: "home",
      path: "/",
      title: name,
      sections: [],
    }],
  };
}

/**
 * Best-effort migration for older site tree snapshots. Extend the switch
 * as SITE_TREE_VERSION advances.
 */
export function migrateSiteTree(raw: unknown): SiteTree {
  const parsed = siteTreeSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Attempt to coerce a minimal legacy shape.
  const anyRaw = (raw ?? {}) as Record<string, unknown>;
  const coerced = {
    version: SITE_TREE_VERSION,
    theme: (anyRaw.theme as object) ?? {},
    seo: (anyRaw.seo as object) ?? { title: "Untitled" },
    navigation: (anyRaw.navigation as unknown[]) ?? [],
    pages: (anyRaw.pages as unknown[]) ?? [
      { id: "home", path: "/", title: "Home", sections: [] },
    ],
  };
  return siteTreeSchema.parse(coerced);
}
