/**
 * HAPPY X — User / Profile Service
 */
import { defineService, type ServiceContext } from "../core";

export const userService = defineService({ name: "user", version: "v1" }, () => ({
  async me(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase
      .from("profiles").select("*").eq("id", ctx.userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async preferences(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase
      .from("user_preferences").select("*").eq("user_id", ctx.userId).maybeSingle();
    if (error) throw error;
    return data;
  },
}));
