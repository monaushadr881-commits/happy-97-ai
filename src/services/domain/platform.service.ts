/**
 * HAPPY X — Platform Service
 * Platform-wide operations (health, meta, founder ops).
 */
import { defineService, type ServiceContext } from "../core";

export const platformService = defineService({ name: "platform", version: "v1" }, () => ({
  async health(_ctx: ServiceContext) {
    return { ok: true, ts: new Date().toISOString() };
  },
  async isFounder(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.rpc("is_platform_founder", { _user_id: ctx.userId } as never);
    if (error) throw error;
    return Boolean(data);
  },
}));
