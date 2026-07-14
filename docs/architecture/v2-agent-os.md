# HAPPY v2.0 · Phase 2.5 — Plugin Ecosystem

Status: **Scaffolded / Reserved**
Owner: v2.0 Agent OS track

## Purpose

Give HAPPY a controlled way to load first-party and partner extensions
without altering v1.0 architecture, services, database, or security.
Plugins extend capabilities of the single Digital Human HAPPY; they never
introduce separate AI identities.

## Surfaces

| Route | Purpose |
| ----- | ------- |
| `/plugins` | Overview KPIs and status |
| `/plugins/store` | Marketplace discovery, categories, search |
| `/plugins/installed` | Workspace-installed plugin inventory & lifecycle |
| `/plugins/settings` | Default permissions, updates, analytics |

Every surface renders through the shared `_authenticated` layout, respects
RBAC, feature flags, and the existing design system.

## API contracts — `src/lib/plugin-v2.functions.ts`

All handlers use `requireSupabaseAuth` and delegate to `pluginService` in
`src/services/domain/roadmap.service.ts`.

Registry & marketplace
- `apiListPluginRegistry`
- `apiSearchPluginStore`
- `apiGetPluginDetail`

Lifecycle
- `apiInstallPlugin`
- `apiUninstallPlugin`
- `apiListInstalledPlugins`
- `apiCheckPluginUpdates`
- `apiUpdatePlugin`

Permissions (reuses existing RBAC)
- `apiGetPluginPermissions`
- `apiGrantPluginPermissions`
- `apiRevokePluginPermissions`

Analytics & settings
- `apiPluginAnalytics`
- `apiGetPluginSettings`
- `apiUpdatePluginSettings`

Signatures are stable. Implementation replaces service internals only.

## Security model

- All server functions run under `requireSupabaseAuth`.
- Permissions flow through the existing RBAC kernel (`src/kernel/permissions`).
- Plugin manifests will be validated server-side; no client-side execution
  of untrusted code.
- Founder-only publish and workspace-admin install gates are reserved via
  the settings surface.

## Non-goals for Phase 2.5

- No plugin execution runtime yet.
- No third-party code loaded in the browser bundle.
- No changes to v1 APIs, DB schema, or services.

## Handoff

When the plugin runtime ships, replace `pluginService` internals in
`roadmap.service.ts`, wire the routes to the live queries, and enable the
existing feature flag. UI, routes, permissions, and API surface remain
unchanged.
