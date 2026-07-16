import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { pickSceneFromRoute, resolveCamera, type CameraScene } from "./camera";

export const planCamera = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { route?: string; scene?: CameraScene; reducedMotion?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const scene = data.scene ?? pickSceneFromRoute(data.route ?? "/");
    return { scene, preset: resolveCamera(scene, !!data.reducedMotion) };
  });
