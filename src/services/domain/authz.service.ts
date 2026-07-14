/**
 * HAPPY X — Authorization Service
 * Wraps SECURITY DEFINER RPCs. Cached per-request via ctx.cache.
 */
import { defineService, type ServiceContext } from "../core";
import type { ScopeType, PermissionCode } from "@/enterprise/types";

export const authzService = defineService({ name: "authz", version: "v1" }, () => ({
  async hasPermission(
    ctx: ServiceContext,
    code: PermissionCode | string,
    scope: ScopeType = "platform",
    scopeId: string | null = null,
  ) {
    const key = `perm:${ctx.userId}:${code}:${scope}:${scopeId ?? ""}`;
    return ctx.cache.wrap(key, 30_000, async () => {
      const { data, error } = await ctx.supabase.rpc("user_has_permission", {
        _user_id: ctx.userId, _permission_code: code, _scope_type: scope, _scope_id: scopeId,
      } as never);
      if (error) throw error;
      return Boolean(data);
    });
  },
  async isCompanyAdmin(ctx: ServiceContext, companyId: string) {
    const { data, error } = await ctx.supabase.rpc("is_company_admin", {
      _user_id: ctx.userId, _company_id: companyId,
    } as never);
    if (error) throw error;
    return Boolean(data);
  },
  async isCompanyMember(ctx: ServiceContext, companyId: string) {
    const { data, error } = await ctx.supabase.rpc("is_company_member", {
      _user_id: ctx.userId, _company_id: companyId,
    } as never);
    if (error) throw error;
    return Boolean(data);
  },
}));
