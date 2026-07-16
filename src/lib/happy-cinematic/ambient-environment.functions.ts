import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import type { QualityTier } from "./contracts";

export const getAmbientPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    qualityTier: QualityTier;
    reducedMotion?: boolean;
    paletteHint?: { r: number; g: number; b: number };
  }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const heavy = !data.reducedMotion && (data.qualityTier === "ultra" || data.qualityTier === "high");
    return {
      roomLight: { intensity: heavy ? 0.9 : 0.6, sample: data.paletteHint ?? { r: 220, g: 220, b: 235 } },
      characterLight: { rim: heavy ? 0.55 : 0.3, key: 0.8 },
      shadow: { enabled: true, softness: heavy ? 0.8 : 0.5 },
      floorReflection: heavy,
      lightBounce: heavy,
    };
  });
