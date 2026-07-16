import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { resolveZone } from "./presence-zones";

export const getPresenceZone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { route: string }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return { route: data.route, zone: resolveZone(data.route) };
  });
