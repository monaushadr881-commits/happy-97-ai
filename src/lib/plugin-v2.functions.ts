/**
 * ⚠️ R145 CONSOLIDATION MARKER — class: SHIM
 * Canonical owner: src/lib/happy-r121/builder-intelligence.ts
 * All future work MUST extend the canonical owner, not this file.
 * This file's exports are preserved for backward compatibility only.
 * @deprecated Extend the canonical owner listed above.
 */
/**
 * HAPPY X — Plugin Ecosystem API v2 (Reserved Server Functions)
 *
 * Phase 2.5 of the v2.0 roadmap. All handlers are authenticated and delegate
 * to the reserved `pluginService` in the roadmap service layer. Contracts are
 * stable — the UI can wire against these today; internals fill in as the
 * plugin runtime ships.
 *
 * Do NOT add business logic here. Do NOT modify v1 APIs.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { pluginService } from "@/services/domain/roadmap.service";

type AuthCtx = {
  supabase: Parameters<typeof makeServiceContext>[0]["supabase"];
  userId: string;
  claims?: Record<string, unknown>;
};

const svc = (ctx: AuthCtx) =>
  makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });

const guard = <T>(fn: () => Promise<T>) =>
  fn().catch((e) => {
    throw toAppError(e);
  });

// -------- Registry & Marketplace --------
export const apiListPluginRegistry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => pluginService.listRegistry(svc(context))));

export const apiSearchPluginStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { query?: string; category?: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiSearchPluginStore", source: "api", module: "plugin.apiSearchPluginStore" });
    return guard(() => pluginService.searchStore(svc(context), data));
  });export const apiGetPluginDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context }) => guard(() => pluginService.getDetail(svc(context), data)));

// -------- Installation & Lifecycle --------
export const apiInstallPlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string; version?: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiInstallPlugin", source: "api", module: "plugin.apiInstallPlugin" });
    return guard(() => pluginService.install(svc(context), data));
  });export const apiUninstallPlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiUninstallPlugin", source: "api", module: "plugin.apiUninstallPlugin" });
    return guard(() => pluginService.uninstall(svc(context), data));
  });
export const apiListInstalledPlugins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => pluginService.listInstalled(svc(context))));

export const apiCheckPluginUpdates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => pluginService.checkUpdates(svc(context))));

export const apiUpdatePlugin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string; toVersion?: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiUpdatePlugin", source: "api", module: "plugin.apiUpdatePlugin" });
    return guard(() => pluginService.update(svc(context), data));
  });
// -------- Permissions --------
export const apiGetPluginPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context }) => guard(() => pluginService.getPermissions(svc(context), data)));

export const apiGrantPluginPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string; permissions: string[] })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiGrantPluginPermissions", source: "api", module: "plugin.apiGrantPluginPermissions" });
    return guard(() => pluginService.grantPermissions(svc(context), data));
  });export const apiRevokePluginPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string; permissions: string[] })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiRevokePluginPermissions", source: "api", module: "plugin.apiRevokePluginPermissions" });
    return guard(() => pluginService.revokePermissions(svc(context), data));
  });
// -------- Analytics & Settings --------
export const apiPluginAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => pluginService.analytics(svc(context))));

export const apiGetPluginSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiGetPluginSettings", source: "api", module: "plugin.apiGetPluginSettings" });
    return guard(() => pluginService.getSettings(svc(context), data));
  });export const apiUpdatePluginSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { pluginId: string; settings: Record<string, unknown> })
  .handler(async ({ data, context  }) => {
    /* r183-gate */ await (await import("@/lib/founder/enforce")).withBrain({ supabase: (context as any).supabase, userId: (context as any).userId, companyId: (context as any).companyId ?? null }, { input: "apiUpdatePluginSettings", source: "api", module: "plugin.apiUpdatePluginSettings" });
    return guard(() => pluginService.updateSettings(svc(context), data));
  });