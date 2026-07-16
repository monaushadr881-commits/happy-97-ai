import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { greet, type UserKind } from "./relationship-greeting";

export const composeGreeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    hour: number;
    kind: UserKind;
    returning: boolean;
    lastArea?: string;
    pendingApprovals?: number;
    incompleteDeployments?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    return greet(data);
  });
