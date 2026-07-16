import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import type { QualityTier } from "./contracts";

const CAPS: Record<QualityTier, number> = {
  ultra: 512, high: 256, medium: 96, low: 0, auto: 256,
};

export const getParticlePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { qualityTier: QualityTier; reducedMotion?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    if (data.reducedMotion) return { cap: 0, palette: [], emitters: [] as string[] };
    return {
      cap: CAPS[data.qualityTier],
      palette: ["dust", "gold", "blue", "firefly"] as const,
      emitters: ["ambient", "footstep", "arrival", "exit"],
    };
  });
