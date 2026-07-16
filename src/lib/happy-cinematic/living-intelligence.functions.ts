import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { composeLiving } from "./living-intelligence";

export const composeLivingState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Parameters<typeof composeLiving>[0]) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return composeLiving(data);
  });
