/**
 * HAPPY X — API v1 (Server Functions)
 *
 * All server functions the UI can invoke. This is the ONLY layer client
 * code touches. Each function:
 *   - requires auth via requireSupabaseAuth,
 *   - builds a ServiceContext,
 *   - delegates to a domain service,
 *   - never accesses the database directly.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import {
  platformService, authzService, companyService, brandService,
  workspaceService, userService, settingsService, notificationService,
  auditService, conversationService, searchService, analyticsService,
  featureFlagService, localizationService, integrationService, jobsService,
} from "@/services";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({
  supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims,
});

const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

// ------------------------- Platform -------------------------
export const apiHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => platformService.health(svc(context))));

export const apiIsFounder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => platformService.isFounder(svc(context))));

// ------------------------- Authz -----------------------------
export const apiHasPermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { code: string; scope?: "platform" | "company" | "brand" | "workspace" | "department" | "team"; scopeId?: string | null })
  .handler(async ({ data, context }) =>
    guard(() => authzService.hasPermission(svc(context), data.code, data.scope, data.scopeId ?? null)));

// ------------------------- Companies -------------------------
export const apiListCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => companyService.list(svc(context))));

export const apiGetCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => guard(() => companyService.byId(svc(context), data.id)));

export const apiCreateCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => companyService.create(svc(context), data)));

// ------------------------- Brands / Workspaces ---------------
export const apiListBrands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { company_id: string })
  .handler(async ({ data, context }) => guard(() => brandService.listByCompany(svc(context), data.company_id)));

export const apiCreateBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => brandService.create(svc(context), data)));

export const apiListMyWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => workspaceService.listMine(svc(context))));

export const apiCreateWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => workspaceService.create(svc(context), data)));

// ------------------------- User ------------------------------
export const apiMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => userService.me(svc(context))));

// ------------------------- Settings --------------------------
export const apiUpsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => settingsService.upsert(svc(context), data)));

// ------------------------- Notifications ---------------------
export const apiMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => notificationService.listMine(svc(context))));

export const apiMarkNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => guard(() => notificationService.markRead(svc(context), data.id)));

// ------------------------- Audit -----------------------------
export const apiRecentAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i ?? {})
  .handler(async ({ data, context }) => guard(() => auditService.recent(svc(context), data)));

// ------------------------- Conversations ---------------------
export const apiListConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => conversationService.list(svc(context))));

export const apiConversationMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { conversationId: string })
  .handler(async ({ data, context }) => guard(() => conversationService.messages(svc(context), data.conversationId)));

export const apiSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => conversationService.send(svc(context), data)));

// ------------------------- Search ----------------------------
export const apiSearchKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => searchService.knowledge(svc(context), data)));

// ------------------------- Analytics -------------------------
export const apiPlatformOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => analyticsService.platformOverview(svc(context))));

// ------------------------- Feature Flags / L10N --------------
export const apiFeatureFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => featureFlagService.list(svc(context))));

export const apiLanguages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => localizationService.languages(svc(context))));

// ------------------------- Integrations / Jobs ---------------
export const apiListIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => integrationService.list(svc(context))));

export const apiEnqueueJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => jobsService.enqueue(svc(context), data)));
