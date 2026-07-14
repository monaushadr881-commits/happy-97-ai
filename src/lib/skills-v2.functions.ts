/**
 * HAPPY X — AI Skills Marketplace v2 (Reserved).
 * Phase 2.14. Registry / store / installer / permissions / analytics / ratings.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { makeServiceContext } from "@/services/core/context";
import { toAppError } from "@/services/core/errors";
import { skillsService } from "@/services/domain/roadmap.service";

type AuthCtx = { supabase: Parameters<typeof makeServiceContext>[0]["supabase"]; userId: string; claims?: Record<string, unknown> };
const svc = (ctx: AuthCtx) => makeServiceContext({ supabase: ctx.supabase, userId: ctx.userId, claims: ctx.claims });
const guard = <T>(fn: () => Promise<T>) => fn().catch((e) => { throw toAppError(e); });

export const apiSkillsRegistry = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => skillsService.listRegistry(svc(context))));
export const apiSkillsStore = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { query?: string; category?: string })
  .handler(async ({ data, context }) => guard(() => skillsService.searchStore(svc(context), data)));
export const apiSkillsCategories = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => skillsService.listCategories(svc(context))));
export const apiSkillsDetail = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string })
  .handler(async ({ data, context }) => guard(() => skillsService.getDetail(svc(context), data)));
export const apiSkillsInstall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string; version?: string })
  .handler(async ({ data, context }) => guard(() => skillsService.install(svc(context), data)));
export const apiSkillsUninstall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string })
  .handler(async ({ data, context }) => guard(() => skillsService.uninstall(svc(context), data)));
export const apiSkillsInstalled = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => skillsService.listInstalled(svc(context))));
export const apiSkillsCheckUpdates = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => skillsService.checkUpdates(svc(context))));
export const apiSkillsUpdate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string; toVersion?: string })
  .handler(async ({ data, context }) => guard(() => skillsService.update(svc(context), data)));
export const apiSkillsPermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string })
  .handler(async ({ data, context }) => guard(() => skillsService.getPermissions(svc(context), data)));
export const apiSkillsGrantPermissions = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string; permissions: string[] })
  .handler(async ({ data, context }) => guard(() => skillsService.grantPermissions(svc(context), data)));
export const apiSkillsAnalytics = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => skillsService.analytics(svc(context))));
export const apiSkillsRate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string; rating: number; review?: string })
  .handler(async ({ data, context }) => guard(() => skillsService.rate(svc(context), data)));
export const apiSkillsRatings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string })
  .handler(async ({ data, context }) => guard(() => skillsService.listRatings(svc(context), data)));
export const apiSkillsVerify = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { skillId: string })
  .handler(async ({ data, context }) => guard(() => skillsService.verify(svc(context), data)));
export const apiSkillsSettings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => guard(() => skillsService.settings(svc(context))));
export const apiSkillsUpdateSettings = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i)
  .handler(async ({ data, context }) => guard(() => skillsService.updateSettings(svc(context), data)));
