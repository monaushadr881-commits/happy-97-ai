/**
 * HAPPY X — Localization Service
 */
import { defineService, type ServiceContext } from "../core";

export const localizationService = defineService({ name: "localization", version: "v1" }, () => ({
  async languages(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("languages").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
  async countries(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("countries").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
  async currencies(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("currencies").select("*").order("code");
    if (error) throw error;
    return data ?? [];
  },
}));
