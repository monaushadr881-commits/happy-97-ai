/**
 * HAPPY X — Developer Platform v2 (Reserved). Phase 2.9.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { developerService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiDevListSdks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => developerService.listSdks(svc(context))));
export const apiDevListApis = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => developerService.listApis(svc(context))));
export const apiDevCreateApiKey = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { name: string; scopes?: string[] })
  .handler(async ({ data, context }) => guard(() => developerService.createApiKey(svc(context), data)));
export const apiDevRevokeApiKey = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { keyId: string })
  .handler(async ({ data, context }) => guard(() => developerService.revokeApiKey(svc(context), data)));
export const apiDevListWebhooks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => developerService.listWebhooks(svc(context))));
export const apiDevCreateWebhook = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => developerService.createWebhook(svc(context), data)));
export const apiDevDeleteWebhook = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { webhookId: string })
  .handler(async ({ data, context }) => guard(() => developerService.deleteWebhook(svc(context), data)));
export const apiDevOAuthClients = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => developerService.oauthClients(svc(context))));
export const apiDevUsage = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => developerService.usage(svc(context))));
export const apiDevSandbox = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => developerService.sandbox(svc(context), data)));
export const apiDevDocsIndex = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => developerService.docsIndex(svc(context))));
