import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { detectConfusion, type UserSignal } from "./confusion";

export const analyzePresence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { now: number; signals: UserSignal[] }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return detectConfusion(data.now, data.signals);
  });
