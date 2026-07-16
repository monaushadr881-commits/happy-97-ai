import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { repositionForComfort, type ComfortInput } from "./comfort-engine";

export const planComfort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ComfortInput) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return repositionForComfort(data);
  });
