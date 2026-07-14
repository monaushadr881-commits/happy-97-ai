/**
 * HAPPY X — Feature Flag Service
 */
import { defineService, validate, z, type ServiceContext } from "../core";

export const featureFlagService = defineService({ name: "feature-flag", version: "v1" }, () => ({
  async list(ctx: ServiceContext) {
    const { data, error } = await ctx.supabase.from("feature_flags").select("*");
    if (error) throw error;
    return data ?? [];
  },
  async isEnabled(ctx: ServiceContext, key: string) {
    const k = validate(z.string().min(1).max(120), key);
    return ctx.cache.wrap(`ff:${k}`, 15_000, async () => {
      const { data, error } = await ctx.supabase
        .from("feature_flags").select("enabled").eq("key", k).maybeSingle();
      if (error) throw error;
      return Boolean((data as { enabled?: boolean } | null)?.enabled);
    });
  },
}));
