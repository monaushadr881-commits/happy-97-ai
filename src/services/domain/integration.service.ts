/**
 * HAPPY X — Integration Service
 */
import { defineService, type ServiceContext } from "../core";

export const integrationService = defineService({ name: "integration", version: "v1" }, () => ({
  async list(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("integrations").select("*");
    if (error) throw error;
    return data ?? [];
  },
  async webhooks(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("webhooks").select("*");
    if (error) throw error;
    return data ?? [];
  },
}));
