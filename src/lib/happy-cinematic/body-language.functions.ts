import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { poseFor, type BodyPose } from "./micro-expression";

export const resolvePose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { mode: string; speaking: boolean; walking: boolean; working: boolean }) => d)
  .handler(async ({ data, context }): Promise<{ pose: BodyPose }> => {
    await requireCinematicUser(context as any);
    return { pose: poseFor(data) };
  });
