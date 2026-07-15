/**
 * R13 — Universal App Builder Schema
 *
 * The AppTree is the full serialized form of an app project. It is persisted
 * inside `creator_projects.metadata.tree` with `kind='app'`. Every mutation
 * snapshots into `entity_versions` (entity_type='app_project') for history
 * and rollback.
 *
 * Any breaking change MUST bump APP_TREE_VERSION and provide a migration
 * in `migrateAppTree()` — the AI generator, editor UI, and any future
 * runtime renderer/build pipeline all rely on this shape.
 */
import { z } from "zod";

export const APP_TREE_VERSION = 1;

export const APP_KINDS = [
  "business", "ecommerce", "education", "healthcare", "restaurant",
  "corporate", "social", "marketplace", "utility", "productivity", "custom",
] as const;
export type AppKind = typeof APP_KINDS[number];

/** Only marked WORKING when a real generation + build pipeline exists.
 *  All other targets remain honestly PLANNED. */
export const BUILD_TARGETS = [
  "web", "pwa", "android", "android_tv", "wear_os",
  "ios", "ipados", "windows", "macos", "linux",
] as const;
export type BuildTarget = typeof BUILD_TARGETS[number];

export const COMPONENT_TYPES = [
  "button", "input", "textarea", "select", "checkbox", "switch",
  "card", "list", "list_item", "avatar", "badge", "chip",
  "nav_tabs", "nav_drawer", "app_bar", "bottom_nav",
  "dialog", "sheet", "toast", "form",
  "chart", "map", "camera", "location", "media", "image", "video",
  "text", "heading", "divider", "spacer", "columns", "row",
  "notification_center", "custom",
] as const;
export type ComponentType = typeof COMPONENT_TYPES[number];

export const SCREEN_ROLES = [
  "auth", "onboarding", "home", "list", "detail", "form",
  "settings", "profile", "checkout", "search", "custom",
] as const;
export type ScreenRole = typeof SCREEN_ROLES[number];

/* ------------------------------------------------------------------ */
/* Zod schema                                                          */
/* ------------------------------------------------------------------ */

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeSchema = z.object({
  mode: z.enum(["light", "dark", "auto", "corporate", "playful", "custom"]).default("light"),
  primary: HexColor.default("#0ea5e9"),
  secondary: HexColor.default("#64748b"),
  accent: HexColor.default("#f59e0b"),
  background: HexColor.default("#ffffff"),
  foreground: HexColor.default("#0f172a"),
  headingFont: z.string().min(1).max(64).default("Inter"),
  bodyFont: z.string().min(1).max(64).default("Inter"),
  radius: z.number().min(0).max(32).default(12),
});
export type Theme = z.infer<typeof themeSchema>;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type Component = {
  id: string;
  type: ComponentType;
  props?: { [k: string]: JsonValue };
  children?: Component[];
  /** Binds a component to an app state key (e.g. list.items <- state.orders) */
  bind?: { [k: string]: string };
  /** Action id to run on interaction (mapped in AppTree.actions) */
  action?: string;
};
export const componentSchema: z.ZodType<Component> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(64),
    type: z.enum(COMPONENT_TYPES),
    props: z.record(z.string(), z.any()).default({}),
    children: z.array(componentSchema).max(128).optional(),
    bind: z.record(z.string(), z.string()).optional(),
    action: z.string().max(64).optional(),
  }),
);

export const screenSchema = z.object({
  id: z.string().min(1).max(64),
  path: z.string().regex(/^\/[a-z0-9\-/:]*$/, "Path must start with '/' and be kebab-case"),
  title: z.string().min(1).max(200),
  role: z.enum(SCREEN_ROLES).default("custom"),
  requiresAuth: z.boolean().default(false),
  layout: z.enum(["stack", "tabs", "drawer", "grid"]).default("stack"),
  components: z.array(componentSchema).max(200).default([]),
  /** Screen-scoped state defaults (merged into AppTree.state at runtime) */
  state: z.record(z.string(), z.any()).default({}),
});
export type Screen = z.infer<typeof screenSchema>;

export const navItemSchema = z.object({
  label: z.string().min(1).max(64),
  screenId: z.string().min(1).max(64),
  icon: z.string().max(64).optional(),
});
export type NavItem = z.infer<typeof navItemSchema>;

export const navigationSchema = z.object({
  primary: z.enum(["bottom_tabs", "drawer", "top_tabs", "stack"]).default("bottom_tabs"),
  items: z.array(navItemSchema).max(12).default([]),
});
export type Navigation = z.infer<typeof navigationSchema>;

/** Declarative API integration — the runtime resolves these against Cloud. */
export const apiCallSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(["supabase.select", "supabase.insert", "supabase.update", "supabase.delete", "supabase.rpc", "http.get", "http.post"]),
  target: z.string().min(1).max(200),
  /** Column list / body template (may reference {{state.*}}) */
  input: z.record(z.string(), z.any()).default({}),
  /** State key to write the result into */
  writesTo: z.string().max(64).optional(),
});
export type ApiCall = z.infer<typeof apiCallSchema>;

export const actionSchema = z.object({
  id: z.string().min(1).max(64),
  /** Ordered list of steps: call an API, set state, navigate, notify. */
  steps: z.array(z.object({
    kind: z.enum(["call", "set", "navigate", "notify", "toast"]),
    ref: z.string().max(200).optional(),
    input: z.record(z.string(), z.any()).optional(),
  })).max(20),
});
export type Action = z.infer<typeof actionSchema>;

export const authSchema = z.object({
  enabled: z.boolean().default(true),
  providers: z.array(z.enum(["email", "google", "apple", "phone", "magic_link"])).default(["email"]),
  requiredForAllScreens: z.boolean().default(false),
});

export const dataModelSchema = z.object({
  /** Logical entity name -> Supabase table + column projection. Real tables
   *  are enforced at RLS layer; the builder never invents ad-hoc schemas. */
  entities: z.array(z.object({
    name: z.string().min(1).max(64),
    table: z.string().min(1).max(64),
    fields: z.array(z.string().min(1).max(64)).max(64),
  })).max(32).default([]),
});

export const buildConfigSchema = z.object({
  targets: z.array(z.enum(BUILD_TARGETS)).min(1).default(["web", "pwa"]),
  bundleId: z.string().max(128).optional(),
  version: z.string().max(32).default("0.1.0"),
  minSdk: z.number().int().min(0).max(50).optional(),
});
export type BuildConfig = z.infer<typeof buildConfigSchema>;

export const appTreeSchema = z.object({
  version: z.literal(APP_TREE_VERSION),
  kind: z.enum(APP_KINDS),
  displayName: z.string().min(1).max(120),
  description: z.string().max(500).default(""),
  theme: themeSchema,
  auth: authSchema,
  dataModel: dataModelSchema,
  navigation: navigationSchema,
  screens: z.array(screenSchema).min(1).max(100),
  actions: z.array(actionSchema).max(200).default([]),
  apiCalls: z.array(apiCallSchema).max(200).default([]),
  assets: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    kind: z.enum(["image", "icon", "font", "video", "audio", "other"]),
  })).max(500).default([]),
  build: buildConfigSchema,
});
export type AppTree = z.infer<typeof appTreeSchema>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function emptyAppTree(kind: AppKind, name: string): AppTree {
  return {
    version: APP_TREE_VERSION,
    kind,
    displayName: name,
    description: "",
    theme: themeSchema.parse({}),
    auth: authSchema.parse({}),
    dataModel: dataModelSchema.parse({}),
    navigation: {
      primary: "bottom_tabs",
      items: [{ label: "Home", screenId: "home" }],
    },
    screens: [{
      id: "home",
      path: "/",
      title: name,
      role: "home",
      requiresAuth: false,
      layout: "stack",
      components: [
        { id: "welcome", type: "heading", props: { text: `Welcome to ${name}` } },
      ],
      state: {},
    }],
    actions: [],
    apiCalls: [],
    assets: [],
    build: buildConfigSchema.parse({}),
  };
}

export function migrateAppTree(raw: unknown): AppTree {
  const parsed = appTreeSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const anyRaw = (raw ?? {}) as Record<string, unknown>;
  const coerced = {
    version: APP_TREE_VERSION,
    kind: (anyRaw.kind as AppKind) ?? "custom",
    displayName: (anyRaw.displayName as string) ?? "Untitled App",
    description: (anyRaw.description as string) ?? "",
    theme: (anyRaw.theme as object) ?? {},
    auth: (anyRaw.auth as object) ?? {},
    dataModel: (anyRaw.dataModel as object) ?? { entities: [] },
    navigation: (anyRaw.navigation as object) ?? { primary: "bottom_tabs", items: [] },
    screens: (anyRaw.screens as unknown[]) ?? [
      { id: "home", path: "/", title: "Home", role: "home", requiresAuth: false, layout: "stack", components: [], state: {} },
    ],
    actions: (anyRaw.actions as unknown[]) ?? [],
    apiCalls: (anyRaw.apiCalls as unknown[]) ?? [],
    assets: (anyRaw.assets as unknown[]) ?? [],
    build: (anyRaw.build as object) ?? {},
  };
  return appTreeSchema.parse(coerced);
}

/** Which targets we can actually generate a real build for.
 *  Everything else is honestly reported as PLANNED. */
export const SUPPORTED_BUILD_TARGETS: BuildTarget[] = ["web", "pwa"];
export function isBuildable(target: BuildTarget): boolean {
  return SUPPORTED_BUILD_TARGETS.includes(target);
}
