import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { planVfx } from "./quality";
import type { QualityTier } from "./contracts";

export const getVfxPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { qualityTier: QualityTier; reducedMotion?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return planVfx(data.qualityTier, !!data.reducedMotion);
  });
