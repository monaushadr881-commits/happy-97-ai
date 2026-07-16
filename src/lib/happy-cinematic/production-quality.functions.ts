import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { shouldSimplify, type QualityFlags } from "./production-quality";

export const evaluateQuality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: QualityFlags) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return shouldSimplify(data);
  });
