import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import type { QualityTier } from "./contracts";

export const getLightingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { qualityTier: QualityTier; reducedMotion?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const q = data.qualityTier;
    return {
      ambient: 0.7,
      key: q === "ultra" ? 0.9 : 0.75,
      rim: q === "ultra" ? 0.6 : q === "high" ? 0.45 : 0.3,
      contactShadow: true,
      bloom: q === "ultra" || q === "high",
    };
  });
