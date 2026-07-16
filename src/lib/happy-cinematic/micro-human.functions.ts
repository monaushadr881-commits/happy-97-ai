import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { sampleMicroHuman } from "./micro-human";

export const sampleMicroHumanState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tMs: number }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return sampleMicroHuman(data.tMs);
  });
