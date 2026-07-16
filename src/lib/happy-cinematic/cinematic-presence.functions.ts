import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { detectQualityTier, planVfx } from "./quality";
import { planEntry, planExit } from "./choreography";

export const planCinematicPresence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    hardwareConcurrency?: number; deviceMemory?: number;
    isMobile?: boolean; reducedMotion?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const tier = detectQualityTier(data);
    const reduced = !!data.reducedMotion;
    return {
      qualityTier: tier,
      reducedMotion: reduced,
      vfx: planVfx(tier, reduced),
      entry: planEntry({ qualityTier: tier, reducedMotion: reduced }),
      exit: planExit(reduced),
    };
  });
