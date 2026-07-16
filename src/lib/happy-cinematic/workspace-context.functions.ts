import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { normalizeWorkspace, type WorkspaceSnapshot } from "./workspace-context";

export const snapshotWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<WorkspaceSnapshot> & { route: string }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return normalizeWorkspace(data);
  });
