import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { frameBudgetMs, particleCap, type Tier } from "./performance-optimizer";

export const getPerformancePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tier: Tier }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return { frameBudgetMs: frameBudgetMs(data.tier), particleCap: particleCap(data.tier) };
  });
