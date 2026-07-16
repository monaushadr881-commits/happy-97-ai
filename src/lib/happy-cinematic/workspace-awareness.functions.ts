import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { contextFor, summarizeRoute } from "./workspace-awareness";

export const getWorkspaceContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { route: string; builder?: string; project?: string; component?: string; hasErrors?: boolean; pendingDeployment?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const ctx = contextFor(data.route, data);
    return { context: ctx, area: summarizeRoute(data.route) };
  });
